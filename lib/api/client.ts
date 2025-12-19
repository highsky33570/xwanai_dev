// API Client functions based on OpenAPI specification

import { getAuthHeaders } from "@/lib/utils/authHelpers"
import { API_BASE_URL, apiEndpoints } from "./config"
import { formatBirthdayToISO } from "@/lib/utils/dateFormatter"

import { createClient } from '@/lib/supabase/client'
// API base URL and endpoints are centralized in lib/api/config

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message)
    this.name = "APIError"
  }
}

// Import types from the types file
import type {
  BasicBaziCharacterCreate,
  BasicBaziCreate,
  ChatRequest,
  BasicBaziSessionShareResponse,
  CharacterWithDetails,
  AvatarUploadResponse,
  CreateSessionRequest,
  CreateSessionResponse,
} from "./types"

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  // Get authentication headers including JWT token
  const authHeaders = await getAuthHeaders()

  if (!API_BASE_URL) {
    throw new APIError("API base URL not configured", 500)
  }

  try {
    const response = await fetch(url, {
      // Ensure browser CORS requests do not attach cookies; we auth via Bearer token only
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      let errorData: any = {}

      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      // 🎯 从多个可能的位置提取错误消息
      let errorMessage: string;
      
      // 情况1: errorData.message 是对象（包含 UsageLimitError）
      if (typeof errorData.message === 'object' && errorData.message?.message) {
        errorMessage = errorData.message.message;
      }
      // 情况2: errorData.detail.message
      else if (errorData.detail?.message) {
        errorMessage = errorData.detail.message;
      }
      // 情况3: errorData.message 是字符串
      else if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      }
      // 情况4: errorData.detail 是字符串
      else if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      }
      // 情况5: errorText
      else if (errorText) {
        errorMessage = errorText;
      }
      // 降级：使用状态码
      else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new APIError(
        errorMessage,
        response.status,
        errorData,
      )
    }

    const responseData = await response.json()
    return responseData
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError("Network error", 0, error)
  }
}

