"use client";

import { FC } from "react";

interface TimelineSkeletonProps {
  count?: number;
}

/**
 * 时间线骨架屏组件
 * 用于加载新数据时的占位显示
 */
const TimelineSkeleton: FC<TimelineSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="flex gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex-shrink-0 w-32 rounded-xl bg-foreground/5 border-2 border-foreground/5"
        >
          <div className="p-3 space-y-2">
            {/* 年份/月份骨架 */}
            <div className="h-3 bg-foreground/10 rounded w-16 mx-auto" />
            {/* 年龄骨架 */}
            <div className="h-3 bg-foreground/10 rounded w-10 mx-auto" />
            {/* 干支骨架 */}
            <div className="h-6 bg-foreground/10 rounded w-14 mx-auto my-1" />
            {/* 十神骨架 */}
            <div className="h-4 bg-foreground/10 rounded w-12 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineSkeleton;
