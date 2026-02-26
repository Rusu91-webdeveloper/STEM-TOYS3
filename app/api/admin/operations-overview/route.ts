import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildOosOpsSnapshot } from "@/lib/utils/oos-ops";

const PREPAID_PAYMENT_STATUSES = ["PAID", "COMPLETED"] as const;
const TERMINAL_SUPPLIER_STATUSES = [
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

function toIso(date?: Date | null) {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function hoursBetween(start?: Date | null, end?: Date | null) {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return ms / (1000 * 60 * 60);
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const readyToPlaceWhere = {
      OR: [
        { status: "READY_TO_PLACE" },
        { status: "PENDING", supplierOrderId: null },
      ],
      order: {
        paymentStatus: { in: [...PREPAID_PAYMENT_STATUSES] },
      },
    } as const;

    const awbWorkWhere = {
      OR: [
        { status: "AWB_PENDING" },
        { status: "AWB_UPLOADED" },
        { status: "READY_TO_SHIP" },
      ],
      order: {
        paymentStatus: { in: [...PREPAID_PAYMENT_STATUSES] },
      },
    } as const;

    const issueWhere = {
      status: { in: ["ISSUE_OOS", "ISSUE_DELAYED"] },
    } as const;

    const [
      readyToPlaceCount,
      awbWorkCount,
      issueCount,
      readyToPlaceLines,
      awbWorkLines,
      issueLinesRaw,
      returnsWaitingAuthRaw,
      returnsWaitingAuthCount,
      returnsAuthOverdueCount,
      manualRefundPendingLines,
      activeSupplierList,
      supplierLineStats7d,
      supplierShipmentDurations7d,
      latestSupplierSyncJobs,
      emailLogs24h,
      lastOosReminderLine,
      oosReminderActivity24h,
      oosReminderErrors24h,
    ] = await Promise.all([
      db.supplierOrder.count({ where: readyToPlaceWhere }),
      db.supplierOrder.count({ where: awbWorkWhere }),
      db.supplierOrder.count({ where: issueWhere }),
      db.supplierOrder.findMany({
        where: readyToPlaceWhere,
        take: 8,
        orderBy: { createdAt: "asc" },
        include: {
          supplier: { select: { id: true, name: true, companyName: true } },
          order: {
            select: {
              id: true,
              orderNumber: true,
              paymentStatus: true,
              createdAt: true,
              user: { select: { name: true, email: true } },
              shippingAddress: { select: { city: true, fullName: true } },
            },
          },
          orderItem: { select: { name: true, quantity: true, price: true } },
        },
      }),
      db.supplierOrder.findMany({
        where: awbWorkWhere,
        take: 8,
        orderBy: { updatedAt: "asc" },
        include: {
          supplier: { select: { id: true, name: true, companyName: true } },
          order: {
            select: {
              id: true,
              orderNumber: true,
              paymentStatus: true,
              createdAt: true,
              user: { select: { name: true, email: true } },
              shippingAddress: { select: { city: true, fullName: true } },
            },
          },
          orderItem: { select: { name: true, quantity: true, price: true } },
        },
      }),
      db.supplierOrder.findMany({
        where: issueWhere,
        take: 10,
        orderBy: { updatedAt: "asc" },
        include: {
          supplier: { select: { id: true, name: true, companyName: true } },
          order: {
            select: {
              id: true,
              orderNumber: true,
              paymentStatus: true,
              createdAt: true,
              user: { select: { name: true, email: true } },
              shippingAddress: { select: { city: true, fullName: true } },
            },
          },
          orderItem: { select: { name: true, quantity: true, price: true } },
        },
      }),
      db.return.findMany({
        where: {
          supplierAuthorizationStatus: { in: ["PENDING", "REQUESTED"] },
          status: { in: ["PENDING", "APPROVED", "RECEIVED"] },
        },
        take: 8,
        orderBy: [
          { supplierAuthorizationDeadline: "asc" },
          { createdAt: "asc" },
        ],
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              user: { select: { name: true, email: true } },
              shippingAddress: { select: { fullName: true, city: true } },
            },
          },
          orderItem: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              product: {
                select: {
                  supplierId: true,
                  supplier: {
                    select: { id: true, name: true, companyName: true },
                  },
                },
              },
            },
          },
        },
      }),
      db.return.count({
        where: {
          supplierAuthorizationStatus: { in: ["PENDING", "REQUESTED"] },
          status: { in: ["PENDING", "APPROVED", "RECEIVED"] },
        },
      }),
      db.return.count({
        where: {
          supplierAuthorizationStatus: "REQUESTED",
          supplierAuthorizationDeadline: { lt: now },
          status: { in: ["PENDING", "APPROVED", "RECEIVED"] },
        },
      }),
      db.supplierOrder.findMany({
        where: {
          notes: { contains: "[OOS_REFUND_REQUESTED]" },
          NOT: [{ notes: { contains: "[OOS_REFUND_SUCCESS]" } }],
        },
        select: {
          id: true,
          quantity: true,
          orderItem: {
            select: {
              price: true,
              quantity: true,
            },
          },
        },
      }),
      db.supplier.findMany({
        where: { isActive: true },
        select: { id: true, name: true, companyName: true },
        orderBy: { createdAt: "asc" },
      }),
      db.supplierOrder.groupBy({
        by: ["supplierId", "status"],
        where: { createdAt: { gte: last7d } },
        _count: { _all: true },
      }),
      db.supplierOrder.findMany({
        where: {
          createdAt: { gte: last7d },
          shippedAt: { not: null },
        },
        select: {
          supplierId: true,
          createdAt: true,
          shippedAt: true,
        },
        take: 500,
        orderBy: { createdAt: "desc" },
      }),
      db.supplierSyncJob.findMany({
        take: 20,
        orderBy: { startedAt: "desc" },
        include: {
          supplier: { select: { id: true, name: true, companyName: true } },
        },
      }),
      db.emailLog.groupBy({
        by: ["status"],
        where: { createdAt: { gte: last24h } },
        _count: { _all: true },
      }),
      db.supplierOrder.findFirst({
        where: { notes: { contains: "[OOS_REMINDER_SENT]" } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      db.supplierOrder.count({
        where: {
          notes: { contains: "[OOS_REMINDER_SENT]" },
          updatedAt: { gte: last24h },
        },
      }),
      db.supplierOrder.count({
        where: {
          notes: { contains: "[OOS_REMINDER_ERROR]" },
          updatedAt: { gte: last24h },
        },
      }),
    ]);

    const issueLines = issueLinesRaw.map(line => {
      const oos = buildOosOpsSnapshot({
        notes: line.notes,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
      });

      return {
        supplierOrderId: line.id,
        orderId: line.order.id,
        orderNumber: line.order.orderNumber,
        status: line.status,
        supplierName:
          line.supplier.name || line.supplier.companyName || "Supplier",
        itemName: line.orderItem.name,
        quantity: line.quantity || line.orderItem.quantity || 1,
        lineAmount:
          Number(line.orderItem.price || 0) *
          Number(line.quantity || line.orderItem.quantity || 1),
        customerName:
          line.order.user?.name ||
          line.order.shippingAddress?.fullName ||
          "Guest customer",
        customerEmail: line.order.user?.email || null,
        city: line.order.shippingAddress?.city || null,
        createdAt: toIso(line.createdAt),
        updatedAt: toIso(line.updatedAt),
        issueAgeHours: oos.issueAgeHours,
        inactivityHours: oos.inactivityHours,
        needsCustomerNotification: oos.needsCustomerNotification,
        isSlaOverdue: oos.isSlaOverdue,
      };
    });

    const unnotifiedIssueCount = issueLines.filter(
      line => line.needsCustomerNotification
    ).length;
    const overdueIssueCount = issueLines.filter(
      line => line.isSlaOverdue
    ).length;
    const issueValueAtRisk = issueLines.reduce(
      (sum, line) => sum + Number(line.lineAmount || 0),
      0
    );

    const mapSupplierTaskLine = (line: (typeof readyToPlaceLines)[number]) => ({
      supplierOrderId: line.id,
      orderId: line.order.id,
      orderNumber: line.order.orderNumber,
      supplierName:
        line.supplier.name || line.supplier.companyName || "Supplier",
      status: line.status,
      itemName: line.orderItem.name,
      quantity: line.quantity || line.orderItem.quantity || 1,
      customerName:
        line.order.user?.name ||
        line.order.shippingAddress?.fullName ||
        "Guest",
      customerEmail: line.order.user?.email || null,
      city: line.order.shippingAddress?.city || null,
      createdAt: toIso(line.createdAt),
      updatedAt: toIso(line.updatedAt),
      orderCreatedAt: toIso(line.order.createdAt),
      paymentStatus: line.order.paymentStatus,
      trackingNumber: line.trackingNumber || null,
      supplierOrderRef: line.supplierOrderId || null,
      lineAmount:
        Number(line.orderItem.price || 0) *
        Number(line.quantity || line.orderItem.quantity || 1),
    });

    const returnsWaitingAuth = returnsWaitingAuthRaw.map(ret => {
      const supplierName =
        ret.orderItem.product?.supplier?.name ||
        ret.orderItem.product?.supplier?.companyName ||
        "Unknown supplier";
      const customerName =
        ret.order.user?.name || ret.order.shippingAddress?.fullName || "Guest";
      const authDeadline = ret.supplierAuthorizationDeadline;
      const authDeadlineHours =
        authDeadline && !Number.isNaN(authDeadline.getTime())
          ? (authDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)
          : null;

      return {
        returnId: ret.id,
        orderId: ret.order.id,
        orderNumber: ret.order.orderNumber,
        orderItemId: ret.orderItemId,
        itemName: ret.orderItem.name,
        lineAmount:
          Number(ret.orderItem.price || 0) *
          Number(ret.orderItem.quantity || 1),
        reason: ret.reason,
        status: ret.status,
        supplierAuthorizationStatus: ret.supplierAuthorizationStatus,
        supplierAuthorizationDeadline: toIso(ret.supplierAuthorizationDeadline),
        supplierAuthorizationRequestedAt: toIso(
          ret.supplierAuthorizationRequestedAt
        ),
        supplierName,
        customerName,
        customerEmail: ret.order.user?.email || null,
        city: ret.order.shippingAddress?.city || null,
        createdAt: toIso(ret.createdAt),
        updatedAt: toIso(ret.updatedAt),
        authDeadlineHours,
        isAuthOverdue: !!(authDeadline && authDeadline < now),
      };
    });

    const supplierStatMap = new Map<
      string,
      {
        last7dTotal: number;
        last7dIssues: number;
        issueOos7d: number;
        issueDelayed7d: number;
      }
    >();

    for (const row of supplierLineStats7d) {
      const current = supplierStatMap.get(row.supplierId) || {
        last7dTotal: 0,
        last7dIssues: 0,
        issueOos7d: 0,
        issueDelayed7d: 0,
      };
      current.last7dTotal += row._count._all;
      if (row.status === "ISSUE_OOS") {
        current.last7dIssues += row._count._all;
        current.issueOos7d += row._count._all;
      }
      if (row.status === "ISSUE_DELAYED") {
        current.last7dIssues += row._count._all;
        current.issueDelayed7d += row._count._all;
      }
      supplierStatMap.set(row.supplierId, current);
    }

    const durationMap = new Map<string, number[]>();
    for (const row of supplierShipmentDurations7d) {
      const hours = hoursBetween(row.createdAt, row.shippedAt);
      if (hours == null) continue;
      if (!durationMap.has(row.supplierId)) durationMap.set(row.supplierId, []);
      durationMap.get(row.supplierId)!.push(hours);
    }

    const latestSyncBySupplier = new Map<
      string,
      (typeof latestSupplierSyncJobs)[number]
    >();
    for (const job of latestSupplierSyncJobs) {
      if (!latestSyncBySupplier.has(job.supplierId)) {
        latestSyncBySupplier.set(job.supplierId, job);
      }
    }

    const openSupplierLineCounts = await db.supplierOrder.groupBy({
      by: ["supplierId", "status"],
      where: {
        NOT: [{ status: { in: [...TERMINAL_SUPPLIER_STATUSES] } }],
      },
      _count: { _all: true },
    });

    const openCountMap = new Map<
      string,
      {
        openLines: number;
        issues: number;
        readyToPlace: number;
        awbWork: number;
      }
    >();
    for (const row of openSupplierLineCounts) {
      const current = openCountMap.get(row.supplierId) || {
        openLines: 0,
        issues: 0,
        readyToPlace: 0,
        awbWork: 0,
      };
      current.openLines += row._count._all;
      if (row.status === "ISSUE_OOS" || row.status === "ISSUE_DELAYED") {
        current.issues += row._count._all;
      }
      if (row.status === "READY_TO_PLACE")
        current.readyToPlace += row._count._all;
      if (row.status === "AWB_PENDING" || row.status === "AWB_UPLOADED") {
        current.awbWork += row._count._all;
      }
      if (row.status === "PENDING") current.readyToPlace += row._count._all; // legacy heuristic
      if (row.status === "READY_TO_SHIP") current.awbWork += row._count._all; // legacy heuristic
      openCountMap.set(row.supplierId, current);
    }

    const supplierHealth = activeSupplierList
      .map(supplier => {
        const key = supplier.id;
        const name = supplier.name || supplier.companyName || "Supplier";
        const open = openCountMap.get(key) || {
          openLines: 0,
          issues: 0,
          readyToPlace: 0,
          awbWork: 0,
        };
        const stats7d = supplierStatMap.get(key) || {
          last7dTotal: 0,
          last7dIssues: 0,
          issueOos7d: 0,
          issueDelayed7d: 0,
        };
        const durations = durationMap.get(key) || [];
        const avgHoursToShip7d =
          durations.length > 0
            ? durations.reduce((sum, h) => sum + h, 0) / durations.length
            : null;
        const latestSync = latestSyncBySupplier.get(key);

        return {
          supplierId: key,
          supplierName: name,
          openLines: open.openLines,
          readyToPlace: open.readyToPlace,
          awbWork: open.awbWork,
          issues: open.issues,
          last7dLines: stats7d.last7dTotal,
          oosRate7d:
            stats7d.last7dTotal > 0
              ? stats7d.issueOos7d / stats7d.last7dTotal
              : null,
          delayRate7d:
            stats7d.last7dTotal > 0
              ? stats7d.issueDelayed7d / stats7d.last7dTotal
              : null,
          avgHoursToShip7d,
          latestSyncJob: latestSync
            ? {
                jobType: latestSync.jobType,
                status: latestSync.status,
                startedAt: toIso(latestSync.startedAt),
                finishedAt: toIso(latestSync.finishedAt),
                failed: latestSync.failed,
                updated: latestSync.updated,
                imported: latestSync.imported,
                error: latestSync.error || null,
              }
            : null,
        };
      })
      .filter(
        row => row.openLines > 0 || row.last7dLines > 0 || row.latestSyncJob
      )
      .sort((a, b) => {
        const aScore = a.issues * 5 + a.readyToPlace * 2 + a.awbWork;
        const bScore = b.issues * 5 + b.readyToPlace * 2 + b.awbWork;
        return bScore - aScore;
      })
      .slice(0, 6);

    const emailTotals = emailLogs24h.reduce(
      (acc, row) => {
        const status = String(row.status || "").toLowerCase();
        const count = row._count._all;
        if (["sent", "delivered"].includes(status)) acc.sent += count;
        else if (["failed", "error", "bounced"].includes(status))
          acc.failed += count;
        else acc.other += count;
        return acc;
      },
      { sent: 0, failed: 0, other: 0 }
    );

    const readyToPlaceValue = readyToPlaceLines.reduce(
      (sum, line) =>
        sum +
        Number(line.orderItem.price || 0) *
          Number(line.quantity || line.orderItem.quantity || 1),
      0
    );
    const awbWorkValue = awbWorkLines.reduce(
      (sum, line) =>
        sum +
        Number(line.orderItem.price || 0) *
          Number(line.quantity || line.orderItem.quantity || 1),
      0
    );
    const returnsPendingValue = returnsWaitingAuth.reduce(
      (sum, ret) => sum + Number(ret.lineAmount || 0),
      0
    );
    const manualRefundsPendingCount = manualRefundPendingLines.length;
    const manualRefundsPendingEstimatedAmount = manualRefundPendingLines.reduce(
      (sum, line) =>
        sum +
        Number(line.orderItem.price || 0) *
          Number(line.quantity || line.orderItem.quantity || 1),
      0
    );

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      summary: {
        readyToPlaceCount,
        awbWorkCount,
        issueCount,
        unnotifiedIssueCount,
        overdueIssueCount,
        returnsWaitingAuthCount,
        returnsAuthOverdueCount,
        manualRefundsPendingCount,
        financialRisk: {
          issueValueAtRisk,
          returnsPendingValue,
          manualRefundsPendingEstimatedAmount,
          readyToPlaceValue,
          awbWorkValue,
        },
      },
      actionCenter: {
        readyToPlaceLines: readyToPlaceLines.map(mapSupplierTaskLine),
        awbWorkLines: awbWorkLines.map(mapSupplierTaskLine),
        issueLines,
        returnsWaitingAuth,
      },
      supplierHealth,
      automationHealth: {
        supplierSync: Array.from(latestSyncBySupplier.values())
          .slice(0, 6)
          .map(job => ({
            supplierId: job.supplierId,
            supplierName:
              job.supplier.name || job.supplier.companyName || "Supplier",
            jobType: job.jobType,
            status: job.status,
            startedAt: toIso(job.startedAt),
            finishedAt: toIso(job.finishedAt),
            failed: job.failed,
            imported: job.imported,
            updated: job.updated,
            error: job.error || null,
          })),
        email24h: emailTotals,
        oosReminders: {
          lastReminderNoteAt: toIso(lastOosReminderLine?.updatedAt),
          reminderActivityCount24h: oosReminderActivity24h,
          reminderErrorCount24h: oosReminderErrors24h,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching operations overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations overview" },
      { status: 500 }
    );
  }
}
