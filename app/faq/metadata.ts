import type { Metadata } from "next";

import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Întrebări frecvente despre jucării STEM | TechTots",
  description:
    "Răspunsuri clare despre alegerea jucăriilor STEM, vârsta recomandată, siguranță, livrare, plata ramburs și retururi.",
  ogImage: "/opengraph-image.png",
  pathWithoutLocale: "/faq",
});
