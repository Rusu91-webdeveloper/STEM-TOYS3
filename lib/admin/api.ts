"use client";

import type { DashboardData } from "@/lib/admin/dashboard-types";
import { getApiUrl } from "@/lib/utils/api-url";

export type {
  DashboardData,
  RecentOrder,
  TopProduct,
} from "@/lib/admin/dashboard-types";

export interface OperationsSupplierTaskLine {
  supplierOrderId: string;
  orderId: string;
  orderNumber: string;
  supplierName: string;
  status: string;
  itemName: string;
  quantity: number;
  customerName: string;
  customerEmail: string | null;
  city: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  orderCreatedAt: string | null;
  paymentStatus: string;
  trackingNumber: string | null;
  supplierOrderRef: string | null;
  lineAmount: number;
}

export interface OperationsIssueLine {
  supplierOrderId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  supplierName: string;
  itemName: string;
  quantity: number;
  customerName: string;
  customerEmail: string | null;
  city: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  issueAgeHours: number | null;
  inactivityHours: number | null;
  needsCustomerNotification: boolean;
  isSlaOverdue: boolean;
  lineAmount: number;
}

export interface OperationsReturnTask {
  returnId: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  itemName: string;
  reason: string;
  status: string;
  supplierAuthorizationStatus: string | null;
  supplierAuthorizationDeadline: string | null;
  supplierAuthorizationRequestedAt: string | null;
  supplierName: string;
  customerName: string;
  customerEmail: string | null;
  city: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  authDeadlineHours: number | null;
  isAuthOverdue: boolean;
  lineAmount: number;
}

export interface SupplierHealthCard {
  supplierId: string;
  supplierName: string;
  openLines: number;
  readyToPlace: number;
  awbWork: number;
  issues: number;
  last7dLines: number;
  oosRate7d: number | null;
  delayRate7d: number | null;
  avgHoursToShip7d: number | null;
  latestSyncJob: {
    jobType: string;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    failed: number;
    updated: number;
    imported: number;
    error: string | null;
  } | null;
}

export interface OperationsOverview {
  success: boolean;
  generatedAt: string;
  summary: {
    readyToPlaceCount: number;
    awbWorkCount: number;
    issueCount: number;
    unnotifiedIssueCount: number;
    overdueIssueCount: number;
    returnsWaitingAuthCount: number;
    returnsAuthOverdueCount: number;
    manualRefundsPendingCount: number;
    financialRisk: {
      issueValueAtRisk: number;
      returnsPendingValue: number;
      manualRefundsPendingEstimatedAmount: number;
      readyToPlaceValue: number;
      awbWorkValue: number;
    };
  };
  actionCenter: {
    readyToPlaceLines: OperationsSupplierTaskLine[];
    awbWorkLines: OperationsSupplierTaskLine[];
    issueLines: OperationsIssueLine[];
    returnsWaitingAuth: OperationsReturnTask[];
  };
  supplierHealth: SupplierHealthCard[];
  automationHealth: {
    supplierSync: Array<{
      supplierId: string;
      supplierName: string;
      jobType: string;
      status: string;
      startedAt: string | null;
      finishedAt: string | null;
      failed: number;
      imported: number;
      updated: number;
      error: string | null;
    }>;
    email24h: {
      sent: number;
      failed: number;
      other: number;
    };
    oosReminders: {
      lastReminderNoteAt: string | null;
      reminderActivityCount24h: number;
      reminderErrorCount24h: number;
    };
  };
}

/**
 * Fetches dashboard data from the API with client-side authentication
 */
export async function getDashboardData(
  period = 30,
  signal?: AbortSignal
): Promise<DashboardData> {
  const response = await fetch(
    `${getApiUrl()}/api/admin/dashboard?period=${period}`,
    {
      cache: "no-store",
      signal,
    }
  );
  if (!response.ok)
    throw new Error("Datele magazinului nu au putut fi încărcate.");
  return response.json();
}

export async function getOperationsOverview(
  signal?: AbortSignal
): Promise<OperationsOverview> {
  const response = await fetch(`${getApiUrl()}/api/admin/operations-overview`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok)
    throw new Error("Situația operațională nu a putut fi încărcată.");
  return response.json();
}
