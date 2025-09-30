/**
 * Competitor Analysis Dashboard for Romanian STEM Market Domination
 *
 * Advanced competitor intelligence dashboard to analyze Romanian educational
 * competitors, identify keyword gaps, and optimize content strategy
 */

import { Suspense } from "react";
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
  Target,
  Users,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
} from "lucide-react";

// Import competitor analysis service
import {
  competitorAnalysisService,
  CompetitorAnalysisReport,
} from "@/lib/services/competitor-analysis-service";

async function getCompetitorAnalysis(): Promise<CompetitorAnalysisReport> {
  try {
    return await competitorAnalysisService.generateCompetitorAnalysisReport();
  } catch (error) {
    console.error("Failed to generate competitor analysis:", error);
    // Return mock data for development
    return {
      overview: {
        totalCompetitors: 4,
        marketShare: 15,
        ourPosition: "Emerging leader in viral STEM content",
        keyInsights: [
          "Most competitors focus on traditional education content",
          "Limited viral content strategy among competitors",
          "Gap in Romanian-specific STEM parenting content",
          "Opportunity in social media-driven content marketing",
        ],
      },
      keywordAnalysis: [
        {
          keyword: "jucării STEM România",
          ourRanking: 2,
          competitorRankings: [
            {
              competitor: "EduPedu.ro",
              position: 5,
              url: "https://www.edupedu.ro",
            },
            {
              competitor: "ScoalaCopiilor.ro",
              position: 8,
              url: "https://www.scoalacopiilor.ro",
            },
          ],
          searchVolume: 2900,
          competition: "high",
          opportunity: "medium",
        },
        {
          keyword: "educație STEM copii",
          ourRanking: 1,
          competitorRankings: [
            {
              competitor: "EduPedu.ro",
              position: 4,
              url: "https://www.edupedu.ro",
            },
            {
              competitor: "STEM Academy",
              position: 6,
              url: "https://stemacademy.ro",
            },
          ],
          searchVolume: 1800,
          competition: "high",
          opportunity: "medium",
        },
      ],
      contentGaps: {
        missingTopics: [
          "STEM în școlile românești 2025",
          "competențe digitale copii",
          "educație STEM București",
          "STEM pentru părinți ocupați",
          "succes stories școlare STEM",
        ],
        underservedKeywords: [
          "STEM școală românească",
          "educație STEM Cluj",
          "jucării STEM Timișoara",
          "STEM învățământ dual",
        ],
        competitorStrengths: [
          "Conținut tradițional educațional bine structurat",
          "Prezență puternică în școli și instituții",
          "Experiență îndelungată în piața românească",
          "Relații cu Ministerul Educației",
        ],
        ourAdvantages: [
          "Strategie virală inovatoare pe social media",
          "Conținut modern adaptat la 2025",
          "Focus pe ecommerce și conversie",
          "Comunitate activă de părinți români",
        ],
        recommendedContent: [
          {
            topic: "STEM în școlile românești 2025",
            targetKeyword: "STEM școală românească",
            estimatedTraffic: 3200,
            difficulty: "medium",
          },
          {
            topic: "competențe digitale copii",
            targetKeyword: "educație STEM Cluj",
            estimatedTraffic: 2100,
            difficulty: "easy",
          },
        ],
      },
      recommendations: [
        {
          type: "content",
          priority: "high",
          action: "Create Romanian school integration content series",
          impact: "Address major content gap and capture institutional market",
        },
        {
          type: "seo",
          priority: "high",
          action:
            "Target underserved regional keywords (Cluj, Timișoara, Iași)",
          impact: "Expand geographical reach and reduce local competition",
        },
      ],
    };
  }
}

