"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useReducer, useCallback, useMemo } from "react";

// Helper function to normalize category names for consistent comparison
const normalizeCategory = (name: string): string => {
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

  return lower;
};

// Types
interface FilterState {
  selectedCategories: string[];
  selectedFilters: Record<string, string[]>;
  priceRangeFilter: [number, number];
  noPriceFilter: boolean;
  selectedAgeGroup: string;
  selectedLearningOutcomes: string[];
  selectedProductType: string;
  selectedSpecialCategories: string[];
  searchQuery: string;
  sortBy: string;
  viewMode: "grid" | "list";
  mobileFiltersOpen: boolean;
}

type FilterAction =
  | { type: "SET_CATEGORIES"; payload: string[] }
  | { type: "TOGGLE_CATEGORY"; payload: string }
  | { type: "SET_FILTER"; payload: { filterId: string; optionId: string } }
  | { type: "SET_PRICE_RANGE"; payload: [number, number] }
  | { type: "SET_NO_PRICE_FILTER"; payload: boolean }
  | { type: "SET_AGE_GROUP"; payload: string }
  | { type: "SET_STEM_DISCIPLINE"; payload: string }
  | { type: "SET_LEARNING_OUTCOMES"; payload: string[] }
  | { type: "SET_PRODUCT_TYPE"; payload: string }
  | { type: "SET_SPECIAL_CATEGORIES"; payload: string[] }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_SORT_BY"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: "grid" | "list" }
  | { type: "SET_MOBILE_FILTERS_OPEN"; payload: boolean }
  | { type: "CLEAR_FILTERS" }
  | { type: "INIT_FROM_URL"; payload: Partial<FilterState> };

// Initial state
const initialState: FilterState = {
  selectedCategories: [],
  selectedFilters: {},
  priceRangeFilter: [0, 1000],
  noPriceFilter: true, // Price filter disabled by default
  selectedAgeGroup: "",
  selectedLearningOutcomes: [],
  selectedProductType: "",
  selectedSpecialCategories: [],
  searchQuery: "",
  sortBy: "relevance",
  viewMode: "grid",
  mobileFiltersOpen: false,
};

// Reducer
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_CATEGORIES":
      return { ...state, selectedCategories: action.payload };

    case "TOGGLE_CATEGORY": {
      const category = action.payload;
      // Normalize the category name for consistent comparison
      const normalizedCategory = normalizeCategory(category);
      const isSelected = state.selectedCategories.some(
        c => normalizeCategory(c) === normalizedCategory
      );
      const newCategories = isSelected
        ? state.selectedCategories.filter(
            c => normalizeCategory(c) !== normalizedCategory
          )
        : [
            ...state.selectedCategories.filter(
              c => normalizeCategory(c) !== normalizedCategory
            ),
            normalizedCategory,
          ];
      return { ...state, selectedCategories: newCategories };
    }

    case "SET_FILTER": {
      const { filterId, optionId } = action.payload;
      const currentOptions = state.selectedFilters[filterId] || [];
      const isSelected = currentOptions.includes(optionId);
      const newOptions = isSelected
        ? currentOptions.filter(id => id !== optionId)
        : [...currentOptions, optionId];

      return {
        ...state,
        selectedFilters: {
          ...state.selectedFilters,
          [filterId]: newOptions.length > 0 ? newOptions : undefined,
        },
      };
    }

    case "SET_PRICE_RANGE":
      return { ...state, priceRangeFilter: action.payload };

    case "SET_NO_PRICE_FILTER":
      return { ...state, noPriceFilter: action.payload };

    case "SET_AGE_GROUP":
      return { ...state, selectedAgeGroup: action.payload };

    case "SET_LEARNING_OUTCOMES":
      return { ...state, selectedLearningOutcomes: action.payload };

    case "SET_PRODUCT_TYPE":
      return { ...state, selectedProductType: action.payload };

    case "SET_SPECIAL_CATEGORIES":
      return { ...state, selectedSpecialCategories: action.payload };

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };

    case "SET_SORT_BY":
      return { ...state, sortBy: action.payload };

    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };

    case "SET_MOBILE_FILTERS_OPEN":
      return { ...state, mobileFiltersOpen: action.payload };

    case "CLEAR_FILTERS":
      return {
        ...initialState,
        viewMode: state.viewMode, // Preserve view mode
        searchQuery: state.searchQuery, // Preserve search
      };

    case "INIT_FROM_URL":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Custom hook
