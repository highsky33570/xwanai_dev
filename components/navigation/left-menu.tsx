"use client"

import { Button, Select, SelectItem } from "@heroui/react"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, ChevronRight } from "lucide-react"
import { useCharacterCategories, useDimensionCategories, useMainCategories } from "@/hooks/use-data-queries"
import { Category } from "@/lib/app_interface"
import { useTranslation } from "@/lib/utils/translations"

interface LeftMenuProps {
  onCreate?: () => void
  inlineHidden?: boolean
}

import { Skeleton } from "@heroui/react";
import LogoLeft from "../common/Logo_Left"
import FooterLeft from "../common/Footer_Left"

export function CategorySkeleton() {
  return (
    <div className="space-y-3">
      {/* Select skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Children list skeleton */}
      {/* <div className="mt-3 rounded-xl border border-gray-300 bg-white p-3 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2"
          >
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-6 w-full rounded-full" />
          </div>
        ))}
      </div> */}
    </div>
  );
}


const getCategoryIconUrl = (iconName: string | null | undefined) => {
  if (!iconName) return null
  if (iconName.startsWith("http") || iconName.startsWith("/")) return iconName
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/character_category/${iconName}.svg`
}

export function findParentCategory(
  categories: Category[],
  targetId: string
): Category | null {
  for (const category of categories) {
    if (!category.children) continue

    // direct child
    if (category.children.some(child => String(child.id) === targetId)) {
      return category
    }

    // deep search
    const found = findParentCategory(category.children, targetId)
    if (found) return found
  }

  return null
}

export default function LeftMenu({ onCreate, inlineHidden }: LeftMenuProps) {
  const router = useRouter()
  const { t } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [navHeight, setNavHeight] = useState(0)
  const { data: mainCategories = [], isLoading: isMainCategories } = useMainCategories();
  const searchParams = useSearchParams();

  // --------------------------------------------------
  // 🔥 Memoize search params (prevents effect loop)
  // --------------------------------------------------
  const modeParam = useMemo(() => searchParams.get("mode"), [searchParams]);
  const categoryParam = useMemo(
    () => searchParams.get("category"),
    [searchParams]
  );

  useEffect(() => {
    const open = () => {
      setIsOpen(true)
      console.log('openLeftMenu');
    }
    const close = () => setIsOpen(false)
    const update = () => {
      const el = document.getElementById("app-navbar")
      if (el) setNavHeight(el.offsetHeight)
    }
    update()
    document.addEventListener("openLeftMenu", open)
    document.addEventListener("closeLeftMenu", close)
    window.addEventListener("resize", update)

    return () => {
      document.removeEventListener("openLeftMenu", open)
      document.removeEventListener("closeLeftMenu", close)
      window.removeEventListener("resize", update)
    }
  }, [])

  useEffect(() => {
    if (!categoryParam) return;
    setSelectedTopic(categoryParam);
  }, [categoryParam])

  useEffect(() => {
    if (!modeParam) return;
    setSelectedParentId(modeParam);
  }, [modeParam])

  useEffect(() => {
    if (!selectedTopic) return

    const parent = findParentCategory(mainCategories, selectedTopic)
    if (parent) {
      setExpandedCategories(prev => new Set(prev).add(String(parent.id)))
    }
  }, [selectedTopic])

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(String(category.id))
    const hasChildren = category.children && category.children.length > 0
    const isActive = selectedTopic === String(category.id)

    // Root level items (like CELEBRITY in the old design, but now generic)
    if (level === 0) {
      return (
        <div key={category.id} className="space-y-2">
          <Button
            variant="bordered"
            className={`w-full justify-between border ${isExpanded ? "border-[#EB7020] text-[#EB7020]" : "border-gray-300"}`}
            endContent={hasChildren ? <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`} /> : null}
            onPress={() => {
              if (hasChildren) {
                toggleCategory(String(category.id))
              } else {
                setSelectedTopic(String(category.id))
                router.push(`/more?category=${category.id}`)
              }
            }}
          >
            {category.name}
          </Button>
          {isExpanded && hasChildren && (
            <div className="rounded-xl border border-gray-300 bg-white text-black p-3 space-y-2">
              <div className="flex flex-col">
                {category.children?.map(child => renderCategory(child, level + 1))}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Child items
    const baseClass = (isActive ? 'inline-flex items-center gap-2 px-2 py-1 rounded bg-[#EB7020]/20 text-[#EB7020] font-semibold' : 'inline-flex items-center gap-2 px-2 py-1 rounded text-gray-700 hover:text-gray-900')
    const iconUrl = getCategoryIconUrl(category.icon_url)

    return (
      <button
        key={category.id}
        className={baseClass}
        onClick={() => {
          setSelectedTopic(String(category.id))
          router.push(`/more?mode=${category.mode_id}&category=${category.id}`)
        }}
      >
        {iconUrl ? (
          <span
            className="inline-block w-4 h-4"
            style={{
              WebkitMaskImage: `url(${iconUrl})`,
              maskImage: `url(${iconUrl})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              backgroundColor: isActive ? '#EB7020' : '#6b7280',
            }}
          />
        ) : (
          // Default icon if none provided
          <span className="w-4 h-4 bg-gray-400 rounded-full" />
        )}
        {category.name}
      </button>
    )
  }

  // 🔥 selected parent (select box value)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    mainCategories[0]?.id ? String(mainCategories[0].id) : null
  )

  const selectedParent = mainCategories.find(
    c => String(c.id) === selectedParentId
  )

  useEffect(() => {
    setSelectedParentId(mainCategories[0]?.id ? String(mainCategories[0].id) : null)
  }, [mainCategories])

  const getCategoryIconUrl = (url?: string) => url

  const renderContent = () => (
    <>
      <LogoLeft />
      <div className="flex gap-3">
        <Button
          color="primary"
          className="flex-1 rounded-full bg-gray-200 text-black"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => (onCreate ? onCreate() : document.dispatchEvent(new CustomEvent('openModeSelection')))}
        >
          {t('home.createCharacter')}
        </Button>
        <Button
          color="primary"
          className="flex-1 rounded-full bg-gray-200 text-black"
          startContent={<img src="/yin-yang-octagon.png" alt="" className="w-4 h-4" />}
          onPress={() => router.push("/database")}
        >
          命盘分析
        </Button>
      </div>

      <div className="my-4 h-px bg-gray-200" />
      <div className="space-y-3">
        {/* {mainCategories.map(category => renderCategory(category))} */}

        {isMainCategories ? (
          <CategorySkeleton />
        ) : (<>
          <Select
            aria-label="Select a category"
            placeholder=""
            variant="bordered"
            items={mainCategories}
            selectedKeys={new Set([selectedParentId ?? ''])}
            classNames={{
              trigger: "data-[focus=true]:border-[#EB7020]",
              value: "text-[#EB7020]",
              // popoverContent: "text-[#EB7020]",
            }}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              setSelectedParentId(selectedKey);
            }}
          >
            {(item: Category) => (
              <SelectItem key={String(item.id)} textValue={item.display_name}>
                {item.display_name}
              </SelectItem>
            )}
          </Select>

          {selectedParent?.children ? (
            selectedParent.children.length > 0 ? (
              <Select
                aria-label="Select a subcategory"
                placeholder="Select a subcategory"
                variant="bordered"
                items={selectedParent.children}
                selectedKeys={selectedTopic ? new Set([selectedTopic]) : new Set()}
                classNames={{
                  trigger: "data-[focus=true]:border-[#EB7020]",
                  value: "text-[#EB7020]",
                }}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  if (selectedKey) {
                    const selectedChild = selectedParent.children?.find(
                      (c: Category) => String(c.id) === selectedKey
                    );
                    if (selectedChild) {
                      setSelectedTopic(selectedKey);
                      router.push(
                        `/more?mode=${selectedChild.mode_id}&category=${selectedChild.id}`
                      );
                    }
                  }
                }}
              >
                {(item: Category) => (
                  <SelectItem key={String(item.id)} textValue={item.display_name || item.name}>
                    {item.display_name || item.name}
                  </SelectItem>
                )}
              </Select>
            ) : null
          ) : (
            <Skeleton className="h-10 w-full rounded-xl mt-3" />
          )}
        </>)}
      </div>
    </>
  )


  return (
    <div className="relative lg:px-8 h-full flex flex-col py-6">
      <div className={inlineHidden ? 'hidden' : 'flex flex-col h-full min-h-0 relative z-10'}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {renderContent()}
        </div>
        <FooterLeft />
        {/* {renderFooter()} */}
      </div>
      {isOpen && (
        <div className="fixed left-0 right-0 bottom-0 z-[9998] bg-black/30" style={{ top: navHeight }} onClick={() => setIsOpen(false)}>
          <aside className="relative left-0 top-0 bottom-0 w-80 border-r border-gray-200 p-8 bg-white text-black flex flex-col" style={{ backgroundImage: 'url(/left-background.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/60 via-white/25 to-white/60 z-0" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto">
                {/* Mobile menu specific header items */}
                <div className="flex items-center gap-3 mb-6">
                  <button aria-label="Tasks" className="p-1 rounded hover:bg-black/5 w-10" onClick={() => { setIsOpen(false); router.push("/database"); }}>
                    <img src="/svg/tab/task.svg" alt="Tasks" className="w-auto h-full" />
                  </button>
                  <button aria-label="chat" className="p-1 rounded hover:bg-black/5 w-10" onClick={() => { setIsOpen(false); router.push("/chat"); }}>
                    <img src="/svg/tab/chat.svg" alt="chat" className="w-auto h-full" />
                  </button>
                  <button aria-label="Settings" className="p-1 rounded hover:bg-black/5 w-10" onClick={() => { setIsOpen(false); router.push("/settings"); }}>
                    <img src="/svg/tab/setting.svg" alt="Settings" className="w-auto h-full" />
                  </button>
                </div>
                {renderContent()}
              </div>
              <FooterLeft />
              {/* {renderFooter()} */}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
