import { useState, useRef, useCallback, useEffect } from "react"
import { getAuthHeaders, handleAuthError } from "@/lib/utils/authHelpers"
import { useTranslation } from "@/lib/utils/translations"
import { API_BASE_URL, apiEndpoints } from "@/lib/api/config"
import { v4 as uuidv4 } from "uuid"

export interface ChatMessage {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  isComplete: boolean
  isFailed?: boolean  // 🎯 新增：标记消息是否失败
  thinking?: string  // 🧠 新增：thinking 内容
  functionResponse?: {
    id: string
    name: string
    response: any
  }
}

export interface ChatError {
  error: string
  error_type: string
  retryable: boolean
  resumable: boolean
}

export interface UseChatSSEOptions {
  onMessage?: (message: ChatMessage) => void
  onError?: (error: ChatError) => void
  onComplete?: (sessionId?: string | null) => void
  onRefreshCharacters?: (data: { character_id: string; action: string }) => void  // 🔄 刷新角色列表
  onRefreshReports?: (data: { character_id: string; action: string }) => void  // 🔄 刷新报告列表
  initialSessionId?: string | null
  getCurrentMode?: () => string  // 🔄 获取当前session的mode（用于重试）
}

export interface ChatRequest {
  message: string
  session_id: string | null
  mode: "chat" | "create_character_real_custom" | "create_character_real_guess" | "create_character_virtual_custom" | "create_character_virtual_search_or_guess"
  four_pillars_ids: (string | null)[] | undefined
  stream: boolean
  title: string
  language: "en_US" | "zh_CN"
}

interface ChatResponsePart {
  text: string
}

interface ChatResponse {
  session_id: string
  content: {
    text: string
    role?: "model"
    error?: string
    error_type?: string
    retryable?: boolean
    resumable?: boolean
  }
  partial: boolean
  id?: string
  timestamp: number | string
}

