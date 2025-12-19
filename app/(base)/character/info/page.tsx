"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCreateCharacterChatSession } from "@/hooks/use-session-mutations";
import {
  Card,
  CardBody,
  Avatar,
  Chip,
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Eye,
  EyeOff,
  Settings,
  BookOpen,
  Star,
  TrendingUp,
  Award,
  FileText,
  Heart,
  Clock,
  MessageCircle,
  Target,
  Sparkles,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import { authOperations } from "@/lib/supabase/auth";
import { databaseOperations as db } from "@/lib/supabase/database";
import { chatAPI } from "@/lib/api/client";
import { databaseOperations } from "@/lib/supabase/database";
import { logger } from "@/lib/utils/logger";
import { toast as sonnerToast } from "sonner";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/utils/translations";
import CharacterStoryCard from "@/components/chat/character-story-card";
import { createShare } from "@/lib/api/share";

import type { Tables } from "@/lib/supabase/types";

type CharacterData = Tables<"characters">;

export default function CharacterInfoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const characterId = searchParams.get("id");

  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null); // 作者信息
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>("basic");
  const [showChatLoadingModal, setShowChatLoadingModal] = useState(false);
  const [isTogglingAccess, setIsTogglingAccess] = useState(false); // 🔄 切换状态的 loading
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false); // 🔄 添加到库的 loading
  const [isAlreadyInLibrary, setIsAlreadyInLibrary] = useState(false); // ✅ 是否已添加
  const [showAddToLibraryModal, setShowAddToLibraryModal] = useState(false); // 🎯 显示添加到库的确认弹窗

  // 📤 分享功能状态
  const [isShareMode, setIsShareMode] = useState(false); // 是否处于分享模式
  const [selectedReports, setSelectedReports] = useState<string[]>([]); // 选中的报告
  const [selectedSoulSections, setSelectedSoulSections] = useState<string[]>([]); // 选中的灵魂档案模块
  const [isCreatingShare, setIsCreatingShare] = useState(false); // 正在创建分享

  // 🎭 使用 React Query mutation 创建角色对话 session
  const createCharacterChatSession = useCreateCharacterChatSession();

  useEffect(() => {
    if (characterId) {
      loadCharacterData(characterId);
    } else {
      setError("No character ID provided");
      setLoading(false);
    }
  }, [characterId]);

  // 🎯 监听 session 创建成功，跳转到聊天页面（带 just_created 参数）
  useEffect(() => {
    if (
      createCharacterChatSession.isSuccess &&
      createCharacterChatSession.data
    ) {
      // 🎭 带上 just_created 参数，让聊天页面显示打招呼语
      router.push(
        `/chat/${createCharacterChatSession.data.sessionId}?just_created=true`
      );
    }
  }, [
    createCharacterChatSession.isSuccess,
    createCharacterChatSession.data,
    router,
  ]);

  // 🔍 检查当前用户是否已经收藏过这个角色
  const checkIfInLibrary = async (characterId: string) => {
    try {
      const currentUser = await authOperations.getCurrentUser();
      if (!currentUser) return;

      // 查询当前用户是否有 original_source = characterId 的角色
      const { data, error } = await db.getUserCharacters(currentUser.id);
      if (error || !data) return;

      const alreadyFavorited = data.some(
        (char: any) => char.original_source === characterId
      );
      setIsAlreadyInLibrary(alreadyFavorited);
    } catch (error) {
      console.error("Failed to check library status:", error);
    }
  };

  const loadCharacterData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // 🔒 Auth Check
      const currentUser = await authOperations.getCurrentUser().catch(() => null);
      if (!currentUser) {
        logger.warn(
          { module: "character-info", operation: "checkAuth" },
          "User not logged in, redirecting"
        );
        const event = new Event("openLoginModal");
        document.dispatchEvent(event);
        router.push("/");
        return;
      }

      logger.info(
        {
          module: "character-info",
          operation: "loadCharacterData",
          data: { characterId: id },
        },
        "Loading character data"
      );

      const { data: characterData, error: characterError } =
        await databaseOperations.getCharacterById(id);

      if (characterError) {
        logger.error(
          {
            module: "character-info",
            operation: "loadCharacterData",
            error: characterError,
          },
          "Failed to load character data"
        );
        setError(`Failed to load character: ${characterError.message}`);
        return;
      }

      if (!characterData) {
        logger.warn(
          {
            module: "character-info",
            operation: "loadCharacterData",
            data: { characterId: id },
          },
          "Character not found"
        );
        setError("Character not found");
        return;
      }

      setCharacter(characterData);

      // determine ownership
      const isCharacterOwner =
        !!currentUser &&
        !!characterData.auth_id &&
        currentUser.id === characterData.auth_id;
      setIsOwner(isCharacterOwner);

      // 🔍 获取作者信息
      // 如果是收藏的角色，需要获取原作者的信息
      const authorIdToFetch = characterData.original_source
        ? characterData.original_source // 收藏的角色，查找原角色的作者
        : characterData.auth_id; // 普通角色，直接用当前角色的作者ID

      if (authorIdToFetch) {
        try {
          // 如果是收藏的角色，先获取原角色的数据以获得原作者ID
          let finalAuthorId = characterData.auth_id;

          if (characterData.original_source) {
            const { data: originalCharacter } = await db.getCharacterById(
              characterData.original_source
            );
            if (originalCharacter && originalCharacter.auth_id) {
              finalAuthorId = originalCharacter.auth_id;
              logger.info(
                {
                  module: "character-info",
                  operation: "loadCharacterData",
                  data: {
                    originalCharacterId: characterData.original_source,
                    originalAuthorId: finalAuthorId,
                  },
                },
                "Found original author for favorited character"
              );
            }
          }

          // 获取作者的 profile 信息
          if (finalAuthorId) {
            const { data: profileData } = await db.getUserProfile(
              finalAuthorId
            );
            if (profileData) {
              setAuthorProfile(profileData);
              logger.info(
                {
                  module: "character-info",
                  operation: "loadCharacterData",
                  data: { authorId: finalAuthorId, profile: profileData },
                },
                "Author profile loaded"
              );
            }
          }
        } catch (err) {
          logger.warn(
            {
              module: "character-info",
              operation: "loadCharacterData",
              error: err,
            },
            "Failed to load author profile"
          );
        }
      }

      // 🔍 检查是否已经收藏过
      if (currentUser && !isCharacterOwner) {
        await checkIfInLibrary(id);
      }

      logger.success(
        {
          module: "character-info",
          operation: "loadCharacterData",
          data: { character: characterData },
        },
        "Character data loaded successfully"
      );
    } catch (error) {
      logger.error(
        { module: "character-info", operation: "loadCharacterData", error },
        "Unexpected error loading character"
      );
      setError(
        `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // 🎯 确认添加到库并创建对话
  const handleConfirmAddToLibraryAndChat = async () => {
    if (!character) return;

    try {
      const currentUser = await authOperations.getCurrentUser();
      if (!currentUser) {
        toast.error(t("characterInfo.pleaseLogin"));
        return;
      }

      setShowAddToLibraryModal(false);
      setIsAddingToLibrary(true);
      toast.info(t("characterInfo.addingToLibrary"));

      const { data, error } = await db.favoriteCharacter(
        character.id,
        currentUser.id
      );

      if (error) {
        if (error.message?.includes("not public")) {
          toast.error(t("characterInfo.characterNotPublic"));
        } else if (
          error.message?.includes("already added") ||
          error.code === "ALREADY_FAVORITED"
        ) {
          toast.info(t("characterInfo.alreadyFavorited"));
          setIsAlreadyInLibrary(true);
        } else {
          toast.error(t("characterInfo.addFailed"));
        }
        setIsAddingToLibrary(false);
        return;
      }

      toast.success(`"${character.name}" ${t("characterInfo.addSuccess")}`);
      setIsAlreadyInLibrary(true);

      // 使用新创建的角色ID来创建对话
      const newCharacterId = data?.new_character_id;
      if (!newCharacterId) {
        toast.error(t("characterInfo.addFailed"));
        setIsAddingToLibrary(false);
        return;
      }

      // 显示 loading modal
      setShowChatLoadingModal(true);
      setIsAddingToLibrary(false);

      // 使用新的角色ID创建对话
      createCharacterChatSession.mutate({
        character_id: newCharacterId,
        character_name: character.name,
        mode: "character_agent",
      });
    } catch (e) {
      console.error("Failed to add to library:", e);
      toast.error(t("characterInfo.addFailed"));
      setIsAddingToLibrary(false);
    }
  };

  // 📤 分享功能处理函数
  const handleToggleShareMode = () => {
    if (isShareMode) {
      // 退出分享模式，重置选择
      setIsShareMode(false);
      setSelectedReports([]);
      setSelectedSoulSections([]);
    } else {
      // 进入分享模式
      setIsShareMode(true);
    }
  };

  const handleToggleReport = (reportKey: string) => {
    setSelectedReports(prev =>
      prev.includes(reportKey)
        ? prev.filter(k => k !== reportKey)
        : [...prev, reportKey]
    );
  };

  const handleToggleSoulSection = (sectionKey: string) => {
    setSelectedSoulSections(prev =>
      prev.includes(sectionKey)
        ? prev.filter(k => k !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const handleConfirmShare = async () => {
    if (!character) return;

    setIsCreatingShare(true);
    try {
      logger.info("📤 开始创建分享", {
        selectedReports,
        selectedSoulSections,
        character_id: character.id
      });

      const response = await createShare({
        share_type: "character",
        character_id: character.id,
        selected_reports: selectedReports,  // ✅ 始终传递数组，即使为空
        selected_soul_sections: selectedSoulSections,  // ✅ 始终传递数组，即使为空
      });

      logger.info("✅ 分享创建成功", { response });

      const shareUrl = response.share_url;
      await navigator.clipboard.writeText(shareUrl);

      logger.info("📋 链接已复制到剪贴板", { shareUrl });

      sonnerToast.success("分享链接已复制到剪贴板！", {
        duration: 3000,
        position: "top-center",
        icon: "🎉",
        className: "font-semibold",
        description: "可以通过链接分享给好友查看",
      });

      // 延迟退出分享模式，让toast有时间显示
      setTimeout(() => {
        handleToggleShareMode();
      }, 300);
    } catch (error: any) {
      // 🚨 提取错误信息并显示用户友好的错误提示
      let errorMessage = "创建分享失败";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // 记录到控制台供调试
      logger.error("创建分享失败", { error, character_id: character.id });

      // 显示用户友好的错误对话框
      sonnerToast.error(errorMessage, {
        description: "请检查角色状态后重试",
        duration: 5000,
      });
    } finally {
      setIsCreatingShare(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString("en_US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-content1">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <div className="text-foreground-600">
            {t("characterInfo.loadingCharacter")}
          </div>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-content1">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-danger/20 to-warning/20 rounded-full flex items-center justify-center">
            <img
              src="/placeholder.svg"
              alt="Error"
              className="w-8 h-8 opacity-60"
            />
          </div>
          <div className="text-danger text-lg font-semibold">
            {t("characterInfo.errorLoadingCharacter")}
          </div>
          <div className="text-foreground-600 text-sm bg-danger/10 p-4 rounded-lg border border-danger/20">
            {error || t("characterInfo.characterNotFound")}
          </div>
          <Button color="primary" onPress={() => router.back()}>
            {t("characterInfo.goBack")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-y-auto">
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 pt-1">
        <Button
          variant="flat"
          onPress={() => router.back()}
          className="bg-content2/80 backdrop-blur-md border border-white/10 hover:bg-content2 text-black font-medium"
          startContent={<ArrowLeft className="w-4 h-4" />}
        >
          {/* {t("characterInfo.back")} */}
        </Button>
      </div>
      <div className="relative max-w-7xl mx-auto px-6 pt-6">

        <div className="mt-4 grid grid-cols-1 justify-items-center gap-8">

          <Card className="max-w-3xl w-full shadow-none border-none bg-transparent">
            <CardBody className="flex flex-col p-8 bg-transparent">
              {/* 角色名 + Public/Private标签 */}
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="relative">
                  <Avatar
                    src={getAvatarPublicUrl(character.avatar_id, character.auth_id) || "/info-leftbackground.png"}
                    className="w-16 h-16"
                    isBordered
                    color="primary"
                  />
                  <span className="absolute -bottom-1 right-0 w-3 h-3 rounded-full bg-success ring-2 ring-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A9EBC5]" />
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight text-center">
                  {character.name}
                </h1>
                {/* Public/Private标签 - 移到角色名右下角 */}
                {/* {character.original_source ? (
                <Chip
                  size="sm"
                  variant="flat"
                  className="bg-rose-500/10 text-rose-500 mb-1"
                  startContent={<Heart className="w-3 h-3 fill-current" />}
                >
                  {t("characterInfo.favorited")}
                </Chip>
              ) : (
                <Chip
                  size="sm"
                  variant="flat"
                  className={`mb-1 ${
                    character.access_level === "public"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                  startContent={
                    character.access_level === "public" ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )
                  }
                >
                  {character.access_level === "public"
                    ? t("characterInfo.public")
                    : t("characterInfo.private")}
                </Chip>
              )} */}
              </div>
              <p className="text-base text-foreground-600 mb-6 leading-relaxed text-center">
                {character.description ||
                  t("characterInfo.mysteriousCharacter")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-sm text-foreground-500">{t("characterInfo.birthDate")}</div>
                  <div className="font-medium text-foreground">
                    {character.birth_time
                      ? new Date(character.birth_time).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
                      : t("sidebar.unknown")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-foreground-500">{t("characterInfo.gender")}</div>
                  <div className="font-medium text-foreground capitalize">
                    {character.gender === "male"
                      ? t("characterInfo.male")
                      : character.gender === "female"
                        ? t("characterInfo.female")
                        : character.gender || t("sidebar.unknown")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-foreground-500">{t("characterInfo.type")}</div>
                  <div className="font-medium text-foreground">
                    {character.category === "create_character_real_custom"
                      ? t("characterInfo.realCustom")
                      : character.category === "create_character_oc"
                        ? t("characterInfo.originalCharacter")
                        : character.category === "create_character_rw"
                          ? t("characterInfo.realWorld")
                          : character.category === "create_character_feed"
                            ? t("characterInfo.feedCreated")
                            : character.category === "create_character_agent"
                              ? t("characterInfo.agentCreated")
                              : t("sidebar.unknown")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-foreground-500">作者</div>
                  <div className="font-medium text-foreground underline">
                    {authorProfile?.username || authorProfile?.full_name || t("sidebar.unknown")}
                  </div>
                </div>
              </div>
              {/* Tags */}
              {character.tags && character.tags.length > 0 && (
                <div className="mb-8">
                  <div className="text-sm text-foreground-500 mb-3 text-center">
                    {t("characterInfo.characterTags")}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {character.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        size="sm"
                        variant="bordered"
                        className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                      >
                        #{tag}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat & Share 按钮 - 放在基础信息卡右下角 */}
              <div className="flex justify-center gap-4 mt-6">
                {!isShareMode ? (
                  <>
                    {/* 加入库按钮 - 仅非拥有者且公开角色显示 */}
                    {/* {!isOwner && !character.original_source && (
                      <Button
                        color={isAlreadyInLibrary ? "success" : "secondary"}
                        variant={isAlreadyInLibrary ? "flat" : "bordered"}
                        isLoading={isAddingToLibrary}
                        isDisabled={
                          isAddingToLibrary || isAlreadyInLibrary || !character.is_report_ready
                        }
                        startContent={
                          !isAddingToLibrary &&
                          (isAlreadyInLibrary ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <BookOpen className="w-4 h-4" />
                          ))
                        }
                        onPress={async () => {
                          if (!character || isAddingToLibrary) return;

                          try {
                            setIsAddingToLibrary(true);

                            const currentUser = await authOperations.getCurrentUser();
                            if (!currentUser) {
                              sonnerToast.error(t("characterInfo.pleaseLoginToFavorite"));
                              return;
                            }

                            if (currentUser.id === character.auth_id) {
                              sonnerToast.info(t("characterInfo.thisIsYourCharacter"));
                              return;
                            }

                            // 使用 favorite_character RPC 函数
                            const { data, error } = await db.favoriteCharacter(
                              character.id,
                              currentUser.id
                            );

                            if (error) {
                              const errorMessage = error.message || "";
                              const errorCode = error.code || "";
                              
                              // 处理不同的错误情况
                              if (errorMessage.includes("NOT_PUBLIC") || errorMessage.includes("not public")) {
                                sonnerToast.error(t("characterInfo.characterNotPublic"));
                              } else if (
                                errorMessage.includes("ALREADY_FAVORITED") || 
                                errorMessage.includes("already in your library") ||
                                errorCode === "ALREADY_FAVORITED"
                              ) {
                                sonnerToast.info(t("characterInfo.alreadyFavorited"));
                                setIsAlreadyInLibrary(true);
                              } else if (
                                errorMessage.includes("Character limit reached") ||
                                errorMessage.includes("已达上限") ||
                                errorMessage.includes("USAGE_LIMIT_EXCEEDED") ||
                                errorCode === "USAGE_LIMIT_EXCEEDED"
                              ) {
                                // 🎯 处理配额限制错误，使用 warning toast
                                toast({
                                  title: t("modes.usageLimitReached"),
                                  description: errorMessage || t("characterInfo.characterLimitReached"),
                                  variant: "warning",
                                  duration: 8000,
                                });
                              } else if (errorMessage.includes("OWN_CHARACTER") || errorMessage.includes("your own character")) {
                                sonnerToast.info(t("characterInfo.thisIsYourCharacter"));
                              } else {
                                sonnerToast.error(error.message || t("characterInfo.addFailed"));
                              }
                              console.error("Failed to favorite character:", error);
                              return;
                            }

                            // 成功添加
                            sonnerToast.success(
                              `"${character.name}" ${t("characterInfo.addSuccess")}`,
                              {
                                description: t("characterInfo.viewInMyCharacters"),
                                duration: 3000,
                              }
                            );

                            setIsAlreadyInLibrary(true);

                            logger.success(
                              {
                                module: "character-info",
                                operation: "addToLibrary",
                                data: {
                                  originalCharacterId: character.id,
                                  newCharacterId: data?.new_character_id,
                                },
                              },
                              "Character added to library successfully"
                            );
                          } catch (e) {
                            console.error("Failed to add to library:", e);
                            sonnerToast.error(t("characterInfo.addFailed"));
                          } finally {
                            setIsAddingToLibrary(false);
                          }
                        }}
                        className={
                          isAlreadyInLibrary
                            ? "h-auto p-1 min-w-[100px] rounded-full cursor-not-allowed opacity-70"
                            : "h-auto p-1 min-w-[100px] rounded-full border-secondary/20 hover:border-secondary/40"
                        }
                        title={!character.is_report_ready ? "请等待角色报告生成完成" : ""}
                      >
                        {isAddingToLibrary
                          ? "添加中..."
                          : isAlreadyInLibrary
                          ? "已添加"
                          : "Add to Library"}
                      </Button>
                    )} */}
                    <Button
                      variant="light"
                      startContent={<MessageCircle className="w-4 h-4" />}
                      onPress={async () => {
                        if (!character) return;
                        const currentUser = await authOperations.getCurrentUser();
                        if (!currentUser) {
                          sonnerToast.error(t("characterInfo.pleaseLoginToChat"));
                          return;
                        }

                        if (!character.is_report_ready) {
                          sonnerToast.error("请等待角色报告生成完成");
                          return;
                        }

                        // 检查是否需要添加到库
                        const isOwnCharacter = character.auth_id === currentUser.id;
                        if (!isOwnCharacter && !isAlreadyInLibrary && !character.original_source) {
                          setShowAddToLibraryModal(true);
                          return;
                        } else {
                          setShowChatLoadingModal(true);
                          createCharacterChatSession.mutate({
                            character_id: character.id,
                            character_name: character.name,
                            mode: "character_agent",
                          });
                        }
                      }}
                      className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md"
                      isDisabled={!character.is_report_ready}
                    >
                      Chat
                    </Button>
                    {/* 公开/私密切换按钮 - 仅拥有者且不是收藏的角色显示 */}
                    {isOwner && !character.original_source && (
                      <Button
                        variant="light"
                        isLoading={isTogglingAccess}
                        isDisabled={isTogglingAccess || !character.is_report_ready}
                        startContent={
                          !isTogglingAccess &&
                          (character.access_level === "public" ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          ))
                        }
                        onPress={async () => {
                          if (!character || isTogglingAccess) return; // 🔒 防止重复点击

                          try {
                            setIsTogglingAccess(true); // 🔄 开始 loading

                            const { data, error } =
                              await db.toggleCharacterAccessLevel(character.id);

                            if (error) {
                              console.error("Failed to toggle access level:", error);
                              toast.error(t("characterInfo.failedToToggleAccess"));
                              return;
                            }

                            // 🎯 直接更新本地状态，避免页面刷新
                            if (data) {
                              setCharacter(data);
                              logger.success(
                                {
                                  module: "character-info",
                                  operation: "toggleAccessLevel",
                                  data: {
                                    characterId: character.id,
                                    newAccessLevel: data.access_level,
                                  },
                                },
                                `Character visibility updated to ${data.access_level}`
                              );
                            }
                          } catch (e) {
                            console.error("Failed to toggle access level:", e);
                            toast.error(t("characterInfo.failedToToggleAccess"));
                          } finally {
                            setIsTogglingAccess(false); // 🔄 结束 loading
                          }
                        }}
                        className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md"
                        title={!character.is_report_ready ? "请等待角色报告生成完成" : ""}
                      >
                        {isTogglingAccess
                          ? "Updating..."
                          : character.access_level === "public"
                            ? "Public"
                            : "Private"}
                      </Button>
                    )}


                    <Button
                      variant="light"
                      startContent={<Share2 className="w-4 h-4" />}
                      onPress={handleToggleShareMode}
                      isDisabled={!character.is_report_ready}
                      className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md"
                    >
                      Share
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="light"
                      onPress={handleToggleShareMode}
                      className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md"
                    >
                      {t("characterInfo.cancel")}
                    </Button>
                    <Button
                      variant="light"
                      onPress={() => {
                        // 一键分享人物：选中所有报告和所有灵魂档案
                        setSelectedReports(["basic", "personal", "luck", "achievement"]);
                        setSelectedSoulSections([
                          "ai_summary", "keywords", "key_events",
                          "secrets_obsessions", "relationships", "special_traits",
                          "goals_motivations", "speech_style", "personality_traits",
                          "inner_conflicts", "emotional_triggers"
                        ]);
                      }}
                      className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md"
                    >
                      {t("characterInfo.shareEverything")}
                    </Button>
                    <Button
                      variant="light"
                      onPress={handleConfirmShare}
                      isLoading={isCreatingShare}
                      startContent={!isCreatingShare && <Share2 className="w-4 h-4" />}
                      className="h-10 px-5 min-w-[120px] rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm hover:to-[#EB7020]/30 hover:shadow-md"
                    >
                      {t("characterInfo.confirmShare")}
                    </Button>
                  </>
                )}
              </div>
              <div
                className="w-full mt-6 relative h-8 rounded-full bg-gradient-to-r from-gray-100 to-[#EB7020]/20 text-foreground shadow-sm p-3 cursor-pointer"
                onClick={() => setShowReportsModal(true)}
              >
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  <span>查看完整报告</span>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#EB7020] text-white"
                >
                  {character.is_report_ready ? "已生成" : "生成中"}
                </Chip>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 -mt-4 relative z-20">
        {/* <div className="mb-6">
          <Card className="bg-white/90">
            <CardBody className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#EB7020]">✳︎</span>
                  <h2 className="text-xl font-semibold text-foreground">角色鉴定摘要</h2>
                </div>
              </div>
              <div className="mt-2 h-[2px] bg-[#EB7020]" />
              {(character.reports as any)?.basic && (
                <div className="mt-4">
                  <div className="text-sm text-foreground-700 leading-relaxed border-l-2 border-[#EB7020] pl-4">
                    “{(character.reports as any).basic}”
                  </div>
                </div>
              )}
              <div className="mt-6">
                <div className="text-sm font-semibold text-[#EB7020] mb-2">核心气质</div>
                <div className="flex flex-wrap gap-2">
                  {(character.tags || []).slice(0, 8).map((tag, idx) => (
                    <Chip
                      key={idx}
                      size="sm"
                      variant="bordered"
                      className="border-[#EB7020]/40 text-[#EB7020] bg-[#EB7020]/10"
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        {character.reports && typeof character.reports === "object" && (
          <div className="mb-6">
            <Card className="bg-white/90 border border-[#EB7020]/20 shadow-xl">
              <CardBody className="p-8">
                {(character.character_metadata as any)?.goals_motivations ||
                  (character.reports as any)?.achievement ? (
                  <div className="rounded-xl border border-[#EB7020]/20 bg-gradient-to-b from-[#EB7020]/5 to-transparent p-5">
                    <div className="flex items-center gap-2 text-foreground mb-2">
                      <Target className="w-4 h-4 text-[#EB7020]" />
                      <span className="font-semibold">人生目标</span>
                    </div>
                    <div className="text-sm text-foreground-700">
                      {(character.character_metadata as any)?.goals_motivations || (character.reports as any)?.achievement}
                    </div>
                  </div>
                ) : null}

                {(character.character_metadata as any)?.speech_style ||
                  (character.reports as any)?.personal ? (
                  <div className="rounded-xl border border-[#EB7020]/20 bg-gradient-to-b from-[#EB7020]/5 to-transparent p-5 mt-4">
                    <div className="flex items-center gap-2 text-foreground mb-2">
                      <MessageCircle className="w-4 h-4 text-[#EB7020]" />
                      <span className="font-semibold">语言特征</span>
                    </div>
                    <div className="text-sm text-foreground-700">
                      {(character.character_metadata as any)?.speech_style || (character.reports as any)?.personal}
                    </div>
                  </div>
                ) : null}

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#EB7020]" />
                      <span className="font-semibold text-foreground">AI 深度洞察</span>
                    </div>
                    {isShareMode && (
                      <Button
                        size="sm"
                        variant="shadow"
                        color="primary"
                        onPress={() => setSelectedReports(["basic", "personal", "luck", "achievement"])}
                        className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                      >
                        {t("characterInfo.selectAllReports")}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(character.reports as any)?.basic && (
                      <div
                        className={`relative rounded-xl border border-[#EB7020]/30 bg-white p-4 shadow-sm ${isShareMode ? "cursor-pointer hover:shadow-md" : ""}`}
                        onClick={() => {
                          if (isShareMode) {
                            handleToggleReport("basic");
                          } else {
                            setSelectedReport("basic");
                            setShowReportsModal(true);
                          }
                        }}
                      >
                        {isShareMode && selectedReports.includes("basic") && (
                          <div className="absolute -top-2 -right-2 bg-[#EB7020] rounded-full p-1 shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="text-sm font-medium text-foreground mb-1">命理序</div>
                        <div className="text-sm text-foreground-600">{(character.reports as any).basic}</div>
                      </div>
                    )}

                    {(character.reports as any)?.personal && (
                      <div
                        className={`relative rounded-xl border border-[#EB7020]/30 bg-white p-4 shadow-sm ${isShareMode ? "cursor-pointer hover:shadow-md" : ""}`}
                        onClick={() => {
                          if (isShareMode) {
                            handleToggleReport("personal");
                          } else {
                            setSelectedReport("personal");
                            setShowReportsModal(true);
                          }
                        }}
                      >
                        {isShareMode && selectedReports.includes("personal") && (
                          <div className="absolute -top-2 -right-2 bg-[#EB7020] rounded-full p-1 shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="text-sm font-medium text-foreground mb-1">情感密码</div>
                        <div className="text-sm text-foreground-600">{(character.reports as any).personal}</div>
                      </div>
                    )}

                    {(character.reports as any)?.luck && (
                      <div
                        className={`relative rounded-xl border border-[#EB7020]/30 bg-white p-4 shadow-sm ${isShareMode ? "cursor-pointer hover:shadow-md" : ""}`}
                        onClick={() => {
                          if (isShareMode) {
                            handleToggleReport("luck");
                          } else {
                            setSelectedReport("luck");
                            setShowReportsModal(true);
                          }
                        }}
                      >
                        {isShareMode && selectedReports.includes("luck") && (
                          <div className="absolute -top-2 -right-2 bg-[#EB7020] rounded-full p-1 shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="text-sm font-medium text-foreground mb-1">运势线</div>
                        <div className="text-sm text-foreground-600">{(character.reports as any).luck}</div>
                      </div>
                    )}

                    {(character.reports as any)?.achievement && (
                      <div
                        className={`relative rounded-xl border border-[#EB7020]/30 bg-white p-4 shadow-sm ${isShareMode ? "cursor-pointer hover:shadow-md" : ""}`}
                        onClick={() => {
                          if (isShareMode) {
                            handleToggleReport("achievement");
                          } else {
                            setSelectedReport("achievement");
                            setShowReportsModal(true);
                          }
                        }}
                      >
                        {isShareMode && selectedReports.includes("achievement") && (
                          <div className="absolute -top-2 -right-2 bg-[#EB7020] rounded-full p-1 shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="text-sm font-medium text-foreground mb-1">成就线索</div>
                        <div className="text-sm text-foreground-600">{(character.reports as any).achievement}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <Button
                      variant="light"
                      startContent={<FileText className="w-4 h-4" />}
                      onPress={() => setShowReportsModal(true)}
                      className="rounded-xl"
                    >
                      查看完整报告
                    </Button>
                    <Chip size="sm" variant="flat" color={character.is_report_ready ? "success" : "warning"}>
                      {character.is_report_ready ? "已生成" : "生成中"}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )} */}

        {/* Character Story Section - 如果有角色设定信息则展示 */}
        {character.character_metadata &&
          typeof character.character_metadata === "object" &&
          (character.character_metadata as any).version && (
            <div className="mb-6 relative">
              {isShareMode && (
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    size="sm"
                    variant="shadow"
                    color="secondary"
                    onPress={() => {
                      // 全选灵魂档案：选中所有灵魂档案子模块
                      setSelectedSoulSections([
                        "ai_summary", "keywords", "key_events",
                        "secrets_obsessions", "relationships", "special_traits",
                        "goals_motivations", "speech_style", "personality_traits",
                        "inner_conflicts", "emotional_triggers"
                      ]);
                    }}
                    className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                  >
                    {t("characterInfo.selectAllSoulSections")}
                  </Button>
                </div>
              )}
              <CharacterStoryCard
                data={character.character_metadata as any}
                isShareMode={isShareMode}
                selectedSections={selectedSoulSections}
                onToggleSection={handleToggleSoulSection}
                lastUpdated={character.updated_at}
              />
            </div>
          )}
      </div>

      {/* Bottom Spacer */}
      <div className="h-16" />

      {/* Add to Library Confirmation Modal */}
      <Modal
        isOpen={showAddToLibraryModal}
        onClose={() => setShowAddToLibraryModal(false)}
        size="2xl"
        backdrop="blur"
        classNames={{
          base: "bg-gradient-to-br from-content1 via-content1 to-content2 border border-primary/20",
          header: "border-b border-primary/20",
          body: "py-6",
          footer: "border-t border-primary/20",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-auto p-1 min-w-[100px] rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {t("characterInfo.addToLibrary")}
                    </h3>
                    <p className="text-sm text-foreground-500 font-normal">
                      {t("characterInfo.startChatWith")} {character?.name}
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  {/* 角色卡片 */}
                  <div className="bg-content2/50 border border-primary/10 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={getAvatarPublicUrl(
                          character?.avatar_id,
                          character?.auth_id
                        )}
                        name={character?.name}
                        className="w-16 h-16 border-2 border-primary/20"
                        fallback={
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                            <User className="w-8 h-8 text-foreground-500" />
                          </div>
                        }
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-foreground mb-1">
                          {character?.name}
                        </h4>
                        <p className="text-sm text-foreground-600 line-clamp-2">
                          {character?.description ||
                            t("characterInfo.mysteriousCharacter")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 说明文字 */}
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <span className="text-primary text-sm">💡</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-foreground font-medium">
                          {t("characterInfo.whyAddToLibrary")}
                        </p>
                        <ul className="text-xs text-foreground-600 space-y-1.5 ml-2">
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>
                              <strong className="text-foreground">
                                {t("characterInfo.saveCharacter")}
                              </strong>
                              {t("characterInfo.saveCharacterDesc")}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>
                              <strong className="text-foreground">
                                {t("characterInfo.startConversation")}
                              </strong>
                              {t("characterInfo.startConversationDesc")}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>
                              <strong className="text-foreground">
                                {t("characterInfo.useAnytime")}
                              </strong>
                              {t("characterInfo.useAnytimeDesc")}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={onClose}
                  className="bg-content2"
                >
                  {t("characterInfo.cancel")}
                </Button>
                <Button
                  color="primary"
                  onPress={handleConfirmAddToLibraryAndChat}
                  isLoading={isAddingToLibrary}
                  startContent={
                    !isAddingToLibrary && <BookOpen className="w-4 h-4" />
                  }
                  className="font-semibold"
                >
                  {isAddingToLibrary
                    ? t("characterInfo.adding")
                    : t("characterInfo.addAndStartChat")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Reports Modal */}
      <Modal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-content1",
          header: "border-b border-foreground/10",
          body: "py-6",
          footer: "border-t border-foreground/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {character?.name} - {t("characterInfo.destinyReport")}
                </h2>
              </ModalHeader>
              <ModalBody>
                <Tabs
                  selectedKey={selectedReport}
                  onSelectionChange={(key) => setSelectedReport(key as string)}
                  color="primary"
                  variant="underlined"
                  classNames={{
                    tabList:
                      "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-primary",
                  }}
                >
                  {(character?.reports as any)?.basic && (
                    <Tab
                      key="basic"
                      title={
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          <span>{t("characterInfo.coreProfile")}</span>
                        </div>
                      }
                    >
                      <div className="prose prose-invert max-w-none p-6 bg-content2/50 rounded-lg mt-4">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                          {(character.reports as any).basic}
                        </pre>
                      </div>
                    </Tab>
                  )}

                  {(character?.reports as any)?.personal && (
                    <Tab
                      key="personal"
                      title={
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{t("characterInfo.personalityAnalysis")}</span>
                        </div>
                      }
                    >
                      <div className="prose prose-invert max-w-none p-6 bg-content2/50 rounded-lg mt-4">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                          {(character.reports as any).personal}
                        </pre>
                      </div>
                    </Tab>
                  )}

                  {(character?.reports as any)?.luck && (
                    <Tab
                      key="luck"
                      title={
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>
                            {t("characterInfo.multiDimensionalPersonality")}
                          </span>
                        </div>
                      }
                    >
                      <div className="prose prose-invert max-w-none p-6 bg-content2/50 rounded-lg mt-4">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                          {(character.reports as any).luck}
                        </pre>
                      </div>
                    </Tab>
                  )}

                  {(character?.reports as any)?.achievement && (
                    <Tab
                      key="achievement"
                      title={
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          <span>{t("characterInfo.lifeAchievements")}</span>
                        </div>
                      }
                    >
                      <div className="prose prose-invert max-w-none p-6 bg-content2/50 rounded-lg mt-4">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                          {(character.reports as any).achievement}
                        </pre>
                      </div>
                    </Tab>
                  )}
                </Tabs>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {t("characterInfo.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Chat Loading Modal - 参考图2的样式 */}
      <Modal
        isOpen={showChatLoadingModal}
        onClose={() => { }}
        hideCloseButton
        isDismissable={false}
        size="lg"
        classNames={{
          base: "bg-content1/95 backdrop-blur-xl",
          backdrop: "bg-black/80",
        }}
      >
        <ModalContent>
          <ModalBody className="py-12">
            <div className="flex flex-col items-center justify-center gap-6">
              {/* Loading Spinner */}
              <div className="relative">
                <Spinner
                  size="lg"
                  color="primary"
                  classNames={{
                    circle1: "border-b-primary",
                    circle2: "border-b-secondary",
                  }}
                />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-semibold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t("characterInfo.creatingSession")}
              </h3>

              {/* Loading Steps */}
              <div className="space-y-3 w-full max-w-sm">
                <div className="flex items-center gap-3 text-foreground-600">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span>{t("characterInfo.initializingAI")}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground-600">
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span>{t("characterInfo.preparingChat")}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground-600">
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  />
                  <span>{t("characterInfo.almostDone")}</span>
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-sm text-foreground-500 text-center">
                {t("characterInfo.creatingExperience")}
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

    </div>
  );
}
