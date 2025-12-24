"use client";

import { useMemo, useEffect, useState } from "react";
import { Card, CardBody, Button, Avatar, Chip } from "@heroui/react";
import { MessageCircle, Plus, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useUserData } from "@/hooks/use-data-queries";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import { formatTimeOnly } from "@/lib/utils/timeFormatter";
import LogoLeft from "../common/Logo_Left";

interface ChatHistorySidebarProps {
  onCreate?: () => void;
  inlineHidden?: boolean;
}

export default function ChatHistorySidebar({ onCreate, inlineHidden }: ChatHistorySidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { characters, sessions } = useUserData();
  const [isOpen, setIsOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    document.addEventListener("openChatHistorySidebar", open);
    document.addEventListener("closeChatHistorySidebar", close);
    return () => {
      document.removeEventListener("openChatHistorySidebar", open);
      document.removeEventListener("closeChatHistorySidebar", close);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById("app-navbar");
      if (el) setNavHeight(el.offsetHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, { character: any | null; sessions: any[] }> = {};
    sessions.forEach((s: any) => {
      const cid = Array.isArray(s.character_ids) && s.character_ids.length > 0 ? s.character_ids[0] : "unknown";
      if (!map[cid]) {
        map[cid] = {
          character: characters.find((c: any) => c.id === cid) || null,
          sessions: [],
        };
      }
      map[cid].sessions.push(s);
    });
    return map;
  }, [sessions, characters]);

  return (
    <>
      <div className={`relative w-full bg-transparent h-full flex flex-col ${inlineHidden ? 'hidden' : ''}`}>
        <div className="relative z-10 lg:px-8 px-3 py-6">
          <LogoLeft />
          {/* <div className=" flex space-y-1 items-center max-h-24 mt-8 cursor-pointer" onClick={() => router.push("/")}>
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-12 w-auto rounded-md"
            />
            <div className="text-6xl font-bold hidden lg:block pl-3" style={{ fontFamily: '"Novecento WideBold", sans-serif' }}>
              XWAN.<span className="text-[#eb7020]" style={{ fontFamily: 'sans-serif' }}>AI</span>
            </div>
          </div> */}
          <div className="relative z-10 flex flex-col gap-3 mt-5">
            <Button
              color="primary"
              // className="flex-1 rounded-full bg-gradient-to-tr from-gray-200 via-white text-black"
              className="flex-1 rounded-full bg-gray-200 text-black w-full p-3"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => (onCreate ? onCreate() : document.dispatchEvent(new CustomEvent('openModeSelection')))}
            >
              创建角色
            </Button>
            <Button
              color="primary"
              className="flex-1 rounded-full bg-gray-200 text-black w-full p-3"
              startContent={<img src="/yin-yang-octagon.png" alt="" className="w-4 h-4" />}
              onPress={() => router.push("/database")}
            >
              命盘分析
            </Button>
          </div>
        </div>
        <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 lg:px-8 px-3">
          {Object.entries(grouped).map(([cid, group]) => {
            const activeSessionId = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;
            const isGroupActive = !!activeSessionId && group.sessions.some((s: any) => s.id === activeSessionId);
            const isExpanded = !!openGroups[cid];
            const showSessions = isExpanded || isGroupActive;
            return (
              <div key={cid}>
                <div className={`rounded-2xl ${isGroupActive ? "p-[2px] bg-[radial-gradient(circle_at_100%_0,rgba(235,112,32,0.45),rgba(235,112,32,0)_55%)]" : ""}`}>
                  <Card className="rounded-2xl bg-gray-100 w-full" isPressable onPress={() => setOpenGroups((prev) => ({ ...prev, [cid]: !prev[cid] }))}>
                    <CardBody className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={getAvatarPublicUrl(group.character?.avatar_id, group.character?.auth_id) || "/placeholder-user.jpg"}
                          name={group.character?.name || "Unknown"}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">
                              {group.character?.name || "未关联角色"}
                            </p>
                            {group.character && group.character.is_report_ready === false && (
                              <Chip size="sm" variant="flat" className="text-xs h-5 px-2 bg-gray-300 text-white">待生成</Chip>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
                {showSessions && (
                  <div className="mt-2 space-y-2 pl-10">
                    {group.sessions.slice(0, 3).map((s: any) => {
                      const isActive = !!activeSessionId && s.id === activeSessionId;
                      return (
                        <Card
                          key={s.id}
                          isPressable
                          onPress={() => router.push(`/chat/${s.id}`)}
                          className={isActive ? " w-full rounded-xl bg-gray-200 shadow-sm" : " w-full rounded-xl bg-transparent shadow-none"}
                        >
                          <CardBody className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <MessageCircle
                                className={isActive ? "w-4 h-4 text-foreground-500" : "w-4 h-4 text-foreground-400"}
                              />
                              <span
                                className={isActive ? "text-sm text-black truncate" : "text-sm text-foreground-400 truncate"}
                              >
                                {s.title || `${group.character?.name || "会话"} ${formatTimeOnly(s.update_time, "zh-CN").replace(":", "")}`}
                              </span>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isOpen && (
        <div className="fixed left-0 right-0 bottom-0 z-[9998] bg-black/30" style={{ top: navHeight }} onClick={() => setIsOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-80 border-r border-gray-200 p-8 bg-white text-black overflow-y-auto" style={{ backgroundImage: 'url(/left-background.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/60 via-white/25 to-white/60 z-0" />
            <div className="relative z-10">
              <div className="flex space-y-1 z-20 items-center max-h-24 mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/"); }}>
                <img src="/logo.svg" alt="Logo" className="h-12 w-auto rounded-md" />
                <div className="text-6xl font-bold hidden lg:block" style={{ fontFamily: '"Novecento WideBold", sans-serif' }}>
                  XWAN.<span className="text-[#eb7020]" style={{ fontFamily: 'sans-serif' }}>AI</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-5">
                <Button color="primary" className="flex-1 rounded-full bg-gray-200 text-black w-full p-3" startContent={<Plus className="w-4 h-4" />} onPress={() => (onCreate ? onCreate() : document.dispatchEvent(new CustomEvent('openModeSelection')))}>创建角色</Button>
                <Button color="primary" className="flex-1 rounded-full bg-gray-200 text-black w-full p-3" startContent={<img src="/yin-yang-octagon.png" alt="" className="w-4 h-4" />} onPress={() => router.push("/database")}>命盘分析</Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.entries(grouped).map(([cid, group]) => {
                  const activeSessionId = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;
                  const isGroupActive = !!activeSessionId && group.sessions.some((s: any) => s.id === activeSessionId);
                  const isExpanded = !!openGroups[cid];
                  const showSessions = isExpanded || isGroupActive;
                  return (
                    <div key={cid}>
                      <div className={`rounded-2xl ${isGroupActive ? "p-[2px] bg-[radial-gradient(circle_at_100%_0,rgba(235,112,32,0.45),rgba(235,112,32,0)_55%)]" : ""}`}>
                        <Card isPressable onPress={() => setOpenGroups((prev) => ({ ...prev, [cid]: !prev[cid] }))} className="rounded-2xl bg-gray-100 w-full">
                          <CardBody className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={getAvatarPublicUrl(group.character?.avatar_id, group.character?.auth_id) || "/placeholder-user.jpg"} name={group.character?.name || "Unknown"} size="sm" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground truncate">{group.character?.name || "未关联角色"}</p>
                                  {group.character && group.character.is_report_ready === false && (
                                    <Chip size="sm" variant="flat" className="text-xs h-5 px-2 bg-gray-300 text-white">待生成</Chip>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                      {showSessions && (
                        <div className="mt-2 space-y-2 pl-10">
                          {group.sessions.slice(0, 3).map((s: any) => {
                            const isActive = !!activeSessionId && s.id === activeSessionId;
                            return (
                              <Card key={s.id} isPressable onPress={() => router.push(`/chat/${s.id}`)} className={isActive ? " w-full rounded-xl bg-gray-200 shadow-sm" : " w-full rounded-xl bg-transparent shadow-none"}>
                                <CardBody className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className={isActive ? "w-4 h-4 text-foreground-500" : "w-4 h-4 text-foreground-400"} />
                                    <span className={isActive ? "text-sm text-black truncate" : "text-sm text-foreground-400 truncate"}>
                                      {s.title || `${group.character?.name || "会话"} ${formatTimeOnly(s.update_time, "zh-CN").replace(":", "")}`}
                                    </span>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
