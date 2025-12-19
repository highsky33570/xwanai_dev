"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getGreetingByMode } from "@/lib/utils/greetings";
import { useTranslation } from "@/lib/utils/translations";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-data-queries";
import { Store } from "@/store";
import { toast } from "@/hooks/use-toast";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { truncate } from "fs";

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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionCreationStep, setSessionCreationStep] = useState("");
  const cards = [
    {
      key: "create_character_real_custom",
      title: "凡尘映照",
      desc: "输入真实人物的生辰信息），精准映照其人生蓝图。如缺少时辰，AI将结合生平智能推演。",
      image: "/charactor_create_modal/1.png",
    },
    {
      key: "create_character_real_guess",
      title: "命运导航",
      desc: "跟随AI的五步引导，从核心性格到人生终局，为你的原创角色在真实时间中锚定独一无二的命运时刻。",
      image: "/charactor_create_modal/2.png",
    },
    {
      key: "create_character_virtual_custom",
      title: "虚空织命",
      desc: "在你构想的虚构世界里，从一个概念、几个词出发，通过与AI对话，反向编织出角色的完整命理灵魂",
      image: "/charactor_create_modal/3.png",
    },
    {
      key: "create_character_virtual_search_or_guess",
      title: "传说锻造",
      desc: "指定已存在的虚拟角色，与AI达成解读共识，AI将为其逆向锻造出深度契合原作的命理档案与灵魂视角。",
      image: "/charactor_create_modal/4.png",
    },
  ];

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
      setIsCreatingSession(true);
      setSessionCreationStep(t("modes.initializingAI"));
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
        await router.push(
          `/chat/${sessionResponse.data.session_id}?just_created=true`
        );
      }
      setIsCreatingSession(false);
      onOpenChange(false);
    } catch (error: any) {
      // 🎯 解析配额限制错误并显示给用户
      let errorMessage = "创建会话失败，请重试";
      let errorTitle = "创建失败";
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
      setIsCreatingSession(false);

    } finally {
      setIsCreatingSession(false);
      setSessionCreationStep("");

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
      let errorMessage = "创建个人解读失败，请重试";
      let errorTitle = "创建失败";
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
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="5xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/60",
        base: "bg-white text-black border border-gray-200",
        closeButton: isCreatingSession ? "hidden" : "z-50",
      }}
      // hideCloseButton={true}
      isDismissable={!isCreatingSession}
      hideCloseButton={isCreatingSession}
    >
      <ModalContent>
        {(onClose) => (
          <div className="relative overflow-hidden rounded-2xl p-10">
            {/* Session Creation Loading Overlay */}
            {isCreatingSession && (
              <div className="absolute inset-0 z-50 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl flex items-center justify-center">
                <div className="text-center space-y-8 p-8 max-w-md mx-auto">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-20 h-20 border-4 border-primary/20 rounded-full animate-spin">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1"></div>
                    </div>
                    <div
                      className="absolute w-14 h-14 border-3 border-secondary/30 rounded-full animate-spin"
                      style={{
                        animationDirection: "reverse",
                        animationDuration: "2s",
                      }}
                    >
                      <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-0.5"></div>
                    </div>
                    <div className="w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {sessionCreationStep || t("modes.creatingSession")}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse shadow-sm"></div>
                          <span className="text-sm font-medium">
                            {t("modes.initializingAI")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary/70 to-secondary/70 animate-pulse delay-300 shadow-sm"></div>
                          <span className="text-sm font-medium">
                            {t("modes.creatingSession")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3 text-foreground-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary/50 to-secondary/50 animate-pulse delay-500 shadow-sm"></div>
                          <span className="text-sm font-medium">
                            {t("modes.sessionComplete")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-foreground-500 font-light">
                        {t("modes.preparingReading")}
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary/30 rounded-full animate-ping delay-1000"></div>
                    <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary/30 rounded-full animate-ping delay-1500"></div>
                    <div className="absolute top-1/2 left-1/6 w-0.5 h-0.5 bg-primary/40 rounded-full animate-ping delay-2000"></div>
                    <div className="absolute top-1/3 right-1/6 w-0.5 h-0.5 bg-secondary/40 rounded-full animate-ping delay-2500"></div>
                  </div>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-[url('/charactor_create_modal/background-modal.png')] bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none" />
            <ModalHeader className="relative z-10 flex flex-col gap-1 items-center text-center">
              <div className="text-4xl font-semibold">选择您的角色创建模式</div>
              <div className="text-md text-gray-500">选择一种类型以继续。每种模式都提供了与角色互动的独特方式。</div>
            </ModalHeader>
            <ModalBody className="relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mx-auto">
                {cards.map((c, idx) => (
                  <div key={c.key} className="flex flex-col items-center gap-2 max-w-[180px]">
                    <div className="text-black text-xl">{c.title}</div>
                    <button
                      className={`relative w-full rounded-2xl overflow-hidden group text-left border ${selectedKey === c.key ? "border-[#EB7020] shadow-[0_0_0_2px_#EB7020]" : "border-gray-200"}
                      hover:shadow-lg hover:border-[#EB7020] transition-all`}
                      onClick={() => handleModeSelect(c.key)}
                      style={{ height: "300px" }}
                    >
                      <div className="relative z-10 h-full flex flex-col justify-end bg-white">
                        <img src={c.image} alt="" className="absolute inset-0 w-[180px] h-[180px] object-cover " />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[180px] bg-gradient-to-b from-transparent via-white/20 to-white"></div>
                        <div className="text-black text-md leading-relaxed px-4 pb-4">
                          {c.desc}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </ModalBody>
            {/* <ModalFooter className="relative z-10">
              <Button variant="bordered" onPress={() => onOpenChange(false)}>取消</Button>
              <Button color="primary" isDisabled={!selectedKey} onPress={() => selectedKey && handleModeSelect(selectedKey)}>继续</Button>
            </ModalFooter> */}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
