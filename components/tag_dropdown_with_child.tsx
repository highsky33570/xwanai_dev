"use client";

import { Tag } from "@/lib/app_interface";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useState } from "react";



interface Props {
  tags: Tag[];
  selectedTagLabel?: string;
  onSelect: (tag: Tag, parents: string[]) => void;
  selectedParent?: Tag | null;
  selectedChild?: Tag | null;
  onParentChange: (tag: Tag | null) => void;
  onChildChange: (tag: Tag | null) => void;
}

export const getAllChildNames = (tag: Tag | null): string[] => {
  if (!tag?.child || tag.child.length === 0) return [];

  const result: string[] = [];

  const walk = (children: Tag[]) => {
    children.forEach((c) => {
      result.push(c?.name);
      if (c.child?.length) {
        walk(c.child);
      }
    });
  };

  walk(tag.child);
  return result;
};

export default function TagDropdownWithChild({ tags,
  selectedParent,
  selectedChild,
  onSelect,
  onParentChange,
  onChildChange, }: Props) {
  // const [parent, setParent] = useState<Tag | null>(null);
  // const [child, setChild] = useState<Tag | null>(null);

  return (
    <div className="flex gap-3">
      {/* ================= Parent Select ================= */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="border border-[#EB7020] px-4 py-2 rounded min-w-[160px] flex justify-between items-center gap-2">
          <span>{selectedParent?.name ?? "全部"}</span>
          {tags.length > 0 && (
            <ChevronDownIcon className="w-4 h-4 opacity-70" />
          )}
        </DropdownMenu.Trigger>

        <DropdownMenu.Content className="bg-white shadow rounded p-1 min-w-[160px] z-50">
          {tags.map((tag) => (
            <DropdownMenu.Item
              key={tag.name}
              className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
              onSelect={() => {
                onParentChange(tag);
                onChildChange(null); // reset child
                onSelect(tag, []);
              }}
            >
              {tag.name}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      {/* ================= Child Select (hidden if no parent) ================= */}
      {selectedParent && selectedParent.child && selectedParent.child.length > 0 && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="border border-[#EB7020] px-4 py-2 rounded min-w-[160px] flex items-center justify-between gap-2">
            <span>{selectedChild?.name ?? "全部"}</span>

            <ChevronDownIcon className="w-4 h-4 opacity-70" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Content className="bg-white shadow rounded p-1 min-w-[160px] z-50">
            {selectedParent.child.map((c) => (
              <DropdownMenu.Item
                key={c.name}
                className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                onSelect={() => {
                  onChildChange(c);
                  onSelect(c, [parent.name]);
                  // onSelect(c, getAllChildNames(c));
                }}
              >
                {c.name}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}
    </div>
  );
}
