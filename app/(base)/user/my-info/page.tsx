"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner, Card, CardBody, Button, Chip, Snippet } from "@heroui/react";
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
        return shareType;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-content1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <div className="text-white/60">Loading your profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full bg-content1 flex items-center justify-center">
        <Card className="max-w-md bg-content1 border border-white/5">
          <CardBody className="text-center p-8 space-y-4">
            <div className="text-danger text-4xl">⚠️</div>
            <h3 className="text-xl font-semibold text-white">
              Error Loading Profile
            </h3>
            <p className="text-white/60">{error}</p>
            <Button
              color="primary"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={handleRefresh}
            >
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-content1 flex items-center justify-center">
        <Card className="max-w-md bg-content2 border border-white/5">
          <CardBody className="text-center p-8 space-y-4">
            <div className="text-warning text-4xl">🔐</div>
            <h3 className="text-xl font-semibold text-white">
              Authentication Required
            </h3>
            <p className="text-white/60">Please sign in to view your profile</p>
            <Button color="primary" onPress={() => router.push("/login")}>
              Sign In
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-content1">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
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
        <div>
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-title font-bold text-white flex items-center gap-3">
                  <Share2 className="w-8 h-8 text-primary" />
                  {t("myShares.title")}
                </h2>
                {shares.length > 0 && (
                  <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {shares.length} {t("myShares.sharesCount")}
                  </div>
                )}
              </div>
              <Button
                color="default"
                variant="flat"
                size="sm"
                startContent={<RefreshCw className="w-4 h-4" />}
                onPress={handleRefresh}
              >
                {t("myShares.refresh")}
              </Button>
            </div>

            {/* Shares Content */}
            {shares.length === 0 ? (
              <Card className="bg-gradient-to-br from-content1 to-content2 border border-white/10 shadow-lg">
                <CardBody className="text-center p-16 space-y-6">
                  <div className="text-8xl opacity-50">📤</div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-title font-bold text-white">
                      {t("myShares.noShares")}
                    </h3>
                    <p className="text-white/70 text-lg max-w-md mx-auto">
                      {t("myShares.noSharesDescription")}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {shares.map((share) => (
                  <Card key={share.id} className="bg-content2/80 backdrop-blur-sm border border-white/10 hover:border-primary/30 transition-all">
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
                          <div className="flex items-center gap-1 text-xs text-white/60">
                            <Clock className="w-3 h-3" />
                            <span>{share.view_count}{t("myShares.views")}</span>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-white line-clamp-1">
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
                            base: "bg-content1/50",
                            pre: "text-[10px] font-mono break-all",
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
                          color="secondary"
                          onPress={() => baseUrl && window.open(`${baseUrl}/share/${share.share_token}`, "_blank")}
                          isDisabled={!baseUrl}
                          className="min-w-8 h-8"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* 时间信息 */}
                      <div className="flex items-center justify-between text-xs text-white/50 pt-1">
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
  );
}
