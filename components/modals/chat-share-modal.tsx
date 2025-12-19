"use client"

import { useState } from "react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Divider,
  Snippet,
  Chip,
  ScrollShadow,
} from "@heroui/react"
import { Share2, Check, Copy, ExternalLink, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { createShare, CreateShareRequest } from "@/lib/api/share"
import { useTranslation } from "@/lib/utils/translations"

interface ChatMessage {
  id: string
  sender: "user" | "assistant"
  content: string
  timestamp: Date
  isComplete?: boolean
}

interface ChatShareModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  messages: ChatMessage[]
  shareType: "chat" | "hepan"
}

export default function ChatShareModal({
  isOpen,
  onClose,
  sessionId,
  messages,
  shareType,
}: ChatShareModalProps) {
  const { t } = useTranslation()
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([])
  const [includeUserMessages, setIncludeUserMessages] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>("")
  const [isShared, setIsShared] = useState(false)
  const [shareAll, setShareAll] = useState(false)

  // 过滤有效消息（完整的AI消息）
  const validMessages = messages.filter((msg) => msg.isComplete !== false)

  // 全选/取消全选
  const handleToggleAll = () => {
    if (shareAll) {
      setSelectedMessageIds([])
      setShareAll(false)
    } else {
      setSelectedMessageIds(validMessages.map((m) => m.id))
      setShareAll(true)
    }
  }

  // 单个消息选择
  const handleToggleMessage = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      if (prev.includes(messageId)) {
        const newSelection = prev.filter((id) => id !== messageId)
        setShareAll(false)
        return newSelection
      } else {
        const newSelection = [...prev, messageId]
        if (newSelection.length === validMessages.length) {
          setShareAll(true)
        }
        return newSelection
      }
    })
  }

  const handleShare = async () => {
    setIsLoading(true)
    try {
      // 如果没有选择任何消息，提示用户
      if (!shareAll && selectedMessageIds.length === 0) {
        toast.error("请至少选择一条消息或选择分享全部对话")
        setIsLoading(false)
        return
      }

      const request: CreateShareRequest = {
        share_type: shareType,
        session_id: sessionId,
        include_user_messages: includeUserMessages,
        // 如果是分享全部，不传 selected_message_ids
        selected_message_ids: shareAll ? undefined : selectedMessageIds,
      }

      const response = await createShare(request)
      setShareUrl(response.share_url)
      setIsShared(true)
      toast.success("分享链接已创建！")
    } catch (error: any) {
      console.error("Create share failed:", error)
      toast.error(error.message || "创建分享失败")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success("链接已复制到剪贴板")
  }

  const handleOpenLink = () => {
    window.open(shareUrl, "_blank")
  }

  const handleReset = () => {
    setIsShared(false)
    setShareUrl("")
    setSelectedMessageIds([])
    setIncludeUserMessages(true)
    setShareAll(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-content1",
        backdrop: "bg-black/50 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                <span>分享{shareType === "hepan" ? "合盘对话" : "聊天记录"}</span>
              </div>
              <p className="text-sm text-default-500 font-normal">
                选择要分享的对话内容
              </p>
            </ModalHeader>

            <ModalBody>
              {!isShared ? (
                <>
                  <div className="space-y-4">
                    {/* 分享选项 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">选择分享内容</h3>
                        <Button
                          size="sm"
                          variant="flat"
                          color={shareAll ? "primary" : "default"}
                          onPress={handleToggleAll}
                        >
                          {shareAll ? "取消全选" : "分享全部对话"}
                        </Button>
                      </div>

                      {/* 消息列表 */}
                      <ScrollShadow className="max-h-[400px]">
                        <div className="space-y-2">
                          {validMessages.map((message) => {
                            const isSelected = selectedMessageIds.includes(message.id) || shareAll
                            return (
                              <div
                                key={message.id}
                                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-transparent bg-content2/50 hover:bg-content2"
                                }`}
                                onClick={() => !shareAll && handleToggleMessage(message.id)}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    isSelected={isSelected}
                                    isDisabled={shareAll}
                                    onValueChange={() => !shareAll && handleToggleMessage(message.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-semibold ${
                                        message.sender === "user" ? "text-blue-500" : "text-purple-500"
                                      }`}>
                                        {message.sender === "user" ? "👤 你" : "🤖 AI"}
                                      </span>
                                      <span className="text-xs text-default-400">
                                        {new Date(message.timestamp).toLocaleString("zh-CN", {
                                          month: "2-digit",
                                          day: "2-digit",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground line-clamp-2">
                                      {message.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollShadow>

                      {validMessages.length === 0 && (
                        <div className="text-center py-8 text-default-400">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">暂无可分享的消息</p>
                        </div>
                      )}
                    </div>

                    <Divider />

                    {/* 用户消息选项 */}
                    <div>
                      <Checkbox
                        isSelected={includeUserMessages}
                        onValueChange={setIncludeUserMessages}
                      >
                        包含我的消息
                      </Checkbox>
                      <p className="text-xs text-default-500 ml-7 mt-1">
                        勾选后将同时分享您发送的消息
                      </p>
                    </div>

                    <Divider />

                    {/* 奖励提示 */}
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        🎁 分享奖励
                      </h4>
                      <p className="text-xs text-default-600">
                        每次有人访问您的分享链接，您都可以获得奖励！
                      </p>
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="success" variant="flat">
                            免费用户
                          </Chip>
                          <span className="text-default-600">
                            聊天+10次、合盘+1次、角色+1个、Agent+1个
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="primary" variant="flat">
                            付费用户
                          </Chip>
                          <span className="text-default-600">角色+2个、Agent+2个</span>
                        </div>
                        <p className="text-default-500 mt-2">
                          · 每周最多获得3次奖励，有效期7天
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-success/10 p-4 rounded-lg flex items-start gap-3">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-success">分享链接已创建！</h4>
                      <p className="text-sm text-default-600 mt-1">
                        复制链接并分享给您的朋友吧
                      </p>
                    </div>
                  </div>

                  <Snippet
                    symbol=""
                    classNames={{
                      base: "w-full",
                      pre: "text-xs",
                    }}
                    codeString={shareUrl}
                    onCopy={handleCopyLink}
                  >
                    {shareUrl}
                  </Snippet>

                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<Copy className="w-4 h-4" />}
                      onPress={handleCopyLink}
                      className="flex-1"
                    >
                      复制链接
                    </Button>
                    <Button
                      color="secondary"
                      variant="flat"
                      startContent={<ExternalLink className="w-4 h-4" />}
                      onPress={handleOpenLink}
                      className="flex-1"
                    >
                      打开链接
                    </Button>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              {!isShared ? (
                <>
                  <Button variant="light" onPress={handleClose}>
                    取消
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleShare}
                    isLoading={isLoading}
                    startContent={!isLoading && <Share2 className="w-4 h-4" />}
                    isDisabled={!shareAll && selectedMessageIds.length === 0}
                  >
                    创建分享
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="light" onPress={handleReset}>
                    创建新分享
                  </Button>
                  <Button color="primary" onPress={handleClose}>
                    完成
                  </Button>
                </>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

