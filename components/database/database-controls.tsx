"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
} from "@heroui/react";
import {
  Search,
  Filter,
  SortAsc,
  Sparkles,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@/lib/utils/translations";

interface DatabaseControlsProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: string[]) => void;
  onSortChange: (sortBy: string) => void;
  onSynastryReading: () => void;
  isSelectionMode?: boolean;
  selectedCount?: number;
  onCancelSelection?: () => void;
  // 删除模式相关
  isDeletionMode?: boolean;
  deletionCount?: number;
  onDeleteCharacters?: () => void;
  onEnterDeletionMode?: () => void;
  onCreateCharacter?: () => void;
}

export default function DatabaseControls({
  onSearch,
  onFilterChange,
  onSortChange,
  onSynastryReading,
  isSelectionMode = false,
  selectedCount = 0,
  onCancelSelection,
  isDeletionMode = false,
  deletionCount = 0,
  onDeleteCharacters,
  onEnterDeletionMode,
  onCreateCharacter,
}: DatabaseControlsProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recent");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterToggle = (filter: string) => {
    const newFilters = activeFilters.includes(filter)
      ? activeFilters.filter((f) => f !== filter)
      : [...activeFilters, filter];

    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    onSortChange(newSortBy);
  };

  const filterOptions = [
    { key: "public", label: t("database.public") },
    { key: "private", label: t("database.private") },
    { key: "virtual", label: t("database.virtual") },
    { key: "real", label: t("database.real") },
  ];

  const sortOptions = [
    { key: "recent", label: t("database.mostRecent") },
    { key: "name", label: t("database.nameAZ") },
    { key: "oldest", label: t("database.oldestFirst") },
  ];

  const getSynastryButtonText = () => {
    if (!isSelectionMode) return t("database.createSynastryReading");
    if (selectedCount === 0) return t("database.selectTwoCharacters");
    if (selectedCount === 1) return t("database.selectOneMore");
    return t("database.startSynastryReading");
  };

  const getSynastryButtonClass = () => {
    if (!isSelectionMode) {
      return "bg-content2 text-white hover:bg-content2/80";
    }
    if (selectedCount === 2) {
      return "bg-primary text-background hover:bg-primary/90";
    }
    return "bg-content2 text-white/60 cursor-not-allowed";
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <Input
          placeholder={t("database.searchPlaceholder")}
          value={searchQuery}
          onValueChange={handleSearchChange}
          startContent={<Search className="w-4 h-4 text-foreground-400" />}
          className="flex-1"
          classNames={{
            input: "bg-transparent",
            inputWrapper:
              "bg-content1 border border-white/10 hover:border-white/20",
          }}
        />
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Dropdown */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              startContent={<Filter className="w-4 h-4" />}
              className="bg-content1 border border-white/10 hover:border-white/20"
            >
              {t("database.filter")}
              {activeFilters.length > 0 && (
                <Chip size="sm" className="ml-1 bg-primary/20 text-primary">
                  {activeFilters.length}
                </Chip>
              )}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Filter options"
            closeOnSelect={false}
            selectedKeys={activeFilters}
            selectionMode="multiple"
            onSelectionChange={(keys) => {
              const newFilters = Array.from(keys as Set<string>);
              setActiveFilters(newFilters);
              onFilterChange(newFilters);
            }}
            className="bg-content1"
          >
            {filterOptions.map((option) => (
              <DropdownItem key={option.key} className="text-white">
                {option.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        {/* Sort Dropdown */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              startContent={<SortAsc className="w-4 h-4" />}
              className="bg-content1 border border-white/10 hover:border-white/20"
            >
              {sortOptions.find((opt) => opt.key === sortBy)?.label ||
                t("database.sort")}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Sort options"
            selectedKeys={[sortBy]}
            selectionMode="single"
            onSelectionChange={(keys) => {
              const newSortBy = Array.from(keys as Set<string>)[0];
              if (newSortBy) {
                handleSortChange(newSortBy);
              }
            }}
            className="bg-content1"
          >
            {sortOptions.map((option) => (
              <DropdownItem key={option.key} className="text-white">
                {option.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        {/* Synastry Reading Button - 隐藏在删除模式下 */}
        {!isDeletionMode && (
          <Button
            startContent={<Sparkles className="w-4 h-4" />}
            onClick={onSynastryReading}
            disabled={isSelectionMode && selectedCount !== 2}
            className={getSynastryButtonClass()}
          >
            {getSynastryButtonText()}
          </Button>
        )}

        {/* Delete Button - 隐藏在合盘选择模式下 */}
        {!isSelectionMode && onEnterDeletionMode && (
          <Button
            startContent={<Trash2 className="w-4 h-4" />}
            onClick={isDeletionMode ? onDeleteCharacters : onEnterDeletionMode}
            disabled={isDeletionMode && deletionCount === 0}
            className={
              isDeletionMode
                ? deletionCount > 0
                  ? "bg-danger text-white hover:bg-danger/90"
                  : "bg-content2 text-white/60 cursor-not-allowed"
                : "bg-content2 text-white hover:bg-content2/80"
            }
          >
            {isDeletionMode
              ? deletionCount > 0
                ? t("database.deleteCharacters").replace(
                    "{count}",
                    String(deletionCount)
                  )
                : t("database.selectCharactersToDelete")
              : t("database.deleteCharacter")}
          </Button>
        )}

        {/* Create Character Button */}
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          className="ml-auto"
          onPress={onCreateCharacter}
        >
          {t("database.createCharacter")}
        </Button>

        {/* Cancel Selection Button (visible in selection mode or deletion mode) */}
        {(isSelectionMode || isDeletionMode) && onCancelSelection && (
          <Button
            variant="flat"
            startContent={<X className="w-4 h-4" />}
            onClick={onCancelSelection}
            className="bg-danger/20 text-danger hover:bg-danger/30"
          >
            {t("database.cancel")}
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Chip
              key={filter}
              onClose={() => handleFilterToggle(filter)}
              variant="flat"
              className="bg-primary/20 text-primary"
            >
              {filterOptions.find((opt) => opt.key === filter)?.label || filter}
            </Chip>
          ))}
        </div>
      )}

      {/* Selection Mode Indicator */}
      {isSelectionMode && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("database.synastrySelectionMode").replace(
                "{count}",
                String(selectedCount)
              )}
            </span>
          </div>
          <p className="text-xs text-primary/70 mt-1">
            {t("database.synastrySelectionHint")}
          </p>
        </div>
      )}

      {/* Deletion Mode Indicator */}
      {isDeletionMode && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-danger">
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("database.deletionMode").replace(
                "{count}",
                String(deletionCount)
              )}
            </span>
          </div>
          <p className="text-xs text-danger/70 mt-1">
            {t("database.deletionModeHint")}
          </p>
        </div>
      )}
    </div>
  );
}
