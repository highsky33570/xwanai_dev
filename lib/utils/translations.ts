"use client"

import { translations, type Language } from "./translations-data"

export type { Language }

import { useState, useEffect } from "react"

export function useTranslation() {
  const [language, setLanguage] = useState<Language>("en")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem("language") as Language
    const validLanguage = saved && (saved === "en" || saved === "zh") ? saved : "en"
    setLanguage(validLanguage)
  }, [])

  // React to global language change events dispatched by the language toggle
  useEffect(() => {
    if (!isClient) return
    const handler = (event: Event) => {
      const custom = event as CustomEvent<Language>
      const next = custom?.detail
      const fromStorage = (localStorage.getItem("language") as Language) || undefined
      const candidate = (next === "en" || next === "zh") ? next : fromStorage
      if (candidate && candidate !== language) {
        setLanguage(candidate)
      }
    }
    window.addEventListener("languageChange", handler as EventListener)
    return () => window.removeEventListener("languageChange", handler as EventListener)
  }, [isClient, language])

  const getLanguage = (): Language => {
    return language
  }

  const t = (key: string): string => {
    // Use default language during SSR
    const currentLanguage = isClient ? language : "en"
    const keys = key.split('.')
    let value: any = translations[currentLanguage]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  return { t, getLanguage }
}
