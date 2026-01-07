"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  RadioGroup,
  Radio,
  Spinner,
  Chip,
  Divider,
} from "@heroui/react";
import { Check, Sparkles, CreditCard, Crown, Calendar } from "lucide-react";
import { useTranslation } from "@/lib/utils/translations";
import { logger } from "@/lib/utils/logger";
import { authOperations } from "@/lib/supabase/auth";
import { subscriptionAPI } from "@/lib/api/subscription";
import { Store } from "@/store";

interface SubscriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type SubscriptionPlan = "monthly" | "yearly";
type Currency = "usd" | "cny";

const PRICE_IDS = {
  usd_monthly: "price_1SLcmZE0RRdjYh9tNo2mHBGm",
  cny_monthly: "price_1SLckFE0RRdjYh9t4l1b34Un",
  usd_yearly: "price_1SLcZXE0RRdjYh9tvNYc9ot9",
  cny_yearly: "price_1SLclnE0RRdjYh9tix3ih4wU",
} as const;

export default function SubscriptionModal({
  isOpen,
  onOpenChange,
}: SubscriptionModalProps) {
  const { t, getLanguage } = useTranslation();
  const subscription = Store.user.subscription;
  const [plan, setPlan] = useState<SubscriptionPlan>("yearly");
  const [currency, setCurrency] = useState<Currency>("usd");
  const [isProcessing, setIsProcessing] = useState(false);

  const getPriceId = (): string => {
    if (currency === "usd") {
      return plan === "monthly" ? PRICE_IDS.usd_monthly : PRICE_IDS.usd_yearly;
    } else {
      return plan === "monthly" ? PRICE_IDS.cny_monthly : PRICE_IDS.cny_yearly;
    }
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    
    try {
      const priceId = getPriceId();
      
      logger.info(
        {
          module: "subscription",
          operation: "create_checkout",
          data: { priceId, plan, currency },
        },
        "Creating checkout session"
      );

      // 获取认证token（从 Supabase session）
      const accessToken = await authOperations.getAccessToken();
      
      if (!accessToken) {
        logger.error(
          {
            module: "subscription",
            operation: "create_checkout",
          },
          "User not authenticated"
        );
        alert(t("subscription.notLoggedIn") || "Please login first");
        setIsProcessing(false);
        onOpenChange(false); // 关闭模态框
        return;
      }

      // 调用后端API创建支付会话
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://xwanai-back-rmxvs5nflq-as.a.run.app";
      
      const response = await fetch(`${apiBaseUrl}/api/stripe/v1/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create checkout session");
      }

      const data = await response.json();
      
      logger.success(
        {
          module: "subscription",
          operation: "create_checkout",
          data: { sessionId: data.data.session_id },
        },
        "Checkout session created"
      );

      // 跳转到Stripe支付页面
      window.location.href = data.data.checkout_url;
    } catch (error) {
      logger.error(
        {
          module: "subscription",
          operation: "create_checkout",
          error,
        },
        "Failed to create checkout session"
      );
      
      setIsProcessing(false);
      
      // 显示错误提示
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(t("subscription.error") + ": " + errorMessage);
    }
  };

  const getPlanPrice = () => {
    if (currency === "usd") {
      return plan === "monthly" ? "$11.99" : "$117.99";
    } else {
      return plan === "monthly" ? "¥59.99" : "¥599.99";
    }
  };

  const getPlanPeriod = () => {
    return plan === "monthly" ? t("subscription.perMonth") : t("subscription.perYear");
  };

  const getMonthlyEquivalent = () => {
    if (plan === "yearly") {
      return currency === "usd" ? "$9.83/月" : "¥49.99/月";
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-content1",
        backdrop: "bg-black/50 backdrop-blur-sm",
        body: "overflow-y-auto",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h2 className="text-xl sm:text-2xl font-bold">{t("subscription.title")}</h2>
              </div>
              <p className="text-xs sm:text-sm text-foreground-600 font-normal">
                {t("subscription.subtitle")}
              </p>
            </ModalHeader>

            <ModalBody className="gap-4 sm:gap-6 px-4 sm:px-6">
              {/* 当前订阅状态 */}
              {/* {subscription && subscription.subscription_status !== "free" && (
                <Card className="bg-gradient-to-r from-warning/10 to-primary/10 border-2 border-warning/30">
                  <CardBody className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {subscription.subscription_tier === "yearly" ? (
                          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-warning flex-shrink-0" />
                        ) : (
                          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-warning flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-base sm:text-lg">
                              {subscriptionAPI.formatTierName(subscription.subscription_tier, getLanguage())}
                            </p>
                            <Chip
                              size="sm"
                              color={subscription.subscription_status === "active" ? "success" : "default"}
                              variant="flat"
                              className="text-xs"
                            >
                              {subscriptionAPI.formatStatusName(subscription.subscription_status, getLanguage())}
                            </Chip>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-foreground-600">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {subscription.subscription_end_date && (
                                <>
                                  {getLanguage() === "zh" ? "到期时间：" : "Expires: "}
                                  {new Date(subscription.subscription_end_date).toLocaleDateString(getLanguage() === "zh" ? "zh-CN" : "en-US")}
                                </>
                              )}
                            </span>
                          </div>
                          {subscription.days_remaining !== null && subscription.days_remaining > 0 && (
                            <p className="text-xs text-warning mt-1">
                              {getLanguage() === "zh" 
                                ? `剩余 ${subscription.days_remaining} 天` 
                                : `${subscription.days_remaining} days remaining`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )} */}
              
              {/* 订阅周期选择 */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                  {t("subscription.choosePlan")}
                </h3>
                <RadioGroup
                  value={plan}
                  onValueChange={(value) => setPlan(value as SubscriptionPlan)}
                  classNames={{
                    wrapper: "gap-2 sm:gap-3",
                  }}
                >
                  <Card
                    isPressable
                    onPress={() => setPlan("yearly")}
                    className={`${
                      plan === "yearly"
                        ? "border-2 border-primary bg-primary/5"
                        : "border-2 border-default-200"
                    } transition-all`}
                  >
                    <CardBody className="flex-row items-center justify-between p-3 sm:p-4 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <Radio value="yearly" className="flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base">
                            {t("subscription.yearlyPlan")}
                          </p>
                          <p className="text-xs sm:text-sm text-success">
                            {t("subscription.save20")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg sm:text-xl font-bold text-primary">
                          {currency === "usd" ? "$117.99" : "¥599.99"}
                        </p>
                        <p className="text-xs text-foreground-500">
                          {currency === "usd" ? "$9.83/月" : "¥49.99/月"}
                        </p>
                      </div>
                    </CardBody>
                  </Card>

                  <Card
                    isPressable
                    onPress={() => setPlan("monthly")}
                    className={`${
                      plan === "monthly"
                        ? "border-2 border-primary bg-primary/5"
                        : "border-2 border-default-200"
                    } transition-all`}
                  >
                    <CardBody className="flex-row items-center justify-between p-3 sm:p-4 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <Radio value="monthly" className="flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base">
                            {t("subscription.monthlyPlan")}
                          </p>
                          <p className="text-xs sm:text-sm text-foreground-500">
                            {t("subscription.flexible")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg sm:text-xl font-bold">
                          {currency === "usd" ? "$11.99" : "¥59.99"}
                        </p>
                        <p className="text-xs text-foreground-500">
                          {t("subscription.perMonth")}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </RadioGroup>
              </div>

              {/* 货币选择 */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                  {t("subscription.chooseCurrency")}
                </h3>
                <RadioGroup
                  value={currency}
                  onValueChange={(value) => setCurrency(value as Currency)}
                  orientation="horizontal"
                  classNames={{
                    wrapper: "gap-2 sm:gap-3",
                  }}
                >
                  <Card
                    isPressable
                    onPress={() => setCurrency("usd")}
                    className={`${
                      currency === "usd"
                        ? "border-2 border-primary bg-primary/5"
                        : "border-2 border-default-200"
                    } transition-all flex-1`}
                  >
                    <CardBody className="flex-row items-center gap-2 p-3 sm:p-4">
                      <Radio value="usd" className="flex-shrink-0" />
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base">USD ($)</span>
                    </CardBody>
                  </Card>

                  <Card
                    isPressable
                    onPress={() => setCurrency("cny")}
                    className={`${
                      currency === "cny"
                        ? "border-2 border-primary bg-primary/5"
                        : "border-2 border-default-200"
                    } transition-all flex-1`}
                  >
                    <CardBody className="flex-row items-center gap-2 p-3 sm:p-4">
                      <Radio value="cny" className="flex-shrink-0" />
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base">CNY (¥)</span>
                    </CardBody>
                  </Card>
                </RadioGroup>
                <p className="text-xs text-foreground-500 mt-2">
                  {currency === "cny"
                    ? t("subscription.cnySupport")
                    : t("subscription.usdSupport")}
                </p>
              </div>

              {/* 功能列表 */}
              <div className="bg-content2 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                  {t("subscription.features")}
                </h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {[
                    t("subscription.feature1"),
                    t("subscription.feature2"),
                    t("subscription.feature3"),
                    t("subscription.feature4"),
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ModalBody>

            <ModalFooter className="px-4 sm:px-6 pb-4 sm:pb-6 gap-2 sm:gap-3 flex-col sm:flex-row">
              <Button 
                variant="light" 
                onPress={onClose} 
                isDisabled={isProcessing}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {t("common.cancel")}
              </Button>
              <Button
                color="primary"
                onPress={handleSubscribe}
                isLoading={isProcessing}
                startContent={
                  !isProcessing && <Sparkles className="w-4 h-4" />
                }
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isProcessing
                  ? t("subscription.processing")
                  : `${t("subscription.subscribe")} ${getPlanPrice()}${getPlanPeriod()}`}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

