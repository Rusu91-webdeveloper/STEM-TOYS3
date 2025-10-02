import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Blog STEM Educațional - Ghiduri și Resurse pentru Părinți | TechTots",
  description:
    "Descoperă cele mai noi articole despre educația STEM, ghiduri pentru părinți și resurse educaționale pentru dezvoltarea copiilor. Ghiduri practice și sfaturi de la experții TechTots.",
  keywords: [
    "blog educație STEM",
    "ghiduri pentru părinți",
    "educație copii",
    "resurse STEM",
    "jucării educative blog",
    "dezvoltare copii",
    "STEM România",
    "educație știință",
    "tehnologie copii",
    "matematică copii",
  ],
  pathWithoutLocale: "/blog",
  canonicalUrl: "https://www.techtots.ro/blog",
  translations: {
    ro: {
      title:
        "Blog STEM Educațional - Ghiduri și Resurse pentru Părinți | TechTots",
      description:
        "Descoperă cele mai noi articole despre educația STEM, ghiduri pentru părinți și resurse educaționale pentru dezvoltarea copiilor. Ghiduri practice și sfaturi de la experții TechTots.",
    },
    en: {
      title:
        "STEM Educational Blog - Guides and Resources for Parents | TechTots",
      description:
        "Discover the latest articles about STEM education, parent guides, and educational resources for children's development. Practical guides and tips from TechTots experts.",
    },
  },
  structuredData: {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "TechTots STEM Educational Blog",
    description:
      "Descoperă cele mai noi articole despre educația STEM, ghiduri pentru părinți și resurse educaționale pentru dezvoltarea copiilor.",
    url: "https://www.techtots.ro/blog",
    publisher: {
      "@type": "Organization",
      name: "TechTots România",
      url: "https://www.techtots.ro",
      logo: "https://www.techtots.ro/TechTots_LOGO.png",
    },
    inLanguage: ["ro", "en"],
  },
});
