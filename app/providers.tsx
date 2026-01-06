"use client";

import type React from "react";
import { useState } from "react";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 创建Query Client实例，优化缓存策略
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟数据被认为是新鲜的
      gcTime: 10 * 60 * 1000, // 10分钟后清理缓存 
      retry: 2, // 失败重试2次
      refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
      refetchOnReconnect: true, // 网络重连时重新获取
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={router.push}>
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
