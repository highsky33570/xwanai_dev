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
  user: SupabaseUser | null;
  userLoading: boolean;
}

const DashboardForm = observer(() => {
  const router = useRouter();
  const { t } = useTranslation();
  const [state, setState] = useState<PageState>({
    loading: true,
    error: null,
    characters: [],
    user: null,
    userLoading: true,
  });

  const [sortSwiper, setSortSwiper] = useState<any>(null);
  const [featuredSwiper, setFeaturedSwiper] = useState<any>(null);
  const dragBlockClickRef = useRef(false);
  const pointerRef = useRef({ down: false, startX: 0, startY: 0, moved: false });
  
  const featuredDragBlockClickRef = useRef(false);
  const featuredPointerRef = useRef({ down: false, startX: 0, startY: 0, moved: false });

  // Load characters on component mount
  useEffect(() => {
    if (!state.userLoading) {
      loadCharacters();
    }
  }, [state.userLoading]);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
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
        id: char.uuid,
        name: char.character_name,
        // Add default/missing fields that might be expected by UI components
        description: "", 
        avatar_id: null,
        access_level: "public",
        auth_id: null, // or some placeholder if needed
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

  const handleCharacterClick = (character: CharacterData) => {
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

  // Loading state for initial page load
  if (state.userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-foreground-600 text-black">{t("home.loadingApp")}</p>
        </div>
      </div>
    );
  }

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
    <div className="text-black">
      <div className="flex">
        <main className="flex-1 px-6 md:px-8 py-6 w-full">
          {state.loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center space-y-4">
                <Spinner size="lg" color="primary" />
                <p className="text-gray-600">加载中</p>
              </div>
            </div>
          ) : (
            <>
              <Card className="overflow-hidden mb-6 bg-transparent shadow-none">
                <CardBody className="p-0">
                  <img src="/hero.png" alt="" className="w-full h-auto" />
                </CardBody>
              </Card>
              {state.characters.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600 font-semibold">SORT</div>
                    <Button
                      size="sm"
                      variant="flat"
                      className="rounded-full text-black bg-gray-200"
                      onPress={() => router.push("/more")}
                    >
                      MORE+
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
                        <SwiperSlide key={char.id} className="flex-shrink-0 pb-2" style={{ width: "12rem" }}>
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
                  <div className="mt-8 mb-3 text-sm text-gray-600 font-semibold">FEATURED</div>
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
                      {state.characters.slice(0, 12).map((char: any) => (
                        <SwiperSlide key={char.id} className="flex-shrink-0 pb-2 sm:!w-[18rem] md:!w-[20rem]" style={{ width: "16rem" }}>
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

export default DashboardForm;
