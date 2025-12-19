"use client";

import { FC } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Heart,
  Target,
  MessageSquare,
  Users,
  Star,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Ban,
  CircleCheckBig,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/utils/translations";

interface CharacterStoryData {
  version: number;
  user_provided: {
    raw_text?: string;
    key_events?: Array<{
      title: string;
      age?: number;
      description: string;
      emotional_impact?: "profound" | "moderate" | "mild";
    }>;
    secrets_obsessions?: Array<{
      type: "secret" | "obsession" | "trauma" | "dream";
      content: string;
      reason?: string;
    }>;
    background_notes?: string[];
    relationships?: Record<string, string>;
    special_traits?: string[];
    goals_motivations?: string;
    speech_style?: string;
    catchphrase?: string;
  };
  ai_extracted: {
    ai_summary?: string;
    keywords?: string[];
    personality_traits?: Array<{
      trait: string;
      manifestation: string;
      bazi_correspondence?: string;
    }>;
    inner_conflicts?: string[];
    emotional_triggers?: string[];
    roleplay_guidelines?: {
      do?: string[];
      dont?: string[];
    };
  };
}

interface CharacterStoryCardProps {
  data: CharacterStoryData;
  isShareMode?: boolean;
  selectedSections?: string[];
  onToggleSection?: (sectionKey: string) => void;
  lastUpdated?: string;
}

