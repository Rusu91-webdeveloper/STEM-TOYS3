import { NextRequest, NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import { AdminNotificationService } from "@/lib/email/admin-notification-service";
import {
  appendOosNoteBlock,
  buildOosOpsSnapshot,
  getLatestOosReminderByType,
  sanitizeOosNoteValue,
} from "@/lib/utils/oos-ops";

export const dynamic = "force-dynamic";

const CUSTOMER_NOTIFY_REMINDER_THRESHOLD_HOURS = 1;
const CUSTOMER_NOTIFY_REMINDER_COOLDOWN_HOURS = 6;
const FOLLOW_UP_REMINDER_THRESHOLD_HOURS = 24;
const FOLLOW_UP_REMINDER_COOLDOWN_HOURS = 24;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!isAuthorizedCronRequest(authHeader)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const issueLines = await db.supplierOrder.findMany({
      where: {
        status: {
          in: ["ISSUE_OOS", "ISSUE_DELAYED"],
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
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
          },
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    const results = {
      scanned: issueLines.length,
      sent: 0,
      skipped: 0,
      errors: 0,
      reminders: [] as Array<{
        supplierOrderId: string;
        orderId: string;
        orderNumber: string;
        type: string;
        priority: "MEDIUM" | "HIGH" | "URGENT";
        issueAgeHours?: number;
        inactivityHours?: number;
      }>,
    };

    for (const line of issueLines) {
      try {
        const oosOps = buildOosOpsSnapshot({
          notes: line.notes,
          createdAt: line.createdAt,
          updatedAt: line.updatedAt,
        });
        const { events, latestResponse } = oosOps;
        const issueAgeHours = oosOps.issueAgeHours;
        const inactivityHours = oosOps.inactivityHours;
        const needsCustomerNotification = oosOps.needsCustomerNotification;

        const remindersToSend: Array<{
          type: "CUSTOMER_NOT_NOTIFIED" | "FOLLOW_UP_OVERDUE";
          priority: "MEDIUM" | "HIGH" | "URGENT";
          description: string;
          cooldownHours: number;
          context: { issueAgeHours?: number; inactivityHours?: number };
        }> = [];

        if (
          needsCustomerNotification &&
          typeof issueAgeHours === "number" &&
          issueAgeHours >= CUSTOMER_NOTIFY_REMINDER_THRESHOLD_HOURS
        ) {
          const latestReminder = getLatestOosReminderByType(
            events,
            "CUSTOMER_NOT_NOTIFIED"
          );
          const reminderAge =
            latestReminder?.timestamp instanceof Date
              ? (Date.now() - latestReminder.timestamp.getTime()) /
                (1000 * 60 * 60)
              : null;

          if (
            !latestReminder ||
            reminderAge == null ||
            reminderAge >= CUSTOMER_NOTIFY_REMINDER_COOLDOWN_HOURS
          ) {
            remindersToSend.push({
              type: "CUSTOMER_NOT_NOTIFIED",
              priority: issueAgeHours >= 24 ? "HIGH" : "MEDIUM",
              cooldownHours: CUSTOMER_NOTIFY_REMINDER_COOLDOWN_HOURS,
              context: { issueAgeHours },
              description:
                `Supplier line ${line.id} (${line.orderItem.name} / ${line.supplier.name || line.supplier.companyName}) ` +
                `is in ${line.status} and appears to have no customer notification logged after the latest OOS decision. ` +
                `Issue age: ${issueAgeHours.toFixed(1)}h. ` +
                `Open order: ${line.order.orderNumber}.`,
            });
          }
        }

        if (
          typeof inactivityHours === "number" &&
          inactivityHours >= FOLLOW_UP_REMINDER_THRESHOLD_HOURS
        ) {
          const latestReminder = getLatestOosReminderByType(
            events,
            "FOLLOW_UP_OVERDUE"
          );
          const reminderAge =
            latestReminder?.timestamp instanceof Date
              ? (Date.now() - latestReminder.timestamp.getTime()) /
                (1000 * 60 * 60)
              : null;

          if (
            !latestReminder ||
            reminderAge == null ||
            reminderAge >= FOLLOW_UP_REMINDER_COOLDOWN_HOURS
          ) {
            remindersToSend.push({
              type: "FOLLOW_UP_OVERDUE",
              priority: inactivityHours >= 48 ? "URGENT" : "HIGH",
              cooldownHours: FOLLOW_UP_REMINDER_COOLDOWN_HOURS,
              context: {
                issueAgeHours: issueAgeHours ?? undefined,
                inactivityHours,
              },
              description:
                `Supplier line ${line.id} (${line.orderItem.name} / ${line.supplier.name || line.supplier.companyName}) ` +
                `has no logged OOS follow-up activity for ${inactivityHours.toFixed(1)}h while still in ${line.status}. ` +
                `${latestResponse ? "Customer response exists in notes, but no follow-up action was logged recently. " : ""}` +
                `Open order: ${line.order.orderNumber}.`,
            });
          }
        }

        if (remindersToSend.length === 0) {
          results.skipped++;
          continue;
        }

        let updatedNotes = line.notes ?? null;
        for (const reminder of remindersToSend) {
          const sent =
            await AdminNotificationService.sendOrderIssueNotification(
              line.order.id,
              `OOS_${reminder.type}`,
              reminder.description,
              reminder.priority
            );

          if (!sent.success) {
            throw new Error(
              sent.error || `Failed to send ${reminder.type} reminder`
            );
          }

          const reminderNote = [
            `[OOS_REMINDER_SENT] ${new Date().toISOString()}`,
            `type=${reminder.type}`,
            `status=${line.status}`,
            `priority=${reminder.priority}`,
            reminder.context.issueAgeHours != null
              ? `issueAgeHours=${reminder.context.issueAgeHours.toFixed(1)}`
              : undefined,
            reminder.context.inactivityHours != null
              ? `inactivityHours=${reminder.context.inactivityHours.toFixed(1)}`
              : undefined,
            `cooldownHours=${reminder.cooldownHours}`,
            `by=cron_oos_reminders`,
          ]
            .filter(Boolean)
            .join(" ; ");

          updatedNotes = appendOosNoteBlock(updatedNotes, reminderNote);

          results.sent++;
          results.reminders.push({
            supplierOrderId: line.id,
            orderId: line.order.id,
            orderNumber: line.order.orderNumber,
            type: reminder.type,
            priority: reminder.priority,
            issueAgeHours: reminder.context.issueAgeHours,
            inactivityHours: reminder.context.inactivityHours,
          });
        }

        if (updatedNotes !== line.notes) {
          await db.supplierOrder.update({
            where: { id: line.id },
            data: {
              notes: updatedNotes,
              updatedAt: new Date(),
            },
          });
        }
      } catch (lineError) {
        console.error(
          `Error processing OOS reminder for supplier line ${line.id}:`,
          lineError
        );
        results.errors++;

        const errorNote = [
          `[OOS_REMINDER_ERROR] ${new Date().toISOString()}`,
          `status=${line.status}`,
          `error=${sanitizeOosNoteValue(
            lineError instanceof Error ? lineError.message : String(lineError)
          )}`,
          `by=cron_oos_reminders`,
        ].join(" ; ");

        await db.supplierOrder
          .update({
            where: { id: line.id },
            data: {
              notes: appendOosNoteBlock(line.notes ?? null, errorNote),
              updatedAt: new Date(),
            },
          })
          .catch(() => null);
      }
    }

    return NextResponse.json({
      success: true,
      message: "OOS reminders scan completed",
      data: results,
    });
  } catch (error) {
    console.error("OOS reminders cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run OOS reminders cron",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
