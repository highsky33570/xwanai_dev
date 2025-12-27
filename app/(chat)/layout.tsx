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
      <aside className={`hidden lg:flex max-h-screen relative w-[var(--left-width)] shrink-0 flex-none flex-col h-screen px-3 bg-content1 z-10`}>
        <ChatHistorySidebar></ChatHistorySidebar>
      </aside>
      <div className="flex flex-1 flex-col min-w-0 lg:max-w-[calc(100%-var(--left-width))] min-h-screen xl:pl-24 lg:pl-20 md:pl-12 sm:pl-12">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
