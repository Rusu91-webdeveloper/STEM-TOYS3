"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  Calendar,
  Activity,
  BarChart3,
  Eye,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardData } from "@/lib/admin/api";
import type { DashboardStat, RecentOrder, TopProduct } from "@/lib/admin/api";
import { useCurrency } from "@/lib/currency";

// Mark this route as dynamic to prevent static generation errors
export const dynamic = "force-dynamic";

// Dashboard icons for stats with enhanced styling
const ICONS: Record<string, React.ReactNode> = {
  "Total Revenue": <DollarSign className="h-8 w-8 text-green-600" />,
  "Total Orders": <ShoppingBag className="h-8 w-8 text-blue-600" />,
  "New Customers": <Users className="h-8 w-8 text-purple-600" />,
  "Total Products": <Package className="h-8 w-8 text-orange-600" />,
};

// CurrencyDisplay component for consistent currency formatting
function CurrencyDisplay({ value }: { value: number | string }) {
  const { formatPrice } = useCurrency();
  // Convert string to number if needed
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;
  return <>{formatPrice(numericValue)}</>;
}

// Enhanced StatCard component
function StatCard({ stat }: { stat: DashboardStat }) {
  const Icon = ICONS[stat.title];
  const isPositive = stat.trend === "up";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {stat.title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {stat.title === "Total Revenue" ? (
                  <CurrencyDisplay value={stat.value} />
                ) : (
                  stat.value
                )}
              </p>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
            {Icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Client component to load dashboard data
export default function AdminDashboard() {
  const [data, setData] = useState<{
    stats: DashboardStat[];
    recentOrders: RecentOrder[];
    topProducts: TopProduct[];
  }>({
    stats: [
      {
        title: "Total Revenue",
        value: "0.00",
        change: "0%",
        trend: "up",
        description: "Last 30 days",
      },
      {
        title: "Total Orders",
        value: "0",
        change: "0%",
        trend: "up",
        description: "Last 30 days",
      },
      {
        title: "New Customers",
        value: "0",
        change: "0%",
        trend: "up",
        description: "Last 30 days",
      },
      {
        title: "Total Products",
        value: "0",
        change: "0%",
        trend: "up",
        description: "Active products",
      },
    ],
    recentOrders: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome to your admin dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="animate-pulse bg-gray-200 h-10 w-32 rounded-md"></div>
            <div className="animate-pulse bg-gray-200 h-10 w-24 rounded-md"></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Welcome to your admin dashboard - Monitor your store's performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/products">
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Recent Orders
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Latest customer orders and their status
                </CardDescription>
              </div>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(order.customer || "C").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customer || "Unknown Customer"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Order #{order.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        <CurrencyDisplay value={order.amount} />
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Top Products
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Best performing products by sales
                </CardDescription>
              </div>
              <Link
                href="/admin/products"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.topProducts.length > 0 ? (
              <div className="space-y-4">
                {data.topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Price: <CurrencyDisplay value={product.price} />
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {product.sales} sales
                      </p>
                      <p className="text-sm text-gray-500">
                        Stock: {product.inventory}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No product data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-gray-600">
            Common admin tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href="/admin/products/create">
                <Package className="h-6 w-6" />
                <span>Add Product</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href="/admin/orders">
                <ShoppingBag className="h-6 w-6" />
                <span>View Orders</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href="/admin/customers">
                <Users className="h-6 w-6" />
                <span>Manage Customers</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              asChild
            >
              <Link href="/admin/analytics">
                <BarChart3 className="h-6 w-6" />
                <span>Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
