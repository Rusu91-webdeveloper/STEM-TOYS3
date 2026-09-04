import { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { regionalStemCities } from "@/lib/seo/regional-search";
import {
  isRemovedCategoryPageSlug,
  REMOVED_CATEGORY_PAGE_SLUGS,
} from "@/lib/utils/category-page-links";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.techtots.ro";

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
    url: `${baseUrl}/ghid-jucarii-stem-2025`,
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

  const [products, blogs, categories] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: true,
        status: "APPROVED",
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
    db.category.findMany({
      where: {
        isActive: true,
        slug: {
          notIn: [...REMOVED_CATEGORY_PAGE_SLUGS],
        },
      },
      select: {
        slug: true,
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

  const categoryPages = categories
    .filter(
      category =>
        !["science-experiments", "magnetic-building"].includes(category.slug) &&
        !isRemovedCategoryPageSlug(category.slug)
    )
    .map(category => ({
      url: `${baseUrl}/categories/${category.slug}`,
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
