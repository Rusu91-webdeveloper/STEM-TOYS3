// [INFO] This is the Next.js homepage entry point. All child components have been refactored for perfect responsiveness, accessibility, and a premium, app-like user experience. See section files for detailed comments and rationale.
import type { HomeBundle } from "@/features/home/types";
import type { Product } from "@/types/product";

import HomePageClient from "./HomePageClient";

// **PERFORMANCE**: Critical CSS for hero section to prevent layout shift and improve FCP
const heroSectionCriticalCSS = `
  /* Critical above-the-fold styles for maximum FCP improvement */
  .hero-section {
    min-height: 50vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .hero-content {
    position: relative;
    z-10;
    text-align: center;
    color: white;
    padding: 1rem;
    max-width: 4xl;
    margin: 0 auto;
  }

  .hero-title {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto 2rem;
  }

  .hero-cta {
    background: white;
    color: #667eea;
    padding: 0.75rem 2rem;
    border-radius: 0.5rem;
    font-weight: 700;
    text-decoration: none;
    display: inline-block;
    transition: all 0.2s ease;
  }

  .hero-cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  /* Responsive breakpoints for critical content */
  @media (min-width: 640px) {
    .hero-section {
      min-height: 55vh;
    }
    .hero-title {
      font-size: 3rem;
    }
    .hero-subtitle {
      font-size: 1.25rem;
    }
  }

  @media (min-width: 768px) {
    .hero-section {
      min-height: 60vh;
    }
    .hero-title {
      font-size: 3.5rem;
    }
  }

  @media (min-width: 1024px) {
    .hero-section {
      min-height: 65vh;
    }
  }

  /* Loading states for better UX */
  .hero-loading {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
`;

