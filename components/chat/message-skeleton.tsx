"use client";

import { FC } from "react";
import { Avatar, Skeleton } from "@heroui/react";

interface MessageSkeletonProps {
  isUser?: boolean;
  showAvatar?: boolean;
  avatarSrc?: string;
  avatarName?: string;
}

const MessageSkeleton: FC<MessageSkeletonProps> = ({
  isUser = false,
  showAvatar = true,
  avatarSrc = "/placeholder-user.jpg",
  avatarName = "Assistant",
}) => {
  return (
    <div
      className={`flex flex-col ${
        isUser ? "items-end" : "items-start"
      } gap-2 md:gap-3`}
    >
      {/* Header Row: Avatar + Name */}
      <div
        className={`flex ${
          isUser ? "justify-end" : "justify-start"
        } items-center gap-2 md:gap-3`}
      >
        {/* Assistant Avatar */}
        {!isUser && showAvatar && (
          <Skeleton className="rounded-full hidden md:block">
            <Avatar size="sm" className="w-8 h-8" />
          </Skeleton>
        )}

        {/* Identity Name Skeleton */}
        <Skeleton className="rounded-lg">
          <div className="h-3 w-20 bg-default-200"></div>
        </Skeleton>

        {/* User Avatar */}
        {isUser && showAvatar && (
          <Skeleton className="rounded-full hidden md:block">
            <Avatar size="sm" className="w-8 h-8" />
          </Skeleton>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`relative max-w-[85%] md:max-w-[75%] rounded-3xl px-4 md:px-5 py-3 md:py-4 ${
          isUser
            ? "bg-[#E8E8E8]"
            : "bg-[#F0F0F0] border border-foreground/10"
        }`}
      >
        {/* Message Content Skeleton */}
        <div className="space-y-2 min-w-[200px]">
          <Skeleton className="rounded-lg">
            <div className="h-4 w-full bg-default-200/50"></div>
          </Skeleton>
          <Skeleton className="rounded-lg">
            <div className="h-4 w-3/4 bg-default-200/50"></div>
          </Skeleton>
          <Skeleton className="rounded-lg">
            <div className="h-4 w-1/2 bg-default-200/50"></div>
          </Skeleton>
        </div>
      </div>
    </div>
  );
};

export default MessageSkeleton;
