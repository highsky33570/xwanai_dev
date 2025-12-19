"use client";

import { useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
  Chip,
  Avatar,
} from "@heroui/react";
import { Plus, Upload, X } from "lucide-react";
import { userAPI } from "@/lib/api/client";
import {
  uploadAvatarToStorage,
  getAvatarPublicUrl,
} from "@/lib/supabase/storage";
import { databaseOperations } from "@/lib/supabase/database";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/lib/supabase/types";

type CharacterData = Tables<"characters">;

interface CharacterEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  character: CharacterData | null;
  onCharacterUpdated: () => void;
}

export default function CharacterEditModal({
  isOpen,
  onOpenChange,
  character,
  onCharacterUpdated,
}: CharacterEditModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gender: "",
    birthday_utc8: "",
    birthplace: "",
    mbti: "",
    tags: [] as string[],
    visibility: "public" as "public" | "private",
    data_type: "virtual_virtual" as
      | "virtual_virtual"
      | "virtual_real"
      | "real_real"
      | "real_virtual",
  });

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form data when character changes
  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name || "",
        description: character.description || "",
        gender: character.gender || "",
        birthday_utc8: character.birthday_utc8
          ? new Date(character.birthday_utc8).toISOString().slice(0, 16)
          : "",
        birthplace: character.birthplace || "",
        mbti: character.mbti || "",
        tags: character.tags || [],
        visibility: character.visibility as "public" | "private",
        data_type: character.data_type as
          | "virtual_virtual"
          | "virtual_real"
          | "real_real"
          | "real_virtual",
      });
      setAvatarId(character.avatar_id);
      setAvatarPreview(getAvatarPublicUrl(character.avatar_id) || null);
    }
  }, [character]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setIsUploadingAvatar(true);

      const { file_id, public_url } = await uploadAvatarToStorage(avatarFile);
      setAvatarId(file_id);
      setAvatarPreview(public_url);

      toast({
        title: "Avatar Uploaded! ✨",
        description: "Your avatar has been uploaded successfully.",
        variant: "default",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload avatar";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Reset avatar state on error
      setAvatarFile(null);
      setAvatarPreview(getAvatarPublicUrl(character?.avatar_id) || null);
      setAvatarId(character?.avatar_id || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!character) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // If user has selected an avatar but hasn't uploaded it yet, upload it first
      if (avatarFile && !avatarId) {
        await handleAvatarUpload();
      }

      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        gender: formData.gender || null,
        birthday_utc8: formData.birthday_utc8
          ? new Date(formData.birthday_utc8).toISOString()
          : null,
        birthplace: formData.birthplace.trim() || null,
        mbti: formData.mbti.trim() || null,
        avatar_id: avatarId,
        tags: formData.tags.length > 0 ? formData.tags : null,
        visibility: formData.visibility,
        data_type: formData.data_type,
      };

      // Update character using database operations
      const { data: updatedCharacter, error: updateError } =
        await databaseOperations.updateCharacter(character.id, updateData);

      if (updateError || !updatedCharacter) {
        throw new Error(updateError?.message || "Failed to update character");
      }

      // Show success toast
      toast({
        title: "Character Updated! ✨",
        description: `${updateData.name} has been successfully updated.`,
        variant: "default",
      });

      // Close modal and refresh parent
      onOpenChange(false);
      onCharacterUpdated();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);

      // Show error toast
      toast({
        title: "Failed to Update Character",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  if (!character) return null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-content1",
        header: "border-b border-white/10",
        body: "py-6",
        footer: "border-t border-white/10",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-primary">Edit Character</h2>
          <p className="text-sm text-foreground-600">
            Update your character's details
          </p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Avatar Upload Section */}
            <Card className="bg-content2">
              <CardBody className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Character Avatar
                </h3>

                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="flex-shrink-0">
                    <Avatar
                      src={avatarPreview || undefined}
                      name={formData.name || "Character"}
                      size="lg"
                      className="w-20 h-20"
                      fallback={
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          <span className="text-white text-2xl">🎭</span>
                        </div>
                      }
                    />
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        startContent={<Upload className="w-4 h-4" />}
                        onPress={() => fileInputRef.current?.click()}
                        isDisabled={isSubmitting}
                      >
                        Choose New Avatar
                      </Button>

                      {avatarFile && (
                        <Button
                          size="sm"
                          color="primary"
                          onPress={handleAvatarUpload}
                          isLoading={isUploadingAvatar}
                          isDisabled={isSubmitting}
                        >
                          {isUploadingAvatar ? "Uploading..." : "Upload"}
                        </Button>
                      )}

                      {avatarPreview && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          startContent={<X className="w-4 h-4" />}
                          onPress={handleRemoveAvatar}
                          isDisabled={isSubmitting}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-foreground-500">
                      {avatarFile
                        ? "⏳ New avatar ready to upload"
                        : avatarPreview
                        ? "Current avatar"
                        : "Upload an image (max 5MB) for your character"}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Basic Information */}
            <Card className="bg-content2">
              <CardBody className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Character Name"
                    placeholder="Enter character name"
                    value={formData.name}
                    onValueChange={(value) => handleInputChange("name", value)}
                    classNames={{
                      input: "bg-content1",
                      inputWrapper: "bg-content1",
                    }}
                  />

                  <Input
                    label="Birthday"
                    type="datetime-local"
                    placeholder="Select birthday"
                    value={formData.birthday_utc8}
                    onValueChange={(value) =>
                      handleInputChange("birthday_utc8", value)
                    }
                    description="Birthday will be converted to UTC timezone"
                    classNames={{
                      input: "bg-content1",
                      inputWrapper: "bg-content1",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Birthplace"
                    placeholder="Enter birthplace"
                    value={formData.birthplace}
                    onValueChange={(value) =>
                      handleInputChange("birthplace", value)
                    }
                    classNames={{
                      input: "bg-content1",
                      inputWrapper: "bg-content1",
                    }}
                  />

                  <Input
                    label="MBTI"
                    placeholder="Enter MBTI type (e.g., INTJ)"
                    value={formData.mbti}
                    onValueChange={(value) => handleInputChange("mbti", value)}
                    classNames={{
                      input: "bg-content1",
                      inputWrapper: "bg-content1",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-700">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Male", "Female", "Non-binary", "Other"].map(
                        (gender) => (
                          <Button
                            key={gender}
                            size="sm"
                            variant={
                              formData.gender === gender.toLowerCase()
                                ? "solid"
                                : "bordered"
                            }
                            color={
                              formData.gender === gender.toLowerCase()
                                ? "primary"
                                : "default"
                            }
                            onPress={() =>
                              handleInputChange("gender", gender.toLowerCase())
                            }
                            className="justify-start"
                          >
                            {gender}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-700">
                      Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Public", "Private"].map((visibility) => (
                        <Button
                          key={visibility}
                          size="sm"
                          variant={
                            formData.visibility === visibility.toLowerCase()
                              ? "solid"
                              : "bordered"
                          }
                          color={
                            formData.visibility === visibility.toLowerCase()
                              ? "primary"
                              : "default"
                          }
                          onPress={() =>
                            handleInputChange(
                              "visibility",
                              visibility.toLowerCase()
                            )
                          }
                          className="justify-start"
                        >
                          {visibility}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Character Details */}
            <Card className="bg-content2">
              <CardBody className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Character Details
                </h3>

                <Textarea
                  label="Description"
                  placeholder="Describe your character's appearance and general traits"
                  value={formData.description}
                  onValueChange={(value) =>
                    handleInputChange("description", value)
                  }
                  minRows={3}
                  classNames={{
                    input: "bg-content1",
                    inputWrapper: "bg-content1",
                  }}
                />
              </CardBody>
            </Card>

            {/* Tags */}
            <Card className="bg-content2">
              <CardBody className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Tags</h3>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={newTag}
                    onValueChange={setNewTag}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    classNames={{
                      input: "bg-content1",
                      inputWrapper: "bg-content1",
                    }}
                  />
                  <Button
                    isIconOnly
                    color="primary"
                    onPress={handleAddTag}
                    isDisabled={!newTag.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        onClose={() => handleRemoveTag(tag)}
                        variant="flat"
                        color="primary"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </ModalBody>

        {error && (
          <div className="px-6 pb-2">
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
              <p className="text-danger text-sm">{error}</p>
            </div>
          </div>
        )}

        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={handleClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!formData.name.trim()}
          >
            {isSubmitting ? "Updating..." : "Update Character"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
