import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de Returnare | TechTots Educational Solutions",
  description:
    "Politica de returnare pentru produsele STEM educaționale. 14 zile calendaristice pentru retragere, costul returului suportat de client și garanție legală de 2 ani.",
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
      "14 zile calendaristice pentru retur, cu informații clare despre costul transportului și excepțiile pentru produse defecte.",
    type: "website",
    url: "https://www.techtots.ro/returns",
  },
  twitter: {
    card: "summary",
    title: "Politica de Returnare | TechTots",
    description:
      "14 zile calendaristice pentru retur, cu informații clare despre costul transportului și excepțiile pentru produse defecte.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://www.techtots.ro/returns",
  },
};
