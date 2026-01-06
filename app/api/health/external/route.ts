import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/utils/logger"
import { API_BASE_URL, apiEndpoints } from "@/lib/api/config"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    logger.info(
      {
        module: "health_check",
        operation: "external_api_test",
        data: {
          target_url: API_BASE_URL,
        },
      },
      "Testing external API connectivity"
    )

    // Test basic connectivity to the external API
    const response = await fetch(`${API_BASE_URL}${apiEndpoints.health.base}`, {
      method: "GET",
      headers: {
        "User-Agent": "NextJS-HealthCheck/1.0",
      },
      // 5 second timeout for health check
      signal: AbortSignal.timeout(5000),
    })

    const duration = Date.now() - startTime

    logger.info(
      {
        module: "health_check",
        operation: "external_api_response",
        data: {
          status: response.status,
          status_text: response.statusText,
          duration,
          headers: Object.fromEntries(response.headers.entries()),
        },
      },
      "External API health check response"
    )

    return NextResponse.json({
      status: "ok",
      external_api: {
        url: API_BASE_URL,
        status: response.status,
        status_text: response.statusText,
        duration,
        reachable: true,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    const duration = Date.now() - startTime

    logger.error(
      {
        module: "health_check",
        operation: "external_api_error",
        error: {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        data: {
          target_url: API_BASE_URL,
          duration,
          is_timeout: error instanceof Error && error.name === "AbortError",
          is_network_error: error instanceof Error && error.message.includes("fetch failed"),
        },
      },
      "External API health check failed"
    )

    return NextResponse.json(
      {
        status: "error",
        external_api: {
          url: API_BASE_URL,
          reachable: false,
          error: error instanceof Error ? error.message : "Unknown error",
          duration,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
} 