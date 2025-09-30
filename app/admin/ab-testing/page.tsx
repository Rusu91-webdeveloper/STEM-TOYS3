/**
 * A/B Testing Dashboard for Viral Content Optimization
 *
 * Admin dashboard to create, monitor, and analyze A/B tests for Romanian
 * STEM content optimization, focusing on titles, CTAs, and viral elements
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
  BarChart3,
  Target,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  StopCircle,
} from "lucide-react";

// Import A/B testing service
import {
  abTestingService,
  ABTest,
  ABTestResult,
} from "@/lib/services/ab-testing-service";

async function getABTests(): Promise<{
  running: ABTest[];
  completed: ABTest[];
  results: ABTestResult[];
}> {
  try {
    const running = await abTestingService.getRunningTests();

    // Mock completed tests and results
    const completed: ABTest[] = [
      {
        id: "completed_title_test",
        name: "Title Variation Test - Completed",
        description: "Successfully identified winning title variation",
        type: "title",
        status: "completed",
        targetAudience: "romanian",
        variants: [],
        metrics: [],
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        winner: "viral_shock",
        confidence: 98.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const results: ABTestResult[] = [
      {
        test: completed[0],
        winner: {
          id: "viral_shock",
          name: "Viral - Shock Statistic",
          content: "ȘOC! De ce 8 din 10 Copii Români URĂSC Matematica?",
          weight: 25,
        },
        confidence: 98.5,
        improvement: 35.2,
        statisticalSignificance: true,
        recommendations: [
          "Implement the winning title variation across all STEM content",
          "Expected 35.2% improvement in click-through rates",
          "Continue testing other viral elements",
          "Consider combining winning title with other optimizations",
        ],
      },
    ];

    return { running, completed, results };
  } catch (error) {
    console.error("Failed to fetch A/B tests:", error);
    return { running: [], completed: [], results: [] };
  }
}

function TestsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TestCard({ test, result }: { test: ABTest; result?: ABTestResult }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "title":
        return "🎯";
      case "content":
        return "📝";
      case "call_to_action":
        return "📢";
      case "image":
        return "🖼️";
      case "structure":
        return "🏗️";
      default:
        return "🧪";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge className={getStatusColor(test.status)}>
            {test.status.toUpperCase()}
          </Badge>
          <span className="text-lg">{getTypeIcon(test.type)}</span>
        </div>
        <CardTitle className="text-lg">{test.name}</CardTitle>
        <CardDescription>{test.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">
              {test.type.replace("_", " ")}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Audience:</span>
            <span className="font-medium capitalize">
              {test.targetAudience.replace("_", " ")}
            </span>
          </div>

          {test.startDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Started:</span>
              <span className="font-medium">
                {test.startDate.toLocaleDateString("ro-RO")}
              </span>
            </div>
          )}

          {result && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Winner Found!
                </span>
              </div>
              <div className="text-sm text-green-700">
                <div>Winner: {result.winner.name}</div>
                <div>Improvement: +{result.improvement.toFixed(1)}%</div>
                <div>Confidence: {result.confidence.toFixed(1)}%</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {test.status === "running" && (
              <>
                <Button size="sm" variant="outline">
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
                <Button size="sm" variant="outline">
                  <StopCircle className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </>
            )}
            {test.status === "paused" && (
              <Button size="sm">
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
            )}
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TestResultsCard({ result }: { result: ABTestResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          {result.test.name}
        </CardTitle>
        <CardDescription>
          Test completed with statistical significance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{result.improvement.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Improvement</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {result.confidence.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Confidence</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {result.statisticalSignificance ? "Yes" : "No"}
              </div>
              <p className="text-sm text-muted-foreground">Significant</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Winning Variant</h4>
            <p className="text-green-700 font-medium">
              {result.winner.content}
            </p>
            <p className="text-sm text-green-600 mt-1">{result.winner.name}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Recommendations</h4>
            <ul className="space-y-1 text-sm">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTestSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New A/B Test
        </CardTitle>
        <CardDescription>
          Start optimizing your Romanian STEM content with data-driven testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button className="h-20 flex-col gap-2" variant="outline">
            <span className="text-lg">🎯</span>
            <span>Title Test</span>
          </Button>
          <Button className="h-20 flex-col gap-2" variant="outline">
            <span className="text-lg">📢</span>
            <span>CTA Test</span>
          </Button>
          <Button className="h-20 flex-col gap-2" variant="outline">
            <span className="text-lg">📝</span>
            <span>Content Test</span>
          </Button>
          <Button className="h-20 flex-col gap-2" variant="outline">
            <span className="text-lg">🖼️</span>
            <span>Image Test</span>
          </Button>
          <Button className="h-20 flex-col gap-2" variant="outline">
            <span className="text-lg">🏗️</span>
            <span>Structure Test</span>
          </Button>
          <Button className="h-20 flex-col gap-2" variant="outline">
            <span className="text-lg">⚡</span>
            <span>Custom Test</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ABTestingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
          <p className="text-muted-foreground">
            Optimize Romanian STEM content with data-driven A/B testing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Results
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          A/B testing helps identify the most effective content variations for
          Romanian audiences. Focus on high-impact elements like titles and
          calls-to-action.
        </AlertDescription>
      </Alert>

      <CreateTestSection />

      <Suspense fallback={<TestsSkeleton />}>
        <ABTestingContent />
      </Suspense>
    </div>
  );
}

async function ABTestingContent() {
  const { running, completed, results } = await getABTests();

  return (
    <Tabs defaultValue="running" className="space-y-6">
      <TabsList>
        <TabsTrigger value="running">
          Running Tests ({running.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completed.length})
        </TabsTrigger>
        <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="running" className="space-y-6">
        {running.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Running Tests</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start optimizing your content by creating your first A/B test
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {running.map(test => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-6">
        {completed.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Completed Tests</h3>
              <p className="text-muted-foreground text-center">
                Completed tests with results will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completed.map(test => {
              const result = results.find(r => r.test.id === test.id);
              return <TestCard key={test.id} test={test} result={result} />;
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="results" className="space-y-6">
        {results.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Test Results</h3>
              <p className="text-muted-foreground text-center">
                Detailed results from completed A/B tests will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {results.map(result => (
              <TestResultsCard key={result.test.id} result={result} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
