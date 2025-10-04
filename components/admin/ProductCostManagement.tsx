"use client";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Package,
  Calculator,
  BarChart3,
  Filter,
  Search,
  Download,
  Edit,
  Eye,
  Plus,
  Target,
  PieChart,
  Activity,
  Zap,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { formatPriceWithCurrency } from "@/lib/currency-converter";
import { formatDate } from "@/lib/utils";

interface ProductCostData {
  productId: string;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  totalCosts: number;
  profitMargin: number;
  monthlySales: number;
  monthlyProfit: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  isProfitable: boolean;
  lastUpdated: string;
  costBreakdown: {
    costPrice: number;
    importDuties: number;
    shippingCost: number;
    storageCost: number;
    packagingCost: number;
    laborCost: number;
    qualityControlCost: number;
    paymentProcessingFee: number;
    customerServiceCost: number;
    operationalOverhead: number;
    marketingCosts: number;
  };
}

interface CostSummary {
  totalProducts: number;
  profitableProducts: number;
  averageProfitMargin: number;
  totalMonthlyRevenue: number;
  totalMonthlyProfit: number;
  totalMonthlyCosts: number;
  averageCostPerProduct: number;
  productsAtRisk: number;
}

export default function ProductCostManagement() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [profitabilityFilter, setProfitabilityFilter] = useState("all");
  const [data, setData] = useState<ProductCostData[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch product cost data
  const fetchCostData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/analytics/cost-management?timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        const { summary, products } = result.data;

        // Transform data for cost management view
        const costData: ProductCostData[] = products.map((product: any) => ({
          productId: product.productId,
          name: product.name,
          category: product.category,
          sellingPrice: product.sellingPrice,
          costPrice: product.costBreakdown.costPrice,
          totalCosts: product.totalCostsPerSale,
          profitMargin: product.profitMargin,
          monthlySales: product.monthlySales,
          monthlyProfit: product.monthlyProfit,
          riskLevel: product.riskLevel,
          isProfitable: product.isProfitable,
          lastUpdated: product.lastUpdated || new Date().toISOString(),
          costBreakdown: product.costBreakdown,
        }));

        // Transform summary
        const costSummary: CostSummary = {
          totalProducts: summary.totalProducts,
          profitableProducts: summary.profitableProducts,
          averageProfitMargin: summary.averageProfitMargin,
          totalMonthlyRevenue: summary.totalMonthlyRevenue,
          totalMonthlyProfit: summary.totalMonthlyProfit,
          totalMonthlyCosts: summary.totalMonthlyCosts,
          averageCostPerProduct: summary.averageCostPerProduct,
          productsAtRisk: summary.productsAtRisk,
        };

        setData(costData);
        setSummary(costSummary);
      } else {
        throw new Error(result.error || "Failed to fetch cost data");
      }
    } catch (err: any) {
      console.error("Error fetching cost data:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load product cost data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();
  }, [timeRange]);

  // Filter data based on search and filters
  const filteredData = data.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesRisk =
      riskFilter === "all" || product.riskLevel === riskFilter;
    const matchesProfitability =
      profitabilityFilter === "all" ||
      (profitabilityFilter === "profitable" && product.isProfitable) ||
      (profitabilityFilter === "unprofitable" && !product.isProfitable);

    return (
      matchesSearch && matchesCategory && matchesRisk && matchesProfitability
    );
  });

  const formatCurrency = (amount: number) =>
    formatPriceWithCurrency(amount, "RON");

  const formatPercentage = (num: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num / 100);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("ro-RO").format(num);

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

  const getProfitabilityIcon = (isProfitable: boolean) => {
    return isProfitable ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  const renderMetricCard = (
    title: string,
    value: string,
    description?: string,
    icon?: React.ReactNode,
    trend?: "up" | "down" | "neutral"
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center gap-2">
          {value}
          {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === "down" && (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          {trend === "neutral" && (
            <Activity className="h-4 w-4 text-gray-500" />
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => {
    if (!summary) return null;

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMetricCard(
            "Total Products",
            summary.totalProducts.toString(),
            "Products in catalog",
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Profitable Products",
            `${summary.profitableProducts}/${summary.totalProducts}`,
            `${formatPercentage((summary.profitableProducts / summary.totalProducts) * 100)} of products`,
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Average Profit Margin",
            formatPercentage(summary.averageProfitMargin),
            "Overall profitability",
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Products at Risk",
            summary.productsAtRisk.toString(),
            "High-risk products",
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderMetricCard(
            "Total Monthly Revenue",
            formatCurrency(summary.totalMonthlyRevenue),
            "Revenue from all products",
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Total Monthly Profit",
            formatCurrency(summary.totalMonthlyProfit),
            "Net profit after all costs",
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Total Monthly Costs",
            formatCurrency(summary.totalMonthlyCosts),
            "All operational costs",
            <Calculator className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Cost Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Cost Analysis Overview
            </CardTitle>
            <CardDescription>
              Breakdown of costs and profitability across your product portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Average Cost per Product
                </span>
                <span className="font-bold">
                  {formatCurrency(summary.averageCostPerProduct)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Profitability Rate</span>
                <span className="font-bold">
                  {formatPercentage(
                    (summary.profitableProducts / summary.totalProducts) * 100
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Revenue to Cost Ratio
                </span>
                <span className="font-bold">
                  {(
                    summary.totalMonthlyRevenue / summary.totalMonthlyCosts
                  ).toFixed(2)}
                  :1
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {summary.productsAtRisk > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Cost Optimization Recommendations
              </CardTitle>
              <CardDescription>
                Actionable insights to improve profitability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Review High-Risk Products</p>
                    <p className="text-sm text-muted-foreground">
                      {summary.productsAtRisk} products need immediate cost
                      analysis and optimization.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Optimize Supply Chain</p>
                    <p className="text-sm text-muted-foreground">
                      Consider bulk purchasing, alternative suppliers, or cost
                      reduction strategies.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Focus on Profitable Products</p>
                    <p className="text-sm text-muted-foreground">
                      Increase marketing spend on products with high profit
                      margins.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderProductsTab = () => {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {/* Add dynamic categories here */}
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={profitabilityFilter}
              onValueChange={setProfitabilityFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Profitability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="profitable">Profitable</SelectItem>
                <SelectItem value="unprofitable">Unprofitable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Product Cost Analysis</CardTitle>
                <CardDescription>
                  {filteredData.length} products • Last updated{" "}
                  {formatDate(new Date())}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Total Costs</TableHead>
                    <TableHead>Profit Margin</TableHead>
                    <TableHead>Monthly Sales</TableHead>
                    <TableHead>Monthly Profit</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(product => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {product.productId.slice(-8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        {formatCurrency(product.sellingPrice)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(product.totalCosts)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formatPercentage(product.profitMargin)}
                          {getProfitabilityIcon(product.isProfitable)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatNumber(product.monthlySales)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(product.monthlyProfit)}
                      </TableCell>
                      <TableCell>{getRiskBadge(product.riskLevel)}</TableCell>
                      <TableCell>
                        {product.isProfitable ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            Profitable
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Unprofitable</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/admin/products/${product.productId}/costs`
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/admin/products/${product.productId}`
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading product cost data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading cost data</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchCostData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Product Cost Management
          </h2>
          <p className="text-muted-foreground">
            Analyze costs, optimize pricing, and maximize profitability
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
          <Button onClick={fetchCostData} variant="outline">
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
