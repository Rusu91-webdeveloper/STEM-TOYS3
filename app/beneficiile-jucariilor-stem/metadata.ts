import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title:
    "Beneficiile Jucăriilor STEM pentru Dezvoltarea Copilului - Ghid Complet 2025",
  description:
    "Descoperă cum jucăriile STEM dezvoltă gândirea critică, logica, creativitatea și colaborarea la copii. Ghid complet cu beneficii educaționale dovedite și recomandări de vârstă.",
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/beneficiile-jucariilor-stem",
  translations: {
    ro: {
      title:
        "De ce Sunt Importante Jucăriile STEM pentru Dezvoltarea Copilului",
      description:
        "Beneficii educaționale: gândire critică, logică, creativitate, colaborare, autonomie.",
    },
    en: {
      title: "Educational Benefits of STEM Toys",
      description:
        "How STEM toys build critical thinking, logic, creativity, collaboration, autonomy.",
    },
  },
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Beneficiile jucăriilor STEM",
      author: {
        "@type": "Person",
        name: "TechTots Editorial",
        url: "https://www.techtots.ro/about",
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Ce beneficii dezvoltă jucăriile STEM?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Gândire critică, logică, creativitate, colaborare, autonomie și transfer spre performanța școlară.",
          },
        },
        {
          "@type": "Question",
          name: "Cum cresc perseverența și autonomia?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Prin proiecte iterative, jurnal de proiect, feedback pe efort și normalizarea erorilor ca pas de învățare.",
          },
        },
        {
          "@type": "Question",
          name: "Cum conectez joaca STEM la viața reală?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Alege teme reale (energie, mediu), cere prezentări (poster/video) și folosește rubrici simple de auto-evaluare.",
          },
        },
      ],
    },
  ],
});

export default async function BenefitsMetadata() {
  await cookies();
  return null;
}
