"use client";

import { ArrowLeft, Package, Star, Truck, Check, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productId: string;
  product: {
    images?: string[];
    slug?: string;
    isDigital?: boolean;
  } | null;
  reviews: {
    id: string;
  }[];
  isDigital?: boolean;
}

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  createdAt: string;
  deliveredAt?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  discountAmount?: number;
  couponCode?: string;
}

interface OrderDetailsClientProps {
  order: Order;
}

export function OrderDetailsClient({ order }: OrderDetailsClientProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "SHIPPED":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "DELIVERED":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "CANCELLED":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "";
    }
  };

  // Helper for payment status
  const getPaymentStatusBadgeVariant = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "PAID":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "PENDING":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "FAILED":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "REFUNDED":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default:
        return "";
    }
  };

  // Calculate estimated delivery date (just for display)
  const orderDate = new Date(order.createdAt);
  const estimatedDelivery = new Date(orderDate);
  estimatedDelivery.setDate(orderDate.getDate() + 7); // 7 days for delivery estimate

  // Helper function to check if order is within 14-day return window
  const isWithinReturnWindow = () => {
    if (order.status !== "DELIVERED") {
      return false;
    }

    // Use deliveredAt if available, otherwise fall back to order creation date
    const referenceDate = order.deliveredAt
      ? new Date(order.deliveredAt)
      : new Date(order.createdAt);

    const today = new Date();
    const diffTime = today.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Allow returns within 14 days of delivery (or order creation if deliveredAt is not set)
    return diffDays <= 14;
  };

  // Safe translation function that handles dynamic keys
  const safeT = (key: string, defaultValue?: string) => t(key, defaultValue);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/account/orders"
          className="flex items-center text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("backToOrders")}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("orderNumber")} {order.orderNumber}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("placedOn")} {formatDate(new Date(order.createdAt))}
            </p>
          </div>
          <div className="space-x-2">
            <Badge
              className={`${getStatusBadgeVariant(order.status)} capitalize`}
            >
              {safeT(order.status.toLowerCase())}
            </Badge>
            <Badge
              className={`${getPaymentStatusBadgeVariant(
                order.paymentStatus
              )} capitalize`}
            >
              {safeT(order.paymentStatus.toLowerCase())}
            </Badge>
          </div>
        </div>
      </div>

      {/* Order progress (for non-cancelled orders) */}
      {order.status !== "CANCELLED" && (
        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">{t("orderPlaced")}</div>
            {order.status === "SHIPPED" || order.status === "DELIVERED" ? (
              <div className="text-sm font-medium">{t("orderShipped")}</div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("processing")}
              </div>
            )}
            {order.status === "DELIVERED" ? (
              <div className="text-sm font-medium">{t("orderDelivered")}</div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {/* Using string concatenation as a workaround */}
                {`${t("estimatedDelivery")}: ${formatDate(estimatedDelivery)}`}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted"></div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center gap-1">
                <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`size-8 rounded-full ${
                    order.status === "SHIPPED" || order.status === "DELIVERED"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  } flex items-center justify-center`}
                >
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`size-8 rounded-full ${
                    order.status === "DELIVERED"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  } flex items-center justify-center`}
                >
                  <Check className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Order items */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-medium">{t("items")}</h3>
          <div className="border rounded-lg divide-y">
            {order.items.map(item => {
              const hasReviewed = item.reviews.length > 0;
              return (
                <div key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded bg-muted overflow-hidden relative shrink-0">
                      {item.product?.images?.[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="object-cover h-full w-full"
                        />
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between">
                        <div>
                          <Link
                            href={`/products/${item.product?.slug ?? "#"}`}
                            className="font-medium hover:underline"
                          >
                            {item.name}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(item.price)} × {item.quantity}
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                      <div className="mt-auto pt-2">
                        {order.status === "DELIVERED" && (
                          <>
                            {hasReviewed ? (
                              <div className="flex items-center text-sm text-green-600 mt-2">
                                <Check className="h-4 w-4 mr-1" />
                                {t("reviewSubmitted")}
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="mt-2 mr-2"
                              >
                                <Link
                                  href={`/account/orders/${order.id}/review?itemId=${item.id}&productId=${item.productId}`}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  {t("writeReview")}
                                </Link>
                              </Button>
                            )}
                            {/* Return Item Button - Only show for non-digital items */}
                            {isWithinReturnWindow() && !item.isDigital && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="mt-2"
                              >
                                <Link
                                  href={`/account/orders/${order.id}/return?itemId=${item.id}`}
                                >
                                  <Package className="h-4 w-4 mr-1" />
                                  {t("returnItem")}
                                </Link>
                              </Button>
                            )}
                            {/* Info message for digital items */}
                            {item.isDigital && (
                              <div className="flex items-center text-sm text-muted-foreground mt-2">
                                <FileText className="h-4 w-4 mr-1" />
                                Digital item - non-returnable
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium">{t("orderSummary")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              {/* **DISCOUNT LINE** */}
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="font-medium">
                    Discount {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span className="font-medium">
                    -{formatPrice(order.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{t("shipping")}</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("tax")}</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>{t("total")}</span>
                <span>{formatPrice(order.total)}</span>
              </div>

              {/* **SAVINGS HIGHLIGHT** */}
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-green-600 font-medium">
                    🎉 You saved {formatPrice(order.discountAmount)}!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping info */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium">{t("shippingInformation")}</h3>
            <address className="not-italic text-sm">
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
              <p>{order.shippingAddress.phone}</p>
            </address>
          </div>

          {/* Payment details */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-medium">{t("paymentDetails")}</h3>
            <div className="text-sm">
              <p>
                <span className="font-medium">{t("method")}: </span>
                {order.paymentMethod}
              </p>
              <p>
                <span className="font-medium">{t("status")}: </span>
                <span
                  className={
                    order.paymentStatus === "PAID"
                      ? "text-green-600"
                      : "text-amber-600"
                  }
                >
                  {safeT(order.paymentStatus.toLowerCase())}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
