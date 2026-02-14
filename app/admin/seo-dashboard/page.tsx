/**
 * Advanced SEO Monitoring Dashboard
 * Track performance and optimize for #1 Google ranking
 */

"use client";

import { useState, useEffect } from "react";
import {
  HIGH_PRIORITY_KEYWORDS,
  COMPETITOR_ANALYSIS,
} from "@/lib/seo/competitive-keywords";
import { ROMANIAN_CITIES } from "@/lib/seo/local-seo-romania";

interface SEOData {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topKeywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
    url: string;
    lastUpdated: string;
  }>;
  romanianKeywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
    url: string;
    lastUpdated: string;
  }>;
  competitorKeywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
    url: string;
    lastUpdated: string;
  }>;
  viralKeywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
    url: string;
    lastUpdated: string;
  }>;
  performanceMetrics?: {
    dailyClicks: number[];
    dailyImpressions: number[];
    positionTrend: number[];
    ctrTrend: number[];
  };
  indexingStatus?: {
    indexedPages: number;
    submittedPages: number;
    coverageIssues: number;
  };
  competitorAnalysis?: {
    competitors: Array<{
      domain: string;
      sharedKeywords: number;
      betterRankedKeywords: number;
      worseRankedKeywords: number;
      averagePosition: number;
    }>;
  };
}

