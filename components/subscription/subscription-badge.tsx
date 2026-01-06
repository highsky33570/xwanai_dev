/**
 * 订阅徽章组件
 * 显示用户的订阅状态
 */

"use client"

import { Chip } from "@heroui/react"
import { Crown, Sparkles, XCircle } from "lucide-react"
import { subscriptionAPI } from "@/lib/api/subscription"
import { useTranslation } from "@/lib/utils/translations"
import { observer } from "mobx-react-lite"
import { Store } from "@/store"

interface SubscriptionBadgeProps {
  /**
   * 显示类型
   * - "full": 完整显示（状态 + 剩余天数）
   * - "simple": 简单显示（仅状态）
   * - "icon": 仅图标
   */
  variant?: "full" | "simple" | "icon"
  
  /**
   * 尺寸
   */
  size?: "sm" | "md" | "lg"
}

export const SubscriptionBadge = observer(({ 
  variant = "simple",
  size = "sm" 
}: SubscriptionBadgeProps) => {
  const { getLanguage } = useTranslation()
  const subscription = Store.user.subscription

  // 🎯 无订阅信息、免费用户、已过期、已取消 → 不显示徽章
  if (
    !subscription || 
    subscription.subscription_status === "free" ||
    subscription.subscription_status === "expired" ||
    subscription.subscription_status === "cancelled"
  ) {
    return null
  }

  // 根据状态确定颜色
  const getColor = () => {
    switch (subscription.subscription_status) {
      case "active":
        return "warning" // 金色表示会员
      case "cancelled":
        return "default"
      case "expired":
        return "danger"
      default:
        return "default"
    }
  }

  // 根据状态确定图标
  const getIcon = () => {
    switch (subscription.subscription_status) {
      case "active":
        if (subscription.subscription_tier === "yearly") {
          return <Crown className="w-3 h-3" />
        } else if (subscription.subscription_tier === "premium") {
          return <Sparkles className="w-3 h-3 text-primary" /> // 🎯 试用会员使用主题色星星
        } else {
          return <Sparkles className="w-3 h-3" />
        }
      case "expired":
      case "cancelled":
        return <XCircle className="w-3 h-3" /> // 🎯 过期/取消显示叉号图标
      default:
        return null
    }
  }

  // 仅图标模式
  if (variant === "icon") {
    const iconColorClass = subscription.subscription_status === "expired" 
      ? "text-danger" 
      : "text-warning"
    return (
      <div className={`flex items-center justify-center w-5 h-5 ${iconColorClass}`}>
        {getIcon()}
      </div>
    )
  }

  // 获取显示文本
  const getText = () => {
    const lang = getLanguage()
    
    // 🎯 修复：如果订阅已过期或已取消，显示状态而不是套餐名称
    if (subscription.subscription_status === "expired" || subscription.subscription_status === "cancelled") {
      return subscriptionAPI.formatStatusName(subscription.subscription_status, lang)
    }
    
    if (variant === "full") {
      const tierName = subscriptionAPI.formatTierName(
        subscription.subscription_tier,
        lang
      )
      const daysText = subscription.days_remaining
        ? ` (${subscription.days_remaining}${lang === "zh" ? "天" : "d"})`
        : ""
      return `${tierName}${daysText}`
    }
    
    // simple 模式 - 激活状态显示套餐名称
    return subscriptionAPI.formatTierName(
      subscription.subscription_tier,
      lang
    )
  }

  return (
    <Chip
      color={getColor()}
      size={size}
      variant="flat"
      startContent={getIcon()}
      className="font-semibold"
    >
      {getText()}
    </Chip>
  )
})

