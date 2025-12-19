"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardBody, Button, Divider, Chip, Spinner } from "@heroui/react"
import { Copy, Check, Gift, Users, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/utils/translations"
import { invitationAPI } from "@/lib/api/client"
import { logger } from "@/lib/utils/logger"

interface InvitationStats {
  invitation_code: string | null
  used_count: number
  invitees: Array<{
    id: string
    name: string
    paid: boolean
    joined_at: string
  }>
  reward: {
    character_count_bonus: number
    session_count_bonus: number
    expires_at: string
  } | null
}

export function InvitationCard() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<InvitationStats | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadInvitationStats()
  }, [])

  const loadInvitationStats = async () => {
    try {
      setLoading(true)
      const data = await invitationAPI.getInvitationStats()
      setStats(data)
      logger.info({ module: "invitation-card", operation: "load" }, "Invitation stats loaded", data)
    } catch (error) {
      console.error("❌ [DEBUG] Failed to load invitation stats:", error)
      logger.error({ module: "invitation-card", operation: "load" }, "Failed to load invitation stats", error)
      toast.error(t("invitation.loading"))
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!stats?.invitation_code) {
      try {
        const { invite_url } = await invitationAPI.getInvitationCode()
        await navigator.clipboard.writeText(invite_url)
        setCopied(true)
        toast.success(t("invitation.linkCopied"))
        setTimeout(() => setCopied(false), 2000)
        // Reload stats to get the new code
        loadInvitationStats()
      } catch (error) {
        logger.error({ module: "invitation-card", operation: "copy" }, "Failed to copy link", error)
        toast.error(t("invitation.copyFailed"))
      }
      return
    }

    // 使用当前域名生成邀请链接（支持本地开发和生产环境）
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.xwanai.com"
    const inviteUrl = `${origin}/register?invite=${stats.invitation_code}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success(t("invitation.linkCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.error({ module: "invitation-card", operation: "copy" }, "Failed to copy link", error)
      toast.error(t("invitation.copyFailed"))
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">{t("invitation.title")}</h2>
        </div>
        <p className="text-sm text-default-500">{t("invitation.subtitle")}</p>
      </CardHeader>
      <Divider />
      <CardBody className="gap-6">
        {/* Invitation Code Section */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-default-700 mb-2">{t("invitation.yourCode")}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-default-100 px-4 py-3 font-mono text-lg font-bold tracking-wider">
                {stats?.invitation_code || "--------"}
              </div>
              <Button
                color="primary"
                variant="flat"
                startContent={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onPress={handleCopyLink}
                className="min-w-[120px]"
              >
                {copied 
                  ? t("invitation.copied") 
                  : stats?.invitation_code 
                    ? t("invitation.copyLink") 
                    : t("invitation.generateLink")
                }
              </Button>
            </div>
          </div>
        </div>

        <Divider />

        {/* How It Works */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-default-700">{t("invitation.howItWorks")}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-default-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary">
                <span className="text-lg font-bold">1</span>
              </div>
              <p className="text-xs font-medium">{t("invitation.step1Title")}</p>
              <p className="text-xs text-default-500">{t("invitation.step1Desc")}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-default-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary">
                <span className="text-lg font-bold">2</span>
              </div>
              <p className="text-xs font-medium">{t("invitation.step2Title")}</p>
              <p className="text-xs text-default-500">{t("invitation.step2Desc")}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-default-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary">
                <span className="text-lg font-bold">3</span>
              </div>
              <p className="text-xs font-medium">{t("invitation.step3Title")}</p>
              <p className="text-xs text-default-500">{t("invitation.step3Desc")}</p>
            </div>
          </div>
        </div>

        <Divider />

        {/* Reward Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-default-700">{t("invitation.rewardDetails")}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 p-2 rounded-md bg-success-50">
              <span className="text-success font-medium">•</span>
              <div>
                <span className="font-medium text-success-700">{t("invitation.firstFive")}: </span>
                <span className="text-success-600">{t("invitation.firstFiveDesc")}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-md bg-primary-50">
              <span className="text-primary font-medium">•</span>
              <div>
                <span className="font-medium text-primary-700">{t("invitation.afterFive")}: </span>
                <span className="text-primary-600">{t("invitation.afterFiveDesc")}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-md bg-warning-50">
              <span className="text-warning font-medium">•</span>
              <div>
                <span className="font-medium text-warning-700">{t("invitation.friendPays")}: </span>
                <span className="text-warning-600">{t("invitation.friendPaysDesc")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Rewards */}
        {stats?.reward && (
          <>
            <Divider />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-default-700">{t("invitation.currentRewards")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100">
                  <Gift className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-default-600">{t("invitation.bonusSlots").replace("{count}", String(stats.reward.character_count_bonus))}</p>
                    <p className="text-xs text-default-600">{t("invitation.bonusSessions").replace("{count}", String(stats.reward.session_count_bonus))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-success-50 to-success-100">
                  <Calendar className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-xs text-default-600">{t("invitation.expiresOn")}</p>
                    <p className="text-xs font-medium text-success-700">{formatDate(stats.reward.expires_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!stats?.reward && (
          <div className="text-center py-4">
            <p className="text-sm text-default-500">{t("invitation.noRewards")}</p>
            <p className="text-xs text-default-400 mt-1">{t("invitation.inviteNow")}</p>
          </div>
        )}

        {/* Invited Friends */}
        {stats && stats.invitees.length > 0 && (
          <>
            <Divider />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-default-700">{t("invitation.invitedFriends")}</h3>
                <Chip size="sm" variant="flat" color="primary" startContent={<Users className="h-3 w-3" />}>
                  {t("invitation.friendsCount").replace("{count}", String(stats.used_count))}
                </Chip>
              </div>
              <div className="space-y-2">
                {stats.invitees.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-default-700">{friend.name}</p>
                      <p className="text-xs text-default-500">{formatDate(friend.joined_at)}</p>
                    </div>
                    <Chip size="sm" variant="flat" color={friend.paid ? "success" : "default"}>
                      {friend.paid ? t("invitation.statusPaid") : t("invitation.statusFree")}
                    </Chip>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {stats && stats.invitees.length === 0 && (
          <div className="text-center py-4">
            <Users className="h-12 w-12 mx-auto text-default-300 mb-2" />
            <p className="text-sm text-default-500">{t("invitation.noInvitees")}</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

