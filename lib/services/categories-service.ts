import { getCached } from "@/lib/cache";
import { db } from "@/lib/db";
import { getVisibleCategoryCounts } from "@/lib/products/category-listing";
import {
  canonicalizeCategorySlug,
  type CanonicalCategorySlug,
} from "@/lib/products/stem-category";
import { getCacheKey } from "@/lib/utils/cache-key";

interface ServerCategoryData {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  slug: string;
  image: string;
  productCount: number;
  isActive: boolean;
}

// Static category data with proper structure
const staticCategoryData = [
  {
    nameKey: "Science",
    description: "scienceCategoryDesc",
    slug: "science",
    image: "/images/category_banner_science_01.png",
  },
  {
    nameKey: "Technology",
    description: "technologyCategoryDesc",
    slug: "technology",
    image: "/images/category_banner_technology_01.png",
  },
  {
    nameKey: "Engineering",
    description: "engineeringCategoryDesc",
    slug: "engineering",
    image: "/images/category_banner_engineering_01.png",
  },
  {
    nameKey: "Math",
    description: "mathCategoryDesc",
    slug: "mathematics",
    image: "/images/category_banner_math_01.png",
  },
  {
    nameKey: "Educational Books",
    description: "educationalBooksCategoryDesc",
    slug: "educational-books",
    image: "/images/category_banner_books_01.jpg",
  },
];

// Add a mapping from slug to the correct query value for the products page
export const slugToQueryCategory: Record<string, string> = {
  science: "science",
  technology: "technology",
  engineering: "engineering",
  mathematics: "mathematics",
  "educational-books": "educational-books",
};

/**
 * Get category name translation based on language
 */
export function getCategoryName(slug: string, language: string = "en"): string {
  const translations: Record<string, Record<string, string>> = {
    science: { en: "Science", ro: "Știință" },
    technology: { en: "Technology", ro: "Tehnologie" },
    engineering: { en: "Engineering", ro: "Inginerie" },
    mathematics: { en: "Math", ro: "Matematică" },
    "educational-books": { en: "Educational Books", ro: "Cărți Educaționale" },
  };

  const key = canonicalizeCategorySlug(slug) ?? slug;
  return translations[key]?.[language] || translations[key]?.ro || slug;
}

/**
 * Fetch categories with product counts from the database
 * Uses server-side caching for optimal performance
 */
export async function getCategories(
  language = "en"
): Promise<ServerCategoryData[]> {
  const cacheKey = getCacheKey("categories-server-v2", { language });
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes server-side cache

  const categoriesWithCounts = await getCached(
    cacheKey,
    async () => {
      try {
        const [dbCategories, counts] = await Promise.all([
          db.category.findMany({
            where: {
              isActive: true,
            },
            orderBy: {
              name: "asc",
            },
          }),
          getVisibleCategoryCounts(),
        ]);

        // Map database categories to our display categories with correct images and descriptions
        return staticCategoryData.map(displayCat => {
          const dbCategory = dbCategories.find(
            dbCat => dbCat.slug.toLowerCase() === displayCat.slug.toLowerCase()
          );
          const productCount =
            counts[displayCat.slug as CanonicalCategorySlug] ?? 0;

          return {
            id: dbCategory?.id ?? displayCat.slug,
            name: getCategoryName(displayCat.slug, language),
            nameKey: displayCat.nameKey,
            description: displayCat.description,
            slug: displayCat.slug,
            image: displayCat.image,
            productCount,
            isActive: dbCategory?.isActive ?? true,
          };
        });
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Return fallback data with zero counts
        return staticCategoryData.map(cat => ({
          id: cat.slug,
          name: getCategoryName(cat.slug, language),
          nameKey: cat.nameKey,
          description: cat.description,
          slug: cat.slug,
          image: cat.image,
          productCount: 0,
          isActive: true,
        }));
      }
    },
    CACHE_TTL
  );

  return categoriesWithCounts;
}

/**
 * Get all available categories for sidebar filtering
 * This ensures the sidebar always shows all categories, not just those with current products
 */
export async function getAllCategoriesForSidebar(
  language = "en"
): Promise<Array<{ id: string; label: string; count: number }>> {
  try {
    const cacheKey = getCacheKey("sidebar-categories-v3", { language });
    const CACHE_TTL = 5 * 60 * 1000;

    return await getCached(
      cacheKey,
      async () => {
        const counts = await getVisibleCategoryCounts();

        return staticCategoryData.map(staticCat => ({
          id: staticCat.slug,
          label: getCategoryName(staticCat.slug, language),
          count: counts[staticCat.slug as CanonicalCategorySlug] ?? 0,
        }));
      },
      CACHE_TTL
    );
  } catch (error) {
    console.error("Error fetching sidebar categories:", error);
    return staticCategoryData.map(cat => ({
      id: cat.slug,
      label: getCategoryName(cat.slug, language),
      count: 0,
    }));
  }
}

/**
 * Generate structured data for categories page SEO
 */
export function generateCategoriesStructuredData(
  categories: ServerCategoryData[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "STEM Toy Categories",
    description:
      "Educational toy categories including Science, Technology, Engineering, Math, and Educational Books",
    itemListElement: categories.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: category.name,
        description: category.description,
        url: `/products?category=${slugToQueryCategory[category.slug] || category.slug}`,
        image: category.image,
      },
    })),
  };
}
