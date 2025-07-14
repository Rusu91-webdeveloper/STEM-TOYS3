import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic"; // Ensure this runs server-side

export async function GET() {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const cutoff = new Date(now.getTime() - THIRTY_DAYS_MS);

  try {
    // Find eligible orders
    const eligibleOrders = await db.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        deliveredAt: {
          lte: cutoff,
        },
      },
      select: { id: true, orderNumber: true, deliveredAt: true },
    });

    if (eligibleOrders.length === 0) {
      return NextResponse.json({
        updated: 0,
        message: "No eligible orders found.",
      });
    }

    // Update all eligible orders to COMPLETED
    const update = await db.order.updateMany({
      where: {
        id: { in: eligibleOrders.map(o => o.id) },
      },
      data: {
        status: OrderStatus.COMPLETED,
      },
    });

    return NextResponse.json({
      updated: update.count,
      orderIds: eligibleOrders.map(o => o.id),
      message: `Auto-completed ${update.count} orders.`,
    });
  } catch (error) {
    console.error("[auto-complete-orders] Error:", error);
    return NextResponse.json(
      { error: "Failed to auto-complete orders." },
      { status: 500 }
    );
  }
}

// Note: This endpoint is intended for Vercel's scheduled function. If you want to restrict access, add authentication or IP allowlist here.
