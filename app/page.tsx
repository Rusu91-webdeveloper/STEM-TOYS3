// [INFO] This is the Next.js homepage entry point. All child components have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See section files for detailed comments and rationale.
import type { Product } from "@/types/product";

import HomePageClient from "./HomePageClient";

// Critical CSS for hero section to prevent layout shift
const heroSectionCriticalCSS = `
  .hero-section {
    min-height: 36vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  @media (min-width: 640px) {
    .hero-section {
      min-height: 70vh;
    }
  }
  @media (min-width: 768px) {
    .hero-section {
      min-height: 80vh;
    }
  }
`;

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // We can use the full URL here for server-side fetching
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/products?featured=true&limit=3`, // Reduced from 4 to 3 for faster loading
      {
        next: { revalidate: 120 }, // Increased cache time to 2 minutes for better performance
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch featured products");
    }
    const data = await res.json();
    return data.products?.slice(0, 3) ?? []; // Reduced from 4 to 3
  } catch (error) {
    console.error("Error fetching featured products in Home page:", error);
    return []; // Return empty array on error
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      {/* Inline critical CSS for hero section */}
      <style dangerouslySetInnerHTML={{ __html: heroSectionCriticalCSS }} />
      <HomePageClient initialFeaturedProducts={featuredProducts} />
    </>
  );
}

// Metadata for home page with preload hints
export function generateMetadata() {
  return {
    title: "TechTots - STEM Toys for Creative Learning",
    description:
      "Discover innovative STEM toys that inspire creativity and learning in children",
    other: {
      // Preload critical resources for hero section
      "link-preload-hero": "/images/homepage_hero_banner_01.png",
    },
  };
}
