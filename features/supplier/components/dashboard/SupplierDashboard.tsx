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
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type SupplierStats, type SupplierOrder } from "@/features/supplier/types/supplier";

interface DashboardData {
  stats: SupplierStats;
  recentOrders: SupplierOrder[];
  notifications: Array<{
    id: string;
    type: 'order' | 'payment' | 'system';
    title: string;
    message: string;
    date: string;
    read: boolean;
  }>;
}

export function SupplierDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data
      const mockData: DashboardData = {
        stats: {
          totalProducts: 24,
          activeProducts: 22,
          totalOrders: 156,
          pendingOrders: 8,
          totalRevenue: 45230.50,
          monthlyRevenue: 8750.25,
          commissionEarned: 6784.58,
          pendingInvoices: 3
        },
        recentOrders: [
          {
            id: "ord_001",
            supplierId: "sup_001",
            orderId: "order_123",
            orderItemId: "item_456",
            productId: "prod_789",
            quantity: 5,
            unitPrice: 29.99,
            totalPrice: 149.95,
            commission: 22.49,
            supplierRevenue: 127.46,
            status: "PENDING",
            createdAt: new Date("2024-01-15T10:30:00Z"),
            updatedAt: new Date("2024-01-15T10:30:00Z")
          },
          {
            id: "ord_002",
            supplierId: "sup_001",
            orderId: "order_124",
            orderItemId: "item_457",
            productId: "prod_790",
            quantity: 2,
            unitPrice: 45.00,
            totalPrice: 90.00,
            commission: 13.50,
            supplierRevenue: 76.50,
            status: "CONFIRMED",
            createdAt: new Date("2024-01-14T14:20:00Z"),
            updatedAt: new Date("2024-01-14T14:20:00Z")
          },
          {
            id: "ord_003",
            supplierId: "sup_001",
            orderId: "order_125",
            orderItemId: "item_458",
            productId: "prod_791",
            quantity: 1,
            unitPrice: 89.99,
            totalPrice: 89.99,
            commission: 13.50,
            supplierRevenue: 76.49,
            status: "SHIPPED",
            trackingNumber: "TRK123456789",
            shippedAt: new Date("2024-01-13T09:15:00Z"),
            createdAt: new Date("2024-01-12T16:45:00Z"),
            updatedAt: new Date("2024-01-13T09:15:00Z")
          }
        ],
        notifications: [
          {
            id: "notif_001",
            type: "order",
            title: "New Order Received",
            message: "Order #123 has been placed for 5 units of Science Kit Pro",
            date: "2024-01-15T10:30:00Z",
            read: false
          },
          {
            id: "notif_002",
            type: "payment",
            title: "Payment Received",
            message: "Payment of €127.46 has been processed for order #124",
            date: "2024-01-14T14:20:00Z",
            read: false
          },
          {
            id: "notif_003",
            type: "system",
            title: "Product Review",
            message: "Your product 'Engineering Blocks Set' received a 5-star review",
            date: "2024-01-13T11:45:00Z",
            read: true
          }
        ]
      };

      setDashboardData(mockData);
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
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHIPPED":
        return "bg-green-100 text-green-800 border-green-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load dashboard data"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.stats.activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.stats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{dashboardData.stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{dashboardData.stats.commissionEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.stats.pendingInvoices} pending invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>
                    Latest orders and their current status
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/supplier/orders">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Order #{order.orderId.slice(-6)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.quantity} items • €{order.totalPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(order.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {order.status}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
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
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/supplier/products/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/supplier/orders">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Orders
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/supplier/invoices">
                  <FileText className="w-4 h-4 mr-2" />
                  Check Invoices
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/supplier/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          notification.read ? 'text-gray-900' : 'text-blue-900'
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs ${
                          notification.read ? 'text-gray-600' : 'text-blue-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.date).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Key metrics for the current month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                €{dashboardData.stats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-xs text-green-600">+12% vs last month</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.stats.totalOrders}
              </div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xs text-blue-600">+8% vs last month</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData.stats.activeProducts}
              </div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-xs text-purple-600">+2 new this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
