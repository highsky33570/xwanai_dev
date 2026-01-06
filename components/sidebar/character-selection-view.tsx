import { FC } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Avatar,
  Chip,
  Badge,
  Skeleton,
} from "@heroui/react";
import { Search, Plus, ArrowUp, Sparkles } from "lucide-react";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CharacterSelectionViewProps } from "./types";
import { getStarSign, formatBirthday, getCharacterCount } from "./utils";
import { queryKeys, useCharacterSessions } from "@/hooks/use-data-queries";
import { databaseOperations } from "@/lib/supabase/database";

// 🎯 辅助函数：创建新 session
async function createNewSession(character: any): Promise<string> {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://divination.uubb.top";
  const response = await fetch(
    `${API_BASE_URL}/api/character/v1/create-chat-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 🔐 携带cookie进行身份验证
      body: JSON.stringify({
        character_id: character.id,
        title: `与${character.name}的对话`,
      }),
    }
  );

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error(error.detail || "创建对话失败");
    } else {
      const text = await response.text();
      console.error("❌ API返回非JSON响应:", text.substring(0, 200));
      throw new Error("创建对话失败，请稍后重试");
    }
  }

  const data = await response.json();
  return data.session_id;
}

const CharacterSelectionView: FC<CharacterSelectionViewProps> = ({
  searchQuery,
  onSearchChange,
  characters,
  isLoading,
  onSynastrySwitchMode,
  t,
  userId,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="flex flex-col h-full bg-content1">
      {/* Header */}
      <div className="relative p-4 border-b border-foreground/10 bg-content1/95 backdrop-blur-sm">
        <div className="absolute inset-0 bg-content1/50" />

        <div className="relative space-y-4">
          {/* Enhanced Search Bar */}
          <div className="flex flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder={t("sidebar.searchCharacters")}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                startContent={<Search className="w-4 h-4 text-primary/70" />}
                className="flex-1"
                classNames={{
                  input:
                    "bg-content2/80 border-foreground/10 text-foreground placeholder:text-foreground-400",
                  inputWrapper:
                    "bg-content2/80 border-foreground/10 hover:border-primary/30 focus-within:border-primary/60 backdrop-blur-sm transition-all duration-200",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Scrollable Character List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Enhanced Status Section */}
          <div className="flex flex-row items-center justify-between p-3 rounded-xl bg-content2 border border-success/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm font-medium text-success">
                {t("sidebar.today")}
              </span>
            </div>
            <Badge content={characters.length} color="primary" size="sm">
              <span className="text-sm text-foreground-600">
                {getCharacterCount(characters.length, t)}
              </span>
            </Badge>
          </div>

          {/* Enhanced Character Cards */}
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-content2/60">
                    <CardBody className="p-4">
                      <div className="flex flex-row gap-3">
                        <Skeleton className="rounded-full">
                          <div className="w-12 h-12 bg-default-200" />
                        </Skeleton>
                        <div className="flex-1 space-y-2">
                          <Skeleton className="rounded-lg">
                            <div className="h-4 w-3/4 bg-default-200" />
                          </Skeleton>
                          <Skeleton className="rounded-lg">
                            <div className="h-3 w-1/2 bg-default-200" />
                          </Skeleton>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              : characters
                  .filter((char) =>
                    char.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((character) => (
                    <Card
                      key={character.id}
                      className="group w-full bg-content2 border border-foreground/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                      isPressable
                      onPress={async () => {
                        try {
                          // 检查角色是否完成（使用 is_report_ready 字段）
                          // is_report_ready: true=完成, false=待生成, null/undefined=未知（允许点击）
                          if (character.is_report_ready === false) {
                            toast({
                              title: t("sidebar.characterNotReady"),
                              description: t("sidebar.characterNotReadyDesc"),
                              variant: "destructive",
                            });
                            return;
                          }

                          // 🎯 使用 Supabase 直接查询该角色的 sessions
                          if (!userId) {
                            toast({
                              title: "需要登录",
                              description: "请先登录后再使用此功能",
                              variant: "destructive",
                            });
                            return;
                          }

                          const { data: sessions, error: sessionsError } =
                            await databaseOperations.getSessionsByCharacterId(
                              character.id,
                              userId
                            );

                          let sessionId: string;

                          if (sessionsError) {
                            console.error(
                              "❌ 查询角色sessions失败:",
                              sessionsError
                            );
                            // 查询失败，直接创建新session
                            sessionId = await createNewSession(character);
                          } else if (sessions && sessions.length > 0) {
                            // 使用最新的 session
                            const latestSession = sessions[0];
                            sessionId = latestSession.id;
                          } else {
                            // 没有 session，创建新的
                            sessionId = await createNewSession(character);
                          }

                          // 刷新角色sessions缓存
                          await queryClient.invalidateQueries({
                            queryKey: queryKeys.characterSessions(
                              character.id,
                              userId
                            ),
                          });

                          // 跳转到session
                          router.push(`/chat/${sessionId}`);
                        } catch (error) {
                          console.error("创建角色对话失败:", error);
                          toast({
                            title: t("sidebar.createChatFailed"),
                            description:
                              error instanceof Error
                                ? error.message
                                : t("sidebar.createChatFailedDesc"),
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <CardBody className="p-4">
                        <div className="flex flex-row items-center gap-3">
                          <div className="relative">
                            <Avatar
                              src={getAvatarPublicUrl(
                                character.avatar_id,
                                character.auth_id
                              )}
                              name={character.name}
                              size="md"
                              className="w-12 h-12 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300"
                              fallback={
                                <div className="w-full h-full bg-content2 flex items-center justify-center">
                                  <Sparkles className="w-5 h-5 text-primary/70" />
                                </div>
                              }
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-content1 animate-pulse" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-primary group-hover:text-primary/80 transition-colors duration-200 truncate">
                              {character.name}
                            </h4>
                            <p className="text-sm text-foreground/70 group-hover:text-foreground transition-colors duration-200">
                              {formatBirthday(
                                character.birth_time ||
                                  character.birthday_utc8 ||
                                  null,
                                t
                              )}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <Chip
                              size="sm"
                              variant="flat"
                              className="bg-content2 text-primary border border-primary/30"
                            >
                              {getStarSign(
                                character.birth_time ||
                                  character.birthday_utc8 ||
                                  null,
                                t
                              )}
                            </Chip>
                            {character.is_report_ready === false && (
                              <Chip
                                size="sm"
                                variant="flat"
                                className="bg-warning/90 text-white"
                              >
                                {t("sidebar.pending")}
                              </Chip>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
          </div>
        </div>
      </div>

      {/* Enhanced Action Group */}
      <div className="border-t border-foreground/10 p-4 bg-content2">
        <div className="space-y-3">
          {/* 暂时注释掉合盘功能 */}
          {/* <Button
            className="w-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            startContent={<Plus className="w-4 h-4" />}
            onPress={onSynastrySwitchMode}
            size="lg"
          >
            {t("sidebar.createSynastryReading")}
          </Button> */}
          <Button
            className="w-full bg-warning text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            startContent={<ArrowUp className="w-4 h-4" />}
            size="lg"
          >
            {t("sidebar.upgradeAccount")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectionView;
