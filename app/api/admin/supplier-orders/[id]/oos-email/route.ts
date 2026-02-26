import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmailViaUnifiedSystem } from "@/lib/email/migration-helper";
import { appendOosNoteBlock, sanitizeOosNoteValue } from "@/lib/utils/oos-ops";

const oosEmailSchema = z.object({
  message: z.string().min(5),
  subject: z.string().optional(),
  summary: z.string().optional().default(""),
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id: supplierOrderId } = await params;
    const body = await request.json();
    const { message, subject, summary } = oosEmailSchema.parse(body);

    const supplierOrder = await db.supplierOrder.findUnique({
      where: { id: supplierOrderId },
      include: {
        supplier: {
          select: {
            name: true,
            companyName: true,
          },
        },
        orderItem: {
          select: {
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
            shippingAddress: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!supplierOrder) {
      return NextResponse.json(
        { error: "Supplier order not found" },
        { status: 404 }
      );
    }

    const customerEmail = supplierOrder.order.user?.email;
    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email not available for this order" },
        { status: 400 }
      );
    }

    const customerName =
      supplierOrder.order.user?.name ||
      supplierOrder.order.shippingAddress?.fullName ||
      "Customer";
    const supplierName =
      supplierOrder.supplier.name ||
      supplierOrder.supplier.companyName ||
      "supplier";
    const emailSubject =
      subject?.trim() ||
      `Update regarding your order #${supplierOrder.order.orderNumber}`;

    const escapedMessage = escapeHtml(message.trim()).replace(/\n/g, "<br />");
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#111827;">
        <h2 style="margin:0 0 12px 0;font-size:22px;">Order update for #${escapeHtml(
          supplierOrder.order.orderNumber
        )}</h2>
        <p style="margin:0 0 16px 0;color:#374151;">Hello ${escapeHtml(customerName)},</p>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;background:#f9fafb;line-height:1.55;">
          ${escapedMessage}
        </div>
        <div style="margin-top:18px;padding:12px;border-radius:8px;background:#eff6ff;border:1px solid #bfdbfe;font-size:13px;color:#1e3a8a;">
          Item: ${escapeHtml(supplierOrder.orderItem.name || "Product")}<br />
          Supplier fulfillment line: ${escapeHtml(supplierOrder.id)}
        </div>
        <p style="margin-top:20px;color:#374151;">If you have questions, reply to this email and our team will help you.</p>
        <p style="margin-top:18px;color:#6b7280;font-size:13px;">Sent by ${escapeHtml(
          session.user.email || "admin"
        )} | Supplier workflow: ${escapeHtml(supplierName)}</p>
      </div>
    `;

    const sendResult = await sendEmailViaUnifiedSystem({
      to: customerEmail,
      subject: emailSubject,
      html,
      variables: {
        textContent: message.trim(),
      },
      template: "oos-customer-update",
      priority: 2,
      forceDirect: process.env.NODE_ENV !== "production",
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    const timestamp = new Date().toISOString();
    const summaryText = summary.trim() || message.trim().slice(0, 220);
    const notifiedNote = [
      `[OOS_CUSTOMER_NOTIFIED] ${timestamp}`,
      `supplierLine=${supplierOrder.id}`,
      "channel=EMAIL",
      "source=ADMIN_ONE_CLICK_EMAIL",
      `product=${supplierOrder.orderItem.name || "Unknown"}`,
      `email=${customerEmail}`,
      summaryText ? `summary=${sanitizeOosNoteValue(summaryText)}` : undefined,
      `by=${session.user.email || "admin"}`,
    ]
      .filter(Boolean)
      .join(" ; ");

    const emailSentNote = [
      `[OOS_EMAIL_SENT] ${timestamp}`,
      `supplierLine=${supplierOrder.id}`,
      `to=${customerEmail}`,
      `subject=${sanitizeOosNoteValue(emailSubject)}`,
      `messageId=${sendResult.jobId || "unknown"}`,
      `by=${session.user.email || "admin"}`,
    ]
      .filter(Boolean)
      .join(" ; ");

    const updated = await db.supplierOrder.update({
      where: { id: supplierOrder.id },
      data: {
        notes: appendOosNoteBlock(
          appendOosNoteBlock(supplierOrder.notes ?? null, notifiedNote),
          emailSentNote
        ),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      supplierOrder: updated,
      email: {
        to: customerEmail,
        subject: emailSubject,
        loggedAt: timestamp,
        messageId: sendResult.jobId || null,
      },
    });
  } catch (error) {
    console.error("Error sending OOS customer email:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send OOS customer email" },
      { status: 500 }
    );
  }
}
