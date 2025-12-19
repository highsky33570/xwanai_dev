"use client";

import { FC } from "react";
import { Avatar, Skeleton } from "@heroui/react";

const ChatHeaderSkeleton: FC = () => {
  return (
    <div className="py-4 sticky top-0 z-10">
      <div className="relative">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="rounded-full">
            <Avatar size="sm" className="w-12 h-12" />
          </Skeleton>
          <Skeleton className="rounded-lg">
            <div className="h-4 w-32 bg-default-200"></div>
          </Skeleton>
          <Skeleton className="rounded-lg">
            <div className="h-3 w-24 bg-default-200"></div>
          </Skeleton>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Skeleton className="rounded-2xl">
            <div className="h-8 w-8 bg-default-200"></div>
          </Skeleton>
          <Skeleton className="rounded-lg md:hidden">
            <div className="h-8 w-8 bg-default-200"></div>
          </Skeleton>
        </div>
      </div>
    </div>
  );
};

export default ChatHeaderSkeleton;
