"use client";

import { Button, Spinner } from "@heroui/react";
import {
  MessageCircle,
  BookOpen,
  Share2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

interface CharacterActionsProps {
  isOwner: boolean;
  onStartChat: () => void;
  onAddToLibrary: () => Promise<void> | void;
  onShare: () => Promise<void> | void;
  // 新增：公开/私密状态切换
  accessLevel?: "public" | "private";
  onToggleAccessLevel?: () => Promise<void> | void;
  isFromFavorite?: boolean;
  isTogglingAccess?: boolean; // 🔄 切换状态的 loading
  isAddingToLibrary?: boolean; // 🔄 添加到库的 loading
  isAlreadyInLibrary?: boolean; // ✅ 是否已添加
  processingStatus?: string | null; // 🎯 角色处理状态
}

export default function CharacterActions({
  isOwner,
  onStartChat,
  onAddToLibrary,
  onShare,
  accessLevel,
  onToggleAccessLevel,
  isFromFavorite = false,
  isTogglingAccess = false,
  isAddingToLibrary = false,
  isAlreadyInLibrary = false,
  processingStatus = null,
}: CharacterActionsProps) {
  // 🎯 只有报告完成时才能进行操作
  // processingStatus 现在是 is_report_ready 字段（boolean）
  const isReportsCompleted = processingStatus === true;
  const isReportsGenerating = processingStatus === false;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Button
        color="primary"
        startContent={<MessageCircle className="w-4 h-4" />}
        onPress={onStartChat}
        className="h-12 rounded-xl"
        isDisabled={!isReportsCompleted}
        title={!isReportsCompleted ? "请等待角色报告生成完成" : ""}
      >
        Chat
      </Button>
      {!isOwner && !isFromFavorite && (
        <Button
          color={isAlreadyInLibrary ? "success" : "secondary"}
          variant={isAlreadyInLibrary ? "flat" : "bordered"}
          isLoading={isAddingToLibrary}
          isDisabled={
            isAddingToLibrary || isAlreadyInLibrary || !isReportsCompleted
          }
          startContent={
            !isAddingToLibrary &&
            (isAlreadyInLibrary ? (
              <Check className="w-4 h-4" />
            ) : (
              <BookOpen className="w-4 h-4" />
            ))
          }
          onPress={onAddToLibrary}
          className={
            isAlreadyInLibrary
              ? "h-12 rounded-xl cursor-not-allowed opacity-70"
              : "h-12 rounded-xl border-secondary/20 hover:border-secondary/40"
          }
          title={!isReportsCompleted ? "请等待角色报告生成完成" : ""}
        >
          {isAddingToLibrary
            ? "添加中..."
            : isAlreadyInLibrary
            ? "已添加"
            : "Add to Library"}
        </Button>
      )}
      {isOwner && !isFromFavorite && onToggleAccessLevel && (
        <Button
          color={accessLevel === "public" ? "success" : "warning"}
          variant="bordered"
          isLoading={isTogglingAccess}
          isDisabled={isTogglingAccess || !isReportsCompleted}
          startContent={
            !isTogglingAccess &&
            (accessLevel === "public" ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            ))
          }
          onPress={onToggleAccessLevel}
          className="h-12 rounded-xl"
          title={!isReportsCompleted ? "请等待角色报告生成完成" : ""}
        >
          {isTogglingAccess
            ? "Updating..."
            : accessLevel === "public"
            ? "Public"
            : "Private"}
        </Button>
      )}
      <Button
        variant="bordered"
        startContent={<Share2 className="w-4 h-4" />}
        onPress={onShare}
        isDisabled={!isReportsCompleted}
        className="h-12 rounded-xl border-white/10 hover:border-white/20 text-white"
        title={!isReportsCompleted ? "请等待角色报告生成完成" : ""}
      >
        Share
      </Button>
    </div>
  );
}
