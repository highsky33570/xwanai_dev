import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { API_BASE_URL, apiEndpoints } from "@/lib/api/config"

async function getAuthHeaders(request: NextRequest) {
  try {
    const supabase = createServerClient()
    if (!supabase) {
      console.warn("Supabase client not available, proceeding without auth")
      return {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "NextJS-Client/1.0",
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "NextJS-Client/1.0",
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    }
  } catch (error) {
    console.error("Failed to get auth headers:", error)
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "NextJS-Client/1.0",
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const headers = await getAuthHeaders(request)

    const externalApiUrl = `${API_BASE_URL}${apiEndpoints.bazi.character}`

    const externalResponse = await fetch(externalApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text()

      return NextResponse.json(
        { error: `External API error: ${externalResponse}` },
        { status: externalResponse.status },
      )
    }

    const responseData = await externalResponse.json()

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ Character API proxy error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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