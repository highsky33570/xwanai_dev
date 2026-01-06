/**
 * 带使用限制处理的 API 客户端包装器
 */

import { handleUsageLimitError, UsageLimitErrorDetail } from "@/lib/utils/usage-limit-error"
import { logger } from "@/lib/utils/logger"

/**
 * 全局使用限制错误处理器配置
 */
let globalUpgradeHandler: ((detail: UsageLimitErrorDetail) => void) | null = null
let globalToastHandler: ((message: string) => void) | null = null

/**
 * 设置全局升级提示处理器
 */
export function setGlobalUpgradeHandler(handler: (detail: UsageLimitErrorDetail) => void) {
  globalUpgradeHandler = handler
}

/**
 * 设置全局Toast处理器
 */
export function setGlobalToastHandler(handler: (message: string) => void) {
  globalToastHandler = handler
}

/**
 * API请求包装器 - 自动处理使用限制错误
 */
export async function apiRequestWithLimitHandling<T>(
  requestFn: () => Promise<T>,
  options?: {
    onLimitExceeded?: (detail: UsageLimitErrorDetail) => void
    customMessage?: string
  }
): Promise<T> {
  try {
    return await requestFn()
  } catch (error) {
    // 尝试处理使用限制错误
    const handled = handleUsageLimitError(error, {
      onShowUpgrade: options?.onLimitExceeded || globalUpgradeHandler || undefined,
      showToast: globalToastHandler || undefined,
      customMessage: options?.customMessage
    })

    // 如果是使用限制错误且已处理，不再抛出
    if (handled) {
      logger.info(
        { module: "api-client", operation: "limit-handled" },
        "Usage limit error handled"
      )
      throw error  // 仍然抛出错误，但上层可以选择忽略
    }

    // 不是使用限制错误，继续抛出
    throw error
  }
}

/**
 * Fetch 包装器 - 自动处理使用限制错误
 */
export async function fetchWithLimitHandling(
  url: string,
  options?: RequestInit & {
    onLimitExceeded?: (detail: UsageLimitErrorDetail) => void
  }
): Promise<Response> {
  const { onLimitExceeded, ...fetchOptions } = options || {}

  try {
    const response = await fetch(url, fetchOptions)

    // 检查是否是使用限制错误
    if (response.status === 403) {
      const clone = response.clone()
      try {
        const data = await clone.json()
        if (data?.detail?.code === "USAGE_LIMIT_EXCEEDED") {
          const error = {
            response: {
              status: 403,
              data: { detail: data.detail }
            }
          }

          handleUsageLimitError(error, {
            onShowUpgrade: onLimitExceeded || globalUpgradeHandler || undefined,
            showToast: globalToastHandler || undefined
          })
        }
      } catch (e) {
        // JSON解析失败，忽略
      }
    }

    return response
  } catch (error) {
    throw error
  }
}

/**
 * React Hook: 带使用限制处理的API调用
 */
export function useApiWithLimitHandling() {
  return {
    request: apiRequestWithLimitHandling,
    fetch: fetchWithLimitHandling
  }
}

