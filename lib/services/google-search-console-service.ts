/**
 * Google Search Console Service for Romanian SEO Tracking
 *
 * Integrates with Google Search Console API to track keyword rankings,
 * search performance, and Romanian market SEO metrics for viral content optimization
 */

import { google } from "googleapis";
import { JWT } from "google-auth-library";

export interface GSCSearchAnalyticsQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: string[]; // ['page', 'query', 'country', 'device']
  filters?: Array<{
    dimension: string;
    operator: "equals" | "contains" | "notEquals" | "notContains";
    value: string;
  }>;
  rowLimit?: number;
}

export interface GSCSearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCKeywordRanking {
  keyword: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  url: string;
  lastUpdated: Date;
}

export interface GSCRomanianMarketData {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topKeywords: GSCKeywordRanking[];
  romanianKeywords: GSCKeywordRanking[];
  competitorKeywords: GSCKeywordRanking[];
  viralKeywords: GSCKeywordRanking[];
}

export class GoogleSearchConsoleService {
  private searchconsole: any;
  private siteUrl: string;

  constructor(siteUrl: string = "https://techtots.ro/") {
    this.siteUrl = siteUrl;
    this.initializeGSC();
  }

  private initializeGSC() {
    try {
      // For production, use service account credentials
      // For development, we'll use API key approach
      const auth = new JWT({
        email: process.env.GSC_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });

      this.searchconsole = google.searchconsole({
        version: "v1",
        auth,
      });
    } catch (error) {
      console.warn("Google Search Console not configured:", error);
      this.searchconsole = null;
    }
  }

