import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Jucarii STEM, jucarii educative si kituri de robotica | TechTots",
  description:
    "Exploreaza catalogul TechTots cu jucarii STEM, jucarii educative, robotica pentru copii, jocuri de logica si experimente stiintifice. Filtreaza dupa varsta, categorie si interes.",
  keywords: [
    "jucarii STEM",
    "jucarii educative",
    "jucarii inteligente",
    "robotica pentru copii",
    "kituri robotica copii",
    "jocuri logica copii",
    "experimente stiintifice copii",
    "cadouri educative copii",
    "jucarii STEM Bucuresti",
    "jucarii STEM Cluj",
  ],
  openGraph: {
    title:
      "Jucarii STEM, jucarii educative si kituri de robotica | TechTots",
    description:
      "Catalog de jucarii STEM si educative pentru copii: robotica, logica, constructii si experimente stiintifice pentru acasa sau cadou.",
    type: "website",
    url: "https://www.techtots.ro/products",
    images: [
      {
        url: "/images/products-transformation-hero.jpg",
        width: 1200,
        height: 630,
        alt: "Catalog TechTots cu jucarii STEM si educative",
      },
    ],
    locale: "ro_RO",
    siteName: "TechTots",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Jucarii STEM, jucarii educative si kituri de robotica | TechTots",
    description:
      "Vezi produsele TechTots si filtreaza rapid jucarii STEM, robotica, logica si experimente pentru copii.",
    site: "@TechTotsRO",
    creator: "@TechTotsRO",
    images: ["/images/products-transformation-hero.jpg"],
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
    canonical: "https://www.techtots.ro/products",
  },
  other: {
    "geo.region": "RO",
    "geo.placename": "România",
  },
};
