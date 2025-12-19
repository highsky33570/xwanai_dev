"use client";
import { Card, CardBody, Button } from "@heroui/react";
import { MessageCircle, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/utils/translations";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { authOperations } from "@/lib/supabase/auth";
import { logger } from "@/lib/utils/logger";
 

// 🔧 动态导入Modal组件，优化性能
const ModeSelectionModal = dynamic(
  () => import("@/components/modals/mode-selection-modal"),
  { ssr: false }
);

export default function ChatIdlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [showModeModal, setShowModeModal] = useState(false);
  const [defaultTab, setDefaultTab] = useState<string | null>(null);
  const [fromTask, setFromTask] = useState(false);  // 🎯 标记是否来自任务

  // 🔒 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authOperations.getCurrentUser();
      if (!currentUser) {
        logger.warn({ module: "chat-page", operation: "checkAuth" }, "User not logged in, redirecting to login");
        const { toast } = await import("sonner");
        toast.error(t("chat.loginRequired") || "请先登录以使用聊天功能");
        router.push("/login");
      }
    };
    checkAuth();
  }, [router, t]);

  // 🎯 检查 URL 参数，处理任务引导
  useEffect(() => {
    const task = searchParams.get('task');
    
    if (!showModeModal) { // 添加条件避免重复触发
      if (task === 'personal') {
        // 任务1：个人命理档案 -> 自动选择 personal 标签页
        setDefaultTab('personal');
        setFromTask(true);  // 🎯 标记来自任务
        setShowModeModal(true);
        // 清除 URL 参数，避免重复触发
        router.replace('/chat', { scroll: false });
      } else if (task === 'character') {
        // 任务2：创建角色 -> 打开模式选择对话框（默认 modes 标签页）
        setDefaultTab('modes');  // 默认显示模式选择标签页
        setFromTask(true);  // 🎯 标记来自任务
        setShowModeModal(true);
        // 清除 URL 参数，避免重复触发
        router.replace('/chat', { scroll: false });
      }
    }
  }, [searchParams, router, showModeModal]);

  // 🎯 当对话框关闭时，清除 defaultTab 和 fromTask
  const handleModalOpenChange = (isOpen: boolean) => {
    setShowModeModal(isOpen);
    if (!isOpen) {
      setDefaultTab(null); // 清除默认标签，下次打开时恢复默认
      setFromTask(false);  // 清除任务标记
    }
  };

  return (
    <div
      className="flex h-full w-full items-center justify-center relative"
      style={{
        // backgroundImage: "url(/background_top.svg)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top center",
        backgroundSize: "cover",
      }}
    >
      {/* Center Idle Panel */}
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="max-w-xl w-full bg-content2/80 backdrop-blur-sm border border-foreground/10 shadow-xl relative">
          

          <CardBody className="p-10 text-center space-y-4">
            <MessageCircle className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-2xl font-semibold text-foreground">
              Start a New Reading
            </h2>
            <p className="text-foreground-600">
              Choose a mode to begin or continue an existing session from the
              left sidebar.
            </p>
            <div className="pt-2">
              <Button
                color="primary"
                startContent={<Sparkles className="w-4 h-4" />}
                onPress={() => setShowModeModal(true)} // 🔧 改为弹窗
              >
                New Reading
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 🔧 模式选择Modal */}
      <ModeSelectionModal
        isOpen={showModeModal}
        onOpenChange={handleModalOpenChange}
        defaultTab={defaultTab}
        fromTask={fromTask}
      />

      
    </div>
  );
}
