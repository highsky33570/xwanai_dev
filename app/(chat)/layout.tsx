"use client";

import type React from "react";
import ChatHistorySidebar from "@/components/navigation/chat-history-sidebar";
import Navbar from "@/components/navigation/navbar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const leftWidth = '400px';

  return (
    <div className="w-full h-full flex overflow-hidden max-h-screen" style={{ "--left-width": leftWidth } as React.CSSProperties}>
      <ChatHistorySidebar />
      <div className="flex flex-1 flex-col min-w-0 lg:max-w-[calc(100%-var(--left-width))] min-h-screen sm:pl-0 md:pl-0 xl:pl-24 lg:pl-20 2xl:pl-28">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
