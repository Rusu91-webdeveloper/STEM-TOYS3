"use client";

import { Package, Eye, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";

// Define order status type
type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

// Define order item type
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  quantity: number;
  image: string;
  hasReviewed: boolean;
  isDigital: boolean;
}

// Define order type
export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  deliveredAt?: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface OrderHistoryProps {
  initialOrders: Order[];
}

// Function to get the status badge variant
const getStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case "processing":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "shipped":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    case "delivered":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "";
  }
};

// Helper function to check if order is within 14-day return window
const isWithinReturnWindow = (order: Order) => {
  if (order.status !== "delivered") {
    return false;
  }

  // Use deliveredAt if available, otherwise fall back to order creation date
  const referenceDate = order.deliveredAt
    ? new Date(order.deliveredAt)
    : new Date(order.date);

  const today = new Date();
  const diffTime = today.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Allow returns within 14 days of delivery (or order creation if deliveredAt is not set)
  return diffDays <= 14;
};

// Helper function to check if order has returnable items (non-digital items)
const hasReturnableItems = (order: Order) => order.items.some(item => !item.isDigital);

export function OrderHistory({ initialOrders }: OrderHistoryProps) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState("all");
  const { formatPrice } = useCurrency();

  // Filter orders based on active tab
  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter(order => order.status === activeTab);

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {t("noOrdersYet", "Nu există comenzi încă")}
        </h3>
        <p className="text-gray-500 mb-6">
          {t(
            "whenPlaceOrders",
            "Când plasezi comenzi, acestea vor apărea aici"
          )}
        </p>
        <Button asChild>
          <Link href="/products">
            {t("continueShopping", "Continuă cumpărăturile")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6 gap-2">
          <TabsTrigger value="all">{t("all", "Toate")}</TabsTrigger>
          <TabsTrigger value="processing">
            {t("processing", "În procesare")}
          </TabsTrigger>
          <TabsTrigger value="shipped">{t("shipped", "Expediat")}</TabsTrigger>
          <TabsTrigger value="delivered">
            {t("delivered", "Livrat")}
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            {t("cancelled", "Anulat")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <Package className="h-10 w-10 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("noFilteredOrders")}
              </h3>
              <p className="text-gray-500">
                {t("noFilteredOrdersDescription")}
              </p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {t("orderNumber", "Order #")}
                        {order.orderNumber}
                      </CardTitle>
                      <CardDescription>
                        {t("placedOn", "Placed on ")}{" "}
                        {formatDate(new Date(order.date))}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getStatusBadgeVariant(
                        order.status
                      )} capitalize w-fit`}
                    >
                      {t(order.status, order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-3">
                    {order.items.map(item => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row gap-3"
                      >
                        <div className="h-16 w-16 rounded bg-muted overflow-hidden relative shrink-0 mx-auto sm:mx-0">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <div className="flex flex-col text-center sm:text-left">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="font-medium hover:underline"
                          >
                            {item.productName}
                          </Link>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                            <span>
                              {formatPrice(item.price)} x {item.quantity}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span>
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="font-medium">
                      {t("total", "Total")}: {formatPrice(order.total)}
                    </div>
                    <div className="text-sm">
                      {t("shippingTo", "Shipping to")}:{" "}
                      {order.shippingAddress.name}, {order.shippingAddress.city}
                      , {order.shippingAddress.state}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full sm:w-auto"
                  >
                    <Link href={`/account/orders/${order.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      {t("viewDetails", "View Details")}
                    </Link>
                  </Button>
                  {order.status === "delivered" &&
                    isWithinReturnWindow(order) &&
                    hasReturnableItems(order) && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <Link href={`/account/orders/${order.id}/return`}>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          {t("returnItem", "Return Items")}
                        </Link>
                      </Button>
                    )}
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
