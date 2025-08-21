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
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/lib/currency";

// Type definitions
type Order = {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: number;
  status: string;
  payment: string;
  items: number;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="mr-1 h-3 w-3" />;
    case "Processing":
      return <Clock className="mr-1 h-3 w-3" />;
    case "Shipped":
      return <Truck className="mr-1 h-3 w-3" />;
    case "Cancelled":
      return <Ban className="mr-1 h-3 w-3" />;
    default:
      return <AlertCircle className="mr-1 h-3 w-3" />;
  }
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Processing":
      return "bg-blue-100 text-blue-800";
    case "Shipped":
      return "bg-purple-100 text-purple-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Helper function to format status
const formatStatus = (status: string): string =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("30");
  const { formatPrice } = useCurrency();

  // Status update modal state
  const [statusUpdateModal, setStatusUpdateModal] = useState({
    isOpen: false,
    order: null as Order | null,
    newStatus: "",
    cancellationReason: "",
    updating: false,
  });

  // Function to fetch orders from the API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (period !== "all") params.append("period", period);
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/orders?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders ?? []);
      setPagination(data.pagination ?? pagination);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [status, period, searchTerm, pagination.page, pagination.limit, toast]);

  // Function to open status update modal
  const openStatusUpdateModal = (order: Order) => {
    setStatusUpdateModal({
      isOpen: true,
      order,
      newStatus: order.status.toUpperCase(),
      updating: false,
    });
  };

  // Function to close status update modal
  const closeStatusUpdateModal = () => {
    setStatusUpdateModal({
      isOpen: false,
      order: null,
      newStatus: "",
      cancellationReason: "",
      updating: false,
    });
  };

  // Function to update order status
  const updateOrderStatus = async () => {
    if (!statusUpdateModal.order || !statusUpdateModal.newStatus) return;

    setStatusUpdateModal(prev => ({ ...prev, updating: true }));

    try {
      const requestBody: any = {
        status: statusUpdateModal.newStatus,
      };

      // Add cancellation reason if cancelling the order
      if (
        statusUpdateModal.newStatus === "CANCELLED" &&
        statusUpdateModal.cancellationReason.trim()
      ) {
        requestBody.cancellationReason =
          statusUpdateModal.cancellationReason.trim();
      }

      const response = await fetch(
        `/api/admin/orders/${statusUpdateModal.order.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      // Update the order in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === statusUpdateModal.order!.id
            ? { ...order, status: formatStatus(statusUpdateModal.newStatus) }
            : order
        )
      );

      toast({
        title: "Success",
        description: `Order status updated to ${formatStatus(statusUpdateModal.newStatus)}`,
      });

      closeStatusUpdateModal();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateModal(prev => ({ ...prev, updating: false }));
    }
  };

  // Fetch orders on initial load and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <form
                onSubmit={handleSearch}
                className="flex w-full max-w-sm items-center space-x-2"
              >
                <Input
                  type="search"
                  placeholder="Search orders or customers..."
                  className="w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  defaultValue="all"
                  value={status}
                  onValueChange={value => setStatus(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  defaultValue="30"
                  value={period}
                  onValueChange={value => setPeriod(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchOrders()}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <RotateCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found. Try adjusting your filters.
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-3 text-left">
                        <div className="flex items-center gap-1">
                          <span>Order</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <div className="flex items-center gap-1">
                          <span>Date</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">
                        <div className="flex items-center gap-1">
                          <span>Total</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Payment</th>
                      <th className="px-4 py-3 text-left">Items</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr
                        key={order.id}
                        className="border-b text-sm hover:bg-muted/50"
                      >
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {order.id}
                          </Link>
                        </td>
                        <td className="px-4 py-4">{order.date}</td>
                        <td className="px-4 py-4">
                          <div>
                            <div>{order.customer}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">{order.payment}</td>
                        <td className="px-4 py-4">{order.items} items</td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/orders/${order.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openStatusUpdateModal(order)}
                              >
                                Update Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {orders.length} of {pagination.total} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={pagination.page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={pagination.page >= pagination.pages || loading}
                  className="gap-1"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Update Modal */}
      <Dialog
        open={statusUpdateModal.isOpen}
        onOpenChange={closeStatusUpdateModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order #{statusUpdateModal.order?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Order Status
              </label>
              <Select
                value={statusUpdateModal.newStatus}
                onValueChange={value =>
                  setStatusUpdateModal(prev => ({ ...prev, newStatus: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cancellation Reason Field - Only show when status is CANCELLED */}
            {statusUpdateModal.newStatus === "CANCELLED" && (
              <div className="space-y-2">
                <label
                  htmlFor="cancellationReason"
                  className="text-sm font-medium"
                >
                  Cancellation Reason{" "}
                  <span className="text-muted-foreground">(Optional)</span>
                </label>
                <Textarea
                  id="cancellationReason"
                  placeholder="Enter the reason for cancelling this order (will be included in the email to customer)..."
                  value={statusUpdateModal.cancellationReason}
                  onChange={e =>
                    setStatusUpdateModal(prev => ({
                      ...prev,
                      cancellationReason: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be sent to the customer in the cancellation
                  email.
                </p>
              </div>
            )}

            {statusUpdateModal.order && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Customer:</strong> {statusUpdateModal.order.customer}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Current Status:</strong>{" "}
                  {statusUpdateModal.order.status}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Total:</strong>{" "}
                  {formatPrice(statusUpdateModal.order.total)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeStatusUpdateModal}
              disabled={statusUpdateModal.updating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={updateOrderStatus}
              disabled={
                statusUpdateModal.updating ||
                !statusUpdateModal.newStatus ||
                statusUpdateModal.newStatus ===
                  statusUpdateModal.order?.status.toUpperCase()
              }
            >
              {statusUpdateModal.updating ? (
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
