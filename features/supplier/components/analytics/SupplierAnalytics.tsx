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
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Download,
  Calendar,
  Target,
  Activity,
} from "lucide-react";

type StatsResponse = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  commissionEarned: number;
  pendingInvoices: number;
  revenueSeries?: Array<{ date: string; revenue: number }>;
  performanceMetrics?: {
    conversionRate: number;
    averageOrderValue: number;
    customerRetentionRate: number;
    productPerformance: Array<{
      productId: string;
      name: string;
      sales: number;
      revenue: number;
      rating: number;
    }>;
    topCategories: Array<{
      category: string;
      sales: number;
      revenue: number;
    }>;
    customerSegments: Array<{
      segment: string;
      count: number;
      revenue: number;
    }>;
  };
};

type RevenueSeriesPoint = {
  month: string;
  revenue: number;
  commission: number;
  orders: number;
  customers: number;
};

type TimeRange = "7d" | "30d" | "90d" | "1y";

export function SupplierAnalytics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<
    RevenueSeriesPoint[] | null
  >(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch comprehensive stats with performance metrics
      const res = await fetch(`/api/supplier/stats?period=${timeRange}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to load analytics");
      }
      const data = (await res.json()) as StatsResponse;
      setStats(data);

      // Fetch detailed revenue series
      const r = await fetch(`/api/supplier/revenue?period=${timeRange}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const rs = (await r.json()) as { series: RevenueSeriesPoint[] };
        setRevenueSeries(rs.series);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch("/api/supplier/analytics/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeRange, includeCharts: true }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `supplier-analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load analytics"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Advanced Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your business performance and customer
            behavior.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button onClick={generateReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={`€${stats.totalRevenue.toLocaleString()}`}
              description="All-time supplier revenue"
              icon={DollarSign}
              trend={stats.monthlyRevenue > 0 ? "up" : "down"}
              trendValue={`${((stats.monthlyRevenue / Math.max(stats.totalRevenue, 1)) * 100).toFixed(1)}%`}
            />
            <MetricCard
              title="Monthly Revenue"
              value={`€${stats.monthlyRevenue.toLocaleString()}`}
              description="Revenue this month"
              icon={TrendingUp}
              trend="up"
              trendValue="vs last month"
            />
            <MetricCard
              title="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              description="All-time orders"
              icon={ShoppingCart}
              trend="up"
              trendValue="vs last period"
            />
            <MetricCard
              title="Commission Earned"
              value={`€${stats.commissionEarned.toLocaleString()}`}
              description="All-time commission"
              icon={Target}
              trend="up"
              trendValue="15% rate"
            />
          </div>

          {/* Performance Metrics */}
          {stats.performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Conversion Rate
                  </CardTitle>
                  <CardDescription>Orders per visitor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.performanceMetrics.conversionRate.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Industry average: 2.5%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Average Order Value
                  </CardTitle>
                  <CardDescription>Revenue per order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    €{stats.performanceMetrics.averageOrderValue.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {stats.totalOrders > 0
                      ? `${stats.totalOrders} orders`
                      : "No orders yet"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Customer Retention
                  </CardTitle>
                  <CardDescription>Returning customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.performanceMetrics.customerRetentionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Excellent retention rate
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Revenue Charts */}
          {revenueSeries && revenueSeries.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <RevenueTrendChart data={revenueSeries} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Commission</CardTitle>
                  <CardDescription>Monthly comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <RevenueCommissionChart data={revenueSeries} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>
                  This period vs previous period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceComparisonChart data={revenueSeries} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>
                  Growth patterns and predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendAnalysisChart data={revenueSeries} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          {stats.performanceMetrics?.customerSegments && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                  <CardDescription>Revenue by customer type</CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomerSegmentsChart
                    data={stats.performanceMetrics.customerSegments}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Behavior Insights</CardTitle>
                  <CardDescription>Key behavioral patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomerBehaviorInsights data={stats.performanceMetrics} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {stats.performanceMetrics?.productPerformance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                  <CardDescription>
                    Revenue and sales by product
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TopProductsChart
                    data={stats.performanceMetrics.productPerformance}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Sales by product category</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryPerformanceChart
                    data={stats.performanceMetrics.topCategories}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Enhanced Metric Card Component
function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span
              className={`text-xs ${trend === "up" ? "text-green-600" : "text-red-600"}`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Chart Components (simplified SVG implementations)
function RevenueTrendChart({ data }: { data: RevenueSeriesPoint[] }) {
  if (!data || data.length === 0)
    return <div className="text-center text-gray-500">No data available</div>;

  const width = 600;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: height - padding - (d.revenue / maxRevenue) * chartHeight,
  }));

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <svg width={width} height={height} className="w-full h-full">
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
      ))}
    </svg>
  );
}

function RevenueCommissionChart({ data }: { data: RevenueSeriesPoint[] }) {
  if (!data || data.length === 0)
    return <div className="text-center text-gray-500">No data available</div>;

  return (
    <div className="space-y-2">
      {data.slice(-6).map((item, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{item.month}</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">€{item.revenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm">
                €{item.commission.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceComparisonChart({ data }: { data: RevenueSeriesPoint[] }) {
  if (!data || data.length < 2)
    return (
      <div className="text-center text-gray-500">
        Insufficient data for comparison
      </div>
    );

  const currentPeriod = data.slice(-3).reduce((sum, d) => sum + d.revenue, 0);
  const previousPeriod = data
    .slice(-6, -3)
    .reduce((sum, d) => sum + d.revenue, 0);
  const change =
    ((currentPeriod - previousPeriod) / Math.max(previousPeriod, 1)) * 100;

  return (
    <div className="text-center space-y-4">
      <div className="text-4xl font-bold text-blue-600">
        €{currentPeriod.toLocaleString()}
      </div>
      <div className="text-lg text-gray-600">Current Period</div>
      <div
        className={`text-lg font-semibold ${change >= 0 ? "text-green-600" : "text-red-600"}`}
      >
        {change >= 0 ? "+" : ""}
        {change.toFixed(1)}% vs Previous
      </div>
    </div>
  );
}

function TrendAnalysisChart({ data }: { data: RevenueSeriesPoint[] }) {
  if (!data || data.length < 3)
    return (
      <div className="text-center text-gray-500">
        Insufficient data for trend analysis
      </div>
    );

  const recent = data.slice(-3);
  const trend =
    recent[recent.length - 1].revenue > recent[0].revenue ? "up" : "down";

  return (
    <div className="text-center space-y-4">
      <div
        className={`text-4xl ${trend === "up" ? "text-green-600" : "text-red-600"}`}
      >
        {trend === "up" ? "↗" : "↘"}
      </div>
      <div className="text-lg font-semibold">
        {trend === "up" ? "Growing" : "Declining"} Trend
      </div>
      <div className="text-sm text-gray-600">Based on last 3 periods</div>
    </div>
  );
}

function CustomerSegmentsChart({
  data,
}: {
  data: Array<{ segment: string; count: number; revenue: number }>;
}) {
  return (
    <div className="space-y-3">
      {data.map((segment, i) => (
        <div key={i} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{segment.segment}</div>
            <div className="text-sm text-gray-500">
              {segment.count} customers
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              €{segment.revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {(
                (segment.revenue /
                  data.reduce((sum, s) => sum + s.revenue, 0)) *
                100
              ).toFixed(1)}
              %
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerBehaviorInsights({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 rounded-lg">
        <div className="font-medium text-blue-900">High Conversion Rate</div>
        <div className="text-sm text-blue-700">
          Your {data.conversionRate.toFixed(2)}% conversion rate is above
          industry average
        </div>
      </div>
      <div className="p-3 bg-green-50 rounded-lg">
        <div className="font-medium text-green-900">Strong Retention</div>
        <div className="text-sm text-green-700">
          {data.customerRetentionRate.toFixed(1)}% of customers return for more
          purchases
        </div>
      </div>
      <div className="p-3 bg-purple-50 rounded-lg">
        <div className="font-medium text-purple-900">Healthy AOV</div>
        <div className="text-sm text-purple-700">
          €{data.averageOrderValue.toFixed(2)} average order value indicates
          good product mix
        </div>
      </div>
    </div>
  );
}

function TopProductsChart({
  data,
}: {
  data: Array<{ name: string; sales: number; revenue: number; rating: number }>;
}) {
  const topProducts = data.slice(0, 5);

  return (
    <div className="space-y-3">
      {topProducts.map((product, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-2 bg-gray-50 rounded"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
              {i + 1}
            </div>
            <div>
              <div className="font-medium truncate max-w-32">
                {product.name}
              </div>
              <div className="text-sm text-gray-500">{product.sales} sales</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              €{product.revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              ★ {product.rating.toFixed(1)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryPerformanceChart({
  data,
}: {
  data: Array<{ category: string; sales: number; revenue: number }>;
}) {
  return (
    <div className="space-y-3">
      {data.map((category, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500"][i % 5]}`}
            ></div>
            <span className="font-medium">{category.category}</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              €{category.revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">{category.sales} sales</div>
          </div>
        </div>
      ))}
    </div>
  );
}
