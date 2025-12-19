/**
 * 使用统计卡片组件
 * 显示用户的各项使用配额和限制
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardBody, CardHeader, Progress, Chip, Spinner } from "@heroui/react"
import { Crown, MessageCircle, Users, Sparkles } from "lucide-react"
import { usageLimitsAPI, UsageStats } from "@/lib/api/usage-limits"
import { useTranslation } from "@/lib/utils/translations"
import { logger } from "@/lib/utils/logger"

interface UsageStatsCardProps {
  compact?: boolean  // 紧凑模式
  showTitle?: boolean  // 是否显示标题
}

export function UsageStatsCard({ compact = false, showTitle = true }: UsageStatsCardProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const data = await usageLimitsAPI.getUsageStats()
      setStats(data)
      logger.info({ module: "usage-stats", data }, "Usage stats loaded")
    } catch (error) {
      logger.error({ module: "usage-stats", error }, "Failed to load usage stats")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center p-8">
          <Spinner />
        </CardBody>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const isUnlimited = (value: number) => value === -1

  return (
    <Card>
      {showTitle && (
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-semibold">使用情况</p>
            <p className="text-small text-default-500">
              {stats.is_premium ? (
                <span className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-warning" />
                  付费会员
                </span>
              ) : (
                "免费用户"
              )}
            </p>
          </div>
        </CardHeader>
      )}
      
      <CardBody className="gap-4">
        {/* 角色数量 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-default-500" />
              <span className="text-sm font-medium">角色库</span>
            </div>
            <span className="text-sm font-semibold">
              {stats.character_count}/{stats.limits.character_max}
            </span>
          </div>
          <Progress
            value={stats.character_count}
            maxValue={stats.limits.character_max}
            color={stats.character_count >= stats.limits.character_max ? "danger" : "primary"}
            size="sm"
            classNames={{
              indicator: stats.character_count >= stats.limits.character_max ? "bg-gradient-to-r from-danger to-warning" : undefined
            }}
          />
          {stats.character_count >= stats.limits.character_max && (
            <p className="text-xs text-danger">已达上限，升级会员可创建更多角色</p>
          )}
        </div>

        {/* 每日聊天次数 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-default-500" />
              <span className="text-sm font-medium">今日聊天</span>
            </div>
            <span className="text-sm font-semibold">
              {isUnlimited(stats.limits.chat_daily_max) ? (
                <Chip size="sm" color="success" variant="flat">不限</Chip>
              ) : (
                `${stats.chat_daily_count}/${stats.limits.chat_daily_max}`
              )}
            </span>
          </div>
          {!isUnlimited(stats.limits.chat_daily_max) && (
            <>
              <Progress
                value={stats.chat_daily_count}
                maxValue={stats.limits.chat_daily_max}
                color={stats.chat_daily_count >= stats.limits.chat_daily_max ? "danger" : "primary"}
                size="sm"
              />
              {stats.chat_daily_count >= stats.limits.chat_daily_max && (
                <p className="text-xs text-danger">今日已用完，明天00:00重置</p>
              )}
            </>
          )}
        </div>

        {/* 每周合盘次数 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-default-500" />
              <span className="text-sm font-medium">本周合盘</span>
            </div>
            <span className="text-sm font-semibold">
              {isUnlimited(stats.limits.hepan_weekly_max) ? (
                <Chip size="sm" color="success" variant="flat">不限</Chip>
              ) : (
                `${stats.hepan_weekly_count}/${stats.limits.hepan_weekly_max}`
              )}
            </span>
          </div>
          {!isUnlimited(stats.limits.hepan_weekly_max) && (
            <>
              <Progress
                value={stats.hepan_weekly_count}
                maxValue={stats.limits.hepan_weekly_max}
                color={stats.hepan_weekly_count >= stats.limits.hepan_weekly_max ? "danger" : "primary"}
                size="sm"
              />
              {stats.hepan_weekly_count >= stats.limits.hepan_weekly_max && (
                <p className="text-xs text-danger">本周已用完，下周一00:00重置</p>
              )}
            </>
          )}
        </div>

        {/* 每周角色对话 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-default-500" />
              <span className="text-sm font-medium">本周角色对话</span>
            </div>
            <span className="text-sm font-semibold">
              {stats.character_session_weekly_count}/{stats.limits.character_session_weekly_max}
            </span>
          </div>
          <Progress
            value={stats.character_session_weekly_count}
            maxValue={stats.limits.character_session_weekly_max}
            color={stats.character_session_weekly_count >= stats.limits.character_session_weekly_max ? "danger" : "primary"}
            size="sm"
          />
          {stats.character_session_weekly_count >= stats.limits.character_session_weekly_max && (
            <p className="text-xs text-danger">本周已用完，下周一00:00重置</p>
          )}
        </div>

        {/* 升级提示 */}
        {!stats.is_premium && (
          <div className="mt-2 p-3 bg-warning/10 rounded-lg border border-warning/30">
            <p className="text-xs text-warning-600 dark:text-warning-400">
              💎 升级为会员，享受更多权益：15个角色、无限聊天、无限合盘
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

