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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  manualShippingReviewRequired?: boolean;
  shippingReviewReason?: string | null;
  workflowBucket?: "needs_action" | "in_progress" | "done";
  workflowLabel?: string;
  fulfillmentStatus?: string;
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

const formatWorkflowStatusLabel = (value?: string) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getWorkflowBucketBadgeClasses = (bucket?: string) => {
  switch (bucket) {
    case "needs_action":
      return "bg-red-100 text-red-800";
    case "done":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}
    >
      {getStatusIcon(status)}
      {status}
    </span>
  );
}

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
  const [workflowBucket, setWorkflowBucket] = useState("all");
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
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    order: null as Order | null,
    deleting: false,
  });

  // Function to fetch orders from the API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (period !== "all") params.append("period", period);
      if (workflowBucket !== "all") {
        params.append("workflowBucket", workflowBucket);
      }
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store", // Prevent browser caching
        headers: {
          "Cache-Control": "no-cache", // Additional cache prevention
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders ?? []);
      setPagination(prev => data.pagination ?? prev);
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
  }, [
    status,
    workflowBucket,
    period,
    searchTerm,
    pagination.page,
    pagination.limit,
    toast,
  ]);

  // Function to open status update modal
  const openStatusUpdateModal = (order: Order) => {
    setStatusUpdateModal({
      isOpen: true,
      order,
      newStatus: order.status.toUpperCase(),
      cancellationReason: "",
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
      const requestBody: {
        status: string;
        cancellationReason?: string;
      } = {
        status: statusUpdateModal.newStatus,
      };

      // Add cancellation reason if cancelling the order
      if (
        statusUpdateModal.newStatus === "CANCELLED" &&
        statusUpdateModal.cancellationReason &&
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
          cache: "no-store", // Prevent caching of the update request
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      await response.json();

      // Close modal first
      closeStatusUpdateModal();

      // Show success message
      toast({
        title: "Success",
        description: `Order status updated to ${formatStatus(statusUpdateModal.newStatus)}`,
      });

      // Re-fetch orders from server to ensure we have the latest data
      // This prevents any sync issues between frontend and backend
      await fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
      setStatusUpdateModal(prev => ({ ...prev, updating: false }));
    }
  };

  const openDeleteModal = (order: Order) => {
    setDeleteModal({ isOpen: true, order, deleting: false });
  };

  const closeDeleteModal = () => {
    if (deleteModal.deleting) return;
    setDeleteModal({ isOpen: false, order: null, deleting: false });
  };

  const handleDeleteDialogChange = (open: boolean) => {
    if (!open) {
      closeDeleteModal();
    }
  };

  const deleteOrder = async () => {
    if (!deleteModal.order || deleteModal.deleting) return;

    setDeleteModal(prev => ({ ...prev, deleting: true }));

    try {
      const response = await fetch(
        `/api/admin/orders/${deleteModal.order.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete order");
      }

      toast({
        title: "Order deleted",
        description: `Order ${deleteModal.order.id} has been deleted.`,
      });

      setDeleteModal({ isOpen: false, order: null, deleting: false });
      await fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive",
      });
      setDeleteModal(prev => ({ ...prev, deleting: false }));
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Orders</h1>
          <Button variant="outline" className="flex items-center gap-2 self-start sm:self-auto">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:gap-6">
              <form
                onSubmit={handleSearch}
                className="flex w-full items-center gap-2 sm:max-w-sm"
              >
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="outline" size="icon" className="shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-row">
                <Select
                  defaultValue="all"
                  value={status}
                  onValueChange={value => setStatus(value)}
                >
                  <SelectTrigger className="w-full xl:w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="shipping_review">⚠️ Needs Shipping Review</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  defaultValue="all"
                  value={workflowBucket}
                  onValueChange={value => setWorkflowBucket(value)}
                >
                  <SelectTrigger className="w-full xl:w-[170px]">
                    <SelectValue placeholder="Workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workflow</SelectItem>
                    <SelectItem value="needs_action">Needs Action</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  defaultValue="30"
                  value={period}
                  onValueChange={value => setPeriod(value)}
                >
                  <SelectTrigger className="w-full xl:w-[160px]">
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
                  className="w-full xl:w-10"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-6">
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
                <>
                  <div className="space-y-3 md:hidden">
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className="rounded-xl border bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="break-all font-medium text-primary hover:underline"
                              >
                                {order.id}
                              </Link>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {order.date}
                              </p>
                            </div>
                            <OrderStatusBadge status={order.status} />
                          </div>

                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {order.customer}
                            </p>
                            <p className="break-all text-sm text-muted-foreground">
                              {order.email}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {order.manualShippingReviewRequired && (
                              <div
                                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                                title={
                                  order.shippingReviewReason ||
                                  "Requires shipping review"
                                }
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Shipping Review
                              </div>
                            )}
                            {order.workflowLabel && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${getWorkflowBucketBadgeClasses(order.workflowBucket)}`}
                              >
                                {order.workflowLabel}
                              </span>
                            )}
                            {order.fulfillmentStatus && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">
                                {formatWorkflowStatusLabel(
                                  order.fulfillmentStatus
                                )}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Total
                              </p>
                              <p className="font-medium">
                                {formatPrice(order.total)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Payment
                              </p>
                              <p className="font-medium">{order.payment}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Items
                              </p>
                              <p className="font-medium">{order.items} items</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                Workflow
                              </p>
                              <p className="font-medium">
                                {order.workflowLabel || "Standard"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                View
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => openStatusUpdateModal(order)}
                            >
                              Update
                            </Button>
                            <Button
                              variant="ghost"
                              className="col-span-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openDeleteModal(order)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Order
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[700px] border-collapse">
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
                              {order.manualShippingReviewRequired && (
                                <div
                                  className="mt-1 flex items-center gap-1 text-amber-600"
                                  title={
                                    order.shippingReviewReason ||
                                    "Requires shipping review"
                                  }
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  <span className="text-xs font-medium">
                                    Shipping Review
                                  </span>
                                </div>
                              )}
                              {order.workflowLabel && (
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getWorkflowBucketBadgeClasses(order.workflowBucket)}`}
                                  >
                                    {order.workflowLabel}
                                  </span>
                                  {order.fulfillmentStatus && (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                      {formatWorkflowStatusLabel(
                                        order.fulfillmentStatus
                                      )}
                                    </span>
                                  )}
                                </div>
                              )}
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
                              <OrderStatusBadge status={order.status} />
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
                                    onClick={() =>
                                      openStatusUpdateModal(order)
                                    }
                                  >
                                    Update Status
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => openDeleteModal(order)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Order
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing {orders.length} of {pagination.total}
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

      <AlertDialog
        open={deleteModal.isOpen}
        onOpenChange={handleDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order and its related records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteModal.deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOrder}
              disabled={deleteModal.deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteModal.deleting ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
