import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Categorii blog | TechTots",
  description:
    "Arhiva interna de categorii pentru continutul editorial TechTots.",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function BlogCategoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
