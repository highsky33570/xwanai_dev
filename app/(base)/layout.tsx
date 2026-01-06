"use client";

import LeftMenu from "@/components/navigation/left-menu"
import type React from "react"
import Navbar from "@/components/navigation/navbar";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import LogoLeft from "@/components/common/Logo_Left";
import FooterLeft from "@/components/common/Footer_Left";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const showInfoLeftImage = pathname?.startsWith("/character/info") || pathname?.startsWith("/database") || pathname?.startsWith("/settings") || pathname?.startsWith("/user/my-info");
  const leftWidth = showInfoLeftImage ? '400px' : '400px';
  const showBackground = pathname?.startsWith("/database");
  
  return (
    <div 
      className="flex w-full h-full max-h-screen overflow-hidden" 
      style={{ 
        "--left-width": leftWidth,
        backgroundImage: "url(/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as React.CSSProperties}
    >
      <aside className={`hidden lg:flex flex-none flex-col px-3 shrink-0 max-h-screen min-h-screen w-[var(--left-width)]`} style={{ backgroundImage: showBackground ? 'url(/png/left-side.png)' : 'none', backgroundRepeat: 'no-repeat', backgroundSize: 'contain', backgroundPosition: 'center' }}>
        {showInfoLeftImage ? (
          <>
            <div className="flex flex-col h-full justify-between px-4 lg:px-8 py-6 z-10" >
              <div className="flex-1">
                <LogoLeft />
              </div>
              <FooterLeft />
            </div>
          </>
        ) : (<>
          <LeftMenu />
        </>)}
      </aside>
      <div className="flex flex-1 flex-col min-w-0 lg:max-w-[calc(100%-var(--left-width))] sm:pl-0 md:pl-0 xl:pl-24 lg:pl-20 2xl:pl-28" >
        <Navbar />
        <div className="lg:hidden">
          <LeftMenu inlineHidden />
        </div>
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
