"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";


const guestOrderSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  orderNumber: z.string().min(1, "Please enter your order number"),
});

type GuestOrderFormData = z.infer<typeof guestOrderSchema>;

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  deliveredAt?: string;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    isBook?: boolean;
  }>;
  shippingMethod?: {
    name: string;
    description: string;
  };
  trackingNumber?: string;
}

export function GuestOrderTracking() {
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestOrderFormData>({
    resolver: zodResolver(guestOrderSchema),
  });

  const trackOrder = async (data: GuestOrderFormData) => {
    setIsLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const response = await fetch("/api/guest-orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          orderNumber: data.orderNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Order not found or invalid credentials");
      }

      const order = await response.json();
      setOrderData(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatPrice = (price: number) => new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Your Order
          </CardTitle>
          <CardDescription>
            Enter your email address and order number to view your order details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(trackOrder)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g., ORD-123456"
                  {...register("orderNumber")}
                  className={errors.orderNumber ? "border-red-500" : ""}
                />
                {errors.orderNumber && (
                  <p className="text-sm text-red-600">
                    {errors.orderNumber.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Search className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Track Order
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Order Details */}
      {orderData && (
        <div className="space-y-6">
          {/* Order Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order #{orderData.orderNumber}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(orderData.orderDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {formatPrice(orderData.total)}
                    </span>
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(orderData.status)}>
                  {getStatusIcon(orderData.status)}
                  <span className="ml-2 capitalize">{orderData.status}</span>
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Delivery Address</h4>
                <div className="text-sm text-gray-600 mt-1">
                  <p>{orderData.shippingAddress.fullName}</p>
                  <p>{orderData.shippingAddress.addressLine1}</p>
                  <p>
                    {orderData.shippingAddress.city},{" "}
                    {orderData.shippingAddress.state}{" "}
                    {orderData.shippingAddress.postalCode}
                  </p>
                  <p>{orderData.shippingAddress.country}</p>
                </div>
              </div>

              {orderData.shippingMethod && (
                <div>
                  <h4 className="font-medium">Shipping Method</h4>
                  <p className="text-sm text-gray-600">
                    {orderData.shippingMethod.name} -{" "}
                    {orderData.shippingMethod.description}
                  </p>
                </div>
              )}

              {orderData.trackingNumber && (
                <div>
                  <h4 className="font-medium">Tracking Number</h4>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {orderData.trackingNumber}
                    </code>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://track.example.com/${orderData.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Track Package
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {orderData.deliveredAt && (
                <div>
                  <h4 className="font-medium text-green-700">Delivered</h4>
                  <p className="text-sm text-green-600">
                    {formatDate(orderData.deliveredAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                          {item.isBook && (
                            <Badge variant="outline" className="ml-2">
                              Digital Book
                            </Badge>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                    {index < orderData.items.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Mail className="w-5 h-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <p className="text-sm">
                If you have any questions about your order, please contact our
                support team at{" "}
                <a
                  href="mailto:support@techtots.com"
                  className="underline hover:no-underline"
                >
                  support@techtots.com
                </a>{" "}
                or call us at{" "}
                <a
                  href="tel:+1234567890"
                  className="underline hover:no-underline"
                >
                  (123) 456-7890
                </a>
                . Please include your order number when contacting us.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
