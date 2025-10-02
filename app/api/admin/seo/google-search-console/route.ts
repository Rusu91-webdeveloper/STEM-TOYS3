/**
 * Google Search Console API Route
 *
 * Provides Romanian SEO data and keyword rankings for admin dashboard
 */

import { NextRequest, NextResponse } from "next/server";
// Ensure this API route is always dynamic to bypass Next.js caching
export const dynamic = "force-dynamic";
import { gscService } from "@/lib/services/google-search-console-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const days = parseInt(searchParams.get("days") || "30");
    const keywords = searchParams.get("keywords")?.split(",") || [];
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range if not provided
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      startDateObj.setDate(endDateObj.getDate() - days);
    }

    switch (action) {
      case "overview":
        const overviewData = await gscService.getRomanianMarketData(days);
        return NextResponse.json({
          dataSource: gscService.isConfigured ? "live" : "mock",
          data: overviewData,
        });

      case "keywords":
        const keywordRankings = await gscService.getKeywordRankings(keywords);
        return NextResponse.json({
          dataSource: gscService.isConfigured ? "live" : "mock",
          data: keywordRankings,
        });

      case "indexing":
        const indexingStatus = await gscService.getSiteIndexingStatus();
        return NextResponse.json({
          dataSource: gscService.isConfigured ? "live" : "mock",
          data: indexingStatus,
        });

      case "performance":
        const performanceData = await gscService.getPerformanceMetrics(
          startDateObj.toISOString().split("T")[0],
          endDateObj.toISOString().split("T")[0]
        );
        return NextResponse.json({
          dataSource: gscService.isConfigured ? "live" : "mock",
          data: performanceData,
        });

      case "competitor-analysis":
        const competitorData = await gscService.getCompetitorAnalysis();
        return NextResponse.json({
          dataSource: gscService.isConfigured ? "live" : "mock",
          data: competitorData,
        });

      case "health-score":
        const healthScore = await gscService.getSEOHealthScore();
        return NextResponse.json({
          dataSource: gscService.isConfigured ? "live" : "mock",
          data: healthScore,
        });

      default:
        // Return comprehensive dashboard data by default
        const dashboardData = await gscService.getDashboardData(days);
        return NextResponse.json({
          dataSource: gscService.isConfigured ? "live" : "mock",
          data: dashboardData,
        });
    }
  } catch (error) {
    console.error("GSC API Error:", error);

    // Return enhanced mock data for development
    const mockData = generateMockSEOData();
    return NextResponse.json({ dataSource: "mock", data: mockData });
  }
}

// Generate comprehensive mock SEO data for development
function generateMockSEOData() {
  const baseClicks = Math.floor(Math.random() * 5000) + 10000;
  const baseImpressions = Math.floor(Math.random() * 100000) + 200000;

  return {
    totalClicks: baseClicks,
    totalImpressions: baseImpressions,
    averageCTR: (baseClicks / baseImpressions) * 100,
    averagePosition: Math.random() * 5 + 5,
    topKeywords: [
      {
        keyword: "jucării STEM România",
        position: Math.floor(Math.random() * 3) + 1,
        clicks: Math.floor(Math.random() * 1000) + 800,
        impressions: Math.floor(Math.random() * 5000) + 5000,
        ctr: Math.random() * 5 + 10,
        url: "https://techtots.ro/categorii/jucarii-stem-romania",
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: "jucării educaționale STEM copii",
        position: Math.floor(Math.random() * 5) + 2,
        clicks: Math.floor(Math.random() * 800) + 500,
        impressions: Math.floor(Math.random() * 4000) + 3000,
        ctr: Math.random() * 4 + 8,
        url: "https://techtots.ro/products",
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: "robotică educațională România",
        position: Math.floor(Math.random() * 4) + 3,
        clicks: Math.floor(Math.random() * 600) + 300,
        impressions: Math.floor(Math.random() * 3000) + 2000,
        ctr: Math.random() * 3 + 6,
        url: "https://techtots.ro/categories/robotics",
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: "jucării STEM București",
        position: Math.floor(Math.random() * 6) + 4,
        clicks: Math.floor(Math.random() * 400) + 200,
        impressions: Math.floor(Math.random() * 2000) + 1500,
        ctr: Math.random() * 2 + 4,
        url: "https://techtots.ro/bucuresti",
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: "educație STEM copii",
        position: Math.floor(Math.random() * 5) + 5,
        clicks: Math.floor(Math.random() * 500) + 250,
        impressions: Math.floor(Math.random() * 2500) + 2000,
        ctr: Math.random() * 3 + 5,
        url: "https://techtots.ro/blog",
        lastUpdated: new Date().toISOString(),
      },
    ],
    romanianKeywords: [],
    competitorKeywords: [],
    viralKeywords: [],
    performanceMetrics: {
      dailyClicks: Array.from(
        { length: 30 },
        () => Math.floor(Math.random() * 200) + 100
      ),
      dailyImpressions: Array.from(
        { length: 30 },
        () => Math.floor(Math.random() * 5000) + 3000
      ),
      positionTrend: Array.from({ length: 30 }, () => Math.random() * 3 + 6),
    },
    indexingStatus: {
      indexedPages: Math.floor(Math.random() * 500) + 800,
      submittedPages: Math.floor(Math.random() * 100) + 50,
      coverageIssues: Math.floor(Math.random() * 20),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, url } = body;

    switch (action) {
      case "submit-url":
        if (!url) {
          return NextResponse.json(
            { error: "URL is required" },
            { status: 400 }
          );
        }

        const success = await gscService.submitUrlForIndexing(url);
        return NextResponse.json({ success });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("GSC API POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
