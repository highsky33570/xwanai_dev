// API Types based on OpenAPI specification

export interface PersonalInfo {
  name: string
  gender: 'male' | 'female'
  birth_date: string // YYYY-MM-DD
  birth_time?: string // HH:MM (可选)
}

export interface CreateSessionRequest {
  mode: string
  title?: string
  greeting?: string // 🔧 添加greeting字段
  language?: string // 🌐 前端语言设置
  personal_info?: PersonalInfo // 🎯 个人算命模式的用户信息
  from_task?: boolean // 🎯 是否来自任务引导（不计入额度）
}

export interface CreateSessionResponse {
  code: number
  message: string
  data: {
    session_id: string
    mode: string
    title: string
    agent_info?: {
      name: string
      description: string
      greeting: string
      supports_tools: boolean
      ready: boolean
    }
    generation_config_ready?: boolean
  }
}

export interface AvatarUploadResponse {
  file_id: string
  message?: string
}

export interface BasicBaziCharacterCreate {
  name: string
  gender: "male" | "female" | "lgbtq"
  birthday_utc8: string
  longitude: number
  birthplace: string
  mbti: string
  mode: "personal" | "character" | "none_auth"
  avatar_id: string | null
  description: string | null
  data_type: "virtual_virtual" | "virtual_real" | "real_real" | "real_virtual"
  visibility: "public" | "private"
  tags: string[]
}

export interface BasicBaziCreate {
  name: string
  gender: "male" | "female" | "lgbtq"
  birthday_utc8: string
  longitude: number
  birthplace: string
  mbti: string
  mode: "personal" | "character" | "none_auth"
}

export interface CharacterResponse {
  id: string
  avatar_id: string | null
  name: string
  description: string | null
  data_type: string
  visibility: string
  tags: string[]
  auth_id: string | null
  disabled: boolean
  created_at: string
  updated_at: string
}

export interface BasicBaziResponse {
  id: string
  related_id: string | null
  type: string
  name: string | null
  gender: string
  birthday_utc8: string
  mbti: string | null
  birthplace: string | null
  paipan: any | null
  created_at: string
  updated_at: string
}

export interface ChatRequest {
  message: string
  session_id: string | null
  basic_bazi_id: string
  second_basic_bazi_id: string | null
  stream?: boolean
  language?: "en_US" | "zh_CN"
}

export interface BasicBaziSessionShareResponse {
  character: CharacterResponse | null
  basic_bazi: BasicBaziResponse | null
  events: EventResponse[] | null
}

export interface EventResponse {
  id: string
  app_name: string
  user_id: string
  session_id: string
  invocation_id: string
  author: string
  branch: string | null
  timestamp: string
  content: any
  actions: string
}

// Extended types for UI
export interface CharacterWithDetails extends CharacterResponse {
  avatar_url?: string
  creator_name?: string
  like_count?: number
  comment_count?: number
  basic_bazi?: BasicBaziResponse
}
