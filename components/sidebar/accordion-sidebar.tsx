"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Card, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "@/lib/utils/translations";

// Custom SVG Icon Component
const SvgIcon = ({ src, className }: { src: string; className?: string }) => (
  <Image src={src} alt="" width={48} height={48} className={className} />
);

interface AccordionMenuItemProps {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  buttons?: Array<{
    label: string;
    onClick?: () => void;
    className?: string;
  }>;
}

function AccordionMenuItem({
  id,
  icon: Icon,
  title,
  description,
  isOpen,
  onToggle,
  buttons,
}: AccordionMenuItemProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-lg overflow-hidden transition-colors duration-300 ${
        isOpen ? "bg-[#1a161f] shadow-inner" : "bg-content2"
      }`}
    >
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-content3 transition-colors"
      >
        <Icon className="w-12 h-12 text-primary" />
        <div className="flex-1 flex flex-col gap-0">
          <p
            className={`text-primary text-xl font-medium ${
              isOpen ? "drop-shadow-lg" : ""
            }`}
          >
            {title}
          </p>
          <p className="text-foreground-400 text-xs opacity-50">
            {description}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-foreground-400 transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-4 pt-0 space-y-2">
          {buttons && buttons.length > 0 ? (
            buttons.map((button, index) => (
              <button
                key={index}
                className={`w-full flex items-center text-left p-2 rounded hover:bg-content1 text-foreground-300 hover:text-foreground transition-colors ${
                  button.className || ""
                }`}
                onClick={button.onClick}
              >
                {button.label}
              </button>
            ))
          ) : (
            <div className="text-foreground-300 text-sm">
              {t("sidebar.noAdditionalContent")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AccordionSidebarProps {
  onStartReading?: () => void;
}

export default function AccordionSidebar({
  onStartReading,
}: AccordionSidebarProps = {}) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [, forceUpdate] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleStartReading = () => {
    // 🔧 触发回调函数（打开模式选择弹窗）
    if (onStartReading) {
      onStartReading();
    }
  };

  const handleMyCharacters = () => {
    router.push("/user/my-info");
  };

  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

  const handleResetFilters = () => {
    // Dispatch a custom event to reset filters on the homepage
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("resetFilters"));
    }
    router.push("/");
  };

  const menuItems = [
    {
      id: "celebrity",
      icon: ({ className }: { className?: string }) => (
        <SvgIcon src="/type_rw.svg" className={className} />
      ),
      title: t("sidebar.celebrity"),
      description: t("sidebar.celebrityDesc"),
      buttons: [
        {
          label: t("sidebar.hollywoodStars"),
          onClick: () =>
            router.push(
              `/database?category=celebrity&subcategory=${slugify(
                t("sidebar.hollywoodStars")
              )}`
            ),
        },
        {
          label: t("sidebar.musicArtists"),
          onClick: () =>
            router.push(
              `/database?category=celebrity&subcategory=${slugify(
                t("sidebar.musicArtists")
              )}`
            ),
        },
        {
          label: t("sidebar.techBillionaires"),
          onClick: () =>
            router.push(
              `/database?category=celebrity&subcategory=${slugify(
                t("sidebar.techBillionaires")
              )}`
            ),
        },
      ],
    },
    {
      id: "ocs",
      icon: ({ className }: { className?: string }) => (
        <SvgIcon src="/type_oc.svg" className={className} />
      ),
      title: t("sidebar.ocs"),
      description: t("sidebar.ocsDesc"),
      buttons: [
        {
          label: t("sidebar.fantasyCharacters"),
          onClick: () =>
            router.push(
              `/database?category=ocs&subcategory=${slugify(
                t("sidebar.fantasyCharacters")
              )}`
            ),
        },
        {
          label: t("sidebar.sciFiHeroes"),
          onClick: () =>
            router.push(
              `/database?category=ocs&subcategory=${slugify(
                t("sidebar.sciFiHeroes")
              )}`
            ),
        },
        {
          label: t("sidebar.modernPersonas"),
          onClick: () =>
            router.push(
              `/database?category=ocs&subcategory=${slugify(
                t("sidebar.modernPersonas")
              )}`
            ),
        },
      ],
    },
    // {
    //   id: "agent",
    //   icon: ({ className }: { className?: string }) => <SvgIcon src="/type_agent.svg" className={className} />,
    //   title: t("sidebar.agentReady"),
    //   description: t("sidebar.agentDesc"),
    //   buttons: [
    //     {
    //       label: t("sidebar.aiAssistants"),
    //       onClick: () => router.push(`/database?category=agent&subcategory=${slugify(t("sidebar.aiAssistants"))}`),
    //     },
    //     {
    //       label: t("sidebar.chatbots"),
    //       onClick: () => router.push(`/database?category=agent&subcategory=${slugify(t("sidebar.chatbots"))}`)
    //     },
    //     {
    //       label: t("sidebar.virtualAgents"),
    //       onClick: () => router.push(`/database?category=agent&subcategory=${slugify(t("sidebar.virtualAgents"))}`),
    //     },
    //   ],
    // },
  ];

  const SidebarContent = () => (
    <>
      {/* First Row - Two Buttons */}
      <div className="flex gap-4 w-full mb-6">
        {/* Button 1 - Start Your Reading Now - 增大占比 */}
        <Card
          isPressable
          className="bg-primary p-4 flex-[2] h-20 overflow-hidden"
          onPress={handleStartReading}
          style={{
            backgroundImage: "url(/start_button.svg)",
            backgroundSize: "120%",
            backgroundPosition: "75% center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            className="flex flex-col justify-center items-start text-left h-full"
            style={{ color: "#393041" }}
          >
            <p className="font-semibold text-3xl">
              {t("sidebar.startReading")}
            </p>
            <p className="text-md whitespace-nowrap">
              {t("sidebar.yourReading")}
            </p>
          </div>
        </Card>
        {/* Button 2 - My Characters - 减小占比并统一文字大小 */}
        <Card
          isPressable
          className="bg-content2 p-4 flex-[1] h-20 relative"
          onPress={handleMyCharacters}
        >
          <div
            className="absolute bottom-4 left-4 text-left"
            style={{ color: "#EFB778" }}
          >
            <p className="text-lg">{t("sidebar.myCharacters")}</p>
            <p className="text-sm">{t("sidebar.characters")}</p>
          </div>
        </Card>
      </div>

      {/* Accordion Menu */}
      <div className="space-y-2">
        {/* Feed/Home Card - Replaces the accordion */}
        <div className="rounded-lg overflow-hidden transition-colors duration-300 bg-content2">
          <button
            onClick={handleResetFilters}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-content3 transition-colors"
          >
            <SvgIcon src="/type_feed.svg" className="w-12 h-12 text-primary" />
            <div className="flex-1 flex flex-col gap-0">
              <p className="text-primary text-xl font-medium">
                {t("sidebar.feedHome")}
              </p>
              <p className="text-foreground-400 text-xs opacity-50">
                {t("sidebar.viewAllCharacters")}
              </p>
            </div>
          </button>
        </div>
        {menuItems.map((menuItem) => (
          <AccordionMenuItem
            key={menuItem.id}
            id={menuItem.id}
            icon={menuItem.icon}
            title={menuItem.title}
            description={menuItem.description}
            isOpen={openAccordion === menuItem.id}
            onToggle={toggleAccordion}
            buttons={menuItem.buttons}
          />
        ))}
      </div>
    </>
  );

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="w-96 bg-content1 border-r border-white/5 h-screen flex flex-col">
        <div className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
          <SidebarContent />
        </div>
      </div>
    );
  }

  // Mobile - 不显示按钮和侧边栏，因为 Navbar 已经有菜单了
  if (isMobile) {
    return null;
  }

  // Desktop Sidebar
  return (
    <div className="w-96 bg-content1 border-r border-white/5 h-screen flex flex-col">
      <div className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
        <SidebarContent />
      </div>
    </div>
  );
}
