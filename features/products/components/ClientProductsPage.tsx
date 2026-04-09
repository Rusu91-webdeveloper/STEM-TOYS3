"use client";

import {
  Lightbulb,
  Atom,
  Microscope,
  ShieldQuestion,
  // Star,
  // Sparkles,
  Rocket,
  Brain,
  LucideIcon,
  ChevronRight,
} from "lucide-react";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ProductVariantProvider } from "@/features/products";
import { useTranslation } from "@/lib/i18n";
import { normalizeCategory } from "@/lib/utils/product-filters-url";
import type { Product } from "@/types/product";
import Link from "next/link";
import { ProductsPagination } from "./ProductsPagination";

import { useProductFilters } from "../hooks/useProductFilters";

import type { FilterGroup } from "./EnhancedProductFilters";
import { MobileFiltersModal } from "./MobileFiltersModal";
import {
  ProductsErrorBoundary,
  ProductFiltersErrorBoundary,
  ProductGridErrorBoundary,
} from "./ProductsErrorBoundary";
import { MobileFilterBar, type MobileFilterPanel } from "./MobileFilterBar";
import { MobileProductsBar } from "./MobileProductsBar";
import { ProductsMainDisplay } from "./ProductsMainDisplay";
import { ProductsSidebar } from "./ProductsSidebar";
import {
  productsBackgroundClass,
  productsContentWrapperClass,
} from "./productsTheme";

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
    bgColor: "bg-sky-500",
    textColor: "text-sky-500",
    letter: LETTER_S,
  },
  technology: {
    icon: Lightbulb,
    bgColor: "bg-emerald-500",
    textColor: "text-emerald-500",
    letter: LETTER_T,
  },
  engineering: {
    icon: Microscope,
    bgColor: "bg-amber-500",
    textColor: "text-amber-500",
    letter: LETTER_E,
  },
  mathematics: {
    icon: ShieldQuestion,
    bgColor: "bg-violet-500",
    textColor: "text-violet-500",
    letter: LETTER_M,
  },
  "educational-books": {
    icon: Brain,
    bgColor: "bg-rose-500",
    textColor: "text-rose-500",
    letter: LETTER_B,
  },
  engineeringlearning: {
    icon: Rocket,
    bgColor: "bg-teal-500",
    textColor: "text-teal-500",
    letter: LETTER_E,
  },
};

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

