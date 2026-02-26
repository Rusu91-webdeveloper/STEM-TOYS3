import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const oosNotificationSchema = z.object({
  channel: z.enum(["EMAIL", "PHONE", "WHATSAPP", "SMS", "OTHER"]),
  summary: z.string().optional().default(""),
  customerResponse: z.string().optional().default(""),
});

function appendBlock(existing: string | null, block: string) {
  return [existing, block].filter(Boolean).join("\n\n");
}

function sanitizeNoteValue(value: string | null | undefined) {
  return (value || "").replace(/[;\n\r]+/g, " | ").trim();
}

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
    const { channel, summary, customerResponse } =
      oosNotificationSchema.parse(body);

    const supplierOrder = await db.supplierOrder.findUnique({
      where: { id: supplierOrderId },
      select: {
        id: true,
        notes: true,
        orderId: true,
        product: {
          select: {
            name: true,
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

    const timestamp = new Date().toISOString();
    const cleanSummary = summary.trim();
    const cleanResponse = customerResponse.trim();
    const summaryNoteValue = sanitizeNoteValue(cleanSummary);
    const responseNoteValue = sanitizeNoteValue(cleanResponse);

    const notifiedNote = [
      `[OOS_CUSTOMER_NOTIFIED] ${timestamp}`,
      `supplierLine=${supplierOrder.id}`,
      `channel=${channel}`,
      `product=${supplierOrder.product?.name || "Unknown"}`,
      summaryNoteValue ? `summary=${summaryNoteValue}` : undefined,
      `by=${session.user.email || "admin"}`,
    ]
      .filter(Boolean)
      .join(" ; ");

    const responseNote = cleanResponse
      ? [
          `[OOS_CUSTOMER_RESPONSE] ${timestamp}`,
          `supplierLine=${supplierOrder.id}`,
          `response=${responseNoteValue}`,
          `by=${session.user.email || "admin"}`,
        ]
          .filter(Boolean)
          .join(" ; ")
      : null;

    const finalNotes = [notifiedNote, responseNote].reduce(
      (acc, entry) => (entry ? appendBlock(acc, entry) : acc),
      supplierOrder.notes ?? null
    );

    const updated = await db.supplierOrder.update({
      where: { id: supplierOrder.id },
      data: {
        notes: finalNotes,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        notes: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      supplierOrder: updated,
      notification: {
        channel,
        summary: cleanSummary || null,
        customerResponse: cleanResponse || null,
        loggedAt: timestamp,
      },
    });
  } catch (error) {
    console.error("Error logging OOS customer notification:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to log OOS customer notification" },
      { status: 500 }
    );
  }
}
