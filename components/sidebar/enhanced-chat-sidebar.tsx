"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/react";
import { handleAuthError } from "@/lib/utils/authHelpers";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/lib/utils/translations";
import { useUserData, queryKeys } from "@/hooks/use-data-queries";
import { useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import ModeSelectionModal from "@/components/modals/mode-selection-modal";
import { EnhancedChatSidebarProps, SidebarState } from "./types";
import CharacterSelectionView from "./character-selection-view";
import CharacterReadingsView from "./character-readings-view";
import SessionsView from "./sessions-view";
import { Store } from "@/store";

const EnhancedChatSidebar = observer(
  ({
    defaultState = "character-selection",
    onModeChange,
    onCharacterSelect,
    currentCharacter,
  }: EnhancedChatSidebarProps) => {
    const router = useRouter();
    const pathname = usePathname();

    // 🎯 从 Store 中读取当前 sessionId
    const currentSessionId = Store.session.currentSessionId;
    const { t, getLanguage } = useTranslation();
    const [sidebarState, setSidebarState] =
      useState<SidebarState>(defaultState);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [isRestoringScroll, setIsRestoringScroll] = useState(false);
    const [showModeModal, setShowModeModal] = useState(false);

    // 🔄 保持滚动位置的ref
    const sessionsScrollRef = useRef<HTMLDivElement>(null);
    const SCROLL_POSITION_KEY = "sidebar_sessions_scroll_position";

    // 🔄 保存滚动位置到localStorage
    const saveScrollPosition = () => {
      if (sessionsScrollRef.current) {
        const scrollTop = sessionsScrollRef.current.scrollTop;
        try {
          localStorage.setItem(SCROLL_POSITION_KEY, scrollTop.toString());
        } catch (error) {
          console.warn("⚠️ [滚动位置] 保存失败:", error);
        }
      }
    };

    // 🔄 从localStorage恢复滚动位置（平滑恢复）
    const restoreScrollPosition = () => {
      try {
        const savedPosition = localStorage.getItem(SCROLL_POSITION_KEY);
        if (savedPosition && sessionsScrollRef.current && !isRestoringScroll) {
          setIsRestoringScroll(true);
          const scrollTop = parseInt(savedPosition, 10);
          const element = sessionsScrollRef.current;

          // 使用平滑滚动而不是突然跳跃
          element.scrollTo({
            top: scrollTop,
            behavior: "auto", // 使用auto而不是smooth，避免动画闪烁
          });

          // 短暂延迟后恢复正常状态
          setTimeout(() => {
            setIsRestoringScroll(false);
          }, 100);
        }
      } catch (error) {
        console.warn("⚠️ [滚动位置] 恢复失败:", error);
        setIsRestoringScroll(false);
      }
    };

    // 🔄 保存滚动位置
    useEffect(() => {
      let saveTimeout: NodeJS.Timeout;

      const handleScroll = () => {
        // 使用防抖机制，避免过于频繁保存
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveScrollPosition();
        }, 300);
      };

      const scrollElement = sessionsScrollRef.current;
      if (scrollElement && sidebarState === "sessions") {
        scrollElement.addEventListener("scroll", handleScroll);
        return () => {
          scrollElement.removeEventListener("scroll", handleScroll);
          clearTimeout(saveTimeout);
          // 组件卸载时也保存一次滚动位置
          saveScrollPosition();
        };
      }
    }, [sidebarState]);

    // 使用React Query获取用户数据
    const {
      user,
      characters: userCharacters,
      sessions: userSessions,
      isLoading,
      error,
    } = useUserData();

    // 🔄 获取 queryClient 用于手动刷新
    const queryClient = useQueryClient();

    // 🔄 恢复滚动位置
    useEffect(() => {
      if (
        sidebarState === "sessions" &&
        userSessions &&
        userSessions.length > 0
      ) {
        // 单次尝试，避免多次闪烁
        const timer = setTimeout(() => {
          if (sessionsScrollRef.current) {
            restoreScrollPosition();
          }
        }, 100); // 减少延迟时间

        return () => clearTimeout(timer);
      }
    }, [sidebarState, userSessions]);

    // 🔄 页面初始加载时恢复滚动位置
    useEffect(() => {
      if (
        defaultState === "sessions" &&
        sidebarState === "sessions" &&
        userSessions &&
        userSessions.length > 0
      ) {
        const timer = setTimeout(() => {
          restoreScrollPosition();
        }, 150);
        return () => clearTimeout(timer);
      }
    }, [defaultState, userSessions]);

    // 错误处理
    if (error) {
      console.error("❌ Error loading user data:", error);
      handleAuthError(error);
    }

    const handleActionClick = (actionId: string, label: string) => {
      setSelectedAction(actionId);
      // Send the actual action label as the mode/message
      onModeChange?.(label);
    };

    const handleSynastrySwitchMode = () => {
      handleSidebarStateChange("character-selection");
    };

    // 切换侧边栏状态并刷新数据
    const handleSidebarStateChange = (newState: SidebarState) => {
      setSidebarState(newState);
      setSearchQuery(""); // 重置搜索

      // 🔄 切换到角色列表时刷新数据
      if (newState === "character-selection" && user?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.userCharacters(user.id),
        });
      }
    };

    // 🔄 删除sessions后刷新数据
    const handleSessionsDeleted = () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.userSessions(user.id),
        });
      }
    };

    const hasActiveSession = (() => {
      if (!pathname) return false;
      // Enable readings if we're inside an existing chat session route (/chat/[id])
      // but not on the new-chat route
      return (
        pathname.startsWith("/chat/") &&
        !pathname.endsWith("/new-chat") &&
        pathname !== "/chat"
      );
    })();

    return (
      <>
        <div className="w-80 bg-content1 border-r border-foreground/10 h-full shadow-xl flex flex-col">
          {/* Global state switcher (sticky) */}
          <div className="sticky top-0 z-10 p-3 border-b border-foreground/10 bg-content1/95 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant={sidebarState === "sessions" ? "solid" : "flat"}
                className={
                  sidebarState === "sessions"
                    ? "bg-primary text-primary-foreground"
                    : "bg-content2/80 hover:bg-content2"
                }
                onPress={() => handleSidebarStateChange("sessions")}
              >
                Sessions
              </Button>
              <Button
                size="sm"
                variant={
                  sidebarState === "character-selection" ? "solid" : "flat"
                }
                className={
                  sidebarState === "character-selection"
                    ? "bg-primary text-primary-foreground"
                    : "bg-content2/80 hover:bg-content2"
                }
                onPress={() => handleSidebarStateChange("character-selection")}
              >
                Characters
              </Button>
              <Button
                size="sm"
                isDisabled={!currentCharacter && !hasActiveSession}
                variant={
                  sidebarState === "character-readings" ? "solid" : "flat"
                }
                className={
                  sidebarState === "character-readings"
                    ? "bg-primary text-primary-foreground"
                    : "bg-content2/80 hover:bg-content2"
                }
                onPress={() => handleSidebarStateChange("character-readings")}
              >
                Readings
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <div className="h-full">
              {sidebarState === "character-selection" && (
                <CharacterSelectionView
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  characters={userCharacters}
                  isLoading={isLoading}
                  onSynastrySwitchMode={handleSynastrySwitchMode}
                  t={t}
                  userId={user?.id}
                />
              )}
              {sidebarState === "character-readings" && (
                <CharacterReadingsView
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sessionId={currentSessionId}
                  selectedAction={selectedAction}
                  onActionClick={handleActionClick}
                  onSynastrySwitchMode={handleSynastrySwitchMode}
                  t={t}
                />
              )}
              {sidebarState === "sessions" && (
                <SessionsView
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sessions={userSessions}
                  isLoading={isLoading}
                  onNewChat={() => setShowModeModal(true)}
                  sessionsScrollRef={sessionsScrollRef}
                  saveScrollPosition={saveScrollPosition}
                  t={t}
                  getLanguage={getLanguage}
                  onSessionsDeleted={handleSessionsDeleted}
                />
              )}
            </div>
          </div>
        </div>

        {/* 模式选择弹窗 - 使用带 loading UI 的 wrapper */}
        <ModeSelectionModal
          isOpen={showModeModal}
          onOpenChange={setShowModeModal}
          onSessionCreated={(sessionId) => {
            setShowModeModal(false);
            router.push(`/chat/${sessionId}?just_created=true`);
          }}
        />
      </>
    );
  }
);

export default EnhancedChatSidebar;
