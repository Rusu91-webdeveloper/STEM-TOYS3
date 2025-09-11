import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "metaTitle" as any,
  description: "metaDescription" as any,
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/faq",
  translations: {
    ro: {
      title: "Întrebări frecvente (FAQ) | TechTots",
      description:
        "Răspunsuri la cele mai frecvente întrebări despre jucăriile STEM, livrare, retur și siguranță.",
    },
    en: {
      title: "Frequently Asked Questions (FAQ) | TechTots",
      description:
        "Answers to common questions about STEM toys, shipping, returns, and safety.",
    },
  },
  structuredData: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Ce sunt jucăriile STEM?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Jucăriile STEM susțin învățarea în știință, tehnologie, inginerie și matematică prin joc practic.",
        },
      },
      {
        "@type": "Question",
        name: "Sunt jucăriile potrivite pentru vârsta copilului meu?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Fiecare produs are o recomandare de vârstă. Filtrați după vârstă pentru a găsi opțiuni potrivite.",
        },
      },
      {
        "@type": "Question",
        name: "Care este politica de retur?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Puteți returna produsele nefolosite în 14 zile. Detalii complete sunt disponibile pe pagina de retur.",
        },
      },
      {
        "@type": "Question",
        name: "Sunt jucăriile sigure?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Toate jucăriile respectă standardele de siguranță relevante și sunt testate pentru calitate.",
        },
      },
    ],
  },
});

export default async function FAQMetadata() {
  // no-op to ensure file is treated as a module; metadata is exported above
  // Using cookies() ensures this runs on the server and can adapt by locale if needed later
  await cookies();
  return null;
}
