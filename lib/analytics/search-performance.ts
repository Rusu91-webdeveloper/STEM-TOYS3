/**
 * Search Performance Monitoring for TechTots
 * Tracks search queries, results, and performance metrics
 */

interface SearchQuery {
  query: string;
  resultsCount: number;
  timestamp: number;
  language: "ro" | "en";
  category?: string;
  filters?: string[];
  userType?: "customer" | "supplier" | "admin";
}

interface SearchPerformanceMetrics {
  totalQueries: number;
  averageResultsCount: number;
  popularQueries: Array<{ query: string; count: number }>;
  zeroResultQueries: string[];
  categoryPerformance: Record<string, number>;
  languageDistribution: Record<string, number>;
}

class SearchPerformanceMonitor {
  private queries: SearchQuery[] = [];
  private maxQueries = 1000; // Keep last 1000 queries in memory

  trackSearch(query: SearchQuery) {
    // Add timestamp if not provided
    if (!query.timestamp) {
      query.timestamp = Date.now();
    }

    // Add to queries array
    this.queries.push(query);

    // Keep only recent queries
    if (this.queries.length > this.maxQueries) {
      this.queries = this.queries.slice(-this.maxQueries);
    }

    // Send to Google Analytics
    this.sendToGoogleAnalytics(query);

    // Send to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Search tracked:", query);
    }
  }

  private sendToGoogleAnalytics(query: SearchQuery) {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "search", {
        event_category: "Search Performance",
        event_label: query.query,
        value: query.resultsCount,
        custom_parameters: {
          search_language: query.language,
          search_category: query.category || "all",
          search_filters: query.filters?.join(",") || "none",
          user_type: query.userType || "customer",
          zero_results: query.resultsCount === 0,
        },
      });
    }
  }

  getMetrics(): SearchPerformanceMetrics {
    const totalQueries = this.queries.length;
    const averageResultsCount =
      totalQueries > 0
        ? this.queries.reduce((sum, q) => sum + q.resultsCount, 0) /
          totalQueries
        : 0;

    // Popular queries
    const queryCounts: Record<string, number> = {};
    this.queries.forEach(q => {
      queryCounts[q.query] = (queryCounts[q.query] || 0) + 1;
    });

    const popularQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Zero result queries
    const zeroResultQueries = this.queries
      .filter(q => q.resultsCount === 0)
      .map(q => q.query)
      .filter((query, index, arr) => arr.indexOf(query) === index);

    // Category performance
    const categoryCounts: Record<string, number> = {};
    this.queries.forEach(q => {
      if (q.category) {
        categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
      }
    });

    // Language distribution
    const languageCounts: Record<string, number> = {};
    this.queries.forEach(q => {
      languageCounts[q.language] = (languageCounts[q.language] || 0) + 1;
    });

    return {
      totalQueries,
      averageResultsCount: Math.round(averageResultsCount),
      popularQueries,
      zeroResultQueries,
      categoryPerformance: categoryCounts,
      languageDistribution: languageCounts,
    };
  }

  // Track specific TechTots search events
  trackProductSearch(
    query: string,
    resultsCount: number,
    language: "ro" | "en" = "ro"
  ) {
    this.trackSearch({
      query,
      resultsCount,
      language,
      category: "products",
    });
  }

  trackCategorySearch(
    category: string,
    query: string,
    resultsCount: number,
    language: "ro" | "en" = "ro"
  ) {
    this.trackSearch({
      query,
      resultsCount,
      language,
      category,
    });
  }

  trackBlogSearch(
    query: string,
    resultsCount: number,
    language: "ro" | "en" = "ro"
  ) {
    this.trackSearch({
      query,
      resultsCount,
      language,
      category: "blog",
    });
  }

  trackFilteredSearch(
    query: string,
    resultsCount: number,
    filters: string[],
    language: "ro" | "en" = "ro"
  ) {
    this.trackSearch({
      query,
      resultsCount,
      language,
      category: "products",
      filters,
    });
  }
}

// Global instance
export const searchMonitor = new SearchPerformanceMonitor();

// Convenience functions
export const trackSearch = (query: SearchQuery) =>
  searchMonitor.trackSearch(query);
export const trackProductSearch = (
  query: string,
  resultsCount: number,
  language: "ro" | "en" = "ro"
) => searchMonitor.trackProductSearch(query, resultsCount, language);
export const trackCategorySearch = (
  category: string,
  query: string,
  resultsCount: number,
  language: "ro" | "en" = "ro"
) => searchMonitor.trackCategorySearch(category, query, resultsCount, language);
export const trackBlogSearch = (
  query: string,
  resultsCount: number,
  language: "ro" | "en" = "ro"
) => searchMonitor.trackBlogSearch(query, resultsCount, language);
export const trackFilteredSearch = (
  query: string,
  resultsCount: number,
  filters: string[],
  language: "ro" | "en" = "ro"
) => searchMonitor.trackFilteredSearch(query, resultsCount, filters, language);
export const getSearchMetrics = () => searchMonitor.getMetrics();

// STEM-specific search tracking
export const trackSTEMSearch = (
  query: string,
  resultsCount: number,
  stemSubject: "science" | "technology" | "engineering" | "mathematics",
  language: "ro" | "en" = "ro"
) => {
  searchMonitor.trackSearch({
    query,
    resultsCount,
    language,
    category: "stem",
    filters: [stemSubject],
  });
};

// Age group specific search tracking
export const trackAgeGroupSearch = (
  query: string,
  resultsCount: number,
  ageGroup: string,
  language: "ro" | "en" = "ro"
) => {
  searchMonitor.trackSearch({
    query,
    resultsCount,
    language,
    category: "age-group",
    filters: [ageGroup],
  });
};

// TypeScript declarations
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
