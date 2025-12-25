import type { Metadata } from "next";
import { translations } from "./translations-data";

export type Language = "en" | "zh";

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  language?: Language;
}

const defaultImage = "/og-image.png"; // You should add this image
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xwan.ai";

export function generateMetadata(config: SEOConfig = {}): Metadata {
  const lang = config.language || "en";
  const t = translations[lang].seo;

  const title = config.title || t.defaultTitle;
  const description = config.description || t.defaultDescription;
  const keywords = config.keywords || t.defaultKeywords;
  const image = config.image || defaultImage;
  const url = config.url || siteUrl;
  const type = config.type || "website";

  return {
    title: {
      default: title,
      template: `%s | ${t.siteName}`,
    },
    description,
    keywords: keywords.split(", "),
    authors: [{ name: t.siteName }],
    creator: t.siteName,
    publisher: t.siteName,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
      languages: {
        "en": `${siteUrl}/en`,
        "zh": `${siteUrl}/zh`,
      },
    },
    openGraph: {
      type,
      locale: lang === "zh" ? "zh_CN" : "en_US",
      url,
      siteName: t.siteName,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@xwanai", // Update with your Twitter handle
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Add your verification codes here
      // google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
      // yahoo: "your-yahoo-verification-code",
    },
  };
}

// Helper function to get page-specific SEO metadata
export function getPageMetadata(page: "home" | "chat" | "database" | "settings", language: Language = "en"): Metadata {
  const t = translations[language].seo;

  const pageConfigs: Record<string, SEOConfig> = {
    home: {
      title: t.homeTitle,
      description: t.homeDescription,
      url: `${siteUrl}/`,
      language,
    },
    chat: {
      title: t.chatTitle,
      description: t.chatDescription,
      url: `${siteUrl}/chat`,
      language,
    },
    database: {
      title: t.databaseTitle,
      description: t.databaseDescription,
      url: `${siteUrl}/database`,
      language,
    },
    settings: {
      title: t.settingsTitle,
      description: t.settingsDescription,
      url: `${siteUrl}/settings`,
      language,
    },
  };

  return generateMetadata(pageConfigs[page] || { language });
}

