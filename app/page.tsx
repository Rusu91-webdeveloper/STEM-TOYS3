import { unstable_cache } from "next/cache";

import { FeaturedProductsGrid } from "@/features/home/components/FeaturedProductsGrid";
import { PRODUCT_AGE_LABELS } from "@/features/home/merchandising";
import { applyProductContentOverride } from "@/lib/products/catalog-content-overrides";
import { selectHomepageProducts } from "@/lib/products/merchandising";
import { toShopperProduct } from "@/lib/products/public-shopper";
import type { Product } from "@/types/product";

import HomePageClient from "./HomePageClient";

export const revalidate = 1800;

// Same browse pool as /products: active, approved or pending, then visibleInBrowse.
// Featured flags come first. The rest is a stable fill, not a sales ranking.
const getRecommendations = unstable_cache(
  async (): Promise<Product[]> => {
    const { db } = await import("@/lib/db");
    const rows = await db.product.findMany({
      where: {
        isActive: true,
        OR: [{ status: "APPROVED" }, { status: "IN_PENDING" }],
        stockQuantity: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        images: true,
        stockQuantity: true,
        ageGroup: true,
        tags: true,
        attributes: true,
        metadata: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        reservedQuantity: true,
        featured: true,
      },
    });
    const products = selectHomepageProducts(
      rows.map(product => ({
        slug: product.slug,
        name: product.name,
        stockQuantity: product.stockQuantity,
        isBook: false,
        metadata: product.metadata,
        attributes: product.attributes,
        featured: product.featured,
        images: product.images,
        tags: product.tags,
        source: product,
      }))
    );
    return products.map(product => {
      const row = product.source;
      return toShopperProduct(
        applyProductContentOverride({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description ?? "",
          price: row.price,
          images: row.images,
          stockQuantity: row.stockQuantity,
          ageGroup:
            row.ageGroup && row.ageGroup in PRODUCT_AGE_LABELS
              ? (row.ageGroup as Product["ageGroup"])
              : undefined,
          tags: row.tags,
          attributes: row.attributes as Product["attributes"],
          metadata: row.metadata as Product["metadata"],
          ageRange:
            (row.attributes as { manufacturerRecommendedAge?: string } | null)
              ?.manufacturerRecommendedAge ??
            (row.attributes as { originalAgeText?: string } | null)
              ?.originalAgeText,
          isActive: row.isActive,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          reservedQuantity: row.reservedQuantity,
          featured: row.featured,
        })
      );
    });
  },
  ["homepage-recommendations-v6-browse"],
  { revalidate: 300, tags: ["products"] }
);

async function loadHomepageProducts(): Promise<Product[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getRecommendations(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Homepage product query timed out")),
          5000
        );
      }),
    ]);
  } catch (error) {
    console.error("Homepage recommendations unavailable", error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export default async function Home() {
  const products = await loadHomepageProducts();
  return (
    <HomePageClient featuredProducts={products}>
      <FeaturedProductsGrid products={products} />
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
          url: "/images/home/brand-unboxing.webp",
          width: 1200,
          height: 800,
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
      images: ["/images/home/brand-unboxing.webp"],
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
