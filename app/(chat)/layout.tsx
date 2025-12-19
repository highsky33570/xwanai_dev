"use client";

import type React from "react";
import EnhancedChatSidebar from "@/components/sidebar/enhanced-chat-sidebar";
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
      <aside className={`max-h-screen relative hidden lg:flex w-[var(--left-width)] shrink-0 flex-none flex-col h-screen`} >
        <ChatHistorySidebar></ChatHistorySidebar>
      </aside>
      <div className="flex flex-1 flex-col min-w-0 lg:max-w-[calc(100%-var(--left-width))]">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
