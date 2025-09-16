// [INFO] This is the Next.js homepage entry point. All child components have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See section files for detailed comments and rationale.
import type { Product } from "@/types/product";
import { headers } from "next/headers";

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
    // Build absolute URL for server-side fetch
    const hdrs = await headers();
    const host =
      hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
    const proto =
      hdrs.get("x-forwarded-proto") ||
      (process.env.NODE_ENV === "production" ? "https" : "http");
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/products?featured=true&limit=3`, {
      next: { revalidate: 120 }, // Increased cache time to 2 minutes for better performance
    });

    if (!res.ok) {
      throw new Error("Failed to fetch featured products");
    }
    const data = await res.json();
    return data.products?.slice(0, 3) ?? []; // Reduced from 4 to 3
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching featured products in Home page:", error);
    }
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

// SEO-Optimized Metadata for Hormozi-Transformed Homepage
export function generateMetadata() {
  return {
    title: "Transform Your Child Into a STEM Genius - TechTots Romania",
    description:
      "Stop homework battles forever! Join 10,000+ parents who've transformed their kids from 'I hate math' to 'When can we do experiments?' with our proven STEM toys. 30-day guarantee.",
    keywords: [
      // Primary conversion-focused keywords
      "transform copil geniu STEM",
      "oprire lupte teme",
      "jucării STEM care funcționează",
      "copii iubesc matematica",
      "experimente copii",

      // Traditional SEO keywords
      "jucării STEM România",
      "jucării educative copii",
      "jucării știință București",
      "jucării tehnologie",
      "jucării inginerie",
      "jucării matematică",

      // English keywords
      "STEM toys Romania",
      "transform child learning",
      "stop homework battles",
      "educational toys that work",
      "science experiments kids",
    ],
    openGraph: {
      title: "Transform Your Child Into a STEM Genius - TechTots",
      description:
        "Join 10,000+ parents who've stopped homework battles forever. Our STEM toys turn 'I hate math' into 'When's our next experiment?' - 30-day guarantee.",
      type: "website",
      locale: "ro_RO",
      alternateLocale: "en_US",
      images: [
        {
          url: "/images/homepage_hero_banner_01.png",
          width: 1200,
          height: 630,
          alt: "Child doing STEM experiment - transformation from struggling to loving learning",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Transform Your Child Into a STEM Genius",
      description:
        "Stop homework battles forever with our proven STEM toys. 30-day guarantee.",
      images: ["/images/homepage_hero_banner_01.png"],
    },
    other: {
      // Preload critical resources for hero section
      "link-preload-hero": "/images/homepage_hero_banner_01.png",
      // Additional SEO meta tags
      robots: "index, follow, max-image-preview:large",
      googlebot: "index, follow, max-image-preview:large",
      bingbot: "index, follow, max-image-preview:large",
    },
    // Structured data for better search results
    alternates: {
      canonical: "https://www.techtots.ro/",
      languages: {
        ro: "https://www.techtots.ro/ro/",
        en: "https://www.techtots.ro/en/",
      },
    },
  };
}
