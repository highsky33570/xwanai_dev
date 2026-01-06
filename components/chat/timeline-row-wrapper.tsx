"use client";

import { FC, memo } from "react";
import ScrollableTimelineRow from "./scrollable-timeline-row";
import TimelineSkeleton from "./timeline-skeleton";

interface TimelineRowWrapperProps {
  label: string;
  isLoading: boolean;
  skeletonCount?: number;
  children: React.ReactNode;
  scrollToIndex?: number | null;
}

/**
 * 时间线行包装组件
 * 处理加载状态和骨架屏显示
 */
const TimelineRowWrapper: FC<TimelineRowWrapperProps> = memo(
  ({ label, isLoading, skeletonCount = 6, children, scrollToIndex }) => {
    return (
      <ScrollableTimelineRow label={label} scrollToIndex={scrollToIndex}>
        {isLoading ? <TimelineSkeleton count={skeletonCount} /> : children}
      </ScrollableTimelineRow>
    );
  }
);

TimelineRowWrapper.displayName = "TimelineRowWrapper";

export default TimelineRowWrapper;
