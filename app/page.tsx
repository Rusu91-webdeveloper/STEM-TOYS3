// [INFO] This is the Next.js homepage entry point. All child components have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See section files for detailed comments and rationale.
import type { Product } from "@/types/product";

import HomePageClient from "./HomePageClient";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // We can use the full URL here for server-side fetching
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/products?featured=true`,
      {
        next: { revalidate: 60 }, // Cache for 1 minute to allow static rendering
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch featured products");
    }
    const data = await res.json();
    return data.products?.slice(0, 4) ?? [];
  } catch (error) {
    console.error("Error fetching featured products in Home page:", error);
    return []; // Return empty array on error
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return <HomePageClient initialFeaturedProducts={featuredProducts} />;
}