export default function SEODashboardPage() {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string>(
    "jucării STEM România"
  );
  const [keywordHistory, setKeywordHistory] = useState<{
    dates: string[];
    positions: number[];
    clicks: number[];
    impressions: number[];
    ctr: number[];
  } | null>(null);
  const [healthScore, setHealthScore] = useState<{
    overallScore: number;
    categoryScores: {
      technical: number;
      content: number;
      backlinks: number;
      local: number;
      mobile: number;
      performance: number;
    };
    strengths: string[];
    recommendations: string[];
    weaknesses: string[];
  } | null>(null);
  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [analyticsMessage, setAnalyticsMessage] = useState<string | null>(null);
  const [lastDatabaseUpdate, setLastDatabaseUpdate] = useState<Date | null>(
    null
  );
  const [keywordHistorySource, setKeywordHistorySource] = useState<
    "database" | "mock" | null
  >(null);

  const fetchKeywordHistory = async (keyword: string) => {
    try {
      // First try to get real data from database
      const response = await fetch(
        `/api/admin/seo/google-search-console?action=keyword-history&keyword=${encodeURIComponent(keyword)}&days=30`
      );
      if (response.ok) {
        const payload = await response.json();
        const data = payload.data;

        // Track data source
        setKeywordHistorySource(payload.dataSource || "mock");

        // If we have real data from database, use it
        if (data && data.dates && data.dates.length > 0) {
          setKeywordHistory({
            dates: data.dates,
            positions: data.positions,
            clicks: data.clicks,
            impressions: data.impressions,
            ctr: data.ctr,
          });
          return;
        }
      }

      // Fallback: Try to get current keyword data and generate trend
      // This is used when no historical data exists yet
      const currentResponse = await fetch(
        `/api/admin/seo/google-search-console?action=keywords&keywords=${encodeURIComponent(keyword)}`
      );
      if (currentResponse.ok) {
        const currentPayload = await currentResponse.json();
        const currentData = currentPayload.data;
        const currentPosition = currentData?.[0]?.position || 5;

        // Generate placeholder data based on current position
        // This will be replaced once daily analytics start collecting data
        setKeywordHistory({
          dates: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split("T")[0];
          }),
          positions: Array.from({ length: 30 }, () => currentPosition),
          clicks: Array.from({ length: 30 }, () => 0),
          impressions: Array.from({ length: 30 }, () => 0),
          ctr: Array.from({ length: 30 }, () => 0),
        });
      }
    } catch (err) {
      console.error("Error fetching keyword history:", err);
      // Set empty data on error
      setKeywordHistory({
        dates: [],
        positions: [],
        clicks: [],
        impressions: [],
        ctr: [],
      });
    }
  };

  const fetchHealthScore = async () => {
    try {
      const response = await fetch(
        "/api/admin/seo/google-search-console?action=health-score"
      );
      if (response.ok) {
        const payload = await response.json();
        setHealthScore(payload.data);
      }
    } catch (err) {
      console.error("Error fetching health score:", err);
    }
  };

  const saveAnalyticsData = async () => {
    setSavingAnalytics(true);
    setAnalyticsMessage(null);

    try {
      // Call a server-side admin route that proxies the cron job
      // The cron secret is never exposed to the browser
      const response = await fetch("/api/admin/seo/save-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAnalyticsMessage(
          `✅ Successfully saved ${data.recordsSaved} SEO analytics records`
        );
      } else {
        setAnalyticsMessage(
          `❌ Failed to save analytics: ${data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      setAnalyticsMessage("❌ Error connecting to analytics service");
      console.error("Analytics save error:", err);
    } finally {
      setSavingAnalytics(false);
    }
  };

  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/admin/seo/google-search-console?action=overview&days=30"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch SEO data");
        }
        const payload = await response.json();
        setDataSource(payload.dataSource ?? null);
        setSeoData(payload.data);

        // Fetch last database update timestamp
        try {
          const dbResponse = await fetch(
            "/api/admin/seo/google-search-console?action=last-update"
          );
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            if (dbData.lastUpdate) {
              setLastDatabaseUpdate(new Date(dbData.lastUpdate));
            }
          }
        } catch (err) {
          // Silently fail - this is optional data
          console.log("Could not fetch last database update:", err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching SEO data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSEOData();
    fetchHealthScore();
  }, []);

  useEffect(() => {
    if (selectedKeyword) {
      fetchKeywordHistory(selectedKeyword);
    }
  }, [selectedKeyword]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">
            🚀 SEO Performance Dashboard
          </h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">Loading SEO data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">
            🚀 SEO Performance Dashboard
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading SEO data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            🚀 SEO Performance Dashboard
          </h1>
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium border ${dataSource === "live"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : dataSource === "database"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : "bg-yellow-100 text-yellow-800 border-yellow-300"
                }`}
            >
              {dataSource === "live"
                ? "🟢 Live Data (GSC)"
                : dataSource === "database"
                  ? "🔵 Database Data"
                  : "⚠️ Mock Data"}
            </span>
            {lastDatabaseUpdate && (
              <div className="text-xs text-gray-500">
                DB Updated: {lastDatabaseUpdate.toLocaleString()}
              </div>
            )}
            <div className="text-xs text-gray-500">
              Page Updated: {new Date().toLocaleString()}
            </div>
            <button
              onClick={saveAnalyticsData}
              disabled={savingAnalytics}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${savingAnalytics
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              {savingAnalytics ? "💾 Saving..." : "💾 Save Analytics"}
            </button>
          </div>
        </div>

        {/* Analytics Message */}
        {analyticsMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${analyticsMessage.includes("✅")
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
              }`}
          >
            {analyticsMessage}
          </div>
        )}

        {/* Key Metrics Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">
              Total Clicks
            </h3>
            <div className="text-3xl font-bold text-blue-600">
              {seoData?.totalClicks?.toLocaleString() || "0"}
            </div>
            <p className="text-sm text-gray-500">Last 30 days</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">
              Total Impressions
            </h3>
            <div className="text-3xl font-bold text-green-600">
              {seoData?.totalImpressions?.toLocaleString() || "0"}
            </div>
            <p className="text-sm text-gray-500">Search visibility</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">Avg. CTR</h3>
            <div className="text-3xl font-bold text-purple-600">
              {seoData?.averageCTR ? seoData.averageCTR.toFixed(1) + "%" : "0%"}
            </div>
            <p className="text-sm text-gray-500">Click-through rate</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">
              Avg. Position
            </h3>
            <div className="text-3xl font-bold text-orange-600">
              {seoData?.averagePosition
                ? seoData.averagePosition.toFixed(1)
                : "N/A"}
            </div>
            <p className="text-sm text-gray-500">Google ranking</p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">
              Target Keywords
            </h3>
            <div className="text-3xl font-bold text-indigo-600">
              {HIGH_PRIORITY_KEYWORDS.length}
            </div>
            <p className="text-sm text-gray-500">High-priority targets</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">
              Indexed Pages
            </h3>
            <div className="text-3xl font-bold text-teal-600">
              {seoData?.indexingStatus?.indexedPages?.toLocaleString() || "0"}
            </div>
            <p className="text-sm text-gray-500">Google indexed</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">
              Local Markets
            </h3>
            <div className="text-3xl font-bold text-pink-600">
              {ROMANIAN_CITIES.length}
            </div>
            <p className="text-sm text-gray-500">Romanian cities targeted</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-600">
              Competitor Gaps
            </h3>
            <div className="text-3xl font-bold text-red-600">
              {HIGH_PRIORITY_KEYWORDS.filter(k => k.competitorGap).length}
            </div>
            <p className="text-sm text-gray-500">Opportunities identified</p>
          </div>
        </div>

        {/* SEO Health Score */}
        {healthScore && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">🏥 SEO Health Score</h2>
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                🔵 Calculated from Database
              </span>
            </div>

            {/* Overall Score */}
            <div className="text-center mb-8">
              <div
                className={`text-6xl font-bold mb-2 ${healthScore.overallScore >= 90
                    ? "text-green-600"
                    : healthScore.overallScore >= 80
                      ? "text-blue-600"
                      : healthScore.overallScore >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
              >
                {healthScore.overallScore}/100
              </div>
              <p className="text-lg text-gray-600">Overall SEO Health</p>
              <div className="mt-4 bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${healthScore.overallScore >= 90
                      ? "bg-green-600"
                      : healthScore.overallScore >= 80
                        ? "bg-blue-600"
                        : healthScore.overallScore >= 70
                          ? "bg-yellow-600"
                          : "bg-red-600"
                    }`}
                  style={{ width: `${healthScore.overallScore}%` }}
                ></div>
              </div>
            </div>

            {/* Category Scores */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {Object.entries(healthScore.categoryScores).map(
                ([category, score]) => (
                  <div
                    key={category}
                    className="text-center p-4 border rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {score}/100
                    </div>
                    <div className="text-sm font-medium text-gray-600 capitalize mb-2">
                      {category}
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${score >= 90
                            ? "bg-green-600"
                            : score >= 80
                              ? "bg-blue-600"
                              : score >= 70
                                ? "bg-yellow-600"
                                : "bg-red-600"
                          }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Recommendations */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-3">
                  ✅ Strengths
                </h3>
                <ul className="space-y-2">
                  {healthScore.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-orange-600 mb-3">
                  🎯 Recommendations
                </h3>
                <ul className="space-y-2">
                  {healthScore.recommendations.slice(0, 5).map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">→</span>
                      <span className="text-sm text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {healthScore.weaknesses.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-red-600 mb-3">
                  ⚠️ Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {healthScore.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">!</span>
                      <span className="text-sm text-gray-700">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Keyword Performance */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Target Keywords */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">
              🎯 High-Priority Keyword Targets
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">Keyword</th>
                    <th className="px-4 py-3 text-left">Volume</th>
                    <th className="px-4 py-3 text-left">Difficulty</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {HIGH_PRIORITY_KEYWORDS.slice(0, 8).map((keyword, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-4 py-3 font-medium">
                        {keyword.keyword}
                      </td>
                      <td className="px-4 py-3">
                        {keyword.searchVolume}/month
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${keyword.difficulty < 40
                              ? "bg-green-100 text-green-800"
                              : keyword.difficulty < 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {keyword.difficulty}/100
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${keyword.competitorGap
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {keyword.competitorGap
                            ? "Opportunity"
                            : "Competitive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Rankings */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">
              📊 Live Keyword Rankings
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">Keyword</th>
                    <th className="px-4 py-3 text-left">Position</th>
                    <th className="px-4 py-3 text-left">Clicks</th>
                    <th className="px-4 py-3 text-left">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {seoData?.topKeywords?.slice(0, 8).map((keyword, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-4 py-3 font-medium">
                        {keyword.keyword}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${keyword.position <= 3
                              ? "bg-green-100 text-green-800"
                              : keyword.position <= 10
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          #{keyword.position}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {keyword.clicks.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {(keyword.ctr * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!seoData?.topKeywords?.length && (
                <div className="text-center py-8 text-gray-500">
                  No ranking data available. Connect Google Search Console for
                  live data.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Local SEO Performance */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">🗺️ Local SEO Performance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROMANIAN_CITIES.filter(city => city.priority === "high").map(
              (city, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <h3 className="text-lg font-bold mb-2">{city.name}</h3>
                  <p className="text-gray-600 mb-4">
                    {city.region} • {city.population.toLocaleString()} locuitori
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Search Volume:
                      </span>
                      <span className="font-medium">
                        {city.searchVolume}/month
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Priority:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${city.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : city.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                      >
                        {city.priority}
                      </span>
                    </div>
                    <div className="mt-4">
                      <a
                        href={`/${city.name.toLowerCase()}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Local Landing Page →
                      </a>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Competitor Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🏆 Competitor Analysis</h2>
            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
              ⚠️ Mock Data (Feature in Development)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left">Competitor</th>
                  <th className="px-4 py-3 text-left">Shared Keywords</th>
                  <th className="px-4 py-3 text-left">Better Positioned</th>
                  <th className="px-4 py-3 text-left">Worse Positioned</th>
                  <th className="px-4 py-3 text-left">Avg. Position</th>
                  <th className="px-4 py-3 text-left">Threat Level</th>
                </tr>
              </thead>
              <tbody>
                {seoData?.competitorAnalysis?.competitors?.map(
                  (competitor, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-4 py-3 font-medium">
                        {competitor.domain}
                      </td>
                      <td className="px-4 py-3">{competitor.sharedKeywords}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                          {competitor.betterRankedKeywords}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          {competitor.worseRankedKeywords}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {competitor.averagePosition.toFixed(1)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${competitor.averagePosition < 5
                              ? "bg-red-100 text-red-800"
                              : competitor.averagePosition < 8
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                        >
                          {competitor.averagePosition < 5
                            ? "High"
                            : competitor.averagePosition < 8
                              ? "Medium"
                              : "Low"}
                        </span>
                      </td>
                    </tr>
                  )
                ) || (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No competitor data available. Connect Google Search
                        Console for live analysis.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keyword Ranking Tracker */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">
            📈 Keyword Ranking Tracker
          </h2>

          {/* Keyword Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Keyword to Track
            </label>
            <select
              value={selectedKeyword}
              onChange={e => setSelectedKeyword(e.target.value)}
              className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {HIGH_PRIORITY_KEYWORDS.map((kw, index) => (
                <option key={index} value={kw.keyword}>
                  {kw.keyword}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword History Chart */}
          {keywordHistory && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  30-Day Position Trend: {selectedKeyword}
                </h3>
                {keywordHistorySource && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${keywordHistorySource === "database"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                      }`}
                  >
                    {keywordHistorySource === "database"
                      ? "🔵 Real Data"
                      : "⚠️ Placeholder"}
                  </span>
                )}
              </div>
              {keywordHistorySource === "mock" &&
                keywordHistory.positions.every((p) => p === 0) && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    💡 No historical data yet. Historical data will appear here
                    once daily analytics collection starts running.
                  </div>
                )}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {keywordHistory.positions[
                      keywordHistory.positions.length - 1
                    ]?.toFixed(1) || "N/A"}
                  </div>
                  <p className="text-sm text-gray-500">Current Position</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.min(...keywordHistory.positions).toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-500">Best Position</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {keywordHistory.clicks
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500">Total Clicks (30d)</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(
                      keywordHistory.ctr.reduce((a, b) => a + b, 0) /
                      keywordHistory.ctr.length
                    ).toFixed(1)}
                    %
                  </div>
                  <p className="text-sm text-gray-500">Avg. CTR</p>
                </div>
              </div>

              {/* Simple trend visualization */}
              <div className="bg-white p-4 rounded border">
                <div className="flex items-end space-x-1 h-32">
                  {keywordHistory.positions
                    .slice(-14)
                    .map((position, index) => {
                      const height = Math.max(10, (20 - position) * 5); // Invert scale: lower position = higher bar
                      const isImprovement =
                        index > 0 &&
                        position <
                        keywordHistory.positions.slice(-14)[index - 1];
                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div
                            className={`w-full rounded-t ${isImprovement ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ height: `${height}px` }}
                            title={`Position: ${position.toFixed(1)}`}
                          ></div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(
                              keywordHistory.dates[
                              keywordHistory.dates.length - 14 + index
                              ]
                            ).getDate()}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-2 text-sm text-gray-600 text-center">
                  Position trend over last 14 days (lower = better)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Indexing Issues Alert */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                ⚠️ Critical: 43 Pages Stuck in "Pending" Status
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">
                  Your pages have been pending for 2 weeks. This indicates:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Crawling budget issues</li>
                  <li>Content quality concerns</li>
                  <li>Technical SEO problems</li>
                  <li>Mobile usability issues</li>
                </ul>
                <p className="mt-2 font-medium">
                  Action Required: Follow the indexing roadmap below
                  immediately.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">
            🚨 URGENT: Fix Indexing Issues - Step-by-Step Roadmap
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 text-red-600">
                🚨 PHASE 1: Diagnose & Fix (Complete Today)
              </h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong>Check GSC Coverage Report</strong>
                    <p className="text-sm mt-1">
                      Go to GSC → Coverage → Check for "Excluded" or "Crawled -
                      currently not indexed" errors
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong>Test Mobile Usability</strong>
                    <p className="text-sm mt-1">
                      GSC → Mobile Usability → Fix any "Not mobile-friendly"
                      issues
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong>Check Page Speed</strong>
                    <p className="text-sm mt-1">
                      Run PageSpeed Insights on pending URLs and fix Core Web
                      Vitals
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong>Verify Internal Linking</strong>
                    <p className="text-sm mt-1">
                      Ensure each page has at least 3-5 internal links pointing
                      to it
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 text-orange-600">
                🚨 PHASE 2: Submit & Monitor (Complete Tomorrow)
              </h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    5
                  </span>
                  <div>
                    <strong>Submit Individual Pages</strong>
                    <p className="text-sm mt-1">
                      Manually submit 5-10 high-priority pages via GSC "Request
                      Indexing"
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    6
                  </span>
                  <div>
                    <strong>Resubmit Sitemap</strong>
                    <p className="text-sm mt-1">
                      Remove and re-add your sitemap in GSC
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    7
                  </span>
                  <div>
                    <strong>Monitor Daily</strong>
                    <p className="text-sm mt-1">
                      Check GSC daily for 7 days to track indexing progress
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                    8
                  </span>
                  <div>
                    <strong>Content Quality Audit</strong>
                    <p className="text-sm mt-1">
                      Ensure each page has 300+ words and unique value
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
            <h3 className="text-xl font-bold mb-4 text-red-700">
              🎯 Why Your Pages Are Stuck & Solutions
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-red-600 mb-2">
                  Most Likely Causes:
                </h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>
                    • <strong>Crawling Budget:</strong> Google limits how many
                    pages it crawls per day
                  </li>
                  <li>
                    • <strong>Content Quality:</strong> Thin content or
                    duplicate content issues
                  </li>
                  <li>
                    • <strong>Technical Issues:</strong> Mobile usability, page
                    speed, or indexing errors
                  </li>
                  <li>
                    • <strong>Internal Linking:</strong> Pages with no or few
                    internal links
                  </li>
                  <li>
                    • <strong>New Site Penalty:</strong> New sites need time to
                    build trust
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-600 mb-2">
                  Immediate Actions:
                </h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>
                    • <strong>Fix Technical Issues First</strong> (mobile,
                    speed, errors)
                  </li>
                  <li>
                    • <strong>Submit High-Priority Pages Manually</strong>{" "}
                    (categories, important content)
                  </li>
                  <li>
                    • <strong>Improve Internal Linking</strong> (add navigation,
                    related content links)
                  </li>
                  <li>
                    • <strong>Monitor GSC Coverage Report</strong> daily for
                    specific errors
                  </li>
                  <li>
                    • <strong>Don't Rush Submissions</strong> - quality over
                    quantity
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h3 className="text-xl font-bold mb-4">
              🎯 Expected Timeline to #1 Ranking
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  Month 1-2
                </div>
                <p className="text-sm">Technical foundation & content</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  Month 3-4
                </div>
                <p className="text-sm">Authority building & links</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  Month 5-6
                </div>
                <p className="text-sm">Ranking improvements</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  Month 6+
                </div>
                <p className="text-sm">#1 ranking achieved!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
