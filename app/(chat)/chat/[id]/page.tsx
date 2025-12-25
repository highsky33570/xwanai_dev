"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import { Store } from "@/store";
import ChatHistorySidebar from "@/components/navigation/chat-history-sidebar";
import {
  Card,
  CardBody,
  Button,
  Avatar,
  Textarea,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  Menu,
  X,
  MessageCircle,
  Settings,
  Star,
  Calendar,
  MapPin,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Plus,
  Clock,
  Sparkles,
  Paperclip,
  Share2,
  CheckCircle2,
} from "lucide-react";
import ModeSelectionModal from "@/components/modals/mode-selection-modal";
import SubscriptionModal from "@/components/subscription/subscription-modal";
import { useChatSSE, type ChatMessage } from "@/hooks/use-chat-sse";
import ErrorMessage from "@/components/chat/error-message";
import MessageSkeleton from "@/components/chat/message-skeleton";
import ChatHeaderSkeleton from "@/components/chat/chat-header-skeleton";
import {
  databaseOperations,
  type ChatMessageData,
} from "@/lib/supabase/database";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-data-queries";
import { apiClient } from "@/lib/api/client";
import { formatBirthdayToISO } from "@/lib/utils/dateFormatter";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "@/lib/utils/translations";
import {
  useSessionById,
  useEventsBySessionId,
  useCharacterBySession,
  useCharacterSessions,
} from "@/hooks/use-data-queries";
import { useTypewriter } from "@/hooks/use-typewriter";
import { getGreetingByMode } from "@/lib/utils/greetings";
import MarkdownWithSources from "@/components/chat/markdown-with-sources";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/utils/logger";
import DestinyTimeline from "@/components/chat/destiny-timeline";
import type { BirthInfo } from "@/hooks/use-destiny-data";
import { v4 as uuidv4 } from 'uuid';

const PaipanCard = dynamic(() => import("@/components/chat/paipan-card"), {
  ssr: false,
});
const AICard = dynamic(() => import("@/components/chat/ai-card"), {
  ssr: false,
});
const DestinyPanel = dynamic(
  () => import("@/components/sidebar/destiny-panel"),
  {
    ssr: false,
  }
);
const CharacterSelectionModal = dynamic(
  () => import("@/components/chat/character-selection-modal"),
  {
    ssr: false,
  }
);
const PaipanAttachmentCard = dynamic(
  () => import("@/components/chat/paipan-attachment-card"),
  {
    ssr: false,
  }
);

