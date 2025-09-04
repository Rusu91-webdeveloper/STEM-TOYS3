"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  ArrowRight,
  Calendar,
  Users,
  Activity,
  FileText,
  BarChart3,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  type SupplierStats,
  type SupplierOrder,
} from "@/features/supplier/types/supplier";
import { QuickAccess } from "./QuickAccess";
import { RomanianComplianceDashboard } from "../romanian/RomanianComplianceDashboard";
import { formatPriceWithCurrency } from "@/lib/currency-converter";

interface DashboardData {
  stats: SupplierStats;
  recentOrders: SupplierOrder[];
  supplier: {
    businessCountry: string;
  };
  notifications: Array<{
    id: string;
    type: "order" | "payment" | "system";
    title: string;
    message: string;
    date: string;
    read: boolean;
  }>;
}

export function SupplierDashboard({
  initialData,
}: {
  initialData?: DashboardData | null;
}) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    initialData ?? null
  );
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no data was provided from the server, fetch from API
    if (!initialData) {
      fetchDashboardData();
    }
  }, [initialData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/supplier/dashboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed to load dashboard data");
      }
      const json = (await res.json()) as DashboardData;
      setDashboardData(json);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200";
      case "CONFIRMED":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200";
      case "SHIPPED":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200";
      case "DELIVERED":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200";
      default:
        return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return Clock;
      case "CONFIRMED":
        return CheckCircle;
      case "SHIPPED":
        return TrendingUp;
      case "DELIVERED":
        return CheckCircle;
      default:
        return AlertTriangle;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing your insights</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load dashboard data"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Quick Access Component */}
      <QuickAccess
        stats={{
          pendingOrders: dashboardData?.stats?.pendingOrders ?? 0,
          unreadMessages: (dashboardData?.notifications ?? []).filter(
            n => !n.read
          ).length,
          overdueInvoices: dashboardData?.stats?.pendingInvoices ?? 0,
          activeProducts: dashboardData?.stats?.activeProducts ?? 0,
        }}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Products
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {dashboardData?.stats?.totalProducts ?? 0}
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {dashboardData?.stats?.activeProducts ?? 0} active
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Orders
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {dashboardData?.stats?.totalOrders ?? 0}
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {dashboardData?.stats?.pendingOrders ?? 0} pending
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Monthly Revenue
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatPriceWithCurrency(
                dashboardData?.stats?.monthlyRevenue ?? 0,
                "RON"
              )}
            </div>
            <p className="text-sm text-green-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Commission Earned
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Target className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatPriceWithCurrency(
                dashboardData?.stats?.commissionEarned ?? 0,
                "RON"
              )}
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {dashboardData?.stats?.pendingInvoices ?? 0} pending invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Recent Orders
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Latest orders and their current status
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100"
                >
                  <Link href="/supplier/orders">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(dashboardData?.recentOrders ?? []).map((order, index) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 hover:shadow-md"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Order #{order.orderId.slice(-6)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.quantity ?? 0} items •{" "}
                            {formatPriceWithCurrency(
                              order.totalPrice ?? 0,
                              "RON"
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              order.createdAt ?? new Date()
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          className={`${getStatusColor(order.status)} font-medium`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {order.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:bg-blue-100 rounded-lg"
                        >
                          <Link href={`/supplier/orders/${order.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-gray-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                asChild
              >
                <Link href="/supplier/products/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-green-50 border-green-200 text-green-700"
                asChild
              >
                <Link href="/supplier/orders">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Orders
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-purple-50 border-purple-200 text-purple-700"
                asChild
              >
                <Link href="/supplier/invoices">
                  <FileText className="w-4 h-4 mr-2" />
                  Check Invoices
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-orange-50 border-orange-200 text-orange-700"
                asChild
              >
                <Link href="/supplier/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-gray-900">
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {(dashboardData?.notifications ?? []).map(
                  (notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                        notification.read
                          ? "bg-gradient-to-r from-gray-50 to-white border-gray-100"
                          : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                      }`}
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              notification.read
                                ? "text-gray-900"
                                : "text-blue-900"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              notification.read
                                ? "text-gray-600"
                                : "text-blue-700"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(
                              notification.date ?? new Date()
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full ml-2 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Overview */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Performance Overview
              </CardTitle>
              <CardDescription className="text-gray-600">
                Key metrics for the current month
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatPriceWithCurrency(
                  dashboardData?.stats?.monthlyRevenue ?? 0,
                  "RON"
                )}
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Monthly Revenue
              </p>
              <p className="text-xs text-green-600 font-semibold mt-1">
                +12% vs last month
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {dashboardData?.stats?.totalOrders ?? 0}
              </div>
              <p className="text-sm text-gray-600 font-medium">Total Orders</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">
                +8% vs last month
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {dashboardData?.stats?.activeProducts ?? 0}
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Active Products
              </p>
              <p className="text-xs text-purple-600 font-semibold mt-1">
                +2 new this month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Romanian Compliance Dashboard */}
      {dashboardData && (
        <RomanianComplianceDashboard supplier={dashboardData.supplier} />
      )}
    </div>
  );
}
