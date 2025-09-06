"use client";

import {
  TrendingUp,
  MousePointer,
  FormInput,
  ShoppingCart,
  UserPlus,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  BarChart3,
  Users,
  Target,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/analytics-chart";

interface ConversionData {
  conversions: any[];
  statistics: {
    totalConversions: number;
    conversionRate: number;
    conversionsByType: Record<string, number>;
    conversionsByCategory: Record<string, number>;
    conversionsByAction: Record<string, number>;
    topPerformingElements: Array<{
      element: any;
      conversions: number;
      conversionRate: number;
    }>;
    userJourney: Array<{
      step: string;
      conversions: number;
      dropoffRate: number;
    }>;
    timeBasedAnalysis: {
      hourly: Record<string, number>;
      daily: Record<string, number>;
      weekly: Record<string, number>;
    };
    revenueImpact?: {
      totalRevenue: number;
      averageOrderValue: number;
      revenuePerConversion: number;
    };
  };
  summary: {
    dateRange: string;
    type: string;
    category: string;
    action: string;
    userId: string;
  };
}

interface ConversionDashboardProps {
  timeRange?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function ConversionDashboard({
  timeRange = "7d",
  autoRefresh = false,
  refreshInterval = 30000,
}: ConversionDashboardProps) {
  const [conversionData, setConversionData] = useState<ConversionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchConversionData = async (range: string = timeRange) => {
    try {
      setLoading(true);
      setError(null);

      const days =
        range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 7;
      const response = await fetch(
        `/api/analytics/conversions?days=${days}&limit=100`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setConversionData(data.data);
        setLastRefresh(new Date());
      } else {
        throw new Error(data.error || "Failed to fetch conversion data");
      }
    } catch (err: any) {
      console.error("Error fetching conversion data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchConversionData();
  };

  useEffect(() => {
    fetchConversionData();
  }, [timeRange]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchConversionData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, timeRange]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "click":
        return <MousePointer className="w-4 h-4" />;
      case "form_submit":
        return <FormInput className="w-4 h-4" />;
      case "purchase":
        return <ShoppingCart className="w-4 h-4" />;
      case "signup":
        return <UserPlus className="w-4 h-4" />;
      case "download":
        return <Download className="w-4 h-4" />;
      case "scroll":
        return <BarChart3 className="w-4 h-4" />;
      case "time_on_page":
        return <Clock className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "cta":
        return "bg-blue-100 text-blue-800";
      case "navigation":
        return "bg-green-100 text-green-800";
      case "form":
        return "bg-purple-100 text-purple-800";
      case "ecommerce":
        return "bg-orange-100 text-orange-800";
      case "engagement":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Conversion Dashboard
          </CardTitle>
          <CardDescription>Loading conversion data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Conversion Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Retrying..." : "Retry"}
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!conversionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Conversion Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No conversion data available</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { statistics, summary } = conversionData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Conversion Dashboard
          </h2>
          <p className="text-muted-foreground">
            {summary.dateRange} • {summary.category} • {summary.action}
            {lastRefresh && (
              <span className="ml-2 text-xs">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {autoRefresh && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              {loading ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <Wifi className="w-4 h-4 text-green-500" />
              )}
              <span>Auto-refresh</span>
            </div>
          )}
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Conversions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalConversions}
            </div>
            <p className="text-xs text-muted-foreground">{summary.dateRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(statistics.conversionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.conversionRate > 5 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Excellent
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Needs improvement
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Performing
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.topPerformingElements.length > 0
                ? statistics.topPerformingElements[0].conversions
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.topPerformingElements.length > 0
                ? statistics.topPerformingElements[0].element?.tagName ||
                  "Unknown"
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue Impact
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.revenueImpact
                ? formatCurrency(statistics.revenueImpact.totalRevenue)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.revenueImpact
                ? `AOV: ${formatCurrency(statistics.revenueImpact.averageOrderValue)}`
                : "No revenue data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="journey">User Journey</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="timing">Timing Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversions by Type</CardTitle>
                <CardDescription>
                  Distribution of conversions by interaction type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(statistics.conversionsByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type)}
                          <span className="capitalize">
                            {type.replace("_", " ")}
                          </span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversions by Category</CardTitle>
                <CardDescription>
                  Distribution of conversions by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(statistics.conversionsByCategory).map(
                    ([category, count]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize">{category}</span>
                        <Badge className={getCategoryColor(category)}>
                          {count}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journey" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Journey Analysis</CardTitle>
              <CardDescription>
                Conversion funnel and dropoff rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.userJourney.map((step, index) => (
                  <ProgressBar
                    key={step.step}
                    label={`${step.step.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())} (${step.conversions} conversions)`}
                    value={step.conversions}
                    max={statistics.totalConversions}
                    color={
                      index === 0
                        ? "#10B981"
                        : index === statistics.userJourney.length - 1
                          ? "#EF4444"
                          : "#3B82F6"
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Elements</CardTitle>
              <CardDescription>
                Best converting buttons, forms, and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.topPerformingElements.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No performance data available
                    </AlertDescription>
                  </Alert>
                ) : (
                  statistics.topPerformingElements.map((element, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {element.element?.tagName || "Unknown"} -{" "}
                            {element.element?.text || "No text"}
                          </span>
                        </div>
                        <Badge variant="secondary">{element.conversions}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={element.conversionRate}
                          className="flex-1 h-2"
                        />
                        <span className="text-sm text-muted-foreground">
                          {formatPercentage(element.conversionRate)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Distribution</CardTitle>
                <CardDescription>Conversions by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(statistics.timeBasedAnalysis.hourly)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([hour, count]) => (
                      <div
                        key={hour}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{hour}:00</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Distribution</CardTitle>
                <CardDescription>Conversions by day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(statistics.timeBasedAnalysis.daily)
                    .slice(-7) // Last 7 days
                    .map(([day, count]) => (
                      <div
                        key={day}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{day}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Distribution</CardTitle>
                <CardDescription>Conversions by week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(statistics.timeBasedAnalysis.weekly)
                    .slice(-4) // Last 4 weeks
                    .map(([week, count]) => (
                      <div
                        key={week}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{week}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
