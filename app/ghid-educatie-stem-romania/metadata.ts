import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { generateSTEMEducationFAQSchema } from "@/lib/seo/advanced-schema";

export const metadata: Metadata = createMetadata({
  title: "Ghid Complet Educație STEM pentru Copii în România 2025 | TechTots",
  description: "Ghid practic pentru educația STEM în România: cum alegi jucării potrivite, cum organizezi activități acasă și cum legi joaca de știință, logică și tehnologie.",
  keywords: [
    "educație STEM România",
    "ghid jucarii STEM",
    "curriculum STEM românesc",
    "ghid părinți STEM",
    "dezvoltare abilități STEM copii",
    "cum să aleg jucării STEM pentru copil",
    "beneficii educație STEM copii români",
    "integrarea STEM în educația românească",
    "activități STEM acasă România",
    "robotică educațională România copii",
    "experimente științifice copii România",
    "matematică distractivă copii români",
    "resurse educatori STEM România",
    "STEM education Romania",
    "Romanian curriculum STEM",
    "educational toys Romania",
    "STEM learning Romania",
  ],
  ogImage: "/images/ghid-stem-romania-social.jpg",
  pathWithoutLocale: "/ghid-educatie-stem-romania",
  translations: {
    ro: {
      title: "Ghid Complet Educație STEM pentru Copii în România 2025 | TechTots",
      description: "Ghid practic pentru educația STEM în România: cum alegi jucării potrivite, cum organizezi activități acasă și cum legi joaca de știință, logică și tehnologie.",
    },
    en: {
      title: "Complete STEM Education Guide for Children in Romania 2025 | TechTots", 
      description: "A practical guide to STEM education in Romania, with toy selection advice, home activities, and links between play, science, logic, and technology.",
    }
  },
  structuredData: [
    generateSTEMEducationFAQSchema(),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Ghid Complet Educație STEM pentru Copii în România 2025",
      description: "Ghidul definitiv pentru educația STEM în România",
      author: {
        "@type": "Organization",
        name: "TechTots România",
        url: "https://www.techtots.ro"
      },
      publisher: {
        "@type": "Organization", 
        name: "TechTots",
        logo: {
          "@type": "ImageObject",
          url: "https://www.techtots.ro/logo.png"
        }
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      inLanguage: "ro",
      about: [
        {
          "@type": "Thing",
          name: "Educație STEM România",
          sameAs: "https://en.wikipedia.org/wiki/Science,_technology,_engineering,_and_mathematics"
        },
        {
          "@type": "Thing",
          name: "Curriculum Național Românesc",
          description: "Sistemul educațional oficial din România"
        }
      ],
      mentions: [
        {
          "@type": "Organization",
          name: "Educație STEM în România",
          description: "Context despre învățarea practică, știință, logică și tehnologie pentru copii."
        }
      ]
    }
  ]
});
