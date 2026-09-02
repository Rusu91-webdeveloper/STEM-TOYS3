import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title:
    "Ghidul Complet al Jucăriilor STEM pentru Copii în 2026 - Top Recomandări",
  description:
    "Ghid exhaustiv cu peste 3000 de cuvinte despre jucăriile STEM: categorii, grupe de vârstă, beneficii educaționale și top recomandări pentru dezvoltarea copiilor.",
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/ghid-jucarii-stem-2026",
  translations: {
    ro: {
      title: "Ghidul Complet al Jucăriilor STEM pentru Copii în 2026",
      description:
        "Peste 3000 de cuvinte: categorii STEM, grupe de vârstă, beneficii, top recomandări.",
    },
    en: {
      title: "Ultimate STEM Toys Guide 2026",
      description:
        "Long-form guide: STEM categories, age groups, benefits, and top picks.",
    },
  },
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Ghidul Complet al Jucăriilor STEM în 2026",
      inLanguage: ["ro", "en"],
      wordCount: 3000,
      author: {
        "@type": "Person",
        name: "TechTots Editorial",
        url: "https://www.techtots.ro/about",
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://www.techtots.ro/ghid-jucarii-stem-2026",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Cum aleg jucăria STEM potrivită pentru vârsta copilului?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Folosește recomandările pe grupe de vârstă din ghid și asigură-te că dificultatea crește gradual. Alege seturi cu proiecte progresive și ghiduri clare.",
          },
        },
        {
          "@type": "Question",
          name: "Sunt jucăriile STEM sigure?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Toate produsele listate respectă standardele de siguranță. Verifică indicațiile de vârstă și folosește supraveghere când sunt incluse substanțe sau componente mici.",
          },
        },
        {
          "@type": "Question",
          name: "Ce categorie STEM să aleg pentru început?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Pornește de la interesul copilului: experimente (Știință), programare/jocuri (Tehnologie), construcții (Inginerie), logică/jocuri (Matematică).",
          },
        },
      ],
    },
  ],
});

export default async function Guide2026Metadata() {
  await cookies();
  return null;
}
