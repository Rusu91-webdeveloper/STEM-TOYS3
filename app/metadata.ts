import { appConfig } from "@/lib/config/app-config";
import { createMetadata } from "@/lib/metadata";

const mainKeywords = [
  "jucarii STEM",
  "jucarii STEM Romania",
  "jucarii educative",
  "jucarii educative copii",
  "jucarii inteligente",
  "robotica pentru copii",
  "kituri robotica copii",
  "jocuri logica copii",
  "experimente stiintifice copii",
  "cadouri educative copii",
  "jucarii STEM Bucuresti",
  "jucarii STEM Cluj",
  "TechTots",
];

const baseUrl = "https://www.techtots.ro";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  url: baseUrl,
  name: "TechTots",
  inLanguage: "ro",
  potentialAction: {
    "@type": "SearchAction",
    target: `${baseUrl}/products?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${baseUrl}/#organization`,
  name: "TechTots",
  url: baseUrl,
  logo: {
    "@type": "ImageObject",
    url: `${baseUrl}/TechTots_LOGO.png`,
  },
  description:
    "Magazin online din Romania specializat in jucarii STEM, jucarii educative, kituri de robotica, jocuri de logica si experimente stiintifice pentru copii.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    telephone: appConfig.storePhone,
    email: appConfig.contactEmail,
    areaServed: "RO",
    availableLanguage: ["ro", "en"],
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: appConfig.streetAddress,
    addressLocality: appConfig.city,
    addressRegion: appConfig.state,
    postalCode: appConfig.postalCode,
    addressCountry: "RO",
  },
};

const onlineStoreSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${baseUrl}/#store`,
  name: "TechTots",
  url: baseUrl,
  currenciesAccepted: "RON",
  availableLanguage: ["ro", "en"],
  areaServed: {
    "@type": "Country",
    name: "Romania",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Catalog jucarii STEM si educative",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Jucarii STEM",
        url: `${baseUrl}/jucarii-stem`,
      },
      {
        "@type": "OfferCatalog",
        name: "Jucarii educative",
        url: `${baseUrl}/jucarii-educative`,
      },
      {
        "@type": "OfferCatalog",
        name: "Robotica pentru copii",
        url: `${baseUrl}/robotica-pentru-copii`,
      },
    ],
  },
};

export const metadata = createMetadata({
  title:
    "Jucarii STEM, jucarii educative si robotica pentru copii | TechTots",
  description:
    "TechTots este un magazin online din Romania cu jucarii STEM, jucarii educative, jucarii inteligente, kituri de robotica, jocuri de logica si experimente stiintifice pentru copii.",
  keywords: mainKeywords,
  structuredData: [websiteSchema, organizationSchema, onlineStoreSchema],
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/",
  verification: {
    google: "46d30c56bd33dcae",
  },
  other: {
    "google-site-verification": "46d30c56bd33dcae",
  },
  translations: {
    ro: {
      title:
        "Jucarii STEM, jucarii educative si robotica pentru copii | TechTots",
      description:
        "TechTots este un magazin online din Romania cu jucarii STEM, jucarii educative, jucarii inteligente, kituri de robotica, jocuri de logica si experimente stiintifice pentru copii.",
    },
  },
});
