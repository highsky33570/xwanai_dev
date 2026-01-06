/**
 * 使用限制错误处理工具
 */

import { UsageLimitErrorDetail } from "@/lib/api/usage-limits"
import { logger } from "@/lib/utils/logger"

/**
 * 检查是否为使用限制错误
 */
export function isUsageLimitError(error: any): error is { response: { status: 403; data: { detail: UsageLimitErrorDetail } } } {
  return (
    error?.response?.status === 403 &&
    error?.response?.data?.detail?.code === "USAGE_LIMIT_EXCEEDED"
  )
}

/**
 * 提取使用限制错误详情
 */
export function getUsageLimitErrorDetail(error: any): UsageLimitErrorDetail | null {
  if (isUsageLimitError(error)) {
    return error.response.data.detail
  }
  return null
}

/**
 * 格式化使用限制错误消息（中文）
 */
export function formatUsageLimitError(detail: UsageLimitErrorDetail): string {
  const limitNames: Record<string, string> = {
    character_count: "角色数量",
    chat_daily: "每日聊天次数",
    hepan_weekly: "每周合盘次数",
    character_session_weekly: "每周角色对话Session"
  }

  const limitName = limitNames[detail.limit_type] || "使用次数"
  let message = `您已达到${limitName}上限（${detail.current}/${detail.limit}）`

  if (detail.reset_time) {
    try {
      const resetDate = new Date(detail.reset_time)
      const now = new Date()
      const diffMs = resetDate.getTime() - now.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffDays > 0) {
        message += `，${diffDays}天后重置`
      } else if (diffHours > 0) {
        message += `，${diffHours}小时后重置`
      } else {
        message += `，即将重置`
      }
    } catch (error) {
      // 忽略时间解析错误
    }
  }

  return message
}

/**
 * 获取升级提示消息
 */
export function getUpgradePromptMessage(limitType: string): string {
  const messages: Record<string, string> = {
    character_count: "升级为会员，创建更多角色（最多15个）",
    chat_daily: "升级为会员，享受无限制聊天",
    hepan_weekly: "升级为会员，享受无限制合盘分析",
    character_session_weekly: "升级为会员，每周最多10个角色对话"
  }

  return messages[limitType] || "升级为会员，享受更多权益"
}

/**
 * 处理使用限制错误（返回true表示已处理）
 */
export function handleUsageLimitError(
  error: any,
  options?: {
    onShowUpgrade?: (detail: UsageLimitErrorDetail) => void
    showToast?: (message: string) => void
    customMessage?: string
  }
): boolean {
  const detail = getUsageLimitErrorDetail(error)
  
  if (!detail) {
    return false  // 不是使用限制错误
  }

  logger.warn(
    { module: "usage-limit", detail },
    "Usage limit exceeded"
  )

  // 格式化错误消息
  const message = options?.customMessage || formatUsageLimitError(detail)
  const upgradeMessage = getUpgradePromptMessage(detail.limit_type)

  // 显示Toast（如果提供）
  if (options?.showToast) {
    options.showToast(`${message}\n${upgradeMessage}`)
  }

  // 触发升级弹窗回调（如果提供）
  if (options?.onShowUpgrade) {
    options.onShowUpgrade(detail)
  }

  return true  // 已处理
}

/**
 * 创建一个带使用限制处理的包装函数
 */
export function withUsageLimitHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    onLimitExceeded?: (detail: UsageLimitErrorDetail) => void
    showToast?: (message: string) => void
  }
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      const handled = handleUsageLimitError(error, {
        onShowUpgrade: options?.onLimitExceeded,
        showToast: options?.showToast
      })
      
      if (!handled) {
        throw error  // 如果不是使用限制错误，继续抛出
      }
    }
  }) as T
}

/**
 * React Hook: 使用限制错误处理
 */
export function useUsageLimitErrorHandler(options?: {
  onLimitExceeded?: (detail: UsageLimitErrorDetail) => void
}) {
  return {
    handleError: (error: any) => {
      return handleUsageLimitError(error, {
        onShowUpgrade: options?.onLimitExceeded
      })
    },
    isLimitError: isUsageLimitError,
    getErrorDetail: getUsageLimitErrorDetail,
    formatError: formatUsageLimitError
  }
}

