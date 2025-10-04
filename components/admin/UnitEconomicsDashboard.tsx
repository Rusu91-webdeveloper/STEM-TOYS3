"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Calculator,
  Target,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UnitEconomicsSummary,
  ProductProfitability,
  UnitEconomicsRequest,
} from "@/lib/validations/unit-economics";

interface UnitEconomicsDashboardProps {
  data?: {
    summary: UnitEconomicsSummary;
    products: ProductProfitability[];
  };
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function UnitEconomicsDashboard({
  data: propData,
  isLoading: propIsLoading = false,
  onRefresh: propOnRefresh,
}: UnitEconomicsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<{
    summary: UnitEconomicsSummary;
    products: ProductProfitability[];
  } | null>(propData || null);
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [error, setError] = useState<string | null>(null);

  // Fetch unit economics data
  const fetchUnitEconomicsData = async (range: string = timeRange) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/analytics/unit-economics?timeRange=${range}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch unit economics data");
      }
    } catch (err: any) {
      console.error("Error fetching unit economics data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (propOnRefresh) {
      propOnRefresh();
    } else {
      fetchUnitEconomicsData();
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    fetchUnitEconomicsData(newRange);
  };

  // Initial data fetch
  useEffect(() => {
    if (!propData && !propIsLoading) {
      fetchUnitEconomicsData();
    }
  }, []);

  // Update data when props change
  useEffect(() => {
    if (propData) {
      setData(propData);
    }
  }, [propData]);

  useEffect(() => {
    setIsLoading(propIsLoading);
  }, [propIsLoading]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("ro-RO").format(num);

  const formatPercentage = (num: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num / 100);

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getRiskBadge = (riskLevel: "LOW" | "MEDIUM" | "HIGH") => {
    switch (riskLevel) {
      case "LOW":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Low Risk
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Medium Risk
          </Badge>
        );
      case "HIGH":
        return <Badge variant="destructive">High Risk</Badge>;
    }
  };

  const renderMetricCard = (
    title: string,
    value: string,
    description?: string,
    icon?: React.ReactNode
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => {
    if (!data) return null;

    const { summary } = data;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMetricCard(
            "Total Monthly Revenue",
            formatCurrency(summary.totalMonthlyRevenue),
            "Revenue from all products",
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Total Monthly Profit",
            formatCurrency(summary.totalMonthlyProfit),
            `Margin: ${formatPercentage(summary.overallProfitMargin)}`,
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Profitable Products",
            `${summary.profitableProducts}/${summary.totalProducts}`,
            `${formatPercentage((summary.profitableProducts / summary.totalProducts) * 100)} of products`,
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Average LTV/CAC Ratio",
            summary.averageLtvToCacRatio.toFixed(1),
            "Higher is better",
            <Target className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Profitability Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profitability Overview</CardTitle>
              <CardDescription>
                Key financial metrics for your product portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Overall Profit Margin
                </span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(summary.overallProfitMargin)}
                  <span className="font-bold">
                    {formatPercentage(summary.overallProfitMargin)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Order Value</span>
                <span className="font-bold">
                  {formatCurrency(summary.averageOrderValue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Customer Acquisition Cost
                </span>
                <span className="font-bold">
                  {formatCurrency(summary.averageCustomerAcquisitionCost)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Customer Lifetime Value
                </span>
                <span className="font-bold">
                  {formatCurrency(summary.averageLifetimeValue)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Best and worst performing products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary.mostProfitableProduct && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Most Profitable</span>
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      {formatPercentage(
                        summary.mostProfitableProduct.profitMargin
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {summary.mostProfitableProduct.name}
                  </p>
                </div>
              )}

              {summary.leastProfitableProduct && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Least Profitable
                    </span>
                    <Badge variant="destructive">
                      {formatPercentage(
                        summary.leastProfitableProduct.profitMargin
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {summary.leastProfitableProduct.name}
                  </p>
                </div>
              )}

              {summary.highestVolumeProduct && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Highest Volume</span>
                    <Badge variant="secondary">
                      {formatNumber(summary.highestVolumeProduct.monthlySales)}{" "}
                      units
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {summary.highestVolumeProduct.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        {summary.productsToDiscontinue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Products to Review
              </CardTitle>
              <CardDescription>
                Products with low profitability that may need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {summary.productsToDiscontinue.length} products have profit
                  margins below 5% or are unprofitable.
                </p>
                <p className="text-sm">
                  Consider reviewing pricing, reducing costs, or discontinuing
                  these products.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderProductsTab = () => {
    if (!data) return null;

    const { products } = data;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Product Profitability Analysis
          </h3>
          <Badge variant="outline">{products.length} products</Badge>
        </div>

        <div className="grid gap-4">
          {products.map(product => (
            <Card key={product.productId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getRiskBadge(product.riskLevel)}
                    {product.isProfitable ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Selling Price
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Profit Margin
                    </p>
                    <p className="text-lg font-bold">
                      {formatPercentage(product.profitMargin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Monthly Sales
                    </p>
                    <p className="text-lg font-bold">
                      {formatNumber(product.monthlySales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Monthly Profit
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(product.monthlyProfit)}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">LTV/CAC Ratio</p>
                    <p className="font-medium">
                      {product.ltvToCacRatio.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Break-even Point</p>
                    <p className="font-medium">
                      {formatNumber(product.breakEvenPoint)} units
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      Customer Acquisition Cost
                    </p>
                    <p className="font-medium">
                      {formatCurrency(product.customerAcquisitionCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lifetime Value</p>
                    <p className="font-medium">
                      {formatCurrency(product.lifetimeValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading unit economics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading unit economics data</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Unit Economics</h2>
          <p className="text-muted-foreground">
            Analyze product profitability and cost structure
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          {renderProductsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
