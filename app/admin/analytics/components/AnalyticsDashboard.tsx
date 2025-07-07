"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShoppingBag,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CurrencyDisplay } from "./CurrencyDisplay";
import { SalesChart } from "./sales-chart";
import { SalesByCategoryChart } from "./SalesByCategoryChart";
import { TopSellingProductsTable } from "./TopSellingProductsTable";


interface SalesData {
  daily: number;
  weekly: number;
  monthly: number;
  previousPeriodChange: number;
  trending: "up" | "down";
}

interface OrderStats {
  conversionRate: {
    rate: number;
    previousPeriodChange: number;
    trending: "up" | "down";
  };
  averageOrderValue: {
    value: number;
    previousPeriodChange: number;
    trending: "up" | "down";
  };
  totalCustomers: {
    value: number;
    previousPeriodChange: number;
    trending: "up" | "down";
  };
}

interface TopSellingProduct {
  name: string;
  price: number;
  sold: number;
  revenue: number;
}

interface CategorySales {
  categoryId: string;
  category: string;
  amount: number;
  percentage: number;
}

interface SalesByDay {
  date: string;
  sales: number;
}

interface AnalyticsDashboardProps {
  salesData: SalesData;
  orderStats: OrderStats;
  topSellingProducts: TopSellingProduct[];
  salesByCategory: CategorySales[];
  salesChartData: {
    salesData: SalesByDay[];
  };
  period: string;
  onPeriodChange: (period: string) => void;
}

export function AnalyticsDashboard({
  salesData,
  orderStats,
  topSellingProducts,
  salesByCategory,
  salesChartData,
  period,
  onPeriodChange,
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Sales
                </p>
                <div className="rounded-full bg-primary/10 p-1 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold">
                  <CurrencyDisplay value={salesData.monthly} />
                </h3>
                <span
                  className={`text-xs font-medium flex items-center ${
                    salesData.trending === "up"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}>
                  {salesData.trending === "up" ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {salesData.previousPeriodChange}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-muted-foreground">Daily</p>
                  <p className="font-medium">
                    <CurrencyDisplay value={salesData.daily} />
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Weekly</p>
                  <p className="font-medium">
                    <CurrencyDisplay value={salesData.weekly} />
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </p>
                <div className="rounded-full bg-primary/10 p-1 text-primary">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold">
                  {orderStats.conversionRate.rate}%
                </h3>
                <span
                  className={`text-xs font-medium flex items-center ${
                    orderStats.conversionRate.trending === "up"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}>
                  {orderStats.conversionRate.trending === "up" ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(orderStats.conversionRate.previousPeriodChange)}%
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Visitors who made purchases
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Average Order Value
                </p>
                <div className="rounded-full bg-primary/10 p-1 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold">
                  <CurrencyDisplay value={orderStats.averageOrderValue.value} />
                </h3>
                <span
                  className={`text-xs font-medium flex items-center ${
                    orderStats.averageOrderValue.trending === "up"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}>
                  {orderStats.averageOrderValue.trending === "up" ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {orderStats.averageOrderValue.previousPeriodChange}%
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Per transaction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Customers Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </p>
                <div className="rounded-full bg-primary/10 p-1 text-primary">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold">
                  {orderStats.totalCustomers.value.toLocaleString()}
                </h3>
                <span
                  className={`text-xs font-medium flex items-center ${
                    orderStats.totalCustomers.trending === "up"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}>
                  {orderStats.totalCustomers.trending === "up" ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {orderStats.totalCustomers.previousPeriodChange}%
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
            <CardDescription>
              Daily revenue for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <SalesChart data={salesChartData.salesData} />
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>
              Distribution of sales across product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesByCategoryChart categories={salesByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>
            Best performing products in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopSellingProductsTable products={topSellingProducts} />
        </CardContent>
      </Card>
    </div>
  );
}
