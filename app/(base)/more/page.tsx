"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid"

// import DatabaseControls from "@/components/database/database-controls";
import CharacterList from "@/components/database/character-list";
import CharacterEditModal from "@/components/character/character-edit-modal";
import { authOperations } from "@/lib/supabase/auth";
import { databaseOperations, TagFilters } from "@/lib/supabase/database";
import { logger } from "@/lib/utils/logger";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";
import { queryKeys, useCharacterCategories, useDimensionCategories, useGetCharactersByMultipleTag, useGetCharactersByTag, useMainCategories } from "@/hooks/use-data-queries";
import {
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  CardFooter,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";

import {
  Popover,
} from "radix-ui"

import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/types";
import { useCreateHepanSession } from "@/hooks/use-session-mutations";
import { toast } from "sonner";
import { Trash2, ChevronDown, ArrowUpRight, Search, Filter, ArrowUp, ArrowDown, FunnelPlus, FunnelX, ChevronRight } from "lucide-react";
import CharacterCard from "@/components/character/character-card";
import ModeSelectionModal from "@/components/modals/mode-selection-modal";
import { useTranslation } from "@/lib/utils/translations";
import { Category, Tag } from "@/lib/app_interface";
import TagDropdown from "@/components/tag_dropdown";
import TagDropdownWithChild, { getAllChildNames } from "@/components/tag_dropdown_with_child";
import { useAppGlobal } from "@/lib/context/GlobalContext";
// import { DropdownMenuSub, DropdownMenu as DropdwonMenu_Radix, DropdownMenuItem, DropdownMenuTrigger }  from "@radix-ui/react-dropdown-menu";
// import * as DropdownMenuRadixUI from "@radix-ui/react-dropdown-menu";

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
  processingStatus?: boolean;
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
  const { user } = useAppGlobal();
  const { data: mainCategories = [] } = useMainCategories();
  const { data: dimensionCategories = [] } = useDimensionCategories();
  const [sortBy, setSortBy] = useState("recent");
  const [characters, setCharacters] = useState<DisplayCharacterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [totalCount, setTotalCount] = useState<number>(0);

  // New filter bar states
  const [enableFilter, setEnableFilter] = useState(false);

  // const [activeMainCategory, setActiveMainCategory] = useState<Category | null>(null);
  // const [dimensions, setDimensions] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<Record<string, any>>({});
  const [draftSelectedTags, setDraftSelectedTags] = useState<Record<string, string>>({});
  const [mainTags, setMainTags] = useState<string[]>([]);
  const [selectedParentMain, setSelectedParentMain] = useState<Tag | null>(null);
  const [selectedChildMain, setSelectedChildMain] = useState<Tag | null>(null);

  // --------------------------------------------------
  // 🔥 Memoize search params (prevents effect loop)
  // --------------------------------------------------
  const modeParam = useMemo(() => searchParams.get("mode"), [searchParams]);
  const categoryParam = useMemo(
    () => searchParams.get("category"),
    [searchParams]
  );
  const searchParam = useMemo(() => searchParams.get("search"), [searchParams]);

  const activeMainCategory: Category = useMemo(() => {
    let categories;
    if (!modeParam) {
      categories = mainCategories[0]?.children ?? [];
    } else {
      categories = mainCategories.find((c: Category) => c.id === modeParam)?.children ?? [];
    }
    if (!categoryParam) {
      return categories[0] ?? null;
    } else return categories.find((c: Category) => c.id === categoryParam) ?? null;
  }, [modeParam, categoryParam, mainCategories]);

  const dimensions: Category[] = useMemo(() => {
    let dims;
    if (!modeParam) {
      dims = dimensionCategories[0]?.children ?? [];
    } else {
      dims = dimensionCategories.find((c: Category) => c.id === modeParam)?.children ?? [];
    }
    return dims;
  }, [modeParam, dimensionCategories]);

  const mobileMainSelected = useMemo(() => {
    if (modeParam) return String(modeParam);
    return mainCategories[0] ? String(mainCategories[0].id) : "";
  }, [modeParam, mainCategories]);

  const mobileSubOptions = useMemo(() => {
    if (!mobileMainSelected) return [];
    return mainCategories.find((c: any) => String(c.id) === mobileMainSelected)?.children ?? [];
  }, [mobileMainSelected, mainCategories]);

  useEffect(() => {
    setSelectedTags({});
    setMainTags([]);
    setSelectedParentMain(null)
    setSelectedChildMain(null)
  }, [activeMainCategory])

  // Synastry reading state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  // Deletion state
  const [isDeletionMode, setIsDeletionMode] = useState(false);
  const [charactersToDelete, setCharactersToDelete] = useState<string[]>([]);

  useEffect(() => {
    fetchCharactersByMappingTags();
  }, [activeMainCategory, sortBy, page, mainTags, selectedTags, searchParam])

  const fetchCharactersByMappingTags = async () => {
    console.log(selectedTags);
    // Create a shallow copy of selectedTags
    const pTags = Object.assign({}, selectedTags);
    delete pTags.main;
    delete pTags.mainTags;

    try {
      setLoading(true);
      setError(null);
      const filter: TagFilters = {
        mainC: {
          containerId: activeMainCategory?.id ?? '',
          tags: mainTags ?? []
        },
        pTags: pTags,
        orderBy: {
          column: "created_at",
          ascending: sortBy === "oldest" ? true : false
        },
        nameSearch: searchParam || undefined,
      };
      const { data: mappingCharacters, count, error: charactersError } = await databaseOperations.getTagCharacterMapping(filter, pageSize, page - 1);
      setTotalCount(count || 0);
      
      // Deduplicate by character_id (since tag_character_mapping may return multiple rows per character)
      const uniqueCharacters = new Map<string, any>();
      mappingCharacters.forEach((char: any) => {
        if (!uniqueCharacters.has(char.character_id)) {
          uniqueCharacters.set(char.character_id, char);
        }
      });
      
      // Transform Supabase data to component format
      const transformedCharacters: DisplayCharacterData[] = Array.from(uniqueCharacters.values()).map(
        (char: any, index: number) => {
          const transformed = {
            id: char.character_id,
            username: char.creator_name || "Unknown",
            updatedTime: formatRelativeTime(
              char.updated_at || char.created_at || ""
            ),
            characterName: char.character_name,
            description:
              char.description || t("database.noDescriptionProvided"),
            characterImage: getAvatarPublicUrl(char.avatar_id, char.auth_id),
            userAvatar: char.profiles?.avatar_url || undefined,
            starsign: undefined, // No birth date in characters table according to .definitionrc
            birthdate: undefined, // No birth date in characters table according to .definitionrc
            tags: char.tag_path || [],
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
    }
    catch (error) {

    }
    finally {
      setLoading(false);
    }
  }

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

  const handleCharacterClick = (character: DisplayCharacterData) => {
    if (isSelectionMode) {
      // Handle character selection for synastry reading
      handleCharacterSelection(character.id);
    } else if (isDeletionMode) {
      // Handle character selection for deletion
      handleDeletionSelection(character.id);
    } else {
      // Normal character click behavior
      logger.info(
        {
          module: "database",
          operation: "handleCharacterClick",
          data: {
            characterId: character.id,
            characterName: character.characterName,
          },
        },
        "Character clicked"
      );
      router.push(`/character/info?id=${character.id}`);
    }
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

  const handleDeletionSelection = (characterId: string) => {
    setCharactersToDelete((prev) => {
      if (prev.includes(characterId)) {
        // Deselect character
        const newSelection = prev.filter((id) => id !== characterId);
        logger.info(
          {
            module: "database",
            operation: "handleDeletionSelection",
            data: { characterId, action: "deselect", newSelection },
          },
          "Character deselected for deletion"
        );
        return newSelection;
      } else {
        // Select character
        const newSelection = [...prev, characterId];
        logger.info(
          {
            module: "database",
            operation: "handleDeletionSelection",
            data: { characterId, action: "select", newSelection },
          },
          "Character selected for deletion"
        );
        return newSelection;
      }
    });
  };

  const handleRefresh = () => {
    logger.info(
      { module: "database", operation: "handleRefresh" },
      "Refreshing character data"
    );
    fetchCharactersByMappingTags();
    // loadCharacters();
  };

  // Filter and sort characters based on current state
  // Note: Name filtering is now done at database level, so filteredCharacters = characters
  const filteredCharacters = characters;

  const handleFilteringCharacter = async () => {
    setSelectedTags(draftSelectedTags);
    setIsFilterPopoverOpen(false);
    await fetchCharactersByMappingTags();
  }

  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  useEffect(() => {
    if (isFilterPopoverOpen) {
      setDraftSelectedTags(selectedTags);
    }
  }, [isFilterPopoverOpen]);

  const hasFilter = Object.values(selectedTags).some(
    (v) => v && v.trim() !== ""
  );

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="border-b border-b-dashed border-[#EB7020] pb-2">
            <h3 className="text-4xl font-bold tracking-tight">
              {activeMainCategory?.display_name ?? ''}
            </h3>
            {searchParam && (
              <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>{t("nav.searchResults")}: "{searchParam}"</span>
              </div>
            )}
          </div>

          {/* Mobile main/sub category selectors */}
          <div className="sm:hidden flex grid grid-cols-2 sm:grid-cols-2 gap-2">
            <Select
              aria-label="Select main category"
              placeholder=""
              variant="bordered"
              items={mainCategories}
              selectedKeys={mobileMainSelected ? new Set([mobileMainSelected]) : new Set()}
              classNames={{
                trigger: "data-[focus=true]:border-[#EB7020] data-[open=true]:border-[#EB7020]",
                value: "text-[#EB7020] group-data-[has-value=true]:text-[#EB7020]",
                popoverContent: "border-[#EB7020]/20",
              }}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string | undefined;
                if (selectedKey) {
                  router.push(`/more?mode=${selectedKey}`);
                }
              }}
            >
              {(item: any) => (
                <SelectItem
                  key={String(item.id)}
                  textValue={item.display_name}
                  classNames={{
                    base: "data-[selected=true]:bg-[#EB7020]/10 data-[selected=true]:text-[#EB7020]",
                  }}
                >
                  {item.display_name}
                </SelectItem>
              )}
            </Select>

            <Select
              aria-label="Select subcategory"
              placeholder=""
              variant="bordered"
              items={mobileSubOptions}
              selectedKeys={
                categoryParam
                  ? new Set([categoryParam])
                  : mobileSubOptions[0]
                  ? new Set([String(mobileSubOptions[0].id)])
                  : new Set()
              }
              classNames={{
                trigger: "data-[focus=true]:border-[#EB7020] data-[open=true]:border-[#EB7020]",
                value: "text-[#EB7020] group-data-[has-value=true]:text-[#EB7020]",
                popoverContent: "border-[#EB7020]/20",
              }}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string | undefined;
                if (selectedKey && mobileMainSelected) {
                  router.push(`/more?mode=${mobileMainSelected}&category=${selectedKey}`);
                }
              }}
            >
              {(item: any) => (
                <SelectItem
                  key={String(item.id)}
                  textValue={item.display_name || item.name}
                  classNames={{
                    base: "data-[selected=true]:bg-[#EB7020]/10 data-[selected=true]:text-[#EB7020]",
                  }}
                >
                  {item.display_name || item.name}
                </SelectItem>
              )}
            </Select>
          </div>

          <div className="flex flex-wrap items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-[10px] max-md:w-full">
                <TagDropdownWithChild tags={activeMainCategory?.tags ?? []}
                  onParentChange={setSelectedParentMain}
                  onChildChange={setSelectedChildMain}
                  selectedParent={selectedParentMain}
                  selectedChild={selectedChildMain}
                  onSelect={(tag: Tag | null, parents: string[]) => {
                    const fullPath = [...parents, tag?.name].join(" / ");
                    if (tag?.child) {
                      setMainTags(getAllChildNames(tag));
                    } else {
                      setMainTags([tag?.name ?? '']);
                    }
                    // setSelectedTags(prev => ({
                    //   ...prev,
                    //   main: fullPath,
                    //   // mainTags: (tag?.child && tag?.child.length > 0) ? getAllChildNames(tag) : [tag?.name ?? '']
                    // }));
                  }} />
              </div>
            </div>

            {/* Right: Hot Sort (Asc/Desc) */}
            <div className="flex items-center gap-3">
              <Popover.Root open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen} modal={false}>
                <Popover.Trigger asChild>
                  <Button isIconOnly aria-label="Like"
                    color={hasFilter ? "primary" : "default"}
                    onPress={(e) => {
                      setEnableFilter(!enableFilter);
                    }}>
                    {!hasFilter ? <FunnelX className="w-4 h-4" /> : <FunnelPlus className="w-4 h-4" />}
                  </Button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content side="bottom" align="start" sideOffset={13} onInteractOutside={(e) => {
                    e.preventDefault();
                  }}>
                    <Card>
                      <CardBody className="px-3 py-0">
                        <div className="items-start gap-4 p-4 pt-4 pb-0 m-4 mt-0 mb-0">
                          {dimensions.map((dimension) => {
                            if ((dimension?.children ?? []).length == 0) return <div key={uuidv4()}></div>
                            return (
                              <div className="items-center p-2 pr-0 border-b-1 border-b-solid border-[#EB7020]" key={dimension.id}>
                                <span className="pr-1"> {dimension.display_name}:</span>
                                <div className="justify-start ml-10 grid grid-cols-2 gap-x-6 gap-y-4">
                                  {(dimension?.children ?? []).map((c: Category) => {
                                    // const dropdownKey = `dim-${dimension.id}-cat-${c.id}`;
                                    const dropdownKey = `${c.id}`;
                                    return (
                                      <div className="grid grid-cols-[180px_1fr] items-center ml-2 " key={dropdownKey + "div"}>
                                        <span className="text-right pr-2 whitespace-nowrap">
                                          {c.display_name}:
                                        </span>
                                        <TagDropdown
                                          key={dropdownKey}
                                          tags={c.tags ?? []}
                                          selectedTagLabel={draftSelectedTags[dropdownKey] ?? null}
                                          onSelect={(tag: Tag | null, parents: string[]) => {
                                            console.log("Selected:", tag?.name);
                                            console.log("Parents:", parents);
                                            const fullPath = [...parents, tag?.name].join(" / ");
                                            setDraftSelectedTags((prev) => ({
                                              ...prev,
                                              [dropdownKey]: fullPath,
                                            }));
                                          }} />
                                        {/* <TagDropdown
                                          key={dropdownKey}
                                          tags={c.tags ?? []}
                                          selectedTagLabel={selectedTags[dropdownKey] ?? "All"}
                                          onSelect={(tag: Tag, parents: string[]) => {
                                            console.log("Selected:", tag.name);
                                            console.log("Parents:", parents);
                                            const fullPath = [...parents, tag.name].join(" => ");
                                            setSelectedTags((prev) => ({
                                              ...prev,
                                              [dropdownKey]: fullPath,
                                            }));
                                          }} /> */}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardBody>
                      <CardFooter className="flex justify-end">
                        <Button onPress={handleFilteringCharacter} className="mr-8">Search</Button>
                      </CardFooter>
                    </Card>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
              {hasFilter && (
                <Button
                  isIconOnly
                  aria-label="Clear filters"
                  color="danger"
                  onPress={async () => {
                    setSelectedTags({});
                    setEnableFilter(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}

              {/* <span className="text-small font-medium text-default-500">Hot</span> */}
              <div className="flex items-center bg-default-100 rounded-lg p-1 gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant={sortBy === "oldest" ? "solid" : "light"}
                  color={sortBy === "oldest" ? "primary" : "default"}
                  onPress={() => handleSortChange("oldest")}
                  className="w-8 h-8"
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant={sortBy === "recent" ? "solid" : "light"}
                  color={sortBy === "recent" ? "primary" : "default"}
                  onPress={() => handleSortChange("recent")}
                  className="w-8 h-8"
                >
                  <ArrowDown size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Character Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-danger text-lg font-medium mb-2">{error}</p>
            <Button color="primary" variant="light" onPress={handleRefresh}>
              {t("common.retry")}
            </Button>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
            <p className="text-lg mb-2">{t("database.noCharactersFound")}</p>
            <p className="text-sm">{t("database.tryAdjustingFilters")}</p>
          </div>
        ) : (
          <>
            <div className="h-fit grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {filteredCharacters.map((character) => (
                <CharacterCard
                  key={character.id + uuidv4()}
                  character={character}
                  onClick={() => handleCharacterClick(character)}
                  isSelected={
                    isSelectionMode
                      ? selectedCharacters.includes(character.id)
                      : isDeletionMode
                        ? charactersToDelete.includes(character.id)
                        : false
                  }
                  selectionMode={
                    isSelectionMode
                      ? "synastry"
                      : isDeletionMode
                        ? "deletion"
                        : "none"
                  }
                />
              ))}
            </div>
            {Math.max(1, Math.ceil(totalCount / pageSize)) > 1 ?
              (<div className="flex justify-center mt-8">
                <Pagination
                  total={Math.max(1, Math.ceil(totalCount / pageSize))}
                  page={page}
                  onChange={setPage}
                  initialPage={1}
                  showControls
                />
              </div>) : <></>}
          </>
        )}
      </div>
    </div>
  );
}
