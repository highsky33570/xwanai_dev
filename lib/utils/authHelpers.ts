/**
 * Authentication helper utilities for API requests
 */

import { createClient } from "@/lib/supabase/client"
import { logger } from "./logger"

/**
 * Interface for authentication state
 */
interface AuthState {
  token: string | null
  expiresAt: number | null
  isExpired: boolean
}

let cachedAuthState: AuthState = {
  token: null,
  expiresAt: null,
  isExpired: true
}

/**
 * Checks if a JWT token is expired or will expire soon (within 5 minutes)
 */
const supabase = createClient();
const isTokenExpired = (expiresAt: number | null): boolean => {
  if (!expiresAt) return true
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
  return expiresAt * 1000 < fiveMinutesFromNow
}

/**
 * Gets a fresh JWT token with refresh logic
 * Automatically refreshes token if expired or expiring soon
 */
export const getCurrentUserToken = async (): Promise<string | null> => {
  try {
    // Always get fresh session for most reliable token
    // This ensures we get the latest token after login/refresh
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.warn("⚠️ Error getting current session:", sessionError.message)
      cachedAuthState = { token: null, expiresAt: null, isExpired: true }
      return null
    }

    if (currentSession?.access_token) {
      const token = currentSession.access_token
      
      // Update cache with current session
      cachedAuthState = {
        token: token,
        expiresAt: currentSession.expires_at || null,
        isExpired: false
      }
      
      return token
    }

    // If no current session (user not logged in), return null
    cachedAuthState = { token: null, expiresAt: null, isExpired: true }
    return null

  } catch (error) {
    console.error("❌ Error getting JWT token:", error)
    cachedAuthState = { token: null, expiresAt: null, isExpired: true }
    return null
  }
}

/**
 * Gets authorization headers for API requests
 * Includes JWT token if user is authenticated, with automatic refresh
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getCurrentUserToken()
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
  
  if (token) {
    // Debug logging to ensure token is properly formatted
    // Standard Bearer header
    headers["Authorization"] = `Bearer ${token}`
  } else {
    console.warn("⚠️ No JWT token available for API request")
  }
  return headers
}

/**
 * Clears the cached authentication state
 * Should be called on logout or authentication errors
 */
export const clearAuthCache = (): void => {
  cachedAuthState = { token: null, expiresAt: null, isExpired: true }
}

/**
 * Forces a refresh of the authentication cache
 * Should be called on successful login to ensure fresh token
 */
export const refreshAuthCache = async (): Promise<void> => {
  // Clear current cache
  clearAuthCache()
  
  // Get fresh token
  const token = await getCurrentUserToken()
  
  if (!token) {
    console.warn("⚠️ Failed to refresh authentication cache - no token retrieved")
  }
}

/**
 * Gets the current user ID from the JWT token
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.warn("⚠️ Could not get current user ID:", error?.message)
      return null
    }
    
    return user.id
  } catch (error) {
    console.error("❌ Error getting current user ID:", error)
    return null
  }
}

/**
 * Checks if the current user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getCurrentUserToken()
  return token !== null
}

/**
 * Handles authentication errors and performs appropriate cleanup
 */
export const handleAuthError = (error: any): void => {
  console.error("🚨 Authentication error:", error)
  
  // Clear cache on auth errors
  clearAuthCache()
  
  // Check if this is a token expiration error
  if (error?.status === 401 || error?.message?.includes("token") || error?.message?.includes("unauthorized")) {
    // You could add redirect logic here if needed
  }
}
