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
      clusters={[...nationalCommercialRoutes.slice(0, 4), ...siblingCities]}
      faqs={regionalCity.faq}
    />
  );
}
