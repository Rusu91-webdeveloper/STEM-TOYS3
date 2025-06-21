"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CurrencyProvider, useCurrency } from "@/lib/currency";

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

  // Function to fetch orders from the API
  const fetchOrders = async () => {
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
      setOrders(data.orders || []);
      setPagination(data.pagination || pagination);
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
  };

  // Fetch orders on initial load and when filters change
  useEffect(() => {
    fetchOrders();
  }, [status, period, pagination.page]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setPagination({ ...pagination, page: 1 });
    fetchOrders();
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 });
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <Button
          variant="outline"
          className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <form
              onSubmit={handleSearch}
              className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="search"
                placeholder="Search orders or customers..."
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                type="submit"
                variant="outline"
                size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                defaultValue="all"
                value={status}
                onValueChange={(value) => setStatus(value)}>
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
                onValueChange={(value) => setPeriod(value)}>
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
                onClick={() => fetchOrders()}>
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
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b text-sm hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/orders/${order.id.toLowerCase()}`}
                          className="font-medium text-primary hover:underline">
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
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">{order.payment}</td>
                      <td className="px-4 py-4">{order.items} items</td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
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
                disabled={pagination.page <= 1 || loading}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.pages || loading}
                className="gap-1">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Make sure the component is wrapped with CurrencyProvider in _app.tsx or layout.tsx
