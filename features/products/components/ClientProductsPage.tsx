"use client";

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
import React, { useState, useEffect, useMemo, Suspense } from "react";

import { ProductVariantProvider } from "@/features/products";
import { useTranslation } from "@/lib/i18n";
import { normalizeCategory } from "@/lib/utils/product-filters-url";
import type { Product } from "@/types/product";

import { useProductFilters } from "../hooks/useProductFilters";

import type { FilterGroup } from "./EnhancedProductFilters";
import { MobileFiltersModal } from "./MobileFiltersModal";
import {
  ProductsErrorBoundary,
  ProductFiltersErrorBoundary,
  ProductGridErrorBoundary,
} from "./ProductsErrorBoundary";
import { ProductsHeroSection } from "./ProductsHeroSection";
import AgeQuickFilters from "./AgeQuickFilters";
import { MobileFilterBar } from "./MobileFilterBar";
import { ProductsMainDisplay } from "./ProductsMainDisplay";
import { ProductsSidebar } from "./ProductsSidebar";
import { StemBenefitsSection } from "./StemBenefitsSection";

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
interface ProductData extends Omit<Product, "category" | "stemDiscipline"> {
  category?: CategoryData;
  // Enhanced categorization fields
  ageGroup?:
    | "TODDLERS_1_3"
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  stemDiscipline?:
    | "SCIENCE"
    | "TECHNOLOGY"
    | "ENGINEERING"
    | "MATHEMATICS"
    | "GENERAL";
  learningOutcomes?: (
    | "PROBLEM_SOLVING"
    | "CREATIVITY"
    | "CRITICAL_THINKING"
    | "MOTOR_SKILLS"
    | "LOGIC"
  )[];
  productType?:
    | "ROBOTICS"
    | "PUZZLES"
    | "CONSTRUCTION_SETS"
    | "EXPERIMENT_KITS"
    | "BOARD_GAMES";
  specialCategories?: (
    | "NEW_ARRIVALS"
    | "BEST_SELLERS"
    | "GIFT_IDEAS"
    | "SALE_ITEMS"
  )[];
}

interface ClientProductsPageProps {
  initialProducts: ProductData[];
  searchParams: { [key: string]: string | string[] | undefined };
  allSidebarCategories?: Array<{ id: string; label: string; count: number }>;
}

// Helper function to get category translation
const getCategoryTranslation = (
  categoryId: string,
  t: (key: string, fallback?: string) => string
): string => {
  const categoryTranslationMap: Record<string, string> = {
    science: "scienceCategory",
    technology: "technologyCategory",
    engineering: "engineeringCategory",
    mathematics: "mathematicsCategory",
    "educational-books": "educationalBooksCategory",
  };

  const translationKey = categoryTranslationMap[categoryId];
  if (translationKey) {
    return t(translationKey, categoryId);
  }

  // Fallback for any unmapped categories
  return t(`${categoryId}Category`, categoryId);
};

