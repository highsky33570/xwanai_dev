"use client";

import type React from "react";

import { Avatar, Chip, Button } from "@heroui/react";
import { Eye, EyeOff, Edit3, Check, Heart } from "lucide-react";
import { useTranslation } from "@/lib/utils/translations";

interface CharacterCardDatabaseProps {
  id: string;
  username: string;
  updatedTime: string;
  characterName: string;
  description: string;
  characterImage?: string;
  userAvatar?: string;
  tags?: string[];
  visibility: "public" | "private";
  data_type: "virtual" | "real";
  onClick: () => void;
  onEdit: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  isFromFavorite?: boolean; // ✨ 新增：是否是收藏的角色
  processingStatus?: string | null; // 🎯 角色处理状态
}

export default function CharacterCardDatabase({
  id,
  username,
  updatedTime,
  characterName,
  description,
  characterImage,
  userAvatar,
  tags = [],
  visibility,
  data_type,
  onClick,
  onEdit,
  isSelectionMode = false,
  isSelected = false,
  isFromFavorite = false,
  processingStatus = null,
}: CharacterCardDatabaseProps) {
  const { t } = useTranslation();

  const handleEditClick = () => {
    onEdit();
  };

  const getCardClassName = () => {
    const baseClass =
      "w-full hover:shadow-lg transition-all duration-200 cursor-pointer relative border border-foreground/10 rounded-xl overflow-hidden shadow-sm";

    if (isSelectionMode) {
      if (isSelected) {
        return `${baseClass} bg-primary/20 border-primary/40 ring-2 ring-primary/50`;
      } else {
        return `${baseClass} bg-content2 hover:bg-primary/10 hover:border-primary/30 hover:ring-1 hover:ring-primary/30`;
      }
    }

    return `${baseClass} bg-content2 hover:bg-content3`;
  };

  const getEditButtonIcon = () => {
    if (isSelectionMode) {
      return isSelected ? (
        <Check className="w-4 h-4" />
      ) : (
        <div className="w-4 h-4 border border-white/40 rounded" />
      );
    }
    return <Edit3 className="w-4 h-4" />;
  };

  const getEditButtonClassName = () => {
    const baseClass =
      "absolute top-2 right-2 z-10 opacity-70 hover:opacity-100";

    if (isSelectionMode) {
      if (isSelected) {
        return `${baseClass} text-primary bg-primary/20`;
      } else {
        return `${baseClass} text-white/60 hover:text-white`;
      }
    }

    return `${baseClass} text-white`;
  };

  return (
    <div 
      className={getCardClassName()}
      onClick={(e) => {
        onClick();
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="p-4 min-h-28">
        {/* Edit/Selection Button or Favorite Badge or Processing Status */}
        {isSelectionMode ? (
          <div 
            className={`${getEditButtonClassName()} pointer-events-none`}
          >
            {/* 🎯 复选框只是视觉元素，点击会冒泡到卡片 */}
            {getEditButtonIcon()}
          </div>
        ) : isFromFavorite ? (
          <div className="absolute top-2 right-2 z-10">
            <Chip
              size="sm"
              variant="flat"
              startContent={<Heart className="w-3 h-3 fill-current" />}
              className="bg-rose-500/90 text-white backdrop-blur-sm"
            >
              {t("database.cardFavorite")}
            </Chip>
          </div>
        ) : processingStatus === false ? (
          <div className="absolute top-2 right-2 z-10">
            <Chip
              size="sm"
              variant="flat"
              className="bg-warning/90 text-white backdrop-blur-sm"
            >
              {t("database.cardPending")}
            </Chip>
          </div>
        ) : null}

        <div className="flex items-start gap-4">
          {/* Character Avatar */}
          <Avatar
            src={characterImage}
            name={characterName}
            size="lg"
            className="flex-shrink-0"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <span className="text-white text-lg">👤</span>
              </div>
            }
          />

          <div className="flex-1 min-w-0">
            {/* Character Name */}
            <h3
              className={`text-lg font-semibold mb-2 truncate ${
                isSelected ? "text-primary" : "text-white"
              }`}
            >
              {characterName}
            </h3>

            {/* Description */}
            <p className="text-sm text-white/60 mb-3 line-clamp-2">
              {description}
            </p>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.slice(0, 3).map((tag, index) => (
                  <Chip
                    key={index}
                    size="sm"
                    variant="flat"
                    className="bg-primary/20 text-primary"
                  >
                    {tag}
                  </Chip>
                ))}
                {tags.length > 3 && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="bg-content2 text-white/60"
                  >
                    +{tags.length - 3}
                  </Chip>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Data Type */}
                <Chip
                  size="sm"
                  variant="flat"
                  className={
                    data_type === "virtual"
                      ? "bg-secondary/20 text-secondary"
                      : "bg-primary/20 text-primary"
                  }
                >
                  {data_type === "virtual"
                    ? t("database.virtual")
                    : t("database.real")}
                </Chip>

                {/* Visibility */}
                <div className="flex items-center gap-1">
                  {visibility === "public" ? (
                    <Eye className="w-4 h-4 text-success" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-warning" />
                  )}
                  <span className="text-xs text-white/50 capitalize">
                    {visibility === "public"
                      ? t("database.public")
                      : t("database.private")}
                  </span>
                </div>
              </div>

              {/* Updated Time or Selection Mode Indicator */}
              {isSelectionMode ? (
                <div className="text-xs text-white/40">
                  {isSelected
                    ? t("database.cardSelected")
                    : t("database.cardClickToSelect")}
                </div>
              ) : (
                <div className="text-xs text-white/40">{updatedTime}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
