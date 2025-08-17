import { getCached } from "@/lib/cache";
import { db } from "@/lib/db";
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
    slug: "math",
    image: "/images/category_banner_math_01.png",
  },
  {
    nameKey: "Educational Books",
    description: "educationalBook",
    slug: "educational-books",
    image: "/images/category_banner_books_01.jpg",
  },
];

// Add a mapping from slug to the correct query value for the products page
export const slugToQueryCategory: Record<string, string> = {
  science: "science",
  technology: "technology",
  engineering: "engineering",
  math: "mathematics", // Fix: math → mathematics
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
    math: { en: "Math", ro: "Matematică" },
    "educational-books": { en: "Educational Books", ro: "Cărți Educaționale" },
  };

  return translations[slug]?.[language] || slug;
}

/**
 * Fetch categories with product counts from the database
 * Uses server-side caching for optimal performance
 */
export async function getCategories(
  language = "en"
): Promise<ServerCategoryData[]> {
  const cacheKey = getCacheKey("categories-server", { language });
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes server-side cache

  const categoriesWithCounts = await getCached(
    cacheKey,
    async () => {
      try {
        // Use Promise.all to fetch categories and book count concurrently
        const [dbCategories, bookCount] = await Promise.all([
          db.category.findMany({
            where: {
              isActive: true,
            },
            orderBy: {
              name: "asc",
            },
            include: {
              _count: {
                select: {
                  products: {
                    where: {
                      isActive: true,
                    },
                  },
                },
              },
            },
          }),
          // Also get the count of all active books
          db.book.count({
            where: {
              isActive: true,
            },
          }),
        ]);

        // Map database categories to our display categories with correct images and descriptions
        return staticCategoryData.map(displayCat => {
          const dbCategory = dbCategories.find(
            dbCat => dbCat.slug.toLowerCase() === displayCat.slug.toLowerCase()
          );

          let productCount = dbCategory?._count.products ?? 0;
          if (displayCat.slug === "educational-books") {
            productCount = bookCount;
          }

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
    const cacheKey = getCacheKey("sidebar-categories", { language });
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

    return await getCached(
      cacheKey,
      async () => {
        // Get all categories from database with product counts
        const [dbCategories, bookCount] = await Promise.all([
          db.category.findMany({
            where: {
              isActive: true,
            },
            include: {
              _count: {
                select: {
                  products: {
                    where: {
                      isActive: true,
                    },
                  },
                },
              },
            },
          }),
          db.book.count({
            where: {
              isActive: true,
            },
          }),
        ]);

        // Create a comprehensive list including all static categories
        const allCategories = staticCategoryData.map(staticCat => {
          const dbCategory = dbCategories.find(
            dbCat => dbCat.slug.toLowerCase() === staticCat.slug.toLowerCase()
          );

          let productCount = dbCategory?._count.products ?? 0;
          if (staticCat.slug === "educational-books") {
            productCount = bookCount;
          }

          // Debug logging for development
          if (process.env.NODE_ENV === "development") {
            console.log(`[SIDEBAR CATEGORIES] ${staticCat.slug}:`, {
              dbCategoryFound: !!dbCategory,
              dbCategorySlug: dbCategory?.slug,
              productCount,
              bookCount:
                staticCat.slug === "educational-books" ? bookCount : "N/A",
            });
          }

          return {
            id: staticCat.slug, // Use original slug for consistency
            label: getCategoryName(staticCat.slug, language),
            count: productCount,
          };
        });

        // Show all categories regardless of count - let users see all available options
        return allCategories;
      },
      CACHE_TTL
    );
  } catch (error) {
    console.error("Error fetching sidebar categories:", error);
    // Return fallback categories - always show all 5 categories even if DB fails
    return staticCategoryData.map(cat => ({
      id: cat.slug, // Use original slug for consistency
      label: getCategoryName(cat.slug, language),
      count: 0, // Show 0 count but still display the category
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
