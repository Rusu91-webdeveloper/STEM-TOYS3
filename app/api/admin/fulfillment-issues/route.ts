import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeSupplierFulfillmentPhase } from "@/lib/utils/supplier-fulfillment";
import {
  buildOosOpsSnapshot,
  getLatestOosReminderByType,
} from "@/lib/utils/oos-ops";

const CUSTOMER_NOTIFY_REMINDER_THRESHOLD_HOURS = 1;
const CUSTOMER_NOTIFY_REMINDER_COOLDOWN_HOURS = 6;
const FOLLOW_UP_REMINDER_THRESHOLD_HOURS = 24;
const FOLLOW_UP_REMINDER_COOLDOWN_HOURS = 24;

type ReminderType = "CUSTOMER_NOT_NOTIFIED" | "FOLLOW_UP_OVERDUE";

function hoursSince(date?: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function getDueReminderTypes(input: {
  events: ReturnType<typeof buildOosOpsSnapshot>["events"];
  issueAgeHours: number | null;
  inactivityHours: number | null;
  needsCustomerNotification: boolean;
}): ReminderType[] {
  const due: ReminderType[] = [];

  if (
    input.needsCustomerNotification &&
    typeof input.issueAgeHours === "number" &&
    input.issueAgeHours >= CUSTOMER_NOTIFY_REMINDER_THRESHOLD_HOURS
  ) {
    const latestReminder = getLatestOosReminderByType(
      input.events,
      "CUSTOMER_NOT_NOTIFIED"
    );
    const reminderAge = hoursSince(latestReminder?.timestamp);
    if (
      !latestReminder ||
      reminderAge == null ||
      reminderAge >= CUSTOMER_NOTIFY_REMINDER_COOLDOWN_HOURS
    ) {
      due.push("CUSTOMER_NOT_NOTIFIED");
    }
  }

  if (
    typeof input.inactivityHours === "number" &&
    input.inactivityHours >= FOLLOW_UP_REMINDER_THRESHOLD_HOURS
  ) {
    const latestReminder = getLatestOosReminderByType(
      input.events,
      "FOLLOW_UP_OVERDUE"
    );
    const reminderAge = hoursSince(latestReminder?.timestamp);
    if (
      !latestReminder ||
      reminderAge == null ||
      reminderAge >= FOLLOW_UP_REMINDER_COOLDOWN_HOURS
    ) {
      due.push("FOLLOW_UP_OVERDUE");
    }
  }

  return due;
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const issueLines = await db.supplierOrder.findMany({
      where: {
        status: {
          in: ["ISSUE_OOS", "ISSUE_DELAYED"],
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            shippingAddress: {
              select: {
                fullName: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    const issues = issueLines
      .map(line => {
        const oosOps = buildOosOpsSnapshot({
          notes: line.notes,
          createdAt: line.createdAt,
          updatedAt: line.updatedAt,
        });
        const dueReminderTypes = getDueReminderTypes({
          events: oosOps.events,
          issueAgeHours: oosOps.issueAgeHours,
          inactivityHours: oosOps.inactivityHours,
          needsCustomerNotification: oosOps.needsCustomerNotification,
        });

        const supplierName = line.supplier.name || line.supplier.companyName;
        const customerName =
          line.order.user?.name ||
          line.order.shippingAddress?.fullName ||
          "Guest customer";

        return {
          supplierOrderId: line.id,
          orderId: line.order.id,
          orderNumber: line.order.orderNumber,
          orderCreatedAt: line.order.createdAt,
          customer: {
            name: customerName,
            email: line.order.user?.email || null,
            city: line.order.shippingAddress?.city || null,
            state: line.order.shippingAddress?.state || null,
          },
          supplier: {
            id: line.supplier.id,
            name: supplierName,
          },
          item: {
            orderItemId: line.orderItemId,
            name: line.orderItem.name,
            quantity: line.quantity || line.orderItem.quantity || 1,
            price: line.orderItem.price,
          },
          status: line.status,
          phase: normalizeSupplierFulfillmentPhase(line),
          trackingNumber: line.trackingNumber,
          supplierOrderRef: line.supplierOrderId,
          createdAt: line.createdAt,
          updatedAt: line.updatedAt,
          notes: line.notes,
          payment: {
            method: line.order.paymentMethod,
            status: line.order.paymentStatus,
          },
          oos: {
            issueAgeHours: oosOps.issueAgeHours,
            inactivityHours: oosOps.inactivityHours,
            needsCustomerNotification: oosOps.needsCustomerNotification,
            isSlaOverdue: oosOps.isSlaOverdue,
            latestDecision: oosOps.latestDecision,
            latestNotification: oosOps.latestNotification,
            latestResponse: oosOps.latestResponse,
            latestReminder: oosOps.latestReminder,
            dueReminderTypes,
            events: oosOps.events.slice(0, 10),
          },
        };
      })
      .sort((a, b) => {
        const aScore =
          (a.oos.dueReminderTypes.length ? 100 : 0) +
          (a.oos.needsCustomerNotification ? 40 : 0) +
          (a.oos.isSlaOverdue ? 30 : 0) +
          (a.status === "ISSUE_OOS" ? 10 : 0);
        const bScore =
          (b.oos.dueReminderTypes.length ? 100 : 0) +
          (b.oos.needsCustomerNotification ? 40 : 0) +
          (b.oos.isSlaOverdue ? 30 : 0) +
          (b.status === "ISSUE_OOS" ? 10 : 0);
        if (bScore !== aScore) return bScore - aScore;
        const aAge = a.oos.issueAgeHours ?? -1;
        const bAge = b.oos.issueAgeHours ?? -1;
        return bAge - aAge;
      });

    const reminders = issues.flatMap(issue =>
      issue.oos.dueReminderTypes.map(type => ({
        supplierOrderId: issue.supplierOrderId,
        orderId: issue.orderId,
        orderNumber: issue.orderNumber,
        supplierName: issue.supplier.name,
        productName: issue.item.name,
        status: issue.status,
        type,
        priority:
          type === "FOLLOW_UP_OVERDUE"
            ? (issue.oos.inactivityHours ?? 0) >= 48
              ? "URGENT"
              : "HIGH"
            : (issue.oos.issueAgeHours ?? 0) >= 24
              ? "HIGH"
              : "MEDIUM",
        issueAgeHours: issue.oos.issueAgeHours,
        inactivityHours: issue.oos.inactivityHours,
        lastDecisionAt: issue.oos.latestDecision?.timestamp || null,
        lastNotificationAt: issue.oos.latestNotification?.timestamp || null,
        lastReminderAt:
          getLatestOosReminderByType(issue.oos.events, type)?.timestamp || null,
      }))
    );

    const summary = {
      totalIssues: issues.length,
      oosCount: issues.filter(issue => issue.status === "ISSUE_OOS").length,
      delayedCount: issues.filter(issue => issue.status === "ISSUE_DELAYED")
        .length,
      needsCustomerNotificationCount: issues.filter(
        issue => issue.oos.needsCustomerNotification
      ).length,
      slaOverdueCount: issues.filter(issue => issue.oos.isSlaOverdue).length,
      remindersDueCount: reminders.length,
    };

    return NextResponse.json({
      success: true,
      summary,
      issues,
      reminders,
    });
  } catch (error) {
    console.error("Error fetching fulfillment issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch fulfillment issues" },
      { status: 500 }
    );
  }
}
