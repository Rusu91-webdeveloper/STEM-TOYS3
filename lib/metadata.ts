import { Metadata } from "next";

import { appConfig } from "./config/app-config";
import { en } from "./i18n/translations/en";
import { ro } from "./i18n/translations/ro";
import { registerStructuredDataVariants } from "./structured-data-registry";

// Define available languages for metadata
export const metadataLanguages = [
  // Only Romanian pages are live right now; drop English alternates to avoid 404 hreflang
  { code: "ro", name: "Română", flag: "🇷🇴", region: "RO" },
];

function isTranslationKey(key: string): key is keyof typeof en {
  return key in en;
}

// Helper to get translations based on language code
function getTranslation(
  key: keyof typeof en | string,
  language: string = "ro"
): string {
  if (!key || typeof key !== "string") {
    return "";
  }

  // Allow direct literal strings for page-specific metadata
  if (!isTranslationKey(key)) {
    return key;
  }

  if (language === "ro" && key in ro) {
    const translation = ro[key as keyof typeof ro];
    // Ensure we only return string values, not nested objects
    return typeof translation === "string" ? translation : (en[key] as string);
  }
  return en[key] as string;
}

type MetadataOptions = {
  title?: keyof typeof en | string;
  description?: keyof typeof en | string;
  ogTitle?: keyof typeof en | string;
  ogDescription?: keyof typeof en | string;
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
  verification?: Metadata["verification"];
  other?: Metadata["other"];
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
  city = appConfig.city,
  region = appConfig.state,
  translations,
  pathWithoutLocale = "",
  verification,
  other,
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
  const languages: Record<string, string> = {};
  const alternateLocales: string[] = [];

  // Base URL for the canonical URL
  const baseUrl = "https://www.techtots.ro";

  // Build the languages object for alternates
  for (const lang of metadataLanguages) {
    const localizedPath =
      lang.code === "ro"
        ? `${baseUrl}${pathWithoutLocale}`
        : `${baseUrl}/${lang.code}${pathWithoutLocale}`;
    languages[lang.code] = localizedPath;

    if (lang.code !== "ro") {
      alternateLocales.push(`en_${lang.region}`);
    }
  }

  const resolvedTitle = getTranslation(title);
  const resolvedDescription = getTranslation(description);

  const metadata: Metadata = {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl || `${baseUrl}${pathWithoutLocale}`,
    },
    openGraph: {
      title: getTranslation(ogTitle || title),
      description: getTranslation(ogDescription || description),
      locale: "ro_RO",
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
      ...other,
    },
    verification: verification || {
      google: "46d30c56bd33dcae",
    },
    authors: [{ name: "TechTots Team", url: `${baseUrl}/about` }],
  };

  if (Object.keys(languages).length > 1) {
    metadata.alternates = {
      ...metadata.alternates,
      languages,
    };
  }

  if (alternateLocales.length > 0) {
    metadata.openGraph = {
      ...metadata.openGraph,
      alternateLocale: alternateLocales,
    };
  }

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
    if (pathWithoutLocale) {
      const localeCodes = metadataLanguages.map(lang => lang.code);
      registerStructuredDataVariants(
        pathWithoutLocale,
        localeCodes,
        structuredData
      );
    }
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
