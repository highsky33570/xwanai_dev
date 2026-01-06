"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Button, Chip, Snippet, Skeleton } from "@heroui/react";
import { RefreshCw, Share2, Clock, ExternalLink, Copy } from "lucide-react";
import UserProfileHeader from "@/components/user/user-profile-header";
import { authOperations } from "@/lib/supabase/auth";
import { logger } from "@/lib/utils/logger";
import { getUserShares, type UserShare } from "@/lib/api/share";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "@/lib/utils/translations";
import { toast as sonnerToast } from "sonner";

export default function MyInfoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [shares, setShares] = useState<UserShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>("");

  // 获取当前网站的基础 URL
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.info(
        { module: "my-info", operation: "loadUserData" },
        "Loading user profile data"
      );

      // Get current user
      const currentUser = await authOperations.getCurrentUser();
      if (!currentUser) {
        logger.warn(
          { module: "my-info", operation: "loadUserData" },
          "No authenticated user found"
        );
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // 加载分享列表
      try {
        const sharesResult = await getUserShares();
        // 处理返回数据，确保是数组
        const sharesArray = Array.isArray(sharesResult) 
          ? sharesResult 
          : (sharesResult?.shares || []);
        setShares(sharesArray);
        logger.info(
          { module: "my-info", operation: "loadUserData", data: { sharesCount: sharesArray.length } },
          "User shares loaded successfully"
        );
      } catch (shareError) {
        logger.error(
          { module: "my-info", operation: "loadUserData", error: shareError },
          "Failed to load user shares"
        );
        setShares([]); // 设置为空数组以避免 map 错误
      }

      logger.success(
        {
          module: "my-info",
          operation: "loadUserData",
          data: {
            userId: currentUser.id,
          },
        },
        "User profile data loaded successfully"
      );
    } catch (error) {
      logger.error(
        { module: "my-info", operation: "loadUserData", error },
        "Unexpected error loading user data"
      );
      setError("An unexpected error occurred while loading your profile");
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInHours < 1) {
        return "Just now";
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      logger.warn(
        { module: "my-info", operation: "formatRelativeTime", error },
        "Error formatting time"
      );
      return "Unknown";
    }
  };

  const handleRefresh = () => {
    logger.info(
      { module: "my-info", operation: "handleRefresh" },
      "Refreshing user data"
    );
    loadUserData();
  };

  const handleUserUpdated = (updatedUser: User) => {
    logger.info(
      { module: "my-info", operation: "handleUserUpdated" },
      "User profile updated, refreshing data"
    );
    setUser(updatedUser);
    loadUserData();
  };

  const getShareTypeLabel = (shareType: string) => {
    switch (shareType) {
      case "character":
        return t("myShares.characterShare");
      case "chat":
        return t("myShares.chatShare");
      case "hepan":
        return t("myShares.hepanShare");
      default:
        return shareType;
    }
  };

  const getShareTypeColor = (shareType: string) => {
    switch (shareType) {
      case "character":
        return "primary";
      case "chat":
        return "secondary";
      case "hepan":
        return "success";
      default:
        return "default";
    }
  };

  const getShareTitle = (share: UserShare) => {
    // 根据分享类型和关联数据构建标题
    switch (share.share_type) {
      case "character":
        return share.character_name 
          ? `${share.character_name}${t("myShares.characterReport")}` 
          : t("myShares.characterShare");
      case "chat":
        if (share.session_mode === "character_agent" && share.character_name) {
          return `${t("myShares.chatWith")}${share.character_name}`;
        } else if (share.session_mode === "xwan_ai") {
          return t("myShares.chatWithXWAN");
        }
        return t("myShares.chatShare");
      case "hepan":
        return t("myShares.hepanShare");
      default:
        return share.share_type;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full pr-10">
        <div className="relative z-10 py-6">
          <div className="rounded-3xl">
            <div className="py-6 space-y-8">
              {/* Profile Header Skeleton */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="rounded-full">
                    <div className="w-20 h-20 bg-default-200" />
                  </Skeleton>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="rounded-lg">
                      <div className="h-6 w-48 bg-default-200" />
                    </Skeleton>
                    <Skeleton className="rounded-lg">
                      <div className="h-4 w-64 bg-default-200" />
                    </Skeleton>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Skeleton className="rounded-lg">
                    <div className="h-10 w-32 bg-default-200" />
                  </Skeleton>
                  <Skeleton className="rounded-lg">
                    <div className="h-10 w-32 bg-default-200" />
                  </Skeleton>
                </div>
              </div>

              {/* Shares Section Skeleton */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="rounded-lg">
                    <div className="h-8 w-40 bg-default-200" />
                  </Skeleton>
                  <Skeleton className="rounded-lg">
                    <div className="h-8 w-24 bg-default-200" />
                  </Skeleton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-white/80 backdrop-blur-sm border border-black/10">
                      <CardBody className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="rounded-full">
                            <div className="h-6 w-16 bg-default-200" />
                          </Skeleton>
                          <Skeleton className="rounded-lg">
                            <div className="h-4 w-12 bg-default-200" />
                          </Skeleton>
                        </div>
                        <Skeleton className="rounded-lg">
                          <div className="h-4 w-full bg-default-200" />
                        </Skeleton>
                        <Skeleton className="rounded-lg">
                          <div className="h-8 w-full bg-default-200" />
                        </Skeleton>
                        <div className="flex justify-between">
                          <Skeleton className="rounded-lg">
                            <div className="h-3 w-20 bg-default-200" />
                          </Skeleton>
                          <Skeleton className="rounded-lg">
                            <div className="h-3 w-16 bg-default-200" />
                          </Skeleton>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-danger text-4xl">⚠️</div>
          <h3 className="text-xl font-semibold text-foreground">
            {t("myShares.errorLoadingProfile")}
          </h3>
          <p className="text-foreground-600">{error}</p>
          <Button
            color="primary"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={handleRefresh}
            className="bg-[#EB7020] text-white"
          >
            {t("myShares.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-warning text-4xl">🔐</div>
          <h3 className="text-xl font-semibold text-foreground">
            {t("myShares.authenticationRequired")}
          </h3>
          <p className="text-foreground-600">{t("myShares.pleaseSignIn")}</p>
          <Button 
            color="primary" 
            onPress={() => router.push("/login")}
            className="bg-[#EB7020] text-white"
          >
            {t("myShares.signIn")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full pr-10">
      <div className="relative z-10 py-6">
        <div className="rounded-3xl">
          <div className="py-6">
            {/* Profile Header */}
            <UserProfileHeader
              profile={user}
              stats={{
                totalCharacters: 0,
                publicCharacters: 0,
                privateCharacters: 0,
                totalLikes: 0,
              }}
              onUserUpdated={handleUserUpdated}
            />

            {/* Shares Section */}
            <div className="mt-8">
              <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                      <Share2 className="w-6 h-6 text-[#EB7020]" />
                      {t("myShares.title")}
                    </h2>
                    {shares.length > 0 && (
                      <div className="bg-[#EB7020]/20 text-[#EB7020] px-3 py-1 rounded-full text-sm font-medium">
                        {shares.length} {t("myShares.sharesCount")}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<RefreshCw className="w-4 h-4" />}
                    onPress={handleRefresh}
                    className="bg-black/5 text-black"
                  >
                    {t("myShares.refresh")}
                  </Button>
                </div>

                {/* Shares Content */}
                {shares.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-8xl opacity-50 mb-6">📤</div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold text-black">
                        {t("myShares.noShares")}
                      </h3>
                      <p className="text-black/70 text-lg max-w-md mx-auto">
                        {t("myShares.noSharesDescription")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shares.map((share) => (
                      <Card 
                        key={share.id} 
                        className="bg-white/80 backdrop-blur-sm border border-black/10 hover:border-[#EB7020]/30 transition-all"
                      >
                        <CardBody className="p-4 space-y-2.5">
                          {/* 标题和类型 */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Chip
                                color={getShareTypeColor(share.share_type) as any}
                                variant="flat"
                                size="sm"
                                className="font-medium text-xs"
                              >
                                {getShareTypeLabel(share.share_type)}
                              </Chip>
                              <div className="flex items-center gap-1 text-xs text-black/60">
                                <Clock className="w-3 h-3" />
                                <span>{share.view_count}{t("myShares.views")}</span>
                              </div>
                            </div>
                            <h3 className="text-sm font-semibold text-black line-clamp-1">
                              {getShareTitle(share)}
                            </h3>
                          </div>

                          {/* 分享码 */}
                          <div className="flex items-center gap-2">
                            <Snippet
                              symbol=""
                              size="sm"
                              className="flex-1"
                              classNames={{
                                base: "bg-black/5",
                                pre: "text-[10px] font-mono break-all text-black",
                              }}
                              copyIcon={<Copy className="w-3 h-3" />}
                              onCopy={() => {
                                if (baseUrl) {
                                  navigator.clipboard.writeText(`${baseUrl}/share/${share.share_token}`);
                                  sonnerToast.success(t("characterInfo.linkCopied"));
                                }
                              }}
                            >
                              {share.share_token}
                            </Snippet>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              onPress={() => baseUrl && window.open(`${baseUrl}/share/${share.share_token}`, "_blank")}
                              isDisabled={!baseUrl}
                              className="min-w-8 h-8 bg-black/5"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-black" />
                            </Button>
                          </div>

                          {/* 时间信息 */}
                          <div className="flex items-center justify-between text-xs text-black/50 pt-1">
                            <span>{formatRelativeTime(share.created_at)}</span>
                            <span className={new Date(share.expires_at) <= new Date() ? "text-danger" : ""}>
                              {new Date(share.expires_at) > new Date()
                                ? `${Math.ceil((new Date(share.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}${t("myShares.days")}`
                                : t("myShares.expired")}
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