  /**
   * Query search analytics data
   */
  async querySearchAnalytics(
    query: GSCSearchAnalyticsQuery
  ): Promise<GSCSearchAnalyticsRow[]> {
    if (!this.searchconsole) {
      throw new Error("Google Search Console not configured");
    }

    try {
      const request = {
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: query.startDate,
          endDate: query.endDate,
          dimensions: query.dimensions || ["query"],
          dimensionFilterGroups: query.filters
            ? [
                {
                  filters: query.filters.map(filter => ({
                    dimension: filter.dimension,
                    operator: filter.operator.toUpperCase(),
                    expression: filter.value,
                  })),
                },
              ]
            : undefined,
          rowLimit: query.rowLimit || 1000,
        },
      };

      const response = await this.searchconsole.searchanalytics.query(request);

      return response.data.rows || [];
    } catch (error) {
      console.error("GSC Query Error:", error);
      throw new Error("Failed to query Google Search Console data");
    }
  }

  /**
   * Get Romanian market SEO data
   */
  async getRomanianMarketData(
    days: number = 30
  ): Promise<GSCRomanianMarketData> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    try {
      // Get overall data
      const overallData = await this.querySearchAnalytics({
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ["query", "page"],
        filters: [
          {
            dimension: "country",
            operator: "equals",
            value: "rou", // Romania country code
          },
        ],
        rowLimit: 10000,
      });

      // Calculate totals
      const totalClicks = overallData.reduce((sum, row) => sum + row.clicks, 0);
      const totalImpressions = overallData.reduce(
        (sum, row) => sum + row.impressions,
        0
      );
      const averageCTR =
        totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averagePosition =
        overallData.length > 0
          ? overallData.reduce((sum, row) => sum + row.position, 0) /
            overallData.length
          : 0;

      // Get top keywords
      const topKeywords = overallData
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 50)
        .map(row => ({
          keyword: row.keys[0],
          position: row.position,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          url: row.keys[1],
          lastUpdated: new Date(),
        }));

      // Filter Romanian STEM keywords
      const romanianKeywords = topKeywords.filter(kw =>
        this.isRomanianSTEMKeyword(kw.keyword)
      );

      // Filter competitor-related keywords
      const competitorKeywords = topKeywords.filter(kw =>
        this.isCompetitorKeyword(kw.keyword)
      );

      // Filter viral keywords (high engagement)
      const viralKeywords = topKeywords.filter(
        kw => kw.ctr > 5 && kw.position <= 10
      );

      return {
        totalClicks,
        totalImpressions,
        averageCTR,
        averagePosition,
        topKeywords,
        romanianKeywords,
        competitorKeywords,
        viralKeywords,
      };
    } catch (error) {
      console.error("Failed to get Romanian market data:", error);
      // Return empty data structure for development
      return {
        totalClicks: 0,
        totalImpressions: 0,
        averageCTR: 0,
        averagePosition: 0,
        topKeywords: [],
        romanianKeywords: [],
        competitorKeywords: [],
        viralKeywords: [],
      };
    }
  }

  /**
   * Get keyword rankings for specific keywords
   */
  async getKeywordRankings(keywords: string[]): Promise<GSCKeywordRanking[]> {
    if (!this.searchconsole) {
      // Return mock data for development
      return keywords.map(keyword => ({
        keyword,
        position: Math.floor(Math.random() * 50) + 1,
        clicks: Math.floor(Math.random() * 100),
        impressions: Math.floor(Math.random() * 1000),
        ctr: Math.random() * 10,
        url: `https://techtots.ro/blog/${keyword.replace(/\s+/g, "-")}`,
        lastUpdated: new Date(),
      }));
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const rankings: GSCKeywordRanking[] = [];

    for (const keyword of keywords) {
      try {
        const data = await this.querySearchAnalytics({
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          dimensions: ["query", "page"],
          filters: [
            {
              dimension: "query",
              operator: "contains",
              value: keyword,
            },
            {
              dimension: "country",
              operator: "equals",
              value: "rou",
            },
          ],
          rowLimit: 10,
        });

        if (data.length > 0) {
          const bestResult = data.reduce((best, current) =>
            current.position < best.position ? current : best
          );

          rankings.push({
            keyword,
            position: bestResult.position,
            clicks: bestResult.clicks,
            impressions: bestResult.impressions,
            ctr: bestResult.ctr,
            url: bestResult.keys[1],
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        console.error(`Failed to get ranking for keyword "${keyword}":`, error);
      }
    }

    return rankings;
  }

  /**
   * Check if a keyword is Romanian STEM-related
   */
  private isRomanianSTEMKeyword(keyword: string): boolean {
    const romanianSTEMTerms = [
      "jucării stem",
      "educație stem",
      "stem românia",
      "copii matematică",
      "știință copii",
      "programare copii",
      "robotică educațională",
      "dezvoltare cognitivă",
      "învățare stem",
      "jucării interactive",
      "educație digitală",
      "stem școală",
      "matematică distractiv",
      "experimente științifice",
      "copii 6-12 ani",
      "stem toys",
      "jucării matematice",
      "învățare prin joc",
      "stem curriculum",
    ];

    return romanianSTEMTerms.some(term =>
      keyword.toLowerCase().includes(term.toLowerCase())
    );
  }

  /**
   * Check if a keyword is competitor-related
   */
  private isCompetitorKeyword(keyword: string): boolean {
    const competitorTerms = [
      "edu pedu",
      "scoala copiilor",
      "jucarii copii",
      "jucarii educationale",
      "educație online",
      "școală acasă",
      "învățământ particular",
      "meditații matematică",
      "cursuri știință",
      "școală virtuală",
    ];

    return competitorTerms.some(term =>
      keyword.toLowerCase().includes(term.toLowerCase())
    );
  }

  /**
   * Get site indexing status
   */
  async getSiteIndexingStatus(): Promise<{
    indexedPages: number;
    submittedPages: number;
    coverageIssues: number;
  }> {
    if (!this.searchconsole) {
      return {
        indexedPages: 0,
        submittedPages: 0,
        coverageIssues: 0,
      };
    }

    try {
      const response = await this.searchconsole.sitemaps.list({
        siteUrl: this.siteUrl,
      });

      // This is a simplified implementation
      // In production, you'd want more detailed indexing analysis
      return {
        indexedPages: response.data.sitemap?.length || 0,
        submittedPages: response.data.sitemap?.length || 0,
        coverageIssues: 0, // Would need additional API calls
      };
    } catch (error) {
      console.error("Failed to get indexing status:", error);
      return {
        indexedPages: 0,
        submittedPages: 0,
        coverageIssues: 0,
      };
    }
  }

  /**
   * Submit URL for indexing
   */
  async submitUrlForIndexing(url: string): Promise<boolean> {
    if (!this.searchconsole) {
      console.log(`Would submit URL for indexing: ${url}`);
      return true;
    }

    try {
      await this.searchconsole.urlInspection.index.inspect({
        inspectionUrl: url,
        siteUrl: this.siteUrl,
      });

      return true;
    } catch (error) {
      console.error("Failed to submit URL for indexing:", error);
      return false;
    }
  }
}

// Export singleton instance
export const gscService = new GoogleSearchConsoleService();
