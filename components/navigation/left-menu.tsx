"use client"

import { Button, Select, SelectItem, Input, Link } from "@heroui/react"
import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Plus, ChevronRight, Search as SearchIcon, X } from "lucide-react"
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
  const pathname = usePathname()
  const { t } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [, forceUpdate] = useState(0)
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)
  const [navHeight, setNavHeight] = useState(0)
  const [mobileSearch, setMobileSearch] = useState("")
  const [animateIn, setAnimateIn] = useState(false)
  
  // Listen for language changes to force re-render
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate((prev) => prev + 1)
    }
    
    window.addEventListener("languageChange", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])
  
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

  const openPanel = () => {
    setIsOpen(true)
    document.dispatchEvent(new CustomEvent("leftMenuOpened"))
  }

  const closePanel = () => {
    setIsOpen(false)
    document.dispatchEvent(new CustomEvent("leftMenuClosed"))
  }

  // Build URL with search parameter while preserving existing query params
  const buildMoreUrlWithSearch = (searchValue: string) => {
    const params = new URLSearchParams();
    
    // Preserve existing query parameters from current URL if on /more page
    if (pathname === "/more") {
      searchParams.forEach((value, key) => {
        if (key !== "search") {
          params.set(key, value);
        }
      });
    }
    
    // Add search parameter
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    }
    
    const queryString = params.toString();
    return `/more${queryString ? `?${queryString}` : ""}`;
  };

  // Build URL without search parameter while preserving other params
  const buildMoreUrlWithoutSearch = () => {
    const params = new URLSearchParams();
    
    // Preserve existing query parameters except search
    if (pathname === "/more") {
      searchParams.forEach((value, key) => {
        if (key !== "search") {
          params.set(key, value);
        }
      });
    }
    
    const queryString = params.toString();
    return `/more${queryString ? `?${queryString}` : ""}`;
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    closePanel();
  };

  useEffect(() => {
    const open = () => {
      openPanel()
      console.log('openLeftMenu');
    }
    const close = () => closePanel()
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
    if (isOpen) {
      requestAnimationFrame(() => setAnimateIn(true))
    } else {
      setAnimateIn(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!categoryParam) return;
    setSelectedTopic(categoryParam);
  }, [categoryParam])

  // Removed - now handled by useMemo

  useEffect(() => {
    if (!selectedTopic) return

    const parent = findParentCategory(mainCategories, selectedTopic)
    if (parent) {
      setExpandedCategories(prev => new Set(prev).add(String(parent.id)))
    }
  }, [selectedTopic])


  // 🔥 selected parent (select box value)
  // Initialize with null to ensure consistent SSR/hydration
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  // Set initial value from URL param or first category (only once on mount)
  useEffect(() => {
    if (isInitializedRef.current) return; // Only initialize once
    
    if (modeParam) {
      setSelectedParentId(modeParam);
      isInitializedRef.current = true;
    } else if (mainCategories.length > 0) {
      setSelectedParentId(String(mainCategories[0].id));
      isInitializedRef.current = true;
    }
  }, [modeParam, mainCategories]);

  const selectedParent = mainCategories.find(
    c => String(c.id) === selectedParentId
  )

  // Auto-select first child when parent category is selected (only if no category in URL)
  useEffect(() => {
    // Don't auto-select if categoryParam exists (URL has priority)
    if (categoryParam) return;
    
    if (selectedParent?.children && selectedParent.children.length > 0 && !selectedTopic) {
      const firstChild = selectedParent.children[0];
      const firstChildId = String(firstChild.id);
      setSelectedTopic(firstChildId);
      // Navigate to the first child's URL
      if (firstChild.mode_id) {
        if (isInitializedRef.current) return; // Only initialize once
        router.push(`/more?mode=${firstChild.mode_id}&category=${firstChildId}`);
      }
    }
  }, [selectedParent, selectedTopic, categoryParam, router]);

  const getCategoryIconUrl = (url?: string) => url

  const renderContent = () => (
    <>
      <LogoLeft />
      <div className="hidden lg:block">
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
            as={Link}
            // href="/database"
            onPress={() => {
              document.dispatchEvent(new CustomEvent("openPersonalInfoSelection"))
            }}
            className="flex-1 rounded-full bg-gray-200 text-black"
            startContent={<img src="/yin-yang-octagon.png" alt="" className="w-4 h-4" />}
          >
            {t("common.baziAnalysis")}
          </Button>
        </div>

        <div className="my-4 h-px bg-gray-200" />
        <div className="space-y-3">
          {isMainCategories ? (
            <CategorySkeleton />
          ) : (<>
            <Select
              aria-label="Select a category"
              placeholder=""
              variant="bordered"
              items={mainCategories}
              selectedKeys={selectedParentId ? new Set([selectedParentId]) : new Set()}
              disallowEmptySelection
              classNames={{
                trigger: "data-[focus=true]:border-[#EB7020] data-[open=true]:border-[#EB7020]",
                value: "text-[#EB7020] group[data-has-value=true] group-data-[has-value=true]:text-[#EB7020]",
                popoverContent: "border-[#EB7020]/20",
              }}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string | undefined;
                if (selectedKey) {
                  setSelectedParentId(selectedKey);
                  setSelectedTopic(null);
                  router.push(`/more?mode=${selectedKey}`);
                }
              }}
            >
              {(item: Category) => {
                // const translatedName = getCategoryTranslation(item)
                return (
                  <SelectItem 
                    key={String(item.id)} 
                    textValue={t(`categories.${item.display_name}`)}
                    classNames={{
                      base: "data-[selected=true]:bg-[#EB7020]/10 data-[selected=true]:text-[#EB7020]",
                    }}
                  >
                    {t(`categories.${item.display_name}`)}
                  </SelectItem>
                )
              }}
            </Select>

            {selectedParent?.children ? (
              selectedParent.children.length > 0 ? (
                <Select
                  aria-label="Select a subcategory"
                  placeholder=""
                  variant="bordered"
                  items={selectedParent.children}
                  selectedKeys={selectedTopic ? new Set([selectedTopic]) : new Set()}
                  classNames={{
                    trigger: "data-[focus=true]:border-[#EB7020] data-[open=true]:border-[#EB7020]",
                    value: "text-[#EB7020] group-data-[has-value=true]:text-[#EB7020]",
                    popoverContent: "border-[#EB7020]/20",
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
                  {(item: Category) => {
                    // const translatedName = getCategoryTranslation(item)
                    return (
                      <SelectItem 
                        key={String(item.id)} 
                        textValue={t(`categories.${item.display_name}`)}
                        classNames={{
                          base: "data-[selected=true]:bg-[#EB7020]/10 data-[selected=true]:text-[#EB7020]",
                        }}
                      >
                        {t(`categories.${item.display_name}`)}
                      </SelectItem>
                    )
                  }}
                </Select>
              ) : null
            ) : (
              <Skeleton className="h-10 w-full rounded-xl mt-3" />
            )}
          </>)}
        </div>
      </div>
    </>
  )


  // Mobile inline panel (no overlay) - use PC search box structure
  if (inlineHidden) {
    return (
      <div className="lg:hidden w-full px-4">
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={mobileSearch}
                  onValueChange={setMobileSearch}
                  placeholder={t("SEARCH")}
                  radius="lg"
                  variant="bordered"
                  startContent={<SearchIcon className="w-5 h-5 text-[#4d4d4d]" />}
                  endContent={
                    mobileSearch.trim() ? (
                      pathname === "/more" && searchParams.get("search") === mobileSearch.trim() ? (
                        <button
                          onClick={() => {
                            setMobileSearch("");
                            handleNavigation(buildMoreUrlWithoutSearch());
                          }}
                          className="p-1 hover:bg-gray-300 rounded-full transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4 text-gray-700" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleNavigation(buildMoreUrlWithSearch(mobileSearch));
                          }}
                          className="p-1 hover:bg-gray-300 rounded-full transition-colors"
                          aria-label="Search"
                        >
                          <SearchIcon className="w-4 h-4 text-gray-700" />
                        </button>
                      )
                    ) : null
                  }
                  classNames={{
                    input: "text-black placeholder:text-[#4d4d4d] placeholder:opacity-80",
                    inputWrapper: "bg-[#e2e2e5] border-gray-200 rounded-full",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mobileSearch.trim()) {
                      handleNavigation(buildMoreUrlWithSearch(mobileSearch));
                    }
                  }}
                />
              </div>
              <div className="h-px bg-[#e2e2e5]" />
              <div className="flex gap-3">
                <Button
                  color="primary"
                  className="flex-1 rounded-full bg-gray-200 text-black"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={() => {
                    closePanel()
                    if (onCreate) {
                      onCreate()
                    } else {
                      document.dispatchEvent(new CustomEvent("openModeSelection"))
                    }
                  }}
                >
                  {t("home.createCharacter")}
                </Button>
                <Button
                  color="primary"
                  className="flex-1 rounded-full bg-gray-200 text-black"
                  startContent={<img src="/yin-yang-octagon.png" alt="" className="w-4 h-4" />}
                  onPress={() => {
                    closePanel()
                    // router.push("/database")
                    document.dispatchEvent(new CustomEvent("openPersonalInfoSelection"))
                  }}
                >
                  {t("common.baziAnalysis")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col py-4 lg:py-6 lg:px-8 px-3">
      <div className="flex flex-col h-full min-h-0 relative z-10">
        <div className="flex-1 min-h-0 overflow-y-auto">
          {renderContent()}
        </div>
        <FooterLeft />
        {/* {renderFooter()} */}
      </div>
      {isOpen && (
        <div
          className={`fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}
          style={{ paddingTop: navHeight }}
          onClick={() => closePanel()}
        >
          <div
            className={`mx-4 mt-3 rounded-2xl bg-white text-black shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 ease-out ${animateIn ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-3">
              <Input
                value={mobileSearch}
                onValueChange={setMobileSearch}
                placeholder={t("home.searchPlaceholder")}
                radius="lg"
                variant="bordered"
                startContent={<SearchIcon className="w-4 h-4 text-gray-500" />}
                classNames={{
                  input: "text-black placeholder:text-black placeholder:opacity-80",
                  inputWrapper: "bg-gray-100 border-gray-200",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = mobileSearch.trim()
                    setIsOpen(false)
                    router.push(q ? `/more?search=${encodeURIComponent(q)}` : "/more")
                  }
                }}
              />
              <Button
                color="primary"
                className="w-full"
                onPress={() => {
                  const q = mobileSearch.trim()
                  setIsOpen(false)
                  router.push(q ? `/more?search=${encodeURIComponent(q)}` : "/more")
                }}
                endContent={<SearchIcon className="w-4 h-4" />}
              >
                {t("home.searchPlaceholder")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
