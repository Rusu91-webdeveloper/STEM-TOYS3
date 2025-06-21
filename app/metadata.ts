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

// Create rich structuredData for the homepage
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TechTots - Jucării STEM pentru Minți Curioase",
  url: "https://techtots.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://techtots.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
  description:
    "Descoperă colecția noastră de jucării STEM care fac învățarea distractivă și captivantă pentru copii de toate vârstele.",
  publisher: {
    "@type": "Organization",
    name: "TechTots",
    logo: {
      "@type": "ImageObject",
      url: "https://techtots.com/TechTots_LOGO.png",
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
  "@id": "https://techtots.com/#organization",
  name: "TechTots România",
  url: "https://techtots.com",
  logo: {
    "@type": "ImageObject",
    url: "https://techtots.com/TechTots_LOGO.png",
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
  title: "metaTitle",
  description: "metaDescription",
  keywords: mainKeywords,
  structuredData: combinedStructuredData,
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/",
  translations: {
    ro: {
      title: "TechTots | Jucării STEM pentru Minți Curioase",
      description:
        "Magazin online de jucării educaționale STEM pentru copii din România. Descoperiți jucării de știință, tehnologie, inginerie și matematică.",
    },
    en: {
      title: "TechTots | STEM Toys for Curious Minds",
      description:
        "Online store for STEM educational toys for children in Romania. Discover science, technology, engineering, and mathematics toys.",
    },
  },
});
