"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import Image from "next/image";
import Link from "next/link";
import {
  ProductCard,
  ProductGrid,
  ProductFilters,
  ProductVariantProvider,
  type FilterGroup,
  type PriceRange,
  type FilterOption,
} from "@/features/products";
import type { Product } from "@/types/product";
import {
  Lightbulb,
  Atom,
  Microscope,
  ShieldQuestion,
  Star,
  Sparkles,
  Rocket,
  Brain,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CategoryIconInfo {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  letter: string;
}

// Define letter constants first to avoid circular references
const LETTER_S = "S";
const LETTER_T = "T";
const LETTER_E = "E";
const LETTER_M = "M";
const LETTER_B = "B";

// Category icons and styling for better visual representation
const categoryInfo: Record<string, CategoryIconInfo> = {
  science: {
    icon: Atom,
    bgColor: "bg-blue-500",
    textColor: "text-blue-500",
    letter: LETTER_S,
  },
  technology: {
    icon: Lightbulb,
    bgColor: "bg-green-500",
    textColor: "text-green-500",
    letter: LETTER_T,
  },
  engineering: {
    icon: Microscope,
    bgColor: "bg-orange-500",
    textColor: "text-orange-500",
    letter: LETTER_E,
  },
  mathematics: {
    icon: ShieldQuestion,
    bgColor: "bg-purple-500",
    textColor: "text-purple-500",
    letter: LETTER_M,
  },
  "educational-books": {
    icon: Brain,
    bgColor: "bg-red-500",
    textColor: "text-red-500",
    letter: LETTER_B,
  },
  engineeringlearning: {
    icon: Rocket,
    bgColor: "bg-amber-500",
    textColor: "text-amber-500",
    letter: LETTER_E,
  },
};

// Benefits of STEM toys with icons
const stemBenefits = [
  {
    icon: Brain,
    titleKey: "cognitiveDevelopment",
    descKey: "cognitiveDevelopmentDesc",
  },
  {
    icon: Sparkles,
    titleKey: "creativityInnovation",
    descKey: "creativityInnovationDesc",
  },
  {
    icon: Rocket,
    titleKey: "futureReady",
    descKey: "futureReadyDesc",
  },
  {
    icon: Star,
    titleKey: "funLearning",
    descKey: "funLearningDesc",
  },
];

// Interface for the category object returned by the API
interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

// Actual product type as returned by the API
interface ProductData extends Omit<Product, "category"> {
  category?: CategoryData;
  stemCategory?: string;
}

interface ClientProductsPageProps {
  initialProducts: ProductData[];
  searchParams: { [key: string]: string | string[] | undefined };
}

// Helper function to standardize category names to avoid duplicates
const normalizeCategory = (name: string): string => {
  // Convert to lowercase for consistency
  const lower = name.toLowerCase();

  // Handle various forms of "educational books" category
  if (
    lower === "educational-books" ||
    lower === "educational books" ||
    lower === "books" ||
    lower === "carti" ||
    lower === "carti educationale" ||
    lower.includes("book") ||
    lower.includes("carte")
  ) {
    return "educational-books";
  }

  // Handle various forms of engineering category
  if (lower === "inginerie" || lower.includes("engineer")) {
    return "engineering";
  }

  // Handle various forms of mathematics category
  if (
    lower === "mathematics" ||
    lower === "matematica" ||
    lower === "matematică" ||
    lower.includes("math") ||
    lower.includes("mate")
  ) {
    return "mathematics";
  }

  // Handle engineeringLearning category
  if (
    lower === "engineeringlearning" ||
    lower === "engineering learning" ||
    lower === "inginerie si invatare" ||
    lower === "inginerie și învățare"
  ) {
    return "engineeringlearning";
  }

  return lower;
};

// Internal component that uses useSearchParams
function ClientProductsPageContent({
  initialProducts,
  searchParams,
}: ClientProductsPageProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const { t } = useTranslation();

  // State Management (using initial server-side data)
  const [products] = useState<ProductData[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);

  // State for filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration and URL parameters
  useEffect(() => {
    const categoryParam = urlSearchParams.get("category");
    console.log("URL category param:", categoryParam);

    if (categoryParam) {
      const normalizedCategory = normalizeCategory(categoryParam);
      console.log("Setting selected categories:", [normalizedCategory]);
      setSelectedCategories([normalizedCategory]);
    }

    setIsHydrated(true);
  }, [urlSearchParams]);

  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  const [priceRangeFilter, setPriceRangeFilter] = useState<PriceRange>({
    min: 0,
    max: 500,
  });
  const [noPriceFilter, setNoPriceFilter] = useState<boolean>(true); // Default to no price filter

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Create category filter from initial data
  const categoryFilter = useMemo(() => {
    // Track normalized category names to avoid duplicates
    const categoryMap = new Map<
      string,
      {
        id: string;
        label: string;
        count: number;
        originalName: string;
      }
    >();

    // Always ensure all standard STEM categories are added
    // These categories should always be available in the filter
    const standardCategories = [
      "science",
      "technology",
      "engineering",
      "mathematics",
      "educational-books",
    ];

    // Get translations for standard categories
    const categoryTranslations: Record<string, string> = {
      science: t("scienceCategory", "Știință"),
      technology: t("technologyCategory", "Tehnologie"),
      engineering: t("engineeringCategory", "Inginerie"),
      mathematics: t("mathematicsCategory", "Matematică"),
      "educational-books": t("educationalBooksCategory", "Cărți educaționale"),
      engineeringLearning: t(
        "engineeringLearningCategory",
        "Inginerie și Învățare"
      ),
    };

    // Add all standard categories first
    standardCategories.forEach(cat => {
      const normalizedCat = normalizeCategory(cat);
      categoryMap.set(normalizedCat, {
        id: normalizedCat,
        label:
          categoryTranslations[normalizedCat] ||
          normalizedCat.charAt(0).toUpperCase() + normalizedCat.slice(1),
        count: 0,
        originalName: cat,
      });
    });

    // Count products for each category (avoid double counting)
    products.forEach(product => {
      // Determine the primary category for this product to avoid double counting
      let primaryCategory = "";
      let categoryLabel = "";
      let originalName = "";

      // Priority order: stemCategory > category.name > attributes.stemCategory
      if (product.stemCategory) {
        primaryCategory = normalizeCategory(product.stemCategory);
        categoryLabel =
          categoryTranslations[primaryCategory] || product.stemCategory;
        originalName = product.stemCategory;
      } else if (product.category?.name) {
        primaryCategory = normalizeCategory(product.category.name);
        categoryLabel =
          categoryTranslations[primaryCategory] || product.category.name;
        originalName = product.category.name;
      } else if (product.attributes && typeof product.attributes === "object") {
        const attrs = product.attributes as Record<string, any>;
        if (attrs.stemCategory) {
          primaryCategory = normalizeCategory(attrs.stemCategory);
          categoryLabel =
            categoryTranslations[primaryCategory] || attrs.stemCategory;
          originalName = attrs.stemCategory;
        }
      }

      // Only count if we found a valid category
      if (primaryCategory) {
        const existingCategory = categoryMap.get(primaryCategory);

        if (existingCategory) {
          existingCategory.count += 1;
        } else {
          categoryMap.set(primaryCategory, {
            id: primaryCategory,
            label: categoryLabel,
            count: 1,
            originalName: originalName,
          });
        }
      }
    });

    // Convert map to array
    const categories = Array.from(categoryMap.values());
    console.log("Available categories for filter:", categories);

    return {
      id: "category",
      name: t("stemCategory", "STEM Category"),
      options: categories
        // Sort options: first by standard categories in their defined order, then by name
        .sort((a, b) => {
          const aIndex = standardCategories.indexOf(a.id);
          const bIndex = standardCategories.indexOf(b.id);

          // If both are standard categories, sort by their order in standardCategories
          if (aIndex >= 0 && bIndex >= 0) {
            return aIndex - bIndex;
          }

          // If only a is a standard category, it should come first
          if (aIndex >= 0) return -1;

          // If only b is a standard category, it should come first
          if (bIndex >= 0) return 1;

          // If neither is a standard category, sort alphabetically
          return a.label.localeCompare(b.label);
        }),
    };
  }, [products, t]);

  // Create dynamic filters from product data
  const dynamicFilters = useMemo(() => {
    const ageRangeMap = new Map<
      string,
      { id: string; label: string; count: number }
    >();
    const difficultyMap = new Map<
      string,
      { id: string; label: string; count: number }
    >();

    products.forEach(product => {
      // Process Age Range
      if (product.ageRange) {
        const age = product.ageRange.trim();
        if (age) {
          const existing = ageRangeMap.get(age);
          if (existing) {
            existing.count++;
          } else {
            ageRangeMap.set(age, {
              id: age,
              label: `${age} years`, // Use raw value
              count: 1,
            });
          }
        }
      }

      // Process Difficulty Level
      const difficulty = product.attributes?.difficultyLevel as string;
      if (difficulty) {
        const d = difficulty.trim().toLowerCase();
        if (d) {
          const existing = difficultyMap.get(d);
          if (existing) {
            existing.count++;
          } else {
            difficultyMap.set(d, {
              id: d,
              label: d.charAt(0).toUpperCase() + d.slice(1), // Use raw value
              count: 1,
            });
          }
        }
      }
    });

    const filters: FilterGroup[] = [];

    if (ageRangeMap.size > 0) {
      filters.push({
        id: "ageRange",
        name: t("ageRange"),
        options: Array.from(ageRangeMap.values()).sort((a, b) =>
          a.label.localeCompare(b.label)
        ),
      });
    }

    if (difficultyMap.size > 0) {
      filters.push({
        id: "difficulty",
        name: t("difficultyLevel"),
        options: Array.from(difficultyMap.values()),
      });
    }

    return filters;
  }, [products, t]);

  // Calculate filtered products based on all filters applied
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    console.log("All products:", products.length);
    console.log("Selected categories:", selectedCategories);
    console.log("Is hydrated:", isHydrated);

    // Only apply category filtering if we have selected categories AND we're hydrated
    // This prevents hydration mismatches and ensures all products show initially
    if (selectedCategories.length > 0 && isHydrated) {
      filtered = filtered.filter(product => {
        // Get category info from the product
        const prodCategoryName = (product.category?.name || "").toLowerCase();
        const prodCategorySlug = (product.category?.slug || "").toLowerCase();

        // Get STEM category from attributes or from the stemCategory field
        let stemCategoryValue = "";
        if (product.stemCategory) {
          stemCategoryValue = product.stemCategory.toLowerCase();
        } else if (
          product.attributes &&
          typeof product.attributes === "object"
        ) {
          const attrs = product.attributes as Record<string, any>;
          stemCategoryValue = attrs.stemCategory
            ? attrs.stemCategory.toLowerCase()
            : "";
        }

        // Improved category matching with better logging
        return selectedCategories.some(cat => {
          const lowerCat = cat.toLowerCase();

          // Special case for engineering category
          if (lowerCat === "engineering") {
            const matchByCategorySlug =
              prodCategorySlug === "engineering" ||
              prodCategorySlug.includes("inginerie");
            const matchByStemCategory = stemCategoryValue === "engineering";
            const matchByEngineeringInName =
              prodCategoryName.includes("inginerie") ||
              prodCategoryName.includes("engineer");

            const match =
              matchByCategorySlug ||
              matchByStemCategory ||
              matchByEngineeringInName;

            console.log(
              `  Engineering match for ${product.name}: ${match} (slug:${matchByCategorySlug}, stem:${matchByStemCategory}, name:${matchByEngineeringInName})`
            );
            return match;
          }

          // Special case for educational-books
          if (lowerCat === "educational-books" || lowerCat === "books") {
            const isBook =
              prodCategoryName.includes("book") ||
              prodCategorySlug.includes("book") ||
              prodCategorySlug === "educational-books" ||
              prodCategorySlug === "carti" ||
              prodCategoryName.includes("carti") ||
              stemCategoryValue === "educational-books";

            console.log(
              `  Book match for ${product.name}: ${isBook} (name:${prodCategoryName}, slug:${prodCategorySlug}, stem:${stemCategoryValue})`
            );
            return isBook;
          }

          // Regular matching for other categories
          const match =
            prodCategoryName === lowerCat ||
            prodCategorySlug === lowerCat ||
            stemCategoryValue === lowerCat;

          console.log(
            `  Matching ${product.name} with ${lowerCat}: ${match} (name:${prodCategoryName}, slug:${prodCategorySlug}, stem:${stemCategoryValue})`
          );
          return match;
        });
      });
    }

    console.log("Filtered products count:", filtered.length);

    // Filter by attributes
    Object.entries(selectedFilters).forEach(([filterId, values]) => {
      if (values.length > 0) {
        if (filterId === "ageRange") {
          filtered = filtered.filter(product => {
            if (!product.ageRange) return false;

            const [productMin, productMax] = product.ageRange
              .split("-")
              .map(Number);

            return values.some(range => {
              const [filterMin, filterMax] = range.split("-").map(Number);

              // Check if product age range overlaps with filter age range
              return (
                (productMin <= filterMax && productMax >= filterMin) ||
                (filterMin <= productMax && filterMax >= productMin)
              );
            });
          });
        } else if (filterId === "difficulty") {
          filtered = filtered.filter(product => {
            const productDifficulty = (
              product.attributes?.difficultyLevel as string
            )?.toLowerCase();
            if (!productDifficulty) return false;
            return values.includes(productDifficulty);
          });
        } else if (filterId === "productType") {
          filtered = filtered.filter(product => {
            // Check product attributes for type
            return values.some(value =>
              product.attributes?.type
                ?.toLowerCase()
                .includes(value.toLowerCase())
            );
          });
        }
      }
    });

    // Filter by price range (only if price filter is enabled)
    if (!noPriceFilter) {
      filtered = filtered.filter(
        product =>
          product.price >= priceRangeFilter.min &&
          product.price <= priceRangeFilter.max
      );
    }

    return filtered;
  }, [
    products,
    selectedCategories,
    selectedFilters,
    priceRangeFilter,
    noPriceFilter,
    isHydrated,
  ]);

  // Update the URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedCategories.length === 1) {
      params.set("category", selectedCategories[0]);
    }

    const currentUrl = window.location.pathname;
    const newUrl =
      selectedCategories.length > 0
        ? `${currentUrl}?${params.toString()}`
        : currentUrl;

    window.history.replaceState(null, "", newUrl);
  }, [selectedCategories]);

  // Handler for category filter changes
  const handleCategoryChange = (categoryId: string) => {
    // Use the normalizeCategory function to ensure consistent category naming
    const normalizedCategoryId = normalizeCategory(categoryId);

    setSelectedCategories(prev => {
      // Check if this category is already selected (case insensitive comparison)
      const isAlreadySelected = prev.some(
        cat => normalizeCategory(cat) === normalizedCategoryId
      );

      if (isAlreadySelected) {
        // Remove this category
        return prev.filter(
          cat => normalizeCategory(cat) !== normalizedCategoryId
        );
      } else {
        // Add this category, replacing any existing ones
        // This ensures only one category is selected at a time
        return [normalizedCategoryId];
      }
    });
  };

  // Handler for other filter changes
  const handleFilterChange = (filterId: string, optionId: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[filterId] || [];
      if (currentValues.includes(optionId)) {
        const newValues = currentValues.filter(id => id !== optionId);
        return {
          ...prev,
          [filterId]: newValues,
        };
      } else {
        return {
          ...prev,
          [filterId]: [...currentValues, optionId],
        };
      }
    });
  };

  // Handler for price range changes
  const handlePriceChange = (range: PriceRange) => {
    setPriceRangeFilter(range);
  };

  // Handler for no price filter checkbox
  const handleNoPriceFilterChange = (checked: boolean) => {
    setNoPriceFilter(checked);
  };

  // Handler to clear all filters
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedFilters({});
    setPriceRangeFilter({
      min: 0,
      max: 500,
    });
    setNoPriceFilter(true); // Reset to no price filter
  };

  // Get the active category for the header
  const activeCategory =
    selectedCategories.length === 1
      ? categoryFilter.options.find(c => {
          // Use normalizeCategory for consistent category matching
          return (
            normalizeCategory(c.id) === normalizeCategory(selectedCategories[0])
          );
        })
      : null;

  // Get appropriate category info
  const activeCategoryInfo = activeCategory
    ? categoryInfo[activeCategory.id] || categoryInfo.science
    : categoryInfo.science;

  // Get category image based on active category
  const categoryImagePath = activeCategory
    ? activeCategory.id === "mathematics"
      ? "/images/category_banner_math_01.png"
      : activeCategory.id === "educational-books"
        ? "/images/category_banner_books_01.jpg"
        : `/images/category_banner_${activeCategory.id}_01.png`
    : "/images/homepage_hero_banner_01.png";

  const IconComponent = activeCategoryInfo.icon;

  // Helper function to get category title based on active category
  const getCategoryTitle = () => {
    if (!activeCategory)
      return t("discoverStemToys", "Descoperă Jucării STEM Educaționale");

    switch (activeCategory.id) {
      case "science":
        return t("scienceToysTitle");
      case "technology":
        return t("technologyToysTitle");
      case "engineering":
        return t("engineeringToysTitle");
      case "mathematics":
        return t("mathematicsToysTitle");
      case "educational-books":
        return t("educationalBooks");
      default:
        return t("discoverStemToys", "Descoperă Jucării STEM Educaționale");
    }
  };

  // Helper function to get description based on active category
  const getCategoryDescription = () => {
    if (!activeCategory) return t("stemToysDescription");

    switch (activeCategory.id) {
      case "science":
        return t("scienceToysDescription");
      case "technology":
        return t("technologyToysDescription");
      case "engineering":
        return t("engineeringToysDescription");
      case "mathematics":
        return t("mathematicsToysDescription");
      case "educational-books":
        return t(
          "educationalBooksDesc",
          "Discover our collection of educational books designed to inspire young minds"
        );
      default:
        return t("stemToysDescription");
    }
  };

  // Helper function to get learning section title based on active category
  const getLearningTitle = () => {
    if (!activeCategory) return "";

    switch (activeCategory.id) {
      case "science":
        return t("scienceLearning");
      case "technology":
        return t("technologyLearning");
      case "engineering":
        return t("engineeringLearning");
      case "mathematics":
        return t("mathematicsLearning");
      case "educational-books":
        return t("booksLearning", "Books That Inspire Young Minds");
      case "engineeringlearning":
        return t("engineeringLearningTitle", "Engineering Learning Concepts");
      default:
        return "";
    }
  };

  // Helper function to get learning section description based on active category
  const getLearningDescription = () => {
    if (!activeCategory) return "";

    switch (activeCategory.id) {
      case "science":
        return t("scienceLearningDesc");
      case "technology":
        return t("technologyLearningDesc");
      case "engineering":
        return t("engineeringLearningDesc");
      case "mathematics":
        return t("mathematicsLearningDesc");
      case "educational-books":
        return t(
          "booksLearningDesc",
          "Our educational books are carefully crafted to foster a love of learning and inspire curiosity in children."
        );
      case "engineeringlearning":
        return t(
          "engineeringLearningDescription",
          "These toys help children develop engineering skills through engaging, hands-on projects and experiments."
        );
      default:
        return "";
    }
  };

  // Modified product card content
  const getProductCardContent = (product: ProductData) => {
    // Determine what to display based on the product type/category
    const category = product.category?.slug?.toLowerCase() || "";
    const stemCategory = (product.stemCategory || "").toLowerCase();

    // Default content
    let title = product.name;
    let description = product.description;

    // Handle special category-specific content
    if (
      category === "educational-books" ||
      stemCategory === "educational-books"
    ) {
      title = t("booksLearning", "Cărți care inspiră mințile tinere");
      description = t(
        "booksLearningDesc",
        "Cărțile noastre educaționale sunt atent concepute pentru a cultiva dragostea pentru învățare și a inspira curiozitatea la copii."
      );
    } else if (category === "mathematics" || stemCategory === "mathematics") {
      title = t("mathematicsLearning", "Învățare prin Matematică");
      description = t(
        "mathematicsLearningDesc",
        "Descoperă frumusețea numerelor și a tiparelor cu jucăriile noastre de matematică."
      );
    } else if (category === "engineering" || stemCategory === "engineering") {
      title = t("engineeringLearning", "Învățare prin Inginerie");
      description = t(
        "engineeringLearningDesc",
        "Dezvoltă abilități de rezolvare a problemelor prin proiecte practice de inginerie."
      );
    } else if (category === "science" || stemCategory === "science") {
      title = t("scienceLearning", "Învățare prin Știință");
      description = t(
        "scienceLearningDesc",
        "Explorează concepte științifice prin experimente captivante."
      );
    } else if (category === "technology" || stemCategory === "technology") {
      title = t("technologyLearning", "Învățare prin Tehnologie");
      description = t(
        "technologyLearningDesc",
        "Descoperă cum funcționează tehnologia prin proiecte interactive."
      );
    }

    return { title, description };
  };

  return (
    <ProductVariantProvider>
      {/* Hero section with dynamic background based on selected category */}
      <div className="relative">
        {/* Hero Image */}
        <div className="relative h-[20vh] sm:h-[25vh] min-h-[180px] max-h-[300px] w-full">
          <Image
            src={categoryImagePath}
            alt={
              activeCategory ? `${activeCategory.label} category` : "STEM Toys"
            }
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            priority
            className="brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 sm:px-6 text-white">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div
                    className={`${activeCategoryInfo.bgColor} p-1.5 sm:p-2 rounded-full`}
                  >
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm md:text-lg font-bold bg-primary/80 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-md">
                    {activeCategory ? activeCategory.label : t("allCategories")}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 drop-shadow-lg">
                  {getCategoryTitle()}
                </h1>
                <p className="text-xs sm:text-sm max-w-2xl text-white/90 drop-shadow-md hidden sm:block">
                  {getCategoryDescription()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bubble decorations - made smaller and less distracting */}
        <div className="absolute -bottom-4 left-0 w-8 sm:w-16 h-8 sm:h-16 rounded-full bg-blue-500/20 blur-xl"></div>
        <div className="absolute -bottom-6 left-1/4 w-10 sm:w-20 h-10 sm:h-20 rounded-full bg-green-500/20 blur-xl"></div>
        <div className="absolute -bottom-8 right-1/3 w-12 sm:w-24 h-12 sm:h-24 rounded-full bg-yellow-500/20 blur-xl"></div>
        <div className="absolute -bottom-5 right-0 w-8 sm:w-16 h-8 sm:h-16 rounded-full bg-purple-500/20 blur-xl"></div>
      </div>

      {/* Enhanced STEM Category Filters - Prominent positioning */}
      <div className="sticky top-14 sm:top-16 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          {/* Top navigation buttons - Filter out duplicates by key */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-3 justify-center">
              {Object.entries(categoryInfo)
                .filter(
                  ([key, _]) =>
                    // Filter out engineeringlearning from top nav to prevent duplication with engineering
                    key !== "engineeringlearning"
                )
                .map(([key, category]) => {
                  const CategoryIcon = category.icon;
                  const categoryColor =
                    key === "science"
                      ? "border-blue-500 text-blue-700 hover:bg-blue-50"
                      : key === "technology"
                        ? "border-green-500 text-green-700 hover:bg-green-50"
                        : key === "engineering"
                          ? "border-orange-500 text-orange-700 hover:bg-orange-50"
                          : "border-purple-500 text-purple-700 hover:bg-purple-50";

                  const activeColor =
                    key === "science"
                      ? "bg-blue-500 text-white"
                      : key === "technology"
                        ? "bg-green-500 text-white"
                        : key === "engineering"
                          ? "bg-orange-500 text-white"
                          : "bg-purple-500 text-white";

                  // Convert both to lowercase for comparison
                  const isSelected = selectedCategories.some(
                    cat => normalizeCategory(cat) === normalizeCategory(key)
                  );

                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className={`h-8 sm:h-12 px-2 sm:px-5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 border-2 transition-all hover:scale-105 ${
                        isSelected ? activeColor : categoryColor
                      }`}
                      onClick={() => handleCategoryChange(key)}
                    >
                      <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden xs:inline">
                        {t(
                          `${key}Category`,
                          key.charAt(0).toUpperCase() + key.slice(1)
                        )}
                      </span>
                      <span className="xs:hidden">{category.letter}</span>
                    </Button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* STEM Benefits Section - Made more compact and only show when no category is selected */}
      {!activeCategory && (
        <div className="bg-white py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6">
              {t("whyStemEssential")}
            </h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {stemBenefits.map((benefit, index) => {
                const BenefitIcon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center text-center"
                  >
                    <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 text-primary mb-1.5 sm:mb-2">
                      <BenefitIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm mb-1">
                      {t(benefit.titleKey)}
                    </h3>
                    <p className="text-gray-600 text-xs">
                      {t(benefit.descKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        {/* Main product area with showing products count */}
        <div className="mb-3 sm:mb-4 px-1 sm:px-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("showingProducts")
              .replace("{0}", filteredProducts.length.toString())
              .replace("{1}", products.length.toString())}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          {/* Sidebar with filters */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 sticky top-20 sm:top-24">
              <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 rounded-full bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                </div>
                {t("filterOptions")}
              </h3>
              <ProductFilters
                categories={categoryFilter}
                filters={dynamicFilters}
                priceRange={{
                  min: 0,
                  max: 500,
                  current: priceRangeFilter,
                }}
                selectedCategories={selectedCategories}
                selectedFilters={selectedFilters}
                noPriceFilter={noPriceFilter}
                onCategoryChange={handleCategoryChange}
                onFilterChange={handleFilterChange}
                onPriceChange={handlePriceChange}
                onNoPriceFilterChange={handleNoPriceFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Main product grid */}
          <div className="flex-1">
            {/* Educational categories banner for additional context - only show when filtering */}
            {activeCategory && filteredProducts.length > 0 && (
              <div
                className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-xl bg-gradient-to-r 
                ${
                  activeCategory.id === "science"
                    ? "from-blue-50 to-blue-100 border-blue-200"
                    : activeCategory.id === "technology"
                      ? "from-green-50 to-green-100 border-green-200"
                      : activeCategory.id === "engineering"
                        ? "from-orange-50 to-orange-100 border-orange-200"
                        : "from-purple-50 to-purple-100 border-purple-200"
                } border shadow-sm`}
              >
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 sm:gap-3">
                  <div
                    className={`p-2 sm:p-3 rounded-full ${
                      activeCategory && categoryInfo[activeCategory.id]
                        ? categoryInfo[activeCategory.id].bgColor
                        : categoryInfo.science.bgColor
                    } flex-shrink-0`}
                  >
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">
                      {getLearningTitle()}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {getLearningDescription()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Products display */}
            <div
              className={viewMode === "list" ? "space-y-3 sm:space-y-4" : ""}
            >
              {viewMode === "grid" ? (
                <div className="bg-gray-50/50 rounded-xl p-2 sm:p-4">
                  <ProductGrid
                    products={filteredProducts.map(product => {
                      // If the product name or description contains raw translation keys,
                      // replace them with properly translated content
                      let modifiedProduct = { ...product };

                      // Check if the product has raw translation keys in name or description
                      if (
                        product.name?.includes("Learning") ||
                        product.description?.includes("LearningDesc")
                      ) {
                        // Get appropriate content for this product based on category
                        const content = getProductCardContent(product);
                        modifiedProduct.name = content.title;
                        modifiedProduct.description = content.description;
                      }

                      return modifiedProduct as unknown as Product;
                    })}
                    columns={{ sm: 1, md: 2, lg: 3, xl: 3 }}
                  />
                </div>
              ) : (
                <div className="bg-gray-50/50 rounded-xl p-2 sm:p-4 space-y-2 sm:space-y-3">
                  {filteredProducts.map(product => {
                    // Get appropriate content for this product if it contains raw translation keys
                    let displayName = product.name;
                    let displayDescription = product.description;

                    // Check if the product has raw translation keys in name or description
                    if (
                      product.name?.includes("Learning") ||
                      product.description?.includes("LearningDesc")
                    ) {
                      const content = getProductCardContent(product);
                      displayName = content.title;
                      displayDescription = content.description;
                    }

                    return (
                      <div
                        key={product.id}
                        className="flex flex-col xs:flex-row gap-3 sm:gap-4 bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow relative group"
                      >
                        {/* Fun shape decoration - smaller size */}
                        <div className="absolute -left-2 -top-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 transition-transform group-hover:scale-110 -z-0 hidden sm:block"></div>
                        <div className="absolute -right-2 -bottom-2 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-yellow-200/30 transition-transform group-hover:scale-110 -z-0 hidden sm:block"></div>

                        <div className="xs:w-1/3 relative h-32 xs:h-36 sm:h-40 z-10">
                          <Image
                            src={product.images[0]}
                            alt={displayName}
                            fill
                            style={{ objectFit: "cover" }}
                            className="transition-transform hover:scale-105 duration-300"
                          />
                          {product.compareAtPrice && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                              Sale
                            </div>
                          )}
                        </div>
                        <div className="p-3 sm:p-4 xs:w-2/3 z-10">
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                            <Badge
                              variant="outline"
                              className={`text-xs px-1.5 py-0 sm:px-2 sm:py-0.5
                              ${
                                product.category?.name.toLowerCase() ===
                                "science"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : product.category?.name.toLowerCase() ===
                                      "technology"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : product.category?.name.toLowerCase() ===
                                        "engineering"
                                      ? "bg-orange-100 text-orange-700 border-orange-200"
                                      : "bg-purple-100 text-purple-700 border-purple-200"
                              }
                            `}
                            >
                              {product.category?.name}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-700 border-gray-200 text-xs px-1.5 py-0 sm:px-2 sm:py-0.5"
                            >
                              {product.ageRange} years
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-700 border-gray-200 text-xs px-1.5 py-0 sm:px-2 sm:py-0.5"
                            >
                              {product.attributes?.difficulty}
                            </Badge>
                          </div>
                          <h3 className="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">
                            {displayName}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                            {displayDescription}
                          </p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-baseline gap-1 sm:gap-2">
                              <span className="text-sm sm:text-base font-bold">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.compareAtPrice && (
                                <span className="text-xs text-gray-500 line-through">
                                  ${product.compareAtPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <Link href={`/products/${product.slug}`}>
                              <Button
                                size="sm"
                                className="rounded-full px-2 sm:px-3 text-xs py-0.5 sm:py-1 h-6 sm:h-7 transition-transform hover:scale-105"
                              >
                                {t("viewDetails")}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-medium mb-1 sm:mb-2">
                  {t("noProductsFound")}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
                  {t("tryAdjustingFilters")}
                </p>
                <Button
                  onClick={handleClearFilters}
                  className="rounded-full px-3 sm:px-4 text-xs sm:text-sm py-1 h-7 sm:h-8"
                >
                  {t("clearAllFilters")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProductVariantProvider>
  );
}

// Loading fallback component
function ClientProductsPageFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-[20vh] bg-gray-200 rounded-xl mb-8"></div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 h-96 bg-gray-200 rounded-xl"></div>
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the main component with Suspense boundary
export default function ClientProductsPage(props: ClientProductsPageProps) {
  return (
    <Suspense fallback={<ClientProductsPageFallback />}>
      <ClientProductsPageContent {...props} />
    </Suspense>
  );
}
