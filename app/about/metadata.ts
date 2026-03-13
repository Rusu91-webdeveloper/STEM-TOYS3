import { appConfig } from "@/lib/config/app-config";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Despre TechTots | Magazin online de jucarii STEM si educative",
  description:
    "Afla cine este TechTots, cum gandim selectia de jucarii STEM si educative si unde gasesti informatii despre comenzi, suport si misiunea brandului.",
  keywords: [
    "despre TechTots",
    "TechTots Romania",
    "jucării STEM România",
    "educație STEM copii",
    "misie TechTots",
    "valori TechTots",
    "echipa TechTots",
    "despre magazin jucarii STEM",
  ],
  pathWithoutLocale: "/about",
  canonicalUrl: "https://www.techtots.ro/about",
  translations: {
    ro: {
      title: "Despre TechTots | Magazin online de jucarii STEM si educative",
      description:
        "Afla cine este TechTots, cum gandim selectia de jucarii STEM si educative si unde gasesti informatii despre comenzi, suport si misiunea brandului.",
    },
    en: {
      title: "About TechTots | Online store for STEM and educational toys",
      description:
        "Learn who TechTots is, how we approach STEM toy selection, and where to find support, contact, and brand mission information.",
    },
  },
  structuredData: {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About TechTots România",
    description:
      "Pagina despre TechTots, magazin online din Romania specializat in jucarii STEM si educative.",
    url: "https://www.techtots.ro/about",
    mainEntity: {
      "@type": "Organization",
      name: "TechTots România",
      url: "https://www.techtots.ro",
      logo: "https://www.techtots.ro/TechTots_LOGO.png",
      description: "Jucarii STEM si resurse educationale pentru copii din Romania",
      foundingDate: "2024",
      address: {
        "@type": "PostalAddress",
        streetAddress: appConfig.streetAddress,
        addressLocality: appConfig.city,
        addressRegion: appConfig.state,
        postalCode: appConfig.postalCode,
        addressCountry: "RO",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: appConfig.storePhone,
        contactType: "customer service",
        availableLanguage: "Romanian",
      },
      sameAs: [
        "https://www.facebook.com/techtotsromania",
        "https://www.instagram.com/techtotsro",
        "https://www.linkedin.com/company/techtots-romania",
      ],
    },
  },
});
