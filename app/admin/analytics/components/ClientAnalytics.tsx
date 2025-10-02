"use client";

import React, { useState } from "react";

import { getApiUrl } from "@/lib/utils/api-url";

import { AnalyticsErrorBoundary } from "@/components/analytics/AnalyticsErrorBoundary";
import { AnalyticsLoading } from "@/components/analytics/AnalyticsLoading";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WebVitalsSnapshot } from "./WebVitalsSnapshot";
import type {
  SalesData,
  OrderStats,
  TopSellingProduct,
  CategorySales,
  SalesByDay,
  AnalyticsData,
} from "@/lib/validations/analytics";

interface ClientAnalyticsProps {
  initialSalesData: SalesData;
  initialOrderStats: OrderStats;
  initialTopSellingProducts: TopSellingProduct[];
  initialSalesByCategory: CategorySales[];
  initialSalesChartData: {
    salesData: SalesByDay[];
  };
  defaultPeriod: string;
}

export function ClientAnalytics({
  initialSalesData,
  initialOrderStats,
  initialTopSellingProducts,
  initialSalesByCategory,
  initialSalesChartData,
  defaultPeriod,
}: ClientAnalyticsProps) {
  // State to manage the time period and data
  const [period, setPeriod] = useState(defaultPeriod);
  const [salesData, setSalesData] = useState(initialSalesData);
  const [orderStats, setOrderStats] = useState(initialOrderStats);
  const [topSellingProducts, setTopSellingProducts] = useState(
    initialTopSellingProducts
  );
  const [salesByCategory, setSalesByCategory] = useState(
    initialSalesByCategory
  );
  const [salesChartData, setSalesChartData] = useState(initialSalesChartData);
  const [isLoading, setIsLoading] = useState(false);

  // Handle period change - this would normally fetch new data from an API
  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    setIsLoading(true);

    try {
      // Fetch new data based on the period using the dedicated analytics endpoint
      const baseUrl = getApiUrl();
      const response = await fetch(
        `${baseUrl}/api/admin/analytics/dashboard?period=${newPeriod}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Update the state with new data - the API now returns the exact structure we need
      if (data) {
        setSalesData(data.salesData ?? initialSalesData);
        setOrderStats(data.orderStats ?? initialOrderStats);
        setTopSellingProducts(
          data.topSellingProducts ?? initialTopSellingProducts
        );
        setSalesByCategory(data.salesByCategory ?? initialSalesByCategory);
        setSalesChartData(data.salesChartData ?? initialSalesChartData);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      // Keep existing data on error to avoid breaking the UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnalyticsErrorBoundary>
      <div className="space-y-6">
        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <AnalyticsLoading
              message="Updating analytics data..."
              showSkeleton={false}
            />
          </div>
        )}

        <AnalyticsDashboard
          salesData={salesData}
          orderStats={orderStats}
          topSellingProducts={topSellingProducts}
          salesByCategory={salesByCategory}
          salesChartData={salesChartData}
          period={period}
          onPeriodChange={handlePeriodChange}
        />

        <WebVitalsSnapshot />
      </div>
    </AnalyticsErrorBoundary>
  );
}
