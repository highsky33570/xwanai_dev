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
  CheckboxGroup,
  Divider,
  Snippet,
  Chip,
} from "@heroui/react"
import { Share2, Check, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { createShare, CreateShareRequest } from "@/lib/api/share"
import { useTranslation } from "@/lib/utils/translations"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareType: "character" | "chat" | "hepan"
  characterId?: string
  sessionId?: string
  characterData?: {
    name: string
    reports?: Record<string, any>
  }
}

// 报告类型映射
const REPORT_OPTIONS = [
  { key: "basic", label: "基础解读", description: "生命蓝图与核心要素" },
  { key: "personal", label: "个性特质", description: "深度性格洞察" },
  { key: "career", label: "事业发展", description: "学业与职业规划" },
  { key: "wealth", label: "财富运势", description: "财富蓝图与策略" },
  { key: "relationship", label: "情感关系", description: "深度情感分析" },
  { key: "health", label: "健康调养", description: "体质倾向与指导" },
  { key: "fengshui", label: "风水环境", description: "环境能量优化" },
  { key: "fortune", label: "运势分析", description: "综合运势把握" },
  { key: "luck", label: "日常指导", description: "生活决策规划" },
]

export default function ShareModal({
  isOpen,
  onClose,
  shareType,
  characterId,
  sessionId,
  characterData,
}: ShareModalProps) {
  const { t } = useTranslation()
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [includeUserMessages, setIncludeUserMessages] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>("")
  const [isShared, setIsShared] = useState(false)

  // 获取可用的报告列表
  const availableReports = REPORT_OPTIONS.filter((option) => {
    if (!characterData?.reports) return false
    return characterData.reports[option.key]
  })

  const handleShare = async () => {
    setIsLoading(true)
    try {
      const request: CreateShareRequest = {
        share_type: shareType,
      }

      if (shareType === "character") {
        if (!characterId) throw new Error("角色ID缺失")
        request.character_id = characterId
        request.selected_reports = selectedReports.length > 0 ? selectedReports : undefined
      } else {
        if (!sessionId) throw new Error("会话ID缺失")
        request.session_id = sessionId
        request.include_user_messages = includeUserMessages
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
    setSelectedReports([])
    setIncludeUserMessages(true)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
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
                <span>分享{shareType === "character" ? "角色" : shareType === "hepan" ? "合盘" : "聊天"}</span>
              </div>
              {characterData?.name && (
                <p className="text-sm text-default-500 font-normal">
                  {characterData.name}
                </p>
              )}
            </ModalHeader>

            <ModalBody>
              {!isShared ? (
                <>
                  {shareType === "character" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-2">选择要分享的报告</h3>
                        <p className="text-xs text-default-500 mb-3">
                          未选择时将分享所有可用报告
                        </p>
                        <CheckboxGroup
                          value={selectedReports}
                          onValueChange={setSelectedReports}
                        >
                          <div className="grid grid-cols-1 gap-2">
                            {availableReports.map((option) => (
                              <Checkbox
                                key={option.key}
                                value={option.key}
                                classNames={{
                                  base: "bg-content2/50 hover:bg-content2 rounded-lg p-3 border-2 border-transparent data-[selected=true]:border-primary",
                                  label: "w-full",
                                }}
                              >
                                <div className="w-full">
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-default-500">
                                    {option.description}
                                  </div>
                                </div>
                              </Checkbox>
                            ))}
                          </div>
                        </CheckboxGroup>
                      </div>

                      <Divider />

                      <div className="bg-primary/10 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          🎁 分享奖励
                        </h4>
                        <p className="text-xs text-default-600">
                          每次有人访问您的分享链接，您都可以获得奖励！
                        </p>
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Chip size="sm" color="success" variant="flat">免费用户</Chip>
                            <span className="text-default-600">
                              聊天+10次、合盘+1次、角色+1个、Agent+1个
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" color="primary" variant="flat">付费用户</Chip>
                            <span className="text-default-600">
                              角色+2个、Agent+2个
                            </span>
                          </div>
                          <p className="text-default-500 mt-2">
                            · 每周最多获得3次奖励，有效期7天
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {shareType !== "character" && (
                    <div className="space-y-4">
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

                      <div className="bg-primary/10 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          🎁 分享奖励
                        </h4>
                        <p className="text-xs text-default-600">
                          每次有人访问您的分享链接，您都可以获得奖励！
                        </p>
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Chip size="sm" color="success" variant="flat">免费用户</Chip>
                            <span className="text-default-600">
                              聊天+10次、合盘+1次、角色+1个、Agent+1个
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" color="primary" variant="flat">付费用户</Chip>
                            <span className="text-default-600">
                              角色+2个、Agent+2个
                            </span>
                          </div>
                          <p className="text-default-500 mt-2">
                            · 每周最多获得3次奖励，有效期7天
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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

