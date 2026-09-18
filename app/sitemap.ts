import { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { regionalStemCities } from "@/lib/seo/regional-search";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.techtots.ro";

// Soft-404 product slugs (verified live - return "Product Not Found | TechTots")
// Exclude from sitemap - these products don't exist or can't be rendered
const SOFT_404_PRODUCT_SLUGS = new Set([
  "cubologic-16-joc-de-logica-DJ08576",
  "cubologic-9-joc-de-logica-DJ08581",
  "instrument-optic-3-in-1-telescop-periscop-microscop-navir-N_8097",
  "iq-test-tangram-in-cutie-metalica-fridolin-Fr_17323",
  "joc-circuit-domino-egmont-toys-Egm_570135",
  "joc-logic-iq-colour-sudoku-cube-fridolin-Fr_17366",
  "kit-constructie-robot---t-rex-kidz-robotix-4M-03460",
  "kit-stem-energia-eoliana-cu-turbina-si-masinuta-electrica-genius-toy-G_7087",
  "kit-stem-fabrica-de-roboti-genius-toy-G_7449",
  "kit-stem-kai-robotul-cu-inteligenta-artificiala-thames-kosmos-K_620392",
  "kit-stem-manusa-robotica-genius-toy-G_7080",
  "kit-stem-puterea-solara-fischertechnik-F_559882",
  "microscop-portabil-cu-led-si-uv-cu-adaptor-de-smartphone-marire-100-250x-microflip-MP-250",
  "mini-experiment-sparge-o-geoda-cristal-4M-03925",
  "orbita-spatiala-joc-de-logica-DJ00817",
  "set-constructie-plus-plus-tub-100-piese-robot-PP4105",
  "set-de-activitati-plus-plus-125-piese-spatiu-PP3989",
  "set-magnetic-circuit-cu-bile-compact-60-piese-cleverclixx-CC-1004",
  "terariu-cristale-cu-dinozauri-4m-experiment-stem-4M-03926",
  "zig-go-roll-traseu-reactie-in-lant-DJ05640",
  // Hard 404 with trailing slash-slug:
  "giroscop-navir-N_6010/CB",
]);

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: `${baseUrl}/`,
    changeFrequency: "daily",
    priority: 1,
  },
  {
    url: `${baseUrl}/products`,
    changeFrequency: "daily",
    priority: 0.95,
  },
  {
    url: `${baseUrl}/jucarii-stem`,
    changeFrequency: "weekly",
    priority: 0.95,
  },
  {
    url: `${baseUrl}/jucarii-educative`,
    changeFrequency: "weekly",
    priority: 0.92,
  },
  {
    url: `${baseUrl}/jucarii-inteligente`,
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${baseUrl}/cadouri-stem-6-8-ani`,
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${baseUrl}/robotica-pentru-copii`,
    changeFrequency: "weekly",
    priority: 0.92,
  },
  {
    url: `${baseUrl}/categories`,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${baseUrl}/blog`,
    changeFrequency: "weekly",
    priority: 0.82,
  },
  {
    url: `${baseUrl}/jucarii-stem-dupa-varsta`,
    changeFrequency: "weekly",
    priority: 0.82,
  },
  {
    url: `${baseUrl}/beneficiile-jucariilor-stem`,
    changeFrequency: "monthly",
    priority: 0.74,
  },
  {
    url: `${baseUrl}/ghid-educatie-stem-romania`,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${baseUrl}/ghid-jucarii-stem-2026`,
    changeFrequency: "monthly",
    priority: 0.72,
  },
  {
    url: `${baseUrl}/about`,
    changeFrequency: "monthly",
    priority: 0.72,
  },
  {
    url: `${baseUrl}/contact`,
    changeFrequency: "monthly",
    priority: 0.68,
  },
  {
    url: `${baseUrl}/faq`,
    changeFrequency: "monthly",
    priority: 0.65,
  },
  {
    url: `${baseUrl}/delivery`,
    changeFrequency: "monthly",
    priority: 0.64,
  },
  {
    url: `${baseUrl}/warranty`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${baseUrl}/returns`,
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Categories that actually render (from app/categories/[slug]/page.tsx KNOWN_SLUGS)
  const KNOWN_CATEGORY_SLUGS = [
    "science",
    "technology",
    "engineering",
    "math",
    "educational-books",
  ] as const;

  const [products, blogs] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
        stockQuantity: { gt: 0 },
        slug: { notIn: Array.from(SOFT_404_PRODUCT_SLUGS) },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
    db.blog.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
  ]);

  const regionalPages = regionalStemCities.map(city => ({
    url: `${baseUrl}/jucarii-stem/${city.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority:
      city.slug === "bucuresti" || city.slug === "cluj-napoca" ? 0.84 : 0.78,
  }));

  const categoryPages = KNOWN_CATEGORY_SLUGS.map(slug => ({
    url: `${baseUrl}/categories/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.62,
  }));

  const productPages = products.map(product => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogPages = blogs.map(blog => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.66,
  }));

  return staticRoutes
    .map(route => ({ ...route, lastModified: now }))
    .concat(regionalPages, categoryPages, productPages, blogPages);
}
