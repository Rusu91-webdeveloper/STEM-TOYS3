import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Transformă Copilul din 'Urăsc Matematica' în 'Vreau Să Experimentez!' - Jucării STEM Dovedite | TechTots România",
  description:
    "Pe măsură ce AI și tehnologia transformă lumea, educația STEM este esențială pentru copiii tăi. Jucăriile noastre STEM transformă luptele cu temele în sesiuni de experimentare pasionante. Calitate garantată. Livrare rapidă în toată România.",
  keywords: [
    // Hormozi-focused transformation keywords
    "transformare copii matematică România",
    "jucării STEM care funcționează",
    "copii iubesc știința experimente",
    "stop lupte teme matematică",
    "jucării educaționale dovedite rezultate",
    "experimente acasă copii România",

    // Romanian long-tail SEO keywords
    "jucării STEM România 2025",
    "jucării educaționale copii București",
    "experimente știință acasă copii",
    "robotică copii România Cluj",
    "matematică distractivă copii Timișoara",
    "kituri inginerie copii Iași",
    "tehnologie educațională România",
    "jocuri STEM interactive românești",

    // Conversion-focused keywords
    "garanție jucării STEM",
    "rezultate garantate învățare copii",
    "transformare 30 zile matematică",
    "părinți mulțumiți jucării STEM",
    "consultare gratuită jucării educaționale",

    // Traditional SEO support
    "produse STEM educaționale",
    "jucării științifice copii",
    "kituri robotică educațională",
    "experimente chimie copii sigure",
    "construcții inginerie creativitate",
  ],
  openGraph: {
    title:
      "Transformă Copilul în Geniu STEM - Educație pentru Era AI | TechTots",
    description:
      "Descoperă secretul părinților care au transformat 'urăsc matematica' în 'când facem experimente?'. Produse de calitate garantată!",
    type: "website",
    images: [
      {
        url: "/images/products-transformation-hero.jpg",
        width: 1200,
        height: 630,
        alt: "Copil fericit experimentând cu jucării STEM - transformare de la plictiseală la pasiune pentru învățare",
      },
    ],
    locale: "ro_RO",
    siteName: "TechTots România - Jucării STEM",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transformă Copilul în Geniu STEM - Calitate Garantată",
    description:
      "Familii din întreaga lume transformă copiii cu jucăriile noastre STEM pentru era AI. Produse de calitate certificată!",
    site: "@TechTotsRO",
    creator: "@TechTotsRO",
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
    // Location targeting for Romanian market
    "geo.region": "RO",
    "geo.placename": "România",
    "geo.position": "45.9432;24.9668", // Romania center coordinates
    ICBM: "45.9432, 24.9668",

    // Enhanced meta for conversion
    "theme-color": "#10B981", // Green for trust/growth
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};
