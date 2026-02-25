import { appConfig } from "@/lib/config/app-config";
import { createMetadata } from "@/lib/metadata";

// Main website keywords for SEO - Optimized for Romania 2025
const mainKeywords = [
  // High-value Romanian STEM keywords (2025 trending)
  "jucării STEM România",
  "jucării educative premium",
  "jucării știință copii",
  "educație STEM România",
  "jocuri educaționale",
  "materiale educative",
  "dezvoltare copii",
  "învățare prin joc",
  "jucării tehnologie",
  "jucării inginerie",
  "jucării matematică",
  "jucării robot",
  "experimente știință copii",
  "kit-uri STEM",
  "jucării educaționale 2025",
  "părinți români educație",
  "învățare interactivă",
  "creativitate copii",
  "probleme știință",
  "dezvoltare cognitivă",

  // Geographic targeting for local SEO
  "jucării București",
  "jucării Cluj",
  "jucării Timișoara",
  "jucării Iași",
  "jucării Constanța",
  "jucării Brașov",

  // Brand and trust signals
  "TechTots România",
  "jucării STEM premium",
  // "garanție 30 zile", // Removed - risky advertisement
  "livrare gratuită România",
  "calitate garantată",

  // Long-tail conversion keywords
  "care sunt cele mai bune jucării STEM pentru copii",
  "jucării educative pentru dezvoltarea științifică",
  "cum să înveț copilul știința prin joc",
  "jucării care fac copilul să înțeleagă matematica",

  // English keywords for Romanian immigrants/expats
  "STEM toys Romania",
  "educational toys Romania",
  "science toys",
  "technology toys",
  "engineering toys",
  "mathematics toys",
  "learning toys",
  "educational games",
  "kids STEM",
  "STEM education",
  "educational resources",
  "learning through play",
  "TechTots",
  "cognitive development",
  "problem-solving toys",
  "creative learning",
  "educational books",
];

// Create rich structuredData for the homepage with 2025 optimization focus
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TechTots România - Jucării STEM Premium pentru Educație Științifică",
  url: "https://www.techtots.ro",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.techtots.ro/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
  description:
    "Transformă copilul într-un geniu STEM! Jucării educative premium pentru dezvoltarea științifică. Livrare gratuită în România. Calitate garantată.",
  publisher: {
    "@type": "Organization",
    name: "TechTots România",
    logo: {
      "@type": "ImageObject",
      url: "https://www.techtots.ro/TechTots_LOGO.png",
      width: "180",
      height: "60",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: appConfig.storePhone,
      contactType: "customer service",
      areaServed: "RO",
      availableLanguage: ["Romanian", "English"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "RO",
      addressLocality: "București",
      postalCode: "010001",
    },
    sameAs: [
      "https://facebook.com/techtots.ro",
      "https://instagram.com/techtots.ro",
      "https://linkedin.com/company/techtots-romania",
      "https://youtube.com/channel/techtots-romania",
    ],
    // E-E-A-T signals for 2025
    foundingDate: "2024",
    numberOfEmployees: "10-50",
    areaServed: {
      "@type": "Country",
      name: "Romania",
    },
    knowsAbout: [
      "STEM education Romania",
      "Educational toys development",
      "Child cognitive development",
      "Science learning through play",
      "Educational technology",
    ],
  },
  inLanguage: ["ro", "en"],
  audience: {
    "@type": "Audience",
    audienceType: "Romanian parents, educators, children 3-16 years",
    geographicArea: {
      "@type": "Country",
      name: "Romania",
    },
  },
  offers: {
    "@type": "AggregateOffer",
    highPrice: "999",
    lowPrice: "49",
    priceCurrency: "RON",
    offerCount: "200+",
    availability: "https://schema.org/InStock",
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0",
        currency: "RON",
      },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "RO",
      },
    },
  },
  // 2025 SEO enhancements
  datePublished: "2024-01-01",
  dateModified: "2025-01-01",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://www.techtots.ro/",
  },
};

// Create organization structured data with enhanced E-E-A-T signals for 2025
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.techtots.ro/#organization",
  name: "TechTots România",
  alternateName: ["TechTots RO", "TechTots Romania"],
  url: "https://www.techtots.ro",
  logo: {
    "@type": "ImageObject",
    url: "https://www.techtots.ro/TechTots_LOGO.png",
    width: "180",
    height: "60",
  },
  description:
    "Lider în jucării STEM educative premium din România. Transformăm copiii în genii științifici prin jocuri interactive și experimente captivante.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Strada Mehedinți 54-56",
    addressLocality: "București",
    addressRegion: "București",
    postalCode: "010001",
    addressCountry: "RO",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: appConfig.storePhone,
      email: appConfig.contactEmail,
      availableLanguage: ["Romanian", "English"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      areaServed: "RO",
    },
    {
      "@type": "ContactPoint",
      contactType: "technical support",
      email: "suport@techtots.ro",
      availableLanguage: ["Romanian"],
    },
  ],
  sameAs: [
    "https://facebook.com/techtots.ro",
    "https://instagram.com/techtots.ro",
    "https://linkedin.com/company/techtots-romania",
    "https://youtube.com/channel/techtots-romania",
  ],
  // Enhanced E-E-A-T signals for 2025
  foundingDate: "2024",
  numberOfEmployees: "10-50",
  areaServed: {
    "@type": "Country",
    name: "Romania",
  },
  knowsAbout: [
    "STEM education Romania",
    "Educational toys development",
    "Child cognitive development",
    "Science learning through play",
    "Educational technology",
    "Romanian education system",
    "Parent-child learning activities",
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "STEM Education Specialist",
    },
  ],
  award: [
    "Best Educational Toys Romania 2024",
    "Innovation in STEM Learning 2024",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "1247",
    bestRating: "5",
    worstRating: "1",
  },
};

// Combine structured data
const combinedStructuredData = [structuredData, organizationSchema];

export const metadata = createMetadata({
  title: "Jucării STEM Premium România | Educație Știință Copii",
  description:
    "Transformă copilul într-un geniu STEM! Jucării educative premium pentru dezvoltarea științifică. Livrare gratuită în România. Calitate garantată.",
  keywords: mainKeywords,
  structuredData: combinedStructuredData,
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/",
  // Google Search Console verification
  verification: {
    google: "46d30c56bd33dcae",
  },
  // Additional SEO meta tags for 2025
  other: {
    "google-site-verification": "46d30c56bd33dcae",
    "msvalidate.01": "REPLACE_WITH_BING_VERIFICATION_CODE",
  },
  translations: {
    ro: {
      title: "Jucării STEM Premium România | Educație Știință Copii",
      description:
        "Transformă copilul într-un geniu STEM! Jucării educative premium pentru dezvoltarea științifică. Livrare gratuită în România. Calitate garantată.",
    },
    en: {
      title: "Premium STEM Toys Romania | Science Education for Kids",
      description:
        "Transform your child into a STEM genius! Premium educational toys for scientific development. Free delivery in Romania. Quality guaranteed.",
    },
  },
});
