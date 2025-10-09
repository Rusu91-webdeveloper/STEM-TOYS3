"use client";

import { useEffect, useState } from "react";
import { Package, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPriceWithCurrency } from "@/lib/currency-converter";

interface ProductMetricsData {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  lowStockCount: number;
  monthlyRevenue: number;
}

export function ProductMetrics() {
  const [metrics, setMetrics] = useState<ProductMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/supplier/products/metrics");

      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const metricCards = [
    {
      title: "Total Products",
      value: metrics.totalProducts,
      subtitle: `${metrics.activeProducts} active`,
      icon: Package,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Sales",
      value: metrics.totalSales,
      subtitle: "Units sold",
      icon: TrendingUp,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Low Stock Alerts",
      value: metrics.lowStockCount,
      subtitle: metrics.lowStockCount > 0 ? "Needs attention" : "All good",
      icon: AlertTriangle,
      iconColor:
        metrics.lowStockCount > 0 ? "text-orange-600" : "text-gray-400",
      bgColor: metrics.lowStockCount > 0 ? "bg-orange-50" : "bg-gray-50",
    },
    {
      title: "Monthly Revenue",
      value: formatPriceWithCurrency(metrics.monthlyRevenue, "RON"),
      subtitle: "This month",
      icon: DollarSign,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof metric.value === "string"
                  ? metric.value
                  : metric.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
