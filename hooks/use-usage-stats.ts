/**
 * 使用统计 Hook
 */

import { useState, useEffect, useCallback } from "react"
import { usageLimitsAPI, UsageStats } from "@/lib/api/usage-limits"
import { logger } from "@/lib/utils/logger"
import { authOperations } from "@/lib/supabase/auth"

interface UseUsageStatsResult {
  stats: UsageStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  
  // 便捷方法
  isCharacterLimitReached: boolean
  isChatLimitReached: boolean
  isHepanLimitReached: boolean
  isCharacterSessionLimitReached: boolean
}

/**
 * 使用统计 Hook
 */
export function useUsageStats(): UseUsageStatsResult {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      // 🔒 只有登录用户才调用API
      const token = await authOperations.getAccessToken()
      if (!token) {
        setStats(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      
      const data = await usageLimitsAPI.getUsageStats()
      
      if (data) {
        setStats(data)
      } else {
        setStats(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch usage stats"
      setError(errorMessage)
      logger.warn(
        { module: "useUsageStats", operation: "fetch", error: err },
        "Failed to fetch usage stats (user may not be logged in)"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // 便捷判断方法（添加可选链保护）
  const isCharacterLimitReached = stats && stats.limits ? stats.character_count >= stats.limits.character_max : false
  const isChatLimitReached = stats && stats.limits ? (
    stats.limits.chat_daily_max !== -1 && stats.chat_daily_count >= stats.limits.chat_daily_max
  ) : false
  const isHepanLimitReached = stats && stats.limits ? (
    stats.limits.hepan_weekly_max !== -1 && stats.hepan_weekly_count >= stats.limits.hepan_weekly_max
  ) : false
  const isCharacterSessionLimitReached = stats && stats.limits ? (
    stats.character_session_weekly_count >= stats.limits.character_session_weekly_max
  ) : false

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
    isCharacterLimitReached,
    isChatLimitReached,
    isHepanLimitReached,
    isCharacterSessionLimitReached
  }
}

