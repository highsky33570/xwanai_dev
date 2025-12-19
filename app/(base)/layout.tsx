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
  const inVisibleLeft = pathname?.startsWith("/settings");
  const showInfoLeftImage = pathname?.startsWith("/character/info") || pathname?.startsWith("/database");
  const leftWidth = inVisibleLeft ? '0px' : showInfoLeftImage ? '400px' : '400px';
  const [leftImageUrl, setLeftImageUrl] = useState<string>("/info-leftbackground.png");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex w-full h-full max-h-screen overflow-hidden" style={{ "--left-width": leftWidth } as React.CSSProperties}>
      {!inVisibleLeft ?
        (<aside className={`relative hidden flex-none flex-col shrink-0 max-h-screen min-h-screen lg:flex w-[var(--left-width)]`} style={{ backgroundImage: 'url(/left-background.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-white/25 to-white z-0" />
          {showInfoLeftImage ? (
            <>
              {/* <div className="relative z-10 flex space-y-1 items-center max-h-24 ml-8 cursor-pointer py-6" onClick={() => router.push("/")}>
              <img
                src="/logo.svg"
                alt="Logo"
                className="h-12 w-auto rounded-md"
              />
              <div className="text-6xl font-bold hidden lg:block pl-3" style={{ fontFamily: '"Novecento WideBold", sans-serif' }}>
                XWAN.<span className="text-[#eb7020]" style={{ fontFamily: 'sans-serif' }}>IO</span>
              </div>
            </div> */}
              <div className="flex flex-col h-full justify-between lg:px-8 py-6  z-10" >
                <div className="flex-1">
                  <LogoLeft />
                </div>
                <FooterLeft />
              </div>

              <div className="relative z-10">
                {/* <img
                src={leftImageUrl}
                alt=""
                className="inset-0 w-full h-auto object-cover z-1 t-0"
              /> */}
                {/* <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80 backdrop-blur-sm z-10" /> */}
                {/* <div className="absolute bottom-3 left-10 z-20 pointer-events-auto">
                <Button
                  variant="flat"
                  className="rounded-full px-4 py-2 bg-white/60 text-foreground-700 backdrop-blur-md border border-white/30 shadow-sm hover:bg-white/80 flex items-center gap-2"
                  startContent={<ImageIcon className="w-4 h-4" />}
                  onPress={() => fileInputRef.current?.click()}
                >
                  CHANGE
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setLeftImageUrl(url);
                    }
                  }}
                />
              </div> */}

              </div>
            </>
          ) : (<>

            <LeftMenu />
          </>)}
        </aside>) : null}
      <div className="flex flex-1 flex-col min-w-0 lg:max-w-[calc(100%-var(--left-width))]" >
        <Navbar />
        <div className="overflow-y-auto">

          {children}
        </div>
      </div>
    </div>
  )
}
