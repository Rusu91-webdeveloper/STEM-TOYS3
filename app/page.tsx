import type { Product } from "@/types/product";

import HomePageClient from "./HomePageClient";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // We can use the full URL here for server-side fetching
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/products?featured=true`,
      {
        cache: "no-store", // Or use revalidation if you want to cache
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
