export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://divination.uubb.top"

export const apiEndpoints = {
  users: {
    avatar: "/api/users/v1/avatar",
  },
  bazi: {
    base: "/api/fourPillars/v1",
    character: "/api/character/v1",
  },
  chat: {
    base: "/api/chat/v1",
    session: "/api/chat/v1/session",
    share: "/api/chat/v1/share",
  },
  character: {
    reports: (characterId: string) => `/api/character/v1/${characterId}/reports`,
    generateReports: (characterId: string) => `/api/character/v1/${characterId}/generate-reports`,
    detail: (characterId: string) => `/api/character/v1/${characterId}`,
    createChatSession: "/api/character-chat/create-chat-session",
    createHepanSession: "/api/character-chat/create-hepan-session",
  },
  health: {
    base: "/api/",
  },
  // 🎯 已优化：邀请系统端点已不再使用，前端直接调用 Supabase RPC
  // invitation: {
  //   code: "/api/invitation/v1/code",           // -> supabase.rpc("get_or_create_invitation_code")
  //   stats: "/api/invitation/v1/stats",         // -> supabase.rpc("get_invitation_stats")
  //   apply: "/api/invitation/v1/apply",         // -> supabase.rpc("process_invitation_signup")
  //   checkExpired: "/api/invitation/v1/check-expired",  // -> supabase.rpc("check_and_handle_expired_rewards")
  // },
  
  // 🎯 已优化：使用统计端点已不再使用，前端直接调用 Supabase RPC
  // usageStats: "/api/stripe/v1/usage-stats"    // -> supabase.rpc("get_usage_stats")
} as const

export function buildApiUrl(path: string, searchParams?: Record<string, string | number | boolean | null | undefined>) {
  const url = new URL(path, API_BASE_URL)
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