function ClientProductsPageContent({
  initialProducts,
  searchParams: _searchParams,
  allSidebarCategories = [],
}: ClientProductsPageProps) {
  const { t } = useTranslation();
  const { state, actions, initFromSearchParams, updateURL } =
    useProductFilters();
  const [products] = useState<ProductData[]>(initialProducts);
  const [isHydrated, setIsHydrated] = useState(true); // Start as hydrated to prevent CLS

  // Initialize from search params on mount
  useEffect(() => {
    try {
      initFromSearchParams();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error initializing from search params:", error);
      }
    }
  }, [initFromSearchParams]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [state, updateURL]);

  // Generate dynamic filters based on available product data
  // Note: Product Type filter is now handled as a dropdown in EnhancedProductFilters
  // to avoid duplication and provide better UX
  const dynamicFilters: FilterGroup[] = useMemo(() => {
    const filters: FilterGroup[] = [];

    // Add other dynamic filters here if needed in the future
    // Product Type is handled separately as a dropdown in EnhancedProductFilters

    return filters;
  }, [products, t]);

  // Use comprehensive category filter that shows all available categories
  const categoryFilter: FilterGroup[] = useMemo(() => {
    if (allSidebarCategories.length > 0) {
      // Use server-provided categories that include all available categories
      return [
        {
          id: "category",
          name: t("categories"),
          options: allSidebarCategories.map(cat => ({
            id: cat.id,
            label: getCategoryTranslation(cat.id, t),
            count: cat.count,
          })),
        },
      ];
    }

    // Fallback to dynamic generation if server categories are not available
    const categories = Array.from(
      new Set(
        products.map(p => p.stemDiscipline ?? p.category?.name).filter(Boolean)
      )
    );

    return [
      {
        id: "category",
        name: t("categories"),
        options: categories.map(cat => ({
          id: normalizeCategory(cat!),
          label: cat!,
          count: products.filter(p => {
            // For STEM categories, prioritize stemDiscipline over category.name
            const productCategory = p.stemDiscipline
              ? p.stemDiscipline.toLowerCase()
              : p.category?.name?.toLowerCase() || "";
            return (
              normalizeCategory(productCategory) === normalizeCategory(cat!)
            );
          }).length,
        })),
      },
    ];
  }, [allSidebarCategories, products, t]);

  // Client-side filtering based on selected categories and other filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // DEBUG: Log filtering process
    if (process.env.NODE_ENV === "development") {
      console.log(
        "🐛 [CLIENT FILTERING] Starting with",
        products.length,
        "products"
      );
      console.log(
        "🐛 [CLIENT FILTERING] Selected learning outcomes:",
        state.selectedLearningOutcomes
      );
      console.log(
        "🐛 [CLIENT FILTERING] First product learning outcomes:",
        products[0]?.learningOutcomes
      );
    }

    // Filter by selected categories
    if (state.selectedCategories.length > 0) {
      filtered = filtered.filter(product => {
        // For STEM categories, prioritize stemDiscipline over category.name
        // This ensures products with stemDiscipline values are properly categorized
        const productCategory = product.stemDiscipline
          ? product.stemDiscipline.toLowerCase()
          : product.category?.name?.toLowerCase() || "";

        return state.selectedCategories.some(selectedCategory => {
          const normalizedSelected = normalizeCategory(selectedCategory);
          const normalizedProduct = normalizeCategory(productCategory);
          return normalizedProduct === normalizedSelected;
        });
      });
    }

    // Filter by price range if price filter is enabled
    if (!state.noPriceFilter) {
      // Ensure priceRangeFilter is always an array with valid numbers
      const priceRange = Array.isArray(state.priceRangeFilter)
        ? state.priceRangeFilter
        : [0, 1000];

      const [minPrice, maxPrice] = priceRange;

      // Apply price filter if we have valid numbers
      // Remove the "meaningful range" check as it was preventing filtering
      if (
        typeof minPrice === "number" &&
        typeof maxPrice === "number" &&
        !isNaN(minPrice) &&
        !isNaN(maxPrice) &&
        minPrice >= 0 &&
        maxPrice > minPrice
      ) {
        filtered = filtered.filter(product => {
          const price =
            typeof product.price === "string"
              ? parseFloat(product.price)
              : product.price;

          // Skip products with invalid prices
          if (isNaN(price) || price <= 0) {
            return false;
          }

          return price >= minPrice && price <= maxPrice;
        });
      }
    }

    // Filter by age group
    if (state.selectedAgeGroup) {
      filtered = filtered.filter(
        product => product.ageGroup === state.selectedAgeGroup
      );
    }

    // Filter by learning outcomes
    if (
      process.env.NODE_ENV === "development" &&
      state.selectedLearningOutcomes.length > 0
    ) {
      console.log(
        "🐛 [LEARNING OUTCOMES FILTER] Filtering by:",
        state.selectedLearningOutcomes
      );
      console.log(
        "🐛 [LEARNING OUTCOMES FILTER] Products before filter:",
        filtered.length
      );

      filtered = filtered.filter(product => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "🐛 [LEARNING OUTCOMES FILTER] Checking product:",
            product.name
          );
          console.log(
            "🐛 [LEARNING OUTCOMES FILTER] Product learning outcomes:",
            product.learningOutcomes
          );
          console.log(
            "🐛 [LEARNING OUTCOMES FILTER] Is array?",
            Array.isArray(product.learningOutcomes)
          );
        }

        if (
          !product.learningOutcomes ||
          !Array.isArray(product.learningOutcomes)
        ) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "🐛 [LEARNING OUTCOMES FILTER] Product filtered out - no learning outcomes"
            );
          }
          return false;
        }

        const matches = state.selectedLearningOutcomes.some(outcome =>
          product.learningOutcomes.some(
            productOutcome => productOutcome === outcome
          )
        );

        if (process.env.NODE_ENV === "development") {
          console.log(
            "🐛 [LEARNING OUTCOMES FILTER] Product matches?",
            matches
          );
        }
        return matches;
      });

      if (process.env.NODE_ENV === "development") {
        console.log(
          "🐛 [LEARNING OUTCOMES FILTER] Products after filter:",
          filtered.length
        );
      }
    }

    // Filter by product type (treat "all" as no filter)
    if (state.selectedProductType && state.selectedProductType !== "all") {
      filtered = filtered.filter(
        product => product.productType === state.selectedProductType
      );
    }

    // Filter by special categories
    if (state.selectedSpecialCategories.length > 0) {
      filtered = filtered.filter(product => {
        if (!product.specialCategories) return false;
        return state.selectedSpecialCategories.some(category =>
          product.specialCategories!.includes(category as any)
        );
      });
    }

    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [
    products,
    state.selectedCategories,
    state.priceRangeFilter,
    state.noPriceFilter,
    state.selectedAgeGroup,
    state.selectedLearningOutcomes,
    state.selectedProductType,
    state.selectedSpecialCategories,
    state.searchQuery,
  ]);

  // Get active category for hero section
  const activeCategory = useMemo(() => {
    if (state.selectedCategories.length === 1) {
      const categoryKey = state.selectedCategories[0];
      return {
        id: categoryKey,
        label: t(
          `${categoryKey}Category`,
          categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)
        ),
      };
    }
    return null;
  }, [state.selectedCategories, t]);

  const activeCategoryInfo =
    activeCategory && categoryInfo[activeCategory.id]
      ? categoryInfo[activeCategory.id]
      : categoryInfo.science;

  // Helper functions for hero section
  const getCategoryImagePath = () => {
    if (!activeCategory) {
      return "/images/homepage_hero_banner_01.png";
    }

    // Map category IDs to actual image file names
    const imageMap: Record<string, string> = {
      mathematics: "/images/category_banner_math_01.png",
      science: "/images/category_banner_science_01.png",
      technology: "/images/category_banner_technology_01.png",
      engineering: "/images/category_banner_engineering_01.png",
      "educational-books": "/images/category_banner_books_01.jpg",
    };

    return imageMap[activeCategory.id] || "/images/homepage_hero_banner_01.png";
  };

  const getCategoryTitle = () => {
    if (!activeCategory) {
      return t("productsH1");
    }
    return t(`${activeCategory.id}H1`, `${activeCategory.label} Products`);
  };

  const getCategoryDescription = () => {
    if (!activeCategory) return t("discoverStemCollection");
    return t(
      `${activeCategory.id}Description`,
      `Explore our ${activeCategory.label.toLowerCase()} collection`
    );
  };

  const getLearningTitle = () => {
    if (!activeCategory) {
      return t("learningThroughPlay");
    }
    return t(`${activeCategory.id}Learning`, `Learn ${activeCategory.label}`);
  };

  const getLearningDescription = () => {
    if (!activeCategory) return t("learningThroughPlayDesc");
    return t(
      `${activeCategory.id}LearningDesc`,
      `Discover the world of ${activeCategory.label.toLowerCase()}`
    );
  };

  const getProductCardContent = (product: ProductData) => ({
    title: product.name ?? t("untitledProduct"),
    description: product.description ?? t("noDescription"),
  });

  // Event handlers
  const handleCategoryChange = (category: string) => {
    actions.toggleCategory(category);
  };

  const handleFilterChange = (filterId: string, optionId: string) => {
    actions.setFilter(filterId, optionId);
  };

  const handlePriceChange = (range: [number, number]) => {
    actions.setPriceRange(range);
  };

  const handleNoPriceFilterChange = (enabled: boolean) => {
    actions.setNoPriceFilter(enabled);
  };

  const handleClearFilters = () => {
    actions.clearFilters();
  };

  // Quick filter handlers for mobile
  const handleCategoryQuickSelect = (categoryId: string) => {
    // Handle special categories
    if (
      ["BEST_SELLERS", "NEW_ARRIVALS", "GIFT_IDEAS", "SALE_ITEMS"].includes(
        categoryId
      )
    ) {
      const currentSpecialCategories = state.selectedSpecialCategories;
      const isSelected = currentSpecialCategories.includes(categoryId as any);

      if (isSelected) {
        actions.setSpecialCategories(
          currentSpecialCategories.filter(cat => cat !== categoryId)
        );
      } else {
        actions.setSpecialCategories([
          ...currentSpecialCategories,
          categoryId as any,
        ]);
      }
    } else {
      // Handle regular categories
      actions.toggleCategory(categoryId);
    }
  };

  const handlePriceQuickSelect = (rangeId: string) => {
    if (rangeId === "clear") {
      // Clear price filter
      actions.setPriceRange([0, 1000]);
      actions.setNoPriceFilter(true);
      return;
    }

    const priceRanges: Record<string, [number, number]> = {
      "under-50": [0, 50],
      "50-100": [50, 100],
      "100-200": [100, 200],
      "over-200": [200, 1000],
    };

    const range = priceRanges[rangeId];
    if (range) {
      actions.setPriceRange(range);
      actions.setNoPriceFilter(false);
    }
  };

  // Always render the main content to prevent CLS
  const content = (
    <ProductsErrorBoundary>
      <ProductVariantProvider>
        <ProductsHeroSection
          categoryImagePath={getCategoryImagePath()}
          activeCategory={activeCategory}
          activeCategoryInfo={activeCategoryInfo}
          getCategoryTitle={getCategoryTitle}
          getCategoryDescription={getCategoryDescription}
          t={t}
        />

        {/* Removed redundant category quick buttons to avoid duplication with sidebar and mobile filters */}

        {/* Premium Mobile Filter Bar - Optimized for Performance */}
        <div className="md:hidden">
          <MobileFilterBar
            activeFilterCount={
              state.selectedCategories.length +
              Object.values(state.selectedFilters).flat().length +
              state.selectedLearningOutcomes.length +
              (state.selectedProductType && state.selectedProductType !== "all"
                ? 1
                : 0) +
              state.selectedSpecialCategories.length +
              (!state.noPriceFilter &&
              (state.priceRangeFilter[0] !== 0 ||
                state.priceRangeFilter[1] !== 1000)
                ? 1
                : 0)
            }
            selectedCategories={state.selectedCategories}
            selectedPriceRange={state.priceRangeFilter}
            onCategoryQuickSelect={handleCategoryQuickSelect}
            onPriceQuickSelect={handlePriceQuickSelect}
            onOpenFilters={() => actions.setMobileFiltersOpen(true)}
            onClearFilters={handleClearFilters}
            t={t}
          />
        </div>

        {/* Age Quick Filters Section - hide on mobile */}
        <div className="hidden md:block">
          <AgeQuickFilters
            selectedAgeGroup={state.selectedAgeGroup}
            onSelectAgeGroup={age => actions.setAgeGroup(age)}
            t={t}
          />
        </div>

        <StemBenefitsSection
          stemBenefits={stemBenefits}
          activeCategory={activeCategory}
          t={t}
        />

        <div className="w-full max-w-full overflow-x-hidden bg-gradient-to-b from-gray-50/30 via-white to-gray-50/20">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8 relative z-10">
            {/* Premium design element - top wave decoration */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/30 to-indigo-500/20 rounded-full opacity-75 hidden sm:block"></div>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
              <ProductFiltersErrorBoundary
                onError={() => {
                  // Fallback: clear filters and reload
                  handleClearFilters();
                }}
              >
                <ProductsSidebar
                  categoryFilter={categoryFilter}
                  dynamicFilters={dynamicFilters}
                  priceRangeFilter={state.priceRangeFilter}
                  products={products}
                  selectedCategories={state.selectedCategories}
                  selectedFilters={state.selectedFilters}
                  noPriceFilter={state.noPriceFilter}
                  selectedLearningOutcomes={state.selectedLearningOutcomes}
                  selectedProductType={state.selectedProductType}
                  selectedSpecialCategories={state.selectedSpecialCategories}
                  handleCategoryChange={handleCategoryChange}
                  handleFilterChange={handleFilterChange}
                  handlePriceChange={handlePriceChange}
                  handleNoPriceFilterChange={handleNoPriceFilterChange}
                  setSelectedLearningOutcomes={actions.setLearningOutcomes}
                  setSelectedProductType={actions.setProductType}
                  setSelectedSpecialCategories={actions.setSpecialCategories}
                  handleClearFilters={handleClearFilters}
                  setMobileFiltersOpen={actions.setMobileFiltersOpen}
                  t={t}
                />
              </ProductFiltersErrorBoundary>

              <ProductGridErrorBoundary
                onRetry={() => {
                  // Retry by clearing filters and resetting state
                  handleClearFilters();
                  window.location.reload();
                }}
              >
                <ProductsMainDisplay
                  activeCategory={activeCategory}
                  categoryInfo={categoryInfo}
                  filteredProducts={filteredProducts}
                  displayedProducts={filteredProducts}
                  viewMode={state.viewMode}
                  getLearningTitle={getLearningTitle}
                  getLearningDescription={getLearningDescription}
                  getProductCardContent={getProductCardContent}
                  t={t}
                />
              </ProductGridErrorBoundary>
            </div>
          </div>
        </div>

        {/* Premium Mobile Filters Modal - Always accessible on all screens */}
        <MobileFiltersModal
          isOpen={state.mobileFiltersOpen}
          onClose={() => actions.setMobileFiltersOpen(false)}
          categories={categoryFilter[0]}
          filters={dynamicFilters}
          priceRange={(() => {
            // Calculate actual price range from products (same logic as ProductsSidebar)
            if (!products || products.length === 0) {
              return { min: 0, max: 1000, current: state.priceRangeFilter };
            }

            const prices = products
              .map(p => {
                const price =
                  typeof p.price === "string" ? parseFloat(p.price) : p.price;
                return isNaN(price) ? 0 : price;
              })
              .filter(price => price > 0);

            if (prices.length === 0) {
              return { min: 0, max: 1000, current: state.priceRangeFilter };
            }

            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));

            return {
              min,
              max,
              current: state.priceRangeFilter,
            };
          })()}
          selectedCategories={state.selectedCategories}
          selectedFilters={state.selectedFilters}
          noPriceFilter={state.noPriceFilter}
          selectedLearningOutcomes={state.selectedLearningOutcomes}
          selectedProductType={state.selectedProductType}
          selectedSpecialCategories={state.selectedSpecialCategories}
          onCategoryChange={handleCategoryChange}
          onFilterChange={handleFilterChange}
          onPriceChange={handlePriceChange}
          onNoPriceFilterChange={handleNoPriceFilterChange}
          onLearningOutcomesChange={actions.setLearningOutcomes}
          onProductTypeChange={actions.setProductType}
          onSpecialCategoriesChange={actions.setSpecialCategories}
          onClearFilters={handleClearFilters}
          t={t}
        />
      </ProductVariantProvider>
    </ProductsErrorBoundary>
  );

  return content;
}

function ClientProductsPageFallback() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="animate-pulse">
        <div className="h-[15vh] sm:h-[20vh] bg-gray-200 rounded-xl mb-4 sm:mb-8"></div>
        <div className="flex flex-col md:flex-row gap-3 sm:gap-6">
          <div className="w-full md:w-64 h-80 sm:h-96 bg-gray-200 rounded-xl"></div>
          <div className="flex-1 space-y-3 sm:space-y-4">
            <div className="h-6 sm:h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 sm:h-64 bg-gray-200 rounded-xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientProductsPageRefactored(
  props: ClientProductsPageProps
) {
  return (
    <Suspense fallback={<ClientProductsPageFallback />}>
      <ClientProductsPageContent {...props} />
    </Suspense>
  );
}
