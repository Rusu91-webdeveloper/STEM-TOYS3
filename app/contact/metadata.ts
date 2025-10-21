import { createMetadata } from "@/lib/metadata";

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact TechTots România",
  description:
    "Contactează echipa TechTots România pentru întrebări despre jucării STEM, comenzi, parteneriate sau suport clienți.",
  url: "https://www.techtots.ro/contact",
  mainEntity: {
    "@type": "Organization",
    name: "TechTots România",
    url: "https://www.techtots.ro",
    logo: "https://www.techtots.ro/TechTots_LOGO.png",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+40-xxx-xxx-xxx",
        email: "contact@techtots.ro",
        contactType: "customer service",
        areaServed: "RO",
        availableLanguage: ["Romanian", "English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "technical support",
        email: "suport@techtots.ro",
        areaServed: "RO",
        availableLanguage: ["Romanian"],
      },
    ],
    sameAs: [
      "https://facebook.com/techtots.ro",
      "https://instagram.com/techtots.ro",
      "https://linkedin.com/company/techtots-romania",
    ],
  },
};

export const metadata = createMetadata({
  title: "Contact TechTots România | Suport Clienți și Parteneriate",
  description:
    "Suntem aici pentru întrebări despre comenzi, recomandări de jucării STEM sau parteneriate educaționale. Scrie-ne la contact@techtots.ro sau completează formularul de contact.",
  keywords: [
    "contact TechTots",
    "suport clienți TechTots",
    "contact jucării STEM",
    "parteneriate educaționale STEM",
    "suport comenzi TechTots",
  ],
  pathWithoutLocale: "/contact",
  canonicalUrl: "https://www.techtots.ro/contact",
  structuredData: contactStructuredData,
  translations: {
    ro: {
      title: "Contact TechTots România | Suport Clienți și Parteneriate",
      description:
        "Suntem aici pentru întrebări despre comenzi, recomandări de jucării STEM sau parteneriate educaționale. Scrie-ne la contact@techtots.ro sau completează formularul de contact.",
    },
    en: {
      title: "Contact TechTots Romania | Customer Support & Partnerships",
      description:
        "Reach out for order questions, STEM toy recommendations, or educational partnerships. Email contact@techtots.ro or use the contact form.",
    },
  },
});

