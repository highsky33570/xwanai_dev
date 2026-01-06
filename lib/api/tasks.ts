/**
 * 任务系统 API
 * 新手任务管理相关接口
 */

import { getAuthHeaders } from "@/lib/utils/authHelpers"
import { API_BASE_URL } from "./config"
import { logger } from "@/lib/utils/logger"

// ============================================================================
// 类型定义
// ============================================================================

export interface TaskInfo {
  completed: boolean
  completed_at: string | null
}

export interface TasksData {
  task_1: TaskInfo  // 完善个人命理档案
  task_2: TaskInfo  // 创建私人角色
  task_3: TaskInfo  // 与角色Agent聊天
  task_4: TaskInfo  // 合盘分析
}

export interface TaskStatus {
  tasks: TasksData
  all_completed: boolean
  all_completed_at: string | null
  reward_claimed: boolean
  reward_claimed_at: string | null
}

export interface ClaimRewardResponse {
  success: boolean
  error?: string
  message: string
  subscription_end_date?: string
}

// ============================================================================
// 任务描述配置
// ============================================================================

export const TASK_ICONS = {
  task_1: "📊",
  task_2: "🎭",
  task_3: "💬",
  task_4: "🔮"
} as const

export type TaskKey = keyof typeof TASK_ICONS

// ============================================================================
// API 函数
// ============================================================================

/**
 * 获取用户任务状态
 */
export async function getTaskStatus(): Promise<TaskStatus | null> {
  try {
    const authHeaders = await getAuthHeaders()
    if (!("Authorization" in authHeaders)) {
      logger.warn(
        { module: "tasks", operation: "getStatus" },
        "User not authenticated"
      )
      return null
    }
    
    const response = await fetch(`${API_BASE_URL}/api/tasks/v1/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      mode: "cors",
      credentials: "omit",
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(8000) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error(
        { module: "tasks", operation: "getStatus", error: errorData },
        "Failed to fetch task status"
      )
      return null
    }

    const result = await response.json()
    const data = result.data || result

    logger.success(
      { module: "tasks", operation: "getStatus", data },
      "Task status fetched successfully"
    )

    return data
  } catch (error) {
    logger.error(
      { module: "tasks", operation: "getStatus", error },
      "Unexpected error fetching task status"
    )
    return null
  }
}

/**
 * 领取新手任务奖励
 */
export async function claimNewbieReward(): Promise<ClaimRewardResponse> {
  try {
    const authHeaders = await getAuthHeaders()
    if (!("Authorization" in authHeaders)) {
      return {
        success: false,
        error: "UNAUTHORIZED",
        message: "请先登录",
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/api/tasks/v1/claim-reward`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      mode: "cors",
      credentials: "omit",
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(8000) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // 提取错误消息
      let errorMessage: string
      if (errorData.detail?.message) {
        errorMessage = errorData.detail.message
      } else if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail
      } else if (errorData.message) {
        errorMessage = errorData.message
      } else {
        errorMessage = "领取奖励失败"
      }

      logger.error(
        { module: "tasks", operation: "claimReward", error: errorData },
        errorMessage
      )
      
      return {
        success: false,
        error: errorData.detail?.error || "UNKNOWN",
        message: errorMessage
      }
    }

    const result = await response.json()
    const data = result.data || result

    logger.success(
      { module: "tasks", operation: "claimReward", data },
      "Reward claimed successfully"
    )

    return data
  } catch (error) {
    // 🎯 改进错误处理：提取更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : "网络错误，请稍后重试"
    
    logger.error(
      { module: "tasks", operation: "claimReward", error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error },
      "Unexpected error claiming reward"
    )
    
    return {
      success: false,
      error: "NETWORK_ERROR",
      message: errorMessage
    }
  }
}

/**
 * 计算任务完成进度
 */
export function calculateTaskProgress(tasks: TasksData): {
  completed: number
  total: number
  percentage: number
} {
  const total = 4
  const completed = Object.values(tasks).filter(task => task.completed).length
  const percentage = Math.round((completed / total) * 100)
  
  return { completed, total, percentage }
}

