"use client";

import { AlertCircle, Clock3, Mail, RefreshCw, Truck } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FulfillmentIssue = {
  supplierOrderId: string;
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string | null;
    city: string | null;
    state: string | null;
  };
  supplier: {
    id: string;
    name: string;
  };
  item: {
    orderItemId: string;
    name: string;
    quantity: number;
    price: number;
  };
  status: string;
  phase: string;
  trackingNumber: string | null;
  supplierOrderRef: string | null;
  createdAt: string;
  updatedAt: string;
  oos: {
    issueAgeHours: number | null;
    inactivityHours: number | null;
    needsCustomerNotification: boolean;
    isSlaOverdue: boolean;
    dueReminderTypes: string[];
    latestDecision?: { timestamp?: string; data?: Record<string, string> };
    latestNotification?: { timestamp?: string };
  };
};

type ReminderRow = {
  supplierOrderId: string;
  orderId: string;
  orderNumber: string;
  supplierName: string;
  productName: string;
  status: string;
  type: string;
  priority: "MEDIUM" | "HIGH" | "URGENT";
  issueAgeHours: number | null;
  inactivityHours: number | null;
  lastDecisionAt: string | null;
  lastNotificationAt: string | null;
  lastReminderAt: string | null;
};

type FulfillmentIssuesResponse = {
  success: boolean;
  summary: {
    totalIssues: number;
    oosCount: number;
    delayedCount: number;
    needsCustomerNotificationCount: number;
    slaOverdueCount: number;
    remindersDueCount: number;
  };
  issues: FulfillmentIssue[];
  reminders: ReminderRow[];
};

function formatHours(hours: number | null | undefined) {
  if (typeof hours !== "number" || Number.isNaN(hours)) return "N/A";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${Math.floor(hours)}h`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function statusBadgeVariant(
  status: string
): "destructive" | "secondary" | "outline" {
  if (status === "ISSUE_OOS") return "destructive";
  if (status === "ISSUE_DELAYED") return "secondary";
  return "outline";
}

function priorityBadgeClass(priority: ReminderRow["priority"]) {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":
      return "bg-amber-100 text-amber-900 border-amber-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

export const dynamic = "force-dynamic";

export default function AdminFulfillmentIssuesPage() {
  const [data, setData] = useState<FulfillmentIssuesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      setError(null);
      const response = await fetch("/api/admin/fulfillment-issues", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load fulfillment issues");
      }
      setData(payload);
    } catch (err) {
      console.error("Error loading fulfillment issues:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load fulfillment issues"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const issueSummary = useMemo(() => data?.summary, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Fulfillment Issues
          </h1>
          <p className="text-sm text-muted-foreground">
            Central queue for out-of-stock and delayed supplier lines, plus
            reminders that need follow-up.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(false)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">Orders</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-red-900">
            <AlertCircle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {issueSummary?.totalIssues ?? (loading ? "..." : 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OOS</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-700">
            {issueSummary?.oosCount ?? (loading ? "..." : 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-700">
            {issueSummary?.delayedCount ?? (loading ? "..." : 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unnotified</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {issueSummary?.needsCustomerNotificationCount ??
              (loading ? "..." : 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {issueSummary?.slaOverdueCount ?? (loading ? "..." : 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reminders Due</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-blue-700">
            {issueSummary?.remindersDueCount ?? (loading ? "..." : 0)}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Issues Queue</TabsTrigger>
          <TabsTrigger value="reminders">
            Reminder Center
            {issueSummary?.remindersDueCount ? (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {issueSummary.remindersDueCount}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supplier Issue Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order / Item</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue Age</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Loading fulfillment issues...
                      </TableCell>
                    </TableRow>
                  ) : !data?.issues?.length ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No open supplier OOS/delay issues.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.issues.map(issue => (
                      <TableRow key={issue.supplierOrderId}>
                        <TableCell className="min-w-[240px]">
                          <div className="space-y-1">
                            <div className="font-medium">
                              #{issue.orderNumber}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {issue.item.name} ({issue.item.quantity}x)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Line: {issue.supplierOrderId.slice(-8)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{issue.supplier.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={statusBadgeVariant(issue.status)}>
                              {issue.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {issue.phase}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-1">
                            <div className="text-sm">{issue.customer.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {issue.customer.email || "No email"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {issue.customer.city || "Unknown city"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-1 text-sm">
                            <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatHours(issue.oos.issueAgeHours)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatHours(issue.oos.inactivityHours)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {issue.oos.needsCustomerNotification ? (
                              <Badge
                                variant="outline"
                                className="border-red-200 bg-red-50 text-red-700"
                              >
                                <Mail className="mr-1 h-3 w-3" />
                                Unnotified
                              </Badge>
                            ) : null}
                            {issue.oos.isSlaOverdue ? (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-800"
                              >
                                Follow-up overdue
                              </Badge>
                            ) : null}
                            {issue.oos.dueReminderTypes.length ? (
                              <Badge
                                variant="outline"
                                className="border-blue-200 bg-blue-50 text-blue-700"
                              >
                                {issue.oos.dueReminderTypes.length} reminder
                                {issue.oos.dueReminderTypes.length > 1
                                  ? "s"
                                  : ""}{" "}
                                due
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/orders/${issue.orderId}`}>
                              Open Order
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Reminder Center (Due Now)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                This list shows supplier issue lines that should trigger admin
                follow-up based on the same logic used by the OOS reminder cron.
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Reminder</TableHead>
                    <TableHead>Order / Supplier</TableHead>
                    <TableHead>Age / Inactivity</TableHead>
                    <TableHead>Last Reminder</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading reminders...
                      </TableCell>
                    </TableRow>
                  ) : !data?.reminders?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No reminder actions are due right now.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.reminders.map(reminder => (
                      <TableRow
                        key={`${reminder.supplierOrderId}-${reminder.type}`}
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={priorityBadgeClass(reminder.priority)}
                          >
                            {reminder.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-1">
                            <div className="font-medium">{reminder.type}</div>
                            <div className="text-xs text-muted-foreground">
                              {reminder.productName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-1">
                            <div className="font-medium">
                              #{reminder.orderNumber}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {reminder.supplierName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {reminder.status}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>
                              Issue: {formatHours(reminder.issueAgeHours)}
                            </div>
                            <div>
                              Inactive: {formatHours(reminder.inactivityHours)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(reminder.lastReminderAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/orders/${reminder.orderId}`}>
                              <Truck className="mr-2 h-4 w-4" />
                              Resolve
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
