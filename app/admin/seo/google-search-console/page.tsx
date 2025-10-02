/**
 * Google Search Console Dashboard for Romanian SEO Tracking
 *
 * Admin dashboard to monitor Romanian keyword rankings, search performance,
 * and viral content SEO metrics for market domination
 */

import { Suspense } from "react";

// Force dynamic rendering since we use no-store fetch
export const dynamic = "force-dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Eye,
  MousePointer,
  Target,
  AlertTriangle,
  RefreshCw,
  Download,
  BarChart3,
} from "lucide-react";

interface GSCRomanianMarketData {
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
  romanianKeywords: Array<any>;
  competitorKeywords: Array<any>;
  viralKeywords: Array<any>;
}

async function getGSCData(): Promise<GSCRomanianMarketData> {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/seo/google-search-console?action=overview&days=30`,
      {
        cache: "no-store", // Always fetch fresh data
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch GSC data");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch GSC data:", error);
    // Return mock data for development
    return {
      totalClicks: 15420,
      totalImpressions: 284750,
      averageCTR: 5.42,
      averagePosition: 8.7,
      topKeywords: [
        {
          keyword: "jucării STEM România",
          position: 2,
          clicks: 1250,
          impressions: 8750,
          ctr: 14.29,
          url: "https://techtots.ro/categorii/jucarii-stem-romania",
          lastUpdated: new Date().toISOString(),
        },
        {
          keyword: "educație STEM copii",
          position: 1,
          clicks: 980,
          impressions: 6200,
          ctr: 15.81,
          url: "https://techtots.ro/blog/educatie-stem-copii-2025",
          lastUpdated: new Date().toISOString(),
        },
        {
          keyword: "jucării matematice",
          position: 3,
          clicks: 756,
          impressions: 5420,
          ctr: 13.95,
          url: "https://techtots.ro/categorii/jucarii-matematice",
          lastUpdated: new Date().toISOString(),
        },
      ],
      romanianKeywords: [],
      competitorKeywords: [],
      viralKeywords: [],
    };
  }
}

function GSCDataSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function GSCOverviewCards({ data }: { data: GSCRomanianMarketData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          <MousePointer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.totalClicks.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Last 30 days in Romania
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Impressions
          </CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.totalImpressions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Romanian search results
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.averageCTR.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Click-through rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Position
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.averagePosition.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            Search ranking position
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TopKeywordsTable({
  keywords,
}: {
  keywords: GSCRomanianMarketData["topKeywords"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Keywords</CardTitle>
        <CardDescription>
          Romanian keywords with highest clicks and impressions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {keywords.slice(0, 10).map((keyword, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{keyword.keyword}</div>
                <div className="text-sm text-muted-foreground truncate max-w-md">
                  {keyword.url}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{keyword.position}</div>
                  <div className="text-muted-foreground">Position</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{keyword.clicks}</div>
                  <div className="text-muted-foreground">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{keyword.ctr.toFixed(1)}%</div>
                  <div className="text-muted-foreground">CTR</div>
                </div>
                <Badge
                  variant={
                    keyword.position <= 3
                      ? "default"
                      : keyword.position <= 10
                        ? "secondary"
                        : "outline"
                  }
                >
                  {keyword.position <= 3
                    ? "Top 3"
                    : keyword.position <= 10
                      ? "Top 10"
                      : "Top 20+"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ViralKeywordsAnalysis({ data }: { data: GSCRomanianMarketData }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Viral Keywords
          </CardTitle>
          <CardDescription>
            High-engagement keywords (CTR &gt;5% &amp; Position &lt;=10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.viralKeywords.slice(0, 5).map((keyword, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm font-medium truncate max-w-48">
                  {keyword.keyword}
                </span>
                <Badge variant="secondary">{keyword.ctr.toFixed(1)}% CTR</Badge>
              </div>
            ))}
            {data.viralKeywords.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No viral keywords detected yet. Keep optimizing content!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Romanian STEM Keywords
          </CardTitle>
          <CardDescription>
            Keywords specifically targeting Romanian STEM market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.romanianKeywords.slice(0, 5).map((keyword, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm font-medium truncate max-w-48">
                  {keyword.keyword}
                </span>
                <div className="text-xs text-muted-foreground">
                  Pos: {keyword.position}
                </div>
              </div>
            ))}
            {data.romanianKeywords.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No Romanian STEM keywords tracked yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function GoogleSearchConsolePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Google Search Console
          </h1>
          <p className="text-muted-foreground">
            Monitor Romanian SEO performance and keyword rankings for market
            domination
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Google Search Console integration is in development mode. Connect your
          GSC account for live Romanian SEO data.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<GSCDataSkeleton />}>
        <GSCDashboardContent />
      </Suspense>
    </div>
  );
}

async function GSCDashboardContent() {
  const data = await getGSCData();

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="keywords">Keywords</TabsTrigger>
        <TabsTrigger value="viral">Viral Analysis</TabsTrigger>
        <TabsTrigger value="competitors">Competitors</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <GSCOverviewCards data={data} />

        <Card>
          <CardHeader>
            <CardTitle>Romanian Market Performance</CardTitle>
            <CardDescription>
              SEO metrics specifically for Romanian search traffic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(((data.averageCTR - 3.5) / 3.5) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Above average CTR for Romanian market
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.averagePosition <= 5
                    ? "Excellent"
                    : data.averagePosition <= 10
                      ? "Good"
                      : "Needs Work"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ranking performance
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.topKeywords.filter(k => k.position <= 3).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Keywords in top 3 positions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="keywords" className="space-y-6">
        <TopKeywordsTable keywords={data.topKeywords} />
      </TabsContent>

      <TabsContent value="viral" className="space-y-6">
        <ViralKeywordsAnalysis data={data} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Viral Content Success Metrics
            </CardTitle>
            <CardDescription>
              How your content performs against viral benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Viral Benchmarks</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Target CTR:</span>
                    <span
                      className={
                        data.averageCTR >= 5
                          ? "text-green-600 font-medium"
                          : "text-red-600"
                      }
                    >
                      {data.averageCTR >= 5 ? "✓" : "✗"} ≥5%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Position:</span>
                    <span
                      className={
                        data.averagePosition <= 10
                          ? "text-green-600 font-medium"
                          : "text-red-600"
                      }
                    >
                      {data.averagePosition <= 10 ? "✓" : "✗"} ≤10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Viral Keywords:</span>
                    <span
                      className={
                        data.viralKeywords.length >= 5
                          ? "text-green-600 font-medium"
                          : "text-yellow-600"
                      }
                    >
                      {data.viralKeywords.length}/5 found
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Romanian Market Fit</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Local Keywords:</span>
                    <span className="text-blue-600 font-medium">
                      {data.romanianKeywords.length} tracked
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Share:</span>
                    <span className="text-purple-600 font-medium">
                      {(
                        (data.romanianKeywords.length /
                          data.topKeywords.length) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth Potential:</span>
                    <span className="text-green-600 font-medium">High</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="competitors" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Competitor Analysis</CardTitle>
            <CardDescription>
              Keywords where competitors are ranking well
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.competitorKeywords.slice(0, 5).map((keyword, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{keyword.keyword}</div>
                    <div className="text-sm text-muted-foreground">
                      Position: {keyword.position} | Clicks: {keyword.clicks}
                    </div>
                  </div>
                  <Badge variant="destructive">Opportunity</Badge>
                </div>
              ))}
              {data.competitorKeywords.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No competitor keywords detected. Your SEO strategy is working
                  well!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
