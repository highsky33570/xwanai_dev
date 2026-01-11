"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authOperations } from "@/lib/supabase/auth"
import { logger } from "@/lib/utils/logger"

/**
 * Component to handle authentication callback from URL parameters
 * Supports access_token and refresh_token from query parameters
 * 
 * Usage: Add this component to your root layout or specific pages
 * that need to handle auth redirects
 */
export function AuthCallbackHandler() {
  const router = useRouter()
  const [processed, setProcessed] = useState(false)

  useEffect(() => {
    // Only process once
    if (processed) return

    const handleAuthCallback = async () => {
      // Check if we're in the browser
      if (typeof window === "undefined") return

      // Get URL parameters from window.location
      const urlParams = new URLSearchParams(window.location.search)
      const accessToken = urlParams.get('access_token')
      const refreshToken = urlParams.get('refresh_token')
      const redirectTo = urlParams.get('redirect_to') || '/'

      if (!accessToken) {
        // No access token, nothing to do
        setProcessed(true)
        return
      }

      // Mark as processed immediately to prevent duplicate processing
      setProcessed(true)

      try {
        logger.info(
          { module: "auth-callback", operation: "handleAuthCallback" },
          "Processing authentication callback"
        )

        // Use the auth operations to sign in with the token
        const { user, error } = await authOperations.signInWithToken(
          accessToken,
          refreshToken || undefined
        )

        if (error) {
          logger.error(
            { module: "auth-callback", operation: "handleAuthCallback", error },
            "Failed to sign in with token"
          )
          // Redirect to login page on error
          router.replace('/login?error=authentication_failed')
          return
        }

        if (user) {
          logger.success(
            { module: "auth-callback", operation: "handleAuthCallback" },
            "Successfully authenticated with token"
          )

          // Remove auth parameters from URL and redirect
          const url = new URL(window.location.href)
          url.searchParams.delete('access_token')
          url.searchParams.delete('refresh_token')
          url.searchParams.delete('redirect_to')
          url.searchParams.delete('type')

          // Use replace to avoid adding to history
          window.history.replaceState({}, '', url.pathname + (url.search || ''))

          // Redirect to the specified page or home
          router.replace(redirectTo)
        }
      } catch (error) {
        logger.error(
          { module: "auth-callback", operation: "handleAuthCallback", error },
          "Unexpected error during auth callback"
        )
        router.replace('/login?error=authentication_failed')
      }
    }

    handleAuthCallback()
  }, [router, processed])

  // This component doesn't render anything
  return null
}
