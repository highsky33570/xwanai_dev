"use client";
import type React from "react";
import { useState, useEffect } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge,
  Chip,
  Input,
} from "@heroui/react";
import { useDisclosure } from "@heroui/react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  User,
  LogOut,
  ArrowRight,
  Plus,
  Sparkles,
  Gift,
  Grid,
  Settings,
  SlidersHorizontal,
  Search,
  Menu,
  X,
} from "lucide-react";
import { authOperations } from "@/lib/supabase/auth";
import { logger } from "@/lib/utils/logger";
import LoginModal from "@/components/auth/login-modal";
import LanguageToggle from "@/components/theme/language-toggle";
import { useTranslation } from "@/lib/utils/translations";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Tables } from "@/lib/supabase/types";
import { Store } from "@/store";
import ModeSelectionModal from "@/components/modals/mode-selection-modal";
import SubscriptionModal from "@/components/subscription/subscription-modal";
import { SubscriptionBadge } from "@/components/subscription/subscription-badge";
import { observer } from "mobx-react-lite";
import { useTaskStatus } from "@/hooks/use-task-status";
import { useSubscription } from "@/hooks/use-subscription";
import { useAppGlobal } from "@/lib/context/GlobalContext";
import Logo from "../common/Logo";
import path from "path";
import { getAvatarPublicUrl } from "@/lib/supabase/storage";

type Character = Tables<"characters">;

