"use client";

import { Card, CardBody } from "@heroui/react";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import type { Tables } from "@/lib/supabase/types";
import { PlusCircle, BookImage } from "lucide-react";
import { useCharacterCategories } from "@/hooks/use-data-queries";

type CharacterData = Tables<"characters"> & {
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

interface CharacterCardProps {
  data?: CharacterData | any;
  character?: any;
  onClick?: (character: any) => void;
  onEdit?: () => void;
  isSelected?: boolean;
  selectionMode?: "synastry" | "deletion" | "none";
}

export default function CharacterCard({ data, character, onClick }: CharacterCardProps) {
  const source: any = data ?? character ?? {};
  const name: string = source.name ?? source.characterName ?? "";
  const avatar_id: string | null = source.avatar_id ?? null;
  const auth_id: string | null = source.auth_id ?? null;
  const profiles = source.profiles ?? (source.username || source.userAvatar
    ? { username: source.username || "Anonymous", avatar_url: source.userAvatar || null }
    : null);
  const { data: categories = [] } = useCharacterCategories();

  const displayName = profiles?.username || "Anonymous";

  const imageSrc = avatar_id
    ? getAvatarPublicUrl(avatar_id, auth_id || null)
    : (source as any).characterImage;

  const getCategoryIconUrl = (iconName: string | null | undefined) => {
    if (!iconName) return null;
    if (iconName.startsWith("http") || iconName.startsWith("/")) return iconName;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/character_category/${iconName}.svg`;
  };

  const categoryId = (source as any).category_id;
  const category = categories.find((c: any) => c.id === categoryId);
  const categoryIcon = getCategoryIconUrl(category?.icon_url);

  return (
    <div className="space-y-1">
      <Card
        isPressable
        shadow="sm"
        className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow w-full"
        onPress={() => onClick?.(source)}
      >
        <CardBody className="p-0">
          <div className="relative w-full aspect-[3/4] bg-content3">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground-400 bg-gradient-to-br from-primary/20 to-primary/40">
                <span className="text-4xl">🎭</span>
              </div>
            )}

            <div className="absolute top-2 right-2">
              <div
                className="flex items-center justify-center h-8 w-8 rounded-md bg-black/40 text-white"
                role="button"
                aria-label="open"
                onClick={(e) => e.stopPropagation()}
              >
                {categoryIcon ? (
                  <span
                    className="inline-block w-4 h-4"
                    style={{
                      WebkitMaskImage: `url(${categoryIcon})`,
                      maskImage: `url(${categoryIcon})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      backgroundColor: "#ffffff",
                    }}
                  />
                ) : (
                  <BookImage className="w-4 h-4" />
                )}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
              <div className="relative text-white">
                <div className="font-semibold text-lg leading-tight drop-shadow-sm">
                  {name}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative inline-block">
                    <img
                      src="/account.png"
                      alt="account"
                      className="h-12 w-auto"
                    />
                    <PlusCircle className="w-5 h-5 absolute -bottom-1 -right-1 text-white bg-[#566FC7] rounded-full p-0.5" />
                  </div>
                  <span className="text-sm">Select Character</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <div className="text-xs text-gray-500 px-3">By @{displayName}</div>
    </div>
  );
}
