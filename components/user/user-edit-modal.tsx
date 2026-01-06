"use client";

import { FC, useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Avatar,
  Card,
  CardBody,
} from "@heroui/react";
import { Camera, Upload, User as UserIcon, Mail } from "lucide-react";
import { authOperations } from "@/lib/supabase/auth";
import { databaseOperations } from "@/lib/supabase/database";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { useTranslation } from "@/lib/utils/translations";
import type { User } from "@supabase/supabase-js";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdated?: (updatedUser: User) => void;
}

const UserEditModal: FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const supabase = createClient();
  const { t } = useTranslation();
  const [username, setUsername] = useState(
    user?.user_metadata?.username || user?.email?.split("@")[0] || ""
  );
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.user_metadata?.avatar_url || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当模态框打开或用户数据改变时，重置表单状态
  useEffect(() => {
    if (isOpen) {
      const initialAvatarUrl = user?.user_metadata?.avatar_url || "";
      logger.info(
        {
          module: "user-edit-modal",
          operation: "useEffect",
          data: {
            isOpen,
            userAvatarUrl: user?.user_metadata?.avatar_url,
            initialAvatarUrl,
          },
        },
        `模态框打开，初始化头像预览: ${initialAvatarUrl}`
      );

      setUsername(
        user?.user_metadata?.username || user?.email?.split("@")[0] || ""
      );
      setFullName(user?.user_metadata?.full_name || "");
      setAvatarFile(null);
      setAvatarPreview(initialAvatarUrl);
      setError(null);
    }
  }, [isOpen, user]);

  // 调试 avatarPreview 状态变化
  useEffect(() => {
    logger.info(
      {
        module: "user-edit-modal",
        operation: "avatarPreview-changed",
        data: { avatarPreview, avatarPreviewLength: avatarPreview?.length },
      },
      `头像预览状态更新: ${avatarPreview ? "有预览" : "无预览"}`
    );
  }, [avatarPreview]);

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    logger.info(
      { module: "user-edit-modal", operation: "handleAvatarSelect" },
      "开始处理头像选择"
    );

    const file = event.target.files?.[0];
    if (file) {
      logger.info(
        {
          module: "user-edit-modal",
          operation: "handleAvatarSelect",
          data: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          },
        },
        `选择的文件: ${file.name}, 大小: ${file.size} bytes, 类型: ${file.type}`
      );

      // 检查文件类型 - 仅允许 PNG
      if (file.type !== "image/png") {
        logger.error(
          { module: "user-edit-modal", operation: "handleAvatarSelect" },
          "文件类型不正确，仅允许 PNG"
        );
        setError(t("userEdit.errorNotPng"));
        return;
      }

      // 检查文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        logger.error(
          { module: "user-edit-modal", operation: "handleAvatarSelect" },
          "文件大小超过限制"
        );
        setError(t("userEdit.errorFileTooLarge"));
        return;
      }

      // 清除之前的错误
      setError(null);
      setAvatarFile(file);

      logger.info(
        { module: "user-edit-modal", operation: "handleAvatarSelect" },
        "开始读取文件生成预览"
      );

      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        logger.info(
          { module: "user-edit-modal", operation: "handleAvatarSelect" },
          "FileReader 读取完成"
        );

        if (e.target?.result) {
          const previewUrl = e.target.result as string;
          logger.success(
            {
              module: "user-edit-modal",
              operation: "handleAvatarSelect",
              data: { previewUrlLength: previewUrl.length },
            },
            `预览URL生成成功，长度: ${previewUrl.length}`
          );
          setAvatarPreview(previewUrl);
        } else {
          logger.error(
            { module: "user-edit-modal", operation: "handleAvatarSelect" },
            "FileReader 结果为空"
          );
        }
      };

      reader.onerror = (error) => {
        logger.error(
          { module: "user-edit-modal", operation: "handleAvatarSelect", error },
          "FileReader 读取失败"
        );
      };

      reader.readAsDataURL(file);
    } else {
      logger.warn(
        { module: "user-edit-modal", operation: "handleAvatarSelect" },
        "没有选择文件"
      );
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info(
        { module: "user-edit-modal", operation: "handleSave" },
        "开始保存用户资料"
      );

      // 获取当前用户的session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error(t("userEdit.errorSessionExpired"));
      }

      let avatarUrl = user?.user_metadata?.avatar_url || "";

      // 如果有新头像，先上传
      if (avatarFile) {
        logger.info(
          { module: "user-edit-modal", operation: "uploadAvatar" },
          "上传新头像"
        );

        const formData = new FormData();
        formData.append("file", avatarFile);

        const response = await fetch("/api/users/avatar", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || t("userEdit.errorAvatarUpload"));
        }

        // 获取响应内容（避免重复读取stream）
        const responseText = await response.text();
        let fileId;

        try {
          // 尝试解析JSON响应
          const responseData = JSON.parse(responseText);
          if (responseData.data) {
            fileId = responseData.data;
          } else {
            fileId = responseData;
          }
        } catch {
          // 如果不是JSON，则直接使用文本
          fileId = responseText;
        }

        // 构建头像URL，移除引号和其他格式化字符
        const cleanFileId = String(fileId).replace(/["{}\s]/g, "");

        // 获取文件扩展名 - 仅支持 PNG
        const fileExtension = "png";
        // 使用Supabase官方方法获取公共URL
        const fileName = `${user.id}_${cleanFileId}.${fileExtension}`;
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;

        logger.info(
          {
            module: "user-edit-modal",
            operation: "uploadAvatar",
            data: {
              fileId: cleanFileId,
              fileType: avatarFile.type,
              fileExtension,
              fileName,
              avatarUrl,
            },
          },
          `头像URL构造完成: ${avatarUrl}`
        );

        // 测试头像URL是否可访问
        try {
          const testResponse = await fetch(avatarUrl, { method: "HEAD" });
          if (testResponse.ok) {
            logger.success(
              { module: "user-edit-modal", operation: "uploadAvatar" },
              `头像URL可访问: ${avatarUrl}`
            );
          } else {
            logger.warn(
              {
                module: "user-edit-modal",
                operation: "uploadAvatar",
                data: { status: testResponse.status },
              },
              `头像URL不可访问: ${avatarUrl}`
            );
          }
        } catch (testError) {
          logger.error(
            {
              module: "user-edit-modal",
              operation: "uploadAvatar",
              error: testError,
            },
            `头像URL测试失败: ${avatarUrl}`
          );
        }

        logger.success(
          {
            module: "user-edit-modal",
            operation: "uploadAvatar",
            data: { fileId },
          },
          t("userEdit.avatarUploaded")
        );
      }

      // 更新用户资料
      const updateData = {
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
      };

      // 调用用户资料更新API
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("userEdit.errorProfileUpdate"));
      }

      // 强制刷新用户session以获取最新的user_metadata
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn("⚠️ Session refresh failed:", refreshError.message);
        }
      } catch (refreshErr) {
        console.warn("⚠️ Session refresh error:", refreshErr);
      }

      // 等待一段时间确保session刷新完成
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 获取更新后的用户信息
      const updatedUser = await authOperations.getCurrentUser();

      logger.info(
        {
          module: "user-edit-modal",
          operation: "handleSave",
          data: {
            updatedUserAvatarUrl: updatedUser?.user_metadata?.avatar_url,
            updatedUsername: updatedUser?.user_metadata?.username,
          },
        },
        "获取更新后的用户信息"
      );

      if (updatedUser && onUserUpdated) {
        onUserUpdated(updatedUser);
      }

      logger.success(
        { module: "user-edit-modal", operation: "handleSave" },
        t("userEdit.userProfileUpdated")
      );

      onClose();
    } catch (error: any) {
      logger.error(
        { module: "user-edit-modal", operation: "handleSave", error },
        "保存用户资料失败"
      );
      setError(error.message || t("userEdit.errorProfileUpdate"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 重置表单
    setUsername(
      user?.user_metadata?.username || user?.email?.split("@")[0] || ""
    );
    setFullName(user?.user_metadata?.full_name || "");
    setAvatarFile(null);
    setAvatarPreview(user?.user_metadata?.avatar_url || "");
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="2xl"
      placement="center"
      backdrop="blur"
      classNames={{
        base: "bg-content1 border border-white/10",
        header: "border-b border-white/10",
        body: "py-6",
        footer: "border-t border-white/10",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-primary" />
            <span className="text-xl font-title font-bold">
              {t("userEdit.editProfile")}
            </span>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {error && (
            <Card className="bg-danger/10 border border-danger/20">
              <CardBody className="py-3">
                <p className="text-danger text-sm">{error}</p>
              </CardBody>
            </Card>
          )}

          {/* 头像编辑区域 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {/* 尝试不同的Avatar配置 */}
              {avatarPreview ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white/10">
                  <img
                    src={avatarPreview}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      logger.success(
                        {
                          module: "user-edit-modal",
                          operation: "custom-avatar-loaded",
                        },
                        "自定义头像加载成功"
                      );
                    }}
                    onError={(e) => {
                      logger.error(
                        {
                          module: "user-edit-modal",
                          operation: "custom-avatar-error",
                          error: e,
                        },
                        "自定义头像加载失败"
                      );
                    }}
                  />
                </div>
              ) : (
                <Avatar
                  size="lg"
                  name={username}
                  className="w-24 h-24 text-xl border-4 border-white/10"
                  showFallback
                />
              )}
              <Button
                isIconOnly
                size="sm"
                color="primary"
                className="absolute -bottom-1 -right-1 w-8 h-8 min-w-0"
                onPress={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center">
              <p className="text-white/70 text-sm">
                {t("userEdit.clickCameraIcon")}
              </p>
              <p className="text-white/50 text-xs">
                {t("userEdit.supportedFormats")}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,.png"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>

          {/* 表单字段 */}
          <div className="space-y-4">
            <Input
              label={t("userEdit.username")}
              placeholder={t("userEdit.usernamePlaceholder")}
              value={username}
              onValueChange={setUsername}
              startContent={<UserIcon className="w-4 h-4 text-white/50" />}
              classNames={{
                input: "bg-transparent",
                inputWrapper:
                  "bg-content2 border-white/10 hover:border-white/20",
              }}
            />

            <Input
              label={t("userEdit.fullName")}
              placeholder={t("userEdit.fullNamePlaceholder")}
              value={fullName}
              onValueChange={setFullName}
              startContent={<UserIcon className="w-4 h-4 text-white/50" />}
              classNames={{
                input: "bg-transparent",
                inputWrapper:
                  "bg-content2 border-white/10 hover:border-white/20",
              }}
            />

            <Input
              label={t("userEdit.email")}
              value={user?.email || ""}
              isReadOnly
              startContent={<Mail className="w-4 h-4 text-white/50" />}
              classNames={{
                input: "bg-transparent text-white/50",
                inputWrapper: "bg-content2/50 border-white/5",
              }}
              description={t("userEdit.emailReadOnly")}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="bordered"
            onPress={handleCancel}
            disabled={loading}
            className="border-white/30 hover:border-white/50"
          >
            {t("userEdit.cancel")}
          </Button>

          <Button
            color="primary"
            onPress={handleSave}
            isLoading={loading}
            startContent={loading ? null : <Upload className="w-4 h-4" />}
          >
            {loading ? t("userEdit.saving") : t("userEdit.saveChanges")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserEditModal;
