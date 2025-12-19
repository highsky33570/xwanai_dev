/**
 * 订阅状态 Hook
 */

import { useState, useEffect } from "react"
import { subscriptionAPI, SubscriptionInfo } from "@/lib/api/subscription"
import { logger } from "@/lib/utils/logger"
import { authOperations } from "@/lib/supabase/auth"

interface UseSubscriptionResult {
  subscription: SubscriptionInfo | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  isPremium: boolean
}

/**
 * 使用订阅状态 Hook
 */
export function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    try {
      // 🔒 只有登录用户才调用API
      const token = await authOperations.getAccessToken()
      if (!token) {
        setSubscription(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      
      const data = await subscriptionAPI.getSubscriptionStatus()
      
      if (data) {
        setSubscription(data)
      } else {
        setSubscription(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch subscription"
      setError(errorMessage)
      logger.warn(
        { module: "useSubscription", operation: "fetch", error: err },
        "Failed to fetch subscription (user may not be logged in)"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
    isPremium: subscription?.is_premium ?? false,
  }
}

