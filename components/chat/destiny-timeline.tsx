"use client";

import { FC, useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { Sparkles, CalendarCheck } from "lucide-react";
import {
  useDayunList,
  useDayunDetail,
  useLiunianDetail,
  useLiuyueDetail,
  useLiuriDetail,
  type BirthInfo,
  type DayunSummary,
  type LiunianSummary,
  type LiuyueSummary,
  type LiushiSummary,
} from "@/hooks/use-destiny-data";
import ScrollableTimelineRow from "./scrollable-timeline-row";
import TimelineRowWrapper from "./timeline-row-wrapper";
import FortuneScoreCard from "./fortune-score-card";

interface DestinyTimelineProps {
  birthInfo: BirthInfo;
  variant?: "default" | "flat";
}

const DestinyTimeline: FC<DestinyTimelineProps> = ({
  birthInfo,
  variant = "default",
}) => {
  // 展开状态管理
  const [expandedDayun, setExpandedDayun] = useState<number | null>(null);
  const [expandedLiunian, setExpandedLiunian] = useState<number | null>(null);
  const [expandedLiuyue, setExpandedLiuyue] = useState<{
    year: number;
    month: number;
  } | null>(null);
  const [expandedLiuri, setExpandedLiuri] = useState<{
    year: number;
    month: number;
    day: number;
  } | null>(null);

  // Layer 1: 加载大运列表
  const {
    data: dayunData,
    isLoading: isDayunLoading,
    error: dayunError,
  } = useDayunList(birthInfo);

  // 获取当前日期信息
  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }, []);

  // 检查数据中是否包含今天，并找到对应的index
  const currentDayunIndex = useMemo(() => {
    if (!dayunData?.dayun_list) return null;
    const dayun = dayunData.dayun_list.find((d: DayunSummary) => d.is_current);
    return dayun ? dayun.index : null;
  }, [dayunData]);

  const currentYear = useMemo(() => {
    return today.year;
  }, [today]);

  const currentMonth = useMemo(() => {
    return today.month;
  }, [today]);

  const currentDay = useMemo(() => {
    return today.day;
  }, [today]);

  // 跳转到今天 - 逐步展开以确保数据加载
  const jumpToToday = useCallback(() => {
    if (currentDayunIndex !== null) {
      // 第一步：展开大运
      setExpandedDayun(currentDayunIndex);

      // 等待 React 更新后再展开流年
      setTimeout(() => {
        setExpandedLiunian(currentYear);

        // 等待流年数据加载后再展开流月
        setTimeout(() => {
          setExpandedLiuyue({ year: currentYear, month: currentMonth });

          // 等待流月数据加载后再展开流日
          setTimeout(() => {
            setExpandedLiuri({
              year: currentYear,
              month: currentMonth,
              day: currentDay,
            });
          }, 300);
        }, 300);
      }, 300);
    }
  }, [currentDayunIndex, currentYear, currentMonth, currentDay]);

  // 自动跳转到今天（仅在组件加载且数据准备好时执行一次）
  const hasJumpedToToday = useRef(false);
  useEffect(() => {
    if (!hasJumpedToToday.current && currentDayunIndex !== null) {
      // 直接设置所有状态为选中今天，避免动画延迟，确保评分卡即时显示
      setExpandedDayun(currentDayunIndex);
      setExpandedLiunian(currentYear);
      setExpandedLiuyue({ year: currentYear, month: currentMonth });
      setExpandedLiuri({
        year: currentYear,
        month: currentMonth,
        day: currentDay,
      });
      hasJumpedToToday.current = true;
    }
  }, [currentDayunIndex, currentYear, currentMonth, currentDay]);

  // Layer 2: 加载选中大运的详情
  const { data: dayunDetail, isLoading: isDayunDetailLoading } = useDayunDetail(
    birthInfo,
    expandedDayun
  );

  // Layer 3: 加载选中流年的详情
  const { data: liunianDetail, isLoading: isLiunianDetailLoading } =
    useLiunianDetail(birthInfo, expandedLiunian);

  // Layer 4: 加载选中流月的详情
  const { data: liuyueDetail, isLoading: isLiuyueDetailLoading } =
    useLiuyueDetail(
      birthInfo,
      expandedLiuyue?.year || null,
      expandedLiuyue?.month || null
    );

  // Layer 5: 加载选中流日的详情
  const { data: liuriDetail, isLoading: isLiuriDetailLoading } = useLiuriDetail(
    birthInfo,
    expandedLiuri?.year || null,
    expandedLiuri?.month || null,
    expandedLiuri?.day || null
  );

  // 计算滚动索引
  // 1. 大运索引
  const dayunScrollIndex = useMemo(() => {
    if (!dayunData?.dayun_list || expandedDayun === null) return null;
    return dayunData.dayun_list.findIndex((d: DayunSummary) => d.index === expandedDayun);
  }, [dayunData, expandedDayun]);

  // 2. 流年索引
  const liunianScrollIndex = useMemo(() => {
    if (!dayunDetail?.liunian_list || expandedLiunian === null) return null;
    return dayunDetail.liunian_list.findIndex((l: LiunianSummary) => l.year === expandedLiunian);
  }, [dayunDetail, expandedLiunian]);

  // 3. 流月索引
  const liuyueScrollIndex = useMemo(() => {
    if (!liunianDetail?.liuyue_list || expandedLiuyue === null) return null;
    return liunianDetail.liuyue_list.findIndex((l: LiuyueSummary) => l.month === expandedLiuyue.month);
  }, [liunianDetail, expandedLiuyue]);

  // 4. 流日索引
  const liuriScrollIndex = useMemo(() => {
    if (!liuyueDetail?.liuri_list || expandedLiuri === null) return null;
    return liuyueDetail.liuri_list.findIndex((l: any) => l.day === expandedLiuri.day);
  }, [liuyueDetail, expandedLiuri]);

  // 处理大运点击
  const handleDayunClick = (dayunIndex: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (expandedDayun === dayunIndex) {
      setExpandedDayun(null);
      setExpandedLiunian(null);
      setExpandedLiuyue(null);
      setExpandedLiuri(null);
    } else {
      setExpandedDayun(dayunIndex);
      setExpandedLiunian(null);
      setExpandedLiuyue(null);
      setExpandedLiuri(null);
    }
  };

  // 处理流年点击
  const handleLiunianClick = (year: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (expandedLiunian === year) {
      setExpandedLiunian(null);
      setExpandedLiuyue(null);
      setExpandedLiuri(null);
    } else {
      setExpandedLiunian(year);
      setExpandedLiuyue(null);
      setExpandedLiuri(null);
    }
  };

  // 处理流月点击
  const handleLiuyueClick = (
    year: number,
    month: number,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (expandedLiuyue?.year === year && expandedLiuyue?.month === month) {
      setExpandedLiuyue(null);
      setExpandedLiuri(null);
    } else {
      setExpandedLiuyue({ year, month });
      setExpandedLiuri(null);
    }
  };

  // 处理流日点击
  const handleLiuriClick = (
    year: number,
    month: number,
    day: number,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (
      expandedLiuri?.year === year &&
      expandedLiuri?.month === month &&
      expandedLiuri?.day === day
    ) {
      setExpandedLiuri(null);
    } else {
      setExpandedLiuri({ year, month, day });
    }
  };

  // 获取十神颜色
  const getShishenColor = (shishen: string) => {
    const colors: Record<string, string> = {
      比肩: "text-foreground",
      劫财: "text-orange-500",
      食神: "text-amber-500",
      伤官: "text-yellow-600",
      偏财: "text-purple-500",
      正财: "text-indigo-500",
      七杀: "text-red-500",
      正官: "text-rose-600",
      偏印: "text-teal-500",
      正印: "text-cyan-600",
    };
    return colors[shishen] || "text-foreground";
  };

  if (isDayunLoading) {
    return (
      <Card className="w-full bg-content1">
        <CardBody className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">正在计算命运时间线...</p>
        </CardBody>
      </Card>
    );
  }

  if (!dayunData) {
    return (
      <Card className="w-full bg-content1">
        <CardBody className="flex flex-col items-center justify-center p-8">
          <p className="text-sm text-foreground/60">
            {dayunError ? `加载失败: ${dayunError}` : "暂无数据"}
          </p>
        </CardBody>
      </Card>
    );
  }

  // 获取当前匹配度（根据展开层级动态获取）
  const getCurrentMatchScore = () => {
    // 优先级：流日 > 流月 > 流年 > 大运

    // 如果展开了流日，显示流日匹配度
    if (expandedLiuri && liuriDetail?.liuri_detail?.运势信号?.运势计分) {
      const ganzhi = liuriDetail.liuri_detail.ganzhi;
      return {
        ...liuriDetail.liuri_detail.运势信号.运势计分,
        层级: "流日",
        时间描述: `${expandedLiuri.year}年${expandedLiuri.month}月${expandedLiuri.day}日 (${ganzhi[0]}${ganzhi[1]})`,
      };
    }

    // 如果展开了流月，显示流月匹配度
    if (expandedLiuyue && liuyueDetail?.liuyue_detail?.运势信号?.运势计分) {
      const ganzhi = liuyueDetail.liuyue_detail.ganzhi;
      return {
        ...liuyueDetail.liuyue_detail.运势信号.运势计分,
        层级: "流月",
        时间描述: `${expandedLiuyue.year}年${expandedLiuyue.month}月 (${ganzhi[0]}${ganzhi[1]})`,
      };
    }

    // 如果展开了流年，显示流年匹配度
    if (expandedLiunian && liunianDetail?.liunian_detail?.运势信号?.运势计分) {
      const ganzhi = liunianDetail.liunian_detail.ganzhi;
      return {
        ...liunianDetail.liunian_detail.运势信号.运势计分,
        层级: "流年",
        时间描述: `${expandedLiunian}年 (${ganzhi[0]}${ganzhi[1]})`,
      };
    }

    // 默认显示大运匹配度
    if (
      expandedDayun !== null &&
      dayunDetail?.dayun_detail?.运势信号?.运势计分
    ) {
      const dayun = dayunData.dayun_list.find((d) => d.index === expandedDayun);
      if (dayun) {
        return {
          ...dayunDetail.dayun_detail.运势信号.运势计分,
          层级: "大运",
          时间描述: `${dayun.start_year}-${dayun.end_year}年 (${dayun.ganzhi[0]}${dayun.ganzhi[1]})`,
        };
      }
    }

    return null;
  };

  const matchScore = getCurrentMatchScore();

  // 判断是否正在加载评分数据
  const isLoadingScore =
    (expandedDayun !== null && isDayunDetailLoading) ||
    (expandedLiunian !== null && isLiunianDetailLoading) ||
    (expandedLiuyue !== null && isLiuyueDetailLoading) ||
    (expandedLiuri !== null && isLiuriDetailLoading);
  return (
    <Card className="w-full h-full bg-transparent border-none shadow-none border-t border-foreground/10">
      <CardBody className="p-6 pt-0 space-y-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-foreground/30">
        {/* 匹配度展示区域 - 显示骨架屏或实际内容 */}

        <FortuneScoreCard matchScore={matchScore} isLoadingScore={isLoadingScore} />

        {/* 大运行 */}
        <ScrollableTimelineRow label="大运" scrollToIndex={dayunScrollIndex}>
          {dayunData.dayun_list.map((dayun: DayunSummary) => {
            // 只有被展开时才高亮
            const isExpanded = expandedDayun === dayun.index;

            return (
              <div
                key={dayun.id}
                className={`flex-shrink-0 rounded-xl transition-all ${isExpanded
                  ? "p-[2px] bg-[linear-gradient(to_bottom,rgba(235,112,32,0.45),rgba(235,112,32,0)_55%)]"
                  : "p-0"
                  }`}
              >
                <button
                  data-dayun={dayun.index}
                  onClick={(e) => handleDayunClick(dayun.index, e)}
                  className={`
                    w-32 p-3 rounded-xl transition-all
                    ${isExpanded
                      ? "bg-zinc-50 dark:bg-zinc-900 border-none shadow-md"
                      : "bg-content1 border-2 border-foreground/10 hover:border-foreground/20 hover:shadow-md"
                    }
                  `}
                >
                  <div className="text-xs text-foreground/60">
                    {dayun.start_year}年
                  </div>
                  <div className="text-xs text-foreground/60">
                    {dayun.age_start}岁
                  </div>
                  <div className="text-xl font-bold text-foreground my-1">
                    {dayun.ganzhi[0]}
                    <span className="text-foreground/70">
                      {dayun.ganzhi[1]}
                    </span>
                  </div>
                  <div
                    className={`text-sm ${getShishenColor(dayun.shishen.天干)}`}
                  >
                    {dayun.shishen.天干}
                  </div>
                </button>
              </div>
            );
          })}
        </ScrollableTimelineRow >

        {/* 流年行 - 只在大运展开时显示 */}
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          <TimelineRowWrapper
            label="流年"
            isLoading={isDayunDetailLoading || !dayunDetail}
            skeletonCount={10}
            scrollToIndex={liunianScrollIndex}
          >
            {dayunDetail?.liunian_list.map((liunian: LiunianSummary) => {
              // 只有被展开时才高亮
              const isExpanded = expandedLiunian === liunian.year;

              return (
                <div
                  key={liunian.year}
                  className={`flex-shrink-0 rounded-xl transition-all ${isExpanded
                    ? "p-[2px] bg-[linear-gradient(to_bottom,rgba(235,112,32,0.45),rgba(235,112,32,0)_55%)]"
                    : "p-0"
                    }`}
                >
                  <button
                    data-year={liunian.year}
                    onClick={(e) => handleLiunianClick(liunian.year, e)}
                    className={`
                        w-32 p-3 rounded-xl transition-all
                        ${isExpanded
                        ? "bg-zinc-50 dark:bg-zinc-900 border-none shadow-md"
                        : "bg-content1 border-2 border-foreground/10 hover:border-foreground/20 hover:shadow-md"
                      }
                      `}
                  >
                    <div className="text-center space-y-1">
                      <div className="text-sm font-semibold text-foreground">
                        {liunian.year}
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {liunian.ganzhi[0]}
                        <span className="text-foreground/70">
                          {liunian.ganzhi[1]}
                        </span>
                      </div>
                      <div className="text-xs text-foreground/60">
                        {liunian.shishen.天干}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {liunian.shishen.地支.join(" ")}
                      </div>
                    </div>
                  </button>
                </div>
              );
            }) || []}
          </TimelineRowWrapper>
        </div>

        {/* 流月行 - 只在流年展开时显示 */}
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          <TimelineRowWrapper
            label="流月"
            isLoading={isLiunianDetailLoading || !liunianDetail}
            skeletonCount={12}
            scrollToIndex={liuyueScrollIndex}
          >
            {liunianDetail?.liuyue_list.map((liuyue: LiuyueSummary) => {
              // 只有被展开时才高亮
              const isExpanded = expandedLiuyue?.month === liuyue.month;

              return (
                <div
                  key={liuyue.month}
                  className={`flex-shrink-0 rounded-xl transition-all ${isExpanded
                    ? "p-[2px] bg-[linear-gradient(to_bottom,rgba(235,112,32,0.45),rgba(235,112,32,0)_55%)]"
                    : "p-0"
                    }`}
                >
                  <button
                    data-month={`${expandedLiunian}-${liuyue.month}`}
                    onClick={(e) =>
                      handleLiuyueClick(expandedLiunian, liuyue.month, e)
                    }
                    className={`
                        w-32 p-3 rounded-xl transition-all
                        ${isExpanded
                        ? "bg-zinc-50 dark:bg-zinc-900 border-none shadow-md"
                        : "bg-content1 border-2 border-foreground/10 hover:border-foreground/20 hover:shadow-md"
                      }
                      `}
                  >
                    <div className="text-center space-y-1">
                      <div className="text-sm font-semibold text-foreground">
                        {liuyue.month}月
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {liuyue.ganzhi[0]}
                        <span className="text-foreground/70">
                          {liuyue.ganzhi[1]}
                        </span>
                      </div>
                      <div className="text-xs text-foreground/60">
                        {liuyue.shishen.天干}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {liuyue.shishen.地支.join(" ")}
                      </div>
                    </div>
                  </button>
                </div>
              );
            }) || []}
          </TimelineRowWrapper>
        </div>

        {/* 流日行 - 只在流月展开时显示 */}
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          <TimelineRowWrapper
            label="流日"
            isLoading={isLiuyueDetailLoading || !liuyueDetail}
            skeletonCount={10}
            scrollToIndex={liuriScrollIndex}
          >
            {liuyueDetail?.liuri_list.map((liuri) => {
              // 只有被展开时才高亮
              const isExpanded = expandedLiuri?.day === liuri.day;

              return (
                <div
                  key={liuri.day}
                  className={`flex-shrink-0 rounded-xl transition-all ${isExpanded
                    ? "p-[2px] bg-[linear-gradient(to_bottom,rgba(235,112,32,0.45),rgba(235,112,32,0)_55%)]"
                    : "p-0"
                    }`}
                >
                  <button
                    data-day={`${expandedLiuyue.year}-${expandedLiuyue.month}-${liuri.day}`}
                    onClick={(e) =>
                      handleLiuriClick(
                        expandedLiuyue.year,
                        expandedLiuyue.month,
                        liuri.day,
                        e
                      )
                    }
                    className={`
                        w-32 p-3 rounded-xl transition-all
                        ${isExpanded
                        ? "bg-zinc-50 dark:bg-zinc-900 border-none shadow-md"
                        : "bg-content1 border-2 border-foreground/10 hover:border-foreground/20 hover:shadow-md"
                      }
                      `}
                  >
                    <div className="text-center space-y-1">
                      <div className="text-sm font-semibold text-foreground">
                        {liuri.day}日
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {liuri.ganzhi[0]}
                        <span className="text-foreground/70">
                          {liuri.ganzhi[1]}
                        </span>
                      </div>
                      <div className="text-xs text-foreground/60">
                        {liuri.shishen.天干}
                      </div>
                    </div>
                  </button>
                </div>
              );
            }) || []}
          </TimelineRowWrapper>
        </div>

        {/* 流时行 - 只在流日展开时显示 */}
        {/* {
          expandedLiuri && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <TimelineRowWrapper
                label="流时"
                isLoading={isLiuriDetailLoading || !liuriDetail}
                skeletonCount={12}
              >
                {liuriDetail?.liushi_list.map((liushi: LiushiSummary) => (
                  <div
                    key={liushi.shichen}
                    className={`flex-shrink-0 rounded-xl transition-all ${liushi.is_current
                      ? "p-[2px] bg-[linear-gradient(to_bottom,rgba(235,112,32,0.45),rgba(235,112,32,0)_55%)]"
                      : "p-0"
                      }`}
                  >
                    <div
                      className={`
                      w-32 p-3 rounded-xl transition-all
                      ${liushi.is_current
                          ? "bg-zinc-50 dark:bg-zinc-900 border-none shadow-md"
                          : "bg-content1 border-2 border-foreground/10"
                        }
                    `}
                    >
                      <div className="text-center space-y-1">
                        <div className="text-sm font-semibold text-foreground">
                          {liushi.shichen}时
                        </div>
                        <div className="text-xs text-foreground/60">
                          {liushi.time_range}
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {liushi.ganzhi[0]}
                          <span className="text-foreground/70">
                            {liushi.ganzhi[1]}
                          </span>
                        </div>
                        <div className="text-xs text-foreground/60">
                          {liushi.shishen.天干}
                        </div>
                      </div>
                    </div>
                  </div>
                )) || []}
              </TimelineRowWrapper>
            </div>
          )
        } */}

        {/* 底部装饰 */}
        <div className="mt-8 pt-6 border-t border-foreground/10">
          {/* <div className="flex items-center justify-center gap-2 text-foreground/40">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">
              {expandedLiuri
                ? "已展开至最细粒度 · 时辰级运势"
                : expandedLiuyue
                  ? "继续展开查看每日运势"
                  : expandedLiunian
                    ? "继续展开查看每月运势"
                    : expandedDayun
                      ? "继续展开查看流年运势"
                      : "点击大运开始探索您的命运时间线"}
            </span>
            <Sparkles className="w-4 h-4" />
          </div> */}
        </div>
      </CardBody >
    </Card >
  );
};

export default DestinyTimeline;
