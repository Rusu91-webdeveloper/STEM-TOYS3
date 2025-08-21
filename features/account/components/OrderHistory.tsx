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
const hasReturnableItems = (order: Order) =>
  order.items.some(item => !item.isDigital);

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
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6 gap-1 sm:gap-2 p-1">
          <TabsTrigger
            value="all"
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            {t("all", "Toate")}
          </TabsTrigger>
          <TabsTrigger
            value="processing"
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            {t("processing", "În procesare")}
          </TabsTrigger>
          <TabsTrigger
            value="shipped"
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            {t("shipped", "Expediat")}
          </TabsTrigger>
          <TabsTrigger
            value="delivered"
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            {t("delivered", "Livrat")}
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
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
              <Card
                key={order.id}
                className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg break-words line-clamp-1">
                        {t("orderNumber", "Order #")}
                        {order.orderNumber}
                      </CardTitle>
                      <CardDescription className="text-sm break-words mt-1">
                        {t("placedOn", "Placed on ")}{" "}
                        {formatDate(new Date(order.date))}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getStatusBadgeVariant(
                        order.status
                      )} capitalize w-fit text-xs sm:text-sm shrink-0 px-2 py-1`}
                    >
                      {t(order.status, order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 px-4 sm:px-6">
                  <div className="space-y-4">
                    {order.items.map(item => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 sm:flex-row sm:items-start p-3 sm:p-0 sm:bg-transparent bg-muted/30 rounded-lg sm:rounded-none"
                      >
                        <div className="h-16 w-16 rounded bg-muted overflow-hidden relative shrink-0 mx-auto sm:mx-0">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <div className="flex flex-col text-center sm:text-left min-w-0 flex-1">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="font-medium hover:underline text-sm sm:text-base line-clamp-2 break-words-safe"
                          >
                            {item.productName}
                          </Link>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                            <span className="whitespace-nowrap">
                              {formatPrice(item.price)} x {item.quantity}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-medium">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                    <div className="font-medium text-sm sm:text-base">
                      {t("total", "Total")}: {formatPrice(order.total)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground break-words">
                      {t("shippingTo", "Shipping to")}:{" "}
                      <span className="font-medium">
                        {order.shippingAddress.name}
                      </span>
                      <br className="sm:hidden" />
                      <span className="sm:inline">, </span>
                      <span className="break-words-safe">
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between px-4 sm:px-6 pb-4 sm:pb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
                  >
                    <Link href={`/account/orders/${order.id}`}>
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
                        className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
                      >
                        <Link href={`/account/orders/${order.id}/return`}>
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
