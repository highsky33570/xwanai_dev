"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardBody,
  Avatar,
  Button,
  Spinner,
  Chip,
  Divider,
} from "@heroui/react"
import { ArrowLeft, Calendar, User, FileText, Sparkles, Heart, Target, MessageSquare, Users, Star, Zap, ShieldAlert, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { getShareDetail, type ShareDetailResponse } from "@/lib/api/share"
import { getAvatarPublicUrl } from "@/lib/supabase/storage"
import { useTranslation } from "@/lib/utils/translations"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ShareViewPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [shareData, setShareData] = useState<ShareDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadShareContent()
    }
  }, [token])

  const loadShareContent = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getShareDetail(token)
      setShareData(data)
    } catch (err: any) {
      console.error("Failed to load share content:", err)
      const errorMsg = err.message || t("sharePage.shareNotFound")
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 渲染 AI 消息气泡
  const renderAIMessage = (content: string, title?: string) => (
    <div className="flex items-start gap-3 mb-4">
      <Avatar
        icon={<Sparkles className="w-4 h-4" />}
        className="flex-shrink-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
      />
      <div className="flex-1 space-y-2">
        {title && (
          <div className="text-sm font-semibold text-primary">{title}</div>
        )}
        <div className="bg-content2/80 backdrop-blur-sm border-2 border-primary/30 rounded-2xl rounded-tl-none p-4 shadow-lg">
          <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )

  // 渲染用户消息气泡
  const renderUserMessage = (content: string) => (
    <div className="flex items-start gap-3 mb-4 flex-row-reverse">
      <Avatar
        icon={<User className="w-4 h-4" />}
        className="flex-shrink-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
      />
      <div className="flex-1 flex justify-end">
        <div className="bg-primary/30 backdrop-blur-sm border-2 border-primary/50 rounded-2xl rounded-tr-none p-4 max-w-[80%] shadow-lg">
          <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )

  // 渲染角色信息卡片（作为AI消息）
  const renderCharacterCard = () => {
    if (!shareData?.character) return null

    const character = shareData.character
    // 分享页面中无需 auth_id，getAvatarPublicUrl 会处理
    const avatarUrl = getAvatarPublicUrl(character.avatar_id)

    return (
      <div className="mb-6">
        <Card className="bg-gradient-to-br from-content2/90 via-content2/80 to-content2/70 backdrop-blur-xl border-2 border-primary/20 shadow-2xl overflow-hidden">
          <CardBody className="p-0">
            {/* 顶部渐变装饰 */}
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
            
            <div className="p-6 space-y-6">
              {/* 头像和基本信息 */}
              <div className="flex items-start gap-6">
                {/* 角色头像 */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-2xl blur-xl"></div>
                  <Avatar
                    src={avatarUrl}
                    icon={!avatarUrl ? <User className="w-12 h-12" /> : undefined}
                    className="relative w-24 h-24 md:w-28 md:h-28 border-3 border-primary/30 shadow-xl"
                    classNames={{
                      base: "ring-2 ring-primary/10",
                    }}
                  />
                </div>

                {/* 角色名称和描述 */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        角色档案
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text mb-2">
                      {character.name}
                    </h3>
                    
                    {/* 出生时间和性别信息 */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-500">
                      {character.birth_time && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-primary/70" />
                          <span>
                            {new Date(character.birth_time).toLocaleString('zh-CN', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      )}
                      
                      {character.gender && (
                        <>
                          {character.birth_time && (
                            <span className="text-foreground-300">•</span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-secondary/70" />
                            <span>
                              {character.gender === "male" ? "男" : character.gender === "female" ? "女" : "其他"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {character.description && (
                    <>
                      <Divider className="bg-primary/10" />
                      <p className="text-sm md:text-base text-foreground-600 leading-relaxed line-clamp-3">
                        {character.description}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  // 渲染报告（卡片样式）
  const renderReports = () => {
    if (!shareData?.character?.reports) {
      return null
    }

    const reportConfig: Record<string, { title: string; icon: any; color: string }> = {
      basic: { title: "基础解读 - 生命蓝图", icon: Star, color: "primary" },
      personal: { title: "个性特质 - 深度性格洞察", icon: User, color: "secondary" },
      luck: { title: "多元个性棱镜 - 大运流年分析", icon: TrendingUp, color: "success" },
      achievement: { title: "人生成就考据 - 功业格局研究", icon: Target, color: "warning" },
      career: { title: "事业发展 - 学业与职业规划", icon: TrendingUp, color: "success" },
      wealth: { title: "财富运势 - 财富蓝图", icon: Sparkles, color: "warning" },
      relationship: { title: "情感关系 - 深度情感分析", icon: Heart, color: "danger" },
      health: { title: "健康调养 - 体质倾向", icon: Heart, color: "success" },
      fengshui: { title: "风水环境 - 环境能量优化", icon: Sparkles, color: "primary" },
      fortune: { title: "运势分析 - 综合运势", icon: Star, color: "warning" },
    }

    const reports = shareData.character.reports
    return (
      <div className="space-y-4 mt-6">
        {Object.entries(reports).map(([reportKey, reportContent]: [string, any]) => {
          const config = reportConfig[reportKey] || { title: reportKey, icon: FileText, color: "default" }
          const content = typeof reportContent === 'string' ? reportContent : reportContent?.content || JSON.stringify(reportContent)
          const IconComponent = config.icon
          
          return (
            <Card key={reportKey} className={`bg-content2/50 border-${config.color}/20`}>
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <IconComponent className={`w-5 h-5 text-${config.color}`} />
                  <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
                </div>
                <pre className="text-sm text-foreground-600 whitespace-pre-wrap leading-relaxed font-sans">
                  {content}
                </pre>
              </CardBody>
            </Card>
          )
        })}
      </div>
    )
  }

  // 渲染灵魂档案（Character Metadata）
  const renderCharacterMetadata = () => {
    if (!shareData?.character?.character_metadata) return null

    const metadata = shareData.character.character_metadata
    const { ai_extracted, user_provided } = metadata

    if (!ai_extracted && !user_provided) return null

    return (
      <div className="space-y-4 mt-6">
        {/* AI Summary */}
        {ai_extracted?.ai_summary && (
          <Card className="bg-content2/50 border-purple-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-foreground">AI 深度洞察</h3>
              </div>
              <pre className="text-sm text-foreground-600 whitespace-pre-wrap leading-relaxed font-sans">
                {ai_extracted.ai_summary}
              </pre>
            </CardBody>
          </Card>
        )}

        {/* Keywords */}
        {ai_extracted?.keywords && ai_extracted.keywords.length > 0 && (
          <Card className="bg-content2/50 border-blue-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-foreground">核心特质</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {ai_extracted.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Key Events */}
        {user_provided?.key_events && user_provided.key_events.length > 0 && (
          <Card className="bg-content2/50 border-amber-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-foreground">人生转折点</h3>
              </div>
              <div className="space-y-4">
                {user_provided.key_events.map((event, idx) => (
                  <div key={idx} className="p-4 bg-content1/50 rounded-lg border border-amber-500/10">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">{event.title}</h4>
                        {event.age && (
                          <div className="text-xs text-foreground-500 mb-2">年龄: {event.age}</div>
                        )}
                        <p className="text-sm text-foreground-600 leading-relaxed">{event.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Secrets & Obsessions */}
        {user_provided?.secrets_obsessions && user_provided.secrets_obsessions.length > 0 && (
          <Card className="bg-content2/50 border-rose-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-semibold text-foreground">秘密与执念</h3>
              </div>
              <div className="space-y-3">
                {user_provided.secrets_obsessions.map((item, idx) => (
                  <div key={idx} className="p-4 bg-content1/50 rounded-lg border border-rose-500/10">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="shrink-0">
                        {item.type === "secret" && "秘密"}
                        {item.type === "obsession" && "执念"}
                        {item.type === "trauma" && "创伤"}
                        {item.type === "dream" && "梦想"}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm text-foreground-600 leading-relaxed">{item.content}</p>
                        {item.reason && (
                          <p className="text-xs text-foreground-500 mt-2 italic">原因: {item.reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Relationships */}
        {user_provided?.relationships && Object.keys(user_provided.relationships).length > 0 && (
          <Card className="bg-content2/50 border-green-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-foreground">人际关系</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(user_provided.relationships).map(([person, relationship], idx) => (
                  <div key={idx} className="p-4 bg-content1/50 rounded-lg border border-green-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-foreground">{person}</span>
                    </div>
                    <p className="text-sm text-foreground-600 leading-relaxed">{relationship}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Special Traits */}
        {user_provided?.special_traits && user_provided.special_traits.length > 0 && (
          <Card className="bg-content2/50 border-cyan-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-5 h-5 text-cyan-500" />
                <h3 className="text-lg font-semibold text-foreground">特殊习惯</h3>
              </div>
              <ul className="space-y-2">
                {user_provided.special_traits.map((trait, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground-600">
                    <span className="text-cyan-500 mt-1">•</span>
                    <span className="leading-relaxed">{trait}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {/* Goals & Motivations */}
        {user_provided?.goals_motivations && (
          <Card className="bg-content2/50 border-indigo-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-foreground">人生目标</h3>
              </div>
              <pre className="text-sm text-foreground-600 whitespace-pre-wrap leading-relaxed font-sans">
                {user_provided.goals_motivations}
              </pre>
            </CardBody>
          </Card>
        )}

        {/* Speech Style */}
        {user_provided?.speech_style && (
          <Card className="bg-content2/50 border-pink-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-pink-500" />
                <h3 className="text-lg font-semibold text-foreground">语言特点</h3>
              </div>
              <pre className="text-sm text-foreground-600 whitespace-pre-wrap leading-relaxed font-sans">
                {user_provided.speech_style}
              </pre>
            </CardBody>
          </Card>
        )}

        {/* Personality Traits */}
        {ai_extracted?.personality_traits && ai_extracted.personality_traits.length > 0 && (
          <Card className="bg-content2/50 border-violet-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-violet-500" />
                <h3 className="text-lg font-semibold text-foreground">AI 性格特质分析</h3>
              </div>
              <div className="space-y-4">
                {ai_extracted.personality_traits.map((trait, idx) => (
                  <div key={idx} className="p-4 bg-content1/50 rounded-lg border border-violet-500/10">
                    <h4 className="font-semibold text-foreground mb-2">{trait.trait}</h4>
                    <p className="text-sm text-foreground-600 mb-2 leading-relaxed">{trait.manifestation}</p>
                    {trait.bazi_correspondence && (
                      <p className="text-xs text-violet-500 italic">八字对应: {trait.bazi_correspondence}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Inner Conflicts */}
        {ai_extracted?.inner_conflicts && ai_extracted.inner_conflicts.length > 0 && (
          <Card className="bg-content2/50 border-orange-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-foreground">内心冲突</h3>
              </div>
              <ul className="space-y-2">
                {ai_extracted.inner_conflicts.map((conflict, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground-600">
                    <span className="text-orange-500 mt-1">•</span>
                    <span className="leading-relaxed">{conflict}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {/* Emotional Triggers */}
        {ai_extracted?.emotional_triggers && ai_extracted.emotional_triggers.length > 0 && (
          <Card className="bg-content2/50 border-red-500/20">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-foreground">情感触发点</h3>
              </div>
              <ul className="space-y-2">
                {ai_extracted.emotional_triggers.map((trigger, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground-600">
                    <span className="text-red-500 mt-1">•</span>
                    <span className="leading-relaxed">{trigger}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    )
  }

  // 渲染聊天消息
  const renderChatMessages = () => {
    if (!shareData?.messages || shareData.messages.length === 0) return null

    return shareData.messages.map((message) => {
      // 显示用户消息和AI消息
      if (message.role === "user") {
        return (
          <div key={message.id}>
            {renderUserMessage(message.content || "")}
          </div>
        )
      } else if (message.role === "model" || message.role === "assistant") {
        return (
          <div key={message.id}>
            {renderAIMessage(message.content || "")}
          </div>
        )
      }
      return null
    })
  }

  // Loading 状态
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-content1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-foreground-500">{t("sharePage.loading")}</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error || !shareData) {
    return (
      <div className="min-h-screen w-full bg-content1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardBody className="text-center space-y-4 p-8">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-foreground">
              {error?.includes("不存在") || error?.includes("过期") 
                ? t("sharePage.shareExpired") 
                : t("sharePage.loadFailed")}
            </h2>
            <p className="text-foreground-500">
              {error || t("sharePage.shareNotFound")}
            </p>
            <Button
              color="primary"
              onPress={() => router.push("/")}
              className="mt-4"
            >
              {t("sharePage.backToHome")}
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-content1">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-content2/50 backdrop-blur-sm border border-white/10">
          <CardBody className="p-6">
            {/* 分享信息头部 */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  {(() => {
                    // 角色分享 - 命理报告
                    if (shareData.share_type === "character" && shareData.character) {
                      return shareData.character.name + t("sharePage.characterReport")
                    }
                    // 合盘分享
                    if (shareData.share_type === "hepan") {
                      return t("sharePage.hepanShare")
                    }
                    // 聊天分享
                    if (shareData.share_type === "chat") {
                      // 与角色对话
                      if (shareData.session_mode === "character_agent" && shareData.character) {
                        return t("sharePage.chatWith") + shareData.character.name + t("sharePage.chatShare")
                      }
                      // 与 XWAN AI 对话（个人算命、合盘等）
                      return t("sharePage.chatWithXWAN")
                    }
                    return t("sharePage.destinyShare")
                  })()}
                </h1>
              </div>
              <p className="text-sm text-foreground-500">
                {t("sharePage.sharedContent")}
              </p>
            </div>

            {/* 聊天式内容展示 */}
            <div className="space-y-4">
              {/* 1. 角色信息 - 只在选择了报告或灵魂档案时显示 */}
              {shareData.share_type === "character" && 
               (shareData.character?.reports && Object.keys(shareData.character.reports).length > 0 ||
                shareData.character?.character_metadata && 
                (shareData.character.character_metadata.ai_extracted || shareData.character.character_metadata.user_provided)) &&
               renderCharacterCard()}

              {/* 2. 报告内容 */}
              {shareData.share_type === "character" && renderReports()}

              {/* 3. 灵魂档案（Character Metadata）*/}
              {shareData.share_type === "character" && renderCharacterMetadata()}

              {/* 4. 聊天记录 */}
              {(shareData.share_type === "chat" ||
                shareData.share_type === "hepan") &&
                renderChatMessages()}
            </div>

            {/* 底部 CTA */}
            <Divider className="my-8" />
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("sharePage.createYourOwn")}
              </h3>
              <Button
                color="primary"
                size="lg"
                onPress={() => router.push("/")}
                className="font-semibold mt-4"
              >
                {t("sharePage.startNow")}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* 浏览统计 */}
        {shareData.view_count !== undefined && shareData.view_count > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-foreground-500">
              已有 {shareData.view_count} 人查看过此分享
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