type BundleViewMode = "all" | "bundles" | "products";

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
  // const [isHydrated, setIsHydrated] = useState(true); // Start as hydrated to prevent CLS
  const urlSearchParams = useSearchParams();
  const PAGE_SIZE = 12;

  const parsedPage = useMemo(() => {
    const value = urlSearchParams?.get("page");
    const pageNumber = value ? Number.parseInt(value, 10) : 1;
    return Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  }, [urlSearchParams]);
  const parsedBundleViewMode = useMemo<BundleViewMode>(() => {
    const value = urlSearchParams?.get("bundleView");
    if (value === "bundles" || value === "products") return value;
    return "all";
  }, [urlSearchParams]);

  const [page, setPage] = useState(parsedPage);
  const [bundleViewMode, setBundleViewMode] =
    useState<BundleViewMode>(parsedBundleViewMode);
  const [mobileFilterPanel, setMobileFilterPanel] =
    useState<MobileFilterPanel>("category");

  useEffect(() => {
    setPage(parsedPage);
  }, [parsedPage]);

  useEffect(() => {
    setBundleViewMode(parsedBundleViewMode);
  }, [parsedBundleViewMode]);

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

  const actualPriceRange = useMemo(() => {
    if (!products || products.length === 0) {
      return { min: 0, max: 1000 };
    }

    const prices = products
      .map(product => {
        const price =
          typeof product.price === "string"
            ? parseFloat(product.price)
            : product.price;
        return Number.isFinite(price) ? price : 0;
      })
      .filter(price => price > 0);

    if (prices.length === 0) {
      return { min: 0, max: 1000 };
    }

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products]);

  const mobilePriceRange = useMemo(
    () => ({
      min: actualPriceRange.min,
      max: actualPriceRange.max,
      current: state.priceRangeFilter,
    }),
    [actualPriceRange.max, actualPriceRange.min, state.priceRangeFilter]
  );

  // Client-side filtering based on selected categories and other filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by selected categories
    if (state.selectedCategories.length > 0) {
      filtered = filtered.filter(product => {
        // For STEM categories, prioritize stemDiscipline over category.name
        // This ensures products with stemDiscipline values are properly categorized
        const stemValue = product.stemDiscipline?.toLowerCase();
        const productCategory =
          stemValue && stemValue !== "general"
            ? stemValue
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
    if (state.selectedLearningOutcomes.length > 0) {
      filtered = filtered.filter(product => {
        if (
          !product.learningOutcomes ||
          !Array.isArray(product.learningOutcomes)
        ) {
          return false;
        }
        return state.selectedLearningOutcomes.some(outcome =>
          product.learningOutcomes!.some(
            productOutcome => productOutcome === outcome
          )
        );
      });
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

  const bundleFilteredProducts = useMemo(() => {
    if (bundleViewMode === "bundles") {
      return filteredProducts.filter(product => product.isBundle === true);
    }
    if (bundleViewMode === "products") {
      return filteredProducts.filter(product => product.isBundle !== true);
    }
    return filteredProducts;
  }, [filteredProducts, bundleViewMode]);

  const sortOption = useMemo(
    () => (state.sortBy === "relevance" ? "featured" : state.sortBy),
    [state.sortBy]
  );

  const sortedProducts = useMemo(() => {
    if (bundleFilteredProducts.length <= 1) return bundleFilteredProducts;

    const getPrice = (value: ProductData["price"]) => {
      const parsed =
        typeof value === "string" ? parseFloat(value) : (value as number);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const getCreatedAt = (value: ProductData["createdAt"]) => {
      if (!value) return 0;
      const time = new Date(value as any).getTime();
      return Number.isFinite(time) ? time : 0;
    };

    const getRating = (product: ProductData) => {
      const rating =
        (product as any).averageRating ??
        (product as any).rating ??
        (product as any).reviewAverage ??
        0;
      return Number.isFinite(rating) ? rating : 0;
    };

    const withIndex = bundleFilteredProducts.map((product, index) => ({
      product,
      index,
    }));

    withIndex.sort((a, b) => {
      const productA = a.product;
      const productB = b.product;

      switch (sortOption) {
        case "price-low": {
          const priceA = getPrice(productA.price);
          const priceB = getPrice(productB.price);
          if (priceA === null && priceB === null) break;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          if (priceA !== priceB) return priceA - priceB;
          break;
        }
        case "price-high": {
          const priceA = getPrice(productA.price);
          const priceB = getPrice(productB.price);
          if (priceA === null && priceB === null) break;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          if (priceA !== priceB) return priceB - priceA;
          break;
        }
        case "newest": {
          const timeA = getCreatedAt(productA.createdAt);
          const timeB = getCreatedAt(productB.createdAt);
          if (timeA !== timeB) return timeB - timeA;
          break;
        }
        case "rating": {
          const ratingA = getRating(productA);
          const ratingB = getRating(productB);
          if (ratingA !== ratingB) return ratingB - ratingA;
          break;
        }
        case "featured":
        default: {
          const featuredA = productA.featured ? 1 : 0;
          const featuredB = productB.featured ? 1 : 0;
          if (featuredA !== featuredB) return featuredB - featuredA;
          break;
        }
      }

      return a.index - b.index;
    });

    return withIndex.map(entry => entry.product);
  }, [bundleFilteredProducts, sortOption]);

  const totalPages = Math.ceil(sortedProducts.length / PAGE_SIZE);

  const displayedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = page * PAGE_SIZE;
    return sortedProducts.slice(start, end);
  }, [sortedProducts, page]);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [bundleViewMode]);

  const paginationSearchParams = useMemo(() => {
    const params: Record<string, string> = {};

    if (state.selectedCategories.length > 0) {
      const uniqueCategories = Array.from(
        new Set(state.selectedCategories.map(cat => normalizeCategory(cat)))
      ).filter(Boolean);
      if (uniqueCategories.length > 0) {
        params.category = uniqueCategories.join(",");
      }
    }

    if (!state.noPriceFilter) {
      const minPrice = state.priceRangeFilter[0];
      const maxPrice = state.priceRangeFilter[1];

      if (minPrice !== undefined && minPrice !== null) {
        params.minPrice = minPrice.toString();
      }
      if (maxPrice !== undefined && maxPrice !== null) {
        params.maxPrice = maxPrice.toString();
      }
    }

    if (state.searchQuery) {
      params.search = state.searchQuery;
    }

    if (state.selectedAgeGroup) {
      params.ageGroup = state.selectedAgeGroup;
    }

    if (state.sortBy !== "relevance") {
      params.sort = state.sortBy;
    }

    if (bundleViewMode !== "all") {
      params.bundleView = bundleViewMode;
    }

    if (state.viewMode !== "grid") {
      params.view = state.viewMode;
    }

    if (state.selectedLearningOutcomes.length > 0) {
      params.learningOutcomes = state.selectedLearningOutcomes.join(",");
    }

    if (state.selectedSpecialCategories.length > 0) {
      params.specialCategories = state.selectedSpecialCategories.join(",");
    }

    if (
      !state.noPriceFilter &&
      (state.priceRangeFilter[0] > 0 || state.priceRangeFilter[1] < 1000)
    ) {
      params.noPriceFilter = "false";
    }

    return params;
  }, [state, bundleViewMode]);

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

  // const activeCategoryInfo =
  //   activeCategory && categoryInfo[activeCategory.id]
  //     ? categoryInfo[activeCategory.id]
  //     : categoryInfo.science;

  // Helper functions (retained for ProductsMainDisplay / future use)
  // const getCategoryImagePath = () => { ... };

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

  const handleSortChange = (value: string) => {
    actions.setSortBy(value === "featured" ? "relevance" : value);
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    actions.setViewMode(mode);
  };

  const handleSearchQueryChange = (value: string) => {
    setPage(1);
    actions.setSearchQuery(value);
  };

  const handleSearchClear = () => {
    setPage(1);
    actions.setSearchQuery("");
  };

  const handleClearFilters = () => {
    actions.clearFilters();
  };

  const handleOpenMobilePanel = (panel: MobileFilterPanel) => {
    setMobileFilterPanel(panel);
    actions.setMobileFiltersOpen(true);
  };

  const handleClearMobilePanel = (panel: MobileFilterPanel) => {
    if (panel === "category") {
      actions.setCategories([]);
      return;
    }

    if (panel === "age") {
      actions.setAgeGroup("");
      return;
    }

    actions.setPriceRange([actualPriceRange.min, actualPriceRange.max]);
    actions.setNoPriceFilter(true);
  };

  const mobileFilterCount =
    state.selectedCategories.length +
    (state.selectedAgeGroup ? 1 : 0) +
    (!state.noPriceFilter &&
    (state.priceRangeFilter[0] !== actualPriceRange.min ||
      state.priceRangeFilter[1] !== actualPriceRange.max)
      ? 1
      : 0);

  const totalActiveFilterCount =
    state.selectedCategories.length +
    Object.values(state.selectedFilters).flat().length +
    state.selectedLearningOutcomes.length +
    (state.selectedProductType && state.selectedProductType !== "all" ? 1 : 0) +
    state.selectedSpecialCategories.length +
    (state.selectedAgeGroup ? 1 : 0) +
    (!state.noPriceFilter &&
    (state.priceRangeFilter[0] !== actualPriceRange.min ||
      state.priceRangeFilter[1] !== actualPriceRange.max)
      ? 1
      : 0);

  const categoryLabelLookup = useMemo(
    () =>
      new Map(
        (categoryFilter[0]?.options ?? []).map(option => [
          normalizeCategory(option.id),
          option.label,
        ])
      ),
    [categoryFilter]
  );

  const mobileCategoryLabel = useMemo(() => {
    if (state.selectedCategories.length === 0) {
      return t("categories", "Category");
    }

    if (state.selectedCategories.length === 1) {
      return (
        categoryLabelLookup.get(
          normalizeCategory(state.selectedCategories[0])
        ) ?? state.selectedCategories[0]
      );
    }

    return `${state.selectedCategories.length} ${t("selected", "selected")}`;
  }, [categoryLabelLookup, state.selectedCategories, t]);

  const mobileAgeLabel = useMemo(() => {
    switch (state.selectedAgeGroup) {
      case "PRESCHOOL_3_5":
        return t("age3to5H2", "3-5 years");
      case "ELEMENTARY_6_8":
        return t("age6to8H2", "6-8 years");
      case "MIDDLE_SCHOOL_9_12":
        return t("age9to12H2", "9-12 years");
      case "TEENS_13_PLUS":
        return t("age13plusH2", "13+ years");
      default:
        return t("ageGroup", "Age");
    }
  }, [state.selectedAgeGroup, t]);

  const mobilePriceLabel = useMemo(() => {
    if (
      state.noPriceFilter ||
      (state.priceRangeFilter[0] === actualPriceRange.min &&
        state.priceRangeFilter[1] === actualPriceRange.max)
    ) {
      return t("price", "Price");
    }

    return `${Math.round(state.priceRangeFilter[0])}-${Math.round(
      state.priceRangeFilter[1]
    )} lei`;
  }, [
    actualPriceRange.max,
    actualPriceRange.min,
    state.noPriceFilter,
    state.priceRangeFilter,
    t,
  ]);

  // Always render the main content to prevent CLS
  const content = (
    <ProductsErrorBoundary>
      <ProductVariantProvider>
        <div className="w-full">
          {/* Page header — breadcrumb + title */}
          <div className="border-b border-slate-100 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
                <Link
                  href="/"
                  className="hover:text-slate-800 transition-colors"
                >
                  {t("home", "Home")}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="text-slate-800 font-medium">
                  {t("allProducts", "Toate Produsele")}
                </span>
              </nav>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                    {getCategoryTitle()}
                  </h1>
                  <p className="mt-1.5 text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
                    {getCategoryDescription()}
                  </p>
                </div>
                <p className="text-sm text-slate-500 shrink-0">
                  {t("showing", "Afișăm")}{" "}
                  <span className="font-semibold text-slate-700">
                    {bundleFilteredProducts.length}
                  </span>{" "}
                  {t("outOf", "din")}{" "}
                  <span className="font-semibold text-slate-700">
                    {products.length}
                  </span>{" "}
                  {t("productsLabel", "produse")}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Filter Bar */}
          <div className="xl:hidden bg-white border-b border-slate-100">
            <MobileFilterBar
              activeFilterCount={totalActiveFilterCount}
              categoryLabel={mobileCategoryLabel}
              ageLabel={mobileAgeLabel}
              priceLabel={mobilePriceLabel}
              categoryActive={state.selectedCategories.length > 0}
              ageActive={Boolean(state.selectedAgeGroup)}
              priceActive={
                !state.noPriceFilter &&
                (state.priceRangeFilter[0] !== actualPriceRange.min ||
                  state.priceRangeFilter[1] !== actualPriceRange.max)
              }
              onOpenPanel={handleOpenMobilePanel}
              onClearFilters={handleClearFilters}
              t={t}
            />
            <MobileProductsBar
              bundleViewMode={bundleViewMode}
              onBundleViewModeChange={setBundleViewMode}
              bundleCount={
                filteredProducts.filter(p => p?.isBundle === true).length
              }
              regularCount={
                filteredProducts.filter(p => p?.isBundle !== true).length
              }
              totalCount={filteredProducts.length}
              sortOption={sortOption}
              onSortChange={handleSortChange}
              viewMode={state.viewMode}
              onViewModeChange={handleViewModeChange}
              searchQuery={state.searchQuery}
              onSearchQueryChange={handleSearchQueryChange}
              onClearSearch={handleSearchClear}
              t={t}
            />
          </div>

          {/* Main content — sidebar + products grid */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col xl:flex-row gap-8 items-start">
              <ProductFiltersErrorBoundary
                onError={() => {
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
                  selectedAgeGroup={
                    state.selectedAgeGroup as ProductData["ageGroup"]
                  }
                  handleCategoryChange={handleCategoryChange}
                  handleFilterChange={handleFilterChange}
                  handlePriceChange={handlePriceChange}
                  handleNoPriceFilterChange={handleNoPriceFilterChange}
                  setSelectedLearningOutcomes={actions.setLearningOutcomes}
                  setSelectedProductType={actions.setProductType}
                  setSelectedSpecialCategories={actions.setSpecialCategories}
                  setSelectedAgeGroup={age => actions.setAgeGroup(age ?? "")}
                  handleClearFilters={handleClearFilters}
                  setMobileFiltersOpen={actions.setMobileFiltersOpen}
                  t={t}
                />
              </ProductFiltersErrorBoundary>

              <ProductGridErrorBoundary
                onRetry={() => {
                  handleClearFilters();
                  window.location.reload();
                }}
              >
                <div className="flex-1 min-w-0">
                  <ProductsMainDisplay
                    activeCategory={activeCategory}
                    categoryInfo={categoryInfo}
                    filteredProducts={filteredProducts}
                    visibleProductsCount={bundleFilteredProducts.length}
                    displayedProducts={displayedProducts}
                    viewMode={state.viewMode}
                    sortOption={sortOption}
                    onSortChange={handleSortChange}
                    searchQuery={state.searchQuery}
                    onSearchQueryChange={handleSearchQueryChange}
                    onClearSearch={handleSearchClear}
                    bundleViewMode={bundleViewMode}
                    onBundleViewModeChange={setBundleViewMode}
                    getLearningTitle={getLearningTitle}
                    getLearningDescription={getLearningDescription}
                    getProductCardContent={getProductCardContent}
                    t={t}
                  />
                  {bundleFilteredProducts.length > 0 && (
                    <div className="mt-8">
                      <ProductsPagination
                        currentPage={page}
                        totalPages={totalPages}
                        baseUrl="/products"
                        searchParams={paginationSearchParams}
                        totalItems={bundleFilteredProducts.length}
                      />
                    </div>
                  )}
                </div>
              </ProductGridErrorBoundary>
            </div>
          </div>
        </div>

        {/* Premium Mobile Filters Modal - Always accessible on all screens */}
        <MobileFiltersModal
          isOpen={state.mobileFiltersOpen}
          onClose={() => actions.setMobileFiltersOpen(false)}
          activePanel={mobileFilterPanel}
          onActivePanelChange={setMobileFilterPanel}
          categories={categoryFilter[0]}
          priceRange={mobilePriceRange}
          selectedCategories={state.selectedCategories}
          noPriceFilter={state.noPriceFilter}
          selectedAgeGroup={state.selectedAgeGroup as ProductData["ageGroup"]}
          activeFilterCount={mobileFilterCount}
          categoryLabel={mobileCategoryLabel}
          ageLabel={mobileAgeLabel}
          priceLabel={mobilePriceLabel}
          onCategoryChange={handleCategoryChange}
          onPriceChange={handlePriceChange}
          onNoPriceFilterChange={handleNoPriceFilterChange}
          onAgeGroupChange={age => actions.setAgeGroup(age ?? "")}
          onClearCurrentPanel={handleClearMobilePanel}
          onClearFilters={handleClearFilters}
          t={t}
        />
      </ProductVariantProvider>
    </ProductsErrorBoundary>
  );

  return (
    <div className={productsBackgroundClass}>
      <div className={productsContentWrapperClass}>{content}</div>
    </div>
  );
}

function ClientProductsPageFallback() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="animate-pulse">
        <div className="h-[15vh] sm:h-[20vh] bg-muted rounded-2xl mb-4 sm:mb-8"></div>
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <div className="w-full md:w-64 h-80 sm:h-96 bg-muted rounded-2xl"></div>
          <div className="flex-1 space-y-3 sm:space-y-4">
            <div className="h-6 sm:h-8 bg-muted rounded-md"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 sm:h-64 bg-muted rounded-2xl"
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
