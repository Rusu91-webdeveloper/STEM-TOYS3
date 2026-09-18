import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Întrebări Frecvente (FAQ) - Jucării STEM și Educație | TechTots",
  description:
    "Răspunsuri la cele mai frecvente întrebări despre jucăriile STEM, livrare, retur și siguranță. Ghid complet pentru părinți despre educația STEM.",
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
});

export default async function FAQMetadata() {
  await cookies();
  return null;
}
