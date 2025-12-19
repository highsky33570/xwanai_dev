"use client";

import { Tag } from "@/lib/app_interface";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon } from "@radix-ui/react-icons";



interface Props {
  tags: Tag[];
  selectedTagLabel?: string;
  onSelect: (tag: Tag | null, parents: string[]) => void;
}

export default function TagDropdown({ tags, selectedTagLabel, onSelect }: Props) {
  // Recursive renderer
  const renderItems = (items: Tag[], parents: string[] = []) => {
    return items.map((tag) => {
      const currentParents = [...parents];

      // === If has children → make SubMenu ===
      if (tag.child && tag.child.length > 0) {
        return (
          <DropdownMenu.Sub key={tag.name}>
            <DropdownMenu.SubTrigger className="flex items-center justify-between px-2 py-1 cursor-pointer">
              {tag.name}
              <ChevronRightIcon />
            </DropdownMenu.SubTrigger>

            <DropdownMenu.SubContent className="bg-[#fff]  shadow-md rounded p-1">
              {renderItems(tag.child, [...currentParents, tag.name])}
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        );
      }

      // === Leaf Item ===
      return (
        <DropdownMenu.Item
          key={tag.name}
          onSelect={() => {
            onSelect(tag, currentParents)
            const fullPath = [...currentParents, tag.name].join(" / ");
            // setSelectedLabel(fullPath);
          }}
          className="px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
        >
          {tag.name}
        </DropdownMenu.Item>
      );
    });
  };

  return (
    <DropdownMenu.Root >
      <DropdownMenu.Trigger className=" border border-[#EB7020] 
          // bg-[#ababac] 
          bg-transparent 
          px-4 py-2 
          rounded-md 
          text-sm
          shadow-sm
          hover:bg-[#EB7020]
          hover:bg-opacity-50
          cursor-pointer
          flex items-center justify-between
          min-w-[180px] gap-5">
        <span className="truncate">
          {selectedTagLabel || "全部"}
        </span>
        {/* Clear button */}
        {selectedTagLabel && selectedTagLabel !== "全部" && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(null, []);
            }}
            className="text-gray-400 hover:text-red-500 flex-shrink-0"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content className="bg-[#fff] shadow-md rounded p-1 min-w-[180px] z-50">
        {renderItems(tags)}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
