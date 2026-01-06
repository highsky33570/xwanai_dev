"use client";

import { FC, memo, Children, isValidElement, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

interface ScrollableTimelineRowProps {
  label: string;
  children: React.ReactNode;
  scrollToIndex?: number | null;
}

/**
 * 独立的可滚动时间线行组件
 * 使用 memo 避免不必要的重新渲染
 */
const ScrollableTimelineRow: FC<ScrollableTimelineRowProps> = memo(
  ({ label, children, scrollToIndex }) => {
    const [swiper, setSwiper] = useState<SwiperType | null>(null);

    // 当 scrollToIndex 改变时，滚动到指定位置
    useEffect(() => {
      if (swiper && scrollToIndex !== undefined && scrollToIndex !== null && scrollToIndex >= 0) {
        swiper.slideTo(scrollToIndex);
      }
    }, [swiper, scrollToIndex]);

    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl p-4">
        {/* 左侧标签 */}
        <div className="flex-shrink-0 w-16 text-center">
          <span className="text-base font-semibold text-foreground/80">
            {label}
          </span>
        </div>
        <div className="w-full overflow-hidden">
          <Swiper
            onSwiper={setSwiper}
            slidesPerView={"auto"}
            spaceBetween={12}
            speed={450}
            grabCursor={true}
            allowTouchMove={true}
            resistanceRatio={0.5}
            simulateTouch={true}
            className="w-full"
          >
            {Children.map(children, (child) => {
              if (!isValidElement(child)) return null;
              return (
                <SwiperSlide className="!w-auto">
                  {child}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    );
  }
);

ScrollableTimelineRow.displayName = "ScrollableTimelineRow";

export default ScrollableTimelineRow;
