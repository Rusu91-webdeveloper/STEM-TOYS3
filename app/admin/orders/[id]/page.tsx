"use client";

import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  Save,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/lib/currency";

// Types
type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isDigital: boolean;
  returnStatus: string | null;
  isBook: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  } | null;
  book: {
    id: string;
    name: string;
    author: string;
    slug: string;
    coverImage: string;
  } | null;
};

type OrderDetails = {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  date: string;
  deliveredAt?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  items: OrderItem[];
};

// Helper functions
const getStatusIcon = (status: string) => {
  switch (status.toUpperCase()) {
    case "COMPLETED":
    case "DELIVERED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "PROCESSING":
      return <Clock className="h-4 w-4" />;
    case "SHIPPED":
      return <Truck className="h-4 w-4" />;
    case "CANCELLED":
      return <Ban className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "COMPLETED":
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStatus = (status: string): string =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

export default function OrderDetailsPage() {
  const params = useParams();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  const orderId = params.id as string;

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      setOrder(data.order);
      setNewStatus(data.order.status);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  // Update order status
  const updateOrderStatus = async () => {
    if (!order || !newStatus || newStatus === order.status) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus.toUpperCase(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      // Update local state
      setOrder(prev => (prev ? { ...prev, status: newStatus } : null));

      toast({
        title: "Success",
        description: `Order status updated to ${formatStatus(newStatus)}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading order details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Order Not Found</h3>
              <p className="text-muted-foreground">
                The requested order could not be found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Placed on {new Date(order.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Status Update Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}
            >
              {getStatusIcon(order.status)}
              {formatStatus(order.status)}
            </span>
          </div>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={updateOrderStatus}
            disabled={updating || newStatus === order.status}
            size="sm"
          >
            {updating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Update
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map(item => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {item.isBook ? (
                        <Image
                          src={
                            item.book?.coverImage ??
                            "/images/book-placeholder.jpg"
                          }
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <Image
                          src={
                            item.product?.images?.[0] ??
                            "/images/product-placeholder.jpg"
                          }
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.isBook && item.book && (
                        <p className="text-sm text-muted-foreground">
                          by {item.book.author}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>Price: {formatPrice(item.price)}</span>
                        <span>
                          Total: {formatPrice(item.price * item.quantity)}
                        </span>
                        {item.isDigital && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                            Digital
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.customer}</p>
                <p className="text-sm text-muted-foreground">{order.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="pt-2 text-muted-foreground">
                    Phone: {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Method:</span>
                <span className="text-sm font-medium">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <span className="text-sm font-medium capitalize">
                  {order.paymentStatus}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount {order.couponCode && `(${order.couponCode})`}:
                  </span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
