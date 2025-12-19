"use client";

import { FC } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

/**
 * 匹配度评分区域的骨架屏
 * 对应 DestinyTimeline 中的新版 "wings" 布局
 */
const MatchScoreSkeleton: FC = () => {
  return (
    <div className="pb-6 border-b border-foreground/10 animate-pulse">
      <div className="flex flex-col items-center w-full py-4">
        {/* 标题骨架 */}
        <div className="h-7 w-24 bg-foreground/10 rounded mb-8" />

        <div className="flex items-center justify-center w-full gap-4 sm:gap-8 mb-8">
          {/* 左侧维度骨架 */}
          <div className="flex flex-col gap-4 items-end flex-1">
            {/* 维度 1 */}
            <div className="flex items-center gap-2 w-full justify-end">
              <div className="h-3 w-10 bg-foreground/10 rounded" />
              <div className="w-16 sm:w-24 h-1.5 bg-foreground/10 rounded-full" />
              <div className="h-3 w-4 bg-foreground/10 rounded" />
            </div>
            {/* 维度 2 */}
            <div className="flex items-center gap-2 w-full justify-end">
              <div className="h-3 w-8 bg-foreground/10 rounded" />
              <div className="w-16 sm:w-24 h-1.5 bg-foreground/10 rounded-full" />
              <div className="h-3 w-4 bg-foreground/10 rounded" />
            </div>
          </div>

          {/* 中间圆环骨架 */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <div className="w-full h-full text-foreground/10">
              <CircularProgressbar
                value={0}
                strokeWidth={8}
                className="[&_.CircularProgressbar-trail]:stroke-current"
                styles={{
                  trail: { strokeLinecap: "round" },
                }}
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-10 w-16 bg-foreground/10 rounded mb-1" />
              <div className="h-3 w-12 bg-foreground/10 rounded" />
            </div>
          </div>

          {/* 右侧维度骨架 */}
          <div className="flex flex-col gap-4 items-start flex-1">
            {/* 维度 3 */}
            <div className="flex items-center gap-2 w-full justify-start">
              <div className="h-3 w-4 bg-foreground/10 rounded" />
              <div className="w-16 sm:w-24 h-1.5 bg-foreground/10 rounded-full" />
              <div className="h-3 w-8 bg-foreground/10 rounded" />
            </div>
            {/* 维度 4 */}
            <div className="flex items-center gap-2 w-full justify-start">
              <div className="h-3 w-4 bg-foreground/10 rounded" />
              <div className="w-16 sm:w-24 h-1.5 bg-foreground/10 rounded-full" />
              <div className="h-3 w-8 bg-foreground/10 rounded" />
            </div>
          </div>
        </div>

        {/* 底部评语骨架 */}
        <div className="text-center space-y-3 max-w-md mx-auto w-full flex flex-col items-center">
          {/* Tag */}
          <div className="h-6 w-20 bg-foreground/10 rounded-full" />
          {/* Text */}
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-4 w-3/4 bg-foreground/10 rounded" />
            <div className="h-4 w-1/2 bg-foreground/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScoreSkeleton;
