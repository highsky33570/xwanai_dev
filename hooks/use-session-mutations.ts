import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "./use-data-queries";
import { toast } from "./use-toast";
import { Store } from "@/store";
import { formatBirthdayToISO } from "@/lib/utils/dateFormatter";
import { getGreetingByMode } from "@/lib/utils/greetings";
import { translations, type Language } from "@/lib/utils/translations";

// Helper function to get translated text
const t = (key: string): string => {
  const language = (typeof window !== 'undefined' ? localStorage.getItem("language") : null) as Language || "en";
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};

interface CreateSessionParams {
  mode: string;
  title?: string;
  greeting?: string;
}

interface CreatePersonalSessionParams {
  name: string;
  birthday: string;
  birthplace: string;
  gender: "male" | "female" | "lgbtq";
  saveToLibrary: boolean;
  mbti?: string;
}

/**
 * 创建普通 session 的 mutation
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateSessionParams) => {
      const greeting = params.greeting || getGreetingByMode(params.mode);
      return apiClient.createSession({
        mode: params.mode,
        title: params.title || "New Chat",
        greeting,
      });
    },
    onSuccess: (response, variables) => {
      const sessionId = response.data.session_id;

      // 保存到 store
      Store.session.createAndSwitchSession(
        sessionId,
        variables.mode,
        variables.title || "New Chat"
      );

      // 刷新当前用户的 sessions 列表
      const userId = Store.user.currentUser?.id;
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.userSessions(userId),
        });
      }
    },
    onError: (error: any) => {
      // 🎯 解析配额限制错误
      let errorMessage = "创建聊天会话失败，请重试";
      let errorTitle = "创建失败";
      let variant: "destructive" | "warning" = "destructive";
      
      // APIError 将错误数据存储在 response 字段中
      // 后端返回格式: { code: 403, message: { code: "USAGE_LIMIT_EXCEEDED", message: "...", ... } }
      const errorDetail = error?.response?.message || error?.response?.detail || error?.detail;
      
      if (errorDetail) {
        // 后端返回的 UsageLimitError 格式
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
    },
  });
}

/**
 * 创建个人解读 session 的 mutation
 */
export function useCreatePersonalSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePersonalSessionParams) => {
      // 1. 创建 basic bazi
      const payload = {
        name: data.name,
        gender: data.gender,
        birthday_utc8: formatBirthdayToISO(data.birthday),
        longitude: 139.0,
        birthplace: data.birthplace,
        mbti: data.mbti || "",
        mode: "personal" as const,
      };

      const basicBaziId = await apiClient.createBasicBazi(payload);

      // 2. 创建 session
      const sessionResponse = await apiClient.createSession({
        mode: "personal",
        title: `Personal Reading - ${data.name}`,
      });

      return {
        sessionId: sessionResponse.data.session_id,
        basicBaziId,
        name: data.name,
      };
    },
    onSuccess: (result) => {
      // 保存到 store
      Store.session.createAndSwitchSession(
        result.sessionId,
        "personal",
        `Personal Reading - ${result.name}`,
        undefined,
        result.basicBaziId
      );

      // 刷新 sessions 列表
      const userId = Store.user.currentUser?.id;
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.userSessions(userId),
        });
      }
    },
    onError: (error: any) => {
      // 🎯 解析配额限制错误
      let errorMessage = "创建个人解读失败，请重试";
      let errorTitle = "创建失败";
      let variant: "destructive" | "warning" = "destructive";
      
      // APIError 将错误数据存储在 response 字段中
      // 后端返回格式: { code: 403, message: { code: "USAGE_LIMIT_EXCEEDED", message: "...", ... } }
      const errorDetail = error?.response?.message || error?.response?.detail || error?.detail;
      
      if (errorDetail) {
        // 后端返回的 UsageLimitError 格式
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
    },
  });
}

interface CreateCharacterChatSessionParams {
  character_id: string;
  character_name: string;
  mode?: string;
}

/**
 * 创建角色对话 session 的 mutation
 */
