import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CommercialLandingPage from "@/components/seo/CommercialLandingPage";
import { createMetadata } from "@/lib/metadata";
import {
  getRegionalStemCity,
  getRegionalStemLinks,
  getRegionalStemPath,
  nationalCommercialRoutes,
  regionalStemCities,
} from "@/lib/seo/regional-search";

type RegionalStemPageProps = {
  params: Promise<{
    city: string;
  }>;
};

export function generateStaticParams() {
  return regionalStemCities.map(city => ({
    city: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: RegionalStemPageProps): Promise<Metadata> {
  const { city } = await params;
  const regionalCity = getRegionalStemCity(city);

  if (!regionalCity) {
    return createMetadata({
      title: "Jucarii STEM Romania",
      description: "Descopera jucarii STEM, robotica si jucarii educative.",
      pathWithoutLocale: "/jucarii-stem",
      noindex: true,
    });
  }

  return createMetadata({
    title: regionalCity.title,
    description: regionalCity.description,
    keywords: [
      `jucarii STEM ${regionalCity.city}`,
      `jucarii educative ${regionalCity.city}`,
      `jucarii inteligente ${regionalCity.city}`,
      `robotica pentru copii ${regionalCity.city}`,
      `cadouri educative ${regionalCity.city}`,
    ],
    pathWithoutLocale: getRegionalStemPath(regionalCity.slug),
    canonicalUrl: `https://www.techtots.ro${getRegionalStemPath(regionalCity.slug)}`,
    city: regionalCity.city,
    region: regionalCity.county,
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `Jucarii STEM ${regionalCity.city}`,
        description: regionalCity.description,
        url: `https://www.techtots.ro${getRegionalStemPath(regionalCity.slug)}`,
        inLanguage: "ro",
        isPartOf: "https://www.techtots.ro/jucarii-stem",
        about: [
          "jucarii STEM",
          "jucarii educative",
          "robotica pentru copii",
          regionalCity.city,
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Acasa",
            item: "https://www.techtots.ro/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Jucarii STEM",
            item: "https://www.techtots.ro/jucarii-stem",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Jucarii STEM ${regionalCity.city}`,
            item: `https://www.techtots.ro${getRegionalStemPath(regionalCity.slug)}`,
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: regionalCity.faq.map(item => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  });
}

export default async function RegionalStemPage({
  params,
}: RegionalStemPageProps) {
  const { city } = await params;
  const regionalCity = getRegionalStemCity(city);

  if (!regionalCity) {
    notFound();
  }

  const siblingCities = getRegionalStemLinks()
    .filter(link => link.href !== getRegionalStemPath(regionalCity.slug))
    .slice(0, 2);

  return (
    <CommercialLandingPage
      eyebrow={`Jucarii STEM ${regionalCity.city}`}
      title={regionalCity.heroTitle}
      description={regionalCity.heroDescription}
      primaryCta={{ href: "/products", label: "Vezi produsele STEM" }}
      secondaryCta={{
        href: "/jucarii-stem",
        label: "Jucării STEM în toată țara",
      }}
      proofPoints={regionalCity.proofPoints}
      benefits={regionalCity.benefits}
      benefitsHeadline={{
        kicker: "De ce TechTots",
        title: `De ce parintii din ${regionalCity.city} aleg TechTots`,
      }}
      quickFacts={[
        {
          label: "Livrare",
          value: regionalCity.deliveryInfo,
        },
        {
          label: "Varste acoperite",
          value:
            "3-5 ani, 6-8 ani, 9-12 ani, 13+ ani — selectie curata dupa obiectiv educational si nivel de dificultate",
        },
        {
          label: "Branduri disponibile",
          value:
            "CreativaMente, Thames & Kosmos, Fischertechnik, 4M, Gigo Toys, Egmont Toys si altele",
        },
        {
          label: "Comenzi si intrebari",
          value:
            "Disponibil prin formular de contact; confirma disponibilitatea si termenul la checkout inainte de plata",
        },
      ]}
      guides={[
        {
          title: "Cum alegi dupa varsta",
          description:
            "Porneste de la varsta copilului si de la interesul dominant: experimente, constructii, logica sau robotica. Fiecare categorie are produse filtrate dupa nivel si dificultate.",
        },
        {
          title: "Cadouri cu sens",
          description:
            "Un produs STEM bun nu se simte ca o lectie. Dezvolta abilitate reala, ofera rezultate vizibile si ii tine pe copii concentrati — nu doar distrasi.",
        },
        {
          title: "Cum navighez catalogul",
          description:
            "Foloseste filtrele de varsta si categorie (stiinta, robotica, constructii, logica) pentru a ajunge rapid la produsul potrivit, fara sa parcurgi intregul catalog.",
        },
      ]}
      guidesHeadline={{
        kicker: "Ghid de alegere",
        title: "Cum alegi mai repede produsul potrivit",
        intro: "",
      }}
      checklistTitle="Inainte sa comanzi"
      checklistKicker="Checklist rapid"
      checklistItems={[
        "Alege varsta copilului ca punct de pornire, nu categoria sau brandul.",
        "Verifica daca produsul necesita supraveghere adulta sau poate fi folosit independent.",
        "Citeste obiectivul educational din descriere — nu doar lista de materiale incluse.",
        `Confirma termenul de livrare catre ${regionalCity.city} la finalizarea comenzii.`,
      ]}
      clusters={[...nationalCommercialRoutes.slice(0, 4), ...siblingCities]}
      faqs={regionalCity.faq}
    />
  );
}
