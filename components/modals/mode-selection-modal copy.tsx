"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getGreetingByMode } from "@/lib/utils/greetings";
import { useTranslation } from "@/lib/utils/translations";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-data-queries";
import { Store } from "@/store";
import { toast } from "@/hooks/use-toast";

// 动态导入原有的Modal组件，保证性能
const OriginalModeSelectionModal = dynamic(
  () => import("@/components/chat/mode-selection-modal"),
  {
    ssr: false,
    loading: () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { t } = useTranslation();
      return (
        <div className="flex items-center justify-center p-8">
          {t("modes.loading")}
        </div>
      );
    },
  }
);

interface ModeSelectionModalWrapperProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // 可选的自定义完成回调
  onSessionCreated?: (sessionId: string) => void;
  // 可选的默认选中的标签页（用于任务引导，只切换标签不自动创建）
  defaultTab?: string | null;
  // 🎯 是否来自任务引导（创建的session不计入额度）
  fromTask?: boolean;
}

export default function ModeSelectionModalWrapper({
  isOpen,
  onOpenChange,
  onSessionCreated,
  defaultTab,
  fromTask = false,
}: ModeSelectionModalWrapperProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 🎯 当对话框打开时，自动刷新使用统计数据
  useEffect(() => {
    if (isOpen) {
      const userId = Store.user.userId;
      if (userId) {
        // 🎯 使用 refetchQueries 强制重新获取，不受 staleTime 影响
        queryClient.refetchQueries({
          queryKey: queryKeys.usageStats(userId),
        });
      }
    }
  }, [isOpen, queryClient]);

  const handleModeSelect = useCallback(async (mode: string) => {
    try {
      // 🌐 获取当前语言设置
      const currentLanguage =
        typeof window !== "undefined" ? localStorage.getItem("language") : null;
      const languageCode = currentLanguage === "en" ? "en_US" : "zh_CN";

      // 🔧 使用与原页面完全相同的逻辑，并传递语言参数
      const greeting = getGreetingByMode(
        mode,
        undefined,
        currentLanguage || undefined
      );

      const sessionResponse = await apiClient.createSession({
        mode: mode,
        title: "New Chat",
        greeting: greeting,
        language: languageCode,
        from_task: fromTask,  // 🎯 传递任务标记
      });

      // 🎯 刷新会话列表缓存（usageStats 已在打开对话框时刷新）
      const userId = Store.user.userId;
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userSessions(userId),
        });
      }

      // 如果有自定义回调就使用，否则默认跳转
      if (onSessionCreated) {
        onSessionCreated(sessionResponse.data.session_id);
      } else {
        router.push(
          `/chat/${sessionResponse.data.session_id}?just_created=true`
        );
      }
    } catch (error: any) {
      // 🎯 解析配额限制错误并显示给用户
      let errorMessage = t("modes.createSessionFailed");
      let errorTitle = t("modes.createFailed");
      let variant: "destructive" | "warning" = "destructive";
      
      // APIError 将错误数据存储在 response 字段中
      // 后端返回格式: { code: 403, message: { code: "USAGE_LIMIT_EXCEEDED", message: "...", ... } }
      const errorDetail = error?.response?.message || error?.response?.detail || error?.detail;
      
      if (errorDetail) {
        if (errorDetail.code === "USAGE_LIMIT_EXCEEDED") {
          errorTitle = t("modes.usageLimitReached");
          errorMessage = errorDetail.message || errorMessage;
          variant = "warning"; // 🎯 使用醒目的 warning 样式
        } else if (typeof errorDetail === "string") {
          errorMessage = errorDetail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: variant,
        duration: 8000, // 🎯 显示8秒，让用户有充分时间阅读
      });
    }
  }, [router, t, onSessionCreated, queryClient]);

  const handlePersonalSubmit = async (data: {
    name: string;
    birthday: string;
    birthtime?: string;
    gender: "male" | "female";
    saveToLibrary: boolean;
  }) => {
    try {
      // 🔧 新版个人算命流程：不创建 basic_bazi，直接创建 session
      // 1. 生成开场白（固定模板 + 动态数据）
      const { generatePersonalGreeting } = await import(
        "@/lib/utils/greeting-generator"
      );
      const greeting = generatePersonalGreeting({
        name: data.name,
        gender: data.gender,
        birthDate: data.birthday,
        birthTime: data.birthtime,
      });

      // 2. 创建会话 - 使用个人算命模式，直接传入 greeting 和用户信息
      // 🎯 重要：把用户信息也传给后端，保存到 session.state 里
      const sessionResponse = await apiClient.createSession({
        mode: "personal",
        title: `个人算命 - ${data.name}`,
        greeting: greeting, // 开场白保存到 events 表
        personal_info: {
          name: data.name,
          gender: data.gender,
          birth_date: data.birthday,
          birth_time: data.birthtime,
        }, // 🎯 用户信息保存到 session.state
        from_task: fromTask,  // 🎯 传递任务标记，避免计入配额
      });

      // 3. 保存到 Store
      Store.session.createAndSwitchSession(
        sessionResponse.data.session_id,
        "personal",
        `个人算命 - ${data.name}`,
        undefined,
        undefined // 不需要 basic_bazi_id
      );

      // 4. 刷新会话列表缓存（usageStats 已在打开对话框时刷新）
      const userId = Store.user.userId;
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userSessions(userId),
        });
      }

      // 5. 如果有自定义回调就使用，否则默认跳转（greeting 已由后端自动保存）
      if (onSessionCreated) {
        onSessionCreated(sessionResponse.data.session_id);
      } else {
        router.push(`/chat/${sessionResponse.data.session_id}`);
      }
    } catch (error: any) {
      // 🎯 解析配额限制错误并显示给用户
      let errorMessage = t("modes.createPersonalReadingFailed");
      let errorTitle = t("modes.createFailed");
      let variant: "destructive" | "warning" = "destructive";
      
      // APIError 将错误数据存储在 response 字段中
      // 后端返回格式: { code: 403, message: { code: "USAGE_LIMIT_EXCEEDED", message: "...", ... } }
      const errorDetail = error?.response?.message || error?.response?.detail || error?.detail;
      
      if (errorDetail) {
        if (errorDetail.code === "USAGE_LIMIT_EXCEEDED") {
          errorTitle = t("modes.usageLimitReached");
          errorMessage = errorDetail.message || errorMessage;
          variant = "warning"; // 🎯 使用醒目的 warning 样式
        } else if (typeof errorDetail === "string") {
          errorMessage = errorDetail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: variant,
        duration: 8000, // 🎯 显示8秒，让用户有充分时间阅读
      });
    }
  };

  return (
    <OriginalModeSelectionModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onModeSelect={handleModeSelect}
      onPersonalSubmit={handlePersonalSubmit}
      defaultTab={defaultTab || undefined}
    />
  );
}
