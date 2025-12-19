/**
 * 分享系统 API Client
 */

import { API_BASE_URL } from "./config"
import { authOperations } from "@/lib/supabase/auth"
import { logger } from "@/lib/utils/logger"

// ============================================================================
// Types
// ============================================================================

export interface CreateShareRequest {
  share_type: "character" | "chat" | "hepan"
  character_id?: string
  selected_reports?: string[]
  session_id?: string
  selected_message_ids?: string[]
  include_user_messages?: boolean
}

export interface ShareResponse {
  share_token: string
  share_url: string
  share_type: string
  expires_at: string
}

export interface CharacterShareContent {
  id: string
  name: string
  gender: string
  birth_time?: string
  description?: string
  mbti?: string
  tags: string[]
  avatar_id?: string
  reports: Record<string, any>
  character_metadata: Record<string, any>
  selected_reports: string[]
}

export interface ChatMessageContent {
  id: string
  role: "user" | "model"
  content: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface ShareDetailResponse {
  share_type: string
  owner_info: {
    display_name: string
    avatar?: string
  }
  character?: CharacterShareContent
  messages?: ChatMessageContent[]
  session_mode?: string
  view_count: number
  created_at: string
}

export interface RecordViewResponse {
  success: boolean
  reward_granted: boolean
  reward?: {
    chat_bonus: number
    hepan_bonus: number
    character_bonus: number
    agent_bonus: number
    expires_at: string
    count: number
  }
  message?: string
}

export interface UserShare {
  id: string
  share_token: string
  share_type: string
  character_id?: string
  session_id?: string
  character_name?: string
  character_access_level?: string
  session_mode?: string
  view_count: number
  expires_at: string
  created_at: string
}

export interface ActiveShareRewards {
  chat_bonus: number
  hepan_bonus: number
  character_bonus: number
  agent_bonus: number
  active_count: number
}

// ============================================================================
// Helper: Generate Viewer Fingerprint
// ============================================================================

/**
 * 生成或获取访客指纹（用于防刷）
 */
export function getViewerFingerprint(): string {
  if (typeof window === "undefined") return ""
  
  const stored = localStorage.getItem("viewer_session_id")
  if (stored) return stored
  
  const fingerprint = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  localStorage.setItem("viewer_session_id", fingerprint)
  return fingerprint
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * 创建分享
 */
export async function createShare(
  request: CreateShareRequest
): Promise<ShareResponse> {
  const token = await authOperations.getAccessToken()
  if (!token) throw new Error("请先登录")

  logger.info("📤 [Share] Creating share", { type: request.share_type })

  const response = await fetch(`${API_BASE_URL}/api/share/v1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json()
    logger.error("❌ [Share] Create failed", error)
    throw new Error(error.detail || "创建分享失败")
  }

  const result = await response.json()
  // 🔧 后端包装了响应为 {code, message, data} 格式
  const data = result.data || result
  logger.info("✅ [Share] Created", { token: data.share_token })
  return data
}

/**
 * 获取分享详情（无需登录）
 */
export async function getShareDetail(
  shareToken: string
): Promise<ShareDetailResponse> {
  logger.info("🔍 [Share] Getting detail", { token: shareToken })

  // 可选：如果用户已登录，附带 token
  const token = await authOperations.getAccessToken().catch(() => null)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/share/v1/${shareToken}`, {
    method: "GET",
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    logger.error("❌ [Share] Get detail failed", error)
    throw new Error(error.detail || "获取分享详情失败")
  }

  const result = await response.json()
  const data = result.data || result
  logger.info("✅ [Share] Detail retrieved", { type: data.share_type })
  return data
}

/**
 * 记录分享访问（触发奖励）
 */
export async function recordShareView(
  shareToken: string
): Promise<RecordViewResponse> {
  logger.info("👁️  [Share] Recording view", { token: shareToken })

  // 获取访客指纹
  const viewerSessionId = getViewerFingerprint()

  // 可选：如果用户已登录，附带 token
  const token = await authOperations.getAccessToken().catch(() => null)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/share/v1/view`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      share_token: shareToken,
      viewer_session_id: viewerSessionId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    logger.error("❌ [Share] Record view failed", error)
    throw new Error(error.detail || "记录访问失败")
  }

  const result = await response.json()
  const data = result.data || result
  
  if (data.reward_granted) {
    logger.info("🎁 [Share] Reward granted!", {
      count: data.reward?.count,
      bonuses: {
        chat: data.reward?.chat_bonus,
        hepan: data.reward?.hepan_bonus,
        character: data.reward?.character_bonus,
        agent: data.reward?.agent_bonus,
      },
    })
  }

  return data
}

/**
 * 获取用户的分享列表
 */
export async function getUserShares(params?: {
  limit?: number
  offset?: number
}): Promise<{ shares: UserShare[]; total: number }> {
  const token = await authOperations.getAccessToken()
  if (!token) throw new Error("请先登录")

  const { limit = 20, offset = 0 } = params || {}
  const url = `${API_BASE_URL}/api/share/v1/user/list?limit=${limit}&offset=${offset}`

  logger.info("📋 [Share] Getting user shares")

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    logger.error("❌ [Share] Get list failed", error)
    throw new Error(error.detail || "获取分享列表失败")
  }

  const result = await response.json()
  const data = result.data || result
  logger.info("✅ [Share] Got user shares", { total: data.total })
  return data
}

/**
 * 获取当前有效的分享奖励
 */
export async function getActiveShareRewards(): Promise<ActiveShareRewards> {
  const token = await authOperations.getAccessToken()
  if (!token) throw new Error("请先登录")

  logger.info("🎁 [Share] Getting active rewards")

  const response = await fetch(`${API_BASE_URL}/api/share/v1/rewards/active`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    logger.error("❌ [Share] Get rewards failed", error)
    throw new Error(error.detail || "获取奖励失败")
  }

  const result = await response.json()
  const data = result.data || result
  logger.info("✅ [Share] Got rewards", { active_count: data.active_count })
  return data
}

/**
 * 删除分享
 */
export async function deleteShare(shareId: string): Promise<void> {
  const token = await authOperations.getAccessToken()
  if (!token) throw new Error("请先登录")

  logger.info("🗑️  [Share] Deleting share", { id: shareId })

  const response = await fetch(`${API_BASE_URL}/api/share/v1/${shareId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    logger.error("❌ [Share] Delete failed", error)
    throw new Error(error.detail || "删除分享失败")
  }

  // DELETE 请求也需要解包
  const result = await response.json()
  const data = result.data || result
  logger.info("✅ [Share] Deleted", data)
}

