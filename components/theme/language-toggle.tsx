"use client"

import { useState, useEffect } from "react"
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react"
import { useTranslation } from "@/lib/utils/translations"
import { Languages } from "lucide-react"

type Language = "en" | "zh"

const languages = {
  en: {
    name: "English",
    flag: "🇺🇸"
  },
  zh: {
    name: "简体中文",
    flag: "🇨🇳"
  }
}

export default function LanguageToggle() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en")

  useEffect(() => {
    setMounted(true)
    // Load language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh")) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language)
    localStorage.setItem("language", language)
    // Dispatch event for other components to listen to
    window.dispatchEvent(new CustomEvent("languageChange", { detail: language }))
  }

  if (!mounted) {
    return (
      <Button
        isIconOnly
        variant="light"
        size="sm"
        className="opacity-50"
      >
        <Languages className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          isIconOnly
          variant="light"
          size="sm"
        >
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={t("aria.languageSelection")}
        selectedKeys={[currentLanguage]}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const language = Array.from(keys)[0] as Language
          handleLanguageChange(language)
        }}
        style={{
          // @ts-ignore
          '--nextui-primary': '#EFB778',
          '--nextui-primary-500': '#EFB778',
        }}
        className="[&_[data-selected=true]]:!text-[#EFB778] [&_svg]:!text-[#EFB778] [&_[aria-selected=true]]:!text-[#EFB778] [&_[aria-selected=true]_svg]:!text-[#EFB778]"
      >
        {Object.entries(languages).map(([code, { name, flag }]) => (
          <DropdownItem key={code} value={code}>
            <div className="flex items-center gap-2">
              <span>{flag}</span>
              <span>{name}</span>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
