import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

async function getAuthHeaders(request: NextRequest) {
  try {
    const supabase = createServerClient()
    if (!supabase) {
      console.warn("Supabase client not available, proceeding without auth")
      return {
        "User-Agent": "NextJS-Client/1.0",
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    return {
      "User-Agent": "NextJS-Client/1.0",
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    }
  } catch (error) {
    console.error("Failed to get auth headers:", error)
    return {
      "User-Agent": "NextJS-Client/1.0",
    }
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: "Avatar proxy disabled. Use Supabase Storage directly." }, { status: 410 })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
} 