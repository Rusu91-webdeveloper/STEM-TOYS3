import type { ReactNode } from "react";

import { metadata as checkoutMetadata } from "./metadata";

export const metadata = {
  ...checkoutMetadata,
  title: "Finalizare comanda | TechTots",
  description: "Flux privat de checkout pentru comenzile TechTots.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-image-preview": "none",
      "max-snippet": 0,
      "max-video-preview": 0,
    },
  },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
