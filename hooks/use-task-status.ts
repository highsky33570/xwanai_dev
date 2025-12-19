/**
 * 任务状态 Hook
 * 用于获取和管理用户任务状态
 */

import { useState, useEffect } from "react"
import { getTaskStatus, type TaskStatus, calculateTaskProgress } from "@/lib/api/tasks"
import { logger } from "@/lib/utils/logger"
import { authOperations } from "@/lib/supabase/auth"

interface UseTaskStatusResult {
  taskStatus: TaskStatus | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  uncompletedCount: number
  allCompleted: boolean
  rewardClaimed: boolean
}

export function useTaskStatus(): UseTaskStatusResult {
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTaskStatus = async () => {
    try {
      // 🔒 只有登录用户才调用API
      const token = await authOperations.getAccessToken()
      if (!token) {
        setTaskStatus(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      
      const status = await getTaskStatus()
      setTaskStatus(status)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch task status"
      setError(errorMessage)
      logger.warn(
        { module: "useTaskStatus", operation: "fetch", error: err },
        "Failed to fetch task status (user may not be logged in)"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTaskStatus()
  }, [])

  // 计算未完成任务数量
  const uncompletedCount = taskStatus 
    ? calculateTaskProgress(taskStatus.tasks).total - calculateTaskProgress(taskStatus.tasks).completed
    : 0

  return {
    taskStatus,
    loading,
    error,
    refetch: fetchTaskStatus,
    uncompletedCount,
    allCompleted: taskStatus?.all_completed ?? false,
    rewardClaimed: taskStatus?.reward_claimed ?? false,
  }
}

