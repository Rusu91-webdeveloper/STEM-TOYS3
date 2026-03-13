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
      eyebrow={`Cerere regionala ${regionalCity.city}`}
      title={regionalCity.heroTitle}
      description={regionalCity.heroDescription}
      primaryCta={{ href: "/products", label: "Vezi produsele STEM" }}
      secondaryCta={{
        href: "/jucarii-stem",
        label: "Vezi hubul national STEM",
      }}
      proofPoints={regionalCity.proofPoints}
      benefits={regionalCity.benefits}
      quickFacts={[
        {
          label: "Intentie regionala",
          value: `jucarii STEM ${regionalCity.city}, jucarii educative ${regionalCity.city}, robotica pentru copii ${regionalCity.city}`,
        },
        {
          label: "Ce rezolva",
          value: "Pagina conecteaza cautarea locala de tip oras + categorie cu huburile comerciale care chiar pot converti.",
        },
        {
          label: "Semnal de incredere",
          value: "Pagina este regionala, nu pretinde prezenta fizica locala si directioneaza transparent spre pagini nationale si de categorie.",
        },
        {
          label: "Legaturi critice",
          value: "Hub national STEM, robotica, jucarii educative, selectie dupa varsta si orase similare.",
        },
      ]}
      guides={[
        {
          title: `Cum foloseste aceasta pagina cererea din ${regionalCity.city}`,
          description:
            "Scopul nu este sa repete homepage-ul, ci sa raspunda expresiilor de cautare locale cu intentie de cumparare si sa trimita rapid spre cea mai relevanta pagina comerciala.",
        },
        {
          title: "Cand merita o pagina regionala in ecommerce",
          description:
            "Atunci cand cautarea combina orasul cu o intentie reala, iar pagina poate oferi rute utile spre selectie, livrare nationala si categorii relevante fara continut duplicat.",
        },
        {
          title: "Cum contribuie la AI search",
          description:
            "Prin raspunsuri directe, denumiri clare de entitati si relatii interne simple intre oras, categorie, varsta si intentie comerciala.",
        },
      ]}
      checklistTitle={`Cum ar trebui folosita pagina regionala pentru ${regionalCity.city}`}
      checklistItems={[
        "Incepe cu hubul local doar daca expresia de cautare include orasul sau intentia regionala.",
        "Dupa intrare, mergi spre pagina nationala sau categoria cea mai apropiata de interesul copilului.",
        "Foloseste selectie dupa varsta pentru a evita produse prea simple sau prea complexe.",
        "Compara cu alte pagini comerciale doar daca intentia devine mai specifica: educativ, inteligent sau robotica.",
      ]}
      clusters={[...nationalCommercialRoutes.slice(0, 4), ...siblingCities]}
      faqs={regionalCity.faq}
    />
  );
}
