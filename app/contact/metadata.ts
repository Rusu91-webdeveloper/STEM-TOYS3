import { appConfig } from "@/lib/config/app-config";
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
        telephone: appConfig.storePhone,
        email: appConfig.contactEmail,
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
      "https://www.facebook.com/techtotsromania",
      "https://www.instagram.com/techtots_romania/",
      "https://linkedin.com/company/techtots-romania",
    ],
  },
};

export const metadata = createMetadata({
  title: "Contact TechTots România | Suport Clienți și Parteneriate",
  description: `Suntem aici pentru întrebări despre comenzi, recomandări de jucării STEM sau parteneriate educaționale. Scrie-ne la ${appConfig.contactEmail} sau completează formularul de contact.`,
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
      description: `Suntem aici pentru întrebări despre comenzi, recomandări de jucării STEM sau parteneriate educaționale. Scrie-ne la ${appConfig.contactEmail} sau completează formularul de contact.`,
    },
    en: {
      title: "Contact TechTots Romania | Customer Support & Partnerships",
      description: `Reach out for order questions, STEM toy recommendations, or educational partnerships. Email ${appConfig.contactEmail} or use the contact form.`,
    },
  },
});
