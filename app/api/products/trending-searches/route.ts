import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

interface TrendingSearch {
  query: string;
  count: number;
  trend: "up" | "down" | "stable";
  category?: string;
}

// In a real application, this would come from analytics database
// For now, we'll use a mock implementation with realistic STEM toy searches
const MOCK_TRENDING_SEARCHES: TrendingSearch[] = [
  {
    query: "STEM building blocks",
    count: 156,
    trend: "up",
    category: "Engineering",
  },
  {
    query: "kids microscope",
    count: 142,
    trend: "up",
    category: "Science",
  },
  {
    query: "coding robot toys",
    count: 138,
    trend: "stable",
    category: "Technology",
  },
  {
    query: "math games",
    count: 124,
    trend: "up",
    category: "Mathematics",
  },
  {
    query: "science experiment kits",
    count: 118,
    trend: "stable",
    category: "Science",
  },
  {
    query: "educational puzzles",
    count: 95,
    trend: "down",
    category: "Mathematics",
  },
  {
    query: "chemistry set",
    count: 87,
    trend: "up",
    category: "Science",
  },
  {
    query: "robotics kit",
    count: 82,
    trend: "stable",
    category: "Technology",
  },
  {
    query: "engineering toys",
    count: 76,
    trend: "up",
    category: "Engineering",
  },
  {
    query: "electronic circuits",
    count: 71,
    trend: "stable",
    category: "Technology",
  },
];

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);
    const category = searchParams.get("category");
    const timeframe = searchParams.get("timeframe") || "7d"; // 7d, 30d, 90d

    try {
      let trending = [...MOCK_TRENDING_SEARCHES];

      // Filter by category if specified
      if (category) {
        trending = trending.filter(
          search => search.category?.toLowerCase() === category.toLowerCase()
        );
      }

      // Simulate different timeframes affecting trending data
      if (timeframe === "30d") {
        // Slightly different trending for 30 days
        trending = trending.map(search => ({
          ...search,
          count: Math.floor(search.count * 1.5),
          trend:
            Math.random() > 0.7
              ? search.trend === "up"
                ? "stable"
                : "up"
              : search.trend,
        }));
      } else if (timeframe === "90d") {
        // Different trending for 90 days
        trending = trending.map(search => ({
          ...search,
          count: Math.floor(search.count * 2.2),
          trend: Math.random() > 0.5 ? "stable" : search.trend,
        }));
      }

      // Sort by count and trend
      trending.sort((a, b) => {
        // Prioritize trending up searches
        if (a.trend === "up" && b.trend !== "up") return -1;
        if (b.trend === "up" && a.trend !== "up") return 1;

        // Then by count
        return b.count - a.count;
      });

      // Limit results
      const limitedTrending = trending.slice(0, limit);

      // Calculate trend changes (mock implementation)
      const trendingWithChanges = limitedTrending.map((search, index) => ({
        ...search,
        rank: index + 1,
        rankChange: Math.floor(Math.random() * 6) - 3, // -3 to +3
        percentChange:
          search.trend === "up"
            ? Math.floor(Math.random() * 50) + 10 // +10 to +60%
            : search.trend === "down"
              ? -(Math.floor(Math.random() * 30) + 5) // -5 to -35%
              : Math.floor(Math.random() * 20) - 10, // -10 to +10%
      }));

      return NextResponse.json({
        trending: trendingWithChanges,
        meta: {
          timeframe,
          category,
          total: trendingWithChanges.length,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching trending searches:", error);
      return NextResponse.json(
        {
          trending: [],
          error: "Failed to fetch trending searches",
        },
        { status: 500 }
      );
    }
  });
}

// POST endpoint to update trending data (for analytics)
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    try {
      const body = await request.json();
      const { query, category, source } = body;

      if (!query) {
        return NextResponse.json(
          { error: "Query is required" },
          { status: 400 }
        );
      }

      // In a real implementation, this would:
      // 1. Store the search query in analytics database
      // 2. Update trending calculations
      // 3. Possibly trigger real-time updates

      console.log("Search tracked:", {
        query,
        category,
        source,
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Search query tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking search:", error);
      return NextResponse.json(
        {
          error: "Failed to track search query",
        },
        { status: 500 }
      );
    }
  });
}
