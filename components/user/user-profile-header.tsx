"use client";

import { useState } from "react";
import { Card, CardBody, Avatar, Button, Chip, useDisclosure } from "@heroui/react";
import { Edit, Database, Crown, Sparkles, Calendar, Clock, Zap } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import UserEditModal from "./user-edit-modal";
import SubscriptionModal from "@/components/subscription/subscription-modal";
import { useTranslation } from "@/lib/utils/translations";
import { subscriptionAPI } from "@/lib/api/subscription";
import { Store } from "@/store";
import { observer } from "mobx-react-lite";

interface UserStats {
  totalCharacters: number;
  publicCharacters: number;
  privateCharacters: number;
  totalLikes: number;
}

interface UserProfileHeaderProps {
  profile: User;
  stats: UserStats;
  onUserUpdated?: (updatedUser: User) => void;
}

const UserProfileHeader = observer(({
  profile,
  stats,
  onUserUpdated,
}: UserProfileHeaderProps) => {
  const { t, getLanguage } = useTranslation();
  const subscription = Store.user.subscription;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const {
    isOpen: isSubscriptionOpen,
    onOpen: onSubscriptionOpen,
    onOpenChange: onSubscriptionOpenChange,
  } = useDisclosure();
  
  // Safely extract user data with fallbacks
  const username =
    profile?.user_metadata?.username || profile?.email?.split("@")[0] || "User";
  const email = profile?.email || "";
  const avatar = profile?.user_metadata?.avatar_url || "";
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : "Unknown";

  // Get subscription icon
  const getSubscriptionIcon = () => {
    if (!subscription || subscription.subscription_status === "free") {
      return null;
    }
    if (subscription.subscription_tier === "yearly") {
      return <Crown className="w-4 h-4" />;
    } else if (subscription.subscription_tier === "premium") {
      return <Sparkles className="w-4 h-4 text-primary" />; // 🎯 试用会员使用主题色星星
    } else {
      return <Sparkles className="w-4 h-4" />;
    }
  };

  // Get subscription color
  const getSubscriptionColor = () => {
    if (!subscription || subscription.subscription_status === "free") {
      return "default";
    }
    if (subscription.subscription_tier === "yearly") {
      return "warning";
    } else if (subscription.subscription_tier === "premium") {
      return "primary"; // 🎯 试用会员使用主题色
    } else {
      return "secondary";
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Card className="bg-gradient-to-br from-content2 to-content1 border border-white/10 shadow-xl">
      <CardBody className="p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0 text-center md:text-left">
            <Avatar
              size="lg"
              src={avatar || undefined}
              name={username}
              className="w-28 h-28 text-xl border-4 border-white/10"
              showFallback
            />
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-title font-bold ">
                    {username}
                  </h1>
                  {/* Subscription Badge */}
                  {subscription && subscription.subscription_status !== "free" && (
                    <Chip
                      color={getSubscriptionColor() as any}
                      variant="flat"
                      startContent={getSubscriptionIcon()}
                      className="capitalize"
                      size="sm"
                    >
                      {subscriptionAPI.formatTierName(subscription.subscription_tier, getLanguage())}
                    </Chip>
                  )}
                </div>
                <p className="text-foreground-70 text-lg">{email}</p>
                <p className="text-foreground-50 text-sm">{t("settings.memberSince")} {joinDate}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center md:text-left bg-white/5 rounded-lg p-4">
                <div className="font-bold text-primary text-2xl">
                  {stats.totalCharacters}
                </div>
                <div className="text-foreground-60/60 text-sm font-medium">
                  {t("userProfile.totalCharacters")}
                </div>
              </div>
              <div className="text-center md:text-left bg-white/5 rounded-lg p-4">
                <div className="font-bold text-success text-2xl">
                  {stats.publicCharacters}
                </div>
                <div className="text-foreground-60/60 text-sm font-medium">{t("userProfile.public")}</div>
              </div>
              <div className="text-center md:text-left bg-white/5 rounded-lg p-4">
                <div className="font-bold text-warning text-2xl">
                  {stats.privateCharacters}
                </div>
                <div className="text-foreground-60/60 text-sm font-medium">{t("userProfile.private")}</div>
              </div>
              <div className="text-center md:text-left bg-white/5 rounded-lg p-4">
                <div className="font-bold text-secondary text-2xl">
                  {stats.totalLikes}
                </div>
                <div className="text-foreground-60 text-sm font-medium">
                  {t("userProfile.totalLikes")}
                </div>
              </div>
            </div>

            {/* Subscription Status Card */}
            {subscription && subscription.subscription_status !== "free" && (
              <div className="bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/30 rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-warning/20 rounded-full">
                      {getSubscriptionIcon()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {subscriptionAPI.formatTierName(subscription.subscription_tier, getLanguage())}
                        <Chip
                          size="sm"
                          color={subscription.subscription_status === "active" ? "success" : "default"}
                          variant="flat"
                        >
                          {subscriptionAPI.formatStatusName(subscription.subscription_status, getLanguage())}
                        </Chip>
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-foreground-60 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {t("userProfile.expires")}
                          {formatDate(subscription.subscription_end_date)}
                        </span>
                        {subscription.days_remaining !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t("userProfile.daysLeft").replace("{days}", String(subscription.days_remaining))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* 🎯 续费/重新激活按钮 */}
                  <Button
                    color={subscription.subscription_status === "expired" || subscription.subscription_status === "cancelled" ? "warning" : "primary"}
                    variant="flat"
                    size="sm"
                    startContent={<Zap className="w-4 h-4" />}
                    onPress={onSubscriptionOpen}
                    className="font-semibold"
                  >
                    {subscription.subscription_status === "expired" || subscription.subscription_status === "cancelled"
                      ? t("subscription.reactivate")
                      : t("subscription.renew")}
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="bordered"
                startContent={<Edit className="w-4 h-4" />}
                className="border-foreground-30 hover:border-foreground-50 text-foreground hover:bg-foreground-10"
                size="lg"
                onPress={() => setIsEditModalOpen(true)}
              >
                {t("userEdit.editProfile")}
              </Button>

              <Button
                as={Link}
                href="/database"
                color="primary"
                startContent={<Database className="w-4 h-4" />}
                size="lg"
                className="font-semibold"
              >
                {t("userProfile.viewDatabase")}
              </Button>
            </div>
          </div>
        </div>
      </CardBody>

      {/* 用户编辑模态框 */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={profile}
        onUserUpdated={onUserUpdated}
      />
      
      {/* 订阅弹窗 */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onOpenChange={onSubscriptionOpenChange}
      />
    </Card>
  );
});

export default UserProfileHeader;
