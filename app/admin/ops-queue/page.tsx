"use client";

import {
  Copy,
  ExternalLink,
  PackagePlus,
  RefreshCw,
  Truck,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

type OpsQueueOrder = {
  dbId: string;
  id: string; // display order number (or fallback)
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

type OrdersApiResponse = {
  orders: OpsQueueOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

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

const canCreateSupplierLines = (order: OpsQueueOrder) =>
  order.workflowLabel === "Create supplier lines";

export default function OpsQueuePage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OpsQueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("30");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [runningBulkCreate, setRunningBulkCreate] = useState(false);
  const [runningRowCreateId, setRunningRowCreateId] = useState<string | null>(null);

  const fetchQueue = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    if (!showRefreshSpinner) setLoading(true);
    try {
      const params = new URLSearchParams({
        workflowBucket: "needs_action",
        limit: "100",
      });
      if (period !== "all") params.set("period", period);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch ops queue");
      }

      const data = (await response.json()) as OrdersApiResponse;
      const nextOrders = Array.isArray(data.orders) ? data.orders : [];
      setOrders(nextOrders);
      setSelectedIds(prev => {
        const allowed = new Set(nextOrders.map(order => order.dbId));
        const next: Record<string, boolean> = {};
        for (const [id, selected] of Object.entries(prev)) {
          if (selected && allowed.has(id)) next[id] = true;
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to fetch ops queue:", error);
      toast({
        title: "Error",
        description: "Failed to load Ops Queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, search, toast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const selectedOrders = useMemo(
    () => orders.filter(order => selectedIds[order.dbId]),
    [orders, selectedIds]
  );

  const allVisibleSelected =
    orders.length > 0 && orders.every(order => selectedIds[order.dbId]);
  const someVisibleSelected = orders.some(order => selectedIds[order.dbId]);

  const createSupplierLinesForOrder = async (order: OpsQueueOrder) => {
    if (!canCreateSupplierLines(order)) return false;

    try {
      const response = await fetch("/api/admin/orders/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.dbId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create supplier lines");
      }

      return true;
    } catch (error) {
      console.error(`Failed creating supplier lines for ${order.id}:`, error);
      return false;
    }
  };

  const handleRowCreateSupplierLines = async (order: OpsQueueOrder) => {
    setRunningRowCreateId(order.dbId);
    const ok = await createSupplierLinesForOrder(order);
    setRunningRowCreateId(null);

    toast({
      title: ok ? "Success" : "Error",
      description: ok
        ? `Supplier lines created for ${order.id}`
        : `Failed to create supplier lines for ${order.id}`,
      variant: ok ? "default" : "destructive",
    });
    if (ok) {
      await fetchQueue(true);
    }
  };

  const handleBulkCreateSupplierLines = async () => {
    const eligible = selectedOrders.filter(canCreateSupplierLines);
    if (eligible.length === 0) {
      toast({
        title: "No eligible orders",
        description: "Select orders that need supplier lines first.",
      });
      return;
    }

    setRunningBulkCreate(true);
    let successCount = 0;
    for (const order of eligible) {
      const ok = await createSupplierLinesForOrder(order);
      if (ok) successCount += 1;
    }
    setRunningBulkCreate(false);

    toast({
      title: successCount > 0 ? "Bulk action complete" : "Bulk action failed",
      description: `${successCount}/${eligible.length} order(s) processed.`,
      variant: successCount > 0 ? "default" : "destructive",
    });

    await fetchQueue(true);
  };

  const handleCopySelected = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No selection",
        description: "Select at least one order first.",
      });
      return;
    }

    const payload = selectedOrders
      .map(order =>
        [
          `Order: ${order.id}`,
          `Customer: ${order.customer}`,
          `Email: ${order.email}`,
          `Workflow: ${order.workflowLabel || "-"}`,
          `Fulfillment: ${formatWorkflowStatusLabel(order.fulfillmentStatus) || "-"}`,
          `Items: ${order.items}`,
          `Total: ${order.total} RON`,
          `Link: /admin/orders/${order.id}`,
        ].join(" | ")
      )
      .join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      toast({
        title: "Copied",
        description: `${selectedOrders.length} order(s) copied.`,
      });
    } catch (error) {
      console.error("Failed to copy selected queue rows:", error);
      toast({
        title: "Error",
        description: "Failed to copy selected orders.",
        variant: "destructive",
      });
    }
  };

  const handleOpenSelected = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No selection",
        description: "Select at least one order first.",
      });
      return;
    }

    selectedOrders.slice(0, 10).forEach(order => {
      window.open(`/admin/orders/${order.id}`, "_blank", "noopener,noreferrer");
    });

    toast({
      title: "Opened orders",
      description:
        selectedOrders.length > 10
          ? "Opened first 10 selected orders to avoid popup blocking."
          : `Opened ${selectedOrders.length} selected order(s).`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Ops Queue</h1>
          <p className="text-sm text-muted-foreground">
            Needs-action orders only. Use bulk actions to move faster.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/orders">Open All Orders</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchQueue(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Needs Action Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search order number / customer / email"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-[320px]"
              />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => fetchQueue(true)}>
                Apply
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySelected}
                disabled={selectedOrders.length === 0}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSelected}
                disabled={selectedOrders.length === 0}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Selected
              </Button>
              <Button
                size="sm"
                onClick={handleBulkCreateSupplierLines}
                disabled={
                  runningBulkCreate ||
                  selectedOrders.filter(canCreateSupplierLines).length === 0
                }
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                {runningBulkCreate ? "Processing..." : "Create Supplier Lines"}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
            <span>Total in queue: {orders.length}</span>
            <span>Selected: {selectedOrders.length}</span>
            <span>
              Eligible for Create Supplier Lines:{" "}
              {selectedOrders.filter(canCreateSupplierLines).length}
            </span>
          </div>

          <div className="rounded-md border overflow-x-auto">
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading ops queue...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No needs-action orders found for the current filters.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 w-10">
                      <Checkbox
                        checked={allVisibleSelected || (someVisibleSelected ? "indeterminate" : false)}
                        onCheckedChange={checked => {
                          const shouldSelect = checked === true;
                          setSelectedIds(prev => {
                            const next = { ...prev };
                            for (const order of orders) {
                              if (shouldSelect) next[order.dbId] = true;
                              else delete next[order.dbId];
                            }
                            return next;
                          });
                        }}
                        aria-label="Select all visible orders"
                      />
                    </th>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Action Needed</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Inline Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const selected = Boolean(selectedIds[order.dbId]);
                    const createEligible = canCreateSupplierLines(order);

                    return (
                      <tr
                        key={order.dbId}
                        className={`border-b align-top ${selected ? "bg-blue-50/30" : ""}`}
                      >
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={checked => {
                              setSelectedIds(prev => ({
                                ...prev,
                                [order.dbId]: checked === true,
                              }));
                            }}
                            aria-label={`Select order ${order.id}`}
                          />
                        </td>
                        <td className="px-3 py-3 min-w-[180px]">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {order.id}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getWorkflowBucketBadgeClasses(order.workflowBucket)}`}
                            >
                              {order.workflowLabel || "Needs action"}
                            </span>
                            {order.fulfillmentStatus && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                {formatWorkflowStatusLabel(order.fulfillmentStatus)}
                              </span>
                            )}
                          </div>
                          {order.manualShippingReviewRequired && (
                            <p className="mt-1 text-[11px] text-amber-700">
                              {order.shippingReviewReason || "Manual shipping review required"}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 min-w-[220px]">
                          <div>{order.customer}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.email}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {order.items} items • {order.total} RON • {order.payment}
                          </div>
                        </td>
                        <td className="px-3 py-3 min-w-[260px]">
                          <p className="text-xs text-muted-foreground">
                            {createEligible
                              ? "Create supplier lines first, then continue in order details."
                              : "Open order details and use the supplier workflow quick actions."}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs">
                            <div>{order.status}</div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">{order.date}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/orders/${order.id}`}>Open</Link>
                            </Button>
                            {createEligible && (
                              <Button
                                size="sm"
                                onClick={() => handleRowCreateSupplierLines(order)}
                                disabled={runningRowCreateId === order.dbId}
                              >
                                <PackagePlus className="mr-2 h-4 w-4" />
                                {runningRowCreateId === order.dbId
                                  ? "Creating..."
                                  : "Create Supplier Lines"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
