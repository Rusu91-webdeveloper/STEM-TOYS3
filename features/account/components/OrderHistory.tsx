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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { cn, formatDate } from "@/lib/utils";

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
  returnStatus?: string;
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

// Helper to determine badge styling for statuses
const getStatusBadgeClasses = (status: OrderStatus) => {
  switch (status) {
    case "processing":
      return "border-sky-400/40 bg-sky-500/20 text-sky-100";
    case "shipped":
      return "border-amber-400/40 bg-amber-500/20 text-amber-100";
    case "delivered":
      return "border-emerald-400/40 bg-emerald-500/20 text-emerald-100";
    case "cancelled":
      return "border-rose-400/40 bg-rose-500/20 text-rose-100";
    default:
      return "border-white/20 bg-white/10 text-slate-100";
  }
};

// Helper function to check if order is within 14-day return window
const isWithinReturnWindow = (order: Order) => {
  if (order.status !== "delivered") {
    return false;
  }

  const referenceDate = order.deliveredAt
    ? new Date(order.deliveredAt)
    : new Date(order.date);

  const diffTime = Date.now() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 14;
};

// Helper function to check if order has returnable items 
// (non-digital items that haven't already been returned/requested)
const hasReturnableItems = (order: Order) =>
  order.items.some(
    item => !item.isDigital && (!item.returnStatus || item.returnStatus === "NONE")
  );

const TABS = [
  { value: "all", labelKey: "all", fallback: "Toate" },
  { value: "processing", labelKey: "processing", fallback: "În procesare" },
  { value: "shipped", labelKey: "shipped", fallback: "Expediat" },
  { value: "delivered", labelKey: "delivered", fallback: "Livrat" },
  { value: "cancelled", labelKey: "cancelled", fallback: "Anulat" },
];

