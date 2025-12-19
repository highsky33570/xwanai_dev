"use client";

import { Card, CardBody, Divider, Chip, Avatar } from "@heroui/react";
import PaipanCard from "@/components/chat/paipan-card";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import { User, Calendar, MapPin, Brain, Sparkles, Clock } from "lucide-react";

interface CharacterDetailPayload {
  card_id?: string;
  data?: {
    basic_bazi?: {
      id?: string;
      related_id?: string;
      name?: string;
      gender?: string;
      birthday_utc8?: string;
      birthplace?: string;
      mbti?: string;
      paipan?: any;
    };
    character?: {
      id?: string;
      name?: string;
      gender?: string;
      avatar_id?: string | null;
      auth_id?: string | null;
    };
  };
}

export default function CharacterDetailCard({
  detail,
}: {
  detail: CharacterDetailPayload;
}) {
  const basic = detail?.data?.basic_bazi || {};
  const character = detail?.data?.character || {};

  const displayName = basic.name || character.name || "Unknown";
  const displayGender = (
    basic.gender ||
    character.gender ||
    "unknown"
  ).toString();
  const displayBirthday = basic.birthday_utc8 || "-";
  const displayBirthplace = basic.birthplace || "-";
  const displayMbti = basic.mbti || "-";
  const characterId = character.id || basic.related_id || "";
  const paipan = basic.paipan;

  const avatarUrl =
    getAvatarPublicUrl(character.avatar_id, character.auth_id) ||
    "/placeholder-user.jpg";

  // Format birthday for better display
  const formattedBirthday =
    displayBirthday !== "-"
      ? new Date(displayBirthday).toLocaleDateString("en_US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";

  return (
    <div className="w-full group">
      {/* Main Card Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-content2/40 via-content2/30 to-content2/20 backdrop-blur-sm border border-foreground/8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50"></div>

        {/* Content */}
        <div className="relative p-6 space-y-6">
          {/* Enhanced Header Section */}
          <div className="flex items-start gap-5">
            <div className="relative">
              <Avatar
                src={avatarUrl}
                name={displayName}
                size="lg"
                className="flex-shrink-0 ring-3 ring-primary/30 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <User className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent truncate">
                  {displayName}
                </h3>
                <Chip
                  size="sm"
                  variant="solid"
                  color="primary"
                  className="capitalize font-semibold shadow-md"
                  startContent={<Sparkles className="w-3 h-3" />}
                >
                  {displayGender}
                </Chip>
              </div>
              {characterId && (
                <div className="inline-flex items-center gap-2 text-xs text-foreground-500 font-mono bg-foreground/8 px-3 py-1.5 rounded-full border border-foreground/10">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                  ID: {characterId.slice(0, 8)}...
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group/item space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground-600 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-primary/70" />
                Birthday
              </div>
              <div className="text-sm font-semibold bg-gradient-to-r from-content2/60 to-content2/40 px-4 py-3 rounded-xl border border-foreground/8 shadow-sm hover:shadow-md transition-all duration-200 group-hover/item:border-primary/20">
                {formattedBirthday}
              </div>
            </div>
            <div className="group/item space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground-600 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-primary/70" />
                Birthplace
              </div>
              <div className="text-sm font-semibold bg-gradient-to-r from-content2/60 to-content2/40 px-4 py-3 rounded-xl border border-foreground/8 shadow-sm hover:shadow-md transition-all duration-200 group-hover/item:border-primary/20 break-words">
                {displayBirthplace}
              </div>
            </div>
            <div className="group/item space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground-600 uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5 text-primary/70" />
                MBTI Personality
              </div>
              <div className="text-sm font-semibold bg-gradient-to-r from-content2/60 to-content2/40 px-4 py-3 rounded-xl border border-foreground/8 shadow-sm hover:shadow-md transition-all duration-200 group-hover/item:border-primary/20">
                {displayMbti}
              </div>
            </div>
          </div>

          {/* Enhanced Bazi Section */}
          {paipan && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent uppercase tracking-wide">
                    Bazi Analysis
                  </div>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent rounded-full"></div>
              </div>
              <div className="bg-content2/20 rounded-xl p-4 border border-foreground/5">
                <PaipanCard paipan={paipan} variant="flat" />
              </div>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-xl opacity-60"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-lg opacity-40"></div>
      </div>
    </div>
  );
}
