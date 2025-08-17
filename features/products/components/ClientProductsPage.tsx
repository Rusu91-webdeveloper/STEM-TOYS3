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

import { ProductVariantProvider, type FilterGroup } from "@/features/products";
import { ProductsHeroSection } from "./ProductsHeroSection";
import { ProductsCategoryNavigation } from "./ProductsCategoryNavigation";
import { StemBenefitsSection } from "./StemBenefitsSection";
import { ProductsSidebar } from "./ProductsSidebar";
import { ProductsMainDisplay } from "./ProductsMainDisplay";
import { useProductFilters } from "../hooks/useProductFilters";
import { useTranslation } from "@/lib/i18n";
import type { Product } from "@/types/product";

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
    return "engineering";
  }

  // Default normalization - just return lowercase
  return lower;
};

function ClientProductsPageContent({
  initialProducts,
  searchParams: _searchParams,
}: ClientProductsPageProps) {
  const { t } = useTranslation();
  const { state, actions } = useProductFilters();
  const [products] = useState<ProductData[]>(initialProducts);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from search params on mount
  useEffect(() => {
    actions.initFromSearchParams();
    setIsHydrated(true);
  }, [actions]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    if (!isHydrated) return;

    const timeoutId = setTimeout(() => {
      actions.updateURL();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [state, actions, isHydrated]);

  // Generate dynamic filters based on available product data
  const dynamicFilters: FilterGroup[] = useMemo(() => {
    const filters: FilterGroup[] = [];

    // Age Group filter
    const ageGroups = Array.from(
      new Set(products.map(p => p.ageGroup).filter(Boolean))
    );
    if (ageGroups.length > 0) {
      filters.push({
        id: "ageGroup",
        name: t("ageGroup"),
        options: ageGroups.map(age => ({
          id: age!,
          name: t(`ageGroup.${age}`),
          count: products.filter(p => p.ageGroup === age).length,
        })),
      });
    }

    // Product Type filter
    const productTypes = Array.from(
      new Set(products.map(p => p.productType).filter(Boolean))
    );
    if (productTypes.length > 0) {
      filters.push({
        id: "productType",
        name: t("productType"),
        options: productTypes.map(type => ({
          id: type!,
          name: t(`productType.${type}`),
          count: products.filter(p => p.productType === type).length,
        })),
      });
    }

    return filters;
  }, [products, t]);

  // Generate category filter
  const categoryFilter: FilterGroup[] = useMemo(() => {
    const categories = Array.from(
      new Set(
        products.map(p => p.category?.name || p.stemCategory).filter(Boolean)
      )
    );

    return [
      {
        id: "category",
        name: t("categories"),
        options: categories.map(cat => ({
          id: normalizeCategory(cat!),
          name: cat!,
          count: products.filter(
            p =>
              normalizeCategory(p.category?.name || "") ===
                normalizeCategory(cat!) ||
              normalizeCategory(p.stemCategory || "") ===
                normalizeCategory(cat!)
          ).length,
        })),
      },
    ];
  }, [products, t]);

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (state.selectedCategories.length > 0) {
        const productCategory =
          product.category?.name || product.stemCategory || "";
        const normalizedProductCategory = normalizeCategory(productCategory);
        const matchesCategory = state.selectedCategories.some(
          cat => normalizeCategory(cat) === normalizedProductCategory
        );
        if (!matchesCategory) return false;
      }

      // Price filter
      if (!state.noPriceFilter && product.price) {
        const price =
          typeof product.price === "string"
            ? parseFloat(product.price)
            : product.price;
        if (
          price < state.priceRangeFilter[0] ||
          price > state.priceRangeFilter[1]
        ) {
          return false;
        }
      }

      // Search query
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
                const searchableText = [
          product.name,
          product.description,
          product.category?.name,
          product.stemCategory,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Age group filter
      if (state.selectedAgeGroup.length > 0 && product.ageGroup) {
        if (!state.selectedAgeGroup.includes(product.ageGroup)) return false;
      }

      // Product type filter
      if (state.selectedProductType.length > 0 && product.productType) {
        if (!state.selectedProductType.includes(product.productType))
          return false;
      }

      return true;
    });
  }, [products, state]);

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
      return "/images/stem-hero.jpg";
    }
    return `/images/${activeCategory.id}-hero.jpg`;
  };

  const getCategoryTitle = () => {
    if (!activeCategory) {
      return t("stemToysForEveryAge");
    }
    return t(`${activeCategory.id}Title`, `${activeCategory.label} Products`);
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

  const getProductCardContent = (product: ProductData) => {
    return {
      title: product.name ?? t("untitledProduct"),
      description: product.description ?? t("noDescription"),
    };
  };

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

  if (!isHydrated) {
    return <ClientProductsPageFallback />;
  }

  return (
    <ProductVariantProvider>
      <ProductsHeroSection
        categoryImagePath={getCategoryImagePath()}
        activeCategory={activeCategory}
        activeCategoryInfo={activeCategoryInfo}
        getCategoryTitle={getCategoryTitle}
        getCategoryDescription={getCategoryDescription}
        t={t}
      />

      <ProductsCategoryNavigation
        categoryInfo={categoryInfo}
        selectedCategories={state.selectedCategories}
        normalizeCategory={normalizeCategory}
        handleCategoryChange={handleCategoryChange}
        setMobileFiltersOpen={actions.setMobileFiltersOpen}
        t={t}
      />

      <StemBenefitsSection
        stemBenefits={stemBenefits}
        activeCategory={activeCategory}
        t={t}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <ProductsSidebar
            categoryFilter={categoryFilter}
            dynamicFilters={dynamicFilters}
            priceRangeFilter={state.priceRangeFilter}
            selectedCategories={state.selectedCategories}
            selectedFilters={state.selectedFilters}
            noPriceFilter={state.noPriceFilter}
            selectedAgeGroup={state.selectedAgeGroup}
            selectedStemDiscipline={state.selectedStemDiscipline}
            selectedLearningOutcomes={state.selectedLearningOutcomes}
            selectedProductType={state.selectedProductType}
            selectedSpecialCategories={state.selectedSpecialCategories}
            handleCategoryChange={handleCategoryChange}
            handleFilterChange={handleFilterChange}
            handlePriceChange={handlePriceChange}
            handleNoPriceFilterChange={handleNoPriceFilterChange}
            setSelectedAgeGroup={actions.setAgeGroup}
            setSelectedStemDiscipline={actions.setStemDiscipline}
            setSelectedLearningOutcomes={actions.setLearningOutcomes}
            setSelectedProductType={actions.setProductType}
            setSelectedSpecialCategories={actions.setSpecialCategories}
            handleClearFilters={handleClearFilters}
            setMobileFiltersOpen={actions.setMobileFiltersOpen}
            t={t}
          />

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
        </div>
      </div>
    </ProductVariantProvider>
  );
}

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
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
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
