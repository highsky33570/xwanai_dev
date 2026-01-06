"use client";

import { useState, useEffect, useRef } from "react";
import { Spinner, Card, CardBody, Button } from "@heroui/react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { observer } from "mobx-react-lite";
import { Store } from "@/store";

// 🔧 动态导入Modal组件，优化性能
const ModeSelectionModal = dynamic(
  () => import("@/components/modals/mode-selection-modal"),
  { ssr: false }
);
import CharacterCard from "@/components/character/character-card";
import FeaturedCharacterCard from "@/components/character/featured-character-card";

// removed embla
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";

import { databaseOperations } from "@/lib/supabase/database";
import { authOperations } from "@/lib/supabase/auth";
import { logger } from "@/lib/utils/logger";
import { useTranslation } from "@/lib/utils/translations";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  useCreateSession,
  useCreatePersonalSession,
} from "@/hooks/use-session-mutations";
import { useAppGlobal } from "@/lib/context/GlobalContext";
import HomeSkeleton from "@/components/common/HomeSkeleton";

interface CharacterData {
  id: string;
  username: string;
  updatedTime: string;
  characterName: string;
  description: string;
  characterImage: string;
  userAvatar: string;
}

interface PageState {
  loading: boolean;
  error: string | null;
  characters: CharacterData[];
  featuredCharacters: CharacterData[];
  user: SupabaseUser | null;
  userLoading: boolean;
}

