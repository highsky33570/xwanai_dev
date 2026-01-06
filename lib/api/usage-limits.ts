/**
 * 使用限制相关 API
 */

import { authOperations } from "@/lib/supabase/auth"
import { logger } from "@/lib/utils/logger"
import { API_BASE_URL } from "./config"
import { createClient } from "@/lib/supabase/client"

/**
 * 使用统计数据类型
 */
export interface UsageStats {
  is_premium: boolean  // 🎯 是否为会员（付费 OR 试用）
  is_paid_premium?: boolean  // 🎯 是否为付费会员
  is_trial_premium?: boolean  // 🎯 是否为试用会员（邀请奖励）
  subscription_tier?: string  // 🎯 订阅等级
  character_count: number
  xwan_ai_daily_count?: number  // 🎯 每日 XWAN AI 创建次数（角色/命盘）
  chat_daily_count: number
  hepan_weekly_count: number
  character_session_weekly_count: number
  chat_daily_reset_at?: string | null
  hepan_weekly_reset_at?: string | null
  character_session_weekly_reset_at?: string | null
  limits: {
    character_max: number
    xwan_ai_daily_max?: number  // 🎯 每日 XWAN AI 创建次数限制 (-1 = 不限)
    chat_daily_max: number  // -1 表示不限
    hepan_weekly_max: number  // -1 表示不限
    character_session_weekly_max: number
  }
}

/**
 * 使用限制错误详情
 */
export interface UsageLimitErrorDetail {
  code: "USAGE_LIMIT_EXCEEDED"
  message: string
  limit_type: "character_count" | "xwan_ai_daily" | "chat_daily" | "hepan_weekly" | "character_session_weekly"
  current: number
  limit: number
  reset_time?: string | null
}

/**
 * 使用限制 API 操作
 */
export const usageLimitsAPI = {
  /**
   * 获取用户使用统计
   * 🎯 优化：直接调用 Supabase RPC，不经过后端中转，减少延迟
   */
  async getUsageStats(): Promise<UsageStats | null> {
    try {
      const accessToken = await authOperations.getAccessToken()
      
      if (!accessToken) {
        logger.warn(
          { module: "usage-limits", operation: "getStats" },
          "User not authenticated"
        )
        return null
      }

      // 🎯 直接调用 Supabase RPC
      const supabase =  await createClient();
      const { data: user } = await supabase.auth.getUser()
      
      if (!user?.user?.id) {
        logger.warn(
          { module: "usage-limits", operation: "getStats" },
          "User ID not found"
        )
        return null
      }

      // 🔧 使用 any 类型断言，因为 Supabase 不知道自定义 RPC 函数类型
      const { data, error } = await (supabase.rpc as any)("get_usage_stats", {
        user_id_param: user.user.id
      })

      if (error) {
        logger.error(
          { module: "usage-limits", operation: "getStats", error },
          "Failed to fetch usage stats from RPC"
        )
        return null
      }

      // RPC 函数返回的是数组，取第一个元素
      const rawStats = Array.isArray(data) ? data[0] : data
      
      if (!rawStats) {
        logger.warn(
          { module: "usage-limits", operation: "getStats" },
          "No stats data returned"
        )
        return null
      }

      // 🎯 转换为前端期望的格式
      const isPaidPremium = ['monthly', 'yearly', 'premium'].includes(rawStats.subscription_tier as string)
      const isTrialPremium = rawStats.is_trial_premium || false
      
      const stats: UsageStats = {
        is_premium: isPaidPremium || isTrialPremium,  // 🔧 修复：包含试用会员
        character_count: rawStats.character_count || 0,
        xwan_ai_daily_count: rawStats.xwan_ai_daily_count || 0,
        chat_daily_count: 0,  // 已废弃，保留兼容性
        hepan_weekly_count: rawStats.hepan_weekly_count || 0,
        character_session_weekly_count: rawStats.character_session_weekly_count || 0,
        limits: {
          character_max: rawStats.character_limit || 5,
          xwan_ai_daily_max: rawStats.xwan_ai_daily_limit || 5,
          chat_daily_max: -1,  // 已废弃
          hepan_weekly_max: rawStats.hepan_weekly_limit || 5,
          character_session_weekly_max: rawStats.character_session_weekly_limit || 3
        }
      }
      
      logger.success(
        { module: "usage-limits", operation: "getStats", data: stats },
        "Usage stats fetched successfully"
      )
      return stats
    } catch (error) {
      logger.error(
        { module: "usage-limits", operation: "getStats", error },
        "Unexpected error fetching usage stats"
      )
      return null
    }
  },

  /**
   * 检查是否达到角色数量限制
   */
  async isCharacterLimitReached(): Promise<boolean> {
    const stats = await this.getUsageStats()
    if (!stats) return false
    return stats.character_count >= stats.limits.character_max
  },

  /**
   * 检查是否达到聊天次数限制
   */
  async isChatLimitReached(): Promise<boolean> {
    const stats = await this.getUsageStats()
    if (!stats) return false
    if (stats.limits.chat_daily_max === -1) return false  // 不限
    return stats.chat_daily_count >= stats.limits.chat_daily_max
  },

  /**
   * 检查是否达到合盘次数限制
   */
  async isHepanLimitReached(): Promise<boolean> {
    const stats = await this.getUsageStats()
    if (!stats) return false
    if (stats.limits.hepan_weekly_max === -1) return false  // 不限
    return stats.hepan_weekly_count >= stats.limits.hepan_weekly_max
  },

  /**
   * 检查是否达到角色Session限制
   */
  async isCharacterSessionLimitReached(): Promise<boolean> {
    const stats = await this.getUsageStats()
    if (!stats) return false
    return stats.character_session_weekly_count >= stats.limits.character_session_weekly_max
  },

  /**
   * 格式化限制名称
   */
  formatLimitName(limitType: string, locale: "zh" | "en" = "zh"): string {
    const names = {
      zh: {
        character_count: "角色数量",
        chat_daily: "每日聊天次数",
        hepan_weekly: "每周合盘次数",
        character_session_weekly: "每周角色对话"
      },
      en: {
        character_count: "Character Count",
        chat_daily: "Daily Chat",
        hepan_weekly: "Weekly Hepan",
        character_session_weekly: "Weekly Character Sessions"
      }
    }
    return names[locale][limitType as keyof typeof names.zh] || limitType
  },

  /**
   * 格式化重置时间
   */
  formatResetTime(resetTime: string | null | undefined, locale: "zh" | "en" = "zh"): string {
    if (!resetTime) return ""
    
    try {
      const date = new Date(resetTime)
      const now = new Date()
      const diffMs = date.getTime() - now.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      
      if (locale === "zh") {
        if (diffDays > 0) {
          return `${diffDays}天后重置`
        } else if (diffHours > 0) {
          return `${diffHours}小时后重置`
        } else {
          return "即将重置"
        }
      } else {
        if (diffDays > 0) {
          return `Resets in ${diffDays} day${diffDays > 1 ? 's' : ''}`
        } else if (diffHours > 0) {
          return `Resets in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
        } else {
          return "Resetting soon"
        }
      }
    } catch (error) {
      return ""
    }
  }
}

