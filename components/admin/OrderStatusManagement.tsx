"use client";

import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  MoreHorizontal,
  Download,
  RotateCw,
  Ban,
  Save,
  X,
  Eye,
  Edit,
  History,
  Bell,
  Users,
  Package,
  TrendingUp,
  Calendar,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  Activity,
  Zap,
  Target,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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

// Order status types
type OrderStatus =
  | "PROCESSING"
  | "PENDING_REVIEW"
  | "READY_FOR_SHIPPING"
  | "FULFILLED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "COMPLETED";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  total: number;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  items: number;
  shippingAddress: {
    addressLine1: string;
    city: string;
    country: string;
    postalCode: string;
  };
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  notes?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  tags: string[];
  lastUpdated: string;
  updatedBy?: string;
}

interface OrderStatusHistory {
  id: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason?: string;
  notes?: string;
  updatedBy?: string;
  timestamp: string;
}

interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageProcessingTime: number;
  totalRevenue: number;
  ordersRequiringAttention: number;
  highPriorityOrders: number;
}

export default function OrderStatusManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [bulkUpdateDialog, setBulkUpdateDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);

  // Form states
  const [newStatus, setNewStatus] = useState<OrderStatus>("PROCESSING");
  const [updateReason, setUpdateReason] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  // Fetch orders data
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (dateFilter !== "all") params.append("dateFilter", dateFilter);

      const response = await fetch(`/api/admin/orders/enhanced?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch orders: ${response.statusText}`
        );
      }

      const result = await response.json();
      if (result.success) {
        setOrders(result.data.orders || []);
        setStatistics(result.data.statistics || null);
        setTotalPages(result.data.pagination?.pages || 1);
      } else {
        throw new Error(result.error || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load orders. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Set empty state on error
      setOrders([]);
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    priorityFilter,
    dateFilter,
    sortBy,
    sortOrder,
  ]);

  // Fetch order status history
  const fetchOrderHistory = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`);
      if (!response.ok) throw new Error("Failed to fetch order history");

      const data = await response.json();
      setOrderHistory(data.data || []);
    } catch (error) {
      console.error("Error fetching order history:", error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Helper functions
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "COMPLETED":
      case "DELIVERED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "PROCESSING":
      case "PENDING_REVIEW":
        return <Clock className="h-4 w-4" />;
      case "SHIPPED":
      case "READY_FOR_SHIPPING":
      case "FULFILLED":
        return <Truck className="h-4 w-4" />;
      case "CANCELLED":
        return <Ban className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      PROCESSING: "bg-blue-100 text-blue-800",
      PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
      READY_FOR_SHIPPING: "bg-purple-100 text-purple-800",
      FULFILLED: "bg-indigo-100 text-indigo-800",
      SHIPPED: "bg-cyan-100 text-cyan-800",
      DELIVERED: "bg-green-100 text-green-800",
      COMPLETED: "bg-emerald-100 text-emerald-800",
      CANCELLED: "bg-red-100 text-red-800",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1">{status.replace("_", " ")}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: "LOW" | "MEDIUM" | "HIGH") => {
    const variants = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-red-100 text-red-800",
    };

    return (
      <Badge variant="outline" className={variants[priority]}>
        {priority}
      </Badge>
    );
  };

  // Status update functions
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(
        `/api/admin/orders/${selectedOrder.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            reason: updateReason,
            notes: updateNotes,
            sendNotification,
            ...(trackingNumber && { trackingNumber }),
            ...(carrier && { carrier }),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update order status");

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });

      setStatusUpdateDialog(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrders.length === 0) return;

    try {
      const response = await fetch("/api/admin/orders/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrders,
          status: newStatus,
          reason: updateReason,
          notes: updateNotes,
          sendNotification,
        }),
      });

      if (!response.ok) throw new Error("Failed to update order statuses");

      toast({
        title: "Success",
        description: `Updated ${selectedOrders.length} orders to ${newStatus}`,
      });

      setBulkUpdateDialog(false);
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order statuses:", error);
      toast({
        title: "Error",
        description: "Failed to update order statuses",
        variant: "destructive",
      });
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    setSelectedOrders(
      selectedOrders.length === orders.length
        ? []
        : orders.map(order => order.id)
    );
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
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
            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
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
    if (!statistics) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No statistics available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMetricCard(
            "Total Orders",
            statistics.totalOrders,
            "All orders in system",
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Pending Review",
            statistics.pendingOrders,
            "Orders requiring attention",
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Processing",
            statistics.processingOrders,
            "Orders in progress",
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Shipped",
            statistics.shippedOrders,
            "Orders in transit",
            <Truck className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMetricCard(
            "Delivered",
            statistics.deliveredOrders,
            "Successfully delivered",
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "High Priority",
            statistics.highPriorityOrders,
            "Urgent orders",
            <Zap className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Avg Processing Time",
            `${statistics.averageProcessingTime}h`,
            "Time to fulfillment",
            <Target className="h-4 w-4 text-muted-foreground" />
          )}
          {renderMetricCard(
            "Total Revenue",
            formatPriceWithCurrency(statistics.totalRevenue, "RON"),
            "Revenue from orders",
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>
              Current distribution of orders across different statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.processingOrders}
                </div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics.shippedOrders}
                </div>
                <div className="text-sm text-muted-foreground">Shipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.deliveredOrders}
                </div>
                <div className="text-sm text-muted-foreground">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {statistics.cancelledOrders}
                </div>
                <div className="text-sm text-muted-foreground">Cancelled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Required */}
        {statistics.ordersRequiringAttention > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Actions Required
              </CardTitle>
              <CardDescription>
                Orders that need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Review Required</p>
                    <p className="text-sm text-muted-foreground">
                      {statistics.ordersRequiringAttention} orders need manual
                      review or status updates.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">High Priority Orders</p>
                    <p className="text-sm text-muted-foreground">
                      {statistics.highPriorityOrders} orders marked as high
                      priority need immediate processing.
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

  const renderOrdersTab = () => {
    return (
      <div className="space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search orders, customers, or order numbers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="READY_FOR_SHIPPING">
                  Ready for Shipping
                </SelectItem>
                <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedOrders.length} orders selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrders([])}
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkUpdateDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  {orders.length} orders • Page {currentPage} of {totalPages}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
                <Button variant="outline" size="sm" onClick={fetchOrders}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedOrders.length === orders.length &&
                          orders.length > 0
                        }
                        onCheckedChange={handleSelectAllOrders}
                      />
                    </TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleSelectOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            #{order.orderNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.items} items
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(order.date)}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPriceWithCurrency(order.total, "RON")}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.paymentStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/orders/${order.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setNewStatus(order.status);
                                setStatusUpdateDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                fetchOrderHistory(order.id);
                                setHistoryDialog(true);
                              }}
                            >
                              <History className="h-4 w-4 mr-2" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Notification
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * 20 + 1} to{" "}
                  {Math.min(currentPage * 20, orders.length)} of {orders.length}{" "}
                  orders
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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
          <p>Loading order data...</p>
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
            Order Status Management
          </h2>
          <p className="text-muted-foreground">
            Manage order statuses, track fulfillment, and monitor order workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchOrders}>
            <RotateCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {renderOrdersTab()}
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="READY_FOR_SHIPPING">
                    Ready for Shipping
                  </SelectItem>
                  <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newStatus === "SHIPPED" || newStatus === "DELIVERED") && (
              <>
                <div>
                  <label className="text-sm font-medium">Tracking Number</label>
                  <Input
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Carrier</label>
                  <Input
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="Enter carrier name"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                value={updateReason}
                onChange={e => setUpdateReason(e.target.value)}
                placeholder="Reason for status change"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={updateNotes}
                onChange={e => setUpdateNotes(e.target.value)}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-notification"
                checked={sendNotification}
                onCheckedChange={(checked) =>
                  setSendNotification(checked === true)
                }
              />
              <label htmlFor="send-notification" className="text-sm">
                Send notification to customer
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusUpdateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateDialog} onOpenChange={setBulkUpdateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Update Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedOrders.length} selected orders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="READY_FOR_SHIPPING">
                    Ready for Shipping
                  </SelectItem>
                  <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input
                value={updateReason}
                onChange={e => setUpdateReason(e.target.value)}
                placeholder="Reason for status change"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={updateNotes}
                onChange={e => setUpdateNotes(e.target.value)}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-send-notification"
                checked={sendNotification}
                onCheckedChange={(checked) =>
                  setSendNotification(checked === true)
                }
              />
              <label htmlFor="bulk-send-notification" className="text-sm">
                Send notification to customers
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkUpdateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkStatusUpdate}>
              Update {selectedOrders.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Status History</DialogTitle>
            <DialogDescription>
              Status change history for order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {orderHistory.map((history, index) => (
              <div key={history.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{history.fromStatus}</Badge>
                    <span>→</span>
                    <Badge variant="outline">{history.toStatus}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(history.timestamp)}
                    </span>
                  </div>
                  {history.reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Reason:</strong> {history.reason}
                    </p>
                  )}
                  {history.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Notes:</strong> {history.notes}
                    </p>
                  )}
                  {history.updatedBy && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Updated by:</strong> {history.updatedBy}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