export const apiClient = {
  // Avatar upload
  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const url = `${API_BASE_URL}${apiEndpoints.users.avatar}`

    // Get auth headers (but exclude Content-Type for FormData)
    const authHeaders = await getAuthHeaders()
    const { "Content-Type": _, ...headersWithoutContentType } = authHeaders

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(url, {
        method: "POST",
        headers: headersWithoutContentType,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new APIError(errorData.message || "Failed to upload avatar", response.status, errorData)
      }

      const responseData = await response.json().catch(() => null)

      // Normalize various possible backend shapes to { file_id: string }
      if (
        responseData &&
        typeof responseData === "object" &&
        typeof responseData.file_id === "string"
      ) {
        return { file_id: responseData.file_id }
      }

      if (
        responseData &&
        typeof responseData === "object" &&
        typeof responseData.data === "string" &&
        (responseData.code === 200 || typeof responseData.code === "number")
      ) {
        return { file_id: responseData.data }
      }

      if (typeof responseData === "string") {
        return { file_id: responseData }
      }

      throw new APIError("Unexpected avatar upload response shape", 500, responseData)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError("Upload failed", 0, error)
    }
  },

  // Create basic bazi character
  async createCharacter(data: BasicBaziCharacterCreate): Promise<string> {
    // Get authentication headers including JWT token
    const authHeaders = await getAuthHeaders()

    const url = `${API_BASE_URL}${apiEndpoints.bazi.character}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeaders,
      },
      body: JSON.stringify(data),
    })

    // Check for 20X status codes (200-299) as success
    if (response.status < 200 || response.status >= 300) {
      const errorData = await response.json().catch(() => ({}))

      throw new APIError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData,
      )
    }

    const result = await response.json()

    return result
  },

  // Create basic bazi (personal, authed, no proxy)
  async createBasicBazi(data: BasicBaziCreate): Promise<string> {
    // Get authentication headers including JWT token
    const authHeaders = await getAuthHeaders()

    const url = `${API_BASE_URL}${apiEndpoints.bazi.base}`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new APIError(errorText || `HTTP ${response.status}: ${response.statusText}`, response.status)
    }

    const result = await response.json().catch(() => null)
    if (
      !result ||
      typeof result !== "object" ||
      typeof result.code !== "number" ||
      result.code !== 200
    ) {
      throw new APIError("Unexpected API response shape", 500, result)
    }
    return result.data
  },

  // Remove none-auth path (not used per spec)
  // async createBasicBaziNoAuth(data: BasicBaziCreate): Promise<string> { ... }

  // Chat
  async chat(data: ChatRequest): Promise<any> {
    if (!API_BASE_URL) {
      throw new APIError("API base URL not configured", 500)
    }

    return apiRequest<any>(apiEndpoints.chat.base, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Create session share
  async createSessionShare(basicBaziId: string, sessionId: string): Promise<string> {
    if (!API_BASE_URL) {
      throw new APIError("API base URL not configured", 500)
    }

    return apiRequest<string>(`${apiEndpoints.chat.share}?${new URLSearchParams({ basic_bazi_id: basicBaziId, session_id: sessionId })}`, {
      method: "POST",
    })
  },

  // Get session share
  async getSessionShare(shareToken: string): Promise<BasicBaziSessionShareResponse> {
    if (!API_BASE_URL) {
      throw new APIError("API base URL not configured", 500)
    }

    return apiRequest<BasicBaziSessionShareResponse>(`${apiEndpoints.chat.share}?${new URLSearchParams({ share_token: shareToken })}`, {
      method: "GET",
    })
  },

  // Create chat session
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await apiRequest<CreateSessionResponse>(apiEndpoints.chat.session, {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response;
  },

  // Create character chat session
  async createCharacterChatSession(request: {
    character_id: string;
    title?: string;
    mode?: string;
    greeting?: string;
    language?: string;
  }): Promise<{
    data: { success: boolean; session_id: string; character: { id: string; name: string }; title: string; greeting_message?: string; just_created?: boolean; reward_auto_claimed?: boolean }
  }> {
    const response = await apiRequest<{ success: boolean; session_id: string; character: { id: string; name: string }; title: string; greeting_message?: string; just_created?: boolean; reward_auto_claimed?: boolean }>(
      apiEndpoints.character.createChatSession,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
    return response;
  },

  // Create hepan session
  async createHepanSession(request: {
    character_ids: string[];
    title?: string;
    language?: string;
  }): Promise<{
    success: boolean;
    session_id: string;
    characters: Array<{ id: string; name: string }>;
    title: string;
    greeting_message?: string;
    reward_auto_claimed?: boolean;
  }> {
    const response = await apiRequest<{
      code: number;
      message: string;
      data: {
        success: boolean;
        session_id: string;
        characters: Array<{ id: string; name: string }>;
        title: string;
        greeting_message?: string;
        just_created?: boolean;
        reward_auto_claimed?: boolean;
      };
    }>(apiEndpoints.character.createHepanSession, {
      method: "POST",
      body: JSON.stringify(request),
    });
    // 提取 data 字段
    return response.data;
  },
}

// Character operations using the new API
export const characterAPI = {
  // Get all public characters (mock implementation - replace with actual API endpoint)
  async getPublicCharacters(): Promise<CharacterWithDetails[]> {
    try {
      if (!API_BASE_URL) {
        return []
      }
      return []
    } catch (error) {
      throw error
    }
  },

  // Create character using the new API
  async createCharacter(data: {
    name: string
    gender: "male" | "female" | "lgbtq"
    birthday_utc8: string
    longitude: number
    birthplace: string
    mbti: string
    avatar_id?: string | null
    description?: string | null
    data_type: "virtual_virtual" | "virtual_real" | "real_real" | "real_virtual"
    visibility: "public" | "private"
    tags: string[]
  }): Promise<string> {
    const characterData: BasicBaziCharacterCreate = {
      ...data,
      mode: "character",  // 添加 mode 字段
      avatar_id: data.avatar_id || null,
      description: data.description || null,
    }

    return apiClient.createCharacter(characterData)
  },

  // Search characters (mock implementation)
  async searchCharacters(
    query: string,
    filters?: {
      data_type?: string
      tags?: string[]
      visibility?: string
    },
  ): Promise<CharacterWithDetails[]> {
    try {
      if (!API_BASE_URL) {
        return []
      }
      return []
    } catch (error) {
      throw error
    }
  },

  // Get character by ID (mock implementation)
  async getCharacterById(characterId: string): Promise<CharacterWithDetails | null> {
    try {
      if (!API_BASE_URL) {
        return null
      }
      return null
    } catch (error) {
      throw error
    }
  },

  // Get character reports
  async getReports(characterId: string): Promise<{
    success: boolean
    character_id: string
    processing_status: string
    reports: {
      basic?: string
      personal?: string
      luck?: string
      achievement?: string
    }
  }> {
    return apiRequest(apiEndpoints.character.reports(characterId), {
      method: "GET",
    })
  },

  // Generate character reports
  async generateReports(characterId: string): Promise<{
    success: boolean
    message: string
    character_id: string
    reports: {
      basic?: string
      personal?: string
      luck?: string
      achievement?: string
    }
  }> {
    return apiRequest(apiEndpoints.character.generateReports(characterId), {
      method: "POST",
    })
  },

  // Get character detail
  async getDetail(characterId: string): Promise<any> {
    return apiRequest(apiEndpoints.character.detail(characterId), {
      method: "GET",
    })
  },
}

// User operations
export const userAPI = {
  // Upload avatar
  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    return apiClient.uploadAvatar(file)
  },

  // Create personal bazi
  async createPersonalBazi(data: {
    name: string
    gender: "male" | "female" | "lgbtq"
    birthday_utc8: string
    longitude: number
    birthplace: string
    mbti: string
  }): Promise<string> {
    // Format birthday to ISO string with proper timezone and milliseconds
    const formattedBirthday = formatBirthdayToISO(data.birthday_utc8)

    const baziData: BasicBaziCreate = {
      ...data,
      birthday_utc8: formattedBirthday,
      mode: "personal",
    }

    return apiClient.createBasicBazi(baziData)
  },
}

// Chat operations
export const chatAPI = {
  // Send chat message
  async sendMessage(data: {
    message: string
    session_id?: string | null
    basic_bazi_id: string
    second_basic_bazi_id?: string | null
    stream?: boolean
    language?: "en_US" | "zh_CN"
  }): Promise<any> {
    // Derive language from client storage if not explicitly provided
    let derivedLanguage: "en_US" | "zh_CN" = "en_US"
    try {
      const stored = typeof window !== "undefined" ? (localStorage.getItem("language") as "en" | "zh" | null) : null
      if (stored === "zh") {
        derivedLanguage = "zh_CN"
      } else {
        derivedLanguage = "en_US"
      }
    } catch { }

    const chatData: ChatRequest = {
      message: data.message,
      session_id: data.session_id || null,
      basic_bazi_id: data.basic_bazi_id,
      second_basic_bazi_id: data.second_basic_bazi_id || null,
      stream: data.stream ?? true,
      language: data.language ?? derivedLanguage,
    }

    return apiClient.chat(chatData)
  },

  // Create session share
  async createShare(basicBaziId: string, sessionId: string): Promise<string> {
    return apiClient.createSessionShare(basicBaziId, sessionId)
  },

  // Get session share
  async getShare(shareToken: string): Promise<BasicBaziSessionShareResponse> {
    return apiClient.getSessionShare(shareToken)
  },

  // 用户信息通过前端直接查询profiles表获取
}
const supabase = createClient();
// Invitation operations
export const invitationAPI = {
  // 🎯 优化：直接调用 Supabase RPC，不经过后端中转，减少延迟
  
  // Get or generate invitation code
  async getInvitationCode(): Promise<{ code: string; invite_url: string }> {
    // const { supabase } = await import("@/lib/supabase/client")
    
    const { data, error } = await supabase.rpc("get_or_create_invitation_code")
    
    if (error) {
      throw new APIError(`Failed to get invitation code: ${error.message}`, 500)
    }
    
    // 使用当前域名生成邀请链接（支持本地开发和生产环境）
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.xwanai.com"
    const invite_url = `${origin}/register?invite=${data}`
    
    return {
      code: data,
      invite_url,
    }
  },

  // Get invitation statistics
  async getInvitationStats(): Promise<{
    invitation_code: string | null
    used_count: number
    invitees: Array<{
      id: string
      name: string
      paid: boolean
      joined_at: string
    }>
    reward: {
      character_count_bonus: number
      session_count_bonus: number
      expires_at: string
    } | null
  }> {
    // const { supabase } = await import("@/lib/supabase/client")
    
    const { data, error } = await supabase.rpc("get_invitation_stats")
    
    if (error) {
      throw new APIError(`Failed to get invitation stats: ${error.message}`, 500)
    }
    
    return data
  },

  // Apply invitation code
  async applyInvitationCode(code: string, userId?: string): Promise<{ success: boolean; message: string }> {
    // const { supabase } = await import("@/lib/supabase/client")
    
    let inviteeId: string
    
    // 🎯 如果提供了 userId，直接使用；否则从当前会话获取
    if (userId) {
      inviteeId = userId
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new APIError("User not authenticated", 401)
      }
      inviteeId = user.id
    }
    
    // 🎯 调用 RPC 创建邀请记录
    const { data, error } = await supabase.rpc("process_invitation_signup", {
      p_invitee_id: inviteeId,
      p_invitation_code: code,
    })
    
    if (error) {
      throw new APIError(`Failed to apply invitation code: ${error.message}`, 500)
    }
    
    return data
  },

  // Process first login reward (called after successful login)
  async processFirstLoginReward(): Promise<{ success: boolean; message: string }> {
    // const { supabase } = await import("@/lib/supabase/client")
    
    // 🎯 获取当前登录用户ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" }
    }
    
    // 🎯 调用首次登录奖励处理
    const { data, error } = await supabase.rpc("process_first_login_reward", {
      p_invitee_id: user.id,
    })
    
    if (error) {
      return { success: false, message: error.message }
    }
    
    return data
  },

  // Check and handle expired rewards
  async checkExpiredRewards(): Promise<{
    expired: boolean
    expired_character_bonus?: number
    expired_session_bonus?: number
    deleted_characters?: string[]
  }> {
    // const { supabase } = await import("@/lib/supabase/client")
    
    const { data, error } = await supabase.rpc("check_and_handle_expired_rewards")
    
    if (error) {
      throw new APIError(`Failed to check expired rewards: ${error.message}`, 500)
    }
    
    return data
  },
}
