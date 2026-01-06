"use client";

import type React from "react";
import { Averia_Serif_Libre, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/navigation/navbar";
import Footer from "@/components/navigation/footer";
import LeftMenu from "@/components/navigation/left-menu";
import ChatHistorySidebar from "@/components/navigation/chat-history-sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Image as ImageIcon } from "lucide-react";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import { databaseOperations } from "@/lib/supabase/database";
import { useRef, useState, useEffect } from "react";

const averiaSerifLibre = Averia_Serif_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-averia-serif-libre",
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-bodoni-moda",
  display: "swap",
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const showInfoLeftImage = pathname?.startsWith("/character/info") || pathname?.startsWith("/database");
  const isChatRoute = pathname?.startsWith("/chat");
  const leftWidth = showInfoLeftImage ? '500px' : '400px';
  const [leftImageUrl, setLeftImageUrl] = useState<string>("/info-leftbackground.png");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search || "");
    const characterId = params.get("id");
    if (pathname?.startsWith("/character/info") && characterId) {
      databaseOperations.getCharacterById(characterId).then(({ data }) => {
        const url = getAvatarPublicUrl(data?.avatar_id || null, data?.auth_id || null) || "/info-leftbackground.png";
        setLeftImageUrl(url);
      }).catch(() => {
        setLeftImageUrl("/info-leftbackground.png");
      });
    } else {
      setLeftImageUrl("/info-leftbackground.png");
    }
  }, [pathname]);
  return (
    <html
      lang="en"
      className={`${averiaSerifLibre.variable} ${bodoniModa.variable} antialiased`}
      suppressHydrationWarning
    >
      <body
        className={`${averiaSerifLibre.className} mx-auto`}
        style={{
          backgroundImage: "url(/background.png)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Providers>
          <div className="min-h-screen text flex w-full px-3" style={{ "--left-width": leftWidth } as React.CSSProperties}>
            <aside className={`relative hidden lg:flex w-[var(--left-width)] shrink-0 flex-none flex-col h-screen`} style={{ backgroundImage: 'url(/left-background.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-white/25 to-white z-0" />
              {showInfoLeftImage ? (
                <>
                  <div className="relative z-10 flex space-y-1 items-center max-h-24 ml-8 cursor-pointer py-6" onClick={() => router.push("/")}>
                    <img
                      src="/logo.svg"
                      alt="Logo"
                      className="h-12 w-auto rounded-md"
                    />
                    <div className="text-6xl font-bold hidden lg:block pl-3" style={{ fontFamily: '"Novecento WideBold", sans-serif' }}>
                      XWAN.<span className="text-[#eb7020]" style={{ fontFamily: 'sans-serif' }}>AI</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <img
                      src={leftImageUrl}
                      alt=""
                      className="inset-0 w-full h-auto object-cover z-1 t-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80 backdrop-blur-sm z-10" />
                    <div className="absolute bottom-3 left-10 z-20 pointer-events-auto">
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
                    </div>
                  </div>
                </>
              ) : (
                isChatRoute ? <ChatHistorySidebar /> : <LeftMenu />
              )}
            </aside>
            <div className={`flex-1 flex flex-col min-w-0 lg:max-w-[calc(100%-var(--left-width))]${isChatRoute ? " lg:h-screen lg:overflow-hidden" : ""}`}>
              <Navbar />
              {isChatRoute ? (
                <main className="flex-1 h-full relative lg:overflow-hidden flex flex-col">
                  {children}
                </main>
              ) : (
                children
              )}
              {/* <Footer /> */}
              <div className="lg:hidden">
                {isChatRoute ? <ChatHistorySidebar inlineHidden /> : <LeftMenu inlineHidden />}
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
