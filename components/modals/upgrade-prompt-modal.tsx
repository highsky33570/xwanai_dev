/**
 * 升级会员提示弹窗
 */

"use client"

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react"
import { Crown, Check } from "lucide-react"
import { UsageLimitErrorDetail } from "@/lib/api/usage-limits"
import { useRouter } from "next/navigation"

interface UpgradePromptModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  limitDetail?: UsageLimitErrorDetail | null
}

export function UpgradePromptModal({
  isOpen,
  onOpenChange,
  limitDetail
}: UpgradePromptModalProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    // 跳转到订阅页面或打开订阅弹窗
    // 这里需要根据你的实际订阅流程来实现
    onOpenChange(false)
    // TODO: 打开订阅弹窗或跳转到订阅页面
  }

  const getLimitMessage = () => {
    if (!limitDetail) return "您已达到免费用户的使用上限"
    
    const messages: Record<string, string> = {
      character_count: "角色数量已达上限",
      chat_daily: "今日聊天次数已用完",
      hepan_weekly: "本周合盘次数已用完",
      character_session_weekly: "本周角色对话Session已用完"
    }
    
    return messages[limitDetail.limit_type] || limitDetail.message
  }

  const benefits = [
    "创建最多 15 个角色",
    "无限制聊天次数",
    "无限制合盘分析",
    "每周 10 个角色对话Session",
    "优先客户支持"
  ]

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-warning" />
                <span>升级为会员</span>
              </div>
            </ModalHeader>
            
            <ModalBody>
              {/* 限制提示 */}
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/30">
                <p className="text-sm text-warning-600 dark:text-warning-400">
                  {getLimitMessage()}
                </p>
                {limitDetail?.reset_time && (
                  <p className="text-xs text-default-500 mt-1">
                    重置时间：{new Date(limitDetail.reset_time).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>

              {/* 会员权益 */}
              <div className="space-y-3 mt-4">
                <p className="text-sm font-semibold">升级为会员，享受以下权益：</p>
                <ul className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 价格 */}
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">月付会员</p>
                    <p className="text-xs text-default-500">$11.99/月 或 ¥59.99/月</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">年付会员</p>
                    <p className="text-xs text-default-500">$117.99/年 或 ¥599.99/年</p>
                    <p className="text-xs text-success">省 17%</p>
                  </div>
                </div>
              </div>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                稍后再说
              </Button>
              <Button 
                color="primary" 
                onPress={handleUpgrade}
                startContent={<Crown className="w-4 h-4" />}
              >
                立即升级
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

