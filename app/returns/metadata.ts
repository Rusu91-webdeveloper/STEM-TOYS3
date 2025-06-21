import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de Returnare | TechTots Educational Solutions",
  description:
    "Politica de returnare pentru produsele STEM educaționale. Returnări gratuite în 14 zile, conformă cu legislația UE din 2025. Garanție legală de 2 ani.",
  keywords: [
    "politica returnare",
    "returnare produse",
    "garanție",
    "drepturile consumatorului",
    "UE",
    "România",
    "STEM educațional",
    "jucării educaționale",
    "14 zile",
    "2 ani garanție",
  ].join(", "),
  openGraph: {
    title: "Politica de Returnare | TechTots",
    description:
      "Returnări simple și sigure în 14 zile. Garanție legală de 2 ani pentru toate produsele STEM educaționale.",
    type: "website",
    url: "/returns",
  },
  twitter: {
    card: "summary",
    title: "Politica de Returnare | TechTots",
    description:
      "Returnări simple și sigure în 14 zile. Garanție legală de 2 ani pentru toate produsele STEM educaționale.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/returns",
  },
};
