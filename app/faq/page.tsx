import type { Metadata } from "next";
import React from "react";

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

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Întrebări frecvente</h1>
      <div className="space-y-6 text-muted-foreground">
        <div>
          <h2 className="text-xl font-semibold">Ce sunt jucăriile STEM?</h2>
          <p>
            Jucăriile STEM încurajează gândirea critică, creativitatea și
            învățarea practică în știință, tehnologie, inginerie și matematică.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            Sunt jucăriile potrivite pentru vârsta copilului meu?
          </h2>
          <p>
            Urmăriți recomandarea de vârstă de pe pagina produsului și folosiți
            filtrele pentru a găsi opțiuni adecvate.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            Care este politica de retur?
          </h2>
          <p>
            Acceptăm retur în 14 zile pentru produse nefolosite. Consultați
            pagina de retur pentru pași și condiții.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Sunt jucăriile sigure?</h2>
          <p>
            Produsele respectă standardele de siguranță și sunt atent verificate
            pentru calitate.
          </p>
        </div>
      </div>
    </div>
  );
}
