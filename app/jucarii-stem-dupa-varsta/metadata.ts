import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "metaTitle" as any,
  description: "metaDescription" as any,
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/jucarii-stem-dupa-varsta",
  translations: {
    ro: {
      title: "Jucării STEM Perfecte pentru Fiecare Vârstă",
      description:
        "Recomandări pe grupe de vârstă: 3-5, 6-8, 9-12, 13+ cu beneficii clare.",
    },
    en: {
      title: "STEM Toys by Age Group",
      description:
        "Age-specific STEM toy recommendations: 3-5, 6-8, 9-12, 13+ with benefits.",
    },
  },
  structuredData: [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Jucării STEM după vârstă",
      author: {
        "@type": "Person",
        name: "TechTots Editorial",
        url: "https://www.techtots.ro/about",
      },
      dateModified: new Date().toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Ce jucării STEM sunt potrivite pentru 3–5 ani?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Alege jocuri senzoriale, sortare, construcții mari și activități de numărare. Simplu, repetabil, cu feedback imediat.",
          },
        },
        {
          "@type": "Question",
          name: "Cum progresez de la 6–8 la 9–12 ani?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "De la programare vizuală și kituri scurte la robotică entry-level și proiecte de inginerie pe mai multe zile.",
          },
        },
        {
          "@type": "Question",
          name: "Ce opțiuni există pentru 13+ ani?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Proiecte reale cu microcontrolere, imprimare 3D, robotică avansată și interdisciplinaritate (eco, artă, mobilitate).",
          },
        },
      ],
    },
  ],
});

export default async function ByAgeMetadata() {
  await cookies();
  return null;
}
