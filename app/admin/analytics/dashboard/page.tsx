"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Activity,
  Eye,
  MousePointer,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
} from "lucide-react";

interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    totalRevenue: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  realtime: {
    activeUsersNow: number;
    pageViewsPerMinute: number;
    ordersPerHour: number;
    revenuePerHour: number;
  };
  segmentation: {
    segmentDistribution: Array<{
      segment: string;
      count: number;
      percentage: number;
    }>;
    lifecycleDistribution: Array<{
      stage: string;
      count: number;
      percentage: number;
    }>;
  };
  behavior: {
    topPages: Array<{
      page: string;
      views: number;
      bounceRate: number;
    }>;
    userJourney: {
      awareness: number;
      consideration: number;
      purchase: number;
      retention: number;
    };
    engagement: {
      avgSessionDuration: number;
      pagesPerSession: number;
      returnVisitorRate: number;
    };
  };
  performance: {
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
    throughput: number;
  };
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/analytics/dashboard");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates every 30 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Quick Navigation */}
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/admin/analytics"
            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics Hub
          </Link>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium">User Analytics</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time user behavior and engagement metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Live</span>
            </div>
            <Badge variant="outline">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/analytics">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Sales Analytics
              </CardTitle>
              <CardDescription>
                Revenue, orders, and business performance
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/analytics/segmentation">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                User Segmentation
              </CardTitle>
              <CardDescription>
                Automated user classification and analysis
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/customers">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer Management
              </CardTitle>
              <CardDescription>
                User profiles, roles, and account management
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/analytics/unit-economics">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Unit Economics
              </CardTitle>
              <CardDescription>
                Cost analysis and profitability insights
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.overview.totalUsers)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{metrics.overview.newUsersToday} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.overview.activeUsers)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(
                metrics.overview.activeUsers / metrics.overview.totalUsers
              )}{" "}
              of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.overview.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg order: {formatCurrency(metrics.overview.avgOrderValue)}
            </p>
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
              {formatPercentage(metrics.overview.conversionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Visitors to customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Real-time Activity
          </CardTitle>
          <CardDescription>
            Live metrics updated every 30 seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Now</p>
                <p className="text-2xl font-bold">
                  {metrics.realtime.activeUsersNow}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Page Views/min</p>
                <p className="text-2xl font-bold">
                  {metrics.realtime.pageViewsPerMinute}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Orders/hour</p>
                <p className="text-2xl font-bold">
                  {metrics.realtime.ordersPerHour}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Revenue/hour</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics.realtime.revenuePerHour)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="segmentation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segmentation">User Segmentation</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="performance">System Performance</TabsTrigger>
        </TabsList>

        {/* User Segmentation Tab */}
        <TabsContent value="segmentation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Segment Distribution</CardTitle>
                <CardDescription>
                  User distribution across segments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.segmentation.segmentDistribution.map(segment => (
                  <div
                    key={segment.segment}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{segment.segment}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(segment.count)} users
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={segment.percentage} className="w-20" />
                      <span className="text-sm font-medium w-12 text-right">
                        {formatPercentage(segment.percentage / 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Stages</CardTitle>
                <CardDescription>
                  User progression through lifecycle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.segmentation.lifecycleDistribution.map(stage => (
                  <div
                    key={stage.stage}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{stage.stage}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(stage.count)} users
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={stage.percentage} className="w-20" />
                      <span className="text-sm font-medium w-12 text-right">
                        {formatPercentage(stage.percentage / 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Session Duration</span>
                  <span className="font-medium">
                    {formatDuration(
                      metrics.behavior.engagement.avgSessionDuration
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pages per Session</span>
                  <span className="font-medium">
                    {metrics.behavior.engagement.pagesPerSession.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Return Visitor Rate</span>
                  <span className="font-medium">
                    {formatPercentage(
                      metrics.behavior.engagement.returnVisitorRate
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Journey</CardTitle>
                <CardDescription>Conversion funnel progression</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Awareness</span>
                    <span>
                      {formatNumber(metrics.behavior.userJourney.awareness)}
                    </span>
                  </div>
                  <Progress
                    value={
                      (metrics.behavior.userJourney.awareness /
                        metrics.overview.totalUsers) *
                      100
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Consideration</span>
                    <span>
                      {formatNumber(metrics.behavior.userJourney.consideration)}
                    </span>
                  </div>
                  <Progress
                    value={
                      (metrics.behavior.userJourney.consideration /
                        metrics.overview.totalUsers) *
                      100
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Purchase</span>
                    <span>
                      {formatNumber(metrics.behavior.userJourney.purchase)}
                    </span>
                  </div>
                  <Progress
                    value={
                      (metrics.behavior.userJourney.purchase /
                        metrics.overview.totalUsers) *
                      100
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Retention</span>
                    <span>
                      {formatNumber(metrics.behavior.userJourney.retention)}
                    </span>
                  </div>
                  <Progress
                    value={
                      (metrics.behavior.userJourney.retention /
                        metrics.overview.totalUsers) *
                      100
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.behavior.topPages.slice(0, 5).map((page, index) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm truncate max-w-32">
                        {page.page}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatNumber(page.views)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(page.bounceRate)} bounce
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  API Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.performance.apiResponseTime}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Error Rate
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.performance.errorRate)}
                </div>
                <p className="text-xs text-muted-foreground">API error rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Uptime
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.performance.uptime)}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Throughput
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.performance.throughput)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requests per minute
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                System performance over the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Performance charts will be displayed here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Integration with monitoring service in progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-blue-50"
            >
              Export User Data
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-green-50"
            >
              Run Segmentation
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-orange-50"
            >
              Generate Report
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-red-50">
              View Alerts
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
