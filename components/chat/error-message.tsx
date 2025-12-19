"use client";

import { FC, useState, useEffect } from "react";
import { Button, Avatar, Chip, Skeleton } from "@heroui/react";
import {
  AlertTriangle,
  RotateCcw,
  Play,
  RefreshCw,
  Clock,
  WifiOff,
} from "lucide-react";
import { useTranslation } from "@/lib/utils/translations";
import type { ChatError } from "@/hooks/use-chat-sse";

interface ErrorMessageProps {
  error: ChatError;
  onRetry?: () => void;
  onResume?: () => void;
  isRetrying?: boolean;
  isResuming?: boolean;
  assistantName?: string;
  assistantAvatar?: string;
  isPersisted?: boolean; // 标记是否是从持久化恢复的错误
  showRefreshHint?: boolean; // 是否显示刷新提示
  isLoading?: boolean; // 是否显示加载状态
}

const ErrorMessage: FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onResume,
  isRetrying = false,
  isResuming = false,
  assistantName = "Assistant",
  assistantAvatar = "/placeholder-user.jpg",
  isPersisted = false,
  showRefreshHint = false,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [showContent, setShowContent] = useState(true);

  // 添加延迟显示效果，让骨架屏有时间展示
  useEffect(() => {
    if (isLoading) {
      setShowContent(false);
    } else {
      const timer = setTimeout(() => setShowContent(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const getErrorMessage = (error: ChatError) => {
    const messageMap: Record<string, string> = {
      stream_generation_failed:
        "抱歉，我遇到了一些问题，无法生成回复。这可能是由于网络问题或服务暂时不可用。",
      api_stream_error: "连接服务器时出现问题，请检查您的网络连接。",
      retry_failed: "重试操作失败，请稍后再试。",
      resume_failed: "无法恢复之前的对话，请尝试重新开始。",
      retry_network_error: "网络连接不稳定，请检查网络状态后重试。",
      resume_network_error: "网络连接不稳定，请检查网络状态。",
      resume_not_available: "没有找到可以恢复的对话内容。",
      resume_not_needed: "上次对话已正常完成，无需恢复。",
      resume_context_missing: "缺少必要信息，无法恢复对话。",
      unknown_error: "遇到了未知错误，请稍后重试。",
      network_error: "网络连接出现问题，请检查网络后重试。",
    };

    let baseMessage = messageMap[error.error_type] || "抱歉，出现了一个错误。";

    // 如果是持久化恢复的错误，添加提示
    if (isPersisted) {
      baseMessage += " 我检测到之前有一个未完成的对话，您可以选择重试或继续。";
    }

    return baseMessage;
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getErrorIcon = () => {
    if (isRetrying || isResuming) {
      return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
    }
    return <AlertTriangle className="w-4 h-4 text-warning" />;
  };

  const getErrorSeverity = (errorType: string) => {
    const severityMap: Record<string, "low" | "medium" | "high"> = {
      stream_generation_failed: "high",
      api_stream_error: "high",
      retry_failed: "medium",
      resume_failed: "medium",
      retry_network_error: "medium",
      resume_network_error: "medium",
      resume_not_available: "low",
      resume_not_needed: "low",
      resume_context_missing: "low",
      unknown_error: "high",
      network_error: "medium",
    };
    return severityMap[errorType] || "medium";
  };

  // 如果正在加载或内容还未显示，显示骨架屏
  if (isLoading || !showContent) {
    return (
      <div className="flex justify-start items-start gap-3">
        {/* Avatar Skeleton */}
        <div className="flex-shrink-0 mt-1">
          <Skeleton className="rounded-full">
            <Avatar size="sm" className="w-8 h-8" />
          </Skeleton>
        </div>

        {/* Message Bubble Skeleton */}
        <div className="max-w-[60%] rounded-2xl px-4 py-3 bg-content2 border border-foreground/10">
          {/* Name Skeleton */}
          <div className="mb-2">
            <Skeleton className="rounded-lg">
              <div className="h-4 w-16 bg-default-200"></div>
            </Skeleton>
          </div>

          {/* Icon and Message Skeleton */}
          <div className="flex items-start gap-3 mb-3">
            <Skeleton className="rounded-full flex-shrink-0">
              <div className="w-4 h-4 bg-default-200"></div>
            </Skeleton>
            <div className="flex-1 space-y-2">
              <Skeleton className="rounded-lg">
                <div className="h-4 w-full bg-default-200"></div>
              </Skeleton>
              <Skeleton className="rounded-lg">
                <div className="h-4 w-3/4 bg-default-200"></div>
              </Skeleton>
            </div>
          </div>

          {/* Button Skeletons */}
          <div className="flex gap-2">
            <Skeleton className="rounded-lg">
              <div className="h-8 w-16 bg-default-200"></div>
            </Skeleton>
            <Skeleton className="rounded-lg">
              <div className="h-8 w-20 bg-default-200"></div>
            </Skeleton>
          </div>

          {/* Time Skeleton */}
          <div className="flex justify-end mt-2">
            <Skeleton className="rounded-lg">
              <div className="h-3 w-12 bg-default-200"></div>
            </Skeleton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start items-start gap-3 animate-in fade-in-50 duration-300">
      {/* Assistant Avatar */}
      <Avatar
        src={assistantAvatar}
        name={assistantName}
        size="sm"
        className="flex-shrink-0 mt-1"
      />

      {/* Error Message Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 bg-content2 text-foreground relative border ${
          getErrorSeverity(error.error_type) === "high"
            ? "border-danger/30"
            : getErrorSeverity(error.error_type) === "medium"
            ? "border-warning/30"
            : "border-foreground/20"
        }`}
      >
        {/* Assistant Name and Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-foreground-600">
            {assistantName}
          </div>

          {/* Persistent Error Indicator */}
          {isPersisted && (
            <Chip
              size="sm"
              variant="flat"
              color="warning"
              startContent={<Clock className="w-3 h-3" />}
              className="text-xs"
            >
              未完成对话
            </Chip>
          )}
        </div>

        {/* Error Content */}
        <div className="space-y-3">
          {/* Error Message with Icon */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getErrorIcon()}</div>
            <div className="flex-1">
              <p className="text-sm text-foreground-700 leading-relaxed mb-3">
                {getErrorMessage(error)}
              </p>

              {/* Loading State Message */}
              {(isRetrying || isResuming) && (
                <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs text-primary font-medium">
                    {isRetrying ? "正在重试..." : "正在恢复对话..."}
                  </span>
                </div>
              )}

              {/* Refresh Hint for Network Issues */}
              {showRefreshHint &&
                (error.error_type === "network_error" ||
                  error.error_type === "stream_generation_failed") && (
                  <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/30 dark:border-blue-800/30">
                    <WifiOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      网络问题可能已解决，尝试刷新页面或重试
                    </span>
                  </div>
                )}

              {/* Action Buttons Row */}
              {!(isRetrying || isResuming) && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Retry Button */}
                  {error.retryable && onRetry && (
                    <Button
                      size="sm"
                      color={isPersisted ? "primary" : "default"}
                      variant={isPersisted ? "solid" : "ghost"}
                      onPress={onRetry}
                      startContent={<RotateCcw className="w-3.5 h-3.5" />}
                      className={`h-8 px-3 text-xs font-medium transition-colors ${
                        isPersisted
                          ? "text-white"
                          : "hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20"
                      }`}
                    >
                      {isPersisted ? "重新发送" : "重新发送"}
                    </Button>
                  )}

                  {/* Resume Button */}
                  {error.resumable && onResume && (
                    <Button
                      size="sm"
                      color={isPersisted ? "secondary" : "default"}
                      variant={isPersisted ? "solid" : "ghost"}
                      onPress={onResume}
                      startContent={<Play className="w-3.5 h-3.5" />}
                      className={`h-8 px-3 text-xs font-medium transition-colors ${
                        isPersisted
                          ? ""
                          : "hover:bg-foreground/5 border border-foreground/10 hover:border-foreground/20"
                      }`}
                    >
                      {isPersisted ? "继续对话" : "继续"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time indicator at bottom right */}
        <div className="text-xs text-foreground-400 mt-2 flex justify-end">
          {formatTime(new Date(error.timestamp))}
        </div>

        {/* Development Details */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-3 pt-2 border-t border-foreground/10">
            <summary className="text-xs text-foreground-400 cursor-pointer hover:text-foreground-600">
              Debug Info
            </summary>
            <div className="mt-2 text-xs font-mono text-foreground-500 space-y-1">
              <div>Type: {error.error_type}</div>
              <div>Retryable: {error.retryable ? "✓" : "✗"}</div>
              <div>Resumable: {error.resumable ? "✓" : "✗"}</div>
              <div className="break-all">Message: {error.error}</div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
