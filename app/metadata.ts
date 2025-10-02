import { createMetadata } from "@/lib/metadata";

// Main website keywords for SEO
const mainKeywords = [
  // Romanian-targeted keywords
  "jucării STEM",
  "jucării educative România",
  "jucării știință București",
  "jucării tehnologie copii",
  "jucării inginerie",
  "jucării matematică",
  "jocuri educative",
  "jucării educaționale STEM",
  "jocuri STEM România",
  "materiale educative",
  "jucării educative pentru copii",
  "TechTots România",

  // English keywords for immigrants
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

// Create rich structuredData for the homepage with transformation focus
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TechTots - Transformă Copilul Într-un Geniu STEM",
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
    "Oprește luptele cu temele pentru totdeauna! Alătură-te celor 10,000+ părinți care și-au transformat copiii din 'urăsc matematica' în 'când facem experimente?' cu jucăriile noastre STEM dovedite.",
  publisher: {
    "@type": "Organization",
    name: "TechTots",
    logo: {
      "@type": "ImageObject",
      url: "https://www.techtots.ro/TechTots_LOGO.png",
      width: "180",
      height: "60",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+40-xxx-xxx-xxx",
      contactType: "customer service",
      areaServed: "RO",
      availableLanguage: ["Romanian", "English"],
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
  },
  inLanguage: ["ro", "en"],
  audience: {
    "@type": "Audience",
    audienceType: "parents, educators, children",
  },
  offers: {
    "@type": "AggregateOffer",
    highPrice: "999",
    lowPrice: "49",
    priceCurrency: "RON",
    offerCount: "100+",
  },
};

// Create organization structured data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.techtots.ro/#organization",
  name: "TechTots România",
  url: "https://www.techtots.ro",
  logo: {
    "@type": "ImageObject",
    url: "https://www.techtots.ro/TechTots_LOGO.png",
    width: "180",
    height: "60",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "România",
    addressLocality: "București",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: "+40-xxx-xxx-xxx",
    email: "contact@techtots.com",
    availableLanguage: ["Romanian", "English"],
  },
  sameAs: [
    "https://facebook.com/techtots.ro",
    "https://instagram.com/techtots.ro",
    "https://linkedin.com/company/techtots-romania",
    "https://youtube.com/channel/techtots-romania",
  ],
};

// Combine structured data
const combinedStructuredData = [structuredData, organizationSchema];

export const metadata = createMetadata({
  title:
    "Transformă Copilul Într-un Geniu STEM - Jucării Educaționale Premium | TechTots",
  description:
    "Oprește luptele cu temele pentru totdeauna! Alătură-te celor 10,000+ părinți care și-au transformat copiii din 'urăsc matematica' în 'când facem experimente?' cu jucăriile noastre STEM dovedite. Garanție 30 zile.",
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
      title: "Transformă Copilul Într-un Geniu STEM - TechTots România",
      description:
        "Oprește luptele cu temele pentru totdeauna! Alătură-te celor 10,000+ părinți care și-au transformat copiii din 'urăsc matematica' în 'când facem experimente?' cu jucăriile noastre STEM dovedite. Garanție 30 zile.",
    },
    en: {
      title: "Transform Your Child Into a STEM Genius - TechTots Romania",
      description:
        "Stop homework battles forever! Join 10,000+ parents who've transformed their kids from 'I hate math' to 'When can we do experiments?' with our proven STEM toys. 30-day guarantee.",
    },
  },
});
