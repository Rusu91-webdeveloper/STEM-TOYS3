import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Despre TechTots România - Jucării STEM pentru Minți Curioase",
  description:
    "Descoperă povestea TechTots România - cum ajutăm familii să-și pregătească copiii pentru era AI transformând 'urăsc matematica' în 'când facem experimente?' cu jucăriile noastre STEM dovedite.",
  keywords: [
    "despre TechTots",
    "povestea TechTots România",
    "jucării STEM România",
    "educație STEM copii",
    "transformare copii prin STEM",
    "misie TechTots",
    "valori TechTots",
    "echipa TechTots",
    "fondator TechTots",
  ],
  pathWithoutLocale: "/about",
  canonicalUrl: "https://www.techtots.ro/about",
  translations: {
    ro: {
      title: "Despre TechTots România - Jucării STEM pentru Minți Curioase",
      description:
        "Descoperă povestea TechTots România - cum ajutăm familii să-și pregătească copiii pentru era AI transformând 'urăsc matematica' în 'când facem experimente?' cu jucăriile noastre STEM dovedite.",
    },
    en: {
      title: "About TechTots Romania - STEM Toys for Curious Minds",
      description:
        "Discover the TechTots Romania story - how we help families prepare their children for the AI era by transforming 'I hate math' to 'when can we do experiments?' with our proven STEM toys.",
    },
  },
  structuredData: {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About TechTots România",
    description:
      "Descoperă povestea TechTots România - cum ajutăm familii să-și pregătească copiii pentru era AI transformând 'urăsc matematica' în 'când facem experimente?' cu jucăriile noastre STEM dovedite.",
    url: "https://www.techtots.ro/about",
    mainEntity: {
      "@type": "Organization",
      name: "TechTots România",
      url: "https://www.techtots.ro",
      logo: "https://www.techtots.ro/TechTots_LOGO.png",
      description: "Jucării STEM și resurse educaționale pentru copii români",
      foundingDate: "2025",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Strada Mehedinți 54-56",
        addressLocality: "Cluj-Napoca",
        addressRegion: "Cluj",
        postalCode: "400000",
        addressCountry: "RO",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+40-xxx-xxx-xxx",
        contactType: "customer service",
        availableLanguage: "Romanian",
      },
      sameAs: [
        "https://www.facebook.com/techtotsromania",
        "https://www.instagram.com/techtotsro",
        "https://www.linkedin.com/company/techtots-romania",
      ],
    },
  },
});
