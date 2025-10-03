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
} from "lucide-react";
import { ABTestActions } from "@/components/admin/ABTestActions";
import { CreateTestSection } from "@/components/admin/CreateTestSection";

// Import A/B testing service
import {
  ABTestingService,
  ABTestWithVariants,
  ABTestResultWithDetails,
} from "@/lib/services/ab-testing-service";

async function getABTests(): Promise<{
  running: ABTestWithVariants[];
  completed: ABTestWithVariants[];
  results: ABTestResultWithDetails[];
}> {
  try {
    const running = await ABTestingService.getRunningTests();
    const completed = await ABTestingService.getCompletedTests();

    // Get results for completed tests
    const results: ABTestResultWithDetails[] = [];
    for (const test of completed) {
      if (test.results) {
        const result = await ABTestingService.getTestResults(test.id);
        if (result) {
          results.push(result);
        }
      }
    }

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

function TestCard({
  test,
  result,
}: {
  test: ABTestWithVariants;
  result?: ABTestResultWithDetails;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "TITLE":
        return "🎯";
      case "CONTENT":
        return "📝";
      case "CALL_TO_ACTION":
        return "📢";
      case "IMAGE":
        return "🖼️";
      case "STRUCTURE":
        return "🏗️";
      case "LAYOUT":
        return "📐";
      case "PRICING":
        return "💰";
      case "CUSTOM":
        return "⚙️";
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
                <div>
                  Winner:{" "}
                  {test.variants.find(v => v.id === result.winnerVariantId)
                    ?.name || "Unknown"}
                </div>
                <div>Improvement: +{result.improvement.toFixed(1)}%</div>
                <div>Confidence: {result.confidence.toFixed(1)}%</div>
              </div>
            </div>
          )}

          <ABTestActions test={test} />
        </div>
      </CardContent>
    </Card>
  );
}

function TestResultsCard({ result }: { result: ABTestResultWithDetails }) {
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
            {(() => {
              const winnerVariant = result.test.variants.find(
                v => v.id === result.winnerVariantId
              );
              return (
                <>
                  <p className="text-green-700 font-medium">
                    {winnerVariant?.content || "Unknown variant"}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {winnerVariant?.name || "Unknown"}
                  </p>
                </>
              );
            })()}
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
