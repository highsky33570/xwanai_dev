import { createBrowserClient } from "@supabase/ssr";
import { logger } from "@/lib/utils/logger"
import type { Database } from "./types"
import { ClientType, XWANAIClient } from "./xwanai_client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error(
    {
      module: "supabase",
      operation: "client_init",
      data: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      },
    },
    "Missing Supabase environment variables",
  )
}

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'xwan-ai-frontend',
      },
    },
    // 增加请求超时时间（默认 10 秒可能不够）
    db: {
      schema: 'public',
    },
    // 🚨 关键：增加超时时间以避免认证超时
    realtime: {
      timeout: 20000, // 20 秒
    },
  })
}

logger.success(
  {
    module: "supabase",
    operation: "client_init",
    data: {
      url: supabaseUrl ? "configured" : "missing",
      key: supabaseAnonKey ? "configured" : "missing",
    },
  },
  "Supabase client initialized",
)

export function createSPAClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-client-info': 'xwan-ai-frontend',
        },
      },
      // 增加请求超时时间（默认 10 秒可能不够）
      db: {
        schema: 'public',
      },
      // 🚨 关键：增加超时时间以避免认证超时
      realtime: {
        timeout: 20000, // 20 秒
      },
    }
  )
}


export async function createSPAXWANAIClient() {
    const client = createSPAClient();
    // This must be some bug that SupabaseClient is not properly recognized, so must be ignored
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new XWANAIClient(client as any, ClientType.SPA);
}

export async function createSPAXWANAIClientAuthenticated() {
    const client = createSPAClient();
    const user = await client.auth.getSession();
    if (!user.data || !user.data.session) {
        window.location.href = '/auth/login';
    }
    // This must be some bug that SupabaseClient is not properly recognized, so must be ignored
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new XWANAIClient(client as any, ClientType.SPA);
}