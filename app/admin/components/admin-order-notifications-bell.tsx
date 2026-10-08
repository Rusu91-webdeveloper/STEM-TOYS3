"use client";

import { Bell, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  type AdminOrderNotification,
  OrderNotificationItem,
} from "./order-notification-item";
import { useDashboardResource } from "./use-dashboard-resource";

const EMPTY_NOTIFICATIONS: AdminOrderNotification[] = [];
const STORAGE_KEY = "admin_order_notifications_last_seen_at";
const groups = [
  {
    key: "needs_action",
    label: "Necesită atenție",
    color: "bg-red-50 text-red-700",
  },
  {
    key: "in_progress",
    label: "În desfășurare",
    color: "bg-blue-50 text-blue-700",
  },
  { key: "done", label: "Încheiate", color: "bg-green-50 text-green-700" },
] as const;

export default function AdminOrderNotificationsBell() {
  const [refresh, setRefresh] = useState(0);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const resource = useDashboardResource<{
    notifications: AdminOrderNotification[];
  }>("/api/admin/notifications/orders?limit=12", refresh);
  const items = resource.data?.notifications ?? EMPTY_NOTIFICATIONS;
  const unreadCount = lastSeenAt
    ? items.filter(
        item =>
          new Date(item.createdAt).getTime() > new Date(lastSeenAt).getTime()
      ).length
    : 0;

  useEffect(() => {
    try {
      setLastSeenAt(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      setLastSeenAt(null);
    }
    setHydrated(true);
    const interval = window.setInterval(
      () => setRefresh(value => value + 1),
      30_000
    );
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hydrated && !lastSeenAt && items[0]?.createdAt) {
      setLastSeenAt(items[0].createdAt);
      try {
        window.localStorage.setItem(STORAGE_KEY, items[0].createdAt);
      } catch {
        /* Storage may be disabled. */
      }
    }
  }, [hydrated, items, lastSeenAt]);

  const markAllSeen = () => {
    const markAt = items[0]?.createdAt ?? new Date().toISOString();
    try {
      window.localStorage.setItem(STORAGE_KEY, markAt);
    } catch {
      /* Storage may be disabled. */
    }
    setLastSeenAt(markAt);
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (nextOpen) setRefresh(value => value + 1);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 text-slate-600"
          aria-label={`Notificări comenzi${unreadCount > 0 ? ` (${unreadCount} necitite)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && !resource.error && (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Comenzi recente</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={markAllSeen}
              disabled={items.length === 0 || !!resource.error}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Citite
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setRefresh(value => value + 1)}
              disabled={resource.loading}
              aria-label="Actualizează notificările"
            >
              {resource.loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        {resource.error && (
          <p
            role="alert"
            className="mx-3 mb-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"
          >
            Notificările nu au putut fi actualizate.
            {resource.data
              ? " Sunt afișate ultimele date încărcate."
              : " Reîncearcă folosind butonul de actualizare."}
          </p>
        )}
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {!resource.data && resource.loading ? (
            <p className="px-3 py-6 text-sm text-slate-500">
              Se încarcă notificările…
            </p>
          ) : !resource.error && items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-slate-500">
              Nu există comenzi recente.
            </p>
          ) : (
            groups.map(group => {
              const matching = items.filter(
                item => item.actionBucket === group.key
              );
              return (
                matching.length > 0 && (
                  <div key={group.key}>
                    <div
                      className={`px-3 py-2 text-xs font-medium ${group.color}`}
                    >
                      {group.label} · {matching.length}
                    </div>
                    {matching.map(item => (
                      <OrderNotificationItem
                        key={item.id}
                        item={item}
                        lastSeenAt={lastSeenAt}
                        onSeen={markAllSeen}
                      />
                    ))}
                  </div>
                )
              );
            })
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/orders" className="cursor-pointer">
            Vezi toate comenzile
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
