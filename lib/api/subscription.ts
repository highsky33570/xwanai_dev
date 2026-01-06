/**
 * 订阅相关API客户端
 */

import { authOperations } from "@/lib/supabase/auth"
import { logger } from "@/lib/utils/logger"
import { createClient } from "@/lib/supabase/client"

/**
 * 订阅状态类型
 */
export type SubscriptionStatus = "free" | "active" | "cancelled" | "expired"
export type SubscriptionTier = "free" | "monthly" | "yearly" | "premium"

/**
 * 订阅信息接口
 */
export interface SubscriptionInfo {
  subscription_status: SubscriptionStatus
  subscription_tier: SubscriptionTier
  subscription_start_date: string | null
  subscription_end_date: string | null
  is_premium: boolean
  days_remaining: number | null
}

/**
 * 订阅API操作
 */
const supabase =  createClient();
export const subscriptionAPI = {
  /**
   * 获取当前用户的订阅状态
   * 🎯 直接使用 Supabase client，不走后端 API（优化性能）
   */
  async getSubscriptionStatus(): Promise<SubscriptionInfo | null> {
    try {
      // 🔒 检查用户是否登录
      const user = await authOperations.getCurrentUser()
      
      if (!user) {
        logger.warn(
          { module: "subscription", operation: "getStatus" },
          "User not authenticated"
        )
        return null
      }

      const userId = user.id

      // 1️⃣ 从 profiles 表获取订阅信息
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_tier, subscription_start_date, subscription_end_date")
        .eq("id", userId)
        .maybeSingle()

      if (profileError) {
        logger.error(
          { module: "subscription", operation: "getStatus", error: profileError },
          "Failed to fetch profile from Supabase"
        )
        return null
      }

      // 如果没有 profile，返回默认免费用户状态
      if (!profile) {
        logger.warn(
          { module: "subscription", operation: "getStatus" },
          "Profile not found, returning default free status"
        )
        return {
          subscription_status: "free",
          subscription_tier: "free",
          subscription_start_date: null,
          subscription_end_date: null,
          is_premium: false,
          days_remaining: null,
        }
      }

      // 2️⃣ 调用 RPC 函数检查是否为付费用户
      const { data: isPremium, error: rpcError } = await supabase.rpc("is_premium_user", {
        target_user_id: userId,
      })

      if (rpcError) {
        logger.error(
          { module: "subscription", operation: "getStatus", error: rpcError },
          "Failed to check premium status via RPC"
        )
      }

      // 3️⃣ 计算剩余天数 & 判断真实状态
      let daysRemaining: number | null = null
      let actualStatus = (profile.subscription_status as SubscriptionStatus) || "free"
      
      if (profile.subscription_end_date) {
        const endDate = new Date(profile.subscription_end_date)
        const now = new Date()
        if (endDate > now) {
          daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        } else {
          // 🎯 修复：如果订阅已过期，强制将状态改为 expired
          // 即使数据库中的 subscription_status 还是 'active'
          if (actualStatus === "active") {
            actualStatus = "expired"
            logger.warn(
              { module: "subscription", operation: "getStatus", userId },
              "Subscription expired, correcting status from 'active' to 'expired'"
            )
          }
        }
      }

      const result: SubscriptionInfo = {
        subscription_status: actualStatus,
        subscription_tier: (profile.subscription_tier as SubscriptionTier) || "free",
        subscription_start_date: profile.subscription_start_date,
        subscription_end_date: profile.subscription_end_date,
        is_premium: isPremium ?? false,
        days_remaining: daysRemaining,
      }

      logger.success(
        { module: "subscription", operation: "getStatus", data: result },
        "Subscription status fetched successfully from Supabase"
      )

      return result
    } catch (error) {
      logger.error(
        { module: "subscription", operation: "getStatus", error },
        "Unexpected error fetching subscription status"
      )
      return null
    }
  },

  /**
   * 检查用户是否为付费用户
   */
  async isPremiumUser(): Promise<boolean> {
    const status = await this.getSubscriptionStatus()
    return status?.is_premium ?? false
  },

  /**
   * 获取订阅剩余天数
   */
  async getDaysRemaining(): Promise<number | null> {
    const status = await this.getSubscriptionStatus()
    return status?.days_remaining ?? null
  },

  /**
   * 格式化订阅套餐名称
   */
  formatTierName(tier: SubscriptionTier, locale: "zh" | "en" = "zh"): string {
    const names = {
      zh: {
        free: "免费版",
        monthly: "月付会员",
        yearly: "年付会员",
        premium: "试用会员", // 🎯 新手任务奖励的7天试用会员
      },
      en: {
        free: "Free",
        monthly: "Monthly Premium",
        yearly: "Yearly Premium",
        premium: "Trial Premium", // 🎯 7-day trial from beginner tasks
      },
    }
    return names[locale][tier] || tier
  },

  /**
   * 格式化订阅状态
   */
  formatStatusName(status: SubscriptionStatus, locale: "zh" | "en" = "zh"): string {
    const names = {
      zh: {
        free: "免费用户",
        active: "会员激活",
        cancelled: "已取消",
        expired: "已过期",
      },
      en: {
        free: "Free User",
        active: "Active",
        cancelled: "Cancelled",
        expired: "Expired",
      },
    }
    return names[locale][status] || status
  },
}

