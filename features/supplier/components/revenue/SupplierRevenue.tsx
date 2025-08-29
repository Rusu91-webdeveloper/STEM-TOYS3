"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Download,
  Calendar,
  Target,
  Activity,
  Sparkles,
  Zap,
  Award,
  Globe,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  RefreshCw,
} from "lucide-react";

type RevenueData = {
  totalRevenue: number;
  monthlyRevenue: number;
  commissionEarned: number;
  pendingPayouts: number;
  revenueGrowth: number;
  averageOrderValue: number;
  totalOrders: number;
  series: Array<{
    month: string;
    revenue: number;
    commission: number;
    orders: number;
    customers: number;
  }>;
  breakdown: {
    byProduct: Array<{
      productId: string;
      name: string;
      revenue: number;
      percentage: number;
    }>;
    byCategory: Array<{
      category: string;
      revenue: number;
      percentage: number;
    }>;
    byPeriod: Array<{
      period: string;
      revenue: number;
      growth: number;
    }>;
  };
};

type TimeRange = "7d" | "30d" | "90d" | "1y";

export function SupplierRevenue() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/supplier/revenue?period=${timeRange}`);

      if (!response.ok) {
        throw new Error("Failed to fetch revenue data");
      }

      const data = await response.json();
      setRevenueData(data);
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const exportRevenueReport = async () => {
    try {
      const response = await fetch("/api/supplier/revenue/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeRange, includeCharts: true }),
      });

      if (!response.ok) throw new Error("Failed to export report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `supplier-revenue-${timeRange}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting report:", err);
      setError("Failed to export report");
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return "$0.00";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null) {
      return "0.0%";
    }
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-green-400 animate-ping"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading revenue data...</p>
          <p className="text-sm text-gray-500 mt-2">
            Preparing your financial insights
          </p>
        </div>
      </div>
    );
  }

  if (error || !revenueData) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load revenue data"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Revenue
          </h1>
        </div>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
          Track your earnings, commissions, and revenue growth over time.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onValueChange={(value: TimeRange) => setTimeRange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRevenueData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        <Button
          onClick={exportRevenueReport}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Main Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(revenueData.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {revenueData.revenueGrowth >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  revenueData.revenueGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatPercentage(revenueData.revenueGrowth)}
              </span>
              <span className="text-sm text-gray-500">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(revenueData.monthlyRevenue)}
            </div>
            <p className="text-sm text-gray-600 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Commission Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(revenueData.commissionEarned)}
            </div>
            <p className="text-sm text-gray-600 mt-2">Your earnings</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(revenueData.pendingPayouts)}
            </div>
            <p className="text-sm text-gray-600 mt-2">Next payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Detailed Views */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>
                  Key metrics and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="font-semibold">
                    {revenueData.totalOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Average Order Value
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(revenueData.averageOrderValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commission Rate</span>
                  <span className="font-semibold">15%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Revenue per Order
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(
                      revenueData.totalOrders && revenueData.totalOrders > 0
                        ? revenueData.totalRevenue / revenueData.totalOrders
                        : 0
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
                <CardDescription>
                  Your business performance highlights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Revenue Growth
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {formatPercentage(revenueData.revenueGrowth)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Commission Rate
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    15%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                      Payout Schedule
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800"
                  >
                    Monthly
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Revenue by Product
                </CardTitle>
                <CardDescription>
                  Top performing products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData.breakdown.byProduct
                    .slice(0, 5)
                    .map((product, index) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(product.percentage || 0).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-sm">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue by Category
                </CardTitle>
                <CardDescription>
                  Performance across product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData.breakdown.byCategory.map((category, index) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {category.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(category.percentage || 0).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">
                        {formatCurrency(category.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Revenue Trends
              </CardTitle>
              <CardDescription>
                Monthly revenue performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.series.map((point, index) => (
                  <div
                    key={point.month}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{point.month}</p>
                        <p className="text-sm text-gray-500">
                          {point.orders} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(point.revenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(point.commission)} commission
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  Actionable insights for your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">
                        Revenue Growth
                      </p>
                      <p className="text-sm text-green-700">
                        Your revenue has grown by{" "}
                        {formatPercentage(revenueData.revenueGrowth)} this
                        period.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">
                        Commission Earnings
                      </p>
                      <p className="text-sm text-blue-700">
                        You've earned{" "}
                        {formatCurrency(revenueData.commissionEarned)} in
                        commissions.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-800">Performance</p>
                      <p className="text-sm text-purple-700">
                        Average order value:{" "}
                        {formatCurrency(revenueData.averageOrderValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Suggestions to improve your revenue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Focus on Top Products
                      </p>
                      <p className="text-sm text-amber-700">
                        Consider expanding your top-performing product lines.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-start gap-2">
                    <Filter className="w-4 h-4 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-indigo-800">
                        Optimize Pricing
                      </p>
                      <p className="text-sm text-indigo-700">
                        Review pricing strategies for better margins.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-800">
                        Seasonal Planning
                      </p>
                      <p className="text-sm text-emerald-700">
                        Plan inventory for upcoming seasonal trends.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
