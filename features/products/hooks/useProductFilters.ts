"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useReducer, useCallback, useMemo } from "react";

// Types
interface FilterState {
  selectedCategories: string[];
  selectedFilters: Record<string, string[]>;
  priceRangeFilter: [number, number];
  noPriceFilter: boolean;
  selectedAgeGroup: string[];
  selectedStemDiscipline: string[];
  selectedLearningOutcomes: string[];
  selectedProductType: string[];
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
  | { type: "SET_AGE_GROUP"; payload: string[] }
  | { type: "SET_STEM_DISCIPLINE"; payload: string[] }
  | { type: "SET_LEARNING_OUTCOMES"; payload: string[] }
  | { type: "SET_PRODUCT_TYPE"; payload: string[] }
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
  priceRangeFilter: [0, 500],
  noPriceFilter: false,
  selectedAgeGroup: [],
  selectedStemDiscipline: [],
  selectedLearningOutcomes: [],
  selectedProductType: [],
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
      const isSelected = state.selectedCategories.includes(category);
      const newCategories = isSelected
        ? state.selectedCategories.filter(c => c !== category)
        : [...state.selectedCategories, category];
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

    case "SET_STEM_DISCIPLINE":
      return { ...state, selectedStemDiscipline: action.payload };

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

    // Parse categories
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      urlState.selectedCategories = categoryParam.split(",");
    }

    // Parse price range
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice && maxPrice) {
      urlState.priceRangeFilter = [parseInt(minPrice), parseInt(maxPrice)];
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

    dispatch({ type: "INIT_FROM_URL", payload: urlState });
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (state.selectedCategories.length > 0) {
      params.set("category", state.selectedCategories.join(","));
    }

    if (state.priceRangeFilter[0] !== 0 || state.priceRangeFilter[1] !== 500) {
      params.set("minPrice", state.priceRangeFilter[0].toString());
      params.set("maxPrice", state.priceRangeFilter[1].toString());
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

    const newURL = params.toString() ? `?${params.toString()}` : "";
    router.push(newURL, { scroll: false });
  }, [state, router]);

  // Action creators
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

      setAgeGroup: (ageGroup: string[]) =>
        dispatch({ type: "SET_AGE_GROUP", payload: ageGroup }),

      setStemDiscipline: (discipline: string[]) =>
        dispatch({ type: "SET_STEM_DISCIPLINE", payload: discipline }),

      setLearningOutcomes: (outcomes: string[]) =>
        dispatch({ type: "SET_LEARNING_OUTCOMES", payload: outcomes }),

      setProductType: (type: string[]) =>
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

      initFromSearchParams,
      updateURL,
    }),
    [initFromSearchParams, updateURL]
  );

  return { state, actions };
}