export function OrderHistory({ initialOrders }: OrderHistoryProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [orders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter(order => order.status === activeTab);

  if (orders.length === 0) {
    return (
      <div
        className={cn(
          glassPanelClass,
          "space-y-4 rounded-3xl border-white/10 bg-slate-900/70 p-10 text-center text-slate-100 shadow-xl shadow-black/30"
        )}
      >
        <ShoppingBag className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="text-lg font-semibold">
          {t("noOrdersYet", "Nu există comenzi încă")}
        </h3>
        <p className="text-slate-300">
          {t(
            "whenPlaceOrders",
            "Când plasezi comenzi, acestea vor apărea aici"
          )}
        </p>
        <Button
          asChild
          className={cn(
            "mx-auto inline-flex min-w-[200px] justify-center transition hover:scale-[1.02]",
            gradientButtonClass
          )}
        >
          <Link href="/products">
            {t("continueShopping", "Continuă cumpărăturile")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList
          className={cn(
            glassPanelClass,
            "mb-6 grid grid-cols-2 gap-1 border-white/10 bg-slate-900/70 p-1 sm:grid-cols-3 md:grid-cols-5"
          )}
        >
          {TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-xl border border-transparent px-2 py-1.5 text-xs transition-all data-[state=active]:border-sky-400/40 data-[state=active]:bg-sky-500/20 data-[state=active]:text-white sm:px-3 sm:py-2 sm:text-sm"
            >
              {t(tab.labelKey as any, tab.fallback)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div
              className={cn(
                glassPanelClass,
                "space-y-3 rounded-3xl border-white/10 bg-slate-900/70 p-8 text-center text-slate-100"
              )}
            >
              <Package className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="text-lg font-semibold">
                {t("noFilteredOrders", "Nu există comenzi pentru filtru")}
              </h3>
              <p className="text-slate-300">
                {t(
                  "noFilteredOrdersDescription",
                  "Încearcă să ajustezi filtrele pentru a vedea alte comenzi"
                )}
              </p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const statusClasses = getStatusBadgeClasses(order.status);

              return (
                <Card
                  key={order.id}
                  className={cn(
                    glassCardClass,
                    "overflow-hidden border-white/10 bg-slate-900/60 text-slate-100 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_25px_50px_-12px_rgba(8,47,73,0.65)]"
                  )}
                >
                  <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-1 break-words text-base sm:text-lg">
                          {t("orderNumber", "Order #")}
                          {order.orderNumber}
                        </CardTitle>
                        <CardDescription className="mt-1 break-words text-sm text-slate-300">
                          {t("placedOn", "Plasată pe ")}
                          {formatDate(new Date(order.date))}
                        </CardDescription>
                      </div>
                      <Badge
                        className={cn(
                          "w-fit shrink-0 border px-2 py-1 text-xs uppercase tracking-wide sm:text-sm",
                          statusClasses
                        )}
                      >
                        {t(order.status, order.status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 pb-3 sm:px-6">
                    <div className="space-y-4">
                      {order.items.map(item => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-start sm:rounded-xl"
                        >
                          <div className="relative mx-auto h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:mx-0">
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col text-center sm:text-left">
                            <Link
                              href={`/products/${item.productSlug}`}
                              className="text-sm font-medium text-slate-100 transition hover:text-sky-300 hover:underline sm:text-base"
                            >
                              {item.productName}
                            </Link>
                            <div className="mt-1 flex flex-col gap-1 text-xs text-slate-300 sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                              <span className="whitespace-nowrap">
                                {formatPrice(item.price)} × {item.quantity}
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

                    <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold sm:text-base">
                        {t("total", "Total")}: {formatPrice(order.total)}
                      </div>
                      <div className="break-words text-xs text-slate-300 sm:text-sm">
                        {t("shippingTo", "Livrare către")}: {" "}
                        <span className="font-medium text-slate-100">
                          {order.shippingAddress.name}
                        </span>
                        <br className="sm:hidden" />
                        <span className="sm:inline">, </span>
                        <span className="break-words-safe">
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:justify-between sm:px-6 sm:pb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-9 w-full border-white/20 bg-white/10 text-xs text-slate-100 transition hover:border-white/30 hover:bg-white/15 sm:h-10 sm:w-auto sm:text-sm"
                    >
                      <Link href={`/account/orders/${order.id}`}>
                        <Eye className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {t("viewDetails", "View Details")}
                      </Link>
                    </Button>

                    {/* Return Items Button - Active only when:
                        1. Order is delivered
                        2. Within 14-day return window
                        3. Has items that can be returned (non-digital, no existing return request)
                    */}
                    {order.status === "delivered" &&
                      isWithinReturnWindow(order) &&
                      hasReturnableItems(order) && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-9 w-full border-rose-400/40 bg-rose-500/15 text-xs text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-500/25 sm:h-10 sm:w-auto sm:text-sm"
                        >
                          <Link href={`/account/orders/${order.id}/return`}>
                            <ArrowRight className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            {t("returnItem", "Return Items")}
                          </Link>
                        </Button>
                      )}

                    {/* Disabled Return Button - When 14-day window expired */}
                    {order.status === "delivered" &&
                      !isWithinReturnWindow(order) &&
                      order.items.some(item => !item.isDigital) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-9 w-full cursor-not-allowed border-slate-500/40 bg-slate-500/15 text-xs text-slate-400 opacity-60 sm:h-10 sm:w-auto sm:text-sm"
                        >
                          <Package className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {t("returnWindowExpired", "Return window expired (14 days)")}
                        </Button>
                      )}

                    {/* Disabled Return Button - When all items already have return requests */}
                    {order.status === "delivered" &&
                      isWithinReturnWindow(order) &&
                      order.items.some(item => !item.isDigital) &&
                      !hasReturnableItems(order) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-9 w-full cursor-not-allowed border-amber-400/40 bg-amber-500/15 text-xs text-amber-300 opacity-60 sm:h-10 sm:w-auto sm:text-sm"
                        >
                          <Package className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {t("returnAlreadyRequested", "Return already requested")}
                        </Button>
                      )}
                  </CardFooter>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