const NavigationNavbar = observer(() => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAppGlobal();
  // const [isLoading, setIsLoading] = useState(true);
  const welcomeName = ((user?.user_metadata?.username || user?.email || "Guest") as string).toUpperCase();
  // const isSettingPage = pathname.startsWith("/settings");

  const avatarUrl = user?.user_metadata?.avatar_url || undefined;
  const avatarFallback = user?.user_metadata?.username || user?.email || "Guest";
  const avatarName = user?.user_metadata?.username || user?.email || "Guest";

  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onOpenChange: onLoginOpenChange,
  } = useDisclosure();

  const {
    isOpen: isSubscriptionOpen,
    onOpen: onSubscriptionOpen,
    onOpenChange: onSubscriptionOpenChange,
  } = useDisclosure();

  const { t } = useTranslation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [, forceUpdate] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 任务状态
  const { uncompletedCount, rewardClaimed, allCompleted } = useTaskStatus();

  // 订阅状态
  const { subscription } = useSubscription();

  // 🎯 同步订阅状态到 Store
  useEffect(() => {
    if (subscription) {
      Store.user.setSubscription(subscription);
    } else if (subscription === null && !user) {
      // 用户未登录时清除订阅信息
      Store.user.clearSubscription();
    }
  }, [subscription, user]);

  // 🔒 根据登录状态动态生成菜单项
  const menuItems = [
    { name: t("nav.home"), subtitle: t("nav.homeSubtitle"), href: "/" },
    {
      name: t("nav.database"),
      subtitle: t("nav.databaseSubtitle"),
      href: "/database",
    },
    // 🔒 以下页面仅登录用户可见
    ...(user ? [
      { name: t("nav.chat"), subtitle: t("nav.chatSubtitle"), href: "/chat" },
      {
        name: t("nav.settings"),
        subtitle: t("nav.settingsSubtitle"),
        href: "/settings",
      },
    ] : []),
  ];

  // Sync search query with URL parameter when on /more page
  useEffect(() => {
    if (pathname === "/more") {
      const urlSearch = searchParams.get("search");
      if (urlSearch !== null) {
        // Only sync if URL has search param, preserve user input otherwise
        setSearchQuery(urlSearch);
      }
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = () => {
      forceUpdate(prev => prev + 1);
    };

    window.addEventListener("languageChange", handleLanguageChange);

    // Listen for global login modal open event
    const handleOpenLoginModal = () => {
      try {
        onLoginOpen();
      } catch { }
    };
    document.addEventListener("openLoginModal", handleOpenLoginModal);

    // Listen for global mode selection open event
    const handleOpenModeSelection = () => {
      try {
        setShowCreateModal(true);
      } catch { }
    };
    document.addEventListener("openModeSelection", handleOpenModeSelection);

    const handleScroll = () => {
      try {
        setIsScrolled(window.scrollY > 0);
      } catch { }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      // subscription.unsubscribe();
      window.removeEventListener("languageChange", handleLanguageChange);
      document.removeEventListener("openLoginModal", handleOpenLoginModal);
      document.removeEventListener("openModeSelection", handleOpenModeSelection);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    logger.info(
      {
        module: "navbar",
        operation: "sign_out",
        data: { userId: user?.id },
      },
      "User signing out from navbar"
    );

    try {
      const { error } = await authOperations.signOut();

      if (error) {
        logger.error(
          {
            module: "navbar",
            operation: "sign_out",
            error,
          },
          "Sign out failed"
        );
        return;
      }

      logger.success(
        {
          module: "navbar",
          operation: "sign_out",
        },
        "User signed out successfully"
      );

      router.push("/");
    } catch (error) {
      logger.error(
        {
          module: "navbar",
          operation: "sign_out",
          error,
        },
        "Unexpected error during sign out"
      );
    }
  };

  const handleNavigation = (href: string) => {
    logger.info(
      {
        module: "navbar",
        operation: "navigation",
        data: {
          href,
          userId: user?.id,
        },
      },
      "User navigating to page"
    );

    router.push(href);
    setIsMenuOpen(false);
  };

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

  const handleSignUpClick = () => {
    logger.info(
      {
        module: "navbar",
        operation: "sign_up_click",
      },
      "User clicked sign up from login modal"
    );

    // Close the login modal
    onLoginOpenChange();

    // Navigate to register page
    handleNavigation("/register");
  };

  const handleForgotPasswordClick = () => {
    logger.info(
      {
        module: "navbar",
        operation: "forgot_password_click",
      },
      "User clicked forgot password from login modal"
    );

    // Close the login modal
    onLoginOpenChange();

    // Navigate to restore-password page
    handleNavigation("/restore-password");
  };

  const handleDropdownAction = (key: string | number) => {
    const keyStr = key.toString();

    logger.info(
      {
        module: "navbar",
        operation: "dropdown_action",
        data: {
          action: keyStr,
          userId: user?.id,
        },
      },
      "User clicked dropdown action"
    );

    if (keyStr !== 'logout' && user == null) {
      onLoginOpen();
      return;
    }

    switch (keyStr) {
      case "home":
        handleNavigation("/");
        break;
      case "my-home":
        handleNavigation("/user/my-info");
        break;
      case "settings":
        handleNavigation("/settings");
        break;
      case "tasks":
        handleNavigation("/database");
        break;
      case "subscription":
        onSubscriptionOpen();
        break;
      case "chat":
        if (!user) {
          onLoginOpen();
        } else {
          handleNavigation("/chat");
        }
        break;
      case "logout":
        handleSignOut();
        break;
      default:
        logger.warn(
          {
            module: "navbar",
            operation: "dropdown_action",
            data: { unknownAction: keyStr },
          },
          "Unknown dropdown action"
        );
    }
  };

  const handleOpenLeftOverlay = () => {
    console.log("menu clicked");
    const isChat = pathname?.startsWith("/chat");
    if (isChat) {
      const evt = new Event(isMobileMenuOpen ? "closeChatHistorySidebar" : "openChatHistorySidebar");
      document.dispatchEvent(evt);
      return;
    }
    const evt = new Event(isMobileMenuOpen ? "closeLeftMenu" : "openLeftMenu");
    document.dispatchEvent(evt);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClosed = () => setIsMobileMenuOpen(false);
    const handleOpened = () => setIsMobileMenuOpen(true);
    document.addEventListener("leftMenuClosed", handleClosed);
    document.addEventListener("leftMenuOpened", handleOpened);
    return () => {
      document.removeEventListener("leftMenuClosed", handleClosed);
      document.removeEventListener("leftMenuOpened", handleOpened);
    };
  }, []);

  return (
    <>
      <Navbar
        id="app-navbar"
        onMenuOpenChange={setIsMenuOpen}
        className={`${isScrolled ? "backdrop-blur-md" : "backdrop-blur-none"} w-full bg-transparent py-2`}
        maxWidth="full"
      >
        {
          (<NavbarContent className="flex-shrink-0">
            <NavbarMenuToggle
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              className="hidden"
            />
            <button
              aria-label="Open sidebar"
              className="relative flex lg:hidden p-2 rounded-[5px] hover:bg-black/5 w-10 h-10 items-center justify-center bg-[#e2e2e5]"
              style={{ padding: "10px" }}
              onClick={handleOpenLeftOverlay}
            >
              <span
                className="block absolute w-5 h-[3px] bg-[#555] rounded-full transition-all duration-200"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: isMobileMenuOpen
                    ? "translate(-50%, -50%) rotate(45deg)"
                    : "translate(-50%, -8px) rotate(0deg)",
                  opacity: 1,
                }}
              />
              <span
                className="block absolute w-5 h-[3px] bg-[#555] rounded-full transition-all duration-200"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: isMobileMenuOpen
                    ? "translate(-50%, -50%) scaleX(0)"
                    : "translate(-50%, -50%) scaleX(1)",
                  opacity: isMobileMenuOpen ? 0 : 1,
                }}
              />
              <span
                className="block absolute w-5 h-[3px] bg-[#555] rounded-full transition-all duration-200"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: isMobileMenuOpen
                    ? "translate(-50%, -50%) rotate(-45deg)"
                    : "translate(-50%, 6px) rotate(0deg)",
                  opacity: 1,
                }}
              />
            </button>
          </NavbarContent>)
        }

        {/* Right side */}
        <NavbarContent justify="end" className="gap-2 text-black">
          {/* Desktop quick menu */}
          <div className="hidden sm:flex items-center gap-6 text-gray-600 h-full mt-5">
          <Link
            href="/"
            aria-label={t("nav.home")}
            className="p-1 rounded text-center flex flex-col items-center gap-1 whitespace-nowrap"
          >
              <img
                src={pathname == '/' ? "/svg/tab/home_active.svg" : "/svg/tab/home.svg"}
                alt={t("nav.home")}
                className="w-9 h-9 mx-auto object-contain"
              />
              <span className={pathname === "/" ? "text-[#eb7020]" : ""}>{t("nav.home")}</span>
            </Link>
          <Link
            href="/database"
            aria-label={t("nav.database")}
            className="p-1 rounded text-center flex flex-col items-center gap-1 whitespace-nowrap"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                onLoginOpen();
              }
            }}
          >
              <img
                src={pathname?.startsWith("/database") ? "/svg/tab/task_active.svg" : "/svg/tab/task.svg"}
                alt={t("nav.database")}
                className="w-9 h-9 mx-auto object-contain"
              />
              <span className={pathname === "/database" ? "text-[#eb7020]" : ""}>{t("nav.database")}</span>
            </Link>
            <Link
              href="/chat"
              aria-label={t("nav.chat")}
              className="p-1 text-center flex flex-col items-center gap-1 whitespace-nowrap"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  onLoginOpen();
                }
              }}
            >
              <img
                src={pathname?.startsWith("/chat") ? "/svg/tab/chat_active.svg" : "/svg/tab/chat.svg"}
                alt={t("nav.chat")}
                className="w-9 h-9 mx-auto object-contain"
              />
              <span className={pathname === "/chat" ? "text-[#eb7020]" : ""}>{t("nav.chat")}</span>
            </Link>
            <Link
              href="/settings"
              aria-label={t("nav.settings")}
              className="p-1 text-center flex flex-col items-center gap-1 whitespace-nowrap"
            >
              <img
                src={pathname?.startsWith("/settings") ? "/svg/tab/setting_active.svg" : "/svg/tab/setting.svg"}
                alt={t("nav.settings")}
                className="w-9 h-9 mx-auto object-contain"
              />
              <span className={pathname === "/settings" ? "text-[#eb7020]" : ""}>{t("nav.settings")}</span>
            </Link>
          </div>
          {/* Mobile quick menu */}
          <div className="flex sm:hidden items-center gap-3 text-gray-600 pt-2.5 mr-2.5">
            <Link
              href="/"
              aria-label={t("nav.home")}
              className="p-2 rounded-md text-center flex flex-col items-center gap-0.5 whitespace-nowrap"
            >
              <img
                src={pathname == '/' ? "/svg/tab/home_active.svg" : "/svg/tab/home.svg"}
                alt={t("nav.home")}
                className="w-8 h-8 mx-auto object-contain"
              />
              <span className={`text-sm ${pathname === "/" ? "text-[#eb7020]" : ""}`}>{t("nav.home")}</span>
            </Link>
            <Link
              href="/database"
              aria-label={t("nav.database")}
              className="p-2 rounded-md text-center flex flex-col items-center gap-0.5 whitespace-nowrap"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  onLoginOpen();
                }
              }}
            >
              <img
                src={pathname?.startsWith("/database") ? "/svg/tab/task_active.svg" : "/svg/tab/task.svg"}
                alt={t("nav.database")}
                className="w-8 h-8 mx-auto object-contain"
              />
              <span className={`text-sm ${pathname === "/database" ? "text-[#eb7020]" : ""}`}>{t("nav.database")}</span>
            </Link>
            <Link
              href="/chat"
              aria-label={t("nav.chat")}
              className="p-2 rounded-md text-center flex flex-col items-center gap-0.5 whitespace-nowrap"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  onLoginOpen();
                }
              }}
            >
              <img
                src={pathname?.startsWith("/chat") ? "/svg/tab/chat_active.svg" : "/svg/tab/chat.svg"}
                alt={t("nav.chat")}
                className="w-8 h-8 mx-auto object-contain"
              />
              <span className={`text-sm ${pathname === "/chat" ? "text-[#eb7020]" : ""}`}>{t("nav.chat")}</span>
            </Link>
            <Link
              href="/settings"
              aria-label={t("nav.settings")}
              className="p-2 rounded-md text-center flex flex-col items-center gap-0.5 whitespace-nowrap"
            >
              <img
                src={pathname?.startsWith("/settings") ? "/svg/tab/setting_active.svg" : "/svg/tab/setting.svg"}
                alt={t("nav.settings")}
                className="w-8 h-8 mx-auto object-contain"
              />
              <span className={`text-sm ${pathname === "/settings" ? "text-[#eb7020]" : ""}`}>{t("nav.settings")}</span>
            </Link>
          </div>
          <div className="hidden lg:block w-full max-w-xl min-w-[200px]">
            <Input
              size="md"
              radius="lg"
              variant="bordered"
              placeholder="SEARCH"
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  handleNavigation(buildMoreUrlWithSearch(searchQuery));
                }
              }}
              startContent={<Search className="w-3 h-3 text-gray-500" />}
              endContent={
                searchQuery.trim() ? (
                  pathname === "/more" && searchParams.get("search") === searchQuery.trim() ? (
                    <button
                      onClick={() => {
                        setSearchQuery("");
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
                        handleNavigation(buildMoreUrlWithSearch(searchQuery));
                      }}
                      className="p-1 hover:bg-gray-300 rounded-full transition-colors"
                      aria-label="Search"
                    >
                      <Search className="w-4 h-4 text-gray-700" />
                    </button>
                  )
                ) : null
              }
              classNames={{ input: "text-black bg-gray-200 placeholder:text-black placeholder:opacity-100 rounded-full focus:outline-none focus-visible:outline-none", inputWrapper: "text-black bg-gray-200 border-gray-300 rounded-full focus:outline-none focus-within:outline-none" }}
            />
          </div>
          {/* 语言切换 */}
          <NavbarItem className="hidden sm:block">
            <LanguageToggle />
          </NavbarItem>

          {user && (
            <NavbarItem className="hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-gray-500 tracking-wide">{t("common.welcomeBack")}</div>
                  <div className="text-sm font-semibold tracking-wide">{welcomeName}</div>
                </div>
              </div>
            </NavbarItem>
          )}

          <NavbarItem>
            {user && user.user_metadata?.avatar_url ? (
              <Dropdown placement="bottom-end" className="bg-white">
                <DropdownTrigger>
                  <button className="relative inline-flex outline-none">
                    <Avatar
                      isBordered
                      className="transition-transform hover:scale-105"
                      color="secondary"
                      name={user.user_metadata?.username || user.email}
                      size="sm"
                      src={getAvatarPublicUrl(
                        user.user_metadata?.avatar_url,
                        user.id
                      )}
                    />
                    <span className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                      <SubscriptionBadge variant="icon" />
                    </span>
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Profile Actions"
                  variant="flat"
                  onAction={handleDropdownAction}
                  className="bg-white text-black"
                >
                  <DropdownItem
                    key="profile"
                    className="h-auto gap-2 py-3 text-black"
                    textValue="Profile Info"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold">{t("nav.signedInAs")}</p>
                      <p className="font-semibold text-primary">
                        {user.user_metadata?.username || user.email}
                      </p>
                      <div className="mt-1">
                        <SubscriptionBadge variant="simple" size="sm" />
                      </div>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    key="my-home"
                    startContent={<User className="w-4 h-4" />}
                    className="text-black"
                    textValue="My Home"
                  >
                    {t("nav.myHome")}
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    startContent={<Settings className="w-4 h-4" />}
                    className="text-black"
                    textValue="User Settings"
                  >
                    {t("nav.userSettings")}
                  </DropdownItem>
                  {/* 🎯 新手任务菜单项 - 条件显示 */}
                  {(() => {
                    // 如果所有任务完成 且 奖励已领取 且 试用会员已过期，则隐藏
                    // subscription_tier === "premium" 表示是试用会员（新手任务奖励）
                    const isTrialPremium = subscription?.subscription_tier === "premium";
                    const shouldHide = allCompleted && rewardClaimed && !isTrialPremium;

                    if (shouldHide) return null;

                    return (
                      <DropdownItem
                        key="tasks"
                        startContent={<Gift className="w-4 h-4" />}
                        className="text-black"
                        textValue="Beginner Tasks"
                        endContent={
                          uncompletedCount > 0 ? (
                            <Badge color="primary" size="sm">{uncompletedCount}</Badge>
                          ) : null
                        }
                      >
                        {t("nav.tasks")}
                      </DropdownItem>
                    );
                  })()}
                  <DropdownItem
                    key="subscription"
                    startContent={<Sparkles className="w-4 h-4" />}
                    className="text-black"
                    textValue="Subscription"
                  >
                    {t("subscription.title")}
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    startContent={<LogOut className="w-4 h-4" />}
                    className="text-black"
                    textValue="Log Out"
                  >
                    {t("nav.logOut")}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Button
                  color="primary"
                  variant="bordered"
                  onPress={() => onLoginOpen()}
                  size="md"
                  endContent={<ArrowRight className="w-4 h-4" />}
                  className="font-medium"
                >
                  {t("common.login")}
                </Button>
                <Button
                  as={Link}
                  href="/register"
                  color="primary"
                  variant="solid"
                  size="md"
                  endContent={<Plus className="w-4 h-4" />}
                  className="font-medium"
                  onClick={() => handleNavigation("/register")}
                >
                  {t("common.register")}
                </Button>
              </div>
            )}
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <LoginModal
        isOpen={isLoginOpen}
        onOpenChange={onLoginOpenChange}
        onSignUpClick={handleSignUpClick}
        onForgotPasswordClick={handleForgotPasswordClick}
      />

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

      {/* 订阅弹窗 */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onOpenChange={onSubscriptionOpenChange}
      />
    </>
  );
});

export default NavigationNavbar;
