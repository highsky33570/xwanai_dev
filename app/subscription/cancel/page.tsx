"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Button,
} from "@heroui/react";
import { XCircle, Home, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/utils/translations";
import { logger } from "@/lib/utils/logger";
import { useEffect } from "react";

export default function SubscriptionCancelPage() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    logger.info(
      {
        module: "subscription",
        operation: "cancel_page",
      },
      "User landed on cancel page"
    );
  }, []);

  const handleGoHome = () => {
    logger.info(
      {
        module: "subscription",
        operation: "return_home_from_cancel",
      },
      "User returning to home page from cancel"
    );
    router.push("/");
  };

  const handleRetry = () => {
    logger.info(
      {
        module: "subscription",
        operation: "retry_subscription",
      },
      "User retrying subscription"
    );
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardBody className="p-8 md:p-12 text-center space-y-6">
          {/* 取消图标 */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-warning/20 blur-2xl rounded-full" />
              <XCircle className="relative w-24 h-24 text-warning" />
            </div>
          </div>

          {/* 取消标题 */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("subscription.cancelTitle")}
            </h1>
            <p className="text-lg text-foreground-600">
              {t("subscription.cancelSubtitle")}
            </p>
          </div>

          {/* 取消信息 */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 space-y-3">
            <p className="text-foreground">
              {t("subscription.cancelMessage")}
            </p>
          </div>

          {/* 提示信息 */}
          <div className="space-y-2 text-sm text-foreground-600">
            <p>{t("subscription.cancelNote1")}</p>
            <p>{t("subscription.cancelNote2")}</p>
          </div>

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              color="primary"
              size="lg"
              onPress={handleRetry}
              startContent={<RefreshCw className="w-5 h-5" />}
              className="font-semibold flex-1"
            >
              {t("subscription.tryAgain")}
            </Button>
            <Button
              variant="bordered"
              size="lg"
              onPress={handleGoHome}
              startContent={<Home className="w-5 h-5" />}
              className="font-semibold flex-1"
            >
              {t("subscription.returnHome")}
            </Button>
          </div>

          {/* 装饰性分割线 */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex-1 h-px bg-divider" />
            <XCircle className="w-4 h-4 text-warning" />
            <div className="flex-1 h-px bg-divider" />
          </div>

          {/* 额外信息 */}
          <p className="text-xs text-foreground-500">
            {t("subscription.cancelFooter")}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