// CSS 动画样式定义
const cursorStyle = `
  .cursor-blink {
    animation: cursor-blink 1s infinite;
  }
  @keyframes cursor-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;

// 确保样式被添加到 document head
if (
  typeof document !== "undefined" &&
  !document.getElementById("cursor-style")
) {
  const style = document.createElement("style");
  style.id = "cursor-style";
  style.textContent = cursorStyle;
  document.head.appendChild(style);
}

const ChatPage = observer(() => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useParams();
  const chatId = params.id as string;
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messageOrderRef = useRef<number>(0); // 🎯 消息顺序计数器
  const [inputMessage, setInputMessage] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // 🎯 订阅对话框状态
  const {
    isOpen: isSubscriptionOpen,
    onOpen: onSubscriptionOpen,
    onOpenChange: onSubscriptionOpenChange,
  } = useDisclosure();
  // 📤 分享模式状态
  const [isShareMode, setIsShareMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [hasRestoredError, setHasRestoredError] = useState(false);
  const [greetingText, setGreetingText] = useState("");
  const [showGreetingTypewriter, setShowGreetingTypewriter] = useState(false);
  const [greetingShown, setGreetingShown] = useState(false); // 防止重复显示
  const [destinyPanelOpen, setDestinyPanelOpen] = useState(false); // 命运面板状态
  const [liunianOpen, setLiunianOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 🎯 滚动控制相关状态
  const [isUserAtBottom, setIsUserAtBottom] = useState(true); // 用户是否在底部
  const shouldAutoScrollRef = useRef(true); // 是否应该自动滚动（用于发送消息后强制滚动）
  const lastMessageCountRef = useRef(0); // 上一次的消息数量

  // 命盘附件相关状态
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [attachedPaipans, setAttachedPaipans] = useState<
    Array<{
      id: string;
      name: string;
      gender?: string;
      birthday?: string;
      paipanData?: any;
    }>
  >([]);

  // 🎯 对话回合数限制相关状态
  const [turnStats, setTurnStats] = useState<{
    turn_count: number;
    turn_limit: number;
    limit_reached: boolean;
    has_report: boolean;
    is_premium: boolean;
  } | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // 🔧 新架构：移除复杂的showGreetingForMode函数，逻辑已简化

  // 🔧 新架构：移除saveGreetingToDatabase函数，greeting在后端创建时已保存

  // 打字机效果Hook
  const typewriter = useTypewriter({
    text: greetingText,
    speed: 15, // 15ms per character for faster greeting effect
    startDelay: 300, // 300ms delay before starting
    onComplete: () => {
      // 🔧 新架构：greeting已在后端保存，无需前端保存
    },
  });

  // 🔍 调试typewriter状态
  useEffect(() => {
  }, [
    greetingText,
    typewriter.displayText,
    typewriter.isTyping,
    typewriter.isComplete,
    showGreetingTypewriter,
  ]);

  // 导入React Query hooks
  const {
    data: sessionData,
    isLoading: sessionLoading,
    error: sessionError,
  } = useSessionById(chatId !== "new" ? chatId : undefined);
  const {
    data: sessionEvents,
    isLoading: eventsLoading,
    error: eventsError,
  } = useEventsBySessionId(chatId !== "new" ? chatId : undefined);

  // 🎯 获取 session 关联的 character
  const {
    data: sessionCharacter,
    isLoading: characterLoading,
    error: characterError,
  } = useCharacterBySession(chatId !== "new" ? chatId : undefined);

  const birthInfoForTimeline = useMemo(() => {
    const cache = (sessionData?.state as any)?.character_cache;
    const bt = cache?.birth_time;
    if (!bt) return null as BirthInfo | null;
    let year: number, month: number, day: number, hour: number, minute: number;
    if (typeof bt === "string") {
      const m = bt.match(/(\d{4})-(\d{1,2})-(\d{1,2})[\sT](\d{1,2}):(\d{1,2})/);
      if (m) {
        year = parseInt(m[1]);
        month = parseInt(m[2]);
        day = parseInt(m[3]);
        hour = parseInt(m[4]);
        minute = parseInt(m[5]);
      } else {
        const d = new Date(bt);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
        hour = d.getHours();
        minute = d.getMinutes();
      }
    } else {
      const d = new Date(bt);
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
      hour = d.getHours();
      minute = d.getMinutes();
    }
    const gender = ((cache?.gender === "female") ? "female" : "male") as BirthInfo["gender"];
    return { year, month, day, hour, minute, gender } as BirthInfo;
  }, [sessionData]);

  // 🎯 当 sessionCharacter 变化时，自动更新 currentCharacter
  useEffect(() => {
    if (sessionCharacter) {
      setCurrentCharacter(sessionCharacter);
    }
  }, [sessionCharacter]);

  // 🎯 加载对话回合数统计
  useEffect(() => {
    if (chatId === "new" || !sessionExists) return;

    const loadTurnStats = async () => {
      try {
        const { conversationLimitAPI } = await import("@/lib/api/conversation-limit");
        const stats = await conversationLimitAPI.getSessionTurnStats(chatId);
        if (stats) {
          setTurnStats(stats);

          // 🎯 检查是否达到限制（后端数据为准）
          const limitReached = stats.limit_reached || (stats.turn_limit !== -1 && stats.turn_count >= stats.turn_limit);

          // 🎯 直接使用后端返回的状态，后端是权威数据源
          setIsLimitReached(limitReached);
        }
      } catch (error) {
        logger.warn({ module: "chat", operation: "loadTurnStats", error }, "Failed to load turn stats");
      }
    };

    loadTurnStats();

    // 🎯 监听页面可见性，切换回来时重新加载状态
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTurnStats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [chatId, sessionExists]); // 🎯 移除 messages.length 依赖，只在页面加载和会话变化时检查

  // 🎯 获取当前角色的所有sessions
  const userId = Store.user.userId;
  const {
    data: characterSessions = [],
    isLoading: characterSessionsLoading,
    refetch: refetchCharacterSessions,
  } = useCharacterSessions(currentCharacter?.id, userId);

  // 🔄 只在 chatId 变化时加载消息（页面切换）
  useEffect(() => {
    if (chatId === "new") return;

    // 关闭移动端侧边栏（如果打开）
    try {
      document.dispatchEvent(new Event("closeChatHistorySidebar"));
    } catch { }

    // 重置打招呼语相关状态
    setGreetingShown(false);
    setShowGreetingTypewriter(false);
    setGreetingText("");

    // 🎯 从 React Query 加载消息（只在 chatId 变化时）
    if (sessionData !== undefined) {
      if (sessionData) {
        setSessionInfo(sessionData);
        setSessionExists(true);

        if (sessionEvents && sessionEvents.length > 0) {
          const chatMessages =
            databaseOperations.convertEventsToMessages(sessionEvents);

          // 🎯 智能合并：保留当前正在输入的消息，合并数据库消息
          setMessages((prev) => {

            // 如果当前有未完成的消息（正在流式输入），保留它们
            const incompleteMessages = prev.filter((m) => !m.isComplete);

            // 🎯 关键修复：数据库消息已按 timestamp ASC 排序，直接使用数据库顺序
            const dbMessageIds = new Set(chatMessages.map((m) => m.id));

            // 为数据库消息分配顺序号（按数据库返回的顺序）
            const messagesWithOrder = chatMessages.map((msg, index) => ({
              ...msg,
              _order: index,
            }));

            // 找出不在数据库中的未完成消息（新的实时消息）
            const newIncompleteMessages = incompleteMessages.filter(
              (m) => !dbMessageIds.has(m.id)
            );

            // 将新的实时消息追加到最后
            newIncompleteMessages.forEach((msg, index) => {
              messagesWithOrder.push({
                ...msg,
                _order: chatMessages.length + index,
              });
            });

            // 更新全局计数器
            messageOrderRef.current = messagesWithOrder.length;

            return messagesWithOrder;
          });
        } else {
          setMessages([]);
        }
      } else {
        setSessionExists(false);
      }
    }
  }, [chatId]); // ✅ 只依赖 chatId

  // 🎯 监听 sessionEvents 初次加载完成（解决打招呼语问题）
  const hasLoadedEventsRef = useRef(false);
  useEffect(() => {
    // 只在首次加载 events 时更新 messages
    if (chatId === "new") return;
    if (hasLoadedEventsRef.current) return;
    if (!sessionEvents) return;

    // 标记已加载
    hasLoadedEventsRef.current = true;

    // 更新消息列表（首次加载）
    if (sessionEvents.length > 0) {
      const chatMessages =
        databaseOperations.convertEventsToMessages(sessionEvents);

      // 🎯 智能合并：数据库消息按顺序，实时消息追加在后
      setMessages((prev) => {
        const incompleteMessages = prev.filter((m) => !m.isComplete);
        const dbMessageIds = new Set(chatMessages.map((m) => m.id));

        // 为数据库消息分配顺序号（按数据库返回的顺序）
        const messagesWithOrder = chatMessages.map((msg, index) => ({
          ...msg,
          _order: index,
        }));

        // 找出不在数据库中的未完成消息（新的实时消息）
        const newIncompleteMessages = incompleteMessages.filter(
          (m) => !dbMessageIds.has(m.id)
        );

        // 将新的实时消息追加到最后
        newIncompleteMessages.forEach((msg, index) => {
          messagesWithOrder.push({
            ...msg,
            _order: chatMessages.length + index,
          });
        });

        // 更新全局计数器
        messageOrderRef.current = messagesWithOrder.length;

        return messagesWithOrder;
      });
    }
  }, [sessionEvents, chatId]);

  // 🎯 chatId 变化时重置标记和顺序计数器
  useEffect(() => {
    hasLoadedEventsRef.current = false;
    messageOrderRef.current = 0; // 重置消息顺序计数器
  }, [chatId]);

  // 🔄 更新本地 sessionInfo 状态 - 不触发消息重新加载
  useEffect(() => {
    if (chatId === "new" || !sessionData) return;
    setSessionInfo(sessionData);
    setSessionExists(true);
  }, [chatId, sessionData]); // ✅ 只更新 sessionInfo，不影响消息

  // 🔄 更新 Store 中的 session 信息（标题等）
  useEffect(() => {
    if (chatId === "new" || !sessionData) return;

    Store.session.switchSession(chatId, {
      mode: (sessionData as any).mode || "chat",
      title: (sessionData as any).title || "Chat",
      character: currentCharacter,
    });
  }, [chatId, sessionData, currentCharacter]); // ✅ 独立更新 Store，不影响消息

  // 设置加载状态
  useEffect(() => {
    const isNewlyCreated = sessionStorage.getItem(`new_session_${chatId}`);
    if (chatId !== "new" && !isNewlyCreated) {
      setIsLoadingSession(sessionLoading || eventsLoading);
    } else {
      setIsLoadingSession(false);
    }
  }, [chatId, sessionLoading, eventsLoading]);

  // 处理错误
  useEffect(() => {
    if (sessionError || eventsError) {
      console.error("Error loading session data:", sessionError || eventsError);
      setSessionExists(false);
      setIsLoadingSession(false);
    }
  }, [sessionError, eventsError]);

  // 🚨 错误消息现在直接在消息列表中智能渲染，无需额外检查

  // 🔄 检查是否已恢复错误状态（Store 会自动处理恢复）
  useEffect(() => {
    if (chatId !== "new" && Store.session.currentError && !hasRestoredError) {
      // 检查当前错误是否属于这个 session
      if (Store.session.hasPersistedError(chatId)) {
        setHasRestoredError(true);
      }
    }
  }, [chatId, Store.session.currentError, hasRestoredError]);

  // Initialize chat SSE hook
  const {
    sendMessage: sendSSEMessage,
    isLoading,
    currentAssistantMessage,
    currentThinkingMessage, // 🧠 添加 thinking 消息
    sessionId,
    lastError,
    retryLastMessage,
    resumeConversation,
  } = useChatSSE({
    initialSessionId: chatId !== "new" ? chatId : null,
    // 🎯 提供获取当前mode的函数（用于重试）
    getCurrentMode: () => Store.session.currentMode,
    onMessage: (message) => {
      // 🎯 检查是否是限制消息
      if ((message as any).limitReached) {
        const limitInfo = (message as any).limitInfo;

        // 设置限制状态
        setIsLimitReached(true);

        if (limitInfo) {
          const newStats = {
            turn_count: limitInfo.current,
            turn_limit: limitInfo.limit,
            limit_reached: true,
            has_report: true,
            is_premium: false,
          };
          setTurnStats(newStats);
        }
      }

      // 🎯 防止重复添加：检查消息ID是否已存在
      setMessages((prev) => {

        const existingIndex = prev.findIndex((m) => m.id === message.id);

        if (existingIndex !== -1) {
          // 如果消息已存在，更新它（用于处理流式更新）
          const updated = [...prev];
          updated[existingIndex] = message;
          return updated;
        }

        // 否则添加新消息，并分配顺序号
        messageOrderRef.current += 1;
        const messageWithOrder = {
          ...message,
          _order: messageOrderRef.current,
        };
        const newMessages = [...prev, messageWithOrder];
        return newMessages;
      });

      // 清除错误状态（消息成功时）
      if (message.isComplete) {
        Store.session.clearCurrentError();
      }
    },
    onRefreshCharacters: (data) => {

      const userId = Store.user.userId;
      if (!userId) return;

      // 1. 刷新左侧角色列表
      queryClient.invalidateQueries({
        queryKey: queryKeys.userCharacters(userId),
      });

      // 2. 刷新左侧 session 列表（因为 session.title 已更新）
      queryClient.invalidateQueries({
        queryKey: queryKeys.userSessions(userId),
      });

      // 3. 🎯 刷新使用统计（角色数量计数）
      queryClient.invalidateQueries({
        queryKey: queryKeys.usageStats(userId),
      });

      // 4. 🎯 后台静默刷新当前会话的角色和会话信息（不会触发消息重新加载）
      if (chatId && chatId !== "new") {
        // 这些刷新只会触发 sessionInfo 和 currentCharacter 的更新
        // 不会触发消息列表重新加载，因为消息加载只依赖 chatId
        queryClient.invalidateQueries({
          queryKey: queryKeys.characterBySession(chatId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessionById(chatId),
        });
      }
    },
    onRefreshReports: (data) => {
      // 刷新报告列表（通过 invalidateQueries）
      if (chatId && chatId !== "new") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.characterBySession(chatId),
        });
      }

      // 🎯 刷新订阅状态（可能任务已完成并自动领取了奖励）
      import("@/lib/utils/subscription-helper").then(({ checkAndRefreshSubscription }) => {
        checkAndRefreshSubscription("chat-reports-complete");
      });
    },
    onError: (error) => {
      console.error("Chat error:", error);

      // 将错误保存到 store
      const enhancedError = {
        ...error,
        timestamp: new Date(),
        sessionId: chatId !== "new" ? chatId : sessionId || undefined,
        interrupted: error.error_type === "stream_generation_failed",
      };
      Store.session.setCurrentError(enhancedError);

      // 持久化错误状态
      if (chatId !== "new") {
        Store.session.persistErrorState(chatId, inputMessage || "");
      }

      // 🚨 立即添加错误消息到前端消息列表，确保用户能立即看到错误
      messageOrderRef.current += 1;
      const errorMessage: ChatMessage = {
        // id: crypto.randomUUID(),
        id: uuid4(),
        sender: "assistant",
        content: error.error || "发生了未知错误，请重试。",
        timestamp: new Date(),
        isComplete: true,
        isFailed: true, // 🎯 标记为失败，确保显示 ErrorMessage UI
        _order: messageOrderRef.current,
      } as any;

      setMessages((prev) => [...prev, errorMessage]);
    },
    onComplete: () => {
      // 对话完成时清除错误状态
      Store.session.clearCurrentError();
      // 清除持久化错误状态
      if (chatId !== "new") {
        Store.session.clearPersistedErrorState(chatId);
      }

      // 消息完成后确保滚动到底部
      setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }, 100);
    },
  });

  // Load existing session or show modal for new chats, unless auto-start params exist
  useEffect(() => {
    if (chatId === "new") {
      const search = new URLSearchParams(window.location.search);
      const hasAuto = !!(
        search.get("basicBaziId") || search.get("characterId")
      );
      setShowModeModal(!hasAuto);
      // Character will be selected from sidebar or created through the flow
    } else {
      // 检查是否是刚创建的session（从 /chat/new 跳转过来的）
      const isNewlyCreated = sessionStorage.getItem(`new_session_${chatId}`);
      if (isNewlyCreated) {
        // 清除标记
        sessionStorage.removeItem(`new_session_${chatId}`);
        // 直接设置为已存在，跳过数据库查询
        setSessionExists(true);
        setSessionInfo({ id: chatId, title: "New Chat", mode: "chat" });
        setMessages([]); // 新session没有历史消息
        setSelectedMode("chat");

        // 检查是否有来自前一页面的消息需要继承
        const existingMessages = sessionStorage.getItem(`messages_${chatId}`);
        if (existingMessages) {
          try {
            const parsedMessages = JSON.parse(existingMessages);
            setMessages(parsedMessages);
            sessionStorage.removeItem(`messages_${chatId}`);
          } catch (error) {
            console.error("Failed to parse inherited messages:", error);
          }
        }
      } else {
        // 加载现有session数据
        // loadSessionData已被React Query替代，这里不需要手动调用
      }
    }
  }, [chatId]);

  // 🚀 延迟清理URL参数，确保mode已被获取
  useEffect(() => {
    const timer = setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.has("auto_start") ||
        urlParams.has("mode") ||
        urlParams.has("basicBaziId")
      ) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("auto_start");
        newUrl.searchParams.delete("basicBaziId");
        newUrl.searchParams.delete("mode");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }, 500); // 延迟500ms确保mode已被获取

    return () => clearTimeout(timer);
  }, [chatId]);

  // 🤖 超简化方案：只要没有消息就显示打招呼语
  useEffect(() => {

    if (chatId === "new") {
      return;
    }

    if (!sessionExists || !sessionInfo) {
      return;
    }

    // 🔧 新架构：简化的greeting流式显示逻辑
    const urlParams = new URLSearchParams(window.location.search);
    const justCreated = urlParams.get("just_created") === "true";

    if (justCreated && messages.length > 0 && !greetingShown) {

      // 查找最后一条greeting消息
      const greetingMessage = messages.find(
        (msg) =>
          msg.sender === "assistant" &&
          (msg.content.includes("已就位") ||
            msg.content.includes("模式启动") ||
            msg.content.includes("架构师") ||
            msg.content.includes("内化") ||
            msg.content.includes("灵魂信息"))
      );

      if (greetingMessage) {

        // 设置流式显示
        setGreetingText(greetingMessage.content);
        setShowGreetingTypewriter(true);
        setGreetingShown(true);

        // 清除URL参数
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("just_created");
        window.history.replaceState({}, "", newUrl.toString());

        // 从messages中移除greeting消息，避免重复显示
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== greetingMessage.id)
        );
      }
    }
  }, [messages.length, sessionExists, sessionInfo, greetingShown, chatId]);

  // Handle /chat/new query params for auto-start
  useEffect(() => {
    if (chatId !== "new") return;
    const search = new URLSearchParams(window.location.search);
    const characterId = search.get("characterId");
    const basicBaziIdParam = search.get("basicBaziId");
    if (!characterId && !basicBaziIdParam) return;

    const run = async () => {
      try {
        let basicBaziId = basicBaziIdParam;
        if (!basicBaziId && characterId) {
          const { data: character, error } =
            await databaseOperations.getCharacterById(characterId);
          if (character) {
            setCurrentCharacter(character);
            const payload = {
              name: character.name,
              gender: (character.gender as any) || "male",
              birthday_utc8: character.birthday_utc8 || "",
              longitude: character.longitude ?? 139.0,
              birthplace: character.birthplace || "",
              mbti: character.mbti || "",
              mode: "character" as const,
            };
            basicBaziId = await apiClient.createBasicBazi(payload);
          }
        }
        await sendSSEMessage("Start", "chat", basicBaziId || null);
      } catch (e) {
        console.error("[/chat/new] auto-start error", e);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // When a session gets created while on /chat/new, navigate to that session
  useEffect(() => {
    if (chatId === "new" && sessionId) {
      router.replace(`/chat/${sessionId}`);
    }
  }, [chatId, sessionId, router]);

  // 🎯 检查用户是否在底部
  const checkIfUserAtBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const threshold = 100; // 100px的容差范围
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold;
      setIsUserAtBottom(isAtBottom);
      return isAtBottom;
    }
    return true;
  };

  // 滚动到聊天内容底部的函数 - 智能版本
  const scrollToBottom = (force: boolean = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;

      // 检查容器是否有内容
      if (container.scrollHeight <= container.clientHeight) {
        return; // 如果内容不足以滚动，直接返回
      }

      // 获取当前滚动位置
      const currentScrollTop = container.scrollTop;
      const maxScrollTop = container.scrollHeight - container.clientHeight;

      // force=true 时强制滚动（用于发送消息后）
      // 否则只在用户已经在底部时才滚动
      const shouldScroll = force || isUserAtBottom;

      if (shouldScroll && Math.abs(currentScrollTop - maxScrollTop) > 10) {
        container.scrollTo({
          top: maxScrollTop,
          behavior: "smooth",
        });
      }
    }
  };

  // 🎯 监听用户滚动事件 - 检测用户是否在底部
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const wasAtBottom = isUserAtBottom;
      const nowAtBottom = checkIfUserAtBottom();

      // 只在状态变化时打印日志，避免过多输出
      if (wasAtBottom !== nowAtBottom) {
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isUserAtBottom]); // 添加依赖以便访问最新状态

  // 🎯 Auto-scroll to bottom when messages change - 智能版本
  useEffect(() => {
    // 检测是否有新消息（用户发送的）
    const hasNewUserMessage = messages.length > lastMessageCountRef.current;

    if (hasNewUserMessage) {
      // 用户发送了新消息，强制滚动到底部

      lastMessageCountRef.current = messages.length;
      shouldAutoScrollRef.current = true;

      // 使用 requestAnimationFrame 确保 DOM 更新完成后再滚动
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom(true); // force = true
          shouldAutoScrollRef.current = false;
        });
      });
    }
  }, [messages]);

  // 🎯 SSE流式输出时的智能滚动 - 只在用户在底部时跟随
  useEffect(() => {
    if (!currentAssistantMessage) return;

    // 使用节流，避免过于频繁的滚动检查
    const timeoutId = setTimeout(() => {
      // 实时检查用户是否在底部（不依赖state，避免重复触发）
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const threshold = 100;
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        const isAtBottom = distanceFromBottom < threshold;

        if (isAtBottom) {
          // 只有确认用户在底部时才滚动
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              const container = messagesContainerRef.current;
              container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth",
              });
            }
          });
        } else {
        }
      }
    }, 50); // 50ms节流

    return () => clearTimeout(timeoutId);
  }, [currentAssistantMessage]); // 只依赖 currentAssistantMessage

  // 🎯 当切换到新session时也自动滚动到底部 - 智能版本
  useEffect(() => {
    if (sessionExists === true && chatId !== "new") {
      // 切换session时强制滚动到底部
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottom(true); // force = true
            setIsUserAtBottom(true); // 重置状态
          });
        });
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [chatId, sessionExists]);

  // 智能高度调整 - 平滑且稳定
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;

      // 临时重置高度以获得准确的scrollHeight
      const currentHeight = textarea.style.height;
      textarea.style.height = "48px";

      // 计算理想高度 - 最大高度改为400px
      const scrollHeight = textarea.scrollHeight;
      const idealHeight = Math.max(48, Math.min(scrollHeight, 400));

      // 只有当高度确实需要改变时才调整
      if (parseInt(currentHeight) !== idealHeight) {
        textarea.style.height = idealHeight + "px";
      } else {
        textarea.style.height = currentHeight;
      }
    }
  }, [inputMessage]);

  const handleModeSelect = async (mode: string) => {
    setSelectedMode(mode);

    // 🔧 正确方案：直接创建session，传入greeting
    const greeting = getGreetingByMode(mode);

    const sessionResponse = await apiClient.createSession({
      mode: mode,
      title: "New Chat",
      greeting: greeting,
    });

    // 🚀 创建session时立即保存到store
    Store.session.createAndSwitchSession(
      sessionResponse.data.session_id,
      mode,
      "New Chat"
    );

    // 🔧 正确方案：跳转到具体的聊天页面，传递just_created参数
    router.push(`/chat/${sessionResponse.data.session_id}?just_created=true`);
  };

  const handlePersonalSubmit = async (data: {
    name: string;
    birthday: string;
    birthtime?: string;
    gender: "male" | "female";
    saveToLibrary: boolean;
  }) => {

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

    // 2. 创建会话 - 使用个人算命模式，直接传入 greeting
    // 后端会自动保存 greeting 到 events 表
    const sessionResponse = await apiClient.createSession({
      mode: "personal",
      title: `个人算命 - ${data.name}`,
      greeting: greeting, // 🎯 直接传入 greeting
    });

    // 3. 显示个人运势师Agent信息
    if (sessionResponse.data.agent_info) {
    }

    // 4. 创建session时立即保存到store（不需要 basicBaziId）
    Store.session.createAndSwitchSession(
      sessionResponse.data.session_id,
      "personal",
      `个人算命 - ${data.name}`,
      undefined,
      undefined // 个人算命模式不需要预先创建 basic_bazi
    );

    // 5. 跳转到新会话页面（greeting 已由后端自动保存）
    router.push(`/chat/${sessionResponse.data.session_id}`);
  };

  // 处理角色选择（命盘附件）
  const handleCharacterSelection = async (
    characters: Array<{ id: string; name: string }>
  ) => {
    logger.info(
      {
        module: "chat",
        operation: "handleCharacterSelection",
        data: { count: characters.length, ids: characters.map((c) => c.id) },
      },
      "Selected characters for paipan attachment"
    );

    // 获取角色的命盘数据
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://divination.uubb.top";

    // 导入认证 helper
    const { getAuthHeaders } = await import("@/lib/utils/authHelpers");

    const paipans = await Promise.all(
      characters.map(async (char) => {
        try {
          // 获取认证头
          const authHeaders = await getAuthHeaders();

          const response = await fetch(
            `${API_BASE_URL}/api/character/v1/${char.id}`,
            {
              mode: "cors",
              credentials: "omit",
              headers: {
                ...authHeaders,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            logger.error(
              {
                module: "chat",
                operation: "fetchPaipan",
                data: { characterId: char.id, status: response.status },
              },
              `Failed to fetch paipan data: ${response.status}`
            );
            return {
              id: char.id,
              name: char.name,
            };
          }

          const responseData = await response.json();

          // API 返回格式: {code, message, data: {角色信息 + paipan}}
          const characterData = responseData.data || responseData;

          logger.info(
            {
              module: "chat",
              operation: "fetchPaipan",
              data: {
                characterId: char.id,
                hasCharacterData: !!characterData,
                characterDataKeys: characterData
                  ? Object.keys(characterData)
                  : [],
                hasPaipan: !!characterData.paipan,
                paipanKeys: characterData.paipan
                  ? Object.keys(characterData.paipan)
                  : [],
                // 打印完整的 paipan 对象（截断）
                paipanSample: characterData.paipan
                  ? JSON.stringify(characterData.paipan).substring(0, 300)
                  : "null",
              },
            },
            "Fetched character with paipan data"
          );

          return {
            id: char.id,
            name: char.name,
            gender: characterData.gender,
            birthday: characterData.birthday_utc8,
            paipanData: characterData.paipan || {},
          };
        } catch (error) {
          logger.error(
            { module: "chat", operation: "fetchPaipan", error },
            "Error fetching paipan data"
          );
          return {
            id: char.id,
            name: char.name,
          };
        }
      })
    );

    setAttachedPaipans(paipans);
    logger.success(
      {
        module: "chat",
        operation: "handleCharacterSelection",
        data: { count: paipans.length },
      },
      "Paipan data loaded successfully"
    );
  };

  // 移除命盘附件
  const handleRemovePaipan = (id: string) => {
    setAttachedPaipans((prev) => prev.filter((p) => p.id !== id));
    logger.info(
      { module: "chat", operation: "removePaipan", data: { id } },
      "Removed paipan attachment"
    );
  };

  const handleSendMessage = async () => {
    // 允许只发送命盘（不需要文字）或者只发送文字（不需要命盘）
    if (!inputMessage.trim() && attachedPaipans.length === 0) return;
    if (isLoading) return;

    const messageToSend = inputMessage.trim();
    const paipansToSend = [...attachedPaipans];

    // Clear input and attachments immediately
    setInputMessage("");
    setAttachedPaipans([]);

    try {
      // 如果有附加命盘，使用 vis-paipan 代码块格式
      let finalMessage = messageToSend;
      if (paipansToSend.length > 0) {
        // 构建用户消息：文本 + vis-paipan 代码块
        const paipanBlocks = paipansToSend
          .map((p) => {
            logger.info(
              {
                module: "chat",
                operation: "buildPaipanBlock",
                data: {
                  characterId: p.id,
                  hasPaipanData: !!p.paipanData,
                  paipanDataKeys: p.paipanData ? Object.keys(p.paipanData) : [],
                  paipanDataSample: p.paipanData
                    ? JSON.stringify(p.paipanData).substring(0, 200)
                    : "empty",
                },
              },
              "Building paipan block"
            );

            // 构建符合 PaipanRenderer 期望的格式
            const paipanData = {
              // 添加角色信息（用于显示）
              characterInfo: {
                characterId: p.id,
                characterName: p.name,
                gender: p.gender,
                birthday: p.birthday,
              },
              // 展开命盘数据（PaipanRenderer 需要的格式）
              ...(p.paipanData || {}),
            };

            return `\n\n\`\`\`vis-paipan\n${JSON.stringify(
              paipanData,
              null,
              2
            )}\n\`\`\``;
          })
          .join("");

        // 将文本和命盘块组合
        finalMessage = messageToSend + paipanBlocks;

        logger.info(
          {
            module: "chat",
            operation: "sendMessageWithPaipan",
            data: {
              paipanCount: paipansToSend.length,
              hasText: !!messageToSend,
              messageLength: finalMessage.length,
            },
          },
          "Sending message with vis-paipan blocks"
        );
      }

      // 🚀 使用store中的mode，不再传递mode参数
      await sendSSEMessage(finalMessage, Store.session.currentMode as any);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Re-focus the textarea after error
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // const handleActionSelection = (action: string) => {
  //   // 🚀 使用store中的mode
  //   sendSSEMessage(action, Store.session.currentMode as any);
  // };

  // 📤 分享相关处理函数
  const handleToggleShareMode = () => {
    setIsShareMode(!isShareMode);
    setSelectedMessageIds([]);
  };

  const handleToggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      if (prev.includes(messageId)) {
        return prev.filter((id) => id !== messageId);
      } else {
        return [...prev, messageId];
      }
    });
  };

  // const handleConfirmShare = async () => {
  //   if (selectedMessageIds.length === 0) {
  //     toast({
  //       title: "提示",
  //       description: "请至少选择一条消息",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsCreatingShare(true);
  //   try {
  //     const { createShare } = await import("@/lib/api/share");

  //     // 如果是角色对话，传递角色ID
  //     const shareData: any = {
  //       share_type: sessionInfo?.mode === "hepan" ? "hepan" : "chat",
  //       session_id: chatId,
  //       selected_message_ids: selectedMessageIds,
  //       include_user_messages: true,
  //     };

  //     // 如果当前有角色信息，添加角色ID
  //     if (currentCharacter?.id) {
  //       shareData.character_id = currentCharacter.id;
  //     }

  //     const response = await createShare(shareData);

  //     // 复制链接到剪贴板
  //     await navigator.clipboard.writeText(response.share_url);

  //     toast({
  //       title: "创建成功",
  //       description: "分享链接已复制到剪贴板！",
  //     });

  //     // 退出分享模式
  //     setIsShareMode(false);
  //     setSelectedMessageIds([]);
  //   } catch (error: any) {
  //     // 🚨 提取错误信息并显示用户友好的错误提示
  //     let errorMessage = "创建分享失败";

  //     if (error?.message) {
  //       errorMessage = error.message;
  //     } else if (error?.error) {
  //       errorMessage = error.error;
  //     } else if (typeof error === "string") {
  //       errorMessage = error;
  //     }

  //     // 记录到控制台供调试
  //     logger.error("创建分享失败", { error, session_id: chatId });

  //     // 显示用户友好的错误对话框
  //     toast({
  //       title: "创建失败",
  //       description: errorMessage,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsCreatingShare(false);
  //   }
  // };

  if (chatId === "new") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <ModeSelectionModal
          isOpen={showModeModal}
          onOpenChange={setShowModeModal}
          onModeSelect={handleModeSelect}
          onPersonalSubmit={handlePersonalSubmit}
        />
      </div>
    );
  }

  // const handleCharacterSelectionForMode = (character: any) => {
  //   setCurrentCharacter(character);
  // };

  // // 🎯 创建新session（针对当前角色）
  // const handleCreateNewSession = async () => {
  //   if (!currentCharacter) {
  //     toast({
  //       title: "未选择角色",
  //       description: "请先选择一个角色",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   try {
  //     const API_BASE_URL =
  //       process.env.NEXT_PUBLIC_API_BASE_URL || "https://divination.uubb.top";
  //     const response = await fetch(
  //       `${API_BASE_URL}/api/character/v1/create-chat-session`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         credentials: "include", // 🔐 携带cookie进行身份验证
  //         body: JSON.stringify({
  //           character_id: currentCharacter.id,
  //           title: `与${currentCharacter.name}的对话`,
  //         }),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error("创建session失败");
  //     }

  //     const data = await response.json();
  //     const newSessionId = data.session_id;

  //     // 刷新角色sessions列表
  //     await refetchCharacterSessions();

  //     // 刷新用户sessions列表
  //     if (userId) {
  //       await queryClient.invalidateQueries({
  //         queryKey: queryKeys.userSessions(userId),
  //       });
  //     }

  //     // 跳转到新session
  //     router.push(`/chat/${newSessionId}`);

  //     toast({
  //       title: "创建成功",
  //       description: "已创建新的对话",
  //     });
  //   } catch (error) {
  //     console.error("创建session失败:", error);
  //     toast({
  //       title: "创建失败",
  //       description: error instanceof Error ? error.message : "创建对话失败",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const injectTestFunctionResponse = () => {
  //   const payload = {
  //     card_id: "get_bazi_components",
  //     data: {
  //       name: "小明",
  //       gender: "male",
  //       birthplace: "沈阳",
  //       mbti: "INFJ",
  //       birthday_utc8: "1992-01-01 00:00:00",
  //     },
  //   };
  //   const testMessage: ChatMessage = {
  //     // id: crypto.randomUUID(),
  //     id: uuidv4(),
  //     content: "",
  //     sender: "assistant",
  //     timestamp: new Date(),
  //     isComplete: true,
  //     functionResponse: {
  //       id: `call_test_${Date.now()}`,
  //       name: "get_bazi_components",
  //       response: {
  //         result: JSON.stringify(payload),
  //       },
  //     },
  //   };
  //   setMessages((prev) => [...prev, testMessage]);
  // };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Show loading state while checking session
  if (isLoadingSession) {
    return (
      <div className="flex flex-col h-full w-full mx-15">
        <div className="absolute inset-0 bg-[url('/charactor_create_modal/background-modal.png')] bg-cover opacity-10 pointer-events-none" />
        {/* Permanent Loading Bar for /chat/new */}
        {chatId === "new" && (
          <div className="fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30">
            <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3 text-primary-600">
              <Spinner size="sm" className="animate-spin" />
              <span className="text-sm font-medium">
                {t("chatEx.initializing")}
              </span>
              <div className="ml-auto text-xs text-primary-500">
                {t("chatEx.pleaseWait")}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area with Skeleton */}
        <div className="flex h-full">
          <div className="flex-1 flex flex-col h-full px-24 md:px-28 ">
            <div className="w-full h-full flex flex-col px-3 md:px-6">
              {/* Chat Header Skeleton */}
              <ChatHeaderSkeleton />
              {/* Messages Area Skeleton */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                <MessageSkeleton isUser={false} />
                <MessageSkeleton isUser={true} />
              </div>
              {/* Input Area Skeleton */}
              <div className="py-3 md:py-4 border-t border-foreground/10 bg-content1/70 backdrop-blur-sm">
                <div className="flex items-end gap-2 md:gap-3">
                  <div className="flex-1">
                    <div className="min-h-[44px] md:min-h-[48px] bg-content2 border border-foreground/10 rounded-2xl p-3 animate-pulse"></div>
                  </div>
                  <div className="w-[44px] md:w-[60px] h-[44px] md:h-[48px] bg-primary/20 rounded-2xl animate-pulse flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary/40 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // // Show not found if session doesn't exist
  if (sessionExists === false) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Card className="max-w-md bg-content2/80 backdrop-blur-sm border border-foreground/10 shadow-xl">
          <CardBody className="text-center p-8 space-y-4">
            <MessageCircle className="w-16 h-16 text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-foreground">
              {t("chatEx.notFoundTitle")}
            </h3>
            <p className="text-foreground-600">{t("chatEx.notFoundDesc")}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Show chat interface for existing sessions
  if (sessionExists === true) {
    return (
      <>
        <div className="py-4 z-10">
          <div className="relative">
            <div className="flex flex-col items-center gap-1">
              <Avatar
                src={
                  getAvatarPublicUrl(
                    currentCharacter?.avatar_id,
                    currentCharacter?.auth_id
                  ) || "/placeholder-user.jpg"
                }
                name={currentCharacter?.name || "Assistant"}
                size="sm"
                className="w-12 h-12"
              />
              <h3 className="font-semibold text-foreground text-base">
                {sessionInfo?.mode === "hepan"
                  ? t("sidebar.synastryExpert")
                  : sessionInfo?.mode === "personal"
                    ? t("sidebar.fortuneTellingExpert")
                    : currentCharacter?.name || t("sidebar.unknown")}
              </h3>
              <p className="text-xs text-foreground-600">@XWAN.AI</p>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Dropdown placement="bottom-end" className="">
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="rounded-2xl bg-gradient-to-r from-gray-100 to-[#EB7020]/20 shadow-sm hover:to-[#EB7020]/30 hover:shadow-md cursor-pointer text-foreground min-w-16"
                  >
                    <img src="/svg/排版reading.svg" alt="reading" className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Character Sessions"
                  className="max-h-80 overflow-y-auto"
                  emptyContent={
                    characterSessionsLoading ? "加载中..." : "暂无历史对话"
                  }
                >
                  <DropdownItem
                    key="liunian"
                    startContent={<Calendar className="w-4 h-4" />}
                    onPress={() => setLiunianOpen(true)}
                    className="border-b border-foreground/10"
                  >
                    大运流年
                  </DropdownItem>
                  {(sessionData?.state as any)?.character_cache?.paipan &&
                    (sessionData?.state as any)?.character_cache?.birth_time && (
                      <DropdownItem
                        key="destiny"
                        startContent={<Sparkles className="w-4 h-4" />}
                        onPress={() => setDestinyPanelOpen(true)}
                      >
                        命运面板
                      </DropdownItem>
                    )}
                  {messages.length > 0 && (
                    <DropdownItem
                      key="share"
                      startContent={<Share2 className="w-4 h-4" />}
                      onPress={handleToggleShareMode}
                    >
                      分享模式
                    </DropdownItem>
                  )}
                  <DropdownSection title={`${currentCharacter?.name || "角色"} 的对话`}>
                    {characterSessions.map((session: any) => (
                      <DropdownItem
                        key={session.id}
                        description={new Date(session.update_time).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        startContent={
                          session.id === chatId ? (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )
                        }
                        className={session.id === chatId ? "bg-primary/10" : ""}
                        onPress={() => {
                          if (session.id !== chatId) {
                            router.push(`/chat/${session.id}`);
                          }
                        }}
                      >
                        {session.title || "未命名对话"}
                      </DropdownItem>
                    ))}
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>

              <Modal isOpen={liunianOpen} onOpenChange={setLiunianOpen} size="5xl" scrollBehavior="inside">
                <ModalContent className="bg-content1/95 backdrop-blur-xl border border-foreground/10 h-[85vh]">
                  {() => (
                    <>
                      <ModalHeader className="flex flex-col items-center gap-2 pt-8 pb-4">
                        <h2 className="text-2xl font-serif tracking-wider text-black/80">命運時間線</h2>
                        <div className="text-sm text-gray-500 font-serif tracking-wide">
                          庚午 丁亥 己亥 戊辰 · 百年運勢一覽
                        </div>
                      </ModalHeader>
                      <ModalBody className="p-0 overflow-hidden">
                        {birthInfoForTimeline ? (
                          <DestinyTimeline
                            key={`${birthInfoForTimeline.year}-${birthInfoForTimeline.month}-${birthInfoForTimeline.day}`}
                            birthInfo={birthInfoForTimeline}
                            variant="flat"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                            <Calendar className="w-12 h-12 text-foreground-400" />
                            <p className="text-foreground-600">缺少出生信息</p>
                            <p className="text-sm text-foreground-400">该角色没有出生时间数据</p>
                          </div>
                        )}
                      </ModalBody>
                      <ModalFooter>
                        <Button variant="light" onPress={() => setLiunianOpen(false)}>关闭</Button>
                      </ModalFooter>
                    </>
                  )}
                </ModalContent>
              </Modal>
            </div>
          </div>
        </div>
        <div ref={messagesContainerRef} className="flex flex-col w-full h-full overflow-y-auto">
          <div className="absolute inset-0 bg-[url('/charactor_create_modal/background-modal.png')] bg-cover opacity-10 pointer-events-none" />
          {/* Permanent Loading Bar for /chat/new */}
          {chatId === "new" && (
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30">
              <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3 text-primary-600">
                <Spinner size="sm" className="animate-spin" />
                <span className="text-sm font-medium">
                  {t("chatEx.initializing")}
                </span>
                <div className="ml-auto text-xs text-primary-500">
                  {t("chatEx.pleaseWait")}
                </div>
              </div>
            </div>
          )}



          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* 内容容器 - 大屏模式下充分利用空间，移动端取消padding */}
            <div className="w-full flex flex-col px-24 md:px-[240px] max-w-full h-full">
              {/* Chat Header */}

              {/* Messages Area */}
              <div

                className="flex-1 py-3 md:py-6 space-y-3 md:space-y-6"
              >
                {/* 显示打字机效果的打招呼语 */}
                {showGreetingTypewriter && (
                  <div className="flex justify-start items-start gap-2 md:gap-3">
                    <Avatar
                      src={
                        getAvatarPublicUrl(
                          currentCharacter?.avatar_id,
                          currentCharacter?.auth_id
                        ) || "/placeholder-user.jpg"
                      }
                      name={currentCharacter?.name || "Assistant"}
                      size="sm"
                      className="flex-shrink-0 mt-1"
                    />
                    <div className="max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-3 bg-content2 border border-foreground/10 text-foreground shadow-sm break-words">
                      {/* Assistant Name */}
                      <div className="text-sm font-medium mb-1 text-foreground-600">
                        {sessionInfo?.mode === "hepan"
                          ? t("sidebar.synastryExpert")
                          : sessionInfo?.mode === "personal"
                            ? t("sidebar.fortuneTellingExpert")
                            : currentCharacter?.name || t("chatEx.assistant")}
                      </div>

                      {/* 打字机效果内容 */}
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed break-words">
                        <MarkdownWithSources
                          content={
                            typewriter.isTyping
                              ? `${typewriter.displayText}<typing-cursor></typing-cursor>`
                              : typewriter.displayText
                          }
                          isStreaming={typewriter.isTyping}
                          className="prose prose-invert max-w-none text-sm leading-relaxed break-words"
                        />
                      </div>

                      {/* 打字机状态指示 */}
                      {typewriter.isTyping && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-foreground/5">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                            <div className="w-1 h-1 bg-primary/60 rounded-full animate-pulse [animation-delay:200ms]" />
                            <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse [animation-delay:400ms]" />
                          </div>
                          <span className="text-xs text-primary font-medium">
                            {t("chatEx.typing")}
                          </span>
                        </div>
                      )}

                      {/* 完成时显示时间戳 */}
                      {typewriter.isComplete && (
                        <div className="text-xs opacity-60 mt-2">
                          {formatTime(new Date())}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 如果正在加载且没有消息，显示消息骨架屏 */}
                {isLoadingSession &&
                  messages.length === 0 &&
                  !showGreetingTypewriter ? (
                  <div className="space-y-6">
                    <MessageSkeleton isUser={false} />
                    <MessageSkeleton isUser={true} />
                  </div>
                ) : (
                  // 🎯 关键修复：对消息进行排序和去重
                  (() => {
                    // 🐛 调试日志：查看消息的 _order 和时间戳

                    // 1. 按 _order 排序（优先），时间戳作为备用
                    const sortedMessages = [...messages].sort((a, b) => {
                      const orderA = (a as any)._order ?? 999999;
                      const orderB = (b as any)._order ?? 999999;

                      if (orderA !== orderB) return orderA - orderB;

                      // 如果 order 相同，按时间排序
                      const timeA =
                        a.timestamp instanceof Date
                          ? a.timestamp.getTime()
                          : new Date(a.timestamp).getTime();
                      const timeB =
                        b.timestamp instanceof Date
                          ? b.timestamp.getTime()
                          : new Date(b.timestamp).getTime();
                      return timeA - timeB;
                    });

                    // 2. 去重：同一个ID只保留一条
                    const uniqueMessages = sortedMessages.reduce((acc, msg) => {
                      if (!acc.find((m) => m.id === msg.id)) {
                        acc.push(msg);
                      }
                      return acc;
                    }, [] as ChatMessage[]);

                    return uniqueMessages;
                  })().map((message, index) => {
                    const content = message.content || "";

                    // 🎯 简化：直接根据 isFailed 字段判断是否是错误消息
                    const isErrorMessage =
                      message.sender === "assistant" && message.isFailed === true;

                    // 🚨 如果是错误消息，渲染ErrorMessage组件
                    if (isErrorMessage) {
                      return (
                        <ErrorMessage
                          key={message.id}
                          error={{
                            error: content,
                            error_type: "stream_generation_failed",
                            retryable: true,
                            resumable: false,
                          }}
                          onRetry={() => {
                            if (chatId !== "new") {
                              Store.session.clearPersistedErrorState(chatId);
                            }

                            // 🔄 重试时移除当前错误消息
                            const currentErrorId = message.id;
                            setMessages((prev) =>
                              prev.filter((msg) => msg.id !== currentErrorId)
                            );

                            // 🚨 确保重试失败时能正确显示错误消息
                            retryLastMessage(messages).catch((error) => {
                              console.error(
                                "🔄 [重试失败] Retry failed, ensuring error message is displayed:",
                                error
                              );

                              // 如果重试失败，立即添加错误消息
                              const retryErrorMessage: ChatMessage = {
                                // id: crypto.randomUUID(),
                                id: uuidv4(),
                                sender: "assistant",
                                content:
                                  error?.error ||
                                  error?.message ||
                                  "重试失败，请稍后再试。",
                                timestamp: new Date(),
                                isComplete: true,
                                isFailed: true, // 🎯 标记为失败
                              };

                              setMessages((prev) => [...prev, retryErrorMessage]);
                            });
                          }}
                          onResume={() => {
                            if (chatId !== "new") {
                              Store.session.clearPersistedErrorState(chatId);
                            }

                            // 🔄 恢复时移除当前错误消息
                            const currentErrorId = message.id;
                            setMessages((prev) =>
                              prev.filter((msg) => msg.id !== currentErrorId)
                            );

                            // 🚨 确保恢复失败时能正确显示错误消息
                            resumeConversation().catch((error) => {
                              console.error(
                                "🔄 [恢复失败] Resume failed, ensuring error message is displayed:",
                                error
                              );

                              // 如果恢复失败，立即添加错误消息
                              const resumeErrorMessage: ChatMessage = {
                                // id: crypto.randomUUID(),
                                id: uuidv4(),
                                sender: "assistant",
                                content:
                                  error?.error ||
                                  error?.message ||
                                  "恢复失败，请稍后再试。",
                                timestamp: new Date(),
                                isComplete: true,
                                isFailed: true, // 🎯 标记为失败
                              };

                              setMessages((prev) => [
                                ...prev,
                                resumeErrorMessage,
                              ]);
                            });
                          }}
                          isRetrying={isLoading}
                          isResuming={isLoading}
                          assistantName={
                            sessionInfo?.mode === "hepan"
                              ? t("sidebar.synastryExpert")
                              : sessionInfo?.mode === "personal"
                                ? t("sidebar.fortuneTellingExpert")
                                : currentCharacter?.name || t("chatEx.assistant")
                          }
                          assistantAvatar={
                            getAvatarPublicUrl(
                              currentCharacter?.avatar_id,
                              currentCharacter?.auth_id
                            ) || "/placeholder-user.jpg"
                          }
                          isPersisted={true}
                          showRefreshHint={false}
                          isLoading={false}
                        />
                      );
                    }

                    const lower = content.toLowerCase().trim();
                    const isPaipanPayload =
                      lower.startsWith("user's bazi infos:");
                    let paipan: any = null;
                    if (isPaipanPayload) {
                      try {
                        const jsonStart = content.indexOf("{");
                        if (jsonStart >= 0) {
                          const jsonStr = content.slice(jsonStart);
                          const parsed = JSON.parse(jsonStr);
                          paipan = parsed?.paipan || null;
                        }
                      } catch (e) {
                        console.warn(
                          "[/chat/[id]] failed to parse paipan payload",
                          e
                        );
                      }
                    }
                    const isSelected = selectedMessageIds.includes(message.id);
                    const isSelectable = message.isComplete !== false; // 只有完成的消息可选择

                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col ${message.sender === "user"
                          ? "justify-end items-end"
                          : "justify-start items-start"
                          } gap-2 md:gap-3`}
                      >
                        <div className={`flex ${message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                          } items-center gap-2 md:gap-3`}>

                          {/* Assistant Avatar - 始终显示 */}
                          {message.sender !== "user" && (
                            <Avatar
                              src={
                                getAvatarPublicUrl(
                                  currentCharacter?.avatar_id,
                                  currentCharacter?.auth_id
                                ) || "/placeholder-user.jpg"
                              }
                              name={currentCharacter?.name || "Assistant"}
                              size="sm"
                              className="flex-shrink-0 mt-1 hidden md:block"
                            />
                          )}
                          {/* Identity line above bubble */}
                          <div
                            className={`text-xs text-foreground-600 mb-1 ${message.sender === "user" ? "text-right" : ""
                              }`}
                          >
                            {message.sender !== "user" ? (
                              <>
                                {sessionInfo?.mode === "hepan"
                                  ? t("sidebar.synastryExpert")
                                  : sessionInfo?.mode === "personal"
                                    ? t("sidebar.fortuneTellingExpert")
                                    : currentCharacter?.name || t("chatEx.assistant")}
                                <span className="ml-1 text-foreground-400">@XWAN.AI</span>
                              </>
                            ) : (
                              <>
                                {Store.user.user?.email ? `${Store.user.user?.email} ` : ""}
                                {Store.user.userName}
                              </>
                            )}
                          </div>

                          {/* User Avatar - 始终显示 */}
                          {message.sender === "user" && (
                            <Avatar
                              src={Store.user.userAvatar}
                              name={Store.user.userName}
                              size="sm"
                              className="flex-shrink-0 mt-1 hidden md:block"
                            />
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          onClick={() => {
                            if (isShareMode && isSelectable) {
                              handleToggleMessageSelection(message.id);
                            }
                          }}
                          className={`relative ${message.content?.includes("```vis-paipan")
                            ? "max-w-[95%] md:max-w-[85%]" // 🎨 命盘消息使用更大宽度
                            : "max-w-[85%] md:max-w-[85%]"
                            } rounded-3xl mx-6 px-4 md:px-5 py-3 md:py-4 break-words ${isShareMode && isSelectable ? "cursor-pointer transition-all hover:scale-[1.01]" : ""
                            } ${isShareMode && isSelected
                              ? message.sender === "user"
                                ? "bg-primary/60 ring-2 ring-primary shadow-xl scale-[1.02] text-primary-foreground backdrop-blur-sm"
                                : "bg-primary/10 ring-2 ring-primary shadow-xl scale-[1.02] border-primary text-foreground"
                              : message.sender === "user"
                                ? "bg-[#E8E8E8] text-primary-foreground"
                                : "bg-[#F0F0F0] text-foreground"
                            }`}
                        >
                          {/* Arrow tail pointing to sender */}
                          {message.sender === "user" ? (
                            <div
                              className={`absolute -right-5 top-4 w-0 h-0 border-t-[0px] border-b-[24px] border-l-[24px] ${isShareMode && isSelected
                                ? "border-l-primary/60"
                                : "border-l-[#E8E8E8]"
                                } border-t-transparent border-b-transparent`}
                            />
                          ) : (
                            <div
                              className={`absolute -left-5 top-4 w-0 h-0 border-t-[0px] border-b-[24px] border-r-[24px] ${isShareMode && isSelected
                                ? "border-r-primary/10"
                                : "border-r-[#F0F0F0]"
                                } border-t-transparent border-b-transparent`}
                            />
                          )}
                          {/* 选中图标 - 右上角 */}
                          {isShareMode && isSelected && (
                            <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1 shadow-lg z-10">
                              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}

                          {/* watermark */}
                          <div className="pointer-events-none absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.06),rgba(0,0,0,0)_60%)]" />

                          {/* 🧠 Thinking 可折叠部分 - 仅 assistant 消息显示 */}
                          {message.sender === "assistant" && message.thinking && (
                            <details className="mb-3 group">
                              <summary className="flex items-center gap-2 cursor-pointer list-none select-none py-2.5 px-3 rounded-lg bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15 transition-all border border-primary/20 dark:border-primary/30">
                                <svg
                                  className="w-3.5 h-3.5 text-primary transition-transform group-open:rotate-90 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path
                                      fillRule="evenodd"
                                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  思考过程
                                </span>
                                <span className="ml-auto text-xs text-default-400 font-mono">
                                  {message.thinking.length} chars
                                </span>
                                <span className="text-xs text-primary/60 group-open:hidden">
                                  展开查看
                                </span>
                                <span className="text-xs text-primary/60 hidden group-open:inline">
                                  收起
                                </span>
                              </summary>
                              <div className="mt-2 p-4 rounded-lg bg-default-100/80 dark:bg-default-50/10 border border-default-300 dark:border-default-200/30">
                                <MarkdownWithSources
                                  content={message.thinking}
                                  isStreaming={false}
                                  className="prose prose-sm dark:prose-invert max-w-none text-foreground dark:text-foreground leading-relaxed [&>p]:text-xs [&>p]:my-2 [&>ul]:text-xs [&>ol]:text-xs [&>h1]:text-sm [&>h2]:text-sm [&>h3]:text-xs [&>h4]:text-xs [&>strong]:text-primary [&>em]:text-primary/80 [&>p]:text-foreground-700 [&>p]:dark:text-foreground-300"
                                />
                              </div>
                            </details>
                          )}

                          {/* Message Content */}
                          {message.functionResponse ? (
                            <AICard
                              name={message.functionResponse.name}
                              response={message.functionResponse.response}
                            />
                          ) : isPaipanPayload && paipan ? (
                            <PaipanCard paipan={paipan} />
                          ) : (
                            <MarkdownWithSources
                              content={message.content || ""}
                              timestamp={formatTime(message.timestamp)}
                              isStreaming={!message.isComplete}
                              className="prose prose-invert max-w-none text-sm leading-relaxed break-words"
                              isUserMessage={message.sender === "user"} // 🎨 区分用户消息和AI消息
                            />
                          )}
                          {/* <div
                          className={`absolute bottom-2 text-xs opacity-60 ${message.sender === "user" ? "right-3" : "left-3"
                            }`}
                        >
                          {formatTime(message.timestamp)}
                        </div> */}
                        </div>

                      </div>
                    );
                  })
                )}

                {/* AI正在生成回复的特殊loading状态 */}
                {isLoading &&
                  !currentAssistantMessage &&
                  !currentThinkingMessage && (
                    <div className="flex justify-start items-start gap-2 md:gap-3">
                      <Avatar
                        src={
                          getAvatarPublicUrl(
                            currentCharacter?.avatar_id,
                            currentCharacter?.auth_id
                          ) || "/placeholder-user.jpg"
                        }
                        name={currentCharacter?.name || "Assistant"}
                        size="sm"
                        className="flex-shrink-0 mt-1 hidden md:block"
                      />
                      <div className="relative max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-3 bg-content2 border border-primary/20 shadow-md">
                        {/* Arrow tail pointing left (assistant message) */}
                        <div className="absolute -left-2 top-6 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[12px] border-r-content2 border-t-transparent border-b-transparent" />
                        {/* Assistant Name */}
                        <div className="text-sm font-medium mb-1 text-foreground-600">
                          {currentCharacter?.name || t("chatEx.assistant")}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          </div>
                          <span className="text-sm text-primary font-medium">
                            {t("chatEx.thinking")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* 流式输出的AI回复（整合 thinking） */}
                {(currentThinkingMessage || currentAssistantMessage) && (
                  <div className="flex justify-start items-start gap-2 md:gap-3">
                    <Avatar
                      src={
                        getAvatarPublicUrl(
                          currentCharacter?.avatar_id,
                          currentCharacter?.auth_id
                        ) || "/placeholder-user.jpg"
                      }
                      name={currentCharacter?.name || "Assistant"}
                      size="sm"
                      className="flex-shrink-0 mt-1 hidden md:block"
                    />
                    <div className="relative max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-3 bg-content2 border border-foreground/10 text-foreground shadow-sm break-words">
                      {/* Arrow tail pointing left (assistant message) */}
                      <div className="absolute -left-2 top-6 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[12px] border-r-content2 border-t-transparent border-b-transparent" />
                      {/* Assistant Name */}
                      <div className="text-sm font-medium mb-1 text-foreground-600">
                        {sessionInfo?.mode === "hepan"
                          ? t("sidebar.synastryExpert")
                          : sessionInfo?.mode === "personal"
                            ? t("sidebar.fortuneTellingExpert")
                            : currentCharacter?.name || t("chatEx.assistant")}
                      </div>

                      {/* 🧠 Thinking 部分 - 流式显示（展开状态） */}
                      {currentThinkingMessage && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse [animation-delay:200ms]" />
                              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse [animation-delay:400ms]" />
                            </div>
                            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path
                                  fillRule="evenodd"
                                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              思考中...
                            </span>
                            <span className="ml-auto text-xs text-default-400 font-mono">
                              {currentThinkingMessage.length} chars
                            </span>
                          </div>
                          <div className="mt-2 p-4 rounded-lg bg-default-100/80 dark:bg-default-50/10 border border-default-300 dark:border-default-200/30">
                            <MarkdownWithSources
                              content={currentThinkingMessage}
                              isStreaming={true}
                              className="prose prose-sm dark:prose-invert max-w-none text-foreground dark:text-foreground leading-relaxed [&>p]:text-xs [&>p]:my-2 [&>ul]:text-xs [&>ol]:text-xs [&>h1]:text-sm [&>h2]:text-sm [&>h3]:text-xs [&>h4]:text-xs [&>strong]:text-primary [&>em]:text-primary/80 [&>p]:text-foreground-700 [&>p]:dark:text-foreground-300"
                            />
                          </div>
                        </div>
                      )}

                      {/* Message Content */}
                      {currentAssistantMessage && (
                        <>
                          <div className="prose prose-invert max-w-none text-sm leading-relaxed break-words">
                            <MarkdownWithSources
                              content={`${currentAssistantMessage}<typing-cursor></typing-cursor>`}
                              isStreaming={true}
                              className="prose prose-invert max-w-none text-sm leading-relaxed break-words"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-foreground/5">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                              <div className="w-1 h-1 bg-primary/60 rounded-full animate-pulse [animation-delay:200ms]" />
                              <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse [animation-delay:400ms]" />
                            </div>
                            <span className="text-xs text-primary font-medium">
                              {t("chatEx.typing")}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 🚨 错误消息现在直接在消息列表中渲染为ErrorMessage组件 */}

                {/* 🚫 对话回合数限制提示 */}
                {isLimitReached && turnStats && (
                  <div className="flex justify-center my-6">
                    <div className="w-full max-w-2xl">
                      {/* 分隔线 */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-danger/30 to-transparent" />
                        <span className="text-sm font-medium text-danger px-3 py-1 rounded-full bg-danger/10 border border-danger/30">
                          此会话已达最大回合数
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-danger/30 to-transparent" />
                      </div>

                      {/* 提示卡片 */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-danger/5 to-danger/10 border border-danger/30">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">
                              对话回合已用完
                            </h4>
                            <p className="text-sm text-foreground-600 mb-3">
                              免费用户每个会话可进行 {turnStats.turn_limit} 回合对话（已使用 {turnStats.turn_count}/{turnStats.turn_limit}）
                            </p>
                            <Button
                              color="primary"
                              size="sm"
                              onPress={onSubscriptionOpen}
                              className="mt-2"
                            >
                              升级会员，享受无限对话
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="py-3 md:py-4 backdrop-blur-sm sticky bottom-0 z-10">
                <div className="px-3 md:px-4">
                  {/* 命盘附件显示（仅 character_agent 模式） */}
                  {(sessionData as any)?.mode === "character_agent" &&
                    attachedPaipans.length > 0 && (
                      <div className="mb-2 md:mb-3 space-y-2">
                        {attachedPaipans.map((paipan) => (
                          <PaipanAttachmentCard
                            key={paipan.id}
                            id={paipan.id}
                            name={paipan.name}
                            gender={paipan.gender}
                            birthday={paipan.birthday}
                            onRemove={handleRemovePaipan}
                          />
                        ))}
                      </div>
                    )}
                </div>
                <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 h-full max-w-[600px] mx-auto">
                  {/* 命盘附件按钮（仅 character_agent 模式） */}
                  {(sessionData as any)?.mode === "character_agent" && (
                    <Button
                      isIconOnly
                      variant="light"
                      size="lg"
                      onPress={() => setShowCharacterModal(true)}
                      className="text-foreground hover:bg-content2 min-h-[44px] md:min-h-[48px] min-w-[44px] md:min-w-[48px] shrink-0"
                      isDisabled={isLoading}
                    >
                      <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  )}
                  <div className="flex-1 relative h-full">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => {
                        // 限制最大字符数为2000
                        const value = e.target.value;
                        if (value.length <= 2000) {
                          setInputMessage(value);
                        }
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder={
                        isLimitReached
                          ? "已达对话回合上限，升级会员可继续对话"
                          : t("chatEx.inputPlaceholder")
                      }
                      disabled={isLoading || isLimitReached}
                      rows={1}
                      className="w-full h-full px-4 md:px-5 py-2 md:py-3 pr-14 md:pr-16
                          rounded-xl overflow-none
                           resize-none overflow-y-auto leading-5 md:leading-6 break-words
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                           disabled:opacity-50 disabled:cursor-not-allowed
                           placeholder:text-foreground-400 text-sm md:text-base"
                      style={{
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        (!inputMessage.trim() && attachedPaipans.length === 0) ||
                        isLoading ||
                        isLimitReached
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-9 md:w-9 rounded-xl flex items-center justify-center bg-content1/80 backdrop-blur-sm disabled:opacity-50"
                      aria-label="发送"
                    >
                      <img src="/svg/发送对话.svg" alt="send" className="w-4 h-4" />
                    </button>
                    {/* 字符计数 */}
                    {inputMessage.length > 0 && (
                      <div className="absolute bottom-2 right-2 text-[10px] md:text-xs text-foreground-400 bg-content1/80 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md backdrop-blur-sm">
                        {inputMessage.length}/2000
                      </div>
                    )}
                  </div>
                  {/* 发送按钮合并为输入框内的绝对定位图标 */}
                </div>
              </div>
            </div>
          </div>

          {/* 命运面板 */}
          {
            destinyPanelOpen &&
            sessionData &&
            (sessionData.state as any)?.character_cache && (
              <DestinyPanel
                character={(sessionData.state as any).character_cache}
                onClose={() => setDestinyPanelOpen(false)}
              />
            )
          }

          {/* 角色选择 Modal（命盘附件） */}
          {
            (sessionData as any)?.mode === "character_agent" && (
              <CharacterSelectionModal
                isOpen={showCharacterModal}
                onClose={() => setShowCharacterModal(false)}
                onSelect={handleCharacterSelection}
                multiSelect={true}
              />
            )
          }

          {/* 🎯 订阅对话框 */}
          <SubscriptionModal
            isOpen={isSubscriptionOpen}
            onOpenChange={onSubscriptionOpenChange}
          />
        </div>
      </>
    );
  }

  // Default fallback
  return null;
});

export default ChatPage;
