import { Metadata } from "next";

import { en } from "./i18n/translations/en";
import { ro } from "./i18n/translations/ro";

// Define available languages for metadata
export const metadataLanguages = [
  { code: "ro", name: "Română", flag: "🇷🇴", region: "RO" },
  { code: "en", name: "English", flag: "🇬🇧", region: "US" },
];

// Helper to get translations based on language code
function getTranslation(key: keyof typeof en, language: string = "ro"): string {
  if (language === "ro" && key in ro) {
    const translation = ro[key as keyof typeof ro];
    // Ensure we only return string values, not nested objects
    return typeof translation === "string" ? translation : (en[key] as string);
  }
  return en[key] as string;
}

type MetadataOptions = {
  title?: keyof typeof en;
  description?: keyof typeof en;
  ogTitle?: keyof typeof en;
  ogDescription?: keyof typeof en;
  keywords?: string[];
  additionalKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
  noindex?: boolean;
  city?: string;
  region?: string;
  translations?: {
    [key: string]: {
      title?: string;
      description?: string;
    };
  };
  pathWithoutLocale?: string;
};

// Create metadata with alternates for each language
export function createMetadata({
  title = "metaTitle",
  description = "metaDescription",
  ogTitle,
  ogDescription,
  keywords = [],
  additionalKeywords = [],
  canonicalUrl,
  ogImage = "/opengraph-image.png",
  structuredData,
  noindex = false,
  city = "București",
  region = "RO",
  translations,
  pathWithoutLocale = "",
}: MetadataOptions = {}): Metadata {
  // Add the Romanian-specific keywords that improve local SEO
  const romanianKeywords = [
    "jucării educaționale România",
    "jucării STEM București",
    "jucării știință copii",
    "jucării tehnologie România",
    "jucării educative",
    "cadouri educaționale copii",
    "TechTots România",
  ];

  // Combine with the regular keywords
  const allKeywords = [...keywords, ...romanianKeywords, ...additionalKeywords];

  // Generate alternates for each supported language including hreflang attributes
  const languages = {};
  const alternateLanguages = [];

  // Base URL for the canonical URL
  const baseUrl = "https://techtots.com";

  // Build the languages object for alternates
  for (const lang of metadataLanguages) {
    languages[lang.code] = `/${lang.code}${pathWithoutLocale}`;
    alternateLanguages.push(lang.code === "ro" ? "ro_RO" : `en_${lang.region}`);
  }

  const resolvedTitle = getTranslation(title);
  const resolvedDescription = getTranslation(description);

  const metadata: Metadata = {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      languages,
      canonical: canonicalUrl || `${baseUrl}${pathWithoutLocale}`,
    },
    openGraph: {
      title: getTranslation(ogTitle || title),
      description: getTranslation(ogDescription || description),
      locale: "ro_RO",
      alternateLocale: alternateLanguages,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
      type: "website",
      siteName: "TechTots",
      url: canonicalUrl || `${baseUrl}${pathWithoutLocale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [ogImage],
      site: "@TechTotsRO",
      creator: "@TechTotsRO",
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    metadataBase: new URL(baseUrl),
    other: {
      // Location information for local SEO
      "geo.placename": city,
      "geo.region": region,
      "geo.position": "44.4268;26.1025", // Bucharest coordinates
      ICBM: "44.4268, 26.1025", // Bucharest coordinates
    },
    verification: {
      google: "your-google-verification-code", // Replace with your actual Google verification code
      yandex: "your-yandex-verification-code", // Replace with your actual Yandex verification code
    },
    authors: [{ name: "TechTots Team", url: `${baseUrl}/about` }],
  };

  // Add keywords if provided
  if (allKeywords && allKeywords.length > 0) {
    metadata.keywords = allKeywords;
  }

  // Add structured data if provided (for rich results)
  if (structuredData) {
    metadata.other = {
      ...metadata.other,
      structuredData: JSON.stringify(structuredData),
    };
  }

  // Add language-specific metadata for crawlers
  if (translations) {
    for (const [lang, data] of Object.entries(translations)) {
      if (data.title) {
        metadata.other = {
          ...metadata.other,
          [`title-${lang}`]: data.title,
        };
      }
      if (data.description) {
        metadata.other = {
          ...metadata.other,
          [`description-${lang}`]: data.description,
        };
      }
    }
  }

  return metadata;
}
