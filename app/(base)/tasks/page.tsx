"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Gift, Sparkles, ArrowRight } from "lucide-react"
import { getTaskStatus, claimNewbieReward, TASK_ICONS, type TaskStatus, type TaskKey, calculateTaskProgress } from "@/lib/api/tasks"
import { logger } from "@/lib/utils/logger"
import { toast } from "sonner"
import { useTranslation } from "@/lib/utils/translations"
import { databaseOperations } from "@/lib/supabase/database"
import { Store } from "@/store"

// 任务跳转路径映射
const TASK_ROUTES: Record<string, string> = {
  task_1: "/chat?task=personal",  // 完善个人命理档案 -> 聊天页面并自动开始个人算命
  task_2: "/chat?task=character",  // 创建私人角色 -> 聊天页面并打开模式选择对话框
  task_3: "/database",             // 与角色Agent对话 -> 角色数据库
  task_4: "/database",             // 进行合盘分析 -> 角色数据库
}

export default function TasksPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // 🔒 检查登录状态
  useEffect(() => {
    const userId = Store.user.userId
    if (!userId) {
      logger.warn({ module: "tasks-page", operation: "checkAuth" }, "User not logged in, redirecting to login")
      toast.error(t("tasks.loginRequired") || "请先登录以查看新手任务")
      router.push("/login")
    }
  }, [router, t])

  // 加载任务状态
  const loadTaskStatus = async () => {
    try {
      setLoading(true)
      const status = await getTaskStatus()
      setTaskStatus(status)
      
      // 🎯 检查是否所有任务完成且未领取奖励，自动领取
      if (status && status.all_completed && !status.reward_claimed) {
        logger.info({ module: "tasks-page", operation: "autoClaimReward" }, "All tasks completed, auto claiming reward")
        await autoClaimReward()
      }
    } catch (error) {
      logger.error({ module: "tasks-page", operation: "load", error }, "Failed to load tasks")
      toast.error(t("tasks.loadTasksFailed"))
    } finally {
      setLoading(false)
    }
  }

  // 自动领取奖励
  const autoClaimReward = async () => {
    try {
      const result = await claimNewbieReward()
      
      if (result.success) {
        // 显示成功提示
        toast.success(
          t("tasks.autoRewardClaimed") || "🎉 恭喜！您已自动升级为为期一周的使用会员",
          { duration: 5000 }
        )
        
        logger.success({ module: "tasks-page", operation: "autoClaimReward" }, "Reward auto-claimed successfully")
        
        // 刷新任务状态（不再自动领取，避免循环）
        const updatedStatus = await getTaskStatus()
        setTaskStatus(updatedStatus)
      } else {
        logger.warn(
          { module: "tasks-page", operation: "autoClaimReward", error: result.error, message: result.message },
          "Failed to auto-claim reward"
        )
        // 不显示错误toast，避免影响用户体验
      }
    } catch (error) {
      logger.error({ module: "tasks-page", operation: "autoClaimReward", error }, "Unexpected error auto-claiming reward")
      // 不显示错误toast，避免影响用户体验
    }
  }

  useEffect(() => {
    loadTaskStatus()
    
    // 🎯 添加页面可见性监听，当用户返回页面时自动刷新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.info({ module: "tasks-page", operation: "visibilityChange" }, "Page became visible, refreshing task status")
        loadTaskStatus()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // 清理监听器
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 🎯 只在组件挂载时执行一次，避免无限循环

  // 处理任务卡片点击
  const handleTaskClick = async (taskKey: string, completed: boolean) => {
    // 如果任务已完成，不跳转
    if (completed) {
      return
    }

    // 🎯 任务1特殊处理：检查是否已有 personal 会话
    if (taskKey === "task_1") {
      try {
        const userId = Store.user.userId
        if (userId) {
          // 查询用户的所有会话
          const { data: sessions, error } = await databaseOperations.getUserSessions(userId)
          
          if (!error && sessions && sessions.length > 0) {
            // 过滤出 personal 模式的会话
            const personalSessions = sessions.filter((s: any) => s.mode === "personal")
            
            if (personalSessions.length > 0) {
              // 按更新时间排序，取最新的
              const latestSession = personalSessions.sort((a: any, b: any) => {
                return new Date(b.update_time).getTime() - new Date(a.update_time).getTime()
              })[0]
              
              logger.info({ 
                module: "tasks", 
                operation: "handleTaskClick", 
                data: { sessionId: latestSession.id } 
              }, "Found existing personal session, redirecting")
              
              // 跳转到已有的 personal 会话
              router.push(`/chat/${latestSession.id}`)
              return
            }
          }
        }
      } catch (error) {
        logger.error({ module: "tasks", operation: "handleTaskClick", error }, "Failed to check existing sessions")
        // 出错时继续走正常流程
      }
    }

    // 🎯 任务2特殊处理：检查是否已有未完成的角色创建会话
    if (taskKey === "task_2") {
      try {
        const userId = Store.user.userId
        if (userId) {
          // 查询用户的所有会话
          const { data: sessions, error } = await databaseOperations.getUserSessions(userId)
          
          if (!error && sessions && sessions.length > 0) {
            // 过滤出有 character_ids 的会话（角色创建会话）
            const characterSessions = sessions.filter((s: any) => 
              s.character_ids && 
              s.character_ids.length > 0 &&
              s.mode !== "personal"  // 排除 personal 模式
            )
            
            if (characterSessions.length > 0) {
              // 检查每个 session 对应的角色状态
              for (const session of characterSessions) {
                const characterId = session.character_ids[0]
                
                // 查询角色信息
                const { data: character } = await databaseOperations.getCharacterById(characterId)
                
                // 如果角色未完成，跳转到该会话
                if (character && character.processing_status !== 'completed') {
                  logger.info({ 
                    module: "tasks", 
                    operation: "handleTaskClick", 
                    data: { sessionId: session.id, characterId, status: character.processing_status } 
                  }, "Found incomplete character creation session, redirecting")
                  
                  router.push(`/chat/${session.id}`)
                  return
                }
              }
            }
          }
        }
      } catch (error) {
        logger.error({ module: "tasks", operation: "handleTaskClick", error }, "Failed to check character creation sessions")
        // 出错时继续走正常流程
      }
    }

    // 跳转到对应的页面
    const route = TASK_ROUTES[taskKey]
    if (route) {
      router.push(route)
    }
  }


  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-foreground/60">{t("tasks.loadingTasks")}</div>
        </div>
      </div>
    )
  }

  if (!taskStatus) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-foreground/60">{t("tasks.loadTasksFailed")}</div>
        </div>
      </div>
    )
  }

  const progress = calculateTaskProgress(taskStatus.tasks)
  const canClaimReward = taskStatus.all_completed && !taskStatus.reward_claimed

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      {/* 标题和进度 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("tasks.title")}</h1>
            <p className="text-foreground/60 mt-1">
              {t("tasks.subtitle")}
            </p>
          </div>
          {taskStatus.reward_claimed && (
            <div className="flex items-center gap-2 text-success">
              <Gift className="w-5 h-5" />
              <span className="font-medium">{t("tasks.rewardClaimed")}</span>
            </div>
          )}
        </div>

        {/* 进度条 */}
        <Card className="bg-content1/80 backdrop-blur-sm">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground/60">{t("tasks.taskProgress")}</span>
              <span className="text-sm font-medium text-foreground">
                {progress.completed} / {progress.total}
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </CardBody>
        </Card>
      </div>

      {/* 任务列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(taskStatus.tasks).map(([taskKey, taskInfo]) => {
          const taskNum = taskKey.split('_')[1]
          const taskIcon = TASK_ICONS[taskKey as TaskKey]
          const isCompleted = taskInfo.completed
          
          return (
            <Card 
              key={taskKey}
              isPressable={!isCompleted}
              isHoverable={!isCompleted}
              onPress={() => handleTaskClick(taskKey, isCompleted)}
              className={`
                transition-all duration-200
                ${isCompleted 
                  ? 'bg-success/10 border-success/30' 
                  : 'bg-content1/80 hover:bg-content2/60 hover:shadow-lg cursor-pointer'
                }
                backdrop-blur-sm
              `}
            >
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  {/* 任务图标 */}
                  <div className="flex-shrink-0">
                    <span className="text-3xl">{taskIcon}</span>
                  </div>

                  {/* 任务信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {t(`tasks.task${taskNum}Title` as any)}
                    </h3>
                    <p className="text-sm text-foreground/60 mb-2">
                      {t(`tasks.task${taskNum}Desc` as any)}
                    </p>
                    {isCompleted && taskInfo.completed_at && (
                      <p className="text-xs text-success">
                        {t("tasks.completed")} • {new Date(taskInfo.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* 状态指示器 */}
                  <div className="flex-shrink-0 self-center">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <ArrowRight className="w-6 h-6 text-foreground/40" />
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* 奖励卡片 */}
      <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30 backdrop-blur-sm">
        <CardBody className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* 奖励图标 */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Gift className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* 奖励说明 */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2 justify-center md:justify-start">
                <Sparkles className="w-6 h-6 text-primary" />
                {t("tasks.rewardTitle")}
              </h3>
              <p className="text-foreground/60">
                {t("tasks.rewardDesc")}
              </p>
            </div>

            {/* 状态显示 */}
            <div className="flex-shrink-0">
              {taskStatus.reward_claimed ? (
                <div className="px-8 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-lg font-semibold">{t("tasks.claimed")}</span>
                  </div>
                </div>
              ) : canClaimReward ? (
                <div className="px-8 py-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg border border-primary/30">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="text-lg font-semibold">{t("tasks.autoClaimingReward")}</span>
                  </div>
                </div>
              ) : (
                <div className="px-8 py-4 bg-foreground/5 rounded-lg border border-foreground/10">
                  <span className="text-lg font-semibold text-foreground/60">
                    {t("tasks.tasksRemaining").replace("{count}", String(progress.total - progress.completed))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