export function useChatSSE(options: UseChatSSEOptions = {}) {
  const { getLanguage } = useTranslation()
  const normalizeDedup = (text: string): string => {
    if (!text) return text
    const trimmed = text
    const len = trimmed.length
    if (len % 2 === 0) {
      const half = len / 2
      const first = trimmed.slice(0, half)
      const second = trimmed.slice(half)
      if (first === second) {
        return first
      }
    }
    return trimmed
  }
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(options.initialSessionId || null)
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<string>("")
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState<string>("")  // 🧠 新增：thinking 状态
  const [lastError, setLastError] = useState<ChatError | null>(null)
  const [lastRequest, setLastRequest] = useState<ChatRequest | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null) // 🎯 新增：用于中断 fetch
  const currentMessageIdRef = useRef<string | null>(null)
  // Accumulates the full assistant message to avoid relying on async state during SSE
  const assistantAccumulatorRef = useRef<string>("")
  const thinkingAccumulatorRef = useRef<string>("")  // 🧠 新增：thinking 累积器

  // Update sessionId when initialSessionId changes (e.g., when navigating to a new session)
  useEffect(() => {
    if (options.initialSessionId !== sessionId) {
      setSessionId(options.initialSessionId || null)
    }
  }, [options.initialSessionId, sessionId])

  const cleanup = useCallback(() => {
    // 关闭 EventSource（如果使用）
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    // 🎯 中断 fetch 请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    currentMessageIdRef.current = null
  }, [])

  const sendMessage = useCallback(async (
    message: string,
    mode: ChatRequest["mode"] = "chat",
    basicBaziId: string | null = null,
    secondBasicBaziId: string | null = null,
    isRetry: boolean = false
  ) => {
    try {
      // 🎯 创建新的 AbortController
      abortControllerRef.current = new AbortController()

      setIsLoading(true)
      setCurrentAssistantMessage("")
      setCurrentThinkingMessage("")  // 🧠 清除 thinking 状态
      setLastError(null) // 清除之前的错误
      assistantAccumulatorRef.current = ""
      thinkingAccumulatorRef.current = ""  // 🧠 清除 thinking 累积器

      // Add user message immediately for better UX (skip for retry)
      if (!isRetry) {
        const userMessage: ChatMessage = {
          // id: crypto.randomUUID(),
          id: uuidv4(),
          content: message,
          sender: "user",
          timestamp: new Date(),
          isComplete: true
        }

        options.onMessage?.(userMessage)
      }

      // 给UI一点时间渲染用户消息，改善体验
      await new Promise(resolve => setTimeout(resolve, 50))

      // Prepare request data
      let uiLanguage: "en_US" | "zh_CN" = "en_US"
      try {
        const current = typeof getLanguage === "function" ? getLanguage() : undefined
        uiLanguage = current === "zh" ? "zh_CN" : "en_US"
      } catch {
        uiLanguage = "en_US"
      }

      const requestData: ChatRequest = {
        message,
        session_id: sessionId,
        mode,
        four_pillars_ids: basicBaziId ?
          (secondBasicBaziId ? [basicBaziId, secondBasicBaziId] : [basicBaziId]) :
          undefined,
        stream: true,
        title: "",
        language: uiLanguage
      }

      // 🚨 保存请求参数以便重试
      setLastRequest(requestData)

      // Get authentication headers including JWT token
      const authHeaders = await getAuthHeaders()

      // Call external API directly (no proxy)
      const endpoint = apiEndpoints.chat.base

      // 🔄 重试时修改请求体，添加 is_retry 参数
      const finalRequestData = isRetry ? {
        ...requestData,
        is_retry: true,
        // 🎯 重试时保持原始消息内容（不再设为空）
      } : requestData

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          ...authHeaders,
          Accept: "text/event-stream",
          // Explicitly forward raw token headers in case upstream looks for them during streaming
          ...(authHeaders.Authorization && { Authorization: authHeaders.Authorization }),
        },
        // Important for streaming behavior
        cache: "no-store",
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify(finalRequestData),
        signal: abortControllerRef.current?.signal, // 🎯 关键：绑定 abort signal
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`❌ [SSE] Chat API error: ${response.status} ${response.statusText}`)
        console.error(`❌ [SSE] Error response:`, errorText)

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          handleAuthError({ status: response.status, message: errorText })
        }

        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      // Handle SSE response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        console.error("❌ [SSE] No response body reader available")
        throw new Error("No response body")
      }

      let buffer = ""
      // let assistantMessageId = crypto.randomUUID()
      let assistantMessageId = uuidv4();

      currentMessageIdRef.current = assistantMessageId

      let streamFinished = false
      let currentEvent = "message" // 🎯 在循环外声明，保持跨数据块的事件状态
      
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        for (const line of lines) {
          // 处理事件类型行
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim() // Remove "event: " prefix
            continue
          }

          if (line.startsWith("data: ")) {
            try {
              const jsonData = line.slice(6) // Remove "data: " prefix
              if (jsonData.trim() === "") continue
              
              // 🎯 处理回合数限制事件
              if (currentEvent === "limit_reached") {
                const limitData = JSON.parse(jsonData)
                
                // 清除正在输入的消息
                setCurrentAssistantMessage("")
                setCurrentThinkingMessage("")
                
                // 创建AI消息显示限制提示（不设置 _order，由调用方管理）
                const limitMessage: ChatMessage = {
                  // id: crypto.randomUUID(),
                  id: uuidv4(),
                  content: limitData.message || "您已达到对话回合数限制",
                  sender: "assistant",
                  timestamp: new Date(),
                  isComplete: true,
                  limitReached: true, // 🎯 特殊标记，用于前端识别
                  limitInfo: {
                    current: limitData.current,
                    limit: limitData.limit
                  }
                } as any
                
                options.onMessage?.(limitMessage)
                options.onComplete?.(sessionId)
                streamFinished = true
                break  // 跳出整个循环，结束流处理
              }

              // 🎯 处理流结束标记
              if (jsonData.trim() === "[DONE]") {
                streamFinished = true
                break
              }

              const chatResponse: ChatResponse = JSON.parse(jsonData)

              // 🚨 检查是否是错误响应
              if (chatResponse.content?.error) {
                console.error(`❌ [SSE] Error response received:`, chatResponse.content)
                const error: ChatError = {
                  error: chatResponse.content.error,
                  error_type: chatResponse.content.error_type || 'unknown_error',
                  retryable: chatResponse.content.retryable || false,
                  resumable: chatResponse.content.resumable || false
                }
                setLastError(error)
                options.onError?.(error)
                break
              }

              // Update session ID if we get one
              if (chatResponse.session_id && !sessionId) {
                setSessionId(chatResponse.session_id)
              }

              // Only process if this matches our current message
              if (currentMessageIdRef.current !== assistantMessageId) {
                break
              }

              // 🧠 处理 thinking 事件
              if (currentEvent === "thinking" && (chatResponse.content as any)?.thinking) {
                const thinkingText = (chatResponse.content as any).thinking
                thinkingAccumulatorRef.current += thinkingText
                setCurrentThinkingMessage(thinkingAccumulatorRef.current)
                continue // 继续处理下一行
              }

              // 🔄 处理刷新角色列表事件
              if (currentEvent === "refresh_characters") {
                try {
                  // chatResponse.content 包含 { refresh_characters: "true", character_id: "xxx", action: "create" }
                  options.onRefreshCharacters?.(chatResponse.content as any)
                } catch (e) {
                  console.error('Failed to handle refresh_characters event:', e)
                }
                continue
              }

              // 🔄 处理刷新报告列表事件
              if (currentEvent === "refresh_reports") {
                try {
                  // chatResponse.content 包含 { refresh_reports: "true" }
                  options.onRefreshReports?.(chatResponse.content as any)
                } catch (e) {
                  console.error('Failed to handle refresh_reports event:', e)
                }
                continue
              }

              // 处理函数调用事件（如搜索结果）
              if (currentEvent.startsWith("function_") && (chatResponse.content as any)?.function_response) {
                const functionMessage: ChatMessage = {
                  id: `${assistantMessageId}_${currentEvent}`,
                  content: "",
                  sender: "assistant",
                  timestamp: new Date(),
                  isComplete: true,
                  functionResponse: (chatResponse.content as any).function_response
                }

                options.onMessage?.(functionMessage)
                continue // 继续处理下一行，不处理文本内容
              }

              // Extract text from response content
              let text = chatResponse.content.text || ""
              text = normalizeDedup(text)

              if (chatResponse.partial) {
                // Streaming chunk - handle either delta or cumulative chunking
                if (text) {
                  if (text.startsWith(assistantAccumulatorRef.current)) {
                    assistantAccumulatorRef.current = text
                  } else {
                    assistantAccumulatorRef.current += text
                  }
                }
                setCurrentAssistantMessage(assistantAccumulatorRef.current)
              } else {
                // Final message - mark complete
                // Prefer final text as authoritative; fallback to accumulated if empty
                if (text && text.length > 0) {
                  assistantAccumulatorRef.current = text
                }
                const finalMessage: ChatMessage = {
                  id: assistantMessageId,
                  content: assistantAccumulatorRef.current,
                  sender: "assistant",
                  timestamp: new Date(),
                  isComplete: true,
                  thinking: thinkingAccumulatorRef.current || undefined  // 🧠 添加 thinking 内容
                }

                options.onMessage?.(finalMessage)
                setCurrentAssistantMessage("")
                setCurrentThinkingMessage("")  // 🧠 清除 thinking 显示
                assistantAccumulatorRef.current = ""
                thinkingAccumulatorRef.current = ""  // 🧠 清除 thinking 累积器
                options.onComplete?.(sessionId)
                // Prevent duplicate finals: ignore any further chunks for this message
                currentMessageIdRef.current = null
                streamFinished = true
                break
              }
            } catch (parseError) {
              console.error("❌ [SSE] Error parsing SSE data:", parseError)
              console.error("❌ [SSE] Problematic line:", line)
            }
          }
        }
        if (streamFinished) break
      }

    } catch (error) {
      // 🎯 如果是用户主动中断（切换页面），不报错
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      console.error("❌ [SSE] Chat SSE error:", error)
      console.error("❌ [SSE] Error stack:", error instanceof Error ? error.stack : 'No stack trace')

      // Handle authentication errors
      if (error instanceof Error && (error.message.includes("401") || error.message.includes("403"))) {
        console.error("❌ [SSE] Authentication error detected")
        handleAuthError(error)
      }

      // 转换为标准错误格式
      const chatError: ChatError = {
        error: error instanceof Error ? error.message : String(error),
        error_type: 'network_error',
        retryable: true,
        resumable: false
      }
      options.onError?.(chatError)
    } finally {
      setIsLoading(false)
      cleanup()
    }
  }, [sessionId, options, cleanup])

  const disconnect = useCallback(() => {
    cleanup()
    setIsLoading(false)
    setCurrentAssistantMessage("")
  }, [cleanup])

  // 🔄 重试上一次失败的请求 - 新的清晰方案
  const retryLastMessage = useCallback(async (messages?: ChatMessage[]) => {
    if (!sessionId) {
      console.warn("❌ [重试] No session ID to retry")
      return
    }

    // 🎯 从消息数组中找到最后一条用户消息
    if (!messages || messages.length === 0) {
      console.warn("❌ [重试] No messages provided for retry")
      return
    }

    // 找到最后一条用户消息
    const lastUserMessage = [...messages].reverse().find(msg => msg.sender === "user")
    if (!lastUserMessage) {
      console.warn("❌ [重试] No user message found to retry")
      return
    }

    // 🎯 获取当前session的正确mode
    const currentMode = options.getCurrentMode ? options.getCurrentMode() : "chat"

    // 🧹 重试前先清理状态
    cleanup()
    setLastError(null)
    setCurrentAssistantMessage("")

    // 🎯 直接调用sendMessage，传递原始用户消息和正确的mode
    await sendMessage(lastUserMessage.content, currentMode as any, null, null, true) // 🎯 使用当前session的mode
  }, [sessionId, sendMessage, options])

  // 🚫 Resume功能暂未启用
  // 以下代码保留用于未来可能的恢复功能实现
  const resumeConversation = useCallback(async () => {
    if (!sessionId) {
      console.warn("❌ [恢复] No session ID available")
      return
    }

    try {
      setIsLoading(true)
      setCurrentAssistantMessage("")
      setLastError(null)
      assistantAccumulatorRef.current = ""

      const authHeaders = await getAuthHeaders()

      // 使用新的resume端点 - 只需要session_id
      const response = await fetch(`${API_BASE_URL}${apiEndpoints.chat.base}/resume`, {
        method: "POST",
        headers: {
          ...authHeaders,
          Accept: "text/event-stream",
        },
        cache: "no-store",
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify({
          session_id: sessionId
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      // 处理恢复的 SSE 响应（复用现有逻辑）
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let buffer = ""
      // let assistantMessageId = crypto.randomUUID()
      let assistantMessageId = uuidv4();
      currentMessageIdRef.current = assistantMessageId

      let streamFinished = false
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonData = line.slice(6)
              if (jsonData.trim() === "") continue

              const chatResponse: ChatResponse = JSON.parse(jsonData)

              if (chatResponse.content?.error) {
                const error: ChatError = {
                  error: chatResponse.content.error,
                  error_type: chatResponse.content.error_type || 'resume_failed',
                  retryable: chatResponse.content.retryable || false,
                  resumable: chatResponse.content.resumable || false
                }
                setLastError(error)
                options.onError?.(error)
                break
              }

              if (currentMessageIdRef.current !== assistantMessageId) break

              let text = chatResponse.content.text || ""
              text = normalizeDedup(text)

              if (chatResponse.partial) {
                if (text) {
                  if (text.startsWith(assistantAccumulatorRef.current)) {
                    assistantAccumulatorRef.current = text
                  } else {
                    assistantAccumulatorRef.current += text
                  }
                }
                setCurrentAssistantMessage(assistantAccumulatorRef.current)
              } else {
                if (text && text.length > 0) {
                  assistantAccumulatorRef.current = text
                }
                const finalMessage: ChatMessage = {
                  id: assistantMessageId,
                  content: assistantAccumulatorRef.current,
                  sender: "assistant",
                  timestamp: new Date(),
                  isComplete: true
                }

                options.onMessage?.(finalMessage)
                setCurrentAssistantMessage("")
                assistantAccumulatorRef.current = ""
                options.onComplete?.(sessionId)
                currentMessageIdRef.current = null
                streamFinished = true
                break
              }
            } catch (parseError) {
              console.error("❌ [恢复] Error parsing SSE data:", parseError)
            }
          }
        }
        if (streamFinished) break
      }

    } catch (error) {
      console.error("❌ [恢复] Resume failed:", error)
      const resumeError: ChatError = {
        error: error instanceof Error ? error.message : String(error),
        error_type: 'resume_network_error',
        retryable: true,
        resumable: false
      }
      setLastError(resumeError)
      options.onError?.(resumeError)
    } finally {
      setIsLoading(false)
      cleanup()
    }
  }, [sessionId, options, cleanup])

  // 🎯 组件卸载时清理连接
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    sendMessage,
    isLoading,
    sessionId,
    currentAssistantMessage,
    currentThinkingMessage,  // 🧠 导出 thinking 状态
    lastError,
    lastRequest,
    retryLastMessage,
    resumeConversation,
    disconnect
  }
} 