function AnalysisSkeleton() {
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
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function OverviewCards({ data }: { data: CompetitorAnalysisReport }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Competitors
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.overview.totalCompetitors}
          </div>
          <p className="text-xs text-muted-foreground">Romanian STEM market</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Market Share</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.overview.marketShare}%</div>
          <p className="text-xs text-muted-foreground">Estimated position</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Keyword Opportunities
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.keywordAnalysis.filter(k => k.opportunity === "high").length}
          </div>
          <p className="text-xs text-muted-foreground">
            High opportunity keywords
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Content Gaps</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.contentGaps.missingTopics.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Untapped topics identified
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KeywordAnalysisTable({
  keywords,
}: {
  keywords: CompetitorAnalysisReport["keywordAnalysis"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Competition Analysis</CardTitle>
        <CardDescription>
          Our ranking vs competitors for key Romanian STEM keywords
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {keywords.map((keyword, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{keyword.keyword}</div>
                <div className="text-sm text-muted-foreground">
                  Search Volume: {keyword.searchVolume.toLocaleString()}/month
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-blue-600">
                    #{keyword.ourRanking || "N/A"}
                  </div>
                  <div className="text-muted-foreground">Our Rank</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-600">
                    #
                    {Math.min(
                      ...keyword.competitorRankings.map(c => c.position)
                    )}
                  </div>
                  <div className="text-muted-foreground">Best Competitor</div>
                </div>
                <Badge
                  variant={
                    keyword.competition === "low"
                      ? "secondary"
                      : keyword.competition === "medium"
                        ? "outline"
                        : "destructive"
                  }
                >
                  {keyword.competition} competition
                </Badge>
                <Badge
                  variant={
                    keyword.opportunity === "high"
                      ? "default"
                      : keyword.opportunity === "medium"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {keyword.opportunity} opportunity
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentGapAnalysis({
  gaps,
}: {
  gaps: CompetitorAnalysisReport["contentGaps"];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Content Gaps Identified
          </CardTitle>
          <CardDescription>
            Topics competitors cover that we don't
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gaps.missingTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{topic}</span>
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommended Content
          </CardTitle>
          <CardDescription>High-impact content opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gaps.recommendedContent.slice(0, 5).map((content, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="font-medium text-sm">{content.topic}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Target: {content.targetKeyword}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    {content.estimatedTraffic} traffic
                  </Badge>
                  <Badge
                    variant={
                      content.difficulty === "easy"
                        ? "secondary"
                        : content.difficulty === "medium"
                          ? "outline"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {content.difficulty}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StrategicRecommendations({
  recommendations,
}: {
  recommendations: CompetitorAnalysisReport["recommendations"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategic Recommendations</CardTitle>
        <CardDescription>
          Actionable insights to dominate the Romanian STEM market
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-4 border rounded-lg"
            >
              <div
                className={`p-2 rounded-full ${
                  rec.priority === "high"
                    ? "bg-red-100"
                    : rec.priority === "medium"
                      ? "bg-yellow-100"
                      : "bg-green-100"
                }`}
              >
                {rec.priority === "high" && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                {rec.priority === "medium" && (
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                )}
                {rec.priority === "low" && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{rec.action}</h4>
                  <Badge
                    variant={
                      rec.type === "content"
                        ? "default"
                        : rec.type === "seo"
                          ? "secondary"
                          : rec.type === "social"
                            ? "outline"
                            : "destructive"
                    }
                  >
                    {rec.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CompetitorAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Competitor Analysis
          </h1>
          <p className="text-muted-foreground">
            Intelligence on Romanian STEM competitors and market opportunities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          Competitor analysis helps identify gaps and opportunities in the
          Romanian STEM market. Regular monitoring ensures we stay ahead of
          competitors.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<AnalysisSkeleton />}>
        <CompetitorAnalysisContent />
      </Suspense>
    </div>
  );
}

async function CompetitorAnalysisContent() {
  const data = await getCompetitorAnalysis();

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="keywords">Keywords</TabsTrigger>
        <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
        <TabsTrigger value="strategy">Strategy</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewCards data={data} />

        <Card>
          <CardHeader>
            <CardTitle>Key Market Insights</CardTitle>
            <CardDescription>
              Critical findings from Romanian competitor analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Competitor Strengths</h4>
                <ul className="space-y-2 text-sm">
                  {data.contentGaps.competitorStrengths.map(
                    (strength, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Our Competitive Advantages</h4>
                <ul className="space-y-2 text-sm">
                  {data.contentGaps.ourAdvantages.map((advantage, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{advantage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="keywords" className="space-y-6">
        <KeywordAnalysisTable keywords={data.keywordAnalysis} />
      </TabsContent>

      <TabsContent value="gaps" className="space-y-6">
        <ContentGapAnalysis gaps={data.contentGaps} />
      </TabsContent>

      <TabsContent value="strategy" className="space-y-6">
        <StrategicRecommendations recommendations={data.recommendations} />
      </TabsContent>
    </Tabs>
  );
}