export function useProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(filterReducer, initialState);

  // Initialize from URL params
  const initFromSearchParams = useCallback(() => {
    const urlState: Partial<FilterState> = {};

    // Parse categories with normalization for consistency
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      // Normalize category names and remove duplicates
      const categories = categoryParam.split(",");
      const normalizedCategories = Array.from(
        new Set(categories.map(cat => normalizeCategory(cat.trim())))
      ).filter(Boolean);
      urlState.selectedCategories = normalizedCategories;
    }

    // Parse price range with safe integer parsing
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice && maxPrice) {
      const parsedMin = parseInt(minPrice, 10);
      const parsedMax = parseInt(maxPrice, 10);
      // Only set if both values are valid numbers
      if (
        !isNaN(parsedMin) &&
        !isNaN(parsedMax) &&
        parsedMin >= 0 &&
        parsedMax > parsedMin
      ) {
        urlState.priceRangeFilter = [parsedMin, parsedMax];
      }
    }

    // Parse search query
    const search = searchParams.get("search");
    if (search) {
      urlState.searchQuery = search;
    }

    // Parse sort
    const sort = searchParams.get("sort");
    if (sort) {
      urlState.sortBy = sort;
    }

    // Parse view mode
    const view = searchParams.get("view");
    if (view === "grid" || view === "list") {
      urlState.viewMode = view;
    }

    // Parse learning outcomes
    const learningOutcomesParam = searchParams.get("learningOutcomes");
    if (learningOutcomesParam) {
      urlState.selectedLearningOutcomes = learningOutcomesParam
        .split(",")
        .filter(Boolean);
    }

    // Parse special categories
    const specialCategoriesParam = searchParams.get("specialCategories");
    if (specialCategoriesParam) {
      urlState.selectedSpecialCategories = specialCategoriesParam
        .split(",")
        .filter(Boolean);
    }

    // Parse noPriceFilter
    const noPriceFilterParam = searchParams.get("noPriceFilter");
    if (noPriceFilterParam) {
      urlState.noPriceFilter = noPriceFilterParam === "true";
    }

    dispatch({ type: "INIT_FROM_URL", payload: urlState });
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (state.selectedCategories.length > 0) {
      // Remove duplicates and ensure clean category list
      const uniqueCategories = Array.from(
        new Set(state.selectedCategories)
      ).filter(Boolean);
      if (uniqueCategories.length > 0) {
        params.set("category", uniqueCategories.join(","));
      }
    }

    // Include price parameters if price filter is enabled
    if (!state.noPriceFilter) {
      const minPrice = state.priceRangeFilter[0];
      const maxPrice = state.priceRangeFilter[1];

      if (minPrice !== undefined && minPrice !== null) {
        params.set("minPrice", minPrice.toString());
      }
      if (maxPrice !== undefined && maxPrice !== null) {
        params.set("maxPrice", maxPrice.toString());
      }
    }

    if (state.searchQuery) {
      params.set("search", state.searchQuery);
    }

    if (state.sortBy !== "relevance") {
      params.set("sort", state.sortBy);
    }

    if (state.viewMode !== "grid") {
      params.set("view", state.viewMode);
    }

    if (state.selectedLearningOutcomes.length > 0) {
      params.set("learningOutcomes", state.selectedLearningOutcomes.join(","));
    }

    if (state.selectedSpecialCategories.length > 0) {
      params.set(
        "specialCategories",
        state.selectedSpecialCategories.join(",")
      );
    }

    // Add noPriceFilter to URL
    if (state.noPriceFilter) {
      params.set("noPriceFilter", "true");
    }

    const newURL = params.toString() ? `?${params.toString()}` : "";
    router.push(newURL, { scroll: false });
  }, [state, router]);

  // Action creators - stable functions that don't depend on changing values
  const actions = useMemo(
    () => ({
      setCategories: (categories: string[]) =>
        dispatch({ type: "SET_CATEGORIES", payload: categories }),

      toggleCategory: (category: string) =>
        dispatch({ type: "TOGGLE_CATEGORY", payload: category }),

      setFilter: (filterId: string, optionId: string) =>
        dispatch({ type: "SET_FILTER", payload: { filterId, optionId } }),

      setPriceRange: (range: [number, number]) =>
        dispatch({ type: "SET_PRICE_RANGE", payload: range }),

      setNoPriceFilter: (enabled: boolean) =>
        dispatch({ type: "SET_NO_PRICE_FILTER", payload: enabled }),

      setAgeGroup: (ageGroup: string) =>
        dispatch({ type: "SET_AGE_GROUP", payload: ageGroup }),

      setLearningOutcomes: (outcomes: string[]) =>
        dispatch({ type: "SET_LEARNING_OUTCOMES", payload: outcomes }),

      setProductType: (type: string) =>
        dispatch({ type: "SET_PRODUCT_TYPE", payload: type }),

      setSpecialCategories: (categories: string[]) =>
        dispatch({ type: "SET_SPECIAL_CATEGORIES", payload: categories }),

      setSearchQuery: (query: string) =>
        dispatch({ type: "SET_SEARCH_QUERY", payload: query }),

      setSortBy: (sort: string) =>
        dispatch({ type: "SET_SORT_BY", payload: sort }),

      setViewMode: (mode: "grid" | "list") =>
        dispatch({ type: "SET_VIEW_MODE", payload: mode }),

      setMobileFiltersOpen: (open: boolean) =>
        dispatch({ type: "SET_MOBILE_FILTERS_OPEN", payload: open }),

      clearFilters: () => dispatch({ type: "CLEAR_FILTERS" }),
    }),
    // Only dispatch is needed as dependency since it's stable from useReducer
    []
  );

  return { state, actions, initFromSearchParams, updateURL };
}
