"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminOrderNotification = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
  createdAt: string;
  manualShippingReviewRequired: boolean;
  shippingReviewReason?: string | null;
  customerName: string;
  customerEmail: string | null;
  supplierOrderCount: number;
  hasPhysicalItems: boolean;
  hasTracking: boolean;
  fulfillmentStatus: string;
  actionBucket: "needs_action" | "in_progress" | "done";
  actionLabel: string;
};

const STORAGE_KEY = "admin_order_notifications_last_seen_at";
const POLL_INTERVAL_MS = 30_000;

const formatOrderStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

const formatFulfillmentStatus = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminOrderNotificationsBell() {
  const [items, setItems] = useState<AdminOrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      setLastSeenAt(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      setLastSeenAt(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const fetchNotifications = async (showLoader = false) => {
    if (showLoader) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/admin/notifications/orders?limit=12", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load admin notifications");
      }

      const data = await response.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (error) {
      console.error("Failed to fetch admin order notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;

    fetchNotifications();
    const intervalId = window.setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    if (!lastSeenAt) {
      if (items[0]?.createdAt) {
        try {
          window.localStorage.setItem(STORAGE_KEY, items[0].createdAt);
          setLastSeenAt(items[0].createdAt);
        } catch {
          // no-op
        }
      }
      setUnreadCount(0);
      return;
    }

    const seenMs = new Date(lastSeenAt).getTime();
    if (Number.isNaN(seenMs)) {
      setUnreadCount(0);
      return;
    }

    const count = items.filter(item => {
      const itemMs = new Date(item.createdAt).getTime();
      return !Number.isNaN(itemMs) && itemMs > seenMs;
    }).length;

    setUnreadCount(count);
  }, [hydrated, items, lastSeenAt]);

  const markAllSeen = () => {
    const markAt = items[0]?.createdAt || new Date().toISOString();
    try {
      window.localStorage.setItem(STORAGE_KEY, markAt);
    } catch {
      // no-op
    }
    setLastSeenAt(markAt);
    setUnreadCount(0);
  };

  const needsActionItems = items.filter(item => item.actionBucket === "needs_action");
  const inProgressItems = items.filter(item => item.actionBucket === "in_progress");
  const doneItems = items.filter(item => item.actionBucket === "done");

  const renderNotificationItem = (item: AdminOrderNotification) => {
    const isUnread = (() => {
      if (!lastSeenAt) return false;
      const itemMs = new Date(item.createdAt).getTime();
      const seenMs = new Date(lastSeenAt).getTime();
      return !Number.isNaN(itemMs) && !Number.isNaN(seenMs)
        ? itemMs > seenMs
        : false;
    })();

    return (
      <DropdownMenuItem key={item.id} asChild className="p-0">
        <Link
          href={`/admin/orders/${item.id}`}
          onClick={markAllSeen}
          className="block px-3 py-3 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  #{item.orderNumber}
                </span>
                {isUnread && (
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-600 truncate">
                {item.customerName}
                {item.customerEmail ? ` • ${item.customerEmail}` : ""}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                    item.actionBucket === "needs_action"
                      ? "bg-red-100 text-red-800"
                      : item.actionBucket === "done"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {item.actionLabel}
                </span>
                <span className="text-[10px] rounded-full bg-slate-100 text-slate-700 px-1.5 py-0.5">
                  Fulfillment: {formatFulfillmentStatus(item.fulfillmentStatus)}
                </span>
                {item.hasTracking && (
                  <span className="text-[10px] rounded-full bg-slate-100 text-slate-700 px-1.5 py-0.5">
                    AWB/Tracking added
                  </span>
                )}
                {item.supplierOrderCount > 0 && (
                  <span className="text-[10px] rounded-full bg-slate-100 text-slate-700 px-1.5 py-0.5">
                    Supplier lines: {item.supplierOrderCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {formatOrderStatus(item.status)} • {item.total.toFixed(2)} lei
              </p>
              {item.manualShippingReviewRequired && item.shippingReviewReason ? (
                <p className="text-[11px] text-amber-700 line-clamp-2">
                  {item.shippingReviewReason}
                </p>
              ) : null}
            </div>
            <span className="text-[11px] text-gray-500 shrink-0">
              {formatDateTime(item.createdAt)}
            </span>
          </div>
        </Link>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (nextOpen) {
          fetchNotifications(true);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          aria-label={`Order notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[1.1rem] font-semibold text-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">New Orders</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={markAllSeen}
              disabled={items.length === 0}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Seen
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              aria-label="Refresh notifications"
            >
              {refreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div className="px-3 pb-2 text-[11px] text-gray-500 flex flex-wrap gap-3">
          <span>Needs action: {needsActionItems.length}</span>
          <span>In progress: {inProgressItems.length}</span>
          <span>Done: {doneItems.length}</span>
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-6 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications...
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-6 text-sm text-gray-500">
              No recent orders yet.
            </div>
          ) : (
            <>
              {needsActionItems.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50">
                    Needs Action
                  </div>
                  {needsActionItems.map(renderNotificationItem)}
                </>
              )}
              {inProgressItems.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50">
                    In Progress
                  </div>
                  {inProgressItems.map(renderNotificationItem)}
                </>
              )}
              {doneItems.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-green-700 bg-green-50">
                    Done
                  </div>
                  {doneItems.map(renderNotificationItem)}
                </>
              )}
            </>
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/orders" className="cursor-pointer">
            Open Orders
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
