"use client";

import CharacterCardDatabase from "@/components/character/character-card-database";
import { useTranslation } from "@/lib/utils/translations";

interface CharacterData {
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
  isFromFavorite?: boolean; // ✨ 新增：是否是收藏的角色
  processingStatus?: string | null; // 🎯 角色处理状态
}

interface CharacterListProps {
  characters: CharacterData[];
  onCharacterClick: (character: CharacterData) => void;
  onCharacterEdit: (character: CharacterData) => void;
  isSelectionMode?: boolean;
  selectedCharacters?: string[];
}

export default function CharacterList({
  characters,
  onCharacterClick,
  onCharacterEdit,
  isSelectionMode = false,
  selectedCharacters = [],
}: CharacterListProps) {
  const { t } = useTranslation();

  if (characters.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-full flex items-center justify-center">
          <img
            src="/placeholder.svg"
            alt="No Results"
            className="w-8 h-8 opacity-60"
          />
        </div>
        <div className="text-foreground-400 text-lg mb-2">
          {t("database.noMatchingCharacters")}
        </div>
        <div className="text-foreground-300 text-sm">
          {t("database.adjustSearchCriteria")}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
      {characters.map((character) => (
        <CharacterCardDatabase
          key={character.id}
          id={character.id}
          username={character.username}
          updatedTime={character.updatedTime}
          characterName={character.characterName}
          description={character.description}
          characterImage={character.characterImage}
          userAvatar={character.userAvatar}
          tags={character.tags}
          visibility={character.visibility}
          data_type={character.data_type}
          onClick={() => onCharacterClick(character)}
          onEdit={() => onCharacterEdit(character)}
          isSelectionMode={isSelectionMode}
          isSelected={selectedCharacters.includes(character.id)}
          isFromFavorite={character.isFromFavorite}
          processingStatus={character.processingStatus}
        />
      ))}
    </div>
  );
}
