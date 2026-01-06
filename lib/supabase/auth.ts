import { createClient } from "./client"
import { logger } from "../utils/logger"
import { refreshAuthCache, clearAuthCache } from "../utils/authHelpers"
import type { User } from "@supabase/supabase-js"

export interface SignInData {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  username?: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  avatar_url?: string
  created_at: string
  updated_at: string
}
const supabase = createClient();
class AuthOperations {
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error({ module: "auth", operation: "signIn", error }, "Sign in failed")
        return { user: null, error }
      }

      // Refresh authentication cache on successful login
      await refreshAuthCache()

      return { user: data.user, error: null }
    } catch (error) {
      logger.error({ module: "auth", operation: "signIn", error }, "Unexpected error during sign in")
      return { user: null, error }
    }
  }

  async signUp(email: string, password: string, username?: string): Promise<{ user: User | null; error: any }> {
    try {
      // 🔒 重要: 注册前先清除现有 session，防止 token 冲突
      // 检查是否有现有 session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        logger.warn(
          { module: "auth", operation: "signUp" },
          "⚠️ Existing session detected during sign up. Clearing it to prevent conflicts."
        )
        // 清除现有 session（不触发后端登出逻辑）
        await supabase.auth.signOut({ scope: 'local' })
        // 清除认证缓存
        clearAuthCache()
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: username || email.split("@")[0],
            username: username || email.split("@")[0],
          },
        },
      })

      if (error) {
        logger.error({ module: "auth", operation: "signUp", error }, "Sign up failed")
        return { user: null, error }
      }

      // Refresh authentication cache on successful signup
      if (data.user) {
        await refreshAuthCache()
      }

      return { user: data.user, error: null }
    } catch (error) {
      logger.error({ module: "auth", operation: "signUp", error }, "Unexpected error during sign up")
      return { user: null, error }
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        logger.error({ module: "auth", operation: "signOut", error }, "Sign out failed")
        return { error }
      }

      // Clear authentication cache on logout
      clearAuthCache()

      return { error: null }
    } catch (error) {
      logger.error({ module: "auth", operation: "signOut", error }, "Unexpected error during sign out")
      return { error }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // 先检查是否有活动的 session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        return null
      }

      // 如果有 session，再获取用户信息
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        logger.error({ module: "auth", operation: "getCurrentUser", error: userError }, "Failed to get current user")
        return null
      }

      return user
    } catch (error) {
      logger.error({ module: "auth", operation: "getCurrentUser", error }, "Unexpected error getting current user")
      return null
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        logger.error({ module: "auth", operation: "getAccessToken", error }, "Failed to get access token")
        return null
      }

      if (!session) {
        return null
      }

      return session.access_token
    } catch (error) {
      logger.error({ module: "auth", operation: "getAccessToken", error }, "Unexpected error getting access token")
      return null
    }
  }

  async resetPassword(email: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restore-password`,
      })

      if (error) {
        logger.error({ module: "auth", operation: "resetPassword", error }, "Password reset failed")
        return { error }
      }

      return { error: null }
    } catch (error) {
      logger.error({ module: "auth", operation: "resetPassword", error }, "Unexpected error during password reset")
      return { error }
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        logger.error({ module: "auth", operation: "updatePassword", error }, "Password update failed")
        return { error }
      }

      return { error: null }
    } catch (error) {
      logger.error({ module: "auth", operation: "updatePassword", error }, "Unexpected error during password update")
      return { error }
    }
  }

  async updateUser(payload: Parameters<typeof supabase.auth.updateUser>[0]): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.updateUser(payload as any)

      if (error) {
        logger.error({ module: "auth", operation: "updateUser", error }, "User update failed")
        return { error }
      }

      await refreshAuthCache()
      return { error: null }
    } catch (error) {
      logger.error({ module: "auth", operation: "updateUser", error }, "Unexpected error during user update")
      return { error }
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authOperations = new AuthOperations()
