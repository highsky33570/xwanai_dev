"use client";

import { type FC, useEffect, useState, useRef, useMemo } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PaipanCard from "@/components/chat/paipan-card";
import CharacterStoryCard from "@/components/chat/character-story-card";
import {
  ExternalLink,
  Search,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  List,
  Info,
  Globe,
} from "lucide-react";

// CSS 动画样式定义
const cursorStyle = `
  .cursor-blink {
    animation: cursor-blink 1s infinite;
  }
  @keyframes cursor-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;

// 确保样式被添加到 document head
if (
  typeof document !== "undefined" &&
  !document.getElementById("cursor-style-markdown")
) {
  const style = document.createElement("style");
  style.id = "cursor-style-markdown";
  style.textContent = cursorStyle;
  document.head.appendChild(style);
}

interface MarkdownWithSourcesProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
  isUserMessage?: boolean; // 🎨 是否为用户消息
}

// 不需要预处理，直接让react-markdown处理代码块

// Paipan渲染组件 - 处理JSON格式的八字排盘数据
const PaipanRenderer: FC<{
  jsonContent: string;
  isStreaming: boolean;
  isUserMessage?: boolean; // 🎨 是否为用户消息
}> = ({ jsonContent, isStreaming, isUserMessage = false }) => {
  const [parsedPaipan, setParsedPaipan] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedContent = jsonContent.trim();
    
    if (!trimmedContent) {
      return;
    }

    // 🎯 流式传输时，先检查内容是否看起来像完整的 JSON
    if (isStreaming) {
      // 检查是否以 { 或 [ 开头，并且以 } 或 ] 结尾
      const startsValid = trimmedContent.startsWith('{') || trimmedContent.startsWith('[');
      const endsValid = trimmedContent.endsWith('}') || trimmedContent.endsWith(']');
      
      // 如果看起来不完整，直接显示 loading，不尝试解析
      if (!startsValid || !endsValid) {
        setParsedPaipan(null);
        setParseError(null);
        return;
      }
    }

    try {
      // 尝试解析JSON
      const paipanData = JSON.parse(trimmedContent);
      setParsedPaipan(paipanData);
      setParseError(null);
    } catch (error) {
      // 🎯 流式传输时预期会失败，不打印错误
      // 只有在流式传输完成后仍然无法解析时才打印错误
      if (!isStreaming) {
        console.error("Failed to parse vis-paipan JSON:", error);
        console.error("Content:", trimmedContent.substring(0, 200));
      }
      setParseError("Invalid JSON format");
      // 如果JSON解析失败，在流式传输时显示loading
      if (isStreaming) {
        setParsedPaipan(null);
      }
    }
  }, [jsonContent, isStreaming]);

  // 如果正在流式传输且没有解析到内容，显示loading
  if (isStreaming && !parsedPaipan) {
    return (
      <Card className="mb-4 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
              正在生成八字排盘...
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
            </div>
            <span>计算命盘中</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!parsedPaipan) return null;

  // 如果有解析错误，显示错误信息
  if (parseError) {
    return (
      <Card className="mb-4 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-red-600" />
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">
              排盘解析错误
            </CardTitle>
          </div>
          <p className="text-xs text-red-600">{parseError}</p>
        </CardHeader>
      </Card>
    );
  }

  // 转换数据格式以适应PaipanCard组件
  const convertToPaipanFormat = (data: any) => {
    if (!data.baziChart || !data.analysis) return null;

    const { baziChart, analysis, metadata } = data;

    // 构建八字各柱信息（包含 metadata）
    const pillarsInfo: Record<string, any> = {};

    // 辅助函数：格式化阴阳显示
    const formatYinYang = (yinyang: any) => {
      if (!yinyang) return undefined;

      // 如果是对象（包含天干和地支），格式化为字符串
      if (typeof yinyang === "object") {
        const tianGan = yinyang.天干 || "";
        const diZhi = yinyang.地支 || "";
        return `${tianGan} ${diZhi}`;
      }

      // 如果是字符串，处理 YINYIN/YANGYANG 等格式
      if (typeof yinyang === "string") {
        return yinyang
          .replace(/YIN/g, "阴")
          .replace(/YANG/g, "阳")
          .split("")
          .join(" ");
      }

      return undefined;
    };

    // 辅助函数：从对象中提取值为数组（用于地支十神和地支藏干）
    const extractValuesAsArray = (obj: any) => {
      if (!obj) return undefined;
      if (Array.isArray(obj)) return obj;
      if (typeof obj === "object") {
        return Object.values(obj);
      }
      return undefined;
    };

    // 辅助函数：从地支获取对应的metadata（处理"未"/"年支"等不同键名）
    const getZhiMetadata = (
      zhi: string,
      metadataObj: any,
      pillarKey: string
    ) => {
      if (!metadataObj) return undefined;
      // 优先使用地支名称（如"未"），其次使用柱名称（如"年支"）
      return metadataObj[zhi] || metadataObj[pillarKey];
    };

    if (baziChart.yearPillar) {
      const diZhi = baziChart.yearPillar[1];
      const tianGanShishen =
        metadata?.十神?.年干 ||
        metadata?.十神?.年柱?.天干 ||
        metadata?.十神?.年柱;
      const diZhiShishen =
        metadata?.地支十神?.年支 ||
        getZhiMetadata(diZhi, metadata?.地支十神, "年支");

      pillarsInfo["年"] = {
        天干: baziChart.yearPillar[0],
        地支: diZhi,
        天干十神: tianGanShishen,
        地支十神:
          typeof diZhiShishen === "string"
            ? diZhiShishen.split("/").filter((s) => s && s !== "无")
            : extractValuesAsArray(diZhiShishen),
        地支藏干: extractValuesAsArray(
          metadata?.藏干?.年柱?.地支藏干 ||
            metadata?.藏干?.年支 ||
            getZhiMetadata(diZhi, metadata?.藏干, "年支")
        ),
        五行:
          metadata?.五行?.年柱?.天干 && metadata?.五行?.年柱?.地支
            ? `${metadata.五行.年柱.天干}${metadata.五行.年柱.地支}`
            : metadata?.五行?.年柱,
        阴阳: formatYinYang(metadata?.阴阳?.年柱),
      };
    }

    if (baziChart.monthPillar) {
      const diZhi = baziChart.monthPillar[1];
      const tianGanShishen =
        metadata?.十神?.月干 ||
        metadata?.十神?.月柱?.天干 ||
        metadata?.十神?.月柱;
      const diZhiShishen =
        metadata?.地支十神?.月支 ||
        getZhiMetadata(diZhi, metadata?.地支十神, "月支");

      pillarsInfo["月"] = {
        天干: baziChart.monthPillar[0],
        地支: diZhi,
        天干十神: tianGanShishen,
        地支十神:
          typeof diZhiShishen === "string"
            ? diZhiShishen.split("/").filter((s) => s && s !== "无")
            : extractValuesAsArray(diZhiShishen),
        地支藏干: extractValuesAsArray(
          metadata?.藏干?.月柱?.地支藏干 ||
            metadata?.藏干?.月支 ||
            getZhiMetadata(diZhi, metadata?.藏干, "月支")
        ),
        五行:
          metadata?.五行?.月柱?.天干 && metadata?.五行?.月柱?.地支
            ? `${metadata.五行.月柱.天干}${metadata.五行.月柱.地支}`
            : metadata?.五行?.月柱,
        阴阳: formatYinYang(metadata?.阴阳?.月柱),
      };
    }

    if (baziChart.dayPillar) {
      const diZhi = baziChart.dayPillar[1];
      const tianGanShishen =
        metadata?.十神?.日干 ||
        metadata?.十神?.日柱?.天干 ||
        metadata?.十神?.日柱;
      const diZhiShishen =
        metadata?.地支十神?.日支 ||
        getZhiMetadata(diZhi, metadata?.地支十神, "日支");

      pillarsInfo["日"] = {
        天干: baziChart.dayPillar[0],
        地支: diZhi,
        天干十神: tianGanShishen,
        地支十神:
          typeof diZhiShishen === "string"
            ? diZhiShishen.split("/").filter((s) => s && s !== "无")
            : extractValuesAsArray(diZhiShishen),
        地支藏干: extractValuesAsArray(
          metadata?.藏干?.日柱?.地支藏干 ||
            metadata?.藏干?.日支 ||
            getZhiMetadata(diZhi, metadata?.藏干, "日支")
        ),
        五行:
          metadata?.五行?.日柱?.天干 && metadata?.五行?.日柱?.地支
            ? `${metadata.五行.日柱.天干}${metadata.五行.日柱.地支}`
            : metadata?.五行?.日柱,
        阴阳: formatYinYang(metadata?.阴阳?.日柱),
      };
    }

    if (baziChart.hourPillar) {
      const diZhi = baziChart.hourPillar[1];
      const tianGanShishen =
        metadata?.十神?.时干 ||
        metadata?.十神?.时柱?.天干 ||
        metadata?.十神?.时柱;
      const diZhiShishen =
        metadata?.地支十神?.时支 ||
        getZhiMetadata(diZhi, metadata?.地支十神, "时支");

      pillarsInfo["时"] = {
        天干: baziChart.hourPillar[0],
        地支: diZhi,
        天干十神: tianGanShishen,
        地支十神:
          typeof diZhiShishen === "string"
            ? diZhiShishen.split("/").filter((s) => s && s !== "无")
            : extractValuesAsArray(diZhiShishen),
        地支藏干: extractValuesAsArray(
          metadata?.藏干?.时柱?.地支藏干 ||
            metadata?.藏干?.时支 ||
            getZhiMetadata(diZhi, metadata?.藏干, "时支")
        ),
        五行:
          metadata?.五行?.时柱?.天干 && metadata?.五行?.时柱?.地支
            ? `${metadata.五行.时柱.天干}${metadata.五行.时柱.地支}`
            : metadata?.五行?.时柱,
        阴阳: formatYinYang(metadata?.阴阳?.时柱),
      };
    }

    // 构建纳音信息
    const nayin: Record<string, string[]> = {};
    if (metadata?.纳音) {
      if (metadata.纳音.年柱) nayin["年柱"] = [metadata.纳音.年柱];
      if (metadata.纳音.月柱) nayin["月柱"] = [metadata.纳音.月柱];
      if (metadata.纳音.日柱) nayin["日柱"] = [metadata.纳音.日柱];
      if (metadata.纳音.时柱) nayin["时柱"] = [metadata.纳音.时柱];
    }

    return {
      八字: `${baziChart.yearPillar?.[0] || ""}${
        baziChart.yearPillar?.[1] || ""
      } ${baziChart.monthPillar?.[0] || ""}${
        baziChart.monthPillar?.[1] || ""
      } ${baziChart.dayPillar?.[0] || ""}${baziChart.dayPillar?.[1] || ""} ${
        baziChart.hourPillar?.[0] || ""
      }${baziChart.hourPillar?.[1] || ""}`,
      日主: analysis.dayMaster,
      八字各柱信息: pillarsInfo,
      纳音: Object.keys(nayin).length > 0 ? nayin : undefined,
    };
  };

  const paipanData = convertToPaipanFormat(parsedPaipan);

  if (!paipanData) {
    return (
      <Card className="mb-4 border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
            排盘数据格式错误
          </CardTitle>
          <p className="text-xs text-yellow-600">无法解析排盘数据</p>
        </CardHeader>
      </Card>
    );
  }

  // 提取角色信息
  // 🔧 修复：直接从 parsedPaipan.name 读取（后端返回格式）
  const characterName =
    parsedPaipan.name ||
    parsedPaipan.characterInfo?.characterName ||
    "未知角色";
  const characterId = parsedPaipan.characterInfo?.characterId;

  // 🎨 用户侧UI - 橙色主题，简洁展示
  if (isUserMessage) {
    return (
      <div className="mb-3">
        {/* 角色基本信息 */}
        <div className="mb-3 p-3 rounded-lg bg-gradient-to-br from-amber-100/40 to-orange-100/40 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/30">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {characterName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">
                {characterName}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {parsedPaipan?.metadata?.性别 && (
                  <span>{parsedPaipan.metadata.性别}</span>
                )}
                {parsedPaipan?.metadata?.出生时间 && (
                  <span className="ml-2">
                    {new Date(
                      parsedPaipan.metadata.出生时间
                    ).toLocaleDateString("zh-CN")}
                  </span>
                )}
                {parsedPaipan?.metadata?.出生地点 && (
                  <span className="ml-2">{parsedPaipan.metadata.出生地点}</span>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="flex-shrink-0 bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 border-0"
            >
              命盘数据
            </Badge>
          </div>
        </div>

        {/* 排盘卡片 - 适配橙色主题 */}
        <div className="[&_.bg-gradient-to-br]:!bg-gradient-to-br [&_.from-purple-50]:!from-amber-50 [&_.to-blue-50]:!to-orange-50 [&_.dark\\:from-purple-950]:!dark:from-amber-950 [&_.dark\\:to-blue-950]:!dark:to-orange-950 [&_.border-purple-200]:!border-amber-200 [&_.dark\\:border-purple-800]:!dark:border-amber-800">
          <PaipanCard
            paipan={paipanData}
            variant="flat"
            defaultExpanded={false}
          />
        </div>

        {/* 命理分析 - 橙色主题 */}
        {parsedPaipan.analysis?.reasoning && (
          <Card className="mt-4 border-l-4 border-l-amber-500 dark:border-l-amber-600 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/20">
            <CardContent className="pt-4">
              <div className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                命理分析
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                {parsedPaipan.analysis.reasoning}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge
                  variant="secondary"
                  className="text-xs bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 border-0"
                >
                  日主强弱: {parsedPaipan.analysis.dayMasterStrength}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 border-0"
                >
                  格局: {parsedPaipan.analysis.chartPattern}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // 🤖 AI侧UI - 保持原样
  return (
    <div className="mb-4">
      {/* 角色命盘标题 */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <p className="text-sm font-medium text-primary/80 px-3">
          以下是{" "}
          <span className="text-primary font-semibold">{characterName}</span>{" "}
          的命盘
        </p>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <PaipanCard paipan={paipanData} variant="flat" defaultExpanded={false} />
      {parsedPaipan.analysis?.reasoning && (
        <Card className="mt-4 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-foreground mb-2">
              命理分析
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsedPaipan.analysis.reasoning}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                日主强弱: {parsedPaipan.analysis.dayMasterStrength}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                格局: {parsedPaipan.analysis.chartPattern}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Sources渲染组件 - 处理JSON格式的搜索结果
const SourcesRenderer: FC<{ jsonContent: string; isStreaming: boolean }> = ({
  jsonContent,
  isStreaming,
}) => {
  const [parsedSources, setParsedSources] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true); // 默认紧凑模式

  useEffect(() => {
    if (jsonContent.trim()) {
      try {
        // 尝试解析JSON
        const sources = JSON.parse(jsonContent.trim());
        setParsedSources(sources);
        setParseError(null);
      } catch (error) {
        // 🎯 流式传输时JSON不完整是正常的，不记录错误
        if (!isStreaming) {
          console.error("Failed to parse vis-sources JSON:", error);
          setParseError("Invalid JSON format");
        } else {
          // 流式传输中，显示loading状态
          setParsedSources({
            query: "搜索中...",
            engine: "AI搜索",
            timestamp: new Date().toLocaleString(),
            total: 0,
            results: [],
          });
        }
      }
    }
  }, [jsonContent, isStreaming]);

  // 获取所有结果（支持单一搜索和并行搜索格式）
  const getAllResults = (sources: any) => {
    if (!sources) return [];

    // 并行搜索格式：有 searches 数组
    if (sources.searches && Array.isArray(sources.searches)) {
      return sources.searches.flatMap((search: any) => search.results || []);
    }

    // 单一搜索格式：直接有 results 数组
    if (sources.results && Array.isArray(sources.results)) {
      return sources.results;
    }

    return [];
  };

  // 如果正在流式传输且没有解析到内容，显示loading
  if (
    isStreaming &&
    (!parsedSources || getAllResults(parsedSources).length === 0)
  ) {
    return (
      <Card className="mb-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              正在整理相关信息...
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
            <span>获取最新信息中</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!parsedSources) return null;

  // 如果有解析错误，显示错误信息
  if (parseError) {
    return (
      <Card className="mb-4 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-red-600" />
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">
              Sources解析错误
            </CardTitle>
          </div>
          <p className="text-xs text-red-600">{parseError}</p>
        </CardHeader>
      </Card>
    );
  }

  // 紧凑模式渲染 - 类似Perplexity的简洁链接列表
  if (isCompactMode) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Sources</span>
            <button
              onClick={() => setIsCompactMode(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="显示详细信息"
            >
              <Info className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => setIsCompactMode(false)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            查看详情
          </button>
        </div>

        <div className="space-y-1">
          {getAllResults(parsedSources)
            .filter((result: any) => result.title && result.title.trim() !== "")
            .map((result: any, index: number) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-[16px]">
                  {index + 1}.
                </span>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                  title={result.snippet || result.title}
                >
                  {(() => {
                    try {
                      return new URL(result.url).hostname;
                    } catch {
                      return result.title || "链接";
                    }
                  })()}
                </a>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // 详细模式渲染 - 类似Google AI Studio的卡片风格
  return (
    <div className="mb-4 p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Sources</span>
          <Badge variant="secondary" className="text-xs">
            {getAllResults(parsedSources).length}
          </Badge>
        </div>
        <button
          onClick={() => setIsCompactMode(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          收起
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Search className="h-3 w-3" />
          {parsedSources.searches
            ? `${parsedSources.searches.length} 次并行搜索`
            : parsedSources.query || "搜索查询"}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {parsedSources.searches
            ? parsedSources.searches[0]?.timestamp || "未知时间"
            : parsedSources.timestamp || "未知时间"}
        </span>
        <Badge variant="outline" className="text-xs">
          {parsedSources.searches
            ? parsedSources.searches[0]?.engine || "AI搜索"
            : parsedSources.engine || "AI搜索"}
        </Badge>
      </div>

      {/* 如果是并行搜索，按搜索类型分组显示 */}
      {parsedSources.searches ? (
        <div className="space-y-4">
          {parsedSources.searches.map((search: any, searchIndex: number) => (
            <div key={searchIndex} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {search.query?.includes("生平")
                    ? "生平信息"
                    : search.query?.includes("八字")
                    ? "八字分析"
                    : search.focus === "biography"
                    ? "生平信息"
                    : search.focus === "bazi_analysis"
                    ? "八字分析"
                    : "搜索"}
                </Badge>
                <span className="text-xs">{search.query}</span>
              </div>
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                {(search.results || [])
                  .filter(
                    (result: any) => result.title && result.title.trim() !== ""
                  )
                  .map((result: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors line-clamp-2"
                          title={result.title}
                        >
                          {(() => {
                            try {
                              const url = new URL(result.url);
                              return result.title;
                            } catch {
                              return result.title;
                            }
                          })()}
                        </a>
                        {result.snippet && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {result.snippet}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {result.source ||
                              (() => {
                                try {
                                  return new URL(result.url).hostname;
                                } catch {
                                  return "未知来源";
                                }
                              })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 单一搜索的原有显示方式
        <div className="space-y-3">
          {getAllResults(parsedSources)
            .filter((result: any) => result.title && result.title.trim() !== "")
            .map((result: any, index: number) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">
                    {result.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {result.snippet || "暂无摘要"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          return new URL(result.url).hostname;
                        } catch {
                          return "未知来源";
                        }
                      })()}
                    </span>
                    {result.url &&
                      result.url !== "无链接" &&
                      result.url.trim() !== "" && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                          查看
                        </a>
                      )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const MarkdownWithSources: FC<MarkdownWithSourcesProps> = ({
  content,
  isStreaming = false,
  className,
  isUserMessage = false, // 🎨 接收 isUserMessage
}) => {
  const [renderedContent, setRenderedContent] = useState(""); // 渲染的 Markdown 内容
  const contentRef = useRef(""); // 保存上一次渲染的内容

  useEffect(() => {
    // 对于流式内容，需要特别处理累积的内容
    if (!content.startsWith(contentRef.current)) {
      // 如果内容不是累积的，重新开始
      contentRef.current = content;
    } else {
      // 如果是累积的，使用新的内容
      contentRef.current = content;
    }

    // 直接使用内容，让react-markdown处理代码块
    setRenderedContent(contentRef.current);
  }, [content]);

  const customComponents: Partial<Components> = useMemo(
    () => ({
      // 自定义 typing-cursor 元素的渲染
      "typing-cursor": ({ node, ...props }: any) => {
        return (
          <span
            className="inline-block w-2 h-5 bg-primary ml-1 cursor-blink"
            style={{ verticalAlign: "text-bottom" }}
          />
        );
      },
      // 处理代码块，特别是vis-sources
      pre: ({ node, children, ...props }: any) => {
        // 检查是否包含vis-sources代码块
        const codeElement = node?.children?.[0];

        if (codeElement?.tagName === "code") {
          const className = codeElement.properties?.className?.[0] || "";
          const match = /language-([\w-]+)/.exec(className);
          const language = match ? match[1] : "";

          // 如果是vis-sources代码块
          if (language === "vis-sources") {
            const jsonContent = codeElement.children?.[0]?.value || "";
            return (
              <div className="my-4">
                <SourcesRenderer
                  jsonContent={jsonContent}
                  isStreaming={isStreaming}
                />
              </div>
            );
          }

          // 如果是vis-paipan代码块
          if (language === "vis-paipan") {
            const jsonContent = codeElement.children?.[0]?.value || "";
            return (
              <div className="my-4">
                <PaipanRenderer
                  jsonContent={jsonContent}
                  isStreaming={isStreaming}
                  isUserMessage={isUserMessage}
                />
              </div>
            );
          }

          // ✨ 如果是character-story代码块
          if (language === "character-story") {
            const jsonContent = codeElement.children?.[0]?.value || "";

            // 如果正在流式传输且内容不完整，显示 loading
            if (
              isStreaming &&
              (!jsonContent.trim() || jsonContent.trim().length < 10)
            ) {
              return (
                <div className="my-4">
                  <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                        <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          正在提取角色设定信息...
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              );
            }

            // 🎯 流式传输时，先检查内容是否看起来像完整的 JSON
            const trimmedStoryContent = jsonContent.trim();
            if (isStreaming) {
              const startsValid = trimmedStoryContent.startsWith('{') || trimmedStoryContent.startsWith('[');
              const endsValid = trimmedStoryContent.endsWith('}') || trimmedStoryContent.endsWith(']');
              
              // 如果看起来不完整，直接显示 loading，不尝试解析
              if (!startsValid || !endsValid) {
                return (
                  <div className="my-4">
                    <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                          <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            正在提取角色设定信息...
                          </CardTitle>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                );
              }
            }

            try {
              const storyData = JSON.parse(trimmedStoryContent);
              return (
                <div className="my-4">
                  <CharacterStoryCard data={storyData} />
                </div>
              );
            } catch (error) {
              // 流式传输时 JSON 可能不完整，显示 loading
              if (isStreaming) {
                return (
                  <div className="my-4">
                    <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                          <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            正在提取角色设定信息...
                          </CardTitle>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                );
              }

              // 流式完成后仍然解析失败，显示错误
              console.error("Failed to parse character-story JSON:", error);
              console.error("Content:", trimmedStoryContent.substring(0, 200));
              return (
                <div className="my-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    角色故事数据解析失败
                  </p>
                </div>
              );
            }
          }
        }

        // 其他代码块的处理
        return (
          <pre
            {...props}
            className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto mb-3"
          >
            {children}
          </pre>
        );
      },
      code: ({ node, inline, className, children, ...props }: any) => {
        // 只处理内联代码，代码块由pre处理
        const isInline = inline || !className?.includes("language-");
        return isInline ? (
          <code
            {...props}
            className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm"
          >
            {children}
          </code>
        ) : (
          <code {...props}>{children}</code>
        );
      },
      // 保持原有的样式
      h1: ({ node, ...props }) => (
        <h1 {...props} className="text-xl font-semibold mb-4" />
      ),
      h2: ({ node, ...props }) => (
        <h2 {...props} className="text-lg font-medium mb-3" />
      ),
      h3: ({ node, ...props }) => (
        <h3 {...props} className="text-base font-medium mb-2" />
      ),
      p: ({ node, ...props }) => (
        <p {...props} className="mb-3 leading-relaxed" />
      ),
      ul: ({ node, ...props }) => (
        <ul {...props} className="list-disc list-inside mb-3 space-y-1" />
      ),
      ol: ({ node, ...props }) => (
        <ol {...props} className="list-decimal list-inside mb-3 space-y-1" />
      ),
      blockquote: ({ node, ...props }) => (
        <blockquote
          {...props}
          className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3"
        />
      ),
    }),
    [isStreaming, isUserMessage] // 🎨 添加 isUserMessage 依赖
  );

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={customComponents}
      >
        {renderedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownWithSources;
