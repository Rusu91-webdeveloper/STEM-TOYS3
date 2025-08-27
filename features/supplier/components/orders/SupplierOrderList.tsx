"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Eye, 
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { type SupplierOrder, type SupplierOrderStatus } from "@/features/supplier/types/supplier";

interface OrderFilters {
  search?: string;
  status?: SupplierOrderStatus | "ALL";
  period?: string;
  sortBy?: string;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Package
  },
  IN_PRODUCTION: {
    label: "In Production",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: RefreshCw
  },
  READY_TO_SHIP: {
    label: "Ready to Ship",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Package
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Truck
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle
  }
};

export function SupplierOrderList() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("page", pagination.page.toString());
      queryParams.append("limit", pagination.limit.toString());
      
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.status && filters.status !== "ALL") queryParams.append("status", filters.status);
      if (filters.period) queryParams.append("period", filters.period);
      if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);

      const response = await fetch(`/api/supplier/orders?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/supplier/orders/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching order stats:", err);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: SupplierOrderStatus, trackingNumber?: string) => {
    try {
      const response = await fetch(`/api/supplier/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      // Refresh orders and stats
      fetchOrders();
      fetchStats();
    } catch (err) {
      console.error("Error updating order status:", err);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.status && filters.status !== "ALL") queryParams.append("status", filters.status);
      if (filters.period) queryParams.append("period", filters.period);

      const response = await fetch(`/api/supplier/orders/export?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to export orders");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Orders exported successfully",
      });
    } catch (err) {
      console.error("Error exporting orders:", err);
      toast({
        title: "Error",
        description: "Failed to export orders",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shippedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveredOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={filters.search || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || "ALL"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select
                value={filters.period || "ALL"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={filters.sortBy || "createdAt"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="totalPrice">Total Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Orders</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => { fetchOrders(); fetchStats(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo?.icon || Clock;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">#{order.orderId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">Customer</div>
                            <div className="text-sm text-muted-foreground">
                              <User className="inline h-3 w-3 mr-1" />
                              Customer Info
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">Product</div>
                            <div className="text-sm text-muted-foreground">
                              Product Name
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.quantity}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{formatCurrency(order.totalPrice)}</div>
                            <div className="text-sm text-muted-foreground">
                              Revenue: {formatCurrency(order.supplierRevenue)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(order.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/supplier/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {orders.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders found</h3>
                  <p className="text-muted-foreground">
                    No orders match your current filters.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} orders
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
