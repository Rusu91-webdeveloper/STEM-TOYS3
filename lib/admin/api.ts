"use client";

import { getApiUrl } from "@/lib/utils/api-url";

// Remove the import of cookies from next/headers
// import { cookies } from "next/headers";

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
}

export interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
}

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  sales: number;
  inventory: number;
}

export interface DashboardData {
  stats: DashboardStat[];
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
}

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
  period: number = 30
): Promise<DashboardData> {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(
      `${baseUrl}/api/admin/dashboard?period=${period}`,
      {
        cache: "no-store", // Don't cache this data
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Return empty data structure on error
    return {
      stats: [
        {
          title: "Total Revenue",
          value: "0.00 RON", // Default to RON currency
          change: "+0.0%",
          trend: "up",
          description: `Last ${period} days`,
        },
        {
          title: "Total Orders",
          value: "0",
          change: "+0.0%",
          trend: "up",
          description: `Last ${period} days`,
        },
        {
          title: "New Customers",
          value: "0",
          change: "+0.0%",
          trend: "up",
          description: `Last ${period} days`,
        },
        {
          title: "Total Products",
          value: "0",
          change: "+0.0%",
          trend: "up",
          description: "Active products",
        },
      ],
      recentOrders: [],
      topProducts: [],
    };
  }
}

export async function getOperationsOverview(): Promise<OperationsOverview | null> {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(`${baseUrl}/api/admin/operations-overview`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch operations overview: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching operations overview:", error);
    return null;
  }
}
