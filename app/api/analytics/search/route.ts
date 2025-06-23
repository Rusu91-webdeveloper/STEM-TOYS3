import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

interface SearchAnalytics {
  query: string;
  filters?: Record<string, any>;
  timestamp: number;
  userAgent?: string;
  results?: number;
  clicked?: boolean;
  sessionId?: string;
  userId?: string;
}

// In a real application, this would be stored in a database or analytics service
// For now, we'll use in-memory storage for demonstration
const searchAnalytics: SearchAnalytics[] = [];
const MAX_ANALYTICS_RECORDS = 10000; // Prevent memory overflow

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    try {
      const body = await request.json();
      const { query, filters, timestamp, results, clicked, sessionId, userId } =
        body;

      if (!query) {
        return NextResponse.json(
          { error: "Query is required" },
          { status: 400 }
        );
      }

      const analytics: SearchAnalytics = {
        query: query.toLowerCase().trim(),
        filters: filters || {},
        timestamp: timestamp || Date.now(),
        userAgent: request.headers.get("user-agent") || undefined,
        results: results || 0,
        clicked: clicked || false,
        sessionId: sessionId || undefined,
        userId: userId || undefined,
      };

      // Store analytics record
      searchAnalytics.push(analytics);

      // Prevent memory overflow by removing old records
      if (searchAnalytics.length > MAX_ANALYTICS_RECORDS) {
        searchAnalytics.splice(
          0,
          searchAnalytics.length - MAX_ANALYTICS_RECORDS
        );
      }

      // Log for debugging
      console.log("Search analytics recorded:", {
        query: analytics.query,
        filters: Object.keys(analytics.filters || {}),
        timestamp: new Date(analytics.timestamp).toISOString(),
        results: analytics.results,
      });

      return NextResponse.json({
        success: true,
        message: "Search analytics recorded successfully",
      });
    } catch (error) {
      console.error("Error recording search analytics:", error);
      return NextResponse.json(
        {
          error: "Failed to record search analytics",
        },
        { status: 500 }
      );
    }
  });
}

// GET endpoint to retrieve search analytics (for admin dashboard)
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);
    const timeframe = searchParams.get("timeframe") || "24h";
    const query = searchParams.get("query");

    try {
      let filteredAnalytics = [...searchAnalytics];

      // Filter by timeframe
      const now = Date.now();
      const timeframeMs =
        {
          "1h": 60 * 60 * 1000,
          "24h": 24 * 60 * 60 * 1000,
          "7d": 7 * 24 * 60 * 60 * 1000,
          "30d": 30 * 24 * 60 * 60 * 1000,
        }[timeframe] || 24 * 60 * 60 * 1000;

      filteredAnalytics = filteredAnalytics.filter(
        record => now - record.timestamp <= timeframeMs
      );

      // Filter by specific query if provided
      if (query) {
        filteredAnalytics = filteredAnalytics.filter(record =>
          record.query.includes(query.toLowerCase())
        );
      }

      // Sort by timestamp (newest first)
      filteredAnalytics.sort((a, b) => b.timestamp - a.timestamp);

      // Limit results
      const limitedAnalytics = filteredAnalytics.slice(0, limit);

      // Calculate analytics summary
      const queryFrequency = new Map<string, number>();
      const filterUsage = new Map<string, number>();
      let totalResults = 0;
      let successfulSearches = 0;

      filteredAnalytics.forEach(record => {
        // Query frequency
        queryFrequency.set(
          record.query,
          (queryFrequency.get(record.query) || 0) + 1
        );

        // Filter usage
        if (record.filters) {
          Object.keys(record.filters).forEach(filterKey => {
            filterUsage.set(filterKey, (filterUsage.get(filterKey) || 0) + 1);
          });
        }

        // Results statistics
        totalResults += record.results || 0;
        if ((record.results || 0) > 0) {
          successfulSearches++;
        }
      });

      // Top queries
      const topQueries = Array.from(queryFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      // Popular filters
      const popularFilters = Array.from(filterUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([filter, count]) => ({ filter, count }));

      const summary = {
        totalSearches: filteredAnalytics.length,
        uniqueQueries: queryFrequency.size,
        averageResults:
          filteredAnalytics.length > 0
            ? Math.round(totalResults / filteredAnalytics.length)
            : 0,
        successRate:
          filteredAnalytics.length > 0
            ? Math.round((successfulSearches / filteredAnalytics.length) * 100)
            : 0,
        topQueries,
        popularFilters,
        timeframe,
        generatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        analytics: limitedAnalytics,
        summary,
        meta: {
          total: filteredAnalytics.length,
          returned: limitedAnalytics.length,
          timeframe,
          query: query || null,
        },
      });
    } catch (error) {
      console.error("Error retrieving search analytics:", error);
      return NextResponse.json(
        {
          error: "Failed to retrieve search analytics",
        },
        { status: 500 }
      );
    }
  });
}

// DELETE endpoint to clear analytics (for development/testing)
export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    try {
      const clearedCount = searchAnalytics.length;
      searchAnalytics.length = 0; // Clear the array

      return NextResponse.json({
        success: true,
        message: `Cleared ${clearedCount} analytics records`,
      });
    } catch (error) {
      console.error("Error clearing search analytics:", error);
      return NextResponse.json(
        {
          error: "Failed to clear search analytics",
        },
        { status: 500 }
      );
    }
  });
}
