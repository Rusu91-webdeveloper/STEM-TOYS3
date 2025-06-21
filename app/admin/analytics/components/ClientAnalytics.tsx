"use client";

import React, { useState } from "react";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

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
    setIsLoading(true);
    setPeriod(newPeriod);

    try {
      // Fetch new data based on the period
      const response = await fetch(`/api/admin/dashboard?period=${newPeriod}`);
      const data = await response.json();

      // Update the state with new data
      if (data) {
        setSalesData(data.salesData || initialSalesData);
        setOrderStats(data.orderStats || initialOrderStats);
        setTopSellingProducts(
          data.topSellingProducts || initialTopSellingProducts
        );
        setSalesByCategory(data.salesByCategory || initialSalesByCategory);
        setSalesChartData({
          salesData: data.salesChartData || initialSalesChartData.salesData,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Fallback to initial data on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnalyticsDashboard
      salesData={salesData}
      orderStats={orderStats}
      topSellingProducts={topSellingProducts}
      salesByCategory={salesByCategory}
      salesChartData={salesChartData}
      period={period}
      onPeriodChange={handlePeriodChange}
    />
  );
}
