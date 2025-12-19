"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardBody,
  Button,
  Spinner,
} from "@heroui/react";
import { CheckCircle2, Sparkles, Home, Crown } from "lucide-react";
import { useTranslation } from "@/lib/utils/translations";
import { logger } from "@/lib/utils/logger";
import { authOperations } from "@/lib/supabase/auth";
import { subscriptionAPI } from "@/lib/api/subscription";
import { Store } from "@/store";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, getLanguage } = useTranslation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  useEffect(() => {
    const session_id = searchParams.get("session_id");
    setSessionId(session_id);

    if (session_id) {
      verifyPayment(session_id);
    } else {
      setIsVerifying(false);
      logger.warn(
        {
          module: "subscription",
          operation: "success_page",
        },
        "No session_id found in URL"
      );
    }
  }, [searchParams]);

  const verifyPayment = async (session_id: string) => {
    try {
      logger.info(
        {
          module: "subscription",
          operation: "verify_payment",
          data: { session_id },
        },
        "Verifying payment status"
      );

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://xwanai-back-rmxvs5nflq-as.a.run.app";
      
      // 获取认证token（从 Supabase session）
      const accessToken = await authOperations.getAccessToken();
      
      const response = await fetch(
        `${apiBaseUrl}/api/stripe/v1/checkout-session/${session_id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || ""}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        logger.success(
          {
            module: "subscription",
            operation: "verify_payment",
            data: { status: data.status },
          },
          "Payment verified successfully"
        );
        
        // 刷新 Store 中的订阅信息
        await Store.user.fetchSubscription();
        
        // 设置显示的订阅层级
        if (Store.user.subscription) {
          setSubscriptionTier(Store.user.subscription.subscription_tier);
          logger.info(
            {
              module: "subscription",
              operation: "refresh_status",
              data: { tier: Store.user.subscription.subscription_tier },
            },
            "Subscription status refreshed"
          );
        }
      } else {
        logger.error(
          {
            module: "subscription",
            operation: "verify_payment",
          },
          "Failed to verify payment"
        );
      }
    } catch (error) {
      logger.error(
        {
          module: "subscription",
          operation: "verify_payment",
          error,
        },
        "Error verifying payment"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoHome = () => {
    logger.info(
      {
        module: "subscription",
        operation: "return_home",
      },
      "User returning to home page"
    );
    router.push("/");
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center p-8 space-y-4">
            <Spinner size="lg" color="primary" />
            <p className="text-foreground-600">
              {t("subscription.verifying")}
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardBody className="p-8 md:p-12 text-center space-y-6">
          {/* 成功图标 */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-success/20 blur-2xl rounded-full" />
              <CheckCircle2 className="relative w-24 h-24 text-success" />
            </div>
          </div>

          {/* 成功标题 */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              {t("subscription.successTitle")}
            </h1>
            <p className="text-lg text-foreground-600">
              {t("subscription.successSubtitle")}
            </p>
          </div>

          {/* 成功信息 */}
          <div className="bg-success/10 border border-success/30 rounded-lg p-6 space-y-3">
            <p className="text-foreground">
              {t("subscription.successMessage")}
            </p>
            {subscriptionTier && subscriptionTier !== "free" && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {subscriptionTier === "yearly" ? (
                  <Crown className="w-5 h-5 text-warning" />
                ) : (
                  <Sparkles className="w-5 h-5 text-warning" />
                )}
                <span className="text-warning font-semibold">
                  {subscriptionAPI.formatTierName(
                    subscriptionTier as any,
                    getLanguage()
                  )}
                </span>
              </div>
            )}
            {sessionId && (
              <p className="text-xs text-foreground-500 font-mono">
                {t("subscription.sessionId")}: {sessionId.substring(0, 20)}...
              </p>
            )}
          </div>

          {/* 提示信息 */}
          <div className="space-y-2 text-sm text-foreground-600">
            <p>{t("subscription.successNote1")}</p>
            <p>{t("subscription.successNote2")}</p>
          </div>

          {/* 返回按钮 */}
          <div className="pt-4">
            <Button
              color="primary"
              size="lg"
              onPress={handleGoHome}
              startContent={<Home className="w-5 h-5" />}
              className="font-semibold"
            >
              {t("subscription.returnHome")}
            </Button>
          </div>

          {/* 装饰性分割线 */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex-1 h-px bg-divider" />
            <Sparkles className="w-4 h-4 text-primary" />
            <div className="flex-1 h-px bg-divider" />
          </div>

          {/* 额外信息 */}
          <p className="text-xs text-foreground-500">
            {t("subscription.successFooter")}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

