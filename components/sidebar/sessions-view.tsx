import { FC, useEffect, useRef, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Avatar,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
} from "@heroui/react";
import {
  Search,
  Plus,
  MessageCircle,
  Clock,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Store } from "@/store";
import { Session } from "./types";
import SessionSkeleton from "./session-skeleton";
import { formatShortDate, formatTimeOnly } from "@/lib/utils/timeFormatter";
import { databaseOperations } from "@/lib/supabase/database";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

interface SessionsViewProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sessions: Session[];
  isLoading: boolean;
  onNewChat: () => void;
  sessionsScrollRef: React.RefObject<HTMLDivElement | null>;
  saveScrollPosition: () => void;
  t: (key: string) => string;
  getLanguage: () => string;
  onSessionsDeleted?: () => void;
}

const SessionsView: FC<SessionsViewProps> = ({
  searchQuery,
  onSearchChange,
  sessions,
  isLoading,
  onNewChat,
  sessionsScrollRef,
  saveScrollPosition,
  t,
  getLanguage,
  onSessionsDeleted,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const sessionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 🎯 从 URL 获取当前 sessionId
  const currentSessionId = pathname?.split("/chat/")[1]?.split("?")[0] || null;

  // 删除模式状态
  const [isDeletionMode, setIsDeletionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取模式标签信息
  const getModeLabel = (mode: string) => {
    const modeMap: Record<
      string,
      {
        labelKey: string;
        color: "primary" | "secondary" | "success" | "warning" | "danger";
      }
    > = {
      create_character_real_custom: {
        labelKey: "sidebar.modeRealCustom",
        color: "primary",
      },
      create_character_real_guess: {
        labelKey: "sidebar.modeRealGuess",
        color: "primary",
      },
      create_character_virtual_custom: {
        labelKey: "sidebar.modeVirtualCustom",
        color: "secondary",
      },
      create_character_virtual_search_or_guess: {
        labelKey: "sidebar.modeVirtualGuess",
        color: "secondary",
      },
      create_character_oc: {
        labelKey: "sidebar.modeOriginalCharacter",
        color: "secondary",
      },
      create_character_rw: {
        labelKey: "sidebar.modeRealWorld",
        color: "success",
      },
      create_character_feed: {
        labelKey: "sidebar.modeFeedCreated",
        color: "warning",
      },
      create_character_agent: {
        labelKey: "sidebar.modeAgentCreated",
        color: "danger",
      },
      character_agent: {
        labelKey: "sidebar.modeCharacterAgent",
        color: "success",
      },
      hepan: { labelKey: "sidebar.modeHepan", color: "warning" },
      chat: { labelKey: "sidebar.modeChat", color: "primary" },
      personal: { labelKey: "sidebar.modePersonal", color: "success" },
    };
    const modeInfo = modeMap[mode] || {
      labelKey: mode,
      color: "primary" as const,
    };
    return { label: t(modeInfo.labelKey), color: modeInfo.color };
  };

  // 获取合盘角色名称
  const getHepanCharacterNames = (session: any) => {
    if (session.mode !== "hepan") return null;
    const hepanData = session.hepan_data;
    if (
      hepanData &&
      hepanData.character_names &&
      Array.isArray(hepanData.character_names)
    ) {
      return hepanData.character_names.join(" × ");
    }
    return null;
  };

  // 删除相关函数
  const handleEnterDeletionMode = () => {
    logger.info(
      { module: "sidebar", operation: "handleEnterDeletionMode" },
      "Entering deletion mode"
    );
    setIsDeletionMode(true);
    setSelectedSessions([]);
  };

  const handleCancelDeletion = () => {
    logger.info(
      { module: "sidebar", operation: "handleCancelDeletion" },
      "Canceling deletion mode"
    );
    setIsDeletionMode(false);
    setSelectedSessions([]);
    setShowDeleteConfirmModal(false);
  };

  const handleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) => {
      if (prev.includes(sessionId)) {
        return prev.filter((id) => id !== sessionId);
      } else {
        return [...prev, sessionId];
      }
    });
  };

  const handleDeleteSessions = () => {
    if (selectedSessions.length === 0) return;

    logger.info(
      {
        module: "sidebar",
        operation: "handleDeleteSessions",
        data: { count: selectedSessions.length, ids: selectedSessions },
      },
      "Opening delete confirmation modal"
    );

    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (selectedSessions.length === 0) return;

    try {
      setIsDeleting(true);

      logger.info(
        {
          module: "sidebar",
          operation: "confirmDelete",
          data: { count: selectedSessions.length, ids: selectedSessions },
        },
        "Starting sessions deletion"
      );

      const { error } = await databaseOperations.deleteSessions(
        selectedSessions
      );

      if (error) {
        logger.error(
          {
            module: "sidebar",
            operation: "confirmDelete",
            error,
            data: { selectedSessions },
          },
          "Failed to delete sessions"
        );
        toast.error(t("sidebar.deleteFailedSessions"));
        return;
      }

      logger.success(
        {
          module: "sidebar",
          operation: "confirmDelete",
          data: { count: selectedSessions.length },
        },
        "Sessions deleted successfully"
      );

      toast.success(
        t("sidebar.deleteSuccessSessions").replace(
          "{count}",
          String(selectedSessions.length)
        ),
        {
          description: t("sidebar.deleteSuccessSessionsDesc"),
          duration: 3000,
        }
      );

      // 如果删除的session包含当前session，跳转到首页
      if (selectedSessions.includes(currentSessionId || "")) {
        router.push("/");
      }

      // 重置状态
      setIsDeletionMode(false);
      setSelectedSessions([]);
      setShowDeleteConfirmModal(false);

      // 通知父组件刷新sessions列表
      if (onSessionsDeleted) {
        onSessionsDeleted();
      }
    } catch (error) {
      logger.error(
        { module: "sidebar", operation: "confirmDelete", error },
        "Failed to delete sessions"
      );
      toast.error(t("sidebar.deleteFailedSessions"));
    } finally {
      setIsDeleting(false);
    }
  };

  // 🎯 自动滚动到当前 session
  useEffect(() => {
    if (
      currentSessionId &&
      sessionRefs.current[currentSessionId] &&
      sessionsScrollRef.current
    ) {
      const sessionElement = sessionRefs.current[currentSessionId];
      const containerElement = sessionsScrollRef.current;

      // 使用 setTimeout 确保 DOM 已经渲染完成
      setTimeout(() => {
        if (sessionElement && containerElement) {
          const elementRect = sessionElement.getBoundingClientRect();
          const containerRect = containerElement.getBoundingClientRect();

          // 计算元素相对于容器的位置
          const elementTopRelative = elementRect.top - containerRect.top;
          const elementBottomRelative = elementRect.bottom - containerRect.top;

          const padding = 16; // 顶部和底部的安全边距
          const isTopVisible = elementTopRelative >= padding;
          const isBottomVisible =
            elementBottomRelative <= containerRect.height - padding;

          // 如果元素顶部或底部不完全可见，则需要滚动
          if (!isTopVisible || !isBottomVisible) {
            // 如果元素在视图上方，滚动到顶部（带padding）
            if (elementTopRelative < padding) {
              const currentScroll = containerElement.scrollTop;
              const scrollAdjustment = elementTopRelative - padding;
              containerElement.scrollTo({
                top: currentScroll + scrollAdjustment,
                behavior: "smooth",
              });
            }
            // 如果元素在视图下方，滚动到底部（带padding）
            else if (elementBottomRelative > containerRect.height - padding) {
              const currentScroll = containerElement.scrollTop;
              const scrollAdjustment =
                elementBottomRelative - containerRect.height + padding;
              containerElement.scrollTo({
                top: currentScroll + scrollAdjustment,
                behavior: "smooth",
              });
            }
          }
        }
      }, 100);
    }
  }, [currentSessionId, sessions, sessionsScrollRef]);

  return (
    <>
      <div className="flex flex-col h-full bg-content1">
        {/* Header */}
        <div className="relative p-4 border-b border-foreground/10 bg-content1">
          <div className="absolute inset-0 bg-content1/50" />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                {t("sidebar.chatHistory")}
              </h2>
              <div className="flex items-center gap-2">
                {/* 删除按钮 */}
                {!isDeletionMode && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="text-foreground hover:bg-danger/20 hover:text-danger"
                    onPress={handleEnterDeletionMode}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                {/* 新建按钮 */}
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="text-foreground hover:bg-content2"
                  onPress={onNewChat}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <Input
              placeholder={t("sidebar.searchConversations")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              startContent={<Search className="w-4 h-4 text-foreground-400" />}
              className="w-full"
              classNames={{
                input:
                  "bg-content2 border-foreground/10 text-foreground placeholder:text-foreground-400",
                inputWrapper:
                  "bg-content2 border-foreground/10 hover:border-foreground/20 focus-within:border-primary/50",
              }}
            />

            {/* 删除模式提示 */}
            {isDeletionMode && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-danger text-sm">
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium">
                    {t("sidebar.deletionModeSession").replace(
                      "{count}",
                      String(selectedSessions.length)
                    )}
                  </span>
                </div>
                <p className="text-xs text-danger/70 mt-1">
                  {t("sidebar.deletionModeSessionHint")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div
          ref={sessionsScrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
          style={{ scrollBehavior: "auto" }}
        >
          {isLoading ? (
            <div className="space-y-3">
              {/* 渲染5个会话骨架屏 */}
              {Array.from({ length: 5 }).map((_, index) => (
                <SessionSkeleton key={index} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center space-y-2">
              <MessageCircle className="w-8 h-8 text-foreground-400" />
              <p className="text-sm text-foreground-600">
                {t("sidebar.noSessions")}
              </p>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={onNewChat}
              >
                {t("sidebar.startFirstChat")}
              </Button>
            </div>
          ) : (
            sessions
              .filter((session) => {
                const title = (session as any).title || "no title";
                return (
                  session.id
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  title.toLowerCase().includes(searchQuery.toLowerCase())
                );
              })
              .map((session) => {
                const isCurrentSession = session.id === currentSessionId;
                const isSelected = selectedSessions.includes(session.id);
                return (
                  <Card
                    key={session.id}
                    ref={(el) => {
                      sessionRefs.current[session.id] = el;
                    }}
                    className={`w-full border transition-all duration-200 cursor-pointer rounded-xl backdrop-blur-sm ${
                      isSelected
                        ? "bg-danger/20 border-danger/50 shadow-lg shadow-danger/20"
                        : isCurrentSession
                        ? "bg-primary/20 border-primary/50 shadow-lg shadow-primary/20"
                        : "bg-content2/80 border-foreground/10 hover:bg-content2 hover:border-foreground/20"
                    }`}
                    isPressable
                    onPress={async () => {
                      // 如果在删除模式，切换选择状态
                      if (isDeletionMode) {
                        handleSessionSelection(session.id);
                        return;
                      }

                      // 🔄 切换前立即保存滚动位置
                      saveScrollPosition();

                      // 🚀 切换session时使用store缓存session信息
                      Store.session.switchSession(session.id, {
                        mode: (session as any).mode || "chat",
                        title: (session as any).title || "Chat",
                      });

                      // 使用requestAnimationFrame确保DOM更新完成后再导航
                      requestAnimationFrame(() => {
                        router.push(`/chat/${session.id}`);
                      });
                    }}
                  >
                    <CardBody className="p-3">
                      <div className="flex items-start gap-3 w-full">
                        {/* 删除模式下显示 checkbox */}
                        {isDeletionMode && (
                          <Checkbox
                            isSelected={isSelected}
                            onValueChange={() =>
                              handleSessionSelection(session.id)
                            }
                            color="danger"
                            className="flex-shrink-0"
                          />
                        )}
                        <div className="relative flex-shrink-0">
                          <Avatar
                            name="Chat"
                            size="sm"
                            className={
                              isCurrentSession
                                ? "bg-primary/30 ring-2 ring-primary"
                                : "bg-content2"
                            }
                            fallback={
                              <MessageCircle
                                className={`w-4 h-4 ${
                                  isCurrentSession
                                    ? "text-primary"
                                    : "text-primary"
                                }`}
                              />
                            }
                          />
                          {/* 当前会话标记 */}
                          {isCurrentSession && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-content1 animate-pulse" />
                          )}
                          {/* 错误状态标记 */}
                          {Store.session.hasPersistedError(session.id) &&
                            !isCurrentSession && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full border-2 border-content1 flex items-center justify-center">
                                <AlertTriangle className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <p
                                className={`font-medium text-sm truncate ${
                                  isCurrentSession
                                    ? "text-primary font-bold"
                                    : "text-foreground"
                                }`}
                              >
                                {(session as any).title || "no title"}
                              </p>
                              {Store.session.hasPersistedError(session.id) && (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="warning"
                                  className="text-xs h-5 min-w-0 px-1"
                                >
                                  {t("sidebar.error")}
                                </Chip>
                              )}
                            </div>
                            <p className="text-xs text-foreground-500 flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatShortDate(
                                session.update_time,
                                getLanguage()
                              )}
                            </p>
                          </div>

                          {/* 合盘模式显示角色名称 */}
                          {(session as any).mode === "hepan" &&
                            getHepanCharacterNames(session as any) && (
                              <p className="text-xs text-foreground-500 truncate">
                                {getHepanCharacterNames(session as any)}
                              </p>
                            )}

                          <p className="text-xs text-foreground-600 truncate">
                            ID: {session.id.slice(0, 8)}...
                          </p>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-foreground-500">
                              {t("sidebar.lastUpdated")}:{" "}
                              {formatTimeOnly(
                                session.update_time,
                                getLanguage()
                              )}
                            </p>

                            {/* 模式标签 - 放到右下角 */}
                            {(session as any).mode &&
                              (() => {
                                const modeInfo = getModeLabel(
                                  (session as any).mode
                                );
                                return (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color={modeInfo.color}
                                    className="text-[10px] h-5 px-2 max-w-[120px] flex-shrink-0"
                                    classNames={{
                                      content: "truncate",
                                    }}
                                    title={modeInfo.label}
                                  >
                                    {modeInfo.label}
                                  </Chip>
                                );
                              })()}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-foreground/10 bg-content1">
          <div className="text-center space-y-2">
            <p className="text-xs text-foreground-500">
              {sessions.length}{" "}
              {sessions.length !== 1
                ? t("sidebar.sessionsTotal")
                : t("sidebar.sessionTotal")}{" "}
              {t("sidebar.total")}
            </p>
            <div className="flex gap-2">
              {isDeletionMode ? (
                <>
                  <Button
                    className="flex-1 bg-content2 text-foreground hover:bg-content3"
                    startContent={<X className="w-4 h-4" />}
                    onPress={handleCancelDeletion}
                  >
                    {t("database.cancel")}
                  </Button>
                  <Button
                    className={`flex-1 ${
                      selectedSessions.length > 0
                        ? "bg-danger text-white hover:bg-danger/90"
                        : "bg-content2 text-foreground/60 cursor-not-allowed"
                    }`}
                    startContent={<Trash2 className="w-4 h-4" />}
                    onPress={handleDeleteSessions}
                    isDisabled={selectedSessions.length === 0}
                  >
                    {selectedSessions.length > 0
                      ? t("sidebar.deleteSessions").replace(
                          "{count}",
                          String(selectedSessions.length)
                        )
                      : t("sidebar.selectSessionsToDelete")}
                  </Button>
                </>
              ) : (
                <Button
                  className="flex-1 bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={onNewChat}
                >
                  {t("sidebar.newChat")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onOpenChange={setShowDeleteConfirmModal}
        backdrop="blur"
        classNames={{
          base: "bg-content1 border border-danger/20",
          header: "border-b border-danger/20",
          body: "py-6",
          footer: "border-t border-danger/20",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-danger">
                  <Trash2 className="w-5 h-5" />
                  <span>{t("sidebar.confirmDeleteSessionTitle")}</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-foreground">
                    {t("sidebar.aboutToDeleteSessions")}{" "}
                    <span className="font-bold text-danger">
                      {selectedSessions.length}
                    </span>{" "}
                    {t("sidebar.sessions")}：
                  </p>

                  <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <ul className="space-y-2">
                      {selectedSessions.map((id) => {
                        const session = sessions.find((s) => s.id === id);
                        return (
                          <li
                            key={id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div className="w-2 h-2 rounded-full bg-danger"></div>
                            <span className="text-foreground truncate">
                              {(session as any)?.title || "未命名对话"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-warning text-xl">⚠️</div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-warning font-semibold">
                          {t("sidebar.deleteWarningSession")}
                        </p>
                        <ul className="text-xs text-foreground-600 space-y-1 ml-4">
                          <li>{t("sidebar.deleteWarningSessionPermanent")}</li>
                          <li>{t("sidebar.deleteWarningSessionHistory")}</li>
                          <li className="text-danger font-semibold mt-2">
                            {t("sidebar.deleteWarningSessionIrreversible")}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => {
                    onClose();
                    setShowDeleteConfirmModal(false);
                  }}
                  isDisabled={isDeleting}
                  className="bg-content2"
                >
                  {t("database.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={confirmDelete}
                  isLoading={isDeleting}
                  className="font-semibold"
                >
                  {isDeleting
                    ? t("sidebar.deletingSessions")
                    : t("sidebar.confirmDeleteSessions")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default SessionsView;
