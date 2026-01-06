"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  Input,
  Textarea,
  Chip,
  Avatar,
  Spinner,
} from "@heroui/react";
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { databaseOperations } from "@/lib/supabase/database";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/lib/supabase/types";

type Character = Database["public"]["Tables"]["characters"]["Row"];

export default function CharacterDesignerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const characterId = searchParams.get("id");

  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    visibility: "public" as "public" | "private",
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (characterId) {
      loadCharacter(characterId);
    } else {
      setError("No character ID provided");
      setIsLoading(false);
    }
  }, [characterId]);

  const loadCharacter = async (id: string) => {
    logger.info(
      {
        module: "character_designer",
        operation: "load_character",
        data: { characterId: id },
      },
      "Loading character for designer"
    );

    try {
      const { character, error } = await databaseOperations.getCharacterById(
        id
      );

      if (error || !character) {
        setError(error?.message || "Character not found");
        logger.error(
          {
            module: "character_designer",
            operation: "load_character",
            error,
            data: { characterId: id },
          },
          "Failed to load character"
        );
        return;
      }

      setCharacter(character);
      setFormData({
        name: character.name,
        description: character.description || "",
        tags: character.tags || [],
        visibility: character.visibility,
      });

      logger.success(
        {
          module: "character_designer",
          operation: "load_character",
          data: {
            characterId: character.id,
            characterName: character.name,
          },
        },
        "Character loaded successfully"
      );
    } catch (error) {
      setError("Failed to load character");
      logger.error(
        {
          module: "character_designer",
          operation: "load_character",
          error,
          data: { characterId: id },
        },
        "Unexpected error loading character"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const updatedTags = [...formData.tags, newTag.trim()];
      setFormData((prev) => ({ ...prev, tags: updatedTags }));
      setNewTag("");

      logger.info(
        {
          module: "character_designer",
          operation: "add_tag",
          data: { tag: newTag.trim(), totalTags: updatedTags.length },
        },
        "Tag added to character"
      );
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = formData.tags.filter((tag) => tag !== tagToRemove);
    setFormData((prev) => ({ ...prev, tags: updatedTags }));

    logger.info(
      {
        module: "character_designer",
        operation: "remove_tag",
        data: { tag: tagToRemove, remainingTags: updatedTags.length },
      },
      "Tag removed from character"
    );
  };

  const handleSave = async () => {
    if (!character) return;

    logger.info(
      {
        module: "character_designer",
        operation: "save_character",
        data: {
          characterId: character.id,
          characterName: formData.name,
          tagsCount: formData.tags.length,
        },
      },
      "Saving character updates"
    );

    setIsSaving(true);
    setError(null);

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        visibility: formData.visibility,
        metadata: {
          ...character.metadata,
          last_updated_via: "designer",
          design_completed: true,
        },
      };

      const { character: updatedCharacter, error } =
        await databaseOperations.updateCharacter(character.id, updateData);

      if (error || !updatedCharacter) {
        setError(error?.message || "Failed to save character");
        logger.error(
          {
            module: "character_designer",
            operation: "save_character",
            error,
            data: { characterId: character.id },
          },
          "Failed to save character"
        );
        return;
      }

      setCharacter(updatedCharacter);

      logger.success(
        {
          module: "character_designer",
          operation: "save_character",
          data: {
            characterId: updatedCharacter.id,
            characterName: updatedCharacter.name,
          },
        },
        "Character saved successfully"
      );

      // Show success feedback (you could add a toast here)
      setTimeout(() => {
        router.push("/database");
      }, 1000);
    } catch (error) {
      setError("Failed to save character");
      logger.error(
        {
          module: "character_designer",
          operation: "save_character",
          error,
          data: { characterId: character.id },
        },
        "Unexpected error saving character"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-foreground-600">Loading character...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <h2 className="text-xl font-semibold text-danger mb-2">Error</h2>
            <p className="text-foreground-600 mb-4">{error}</p>
            <Button as={Link} href="/" color="primary">
              Back to Home
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          as={Link}
          href="/database"
          variant="ghost"
          startContent={<ArrowLeft className="w-4 h-4" />}
          className="text-foreground-600 hover:text-foreground"
        >
          Back to Database
        </Button>

        <Button
          color="primary"
          startContent={<Save className="w-4 h-4" />}
          onPress={handleSave}
          isLoading={isSaving}
          isDisabled={!formData.name.trim()}
        >
          {isSaving ? "Saving..." : "Save Character"}
        </Button>
      </div>

      {/* Character Info Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Avatar
            src={character?.avatar_url || undefined}
            size="lg"
            name={formData.name || "Character"}
            className="w-16 h-16"
          />
          <div>
            <h1 className="text-3xl font-title font-bold text-primary">
              Character Designer
            </h1>
            <p className="text-foreground-600">
              Complete your character's details
            </p>
          </div>
        </div>

        {character && (
          <div className="flex items-center gap-4 text-sm text-foreground-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {character.birth_date
                  ? new Date(character.birth_date).toLocaleDateString()
                  : "No date"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{character.birth_location || "No location"}</span>
            </div>
            <div className="flex items-center gap-1">
              {character.visibility === "public" ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span className="capitalize">{character.visibility}</span>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Character Name */}
        <Input
          label="Character Name"
          placeholder="Enter character name"
          value={formData.name}
          onValueChange={(value) => handleInputChange("name", value)}
          isRequired
          variant="bordered"
          startContent={<User className="w-4 h-4 text-foreground-400" />}
          isDisabled={isSaving}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Describe your character's background, personality, and story..."
          value={formData.description}
          onValueChange={(value) => handleInputChange("description", value)}
          variant="bordered"
          minRows={4}
          maxRows={8}
          isDisabled={isSaving}
        />

        {/* Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              value={newTag}
              onValueChange={setNewTag}
              onKeyPress={(e) => e.key === "Enter" && addTag()}
              variant="bordered"
              size="sm"
              isDisabled={isSaving}
            />
            <Button
              onPress={addTag}
              variant="bordered"
              size="sm"
              isDisabled={!newTag.trim() || isSaving}
            >
              Add
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  onClose={() => removeTag(tag)}
                  variant="flat"
                  size="sm"
                  isDisabled={isSaving}
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Character Stats/Info */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">
              Character Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground-600">
                  Type
                </label>
                <p className="capitalize">{character?.data_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-600">
                  Created
                </label>
                <p>
                  {character?.created_at
                    ? new Date(character.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-600">
                  Birth Date
                </label>
                <p>
                  {character?.birth_date
                    ? new Date(character.birth_date).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-600">
                  Birth Location
                </label>
                <p>{character?.birth_location || "Not set"}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
