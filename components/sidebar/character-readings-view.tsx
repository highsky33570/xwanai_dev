import React, { FC, useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Avatar,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  Search,
  ArrowUp,
  Heart,
  Lock,
  Sparkles,
  Zap,
  Briefcase,
  Landmark,
  Coins,
  Brain,
  Gem,
  FileText,
  AlertCircle,
} from "lucide-react";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import { Character, ActionGroupItem } from "./types";
import { getStarSign, formatBirthday } from "./utils";
import { characterAPI } from "@/lib/api/client";
import { toast } from "sonner";
import { useCharacterBySession } from "@/hooks/use-data-queries";
import ReportModal from "./report-modal";

interface CharacterReadingsViewProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sessionId: string | null; // 🎯 改为传入 sessionId 而不是 currentCharacter
  selectedAction: string | null;
  onActionClick: (actionId: string, label: string) => void;
  onSynastrySwitchMode: () => void;
  t: (key: string) => string;
}

const CharacterReadingsView: FC<CharacterReadingsViewProps> = ({
  searchQuery,
  onSearchChange,
  sessionId,
  selectedAction,
  onActionClick,
  onSynastrySwitchMode,
  t,
}) => {
  // 🎯 直接通过 React Query 获取 session 关联的 character
  const {
    data: currentCharacter,
    isLoading: isLoadingCharacter,
    error: characterError,
  } = useCharacterBySession(sessionId || undefined);

  // 🎯 直接从 React Query 返回的 character 中读取 reports
  const reports = currentCharacter?.reports || null;
  const isReportReady = currentCharacter?.is_report_ready ?? null; // 🎯 使用新字段
  const isLoadingReports = isLoadingCharacter;

  const [isGeneratingReports, setIsGeneratingReports] = useState(false);

  // 🎯 报告弹窗状态
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{
    key: string;
    title: string;
    content: string;
  } | null>(null);

  // 🎯 处理报告点击
  const handleReportClick = (reportKey: string, reportTitle: string) => {
    if (!reports || !reports[reportKey]) {
      toast.error("报告内容不可用");
      return;
    }

    setSelectedReport({
      key: reportKey,
      title: reportTitle,
      content: reports[reportKey],
    });
    setIsReportModalOpen(true);
  };

  // Handle generate reports
  const handleGenerateReports = async () => {
    if (!currentCharacter?.id) return;

    setIsGeneratingReports(true);
    try {
      await characterAPI.generateReports(currentCharacter.id);
      // 🎯 React Query 会自动重新获取数据
      toast.success(t("sidebar.reportsGeneratedSuccess"));
    } catch (error: any) {
      console.error("Failed to generate reports:", error);
      toast.error(t("sidebar.reportsGenerationFailed"));
    } finally {
      setIsGeneratingReports(false);
    }
  };

  // 🎯 根据角色的 category 动态获取报告配置
  const reportConfig = React.useMemo(() => {
    if (!currentCharacter?.category) {
      // 兼容旧数据：如果没有 category，使用默认配置
      return {
        sections: [
          { key: "basic", name: "核心要素档案", order: 1, icon: FileText },
          { key: "personal", name: "性格深度剖析", order: 2, icon: Brain },
          { key: "luck", name: "多元个性棱镜", order: 3, icon: Sparkles },
          { key: "achievement", name: "人生成就考据", order: 4, icon: Gem },
        ],
      };
    }

    // 动态配置映射
    const REPORT_CONFIGS: Record<
      string,
      {
        sections: Array<{
          key: string;
          name: string;
          order: number;
          icon: any;
        }>;
      }
    > = {
      create_character_real_custom: {
        sections: [
          { key: "basic", name: "核心要素档案", order: 1, icon: FileText },
          { key: "personal", name: "性格深度剖析", order: 2, icon: Brain },
          { key: "luck", name: "多元个性棱镜", order: 3, icon: Sparkles },
          { key: "achievement", name: "人生成就考据", order: 4, icon: Gem },
        ],
      },
      personal: {
        sections: [
          { key: "basic", name: "基本信息", order: 0, icon: FileText },
          { key: "personality", name: "个性报告", order: 1, icon: Brain },
          { key: "fortune", name: "命运报告", order: 2, icon: Sparkles },
          { key: "career", name: "职业报告", order: 3, icon: FileText },
          { key: "wealth", name: "财富报告", order: 4, icon: FileText },
          { key: "relationship", name: "亲密关系", order: 5, icon: FileText },
          { key: "fengshui", name: "风水报告", order: 6, icon: FileText },
          {
            key: "mbti_zodiac",
            name: "星座生肖MBTI",
            order: 7,
            icon: FileText,
          },
        ],
      },
    };

    return (
      REPORT_CONFIGS[currentCharacter.category] ||
      REPORT_CONFIGS["create_character_real_custom"]
    );
  }, [currentCharacter?.category]);

  // Build action group items based on available reports and config
  const actionGroupItems: ActionGroupItem[] = React.useMemo(() => {
    if (!reports) return [];

    // 只显示已生成的报告，按配置顺序排列
    return reportConfig.sections
      .filter((section) => reports[section.key]) // 只显示有内容的报告
      .map((section) => ({
        id: section.key,
        icon: section.icon,
        label: section.name,
        category: "Character",
      }));
  }, [reports, reportConfig]);

  return (
    <div className="flex flex-col h-full bg-content1">
      {/* Enhanced Header */}
      <div className="relative p-4 border-b border-foreground/10 bg-content1/95 backdrop-blur-sm">
        <div className="absolute inset-0 bg-content1/50" />

        <div className="relative space-y-4">
          <div className="flex flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search readings..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                startContent={<Search className="w-4 h-4 text-primary/70" />}
                className="flex-1"
                classNames={{
                  input:
                    "bg-content2/80 border-foreground/10 text-foreground placeholder:text-foreground-400",
                  inputWrapper:
                    "bg-content2/80 border-foreground/10 hover:border-primary/30 focus-within:border-primary/60 backdrop-blur-sm transition-all duration-200",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Character Card (with fallback) */}
          <Card className="w-full bg-content2 border border-foreground/10 shadow-lg">
            <CardBody className="p-5">
              {/* Character Header */}
              <div className="flex flex-row items-center gap-3 p-4 rounded-xl bg-content2 mb-4 w-full">
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={getAvatarPublicUrl(
                      currentCharacter?.avatar_id,
                      currentCharacter?.auth_id
                    )}
                    name={currentCharacter?.name || "Unknown"}
                    size="md"
                    className="ring-3 ring-primary/30 shadow-lg"
                    fallback={
                      <div className="w-full h-full bg-content2 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary" />
                      </div>
                    }
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-content1 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-primary mb-1 truncate">
                    {currentCharacter?.name || "Unknown"}
                  </h3>
                  <div className="text-xs text-foreground/70 truncate">
                    {currentCharacter?.birth_time ||
                    currentCharacter?.birthday_utc8
                      ? formatBirthday(
                          currentCharacter.birth_time ||
                            currentCharacter.birthday_utc8,
                          t
                        )
                      : "Born YY-MM-DD"}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Chip
                    size="sm"
                    variant="flat"
                    className="bg-content2 text-primary border border-primary/30 font-semibold"
                  >
                    {getStarSign(
                      currentCharacter?.birth_time ||
                        currentCharacter?.birthday_utc8 ||
                        null,
                      t
                    )}
                  </Chip>
                </div>
              </div>

              {/* Character Section Header */}
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h4 className="text-lg font-bold text-primary">Character</h4>
              </div>

              {/* Loading State */}
              {isLoadingReports && (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" color="primary" />
                  <span className="ml-3 text-foreground/70">
                    {t("sidebar.loadingReports")}
                  </span>
                </div>
              )}

              {/* No Reports State */}
              {!isLoadingReports && !reports && (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <AlertCircle className="w-12 h-12 text-warning mb-3" />
                  <h5 className="text-lg font-semibold text-foreground mb-2">
                    {t("sidebar.noReportsYet")}
                  </h5>
                  <p className="text-sm text-foreground/60 mb-4">
                    {t("sidebar.reportsNotGenerated")}
                  </p>
                  <p className="text-sm text-foreground/60 mb-4">
                    {t("sidebar.generateReportsPrompt")}
                  </p>
                  <Button
                    color="primary"
                    variant="shadow"
                    onPress={handleGenerateReports}
                    isLoading={isGeneratingReports}
                    disabled={isGeneratingReports}
                    startContent={
                      !isGeneratingReports && <FileText className="w-4 h-4" />
                    }
                  >
                    {isGeneratingReports
                      ? t("sidebar.generatingReports")
                      : t("sidebar.generateReports")}
                  </Button>
                </div>
              )}

              {/* Reading Categories (when reports exist) */}
              {!isLoadingReports && reports && actionGroupItems.length > 0 && (
                <div className="space-y-2">
                  {actionGroupItems.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = selectedAction === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant="flat"
                        className={`
                          w-full justify-start p-4 h-auto transition-all duration-300
                          ${
                            isSelected
                              ? "bg-primary/15 border border-primary/40 shadow-lg shadow-primary/20"
                              : "bg-content1/40 text-primary hover:bg-primary/10"
                          }
                        `}
                        onPress={() => handleReportClick(item.id, item.label)}
                      >
                        <div
                          className={`
                          p-3 rounded-lg mr-3 transition-all duration-300
                          ${
                            isSelected
                              ? "bg-primary text-white shadow-lg"
                              : "bg-primary/20 text-primary"
                          }
                        `}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <span
                            className={`font-medium transition-colors duration-200 ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Enhanced Agent Card */}
          <Card className="bg-content2 border border-foreground/10 shadow-md">
            <CardBody className="p-5">
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-foreground">
                      Agent Mode
                    </span>
                    <p className="text-xs text-foreground/60">
                      Premium Feature
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-warning" />
                  <Chip size="sm" color="warning" variant="flat">
                    Locked
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Enhanced Action Group */}
      <div className="border-t border-foreground/10 p-4 bg-content2">
        <div className="space-y-3">
          <Button
            className="w-full bg-primary text-white border border-secondary/30 hover:shadow-lg transition-all duration-300"
            variant="bordered"
            onPress={onSynastrySwitchMode}
          >
            Create Synastry Reading
          </Button>
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="flat"
              className="bg-pink-500/20 text-pink-600 hover:bg-pink-500/30 transition-all duration-300"
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              className="flex-1 bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              startContent={<ArrowUp className="w-4 h-4" />}
            >
              Upgrade Account
            </Button>
          </div>
        </div>
      </div>

      {/* 🎯 报告弹窗 */}
      {selectedReport && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedReport(null);
          }}
          reportTitle={selectedReport.title}
          reportContent={selectedReport.content}
          reportKey={selectedReport.key}
        />
      )}
    </div>
  );
};

export default CharacterReadingsView;
