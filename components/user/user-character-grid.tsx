"use client";

import CharacterCard from "@/components/character/character-card";

interface CharacterData {
  id: string;
  username: string;
  updatedTime: string;
  characterName: string;
  description: string;
  characterImage?: string;
  userAvatar?: string;
  visibility: "public" | "private";
  data_type: "virtual" | "real";
}

interface UserCharacterGridProps {
  characters: CharacterData[];
  username?: string;
  onCharacterClick?: (character: CharacterData) => void;
  showTitle?: boolean;
}

export default function UserCharacterGrid({
  characters,
  username,
  onCharacterClick,
  showTitle = false,
}: UserCharacterGridProps) {
  return (
    <div className="space-y-6">
      {showTitle && username && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-title font-semibold text-foreground">
            {username}'s Characters ({characters.length})
          </h2>
        </div>
      )}

      {characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              data={character}
              onClick={onCharacterClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-foreground-400 text-lg mb-2">
            No characters created yet
          </div>
          <div className="text-foreground-300 text-sm">
            {username
              ? `${username} hasn't created any characters yet. Check back later!`
              : "Start building your character collection"}
          </div>
        </div>
      )}
    </div>
  );
}
