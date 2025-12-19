import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

// Get environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Server-side Supabase client with error handling
export function createServerClient(accessToken?: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not configured for server client")
    return null
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    // If access token is provided, set it for authenticated requests
    if (accessToken) {
      client.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      } as any)
    }
    
    return client
  } catch (error) {
    console.error("Failed to create server Supabase client:", error)
    return null
  }
}

// Create Supabase client from request cookies
export function createServerClientFromRequest(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not configured for server client")
    return null
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    // Extract authentication token from cookies
    const accessToken = request.cookies.get('sb-access-token')?.value || 
                       request.cookies.get('supabase-auth-token')?.value ||
                       extractAuthTokenFromCookies(request.cookies)
    
    const refreshToken = request.cookies.get('sb-refresh-token')?.value ||
                        request.cookies.get('supabase-refresh-token')?.value

    if (accessToken) {
      // Set the session with tokens from cookies
      client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      } as any)
    }
    
    return client
  } catch (error) {
    console.error("Failed to create server Supabase client from request:", error)
    return null
  }
}

// Helper function to extract auth token from various cookie formats
function extractAuthTokenFromCookies(cookies: any): string | null {
  // Look for various Supabase cookie patterns
  const possibleKeys = [
    'sb-access-token',
    'supabase-auth-token', 
    'sb-token',
    'supabase.auth.token'
  ]
  
  for (const key of possibleKeys) {
    const cookie = cookies.get(key)
    if (cookie?.value) {
      return cookie.value
    }
  }
  
  // Try to parse from the main auth cookie if it's JSON
  const authCookie = cookies.get('supabase-auth') || cookies.get('sb-auth')
  if (authCookie?.value) {
    try {
      const parsed = JSON.parse(authCookie.value)
      return parsed.access_token || null
    } catch (error) {
      // Ignore JSON parse errors
    }
  }
  
  return null
}

// Helper function to extract JWT token from Authorization header
export function extractTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get('Authorization')
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null
  }
  return authorization.substring(7) // Remove 'Bearer ' prefix
}
