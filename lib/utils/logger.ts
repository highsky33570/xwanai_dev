type LogLevel = "info" | "success" | "error" | "warn" | "debug"

interface LogData {
  module?: string
  operation?: string
  data?: any
  error?: any
  duration?: number
  table?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatMessage(level: LogLevel, data: LogData, message: string): void {
    if (!this.isDevelopment) return

    const timestamp = new Date().toISOString()
    const emoji = this.getEmoji(level)
    const moduleInfo = data.module ? `[${data.module.toUpperCase()}]` : ""
    const operationInfo = data.operation ? `[${data.operation}]` : ""

    console.group(`${emoji} ${timestamp} ${moduleInfo} ${operationInfo} ${message}`)

    if (data.data) {
      console.log("📊 Data:", this.sanitizeData(data.data))
    }

    if (data.error) {
      console.error("🚨 Error:", data.error)
    }

    if (data.duration !== undefined) {
      console.log(`⏱️ Duration: ${data.duration}ms`)
    }

    if (data.table) {
      console.log(`📋 Table: ${data.table}`)
    }

    console.groupEnd()
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case "info":
        return "ℹ️"
      case "success":
        return "✅"
      case "error":
        return "❌"
      case "warn":
        return "⚠️"
      case "debug":
        return "🔍"
      default:
        return "📝"
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data

    const sensitiveKeys = ["password", "token", "secret", "key", "auth", "credential"]

    if (typeof data === "object") {
      const sanitized = { ...data }
      for (const key in sanitized) {
        if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = "[REDACTED]"
        }
      }
      return sanitized
    }

    return data
  }

  info(data: LogData, message: string): void {
    this.formatMessage("info", data, message)
  }

  success(data: LogData, message: string): void {
    this.formatMessage("success", data, message)
  }

  error(data: LogData, message: string): void {
    this.formatMessage("error", data, message)
  }

  warn(data: LogData, message: string): void {
    this.formatMessage("warn", data, message)
  }

  debug(data: LogData, message: string): void {
    this.formatMessage("debug", data, message)
  }

  // Specialized logging methods
  authOperation(operation: string, data?: any): void {
    this.info(
      {
        module: "auth",
        operation,
        data,
      },
      `Auth operation: ${operation}`,
    )
  }

  supabaseOperation(operation: string, table: string, data?: any): void {
    this.info(
      {
        module: "supabase",
        operation,
        table,
        data,
      },
      `Supabase: ${operation} on ${table}`,
    )
  }

  apiRequest(method: string, url: string, data?: any): void {
    this.info(
      {
        module: "api",
        operation: "request",
        data: { method, url, requestData: data },
      },
      `API Request: ${method} ${url}`,
    )
  }

  apiResponse(method: string, url: string, status: number, data?: any, duration?: number): void {
    const level = status >= 400 ? "error" : "success"
    this.formatMessage(
      level,
      {
        module: "api",
        operation: "response",
        data: { method, url, status, responseData: data },
        duration,
      },
      `API Response: ${method} ${url} (${status})`,
    )
  }
}

export const logger = new Logger()

// Utility function for timing operations
export async function withTiming<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now()
  const result = await operation()
  const duration = Date.now() - startTime
  return { result, duration }
}
