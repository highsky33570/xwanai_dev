"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

export default function HomeSkeleton() {
  return (
    <>
      {/* Hero skeleton */}
      <Card className="overflow-hidden mb-6 bg-transparent shadow-none">
        <CardBody className="p-0">
          <Skeleton className="w-full h-[220px] sm:h-[320px] rounded-xl" />
        </CardBody>
      </Card>

      {/* Sort header */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>

      {/* Character swiper */}
      <div className="relative">
        <Swiper slidesPerView="auto" spaceBetween={8} allowTouchMove={false}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SwiperSlide
              key={i}
              className="flex-shrink-0 pb-2"
              style={{ width: "12rem" }}
            >
              <CharacterCardSkeleton />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Featured title */}
      <div className="mt-8 mb-3">
        <Skeleton className="h-4 w-32 rounded-full" />
      </div>

      {/* Featured swiper */}
      <div className="relative mt-2">
        <Swiper slidesPerView="auto" spaceBetween={12} allowTouchMove={false}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SwiperSlide
              key={i}
              className="flex-shrink-0 pb-2 sm:!w-[18rem] md:!w-[20rem]"
              style={{ width: "16rem" }}
            >
              <FeaturedCardSkeleton />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}

/* ---------------- skeleton cards ---------------- */

function CharacterCardSkeleton() {
  return (
    <div className="rounded-xl border border-divider p-3">
      <Skeleton className="h-64 w-full rounded-lg mb-3" />
      {/* <Skeleton className="h-4 w-3/4 rounded-full mb-2" /> */}
      {/* <Skeleton className="h-3 w-1/2 rounded-full" /> */}
    </div>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="rounded-2xl border border-divider p-4">
      <Skeleton className="h-40 w-full rounded-xl mb-4" />
      {/* <Skeleton className="h-5 w-4/5 rounded-full mb-2" /> */}
      {/* <Skeleton className="h-4 w-2/3 rounded-full" /> */}
    </div>
  );
}