// **PERFORMANCE**: Ultra-fast cached featured products query with minimal overhead
async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const cacheKey = "homepage_featured_products_v2";

    // **PERFORMANCE**: Minimal cache access with optimized TTL
    const { getCached } = await import("@/lib/cache");
    const TIME = (await import("@/lib/constants")).TIME;

    const cachedResult = await getCached(
      cacheKey,
      () => fetchFeaturedProductsOptimized(),
      TIME.CACHE_DURATION.MEDIUM // 30 minutes for homepage data
    );

    // **PERFORMANCE**: Return immediately without processing
    return cachedResult || [];
  } catch (error) {
    // **PERFORMANCE**: Silent error handling
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// **PERFORMANCE**: Ultra-optimized featured products query with minimal processing and aggressive caching
async function fetchFeaturedProductsOptimized(): Promise<Product[]> {
  const { db } = await import("@/lib/db");

  try {
    // **PERFORMANCE**: Add timeout to prevent hanging queries (590ms savings opportunity)
    const queryPromise = db.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        featured: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        images: true,
        stockQuantity: true,
        averageRating: true,
        reviewCount: true,
        ageGroup: true,
        stemDiscipline: true,
        tags: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8, // Show 8 products in the grid for better e-commerce showcase
    });

    // **PERFORMANCE**: Add timeout to prevent slow database queries from blocking LCP
    // In development, use longer timeout to allow debugging
    const timeoutMs = process.env.NODE_ENV === "development" ? 5000 : 500;
    const timeoutPromise = new Promise<Product[]>((resolve) => {
      setTimeout(() => {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[Featured Products] Query timed out after ${timeoutMs}ms`
          );
        }
        resolve([]);
      }, timeoutMs);
    });

    const products = await Promise.race([queryPromise, timeoutPromise]);

    // **DEBUG**: Log results in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Featured Products] Found ${products?.length || 0} products`
      );
    }

    // **PERFORMANCE**: Return raw data without any processing to minimize server time
    return products || [];
  } catch (error) {
    // **PERFORMANCE**: Silent error handling with immediate return to avoid blocking TTFB
    console.error("Database error in fetchFeaturedProductsOptimized:", error);
    return [];
  }
}

// **PERFORMANCE**: Cached homepage bundles query with defensive fallbacks
async function getHomepageBundles(): Promise<HomeBundle[]> {
  try {
    const cacheKey = "homepage_bundles_v1";
    const { getCached } = await import("@/lib/cache");
    const TIME = (await import("@/lib/constants")).TIME;

    const cachedResult = await getCached(
      cacheKey,
      () => fetchHomepageBundlesOptimized(),
      TIME.CACHE_DURATION.MEDIUM
    );

    return cachedResult || [];
  } catch (error) {
    console.error("Error fetching homepage bundles:", error);
    return [];
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readLocalizedField(
  metadata: unknown,
  language: "ro" | "en",
  keys: string[]
): string | null {
  const meta = toRecord(metadata);
  if (!meta) return null;

  const containerKeys = ["localized", "translations", "multilingual", language];
  const candidates: Array<unknown> = [meta];

  containerKeys.forEach((containerKey) => {
    const next = toRecord(meta[containerKey]);
    if (next) {
      candidates.push(next);
      const langObject = toRecord(next[language]);
      if (langObject) {
        candidates.push(langObject);
      }
    }
  });

  for (const candidate of candidates) {
    const asRecord = toRecord(candidate);
    if (!asRecord) continue;

    for (const key of keys) {
      const direct = readString(asRecord[key]);
      if (direct) return direct;

      const suffixed = readString(asRecord[`${key}_${language}`]);
      if (suffixed) return suffixed;

      const langSuffix =
        language === "ro"
          ? `${key}Ro`
          : `${key}En`;
      const bySuffix = readString(asRecord[langSuffix]);
      if (bySuffix) return bySuffix;
    }
  }

  return null;
}

async function fetchHomepageBundlesOptimized(): Promise<HomeBundle[]> {
  const { db } = await import("@/lib/db");

  try {
    const queryPromise = db.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        isBundle: true,
        stockQuantity: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        images: true,
        bundleDiscount: true,
        stockQuantity: true,
        metadata: true,
      },
      orderBy: [{ bundleDiscount: "desc" }, { createdAt: "desc" }],
      take: 3,
    });

    const timeoutMs = process.env.NODE_ENV === "development" ? 5000 : 500;
    const timeoutPromise = new Promise<HomeBundle[]>((resolve) => {
      setTimeout(() => {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[Homepage Bundles] Query timed out after ${timeoutMs}ms`);
        }
        resolve([]);
      }, timeoutMs);
    });

    const bundles = await Promise.race([queryPromise, timeoutPromise]);

    return (bundles ?? []).map((bundle) => {
      const trimmedDescription = bundle.description?.trim();
      const description =
        trimmedDescription && trimmedDescription.length > 0
          ? trimmedDescription
          : "Pachet atent selectat pentru progres rapid si invatare distractiva.";

      return {
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug,
        description,
        nameRo: readLocalizedField(bundle.metadata, "ro", ["name", "title"]),
        descriptionRo: readLocalizedField(bundle.metadata, "ro", [
          "description",
          "shortDescription",
          "summary",
        ]),
        nameEn: readLocalizedField(bundle.metadata, "en", ["name", "title"]),
        descriptionEn: readLocalizedField(bundle.metadata, "en", [
          "description",
          "shortDescription",
          "summary",
        ]),
        price: bundle.price,
        compareAtPrice: bundle.compareAtPrice,
        images: Array.isArray(bundle.images) ? bundle.images : [],
        bundleDiscount: bundle.bundleDiscount,
        stockQuantity: bundle.stockQuantity,
      };
    });
  } catch (error) {
    console.error("Database error in fetchHomepageBundlesOptimized:", error);
    return [];
  }
}

// **PERFORMANCE**: Incremental Static Regeneration for optimal TTFB and LCP
export const revalidate = 1800; // Revalidate every 30 minutes for better cache freshness

export default async function Home() {
  // **PERFORMANCE**: Aggressive caching strategy for TTFB optimization
  let featuredProducts: Product[] = [];
  let homepageBundles: HomeBundle[] = [];

  try {
    const featuredProductsPromise = Promise.race([
      getFeaturedProducts(),
      new Promise<Product[]>(resolve => {
        setTimeout(() => resolve([]), 200);
      }),
    ]);

    const bundlesPromise = Promise.race([
      getHomepageBundles(),
      new Promise<HomeBundle[]>(resolve => {
        setTimeout(() => resolve([]), 220);
      }),
    ]);

    [featuredProducts, homepageBundles] = await Promise.all([
      featuredProductsPromise,
      bundlesPromise,
    ]);
  } catch (error) {
    // **PERFORMANCE**: Silent fallback to prevent TTFB blocking
    console.error("Cache error in homepage:", error);
    featuredProducts = [];
    homepageBundles = [];
  }

  return (
    <>
      {/* **PERFORMANCE**: Inline critical CSS for immediate rendering */}
      <style dangerouslySetInnerHTML={{ __html: heroSectionCriticalCSS }} />
      <HomePageClient
        initialFeaturedProducts={featuredProducts}
        initialBundles={homepageBundles}
      />
    </>
  );
}

// SEO-Optimized Metadata for Hormozi-Transformed Homepage
export function generateMetadata() {
  return {
    title: "Transform Your Child Into a STEM Genius - TechTots Romania",
    description:
      "Stop homework battles forever! As AI and technology reshape our world, STEM education has never been more critical. Transform 'I hate math' to 'When can we do experiments?' with our proven STEM toys. Quality guaranteed.",
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
        "Families worldwide are discovering how STEM education prepares kids for tomorrow's AI-driven world. Our STEM toys turn 'I hate math' into 'When's our next experiment?' Quality guaranteed.",
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
        "Stop homework battles forever with our proven STEM toys. Quality guaranteed.",
      images: ["/images/homepage_hero_banner_01.png"],
    },
    other: {
      // **PERFORMANCE**: Preload critical resources for hero section to improve LCP
      "link-preload-hero":
        "/images/optimized/homepage_hero_banner_01_fallback.jpg",
      // Additional SEO meta tags
      robots: "index, follow, max-image-preview:large",
      googlebot: "index, follow, max-image-preview:large",
      bingbot: "index, follow, max-image-preview:large",
    },
    // **PERFORMANCE**: Add preload links in head for critical LCP resources
    links: [
      {
        rel: "preload",
        href: "/images/optimized/homepage_hero_banner_01_fallback.jpg",
        as: "image",
        type: "image/jpeg",
        fetchPriority: "high",
      },
    ],
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
