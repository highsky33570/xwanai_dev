"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@heroui/react";
// import DatabaseControls from "@/components/database/database-controls";
import CharacterEditModal from "@/components/character/character-edit-modal";
import { authOperations } from "@/lib/supabase/auth";
import { databaseOperations } from "@/lib/supabase/database";
import { logger } from "@/lib/utils/logger";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import { useCharacterCategories } from "@/hooks/use-data-queries";
import {
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/types";
import { useCreateHepanSession } from "@/hooks/use-session-mutations";
import { toast } from "sonner";
import { Trash2, ChevronDown } from "lucide-react";
import FeaturedCharacterCard from "@/components/character/featured-character-card";
import ModeSelectionModal from "@/components/modals/mode-selection-modal";
import { useTranslation } from "@/lib/utils/translations";
import { Search, Plus, X } from "lucide-react";

type CharacterData = Tables<"characters">;

interface DisplayCharacterData {
  id: string;
  username: string;
  updatedTime: string;
  characterName: string;
  description: string;
  characterImage?: string;
  userAvatar?: string;
  starsign?: string;
  birthdate?: string;
  tags?: string[];
  visibility: "public" | "private";
  data_type: "virtual" | "real";
  isFromFavorite?: boolean; // ✨ 新增：是否是收藏的角色
  category_id?: number;
}

const getCategoryIconUrl = (iconName: string | null | undefined) => {
  if (!iconName) return null
  if (iconName.startsWith("http") || iconName.startsWith("/")) return iconName
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/character_category/${iconName}.svg`
}

export default function PersonalCharacterDatabase() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { data: categories = [] } = useCharacterCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filters, setFilters] = useState<string[]>([]);
  const [characters, setCharacters] = useState<DisplayCharacterData[]>([]);
  const [rawCharacters, setRawCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // New filter bar states
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeList, setActiveList] = useState<string>("celebrity");

  const celebrityCategory = categories.find((c: any) => c.name === "CELEBRITY");
  const categoryOptions = categories
    .filter((c: any) => c.parent_id === celebrityCategory?.id)
    .map((c: any) => ({
      key: String(c.id),
      label: c.name,
      icon: getCategoryIconUrl(c.icon_url) || "/celebrity/Pop.svg"
    }));

  const categoryLabel = (
    categoryOptions.find((o: any) => o.key === activeCategory)?.label || "POP CULTURE"
  ).toUpperCase();
  const categoryIcon = categoryOptions.find((o: any) => o.key === activeCategory)?.icon;

  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setActiveCategory(topicParam);
    } else if (categoryOptions.length > 0 && !activeCategory) {
      setActiveCategory(categoryOptions[0].key);
    }
  }, [searchParams, categoryOptions, activeCategory]);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(null);

  // Synastry reading state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [isCreatingHepanSession, setIsCreatingHepanSession] = useState(false);

  // Deletion state
  const [isDeletionMode, setIsDeletionMode] = useState(false);
  const [charactersToDelete, setCharactersToDelete] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create character modal state
  const [showCreateModal, setShowCreateModal] = useState(false);

  // React Query hook for creating hepan session
  const createHepanSession = useCreateHepanSession();

  // Load user and characters on component mount
  useEffect(() => {
    loadUserAndCharacters();
  }, []);

  // Removed isSelectionMode dependency on selectedCharacters to allow manual toggle


  const loadUserAndCharacters = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = await authOperations.getCurrentUser();

      if (!currentUser) {
        logger.warn(
          { module: "database", operation: "loadUserAndCharacters" },
          "No authenticated user found, redirecting to login"
        );
        router.push("/login");
        return;
      }

      setUser(currentUser);

      const { data: userCharacters, error: charactersError } =
        await databaseOperations.getUserCharacters(currentUser.id);

      if (charactersError) {
        logger.error(
          {
            module: "database",
            operation: "loadUserAndCharacters",
            error: charactersError,
            data: {
              userId: currentUser.id,
              errorDetails: {
                message: charactersError.message,
                code: charactersError.code,
                details: charactersError.details,
                hint: charactersError.hint,
              },
            },
          },
          "Failed to load user characters from database"
        );
        setError(
          `Database Error: ${
            charactersError.message || "Failed to load your characters"
          }`
        );
        return;
      }

      // Ensure userCharacters is an array
      const charactersArray = userCharacters || [];
      setRawCharacters(charactersArray);

      // Transform Supabase data to component format
      const transformedCharacters: DisplayCharacterData[] = charactersArray.map(
        (char, index) => {
          const transformed = {
            id: char.id,
            username:
              currentUser.user_metadata?.username ||
              currentUser.email?.split("@")[0] ||
              "You",
            updatedTime: formatRelativeTime(
              char.updated_at || char.created_at || ""
            ),
            characterName: char.name,
            description:
              char.description || t("database.noDescriptionProvided"),
            characterImage: getAvatarPublicUrl(char.avatar_id, char.auth_id),
            userAvatar: currentUser.user_metadata?.avatar_url || undefined,
            starsign: undefined, // No birth date in characters table according to .definitionrc
            birthdate: undefined, // No birth date in characters table according to .definitionrc
            tags: char.tags || [],
            visibility: char.access_level as "public" | "private",
            data_type: char.data_type,
            isFromFavorite: !!(char as any).character_metadata?.original_character_id, // ✅ 正确检查收藏标记
            processingStatus: char.is_report_ready, // 🎯 使用 is_report_ready 字段（true=完成，false=待生成）
            category_id: (char as any).category_id,
          };

          return transformed;
        }
      );

      setCharacters(transformedCharacters);
    } catch (error) {
      logger.error(
        {
          module: "database",
          operation: "loadUserAndCharacters",
          error,
          data: {
            errorType: typeof error,
            errorMessage:
              error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          },
        },
        "Unexpected error loading user data"
      );
      setError(
        `Unexpected Error: ${
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return t("sidebar.unknown");

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInHours < 1) {
        return t("home.justNow");
      } else if (diffInHours < 24) {
        const hourKey = diffInHours === 1 ? "home.hourAgo" : "home.hoursAgo";
        return `${diffInHours} ${t(hourKey)}`;
      } else if (diffInDays < 7) {
        const dayKey = diffInDays === 1 ? "home.dayAgo" : "home.daysAgo";
        return `${diffInDays} ${t(dayKey)}`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      logger.warn(
        {
          module: "database",
          operation: "formatRelativeTime",
          error,
          data: { dateString },
        },
        "Error formatting relative time"
      );
      return t("sidebar.unknown");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    logger.info(
      {
        module: "database",
        operation: "handleSearch",
        data: { query },
      },
      "Search query updated"
    );
  };

  const handleFilterChange = (newFilters: string[]) => {
    setFilters(newFilters);
    logger.info(
      {
        module: "database",
        operation: "handleFilterChange",
        data: { filters: newFilters },
      },
      "Filters updated"
    );
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    logger.info(
      {
        module: "database",
        operation: "handleSortChange",
        data: { sortBy: newSortBy },
      },
      "Sort order updated"
    );
  };

  const handleSynastryReading = async () => {
    if (selectedCharacters.length === 2) {
      // Proceed with hepan reading
      logger.info(
        {
          module: "database",
          operation: "handleSynastryReading",
          data: { selectedCharacters },
        },
        "Starting hepan reading with selected characters"
      );

      // 获取选中角色的名称
      const selectedCharNames = rawCharacters
        .filter((char) => selectedCharacters.includes(char.id))
        .map((char) => char.name);

      // 显示 loading UI
      setIsCreatingHepanSession(true);

      // 使用 react-query mutation 创建 hepan session
      createHepanSession.mutate(
        {
          character_ids: selectedCharacters,
          character_names: selectedCharNames,
        },
        {
          onSuccess: (result) => {
            logger.success(
              {
                module: "database",
                operation: "handleSynastryReading",
                data: { sessionId: result.sessionId },
              },
              "Hepan session created successfully"
            );

            // react-query 会自动调用 router.push 通过 Store.session.createAndSwitchSession
            // 所以这里不需要手动跳转
            // loading UI 会在页面跳转时自动消失
          },
          onError: () => {
            // 如果出错，隐藏 loading UI
            setIsCreatingHepanSession(false);
          },
        }
      );
    }
  };

  // const handleCharacterClick = (character: DisplayCharacterData) => {
  //   if (isDeletionMode) {
  //     // Handle character selection for deletion
  //     handleDeletionSelection(character.id);
  //   } else {
  //     // Normal character click behavior
  //     logger.info(
  //       {
  //         module: "database",
  //         operation: "handleCharacterClick",
  //         data: {
  //           characterId: character.id,
  //           characterName: character.characterName,
  //         },
  //       },
  //       "Character clicked"
  //     );
  //     router.push(`/character/info?id=${character.id}`);
  //   }
  // };

  const handleCardNavigate = (character: DisplayCharacterData) => {
    logger.info(
      {
        module: "database",
        operation: "handleCardNavigate",
        data: { characterId: character.id, characterName: character.characterName },
      },
      "Navigating to character info"
    );
    router.push(`/character/info?id=${character.id}`);
  };

  const handleCharacterSelection = (characterId: string) => {
    setSelectedCharacters((prev) => {
      if (prev.includes(characterId)) {
        // Deselect character
        const newSelection = prev.filter((id) => id !== characterId);
        logger.info(
          {
            module: "database",
            operation: "handleCharacterSelection",
            data: { characterId, action: "deselect", newSelection },
          },
          "Character deselected for synastry reading"
        );
        return newSelection;
      } else if (prev.length < 2) {
        // Select character (max 2)
        const newSelection = [...prev, characterId];
        logger.info(
          {
            module: "database",
            operation: "handleCharacterSelection",
            data: { characterId, action: "select", newSelection },
          },
          "Character selected for synastry reading"
        );
        return newSelection;
      }
      return prev;
    });
  };

  // const handleCharacterEdit = (character: DisplayCharacterData) => {
  //   if (isDeletionMode) {
  //     // In deletion mode, edit button acts as deletion selection toggle
  //     handleDeletionSelection(character.id);
  //   } else if (isSelectionMode || selectedCharacters.length > 0) {
  //     // In selection mode, edit button acts as selection toggle
  //     handleCharacterSelection(character.id);
  //   } else {
  //     // Open edit modal
  //     logger.info(
  //       {
  //         module: "database",
  //         operation: "handleCharacterEdit",
  //         data: {
  //           characterId: character.id,
  //           characterName: character.characterName,
  //         },
  //       },
  //       "Opening character edit modal"
  //     );

  //     // Find the raw character data for the modal
  //     const rawCharacter = rawCharacters.find(
  //       (char) => char.id === character.id
  //     );
  //     if (rawCharacter) {
  //       setSelectedCharacter(rawCharacter);
  //       setIsEditModalOpen(true);
  //     }
  //   }
  // };

  const handleCharacterUpdated = () => {
    // Refresh the character list after successful update
    loadUserAndCharacters();
  };

  // 删除模式相关函数
  const handleEnterDeletionMode = () => {
    logger.info(
      { module: "database", operation: "handleEnterDeletionMode" },
      "Entering deletion mode"
    );
    setIsDeletionMode(true);
    setCharactersToDelete([]);
  };

  // const handleDeletionSelection = (characterId: string) => {
  //   setCharactersToDelete((prev) => {
  //     if (prev.includes(characterId)) {
  //       // Deselect character
  //       const newSelection = prev.filter((id) => id !== characterId);
  //       logger.info(
  //         {
  //           module: "database",
  //           operation: "handleDeletionSelection",
  //           data: { characterId, action: "deselect", newSelection },
  //         },
  //         "Character deselected for deletion"
  //       );
  //       return newSelection;
  //     } else {
  //       // Select character
  //       const newSelection = [...prev, characterId];
  //       logger.info(
  //         {
  //           module: "database",
  //           operation: "handleDeletionSelection",
  //           data: { characterId, action: "select", newSelection },
  //         },
  //         "Character selected for deletion"
  //       );
  //       return newSelection;
  //     }
  //   });
  // };

  // const handleDeleteCharacters = () => {
  //   if (charactersToDelete.length === 0) return;

  //   logger.info(
  //     {
  //       module: "database",
  //       operation: "handleDeleteCharacters",
  //       data: { count: charactersToDelete.length, ids: charactersToDelete },
  //     },
  //     "Opening delete confirmation modal"
  //   );

  //   setShowDeleteConfirmModal(true);
  // };

  // const handleCancelDeletion = () => {
  //   logger.info(
  //     { module: "database", operation: "handleCancelDeletion" },
  //     "Canceling deletion mode"
  //   );
  //   setIsDeletionMode(false);
  //   setCharactersToDelete([]);
  //   setShowDeleteConfirmModal(false);
  // };

  const confirmDelete = async () => {
    if (charactersToDelete.length === 0) return;

    try {
      setIsDeleting(true);

      logger.info(
        {
          module: "database",
          operation: "confirmDelete",
          data: { count: charactersToDelete.length, ids: charactersToDelete },
        },
        "Starting character deletion"
      );

      // 删除每个选中的角色及其相关的 sessions
      const deletePromises = charactersToDelete.map(async (characterId) => {
        // 1. 先删除相关的 sessions
        const { error: sessionsError } =
          await databaseOperations.deleteSessionsByCharacterId(characterId);
        if (sessionsError) {
          logger.warn(
            {
              module: "database",
              operation: "confirmDelete",
              error: sessionsError,
              data: { characterId },
            },
            "Failed to delete character sessions (continuing with character deletion)"
          );
          // 不抛出错误，继续删除角色
        }

        // 2. 删除角色
        const { error } = await databaseOperations.deleteCharacter(characterId);
        if (error) {
          logger.error(
            {
              module: "database",
              operation: "confirmDelete",
              error,
              data: { characterId },
            },
            "Failed to delete character"
          );
          throw error;
        }
        return characterId;
      });

      await Promise.all(deletePromises);

      logger.success(
        {
          module: "database",
          operation: "confirmDelete",
          data: { count: charactersToDelete.length },
        },
        "Characters deleted successfully"
      );

      toast.success(
        t("database.deleteSuccess").replace(
          "{count}",
          String(charactersToDelete.length)
        ),
        {
          description: t("database.deleteSuccessDesc"),
          duration: 3000,
        }
      );

      // 重置状态并刷新列表
      setIsDeletionMode(false);
      setCharactersToDelete([]);
      setShowDeleteConfirmModal(false);
      await loadUserAndCharacters();
    } catch (error) {
      logger.error(
        { module: "database", operation: "confirmDelete", error },
        "Failed to delete characters"
      );
      toast.error(t("database.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    logger.info(
      { module: "database", operation: "handleRefresh" },
      "Refreshing character data"
    );
    loadUserAndCharacters();
  };

  const handleCancelSelection = () => {
    logger.info(
      { module: "database", operation: "handleCancelSelection" },
      "Cancelling synastry selection mode"
    );
    setSelectedCharacters([]);
    setIsSelectionMode(false);
  };

  // Filter and sort characters based on current state
  const filteredCharacters = characters
    .filter((character) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          character.characterName.toLowerCase().includes(query) ||
          character.description.toLowerCase().includes(query) ||
          character.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter((character) => {
      // Additional filters
      if (filters.length === 0) return true;

      return filters.some((filter) => {
        switch (filter) {
          case "public":
            return character.visibility === "public";
          case "private":
            return character.visibility === "private";
          case "virtual":
            return character.data_type === "virtual";
          case "real":
            return character.data_type === "real";
          default:
            return character.tags?.includes(filter);
        }
      });
    })
    .filter((character) => {
      // Category filter
      if (activeCategory) {
        // Convert both to string to be safe
        return String(character.category_id) === activeCategory;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.updatedTime).getTime() -
            new Date(a.updatedTime).getTime()
          );
        case "name":
          return a.characterName.localeCompare(b.characterName);
        case "oldest":
          return (
            new Date(a.updatedTime).getTime() -
            new Date(b.updatedTime).getTime()
          );
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <DatabaseSkeleton />
      // <div className="w-full h-screen flex items-center justify-center bg-transparent">
      //   <div className="text-center space-y-4">
      //     <Spinner size="lg" color="primary" />
      //     <div className="text-foreground-600">{t("database.loading")}</div>
      //   </div>
      // </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-content1">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <img
              src="/character_database_logo.svg"
              alt="Error"
              className="w-12 h-12 opacity-60"
            />
          </div>
          <div className="text-danger text-lg font-semibold">
            {t("database.errorLoading")}
          </div>
          <div className="text-foreground-600 text-sm bg-danger/10 p-4 rounded-lg border border-danger/20">
            {error}
          </div>
          <div className="text-xs text-foreground-400">
            {t("database.errorCheckConsole")}
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t("database.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-full">
        <div className="relative z-10 p-6">
          <div className="rounded-3xl">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                  <Button
                    variant="solid"
                    className="bg-[#EB7020] text-white"
                    onPress={() => {
                      if (isSelectionMode) {
                        setIsSelectionMode(false);
                        setSelectedCharacters([]);
                      } else {
                        setIsSelectionMode(true);
                      }
                    }}
                  >
                    {isSelectionMode ? "Disable Selection Mode" : t("database.enterSelectionMode")}
                  </Button>
                  <Button
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={() => setShowCreateModal(true)}
                    className="bg-black/5 text-black"
                  >
                    {t("database.createCharacter")}
                  </Button>
                </div>
                {/* <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="bordered" className="rounded-lg border-[#EB7020] text-[#EB7020] bg-[#EB7020]/10 w-full md:w-auto">
                        {categoryIcon && (
                          <span
                            className="inline-block w-4 h-4 mr-2"
                            style={{
                              WebkitMaskImage: `url(${categoryIcon})`,
                              maskImage: `url(${categoryIcon})`,
                              WebkitMaskSize: "contain",
                              maskSize: "contain",
                              WebkitMaskRepeat: "no-repeat",
                              maskRepeat: "no-repeat",
                              WebkitMaskPosition: "center",
                              maskPosition: "center",
                              backgroundColor: "#EB7020",
                            }}
                          />
                        )}
                        {categoryLabel}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Category"
                      selectedKeys={[activeCategory]}
                      selectionMode="single"
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys as Set<string>)[0];
                        if (value) setActiveCategory(value);
                      }}
                      className="bg-content1"
                    >
                      {categoryOptions.map((opt) => (
                        <DropdownItem
                          key={opt.key}
                          className={opt.key === activeCategory ? "text-[#EB7020] font-semibold rounded-lg border-[#EB7020] bg-[#EB7020]/10" : "text-foreground"}
                          startContent={
                            <span
                              className="inline-block w-4 h-4"
                              style={{
                                WebkitMaskImage: `url(${opt.icon})`,
                                maskImage: `url(${opt.icon})`,
                                WebkitMaskSize: "contain",
                                maskSize: "contain",
                                WebkitMaskRepeat: "no-repeat",
                                maskRepeat: "no-repeat",
                                WebkitMaskPosition: "center",
                                maskPosition: "center",
                                backgroundColor: opt.key === activeCategory ? "#EB7020" : "#6b7280",
                              }}
                            />
                          }
                        >
                          {opt.label}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>

                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="bordered" className="rounded-lg border-[#EB7020] text-[#EB7020] bg-[#EB7020]/10 w-full md:w-auto">
                        ALL PROFILE LISTS
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Lists" className="bg-content1">
                      <DropdownItem key="pop_culture">POP CULTURE</DropdownItem>
                      <DropdownItem key="the_arts">THE ARTS</DropdownItem>
                      <DropdownItem key="musician">MUSICIAN</DropdownItem>
                      <DropdownItem key="philosophy">PHILOSOPHY</DropdownItem>
                      <DropdownItem key="science">SCIENCE</DropdownItem>
                      <DropdownItem key="sports">SPORTS</DropdownItem>
                      <DropdownItem key="business">BUSINESS</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div> */}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full md:w-auto">
                  <Button
                    variant="solid"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={() => {
                      if (isSelectionMode && selectedCharacters.length === 2) {
                        handleSynastryReading();
                      } else {
                        setIsSelectionMode(true);
                      }
                    }}
                    className="rounded-full bg-[#EB7020] text-white w-full sm:w-auto"
                  >
                    {isSelectionMode 
                      ? (selectedCharacters.length === 2 ? "开始混合" : "请选择两个角色")
                      : "选择角色"}
                  </Button>
                  <Button
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={() => setShowCreateModal(true)}
                    className="rounded-full bg-black/10 text-black w-full sm:w-auto"
                  >
                    創建角色
                  </Button>
                  <Button
                    isIconOnly
                    variant="flat"
                    onPress={handleEnterDeletionMode}
                    className="rounded-full bg-black/10 text-black"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 h-auto md:h-8">
                <div className="text-sm text-black/70">
                  {t("database.selectTwoCharactersForSynastry")}
                </div>
                {isSelectionMode && (
                  <Button
                    variant="solid"
                    startContent={<X className="w-4 h-4" />}
                    onPress={handleCancelSelection}
                    className="rounded-full bg-[#EB7020] text-white h-8 px-3 w-full md:w-auto"
                  >
                    {t("database.cancel")}
                  </Button>
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div></div>
                {/* <div className="flex items-center gap-2">
                  <Button
                    variant="solid"
                    className="bg-[#EB7020] text-white"
                    onPress={() => {
                      if (isSelectionMode) {
                        setIsSelectionMode(false);
                        setSelectedCharacters([]);
                      } else {
                        setIsSelectionMode(true);
                      }
                    }}
                  >
                    {isSelectionMode ? "Disable Selection Mode" : t("database.enterSelectionMode")}
                  </Button>
                  <Button
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={() => setShowCreateModal(true)}
                    className="bg-black/5 text-black"
                  >
                    {t("database.createCharacter")}
                  </Button>
                </div> */}

                <div className="flex items-center gap-2">
                  {isSelectionMode && (
                    <Button
                      variant="flat"
                      startContent={<X className="w-4 h-4" />}
                      onPress={() => setSelectedCharacters([])}
                      className="bg-black/5 text-black"
                    >
                      {t("database.clearSelected")}
                    </Button>
                  )}
                  {isSelectionMode && (
                    <Button
                      variant="light"
                      onPress={handleCancelSelection}
                      className="text-black"
                    >
                      {t("database.cancel")}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* <div className="lg:col-span-1 space-y-3">
                  {isSelectionMode && selectedCharacters.length > 0 ? (
                    characters
                      .filter((c) => selectedCharacters.includes(c.id))
                      .map((c) => (
                        <FeaturedCharacterCard
                          key={c.id}
                          data={{ ...c, isSelected: true, name: c.characterName }}
                          isCheckable
                          isClickAble
                          onClick={() => handleCharacterSelection(c.id)}
                        />
                      ))
                  ) : (
                    <div className="rounded-xl border border-black/10 bg-black/5 p-6 text-black/60">
                      {t("database.noSelectedCharacters") || "尚未选择角色"}
                    </div>
                  )}
                </div> */}

                <div className="col-span-3">
                  {characters.length === 0 && !loading ? (
                    <div className="text-center py-12">
                      <div className="text-black/70 text-xl mb-4">
                        {t("database.noCharactersFound")}
                      </div>
                      <div className="text-black/60 text-sm mb-6 max-w-md mx-auto">
                        {t("database.noCharactersFoundDesc")}
                      </div>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-[#EB7020] text-white rounded-lg"
                      >
                        {t("database.createFirstCharacter")}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredCharacters
                        .map((fc) => {
                          const raw = rawCharacters.find((rc) => rc.id === fc.id);
                          if (!raw) return null;
                          const isSelected = selectedCharacters.includes(fc.id);
                          return (
                            <FeaturedCharacterCard
                              key={fc.id}
                              data={{ ...fc, name: fc.characterName }}
                              isCheckable={isSelectionMode}
                              isSelected={isSelected}
                              isClickAble
                              onClick={() => handleCardNavigate(fc)}
                              onToggleSelected={() => handleCharacterSelection(fc.id)}
                            />
                          );
                        })
                        .filter(Boolean)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Character Edit Modal */}
      <CharacterEditModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        character={selectedCharacter}
        onCharacterUpdated={handleCharacterUpdated}
      />

      {/* Hepan Session Creation Loading Overlay */}
      {isCreatingHepanSession && (
        <div className="fixed inset-0 z-[10000] bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center space-y-8 p-8 max-w-md mx-auto">
            {/* 主要加载动画 */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 border-4 border-primary/20 rounded-full animate-spin">
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1"></div>
              </div>
              <div
                className="absolute w-14 h-14 border-3 border-secondary/30 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse" as const,
                  animationDuration: "2s",
                }}
              >
                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-secondary rounded-full transform -translate-x-1/2 -translate-y-0.5"></div>
              </div>
              <div className="w-4 h-4 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
            </div>

            {/* 文字内容 */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t("database.creatingSynastrySession")}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 text-foreground-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse shadow-sm"></div>
                    <span className="text-sm font-medium">
                      {t("database.loadingBaziData")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 text-foreground-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary/70 to-secondary/70 animate-pulse shadow-sm"></div>
                    <span className="text-sm font-medium">
                      {t("database.initializingSynastryEngine")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 text-foreground-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary/50 to-secondary/50 animate-pulse shadow-sm"></div>
                    <span className="text-sm font-medium">
                      {t("database.generatingGreeting")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-foreground-500 font-light">
                  {t("database.preparingSynastryExperience")}
                </p>
              </div>
            </div>

            {/* 装饰性粒子效果 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary/30 rounded-full animate-ping"></div>
              <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary/30 rounded-full animate-ping"></div>
              <div className="absolute top-1/2 left-1/6 w-0.5 h-0.5 bg-primary/40 rounded-full animate-ping"></div>
              <div className="absolute top-1/3 right-1/6 w-0.5 h-0.5 bg-secondary/40 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onOpenChange={setShowDeleteConfirmModal}
        backdrop="blur"
        classNames={{
          base: "bg-content1 border border-danger/20",
          header: "border-b border-danger/20",
          body: "py-6",
          footer: "border-t border-danger/20",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-danger">
                  <Trash2 className="w-5 h-5" />
                  <span>{t("database.confirmDeleteTitle")}</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-foreground">
                    {t("database.aboutToDelete")}{" "}
                    <span className="font-bold text-danger">
                      {charactersToDelete.length}
                    </span>{" "}
                    {t("database.characters")}：
                  </p>

                  <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <ul className="space-y-2">
                      {charactersToDelete.map((id) => {
                        const character = characters.find((c) => c.id === id);
                        return (
                          <li
                            key={id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div className="w-2 h-2 rounded-full bg-danger"></div>
                            <span className="text-foreground">
                              {character?.characterName || "未知角色"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-warning text-xl">⚠️</div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-warning font-semibold">
                          {t("database.deleteWarning")}
                        </p>
                        <ul className="text-xs text-foreground-600 space-y-1 ml-4">
                          <li>{t("database.deleteWarningPermanent")}</li>
                          <li>{t("database.deleteWarningChats")}</li>
                          <li>{t("database.deleteWarningBazi")}</li>
                          <li className="text-danger font-semibold mt-2">
                            {t("database.deleteWarningIrreversible")}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => {
                    onClose();
                    setShowDeleteConfirmModal(false);
                  }}
                  isDisabled={isDeleting}
                  className="bg-content2"
                >
                  {t("database.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={confirmDelete}
                  isLoading={isDeleting}
                  className="font-semibold"
                >
                  {isDeleting
                    ? t("database.deleting")
                    : t("database.confirmDelete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 创建角色弹窗 */}
      <ModeSelectionModal
        isOpen={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSessionCreated={(sessionId) => {
          // 🎯 先跳转，让loading保持显示直到新页面加载
          router.push(`/chat/${sessionId}?just_created=true`);
          // 延迟关闭modal，确保跳转已开始
          setTimeout(() => setShowCreateModal(false), 100);
        }}
      />
    </>
  );
}



export function DatabaseSkeleton() {
  return (
    <div className="relative w-full h-full">
      <div className="relative z-10 p-6">
        <div className="rounded-3xl">
          <div className="p-6 space-y-6">

            {/* ===== Top action row ===== */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div />

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Skeleton className="h-10 w-full sm:w-36 rounded-full" />
                <Skeleton className="h-10 w-full sm:w-28 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>

            {/* ===== Helper text ===== */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <Skeleton className="h-4 w-64 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>

          </div>

          {/* ===== Secondary toolbar ===== */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-40 rounded-lg" />
                <Skeleton className="h-9 w-36 rounded-lg" />
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>

            {/* ===== Card grid ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <CharacterGridSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Card skeleton ---------- */

function CharacterGridSkeleton() {
  return (
    <div className="rounded-2xl  p-4 space-y-1">
      <Skeleton className="h-32 w-full rounded-xl" />
      {/* <Skeleton className="h-5 w-3/4 rounded-full" />
      <Skeleton className="h-4 w-1/2 rounded-full" /> */}
    </div>
  );
}