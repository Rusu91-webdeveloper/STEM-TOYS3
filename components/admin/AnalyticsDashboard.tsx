"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Eye,
  Star,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueChange: number;
    ordersChange: number;
    customersChange: number;
    productsChange: number;
  };
  sales: {
    daily: Array<{ date: string; revenue: number; orders: number }>;
    monthly: Array<{ month: string; revenue: number; orders: number }>;
    byCategory: Array<{
      category: string;
      revenue: number;
      percentage: number;
    }>;
    byProduct: Array<{ product: string; revenue: number; units: number }>;
  };
  customers: {
    newCustomers: number;
    returningCustomers: number;
    customerLifetimeValue: number;
    averageOrderValue: number;
    topCustomers: Array<{ customer: string; revenue: number; orders: number }>;
    customerSegments: Array<{
      segment: string;
      count: number;
      percentage: number;
    }>;
  };
  inventory: {
    totalStock: number;
    lowStockItems: number;
    outOfStockItems: number;
    stockValue: number;
    topSellingProducts: Array<{
      product: string;
      units: number;
      revenue: number;
    }>;
    slowMovingProducts: Array<{
      product: string;
      units: number;
      daysInStock: number;
    }>;
  };
  performance: {
    conversionRate: number;
    averageSessionDuration: number;
    bounceRate: number;
    pageViews: number;
    topPages: Array<{ page: string; views: number; conversionRate: number }>;
    trafficSources: Array<{
      source: string;
      sessions: number;
      percentage: number;
    }>;
  };
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function AnalyticsDashboard({
  data,
  isLoading = false,
  onRefresh,
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ro-RO").format(num);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    change: number,
    icon: React.ReactNode,
    description?: string
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {getChangeIcon(change)}
          <span className={getChangeColor(change)}>
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          <span>vs last period</span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard(
          "Total Revenue",
          formatCurrency(data?.overview.totalRevenue || 0),
          data?.overview.revenueChange || 0,
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        )}
        {renderMetricCard(
          "Total Orders",
          formatNumber(data?.overview.totalOrders || 0),
          data?.overview.ordersChange || 0,
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        )}
        {renderMetricCard(
          "Total Customers",
          formatNumber(data?.overview.totalCustomers || 0),
          data?.overview.customersChange || 0,
          <Users className="h-4 w-4 text-muted-foreground" />
        )}
        {renderMetricCard(
          "Total Products",
          formatNumber(data?.overview.totalProducts || 0),
          data?.overview.productsChange || 0,
          <Package className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Daily revenue over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <BarChart3 className="h-12 w-12" />
              <span className="ml-2">Chart placeholder</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Revenue by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.sales.byCategory.slice(0, 5).map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {category.category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(category.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSalesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>Monthly sales comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <Activity className="h-12 w-12" />
              <span className="ml-2">Sales chart placeholder</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.sales.byProduct.slice(0, 5).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{product.product}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.units} units sold
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCustomersTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data?.customers.newCustomers || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Returning Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data?.customers.returningCustomers || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Customer Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.customers.customerLifetimeValue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.customers.averageOrderValue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Highest revenue customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.customers.topCustomers
                .slice(0, 5)
                .map((customer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{customer.customer}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.orders} orders
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(customer.revenue)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <CardDescription>Customer distribution by segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <PieChart className="h-12 w-12" />
              <span className="ml-2">Segments chart placeholder</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data?.inventory.totalStock || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(data?.inventory.lowStockItems || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(data?.inventory.outOfStockItems || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.inventory.stockValue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Products with highest sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.inventory.topSellingProducts
                .slice(0, 5)
                .map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{product.product}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.units} units sold
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slow Moving Products</CardTitle>
            <CardDescription>Products that need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.inventory.slowMovingProducts
                .slice(0, 5)
                .map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{product.product}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.daysInStock} days in stock
                      </p>
                    </div>
                    <span className="font-semibold text-orange-600">
                      {product.units} units
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.performance.conversionRate || 0).toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Session Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((data?.performance.averageSessionDuration || 0) / 60)}
              m
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.performance.bounceRate || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data?.performance.pageViews || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.performance.topPages.slice(0, 5).map((page, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{page.page}</p>
                    <p className="text-sm text-muted-foreground">
                      {page.views.toLocaleString()} views
                    </p>
                  </div>
                  <span className="font-semibold">
                    {page.conversionRate.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.performance.trafficSources
                .slice(0, 5)
                .map((source, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{source.source}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {source.sessions.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Analytics Dashboard
            </h2>
            <p className="text-muted-foreground">
              Comprehensive insights into your e-commerce performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
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
            <Button variant="outline" size="sm" disabled>
              <Calendar className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your e-commerce performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <Calendar className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {renderSalesTab()}
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {renderCustomersTab()}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {renderInventoryTab()}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {renderPerformanceTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