const HomePage = observer(() => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAppGlobal();
  const [state, setState] = useState<PageState>({
    loading: true,
    error: null,
    characters: [],
    featuredCharacters: [],
    user: null,
    userLoading: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [, forceUpdate] = useState(0);

  // Check user authentication status
  useEffect(() => {
    if (user) {
      Store.user.fetchSubscription();
    }
  }, [user]);

  // Load characters on component mount
  useEffect(() => {
    if (!state.userLoading) {
      loadCharacters();
      loadFeaturedCharacters();
    }
  }, [state.userLoading]);

  // Reload characters when search or filters change
  useEffect(() => {
    if (!state.userLoading) {
      if (searchQuery || filters.length > 0) {
        searchCharacters();
      } else {
        loadCharacters();
      }
    }
  }, [searchQuery, filters, state.userLoading]);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate((prev) => prev + 1);
    };

    window.addEventListener("languageChange", handleLanguageChange);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange);
    };
  }, []);

  const loadCharacters = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      logger.info(
        { module: "homepage", operation: "loadCharacters" },
        "Loading public characters"
      );

      const { data: characters, error } =
        await databaseOperations.getPublicCharacterMetaDatas();

      if (error) {
        logger.error(
          { module: "homepage", operation: "loadCharacters", error },
          "Failed to load public characters"
        );
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load characters. Please try again.",
        }));
        return;
      }

      // Map character_public_data to the format expected by the UI
      // We map 'uuid' to 'id' because uuid is the actual character ID
      // We map 'character_name' to 'name'
      const transformedCharacters = (characters || []).map((char: any) => ({
        ...char,
        id: char.id,
        name: char.name,
        username: char.username,
        // Preserve avatar_id if it exists, otherwise set to null
        avatar_id: char.avatar_id ?? null,
        auth_id: char.auth_id ?? null,
        // Add default/missing fields that might be expected by UI components
        description: char.description ?? "",
        access_level: "public",
      }));

      setState((prev) => ({
        ...prev,
        characters: transformedCharacters as any, // Type assertion to bypass strict check for now
        loading: false,
      }));

      logger.success(
        {
          module: "homepage",
          operation: "loadCharacters",
          data: { count: transformedCharacters.length },
        },
        "Public characters loaded successfully"
      );
    } catch (error) {
      logger.error(
        { module: "homepage", operation: "loadCharacters", error },
        "Unexpected error loading characters"
      );
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load characters. Please try again.",
      }));
    }
  };

  const loadFeaturedCharacters = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data: FeatureCharacters, error } = await databaseOperations.getFeaturedCharacters();
      if (error) {
        logger.error(
          { module: "homepage", operation: "loadFeaturedCharacters", error },
          "Failed to load featured characters"
        );
        setState((prev) => ({ ...prev, loading: false, error: "Failed to load featured characters. Please try again." }));
        return;
      }
      // Map character_public_data to the format expected by the UI
      // We map 'uuid' to 'id' because uuid is the actual character ID
      // We map 'character_name' to 'name'
      const transformedCharacters = (FeatureCharacters || []).map((char: any) => ({
        ...char,
        id: char.id,
        username: char.username,
        name: char.name,
        // Preserve avatar_id if it exists, otherwise set to null
        avatar_id: char.avatar_id ?? null,
        auth_id: char.auth_id ?? null,
        // Add default/missing fields that might be expected by UI components
        description: char.description ?? "",
        access_level: "public",
      }));
      setState((prev: PageState) => ({
        ...prev,
        featuredCharacters: transformedCharacters as unknown as CharacterData[],
        loading: false,
      }));
      logger.success(
        { module: "homepage", operation: "loadFeaturedCharacters", data: { count: FeatureCharacters.length } },
        "Featured characters loaded successfully"
      );
    }
    catch (error) {
      logger.error(
        { module: "homepage", operation: "loadFeaturedCharacters", error },
        "Unexpected error loading featured characters"
      );
      setState((prev: PageState) => ({ ...prev, loading: false, error: "Failed to load featured characters. Please try again." }));
    }
    // return { data: FeatureCharacters, error: null }
  }

  const searchCharacters = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      logger.info(
        {
          module: "homepage",
          operation: "searchCharacters",
          data: { searchQuery, filters },
        },
        "Searching characters"
      );

      // For now, just filter the loaded characters
      // TODO: Implement proper search in database operations
      const { data: allCharacters, error } = await databaseOperations.getPublicCharacters();

      if (error) {
        logger.error({ 
          module: "homepage", 
          operation: "searchCharacters", 
          error
        }, "Failed to search characters.");

        setState((prev: PageState) => ({
          ...prev,
          loading: false,
          error: "Failed to search characters. Please try again.",
        }));
        return;
      }

      let filteredCharacters = allCharacters || [];

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredCharacters = filteredCharacters.filter(
          (char) =>
            char.name.toLowerCase().includes(query) ||
            (char.description && char.description.toLowerCase().includes(query))
        );
      }

      // Apply filters
      if (filters.length > 0) {
        filteredCharacters = filteredCharacters.filter((char) => {
          const dataType = (char as any).data_type;
          return filters.some((filter) => {
            switch (filter) {
              case "celebrity":
                return dataType === "real";
              case "ocs":
                return dataType === "virtual";
              default:
                return (char as any).tags?.includes(filter);
            }
          });
        });
      }

      // 直接使用数据库返回的完整数据，包含profiles信息
      const transformedCharacters = filteredCharacters;

      setState((prev: PageState) => ({
        ...prev,
        characters: transformedCharacters as unknown as CharacterData[],
        loading: false,
      }));

      logger.success(
        {
          module: "homepage",
          operation: "searchCharacters",
          data: { count: transformedCharacters.length },
        },
        "Character search completed"
      );
    } catch (error) {
      logger.error(
        { module: "homepage", operation: "searchCharacters", error },
        "Unexpected error searching characters"
      );
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to search characters. Please try again.",
      }));
    }
  };

  const handleRetry = () => {
    if (searchQuery || filters.length > 0) {
      searchCharacters();
    } else {
      loadCharacters();
    }
  };

  const handleCharacterClick = (character: CharacterData) => {
    if (!user) {
      // Show login modal if user is not authenticated
      logger.info(
        {
          module: "homepage",
          operation: "handleCharacterClick",
          data: {
            characterId: character.id,
            characterName: character.characterName,
          },
        },
        "User not authenticated - showing login modal"
      );
      document.dispatchEvent(new CustomEvent("openLoginModal"));
      return;
    }
    logger.info(
      {
        module: "homepage",
        operation: "handleCharacterClick",
        data: {
          characterId: character.id,
          characterName: character.characterName,
        },
      },
      "Character clicked - redirecting to character info page"
    );
    // Redirect to character info page with character ID
    router.push(`/character/info?id=${character.id}`);
  };

  // const handleSearch = (query: string) => {
  //   setSearchQuery(query);
  // };

  // const handleFilterChange = (newFilters: string[]) => {
  //   setFilters(newFilters);
  // };

  // const [showModeModal, setShowModeModal] = useState(false);

  const [sortSwiper, setSortSwiper] = useState<any>(null);
  const [featuredSwiper, setFeaturedSwiper] = useState<any>(null);
  const dragBlockClickRef = useRef(false);
  const pointerRef = useRef({ down: false, startX: 0, startY: 0, moved: false });

  useEffect(() => {
    if (!sortSwiper) return;
    const el = sortSwiper.el as HTMLElement;
    const threshold = 6;
    const down = (e: PointerEvent) => {
      pointerRef.current.down = true;
      pointerRef.current.startX = e.clientX;
      pointerRef.current.startY = e.clientY;
      pointerRef.current.moved = false;
      dragBlockClickRef.current = false;
    };
    const move = (e: PointerEvent) => {
      if (!pointerRef.current.down) return;
      const dx = Math.abs(e.clientX - pointerRef.current.startX);
      const dy = Math.abs(e.clientY - pointerRef.current.startY);
      if (dx > threshold || dy > threshold) {
        pointerRef.current.moved = true;
        dragBlockClickRef.current = true;
      }
    };
    const up = () => {
      if (!pointerRef.current.down) return;
      pointerRef.current.down = false;
      if (!pointerRef.current.moved) {
        dragBlockClickRef.current = false;
      } else {
        const reset = () => {
          dragBlockClickRef.current = false;
          sortSwiper.off("transitionEnd", reset);
        };
        sortSwiper.on("transitionEnd", reset);
      }
      pointerRef.current.moved = false;
    };
    el.addEventListener("pointerdown", down, { passive: true });
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerup", up, { passive: true });
    el.addEventListener("pointerleave", up, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointerleave", up);
    };
  }, [sortSwiper]);

  const featuredDragBlockClickRef = useRef(false);
  const featuredPointerRef = useRef({ down: false, startX: 0, startY: 0, moved: false });
  useEffect(() => {
    if (!featuredSwiper) return;
    const el = featuredSwiper.el as HTMLElement;
    const threshold = 6;
    const down = (e: PointerEvent) => {
      featuredPointerRef.current.down = true;
      featuredPointerRef.current.startX = e.clientX;
      featuredPointerRef.current.startY = e.clientY;
      featuredPointerRef.current.moved = false;
      featuredDragBlockClickRef.current = false;
    };
    const move = (e: PointerEvent) => {
      if (!featuredPointerRef.current.down) return;
      const dx = Math.abs(e.clientX - featuredPointerRef.current.startX);
      const dy = Math.abs(e.clientY - featuredPointerRef.current.startY);
      if (dx > threshold || dy > threshold) {
        featuredPointerRef.current.moved = true;
        featuredDragBlockClickRef.current = true;
      }
    };
    const up = () => {
      if (!featuredPointerRef.current.down) return;
      featuredPointerRef.current.down = false;
      if (!featuredPointerRef.current.moved) {
        featuredDragBlockClickRef.current = false;
      } else {
        const reset = () => {
          featuredDragBlockClickRef.current = false;
          featuredSwiper.off("transitionEnd", reset);
        };
        featuredSwiper.on("transitionEnd", reset);
      }
      featuredPointerRef.current.moved = false;
    };
    el.addEventListener("pointerdown", down, { passive: true });
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerup", up, { passive: true });
    el.addEventListener("pointerleave", up, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointerleave", up);
    };
  }, [featuredSwiper]);

  // const startReading = () => {
  //   // 🔧 改为弹窗而不是页面跳转
  //   setShowModeModal(true);
  // };

  // const goMyCharacters = () => {
  //   router.push("/user/my-info");
  // };

  // Simple landing condition: no auth OR no local state
  // const shouldShowLanding = !state.user && typeof window !== 'undefined' && !localStorage.getItem('app_state')

  // Loading state for initial page load
  if (state.userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-foreground-600">{t("home.loadingApp")}</p>
        </div>
      </div>
    );
  }

  // Landing (unauthenticated and no local state)
  // if (shouldShowLanding) {
  //   return (
  //     <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
  //       <div
  //         className="absolute inset-0 opacity-20"
  //         style={{
  //           backgroundImage: "url(/background_left.svg)",
  //           backgroundRepeat: "no-repeat",
  //           backgroundPosition: "left top",
  //           backgroundSize: "cover",
  //         }}
  //       />
  //       <div className="relative z-10 max-w-6xl w-full px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
  //         <div className="bg-content2/80 backdrop-blur-sm border border-foreground/10 rounded-2xl p-8 shadow-lg">
  //           <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Discover your Ego, Define your Echo.</h1>
  //           <p className="text-foreground-600 mb-6">Join in seconds to start your first reading</p>
  //           <div className="flex flex-col gap-3">
  //             <Button color="primary" variant="solid" className="w-full" onPress={() => document.dispatchEvent(new CustomEvent('openLoginModal'))}>Login</Button>
  //             <Button color="primary" variant="bordered" className="w-full" as={Link} href="/register">Register</Button>
  //           </div>
  //         </div>
  //         <div className="h-full min-h-[40vh] bg-no-repeat bg-center bg-contain" style={{ backgroundImage: 'url(/hero-placeholder.svg)' }} />
  //       </div>
  //     </div>
  //   )
  // }

  // Error state
  if (state.error && !state.loading) {
    return (
      <div className="flex">
        <div className="flex-1 p-8 md:pl-8 pl-4">
          <div className="mt-16 md:mt-0 flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md">
              <CardBody className="text-center p-8 space-y-4">
                <div className="text-danger text-4xl">⚠️</div>
                <h3 className="text-xl font-semibold text-foreground">
                  {t("home.somethingWrong")}
                </h3>
                <p className="text-foreground-600">{state.error}</p>
                <Button
                  color="primary"
                  startContent={<RefreshCw className="w-4 h-4" />}
                  onPress={handleRetry}
                >
                  {t("home.tryAgain")}
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-black px-4 sm:px-10">
      <div className="flex">
        <main className="flex-1 py-6 w-full">
          {state.loading ? (
            <HomeSkeleton></HomeSkeleton>
            // <div className="h-full flex justify-center items-center py-16">
            //   <div className="text-center space-y-4">
            //     <Spinner size="lg" color="primary" />
            //     <p className="text-gray-600">加载中</p>
            //   </div>
            // </div>
          ) : (
            <>
              <Card className="overflow-hidden mb-6 bg-transparent shadow-none rounded-2xl">
                <CardBody className="p-0">
                  <img
                    src="/hero1.png"
                    alt=""
                    className="w-full h-[35vh] sm:h-auto object-cover object-center"
                  />
                </CardBody>
              </Card>
              {state.characters.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600 font-semibold">{t('home.sort')}</div>
                    <Button
                      size="sm"
                      variant="flat"
                      className="rounded-full text-black bg-gray-200"
                      onPress={() => router.push("/more")}
                    >
                      {t('home.more')}
                    </Button>
                  </div>
                  <div className="relative">
                    <Swiper
                      onSwiper={setSortSwiper}
                      slidesPerView={"auto"}
                      spaceBetween={8}
                      speed={400}
                      grabCursor={true}
                      allowTouchMove={true}
                      resistanceRatio={0.5}
                      simulateTouch={true}
                    >
                      {state.characters.slice(0, 12).map((char: any) => (
                        <SwiperSlide
                          key={char.id}
                          className="flex-shrink-0 pb-2 !w-[10.5rem] sm:!w-[12.5rem] md:!w-[14rem]"
                        >
                          <CharacterCard
                            data={char}
                            onClick={(payload: any) => {
                              if (dragBlockClickRef.current) return;
                              (handleCharacterClick as any)(payload);
                            }}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                  <div className="mt-8 mb-3 text-sm text-gray-600 font-semibold">{t('home.featured')}</div>
                  <div className="relative mt-2">
                    <Swiper
                      onSwiper={setFeaturedSwiper}
                      slidesPerView={"auto"}
                      spaceBetween={12}
                      speed={450}
                      grabCursor={true}
                      allowTouchMove={true}
                      resistanceRatio={0.5}
                      simulateTouch={true}
                    >
                      {state.featuredCharacters.slice(0, 12).map((char: any) => (
                        <SwiperSlide
                          key={char.id}
                          className="flex-shrink-0 pb-2 !w-[14rem] sm:!w-[18rem] md:!w-[20rem]"
                        >
                          <FeaturedCharacterCard
                            data={char}
                            onClick={(payload: any) => {
                              if (featuredDragBlockClickRef.current) return;
                              (handleCharacterClick as any)(payload);
                            }}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
});

export default HomePage;
