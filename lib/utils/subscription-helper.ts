/**
 * 订阅状态刷新助手
 * 用于在任务完成后检测并显示试用会员升级提示
 */

import { Store } from "@/store"
import { toast } from "@/hooks/use-toast"
import { logger } from "./logger"

/**
 * 检查并刷新订阅状态，如果检测到升级则显示提示
 * 
 * @param context - 调用上下文（用于日志）
 * @param rewardAutoClaimed - 后端返回的奖励自动领取标志
 */
export async function checkAndRefreshSubscription(
  context: string,
  rewardAutoClaimed?: boolean
): Promise<void> {
  try {
    const userId = Store.user.userId
    if (!userId) {
      logger.debug({ module: context, operation: "checkSubscription" }, "User not logged in, skipping")
      return
    }

    // 🎯 如果后端明确告知奖励已自动领取，直接刷新并显示提示
    if (rewardAutoClaimed === true) {
      logger.info({ module: context, operation: "checkSubscription" }, "Reward auto-claimed, refreshing subscription")
      
      await Store.user.fetchSubscription()
      
      // 显示升级提示
      toast({
        title: "🎉 恭喜升级为试用会员！",
        description: "您已完成所有新手任务并获得7天试用会员奖励",
        duration: 5000,
      })
      
      logger.success({ module: context, operation: "checkSubscription" }, "User upgraded to trial premium!")
      return
    }

    // 🎯 否则，检测订阅状态变化
    const oldTier = Store.user.subscriptionTier
    
    // 如果已经是试用会员或更高级别，跳过检查
    if (oldTier !== "free") {
      logger.debug({ module: context, operation: "checkSubscription" }, `Already premium tier: ${oldTier}`)
      return
    }
    
    // 刷新订阅状态
    await Store.user.fetchSubscription()
    
    const newTier = Store.user.subscriptionTier
    
    // 检测到升级
    if (newTier === "premium") {
      toast({
        title: "🎉 恭喜升级为试用会员！",
        description: "您已完成所有新手任务并获得7天试用会员奖励",
        duration: 5000,
      })
      
      logger.success({ module: context, operation: "checkSubscription" }, "User upgraded to trial premium!")
    }
  } catch (error) {
    logger.warn({ module: context, operation: "checkSubscription", error }, "Failed to refresh subscription")
  }
}

