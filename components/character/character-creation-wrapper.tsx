/**
 * 角色创建包装组件
 * 集成使用限制检查
 */

"use client"

import { useState } from "react"
import { Button, Chip } from "@heroui/react"
import { Plus, Lock } from "lucide-react"
import { useUsageStats } from "@/hooks/use-usage-stats"
import { useDisclosure } from "@heroui/react"
import CharacterCreationModal from "./character-creation-modal"

interface CharacterCreationWrapperProps {
  selectedType: string
  onSuccess?: () => void
}

/**
 * 带限制检查的角色创建按钮
 */
export function CharacterCreationWrapper({ 
  selectedType,
  onSuccess 
}: CharacterCreationWrapperProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { stats, isCharacterLimitReached, refetch } = useUsageStats()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const handleCreateClick = () => {
    if (isCharacterLimitReached) {
      setShowUpgradePrompt(true)
      return
    }
    onOpen()
  }

  const handleSuccess = () => {
    refetch()  // 刷新使用统计
    onSuccess?.()
  }

  if (!stats) {
    return null
  }

  return (
    <>
      <div className="space-y-2">
        <Button
          color="primary"
          startContent={isCharacterLimitReached ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          onClick={handleCreateClick}
          disabled={isCharacterLimitReached && !stats.is_premium}
        >
          {isCharacterLimitReached ? "已达上限" : "创建角色"}
        </Button>
        
        {/* 显示配额 */}
        <div className="text-sm text-default-500">
          已创建：{stats.character_count}/{stats.limits.character_max}
        </div>

        {/* 上限提示 */}
        {isCharacterLimitReached && !stats.is_premium && (
          <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
            <p className="text-xs text-warning-600">
              💎 您已达到免费用户角色数量上限，升级为会员可创建更多角色（最多15个）
            </p>
          </div>
        )}
      </div>

      {/* 创建弹窗 */}
      <CharacterCreationModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        selectedType={selectedType}
      />
    </>
  )
}

/**
 * 角色数量显示组件
 */
export function CharacterCountDisplay() {
  const { stats, isLoading } = useUsageStats()

  if (isLoading || !stats) {
    return null
  }

  const isNearLimit = stats.character_count >= stats.limits.character_max * 0.8
  const isAtLimit = stats.character_count >= stats.limits.character_max

  return (
    <Chip
      color={isAtLimit ? "danger" : isNearLimit ? "warning" : "default"}
      variant="flat"
      size="sm"
    >
      {stats.character_count}/{stats.limits.character_max} 角色
    </Chip>
  )
}