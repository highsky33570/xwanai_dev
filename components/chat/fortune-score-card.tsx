"use client";

import { FC } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import MatchScoreSkeleton from "./match-score-skeleton";

interface MatchScore {
  综合评分?: number;
  详细评分?: {
    喜用神匹配?: number;
    五行平衡?: number;
    格局加成?: number;
    刑冲克害?: number;
  };
  标签?: string;
  置信度?: number;
  评语?: string;
  [key: string]: any;
}

interface FortuneScoreCardProps {
  matchScore: MatchScore | null;
  isLoadingScore: boolean;
}

const FortuneScoreCard: FC<FortuneScoreCardProps> = ({
  matchScore,
  isLoadingScore,
}) => {
  return (
    <>
      {isLoadingScore ? (
        <MatchScoreSkeleton />
      ) : (
        <div className="pb-6 border-b border-foreground/10 animate-in fade-in duration-500">
          <div className="flex flex-col items-center w-full py-4">
            <h3 className="text-lg font-medium text-foreground mb-4 tracking-wide font-serif">
              运势评分
            </h3>

            <div className="flex items-center justify-center w-full gap-4 sm:gap-8 mb-8">
              {/* 左侧维度: 喜用神(55) & 五行(20) */}
              <div className="flex flex-col gap-4 items-end flex-1">
                {/* 喜用神匹配 */}
                <div className="flex items-center gap-2 w-full justify-end">
                  <div className="w-16 sm:w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden flex justify-end">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(matchScore?.详细评分?.喜用神匹配 || 40) /
                            55) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-foreground/60">喜用神</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EB7020]" />
                </div>
                {/* 五行平衡 */}
                <div className="flex items-center gap-2 w-full justify-end">
                  <div className="w-16 sm:w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden flex justify-end">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(matchScore?.详细评分?.五行平衡 || 15) /
                            20) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  
                  <span className="text-xs text-foreground/60">五行</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EB7020]" />
                </div>
              </div>

              {/* 中间圆环 */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg style={{ height: 0, width: 0, position: "absolute" }}>
                  <defs>
                    <linearGradient
                      id="scoreGradient"
                      x1="50%"
                      y1="0%"
                      x2={`${
                        50 +
                        50 *
                          Math.sin(
                            ((matchScore?.综合评分 || 0) / 100) * 2 * Math.PI
                          )
                      }%`}
                      y2={`${
                        50 -
                        50 *
                          Math.cos(
                            ((matchScore?.综合评分 || 0) / 100) * 2 * Math.PI
                          )
                      }%`}
                    >
                      <stop offset="0%" stopColor="#e7cdbc" />
                      <stop offset="100%" stopColor="#EB7020" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="w-full h-full">
                  <CircularProgressbar
                    value={matchScore?.综合评分 || 0}
                    strokeWidth={8}
                    className="[&_.CircularProgressbar-trail]:stroke-foreground/5 [&_.CircularProgressbar-path]:transition-all [&_.CircularProgressbar-path]:duration-1000 [&_.CircularProgressbar-path]:ease-out"
                    styles={{
                      path: {
                        stroke: "url(#scoreGradient)",
                        strokeLinecap: "round",
                      },
                      trail: { strokeLinecap: "round" },
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-[#EB7020]" style={{ fontFamily: 'sans-serif' }}>
                    {matchScore?.综合评分 || 0}
                  </span>
                </div>
              </div>

              {/* 右侧维度: 格局(25) & 刑冲(15) */}
              <div className="flex flex-col gap-4 items-start flex-1">
                {/* 格局加成 */}
                <div className="flex items-center gap-2 w-full justify-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EB7020]" />
                  <span className="text-xs text-foreground/60">格局</span>
                  <div className="w-16 sm:w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden flex justify-start">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((Number(matchScore?.详细评分?.格局加成 || 10) +
                            15) /
                            40) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                {/* 刑冲克害 */}
                <div className="flex items-center gap-2 w-full justify-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EB7020]" />
                  
                  <span className="text-xs text-foreground/60">刑冲</span>
                  <div className="w-16 sm:w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden flex justify-start">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(matchScore?.详细评分?.刑冲克害 || 5) /
                            15) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 底部评语 */}
            <div className="text-center space-y-3 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    (matchScore?.综合评分 || 0) >= 70
                      ? "bg-gray-500/10 text-gray-600"
                      : (matchScore?.综合评分 || 0) >= 50
                      ? "bg-gray-500/10 text-gray-600"
                      : "bg-gray-500/10 text-gray-600"
                  }`}
                >
                  {matchScore?.标签 || "等待分析"}
                </span>
                {matchScore?.置信度 && (
                  <span className="text-[10px] text-foreground/40">
                    置信度 {(matchScore.置信度 * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/70 leading-relaxed word-break [word-break:keep-all]">
                {matchScore?.评语 || "请选择时间节点以查看详细运势分析..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FortuneScoreCard;
