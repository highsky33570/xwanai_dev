"use client";

import { memo, useState } from "react";
import { Card, CardBody, Divider, Chip, Button } from "@heroui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

type Paipan = {
  八字?: string;
  农历?: string;
  季节?: string;
  性别?: string;
  日主?: string;
  生肖?: string;
  空亡?: Record<string, string>;
  纳音?: Record<string, string[]>;
  出生地点?: string;
  出生年份?: number;
  八字各柱信息?: Record<
    string,
    {
      天干?: string;
      地支?: string;
      地支十神?: string[] | Record<string, string>;
      地支藏干?: string[] | Record<string, string>;
      天干十神?: string;
    }
  >;
  ["公历（真太阳时）"]?: string;
};

type PaipanCardProps = {
  paipan: Paipan;
  variant?: "default" | "flat";
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
};

function PaipanCard({
  paipan,
  variant = "default",
  defaultExpanded = false,
  onToggle,
}: PaipanCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!paipan) return null;

  const pillars = paipan.八字各柱信息 || {};

  // Normalize pillar keys and accessors (payload may use 年/月/日/时 or 年柱/月柱/日柱/时柱)
  type PillarInfo = {
    label: "Year" | "Month" | "Day" | "Hour";
    key: "年" | "月" | "日" | "时";
    data: {
      天干?: string;
      地支?: string;
      天干十神?: string;
      地支十神?: string[] | Record<string, string>;
      地支藏干?: string[] | Record<string, string>;
    };
  };
  const resolvePillar = (primary: string, alternate: string) =>
    (pillars as any)[primary] || (pillars as any)[alternate] || null;
  const normalizedPillars: PillarInfo[] = [
    { label: "Year", key: "年", data: resolvePillar("年", "年柱") || {} },
    { label: "Month", key: "月", data: resolvePillar("月", "月柱") || {} },
    { label: "Day", key: "日", data: resolvePillar("日", "日柱") || {} },
    { label: "Hour", key: "时", data: resolvePillar("时", "时柱") || {} },
  ];

  // Element mappings for stems and branches
  const stemToElement: Record<
    string,
    "Wood" | "Fire" | "Earth" | "Metal" | "Water" | ""
  > = {
    甲: "Wood",
    乙: "Wood",
    丙: "Fire",
    丁: "Fire",
    戊: "Earth",
    己: "Earth",
    庚: "Metal",
    辛: "Metal",
    壬: "Water",
    癸: "Water",
  };
  const branchToElement: Record<
    string,
    "Wood" | "Fire" | "Earth" | "Metal" | "Water" | ""
  > = {
    子: "Water",
    丑: "Earth",
    寅: "Wood",
    卯: "Wood",
    辰: "Earth",
    巳: "Fire",
    午: "Fire",
    未: "Earth",
    申: "Metal",
    酉: "Metal",
    戌: "Earth",
    亥: "Water",
  };
  // Pinyin mappings for display (Latin text)
  const stemPinyin: Record<string, string> = {
    甲: "Jia",
    乙: "Yi",
    丙: "Bing",
    丁: "Ding",
    戊: "Wu",
    己: "Ji",
    庚: "Geng",
    辛: "Xin",
    壬: "Ren",
    癸: "Gui",
  };
  const branchPinyin: Record<string, string> = {
    子: "Zi",
    丑: "Chou",
    寅: "Yin",
    卯: "Mao",
    辰: "Chen",
    巳: "Si",
    午: "Wu",
    未: "Wei",
    申: "Shen",
    酉: "You",
    戌: "Xu",
    亥: "Hai",
  };

  // Shishen -> role mapping (best-effort)
  const tenGodToRole: Record<string, string> = {
    日主: "the Day-Master",
    正印: "the Scholar",
    偏印: "the Mystic",
    正财: "the Businessman",
    偏财: "the Speculator",
    伤官: "the Talent",
    食神: "the Artist",
    正官: "the Official",
    七杀: "the Enforcer",
    比肩: "the Ally",
    劫财: "the Rival",
  };
  const resolveRole = (
    tg?: string,
    dgList?: string[] | Record<string, string>
  ) => {
    if (tg && tenGodToRole[tg]) return tenGodToRole[tg];
    // Handle both array and object formats
    let first = "";
    if (Array.isArray(dgList)) {
      first = dgList[0] || "";
    } else if (dgList && typeof dgList === "object") {
      // For object format, use 本气 (main qi) if available
      first = dgList["本气"] || Object.values(dgList)[0] || "";
    }
    return tenGodToRole[first] || "";
  };

  // Helper function to get background icon for a character
  const getCharacterIcon = (char: string) => {
    if (!char) return null;
    return `/signs_icon/${char}.svg`;
  };

  // Helper function to get ganzhi character SVG for paipan display
  const getGanzhiIcon = (char: string) => {
    if (!char) return null;
    // Directly use the Chinese character as filename
    return `/paipan/${char}.svg`;
  };

  // Helper function to get element color
  const getElementColor = (element: string) => {
    const elementColors: Record<string, string> = {
      Wood: "text-green-400",
      Fire: "text-red-400",
      Earth: "text-yellow-400",
      Metal: "text-gray-400",
      Water: "text-blue-400",
    };
    return elementColors[element] || "text-foreground";
  };

  // Helper function to get element from stem/branch description
  const getElementFromDescription = (description: string) => {
    if (description?.includes("Wood")) return "Wood";
    if (description?.includes("Fire")) return "Fire";
    if (description?.includes("Earth")) return "Earth";
    if (description?.includes("Metal")) return "Metal";
    if (description?.includes("Water")) return "Water";
    return "";
  };

  // Toggle handler
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  // Card headings
  const headingTop = "HEAVENLY STEMS";
  const headingBottom = "EARTHLY BRANCHES";

  // Helper to render label with first letter in primary
  const renderSectionLabel = (word: string) => {
    const first = word.slice(0, 1);
    const rest = word.slice(1);
    return (
      <span>
        <span className="text-primary">{first}</span>
        <span className="text-foreground/90">{rest}</span>
      </span>
    );
  };

  // Render simplified view matching the provided image
  const renderSimplifiedView = () => {
    const containerClass =
      variant === "flat"
        ? "bg-transparent border-none shadow-none cursor-pointer w-full"
        : "bg-content2 border border-foreground/10 shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.01]";
    const minWidthClasses =
      variant === "flat" ? "" : "min-w-[80vw] md:min-w-[50vw]";

    return (
      <Card
        className={`${containerClass} ${minWidthClasses}`}
        isPressable
        onPress={handleToggle}
      >
        <CardBody className="p-6">
          {/* Column labels */}
          <div className="grid grid-cols-4 gap-6 mb-2">
            {normalizedPillars.map((p) => (
              <div
                key={`label-top-${p.key}`}
                className="text-center text-[18px] md:text-[20px] font-semibold"
              >
                {renderSectionLabel(p.label)}
              </div>
            ))}
          </div>
          {/* Top heading */}
          <div className="mb-4 text-center text-[10px] tracking-[0.6em] text-foreground/40 select-none">
            {headingTop}
          </div>

          {/* Heavenly stems row */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {normalizedPillars.map((pillar) => {
              const heavenStem = pillar.data?.天干 || "";
              const stemElement = stemToElement[heavenStem] || "";
              const ganzhiIcon = getGanzhiIcon(heavenStem);
              return (
                <div
                  key={`stem-${pillar.key}`}
                  className="flex flex-col items-center"
                >
                  <div className="text-[13px] font-semibold text-amber-300/80 mb-2 uppercase tracking-wider">
                    {pillar.label}
                  </div>
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border border-foreground/15 bg-content1/20 shadow-inner flex items-center justify-center ring-1 ring-primary/20">
                    {ganzhiIcon && (
                      <Image
                        src={ganzhiIcon}
                        alt={heavenStem}
                        width={112}
                        height={112}
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div
                    className={`mt-3 text-base font-semibold ${getElementColor(
                      stemElement
                    )}`}
                  >
                    {stemElement}
                  </div>
                  <div className="text-xs text-foreground/70 mt-1">
                    {resolveRole(pillar.data?.天干十神, pillar.data?.地支十神)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom heading between rows */}
          <div className="mb-4 text-center text-[10px] tracking-[0.6em] text-foreground/40 select-none">
            {headingBottom}
          </div>

          {/* Earthly branches row */}
          <div className="grid grid-cols-4 gap-6">
            {normalizedPillars.map((pillar) => {
              const earthBranch = pillar.data?.地支 || "";
              const branchElement = branchToElement[earthBranch] || "";
              const ganzhiIcon = getGanzhiIcon(earthBranch);
              return (
                <div
                  key={`branch-${pillar.key}`}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
                    {/* Diamond background */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 md:w-28 md:h-28 rotate-45 rounded-lg bg-content1/20 border border-foreground/15 shadow-inner" />
                    </div>
                    {ganzhiIcon && (
                      <Image
                        src={ganzhiIcon}
                        alt={earthBranch}
                        width={112}
                        height={112}
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div
                    className={`mt-3 text-base font-semibold ${getElementColor(
                      branchElement
                    )}`}
                  >
                    {branchElement}
                  </div>
                  <div className="text-xs text-foreground/70 mt-1">
                    {resolveRole(undefined, pillar.data?.地支十神)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom labels removed per spec (only top labels remain) */}

          {/* Click hint */}
          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-2 text-xs text-foreground/50 bg-foreground/5 px-3 py-1.5 rounded-full">
              <ChevronDown className="w-3 h-3" />
              Click to view details
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  // Render detailed view (original layout)
  const renderDetailedView = () => {
    const containerClass =
      variant === "flat"
        ? "bg-transparent border-none shadow-none"
        : "bg-content2/80 border border-foreground/10 shadow-lg rounded-2xl";
    const minWidthClasses =
      variant === "flat" ? "" : "min-w-[80vw] md:min-w-[50vw]";

    const innerPillarClass =
      variant === "flat"
        ? "rounded-lg bg-content2/80 p-3"
        : "rounded-lg border border-foreground/10 bg-content1/60 p-3";

    const chipClass =
      variant === "flat"
        ? "bg-content2/60"
        : "bg-content1/80 border border-foreground/10";

    return (
      <Card className={`${containerClass} ${minWidthClasses}`}>
        <CardBody className="space-y-5 p-6">
          {/* Collapse Button */}
          <div className="flex items-center justify-between pb-2 border-b border-foreground/5">
            <div className="text-base font-bold text-foreground">排盘信息</div>
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={handleToggle}
              className="text-foreground/60 hover:text-foreground"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>

          {/* 八字核心信息 */}
          <div>
            {paipan.八字 && (
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl p-4 border border-primary/10">
                <div className="text-xs text-foreground/50 mb-2 tracking-wide">
                  八字
                </div>
                <div className="text-lg font-bold text-foreground tracking-widest">
                  {paipan.八字}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paipan["公历（真太阳时）"] && (
                <div className="bg-content1/40 rounded-lg p-3 border border-foreground/10">
                  <div className="text-[10px] text-foreground/50 mb-1.5">
                    公历（真太阳时）
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {paipan["公历（真太阳时）"]}
                  </div>
                </div>
              )}
              {paipan.农历 && (
                <div className="bg-content1/40 rounded-lg p-3 border border-foreground/10">
                  <div className="text-[10px] text-foreground/50 mb-1.5">
                    农历
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {paipan.农历}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Divider className="my-1" />

          {/* 基本信息 */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {paipan.日主 && (
                <div className="flex items-center gap-2">
                  <span className="text-foreground/50 text-xs">日主</span>
                  <span className="text-foreground font-medium">
                    {paipan.日主}
                  </span>
                </div>
              )}
              {paipan.生肖 && (
                <div className="flex items-center gap-2">
                  <span className="text-foreground/50 text-xs">生肖</span>
                  <span className="text-foreground font-medium">
                    {paipan.生肖}
                  </span>
                </div>
              )}
              {paipan.季节 && (
                <div className="flex items-center gap-2">
                  <span className="text-foreground/50 text-xs">季节</span>
                  <span className="text-foreground font-medium">
                    {paipan.季节}
                  </span>
                </div>
              )}
              {paipan.性别 && (
                <div className="flex items-center gap-2">
                  <span className="text-foreground/50 text-xs">性别</span>
                  <span className="text-foreground font-medium">
                    {paipan.性别}
                  </span>
                </div>
              )}
            </div>

            {paipan.出生地点 && (
              <div className="flex items-center gap-2 text-sm pt-1">
                <span className="text-foreground/50 text-xs">出生地点</span>
                <span className="text-foreground font-medium">
                  {paipan.出生地点}
                </span>
              </div>
            )}
            {typeof paipan.出生年份 === "number" && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground/50 text-xs">出生年份</span>
                <span className="text-foreground font-medium">
                  {paipan.出生年份}
                </span>
              </div>
            )}
          </div>

          {paipan.纳音 && (
            <div className="space-y-2.5">
              <div className="text-sm font-semibold text-foreground">纳音</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(paipan.纳音).map(([key, arr]) => (
                  <Chip
                    key={key}
                    size="sm"
                    variant="flat"
                    className={`${chipClass} rounded-full`}
                  >
                    {key}: {arr.join("、")}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {paipan.空亡 && (
            <div className="space-y-2.5">
              <div className="text-sm font-semibold text-foreground">空亡</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(paipan.空亡).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-foreground/50 text-xs">{k}</span>
                    <span className="text-foreground font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(pillars).length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-foreground">
                八字各柱信息
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(pillars).map(([pillarName, info]) => (
                  <div key={pillarName} className={innerPillarClass}>
                    {/* 柱名标题 */}
                    <div className="text-sm font-bold mb-3 text-foreground border-b border-foreground/10 pb-2">
                      {pillarName}
                    </div>

                    {/* 干支信息 */}
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-content1/30 rounded-md p-2">
                          <div className="text-[10px] text-foreground/50 mb-1">
                            天干
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {info.天干 || "-"}
                          </div>
                        </div>
                        <div className="bg-content1/30 rounded-md p-2">
                          <div className="text-[10px] text-foreground/50 mb-1">
                            地支
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {info.地支 || "-"}
                          </div>
                        </div>
                      </div>

                      {/* 主星（天干十神） */}
                      {info.天干十神 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-foreground/60 min-w-[60px]">
                            主星
                          </span>
                          <Chip
                            size="sm"
                            variant="flat"
                            className="bg-primary/10 text-primary"
                          >
                            {info.天干十神}
                          </Chip>
                        </div>
                      )}

                      {/* 副星（地支十神） */}
                      {info.地支十神 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-foreground/60 min-w-[60px]">
                            副星
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(info.地支十神)
                              ? info.地支十神.map((star, idx) => (
                                  <Chip
                                    key={idx}
                                    size="sm"
                                    variant="flat"
                                    className="bg-success/10 text-success"
                                  >
                                    {star}
                                  </Chip>
                                ))
                              : Object.entries(info.地支十神).map(
                                  ([key, value]) => (
                                    <Chip
                                      key={key}
                                      size="sm"
                                      variant="flat"
                                      className="bg-success/10 text-success"
                                    >
                                      {key}: {value}
                                    </Chip>
                                  )
                                )}
                          </div>
                        </div>
                      )}

                      {/* 藏干信息 */}
                      {info.地支藏干 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-foreground/60 min-w-[60px]">
                            地支藏干
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(info.地支藏干)
                              ? info.地支藏干.map((gan, idx) => (
                                  <Chip
                                    key={idx}
                                    size="sm"
                                    variant="flat"
                                    className="bg-secondary/10"
                                  >
                                    {gan}
                                  </Chip>
                                ))
                              : Object.entries(info.地支藏干).map(
                                  ([key, value]) => (
                                    <Chip
                                      key={key}
                                      size="sm"
                                      variant="flat"
                                      className="bg-secondary/10"
                                    >
                                      {key}: {value}
                                    </Chip>
                                  )
                                )}
                          </div>
                        </div>
                      )}

                      {/* 五行和阴阳 */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {info.五行 && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-foreground/50">五行</span>
                            <span className="text-foreground font-medium">
                              {info.五行}
                            </span>
                          </div>
                        )}
                        {info.阴阳 && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-foreground/50">阴阳</span>
                            <span className="text-foreground font-medium">
                              {info.阴阳}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  return isExpanded ? renderDetailedView() : renderSimplifiedView();
}

export default memo(PaipanCard);
