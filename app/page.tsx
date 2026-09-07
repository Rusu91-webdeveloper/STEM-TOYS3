import { unstable_cache } from "next/cache";
import { Suspense } from "react";

import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import {
  HOVER_RACER_SKU,
  PRODUCT_AGE_LABELS,
} from "@/features/home/merchandising";
import { applyProductContentOverride } from "@/lib/products/catalog-content-overrides";
import type { Product } from "@/types/product";

import HomePageClient from "./HomePageClient";

export const revalidate = 1800;

// Select from current inventory. Never infer popularity from product order.
const getRecommendations = unstable_cache(
  async (): Promise<Product[]> => {
    const { db } = await import("@/lib/db");
    const available = {
      isActive: true,
      status: "APPROVED" as const,
      stockQuantity: { gt: 0 },
    };
    const [hover, selection] = await Promise.all([
      db.product.findFirst({ where: { ...available, sku: HOVER_RACER_SKU } }),
      db.product.findMany({
        where: available,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 4,
      }),
    ]);
    const products = Array.from(
      new Map(
        [...(hover ? [hover] : []), ...selection].map(product => [
          product.id,
          product,
        ])
      ).values()
    ).slice(0, 4);
    return products.map(product =>
      applyProductContentOverride({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        price: product.price,
        images: product.images,
        stockQuantity: product.stockQuantity,
        ageGroup:
          product.ageGroup && product.ageGroup in PRODUCT_AGE_LABELS
            ? (product.ageGroup as Product["ageGroup"])
            : undefined,
        tags: product.tags,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        reservedQuantity: product.reservedQuantity,
        featured: product.featured,
      })
    );
  },
  ["homepage-recommendations-v4"],
  { revalidate: 300, tags: ["products"] }
);

async function Recommendations() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const products = await Promise.race([
      getRecommendations(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Homepage product query timed out")),
          5000
        );
      }),
    ]);
    return <FeaturedProductsGrid products={products} />;
  } catch (error) {
    console.error("Homepage recommendations unavailable", error);
    return <FeaturedProductsGrid products={[]} />;
  } finally {
    clearTimeout(timer);
  }
}

function RecommendationsLoading() {
  return (
    <section
      aria-label="Se încarcă produsele recomandate"
      aria-busy="true"
      className="border-y border-slate-200 bg-white py-7 sm:py-9"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="mb-5 text-2xl font-bold">Produse recomandate</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-5">
          {[0, 1, 2, 3].map(key => (
            <div
              key={key}
              className="overflow-hidden rounded-2xl border border-slate-200"
            >
              <div className="aspect-square bg-slate-50" />
              <div className="h-[240px] bg-white" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <HomePageClient>
      <Suspense fallback={<RecommendationsLoading />}>
        <Recommendations />
      </Suspense>
    </HomePageClient>
  );
}

export function generateMetadata() {
  return {
    title:
      "Jucării STEM, jucării educative și robotică pentru copii | TechTots",
    description:
      "TechTots este un magazin online din Romania cu jucarii STEM, jucarii educative, jucarii inteligente, kituri de robotica, jocuri de logica si experimente stiintifice pentru copii.",
    keywords: [
      "jucarii STEM",
      "jucarii educative",
      "jucarii inteligente",
      "robotica pentru copii",
      "kituri robotica copii",
      "jocuri logica copii",
      "experimente stiintifice copii",
      "jucarii STEM Bucuresti",
      "jucarii STEM Cluj",
    ],
    openGraph: {
      title:
        "Jucării STEM, jucării educative și robotică pentru copii | TechTots",
      description:
        "Magazin online din Romania cu jucarii STEM, robotica pentru copii, jocuri de logica si experimente stiintifice.",
      type: "website",
      locale: "ro_RO",
      images: [
        {
          url: "/images/homepage_hero_banner_01.png",
          width: 1200,
          height: 630,
          alt: "TechTots - jucarii STEM si educative pentru copii",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title:
        "Jucării STEM, jucării educative și robotică pentru copii | TechTots",
      description:
        "Exploreaza jucarii STEM, jucarii educative, robotica si experimente pentru copii.",
      images: ["/images/homepage_hero_banner_01.png"],
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
      canonical: "https://www.techtots.ro/",
    },
  };
}