const CharacterStoryCard: FC<CharacterStoryCardProps> = ({
  data,
  isShareMode = false,
  selectedSections = [],
  onToggleSection = () => { },
  lastUpdated,
}) => {
  const { t } = useTranslation();
  const { user_provided, ai_extracted } = data;

  // 情感影响程度的颜色映射
  const impactColors = {
    profound: "text-red-500 dark:text-red-400",
    moderate: "text-orange-500 dark:text-orange-400",
    mild: "text-yellow-500 dark:text-yellow-400",
  };

  // 秘密类型的图标映射
  const secretTypeIcons = {
    secret: <ShieldAlert className="w-4 h-4" />,
    obsession: <Zap className="w-4 h-4" />,
    trauma: <Heart className="w-4 h-4 text-red-500" />,
    dream: <Star className="w-4 h-4 text-yellow-500" />,
  };

  // 可选择包装器helper
  const SelectableWrapper: FC<{
    sectionKey: string;
    children: React.ReactNode;
    className?: string;
  }> = ({ sectionKey, children, className = "" }) => {
    const isSelected = selectedSections.includes(sectionKey);

    if (!isShareMode) {
      return <div className={className}>{children}</div>;
    }

    return (
      <div
        className={`relative cursor-pointer transition-all ${isSelected
          ? "ring-2 ring-[#EB7020] shadow-xl scale-[1.02] bg-[#EB7020]/10"
          : "hover:ring-1 hover:ring-[#EB7020]/50"
          } ${className}`}
        onClick={() => onToggleSection(sectionKey)}
      >
        {/* 选中图标 - 右上角 */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-[#EB7020] rounded-full p-1 shadow-lg z-10">
            <CircleCheckBig className="w-5 h-5 text-white" />
          </div>
        )}
        {children}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="p-8 bg-white/90 shadow-xl rounded-2xl">
        <div className="flex items-center gap-2 mb-3 w-full justify-center pt-8">
          <Sparkles className="w-5 h-5 text-black" />
          <h3 className="text-2xl text-foreground">角色灵魂档案</h3>
        </div>
        {/* <div className="h-[2px] bg-[#EB7020] mb-6" /> */}

        {/* AI 总结 */}
        {ai_extracted.ai_summary && (
          <SelectableWrapper sectionKey="ai_summary" className="mb-6">
            <div className="p-5 rounded-xl bg-gray-200">
              <p className="text-sm text-foreground-700 leading-relaxed"><span className="text-2xl text-[#EB7020]">“</span>{ai_extracted.ai_summary}<span className="text-2xl text-[#EB7020]">”</span></p>
            </div>
          </SelectableWrapper>
        )}

        {/* 关键词 */}
        {ai_extracted.keywords && ai_extracted.keywords.length > 0 && (
          <SelectableWrapper sectionKey="keywords" className="mb-6">
            <div className="p-4 rounded-xl">
              <h4 className="text-2xl text-foreground mb-2 flex items-center justify-center gap-2 text-center">
                <Star className="w-5 h-5 text-black" />
                核心特质
              </h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {ai_extracted.keywords.map((keyword, idx) => (
                  <Badge
                    key={idx}
                    className="px-3 py-1 text-white bg-[#EB7020] min-w-[80px] text-center text-sm"
                  >
                    <span className="w-full text-center">
                      {keyword}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          </SelectableWrapper>
        )}

        {/* 关键事件 */}
        {user_provided.key_events && user_provided.key_events.length > 0 && (
          <SelectableWrapper sectionKey="key_events" className="mb-6">
            <div className="p-4 rounded-xl">
              <h4 className="text-2xl text-foreground mb-3 flex items-center justify-center gap-2 text-center">
                <Target className="w-5 h-5 text-black" />
                人生转折点
              </h4>
              <div className="space-y-3">
                {user_provided.key_events.map((event, idx) => (
                  <motion.div
                    key={idx}
                    initial={!isShareMode ? { opacity: 0, x: -20 } : false}
                    animate={!isShareMode ? { opacity: 1, x: 0 } : false}
                    transition={!isShareMode ? { delay: idx * 0.1 } : undefined}
                    className="p-4 bg-gray-200 rounded-lg hover:shadow-md transition-shadow text-center"
                  >
                    <div className="flex flex-col items-center mb-2">
                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-center">
                        {event.title}
                        {event.age && (
                          <span className="ml-2 text-sm text-purple-600 dark:text-purple-400">
                            ({event.age}岁)
                          </span>
                        )}
                      </h5>
                      {event.emotional_impact && (
                        <Badge
                          variant="outline"
                          className={`text-xs border-[#EB7020]/30 text-[#EB7020]`}
                        >
                          {event.emotional_impact === "profound" && "深刻影响"}
                          {event.emotional_impact === "moderate" && "中等影响"}
                          {event.emotional_impact === "mild" && "轻微影响"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground-600 leading-relaxed text-center">
                      {event.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </SelectableWrapper>
        )}

        {/* 秘密与执念 */}
        {user_provided.secrets_obsessions &&
          user_provided.secrets_obsessions.length > 0 && (
            <SelectableWrapper sectionKey="secrets_obsessions" className="mb-6">
              <div className="p-4 rounded-xl">
                <h4 className="text-2xl text-foreground mb-3 flex items-center justify-center gap-2 text-center">
                  <ShieldAlert className="w-5 h-5 text-black" />
                  秘密与执念
                </h4>
                <div className="space-y-3">
                  {user_provided.secrets_obsessions.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={!isShareMode ? { opacity: 0, scale: 0.95 } : false}
                      animate={!isShareMode ? { opacity: 1, scale: 1 } : false}
                      transition={!isShareMode ? { delay: idx * 0.1 } : undefined}
                      className="p-4 bg-white rounded-lg text-center"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="mt-0.5">{secretTypeIcons[item.type]}</div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground leading-relaxed mb-1 text-center">
                            {item.content}
                          </p>
                          {item.reason && (
                            <p className="text-xs text-foreground-600 italic text-center">
                              原因：{item.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </SelectableWrapper>
          )}

        {/* 人际关系 */}
        {user_provided.relationships &&
          Object.keys(user_provided.relationships).length > 0 && (
            <SelectableWrapper sectionKey="relationships" className="mb-6">
              <div className="p-4 rounded-xl">
                <h4 className="text-2xl text-foreground mb-3 flex items-center justify-center gap-2 text-center">
                  <Users className="w-5 h-5 text-black" />
                  人际关系
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 place-items-center">
                  {Object.entries(user_provided.relationships).map(
                    ([person, relation], idx) => (
                      <motion.div
                        key={idx}
                        initial={!isShareMode ? { opacity: 0, y: 10 } : false}
                        animate={!isShareMode ? { opacity: 1, y: 0 } : false}
                        transition={!isShareMode ? { delay: idx * 0.05 } : undefined}
                        className="p-3 bg-white rounded-lg text-center"
                      >
                        <div className="font-semibold text-sm text-foreground mb-1 text-center">
                          {person}
                        </div>
                        <p className="text-xs text-foreground-600 text-center">
                          {relation}
                        </p>
                      </motion.div>
                    )
                  )}
                </div>
              </div>
            </SelectableWrapper>
          )}

        {/* 特殊习惯 */}
        {user_provided.special_traits &&
          user_provided.special_traits.length > 0 && (
            <SelectableWrapper sectionKey="special_traits" className="mb-6">
              <div className="p-4 rounded-xl">
                <h4 className="text-2xl text-foreground mb-2 text-center">
                  特殊习惯与标志
                </h4>
                <ul className="space-y-1 text-center">
                  {user_provided.special_traits.map((trait, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#EB7020]" />
                      {trait}
                    </li>
                  ))}
                </ul>
              </div>
            </SelectableWrapper>
          )}

        {/* 目标与动机 */}
        {user_provided.goals_motivations && (
          <SelectableWrapper sectionKey="goals_motivations" className="mb-6">
            <div className="p-4 rounded-xl">
              <h4 className="text-2xl text-foreground mb-2 flex items-center justify-center gap-2 text-center">
                <Target className="w-5 h-5 text-black" />
                人生目标
              </h4>
              <p className="text-sm text-foreground-700 leading-relaxed p-4 bg-gray-200 rounded-xl text-center">
                <span className="text-2xl text-[#EB7020]">“</span>
                {user_provided.goals_motivations}
                <span className="text-2xl text-[#EB7020]">”</span>
              </p>
            </div>
          </SelectableWrapper>
        )}

        {/* 说话风格 */}
        {(user_provided.speech_style || user_provided.catchphrase) && (
          <SelectableWrapper sectionKey="speech_style" className="mb-6">
            <div className="p-4 rounded-xl">
              <h4 className="text-2xl text-foreground mb-2 flex items-center justify-center gap-2 text-center">
                <MessageSquare className="w-5 h-5 text-black" />
                语言特点
              </h4>
              {user_provided.speech_style && (
                <p className="text-sm text-foreground-700 leading-relaxed p-4 bg-gray-200 rounded-xl mb-2 text-center">
                  {user_provided.speech_style}
                </p>
              )}
              {user_provided.catchphrase && (
                <p className="text-sm text-[#EB7020] italic font-medium text-center">{user_provided.catchphrase}</p>
              )}
            </div>
          </SelectableWrapper>
        )}

        {/* AI 洞察：性格特质 */}
        {ai_extracted.personality_traits &&
          ai_extracted.personality_traits.length > 0 && (
            <SelectableWrapper sectionKey="personality_traits" className="mb-6">
              <div className="p-4 rounded-xl">
                <h4 className="text-2xl text-foreground mb-3 text-center">AI 深度洞察</h4>
                <div className="space-y-3">
                  {ai_extracted.personality_traits.map((trait, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-gray-200 shadow-sm text-center">
                      <h5 className="font-semibold text-sm text-foreground mb-1">{trait.trait}</h5>
                      <p className="text-sm text-foreground-700 mb-1">{trait.manifestation}</p>
                      {trait.bazi_correspondence && (
                        <p className="text-sm text-foreground-700">八字对应：{trait.bazi_correspondence}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SelectableWrapper>
          )}

        {/* 内心冲突 */}
        {ai_extracted.inner_conflicts &&
          ai_extracted.inner_conflicts.length > 0 && (
            <SelectableWrapper sectionKey="inner_conflicts" className="mb-6">
              <div className="p-4 rounded-xl">
                <h4 className="text-2xl text-foreground mb-2 flex items-center justify-center gap-2 text-center">
                  <img src="/svg/内心冲突.svg" alt="内心冲突" className="w-5 h-5" />
                  内心冲突
                </h4>
                <div className="space-y-2">
                  {ai_extracted.inner_conflicts.map((conflict, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 via-white to-red-500/20 border border-red-300 text-black text-center"
                    >
                      {conflict}
                    </div>
                  ))}
                </div>
              </div>
            </SelectableWrapper>
          )}

        {/* 情感触发点 */}
        {ai_extracted.emotional_triggers &&
          ai_extracted.emotional_triggers.length > 0 && (
            <SelectableWrapper sectionKey="emotional_triggers" className="mb-6">
              <div className="p-4 rounded-xl">
                <h4 className="text-2xl text-foreground mb-2 flex items-center justify-center gap-2 text-center">
                  <img src="/svg/情感触发点.svg" alt="情感触发点" className="w-5 h-5" />
                  情感触发点
                </h4>
                <div className="space-y-2">
                  {ai_extracted.emotional_triggers.map((trigger, idx) => (
                    <div key={idx} className="px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 via-white to-red-500/20 border border-red-300 text-black text-center">{trigger}</div>
                  ))}
                </div>
              </div>
            </SelectableWrapper>
          )}

        {/* 角色扮演指引 */}
        {ai_extracted.roleplay_guidelines && (
          <SelectableWrapper sectionKey="roleplay_guidelines" className="mb-6">
            <div className="p-4 rounded-xl bg-white/80">
              <h4 className="text-2xl text-foreground mb-3 flex items-center justify-center gap-2 text-center">
                <img src="/svg/角色可公开情报.svg" alt="角色可公开情报" className="w-5 h-5" />
                角色可公开情报
              </h4>
              <div className="grid grid-cols-1 place-items-center gap-2">
                {ai_extracted.roleplay_guidelines.do && (
                  <div className="relative p-4 rounded-xl bg-gray-500/20 text-center w-full">
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-full w-auto" fill="none" strokeWidth="2" stroke="url(#guidelinesCheckGradient)">
                        <defs>
                          <linearGradient id="guidelinesCheckGradient" x1="0" y1="1" x2="1" y2="0">
                            <stop offset="0%" stopColor="#9CA3AF00" />
                            <stop offset="20%" stopColor="#9CA3AF00" />
                            <stop offset="100%" stopColor="#9CA3AF" />
                          </linearGradient>
                        </defs>
                        <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                        <path d="m9 11 3 3L22 4"></path>
                      </svg>
                    </div>
                    <div className="relative z-10">
                      <h5 className="text-md font-semibold text-foreground mb-2">特点</h5>
                      <ul className="space-y-1 text-center">
                        {ai_extracted.roleplay_guidelines.do.map((item, idx) => (
                          <li key={idx} className="text-md text-foreground-700 flex items-center justify-center gap-1">
                            <span className="text-[#EB7020] mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {ai_extracted.roleplay_guidelines.dont && (
                  <div className="relative p-4 rounded-xl bg-red-500/20 border border-rose-200 text-center w-full">
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-0 flex items-center justify-center">
                      <Ban className="h-full w-auto text-gray-600/50 scale-x-[-1]" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 z-0 rounded-xl bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,1)_15%,rgba(255,255,255,1)_85%,rgba(255,255,255,0)_100%)]" />
                    <div className="relative z-10">
                      <h5 className="text-md font-semibold text-black mb-2">不会做的事</h5>
                      <ul className="space-y-1 text-center">
                        {ai_extracted.roleplay_guidelines.dont.map((item, idx) => (
                          <li key={idx} className="text-md text-black flex items-center justify-center gap-1">
                            <span className="mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SelectableWrapper>
        )}

        {lastUpdated && (() => {
          const d = new Date(lastUpdated);
          const pad = (n: number) => String(n).padStart(2, "0");
          const formatted = isNaN(d.getTime())
            ? lastUpdated
            : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return (
            <div className="mb-4 flex items-center gap-2 text-md text-foreground-500 w-full text-center items-center justify-center text-gray-500">
              <Clock className="w-auto h-full text-gray-500" />
              <div className="text-left">
                <p>{t("characterInfo.lastUpdated")}</p>
                <p>{formatted}</p>
              </div>
            </div>
          );
        })()}
      </Card>
    </motion.div>
  );
};

export default CharacterStoryCard;