export function useCreateCharacterChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCharacterChatSessionParams) => {
      const mode = params.mode || "character_agent";
      // 🌐 获取当前语言设置
      const currentLanguage = typeof window !== 'undefined' ? localStorage.getItem("language") : null;
      const languageCode = currentLanguage === "en" ? "en_US" : "zh_CN";

      const greeting = getGreetingByMode(mode, params.character_name, currentLanguage || undefined);

      const response = await apiClient.createCharacterChatSession({
        character_id: params.character_id,
        title: `与${params.character_name}的灵魂对话`,
        mode,
        greeting,
        language: languageCode,
      });


      // 🔧 修复：后端返回的是 response.data，而不是 response.data.data
      const sessionId = response.data.session_id;

      return {
        sessionId: sessionId,
        characterId: params.character_id,
        characterName: params.character_name,
        mode,
        rewardAutoClaimed: response.data.reward_auto_claimed  // 🎁 奖励自动领取标志
      };
    },
    onSuccess: async (result, variables, context) => {

      // 保存到 store 并切换 session（这会触发路由跳转）
      Store.session.createAndSwitchSession(
        result.sessionId,
        result.mode,
        `与${result.characterName}的灵魂对话`
      );

      // 刷新当前用户的 sessions 列表
      const userId = Store.user.currentUser?.id;
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.userSessions(userId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.characterSessions(result.characterId, userId),
        });
      }

      // 🎁 检查并刷新订阅状态（如果任务完成并自动领取了奖励）
      if (result.rewardAutoClaimed) {
        const { checkAndRefreshSubscription } = await import("@/lib/utils/subscription-helper");
        await checkAndRefreshSubscription("character-chat-session", result.rewardAutoClaimed);
      }

      // 🎯 返回 sessionId 供组件使用
      return result.sessionId;
    },
    onError: (error) => {
      console.error("🚨 [Character Chat Session Creation Failed]:", error);
      toast({
        title: "创建失败",
        description: "启动角色对话失败，请稍后再试",
        variant: "destructive",
      });
    },
  });
}

interface CreateHepanSessionParams {
  character_ids: string[];
  character_names: string[];
  title?: string;
}

/**
 * 创建合盘对话 session 的 mutation
 */
export function useCreateHepanSession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: CreateHepanSessionParams) => {
      // 🌐 获取当前语言设置
      const currentLanguage = typeof window !== 'undefined' ? localStorage.getItem("language") : null;
      const languageCode = currentLanguage === "en" ? "en_US" : "zh_CN";

      const response = await apiClient.createHepanSession({
        character_ids: params.character_ids,
        title: params.title || `${params.character_names.join("与")}的合盘分析`,
        language: languageCode,
      });

      const result = {
        sessionId: response.session_id,
        characters: response.characters,
        title: response.title,
        rewardAutoClaimed: response.reward_auto_claimed  // 🎁 奖励自动领取标志
      };

      return result;
    },
    onSuccess: async (result) => {
      // 保存到 store
      Store.session.createAndSwitchSession(
        result.sessionId,
        "hepan",
        result.title
      );

      // 刷新当前用户的 sessions 列表
      const userId = Store.user.currentUser?.id;
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.userSessions(userId),
        });
      }

      // 🎁 检查并刷新订阅状态（如果任务完成并自动领取了奖励）
      if (result.rewardAutoClaimed) {
        const { checkAndRefreshSubscription } = await import("@/lib/utils/subscription-helper");
        await checkAndRefreshSubscription("hepan-session", result.rewardAutoClaimed);
      }

      // 🚀 路由跳转到聊天页面
      router.push(`/chat/${result.sessionId}?just_created=true`);

      toast({
        title: "创建成功",
        description: "合盘对话已创建，正在跳转...",
      });
    },
    onError: (error: any) => {
      console.error("🚨 [Hepan Session Creation Failed]:", error);
      toast({
        title: "创建失败",
        description: error?.message || "创建合盘对话失败，请稍后再试",
        variant: "destructive",
      });
    },
  });
}
