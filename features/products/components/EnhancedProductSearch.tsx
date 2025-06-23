"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Filter,
  Loader2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "product" | "category" | "brand" | "tag";
  count?: number;
  category?: string;
  image?: string;
}

interface RecentSearch {
  query: string;
  timestamp: number;
  results: number;
}

interface TrendingSearch {
  query: string;
  count: number;
  trend: "up" | "down" | "stable";
}

interface EnhancedProductSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string, filters?: Record<string, any>) => void;
  showSuggestions?: boolean;
  showRecentSearches?: boolean;
  showTrendingSearches?: boolean;
  showAdvancedFilters?: boolean;
  autoFocus?: boolean;
}

const RECENT_SEARCHES_KEY = "stem-toys-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export function EnhancedProductSearch({
  placeholder = "Search for STEM toys, books, and educational products...",
  className,
  onSearch,
  showSuggestions = true,
  showRecentSearches = true,
  showTrendingSearches = true,
  showAdvancedFilters = false,
  autoFocus = false,
}: EnhancedProductSearchProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>(
    []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
      } catch (error) {
        console.error("Failed to parse recent searches:", error);
      }
    }
  }, []);

  // Load trending searches
  useEffect(() => {
    const loadTrendingSearches = async () => {
      try {
        const response = await fetch("/api/products/trending-searches");
        if (response.ok) {
          const data = await response.json();
          setTrendingSearches(data.trending || []);
        }
      } catch (error) {
        console.error("Failed to load trending searches:", error);
      }
    };

    if (showTrendingSearches) {
      loadTrendingSearches();
    }
  }, [showTrendingSearches]);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim() || !showSuggestions) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/products/suggestions?q=${encodeURIComponent(debouncedQuery)}&limit=10`
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, showSuggestions]);

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setSelectedIndex(-1);

      if (value.trim()) {
        setIsOpen(true);
      }
    },
    []
  );

  // Handle search execution
  const executeSearch = useCallback(
    (searchQuery: string, filters?: Record<string, any>) => {
      if (!searchQuery.trim()) return;

      // Save to recent searches
      const newSearch: RecentSearch = {
        query: searchQuery,
        timestamp: Date.now(),
        results: 0, // Will be updated after search
      };

      const updatedRecent = [
        newSearch,
        ...recentSearches.filter(s => s.query !== searchQuery),
      ].slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updatedRecent);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));

      // Close suggestions
      setIsOpen(false);

      // Execute search
      if (onSearch) {
        onSearch(searchQuery, filters);
      } else {
        // Default behavior: navigate to products page with search params
        const params = new URLSearchParams();
        params.set("search", searchQuery);

        // Add filters to params
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              params.set(key, String(value));
            }
          });
        }

        router.push(`/products?${params.toString()}`);
      }

      // Track search analytics
      trackSearch(searchQuery, filters);
    },
    [recentSearches, onSearch, router]
  );

  // Track search for analytics
  const trackSearch = useCallback(
    async (searchQuery: string, filters?: Record<string, any>) => {
      try {
        await fetch("/api/analytics/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            filters,
            timestamp: Date.now(),
          }),
        });
      } catch (error) {
        console.error("Failed to track search:", error);
      }
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      executeSearch(query, activeFilters);
    },
    [query, activeFilters, executeSearch]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      const totalSuggestions =
        suggestions.length + recentSearches.length + trendingSearches.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < totalSuggestions - 1 ? prev + 1 : -1
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > -1 ? prev - 1 : totalSuggestions - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            const allSuggestions = [
              ...suggestions.map(s => s.text),
              ...recentSearches.map(s => s.query),
              ...trendingSearches.map(s => s.query),
            ];
            executeSearch(allSuggestions[selectedIndex], activeFilters);
          } else {
            executeSearch(query, activeFilters);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [
      isOpen,
      suggestions,
      recentSearches,
      trendingSearches,
      selectedIndex,
      query,
      activeFilters,
      executeSearch,
    ]
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      executeSearch(suggestion, activeFilters);
    },
    [activeFilters, executeSearch]
  );

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Render suggestions
  const renderSuggestions = useMemo(() => {
    if (
      !isOpen ||
      (!suggestions.length &&
        !recentSearches.length &&
        !trendingSearches.length)
    ) {
      return null;
    }

    let currentIndex = 0;

    return (
      <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border-2">
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Search className="h-3 w-3" />
                    {t("suggestions", "Suggestions")}
                  </div>
                  {suggestions.map((suggestion, index) => {
                    const isSelected = currentIndex === selectedIndex;
                    currentIndex++;

                    return (
                      <div
                        key={suggestion.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors",
                          isSelected ? "bg-accent" : "hover:bg-accent/50"
                        )}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                      >
                        <div className="flex-shrink-0">
                          {suggestion.type === "product" && (
                            <Search className="h-4 w-4 text-muted-foreground" />
                          )}
                          {suggestion.type === "category" && (
                            <Filter className="h-4 w-4 text-muted-foreground" />
                          )}
                          {suggestion.type === "tag" && (
                            <Tag className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {suggestion.text}
                          </div>
                          {suggestion.count && (
                            <div className="text-xs text-muted-foreground">
                              {suggestion.count} {t("products", "products")}
                            </div>
                          )}
                        </div>
                        {suggestion.category && (
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.category}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {t("recentSearches", "Recent Searches")}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs"
                      onClick={clearRecentSearches}
                    >
                      {t("clear", "Clear")}
                    </Button>
                  </div>
                  {recentSearches.map((search, index) => {
                    const isSelected = currentIndex === selectedIndex;
                    currentIndex++;

                    return (
                      <div
                        key={`recent-${search.query}-${search.timestamp}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors",
                          isSelected ? "bg-accent" : "hover:bg-accent/50"
                        )}
                        onClick={() => handleSuggestionClick(search.query)}
                      >
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {search.query}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {search.results} {t("results", "results")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Trending Searches */}
              {trendingSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {t("trendingSearches", "Trending Searches")}
                  </div>
                  {trendingSearches.map((search, index) => {
                    const isSelected = currentIndex === selectedIndex;
                    currentIndex++;

                    return (
                      <div
                        key={`trending-${search.query}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors",
                          isSelected ? "bg-accent" : "hover:bg-accent/50"
                        )}
                        onClick={() => handleSuggestionClick(search.query)}
                      >
                        <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {search.query}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {search.count} {t("searches", "searches")}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {search.trend === "up"
                            ? "↗"
                            : search.trend === "down"
                              ? "↘"
                              : "→"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {t("searching", "Searching...")}
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }, [
    isOpen,
    suggestions,
    recentSearches,
    trendingSearches,
    selectedIndex,
    isLoading,
    t,
    handleSuggestionClick,
    clearRecentSearches,
  ]);

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto p-1"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button type="submit" disabled={!query.trim()}>
          <Search className="h-4 w-4 mr-2" />
          {t("search", "Search")}
        </Button>

        {showAdvancedFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-accent")}
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Active Filters */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {key}: {String(value)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  const newFilters = { ...activeFilters };
                  delete newFilters[key];
                  setActiveFilters(newFilters);
                }}
              />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs"
            onClick={() => setActiveFilters({})}
          >
            {t("clearAll", "Clear All")}
          </Button>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {renderSuggestions}
    </div>
  );
}
