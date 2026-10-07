import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { sendBulkReturnApprovalNotification } from "@/lib/returns/approval-notification";
import { mapReturnStatusToOrderItemStatus } from "@/lib/returns/status-machine";

// Increase timeout for this route (Vercel)
export const maxDuration = 60; // 60 seconds

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    if (!(await validateCsrfForRequest(request)).valid) {
      return NextResponse.json(
        { error: "Security validation failed" },
        { status: 403 }
      );
    }
    const { returnIds } = await request.json();

    if (
      !returnIds ||
      !Array.isArray(returnIds) ||
      returnIds.length === 0 ||
      returnIds.length > 20 ||
      returnIds.some(id => typeof id !== "string" || !id.trim())
    ) {
      return NextResponse.json(
        { error: "Please provide return IDs to approve" },
        { status: 400 }
      );
    }

    console.log("Processing bulk approval for returns:", returnIds);

    // First, check what returns exist with these IDs (regardless of status)
    const existingReturns = await db.return.findMany({
      where: {
        id: { in: returnIds },
      },
      select: {
        id: true,
        status: true,
      },
    });

    console.log("Existing returns found:", existingReturns);

    // If no returns found at all, the IDs are invalid
    if (existingReturns.length === 0) {
      return NextResponse.json(
        { error: "Nu s-au găsit returnări cu ID-urile furnizate" },
        { status: 404 }
      );
    }

    // Only pending approvals and approved email retries are eligible.
    const nonPendingReturns = existingReturns.filter(
      r => !["PENDING", "APPROVED"].includes(r.status)
    );
    if (nonPendingReturns.length === existingReturns.length) {
      const statusInfo = existingReturns
        .map(r => `${r.id.slice(-6)}: ${r.status}`)
        .join(", ");
      return NextResponse.json(
        {
          error: `Toate returnările selectate au fost deja procesate. Status curent: ${statusInfo}`,
          details: existingReturns,
        },
        { status: 400 }
      );
    }

    // Load eligible approval/retry records with their destination evidence.
    const returns = await db.return.findMany({
      where: {
        id: { in: returnIds },
        status: { in: ["PENDING", "APPROVED"] }, // Same-status approval retries email acceptance
      },
      include: {
        order: true,
        orderItem: {
          include: {
            product: true,
          },
        },
        user: {
          include: {
            addresses: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
      },
    });

    if (returns.length === 0) {
      return NextResponse.json(
        { error: "Nu s-au găsit returnări în așteptare cu ID-urile furnizate" },
        { status: 404 }
      );
    }

    // Log if some returns were skipped
    if (returns.length < returnIds.length) {
      console.log(
        `⚠️ Only ${returns.length} of ${returnIds.length} returns are eligible for approval or email retry. Skipping ${returnIds.length - returns.length} already processed returns.`
      );
    }

    // Group returns by order ID to handle bulk returns per order
    const returnsByOrder = returns.reduce(
      (acc, returnItem) => {
        const orderId = returnItem.orderId;
        if (!acc[orderId]) {
          acc[orderId] = [];
        }
        acc[orderId].push(returnItem);
        return acc;
      },
      {} as Record<string, typeof returns>
    );

    if (Object.keys(returnsByOrder).length > 5)
      return NextResponse.json(
        {
          error:
            "Selectează cel mult 5 comenzi pentru trimiterea emailurilor într-o singură operațiune.",
        },
        { status: 400 }
      );

    // STEP 1: Update ALL return statuses first (fast operation)
    console.log(`📝 Updating ${returns.length} returns to APPROVED status...`);

    await db.$transaction(async tx => {
      await Promise.all(
        returns.map(returnItem =>
          tx.return.update({
            where: {
              id: returnItem.id,
              status: returnItem.status,
              updatedAt: returnItem.updatedAt,
            },
            data: { status: "APPROVED" },
          })
        )
      );

      await tx.orderItem.updateMany({
        where: {
          id: {
            in: [...new Set(returns.map(returnItem => returnItem.orderItemId))],
          },
        },
        data: {
          returnStatus: mapReturnStatusToOrderItemStatus("APPROVED"),
        },
      });
    });

    console.log(`✅ All ${returns.length} returns updated to APPROVED`);

    // Build response data
    const processedOrders = Object.entries(returnsByOrder).map(
      ([orderId, orderReturns]) => {
        const firstReturn = orderReturns[0];
        return {
          orderId,
          orderNumber: firstReturn.order.orderNumber,
          customerEmail: firstReturn.user.email,
          itemCount: orderReturns.length,
          returnIds: orderReturns.map(r => r.id),
        };
      }
    );

    const notifications = [];
    for (const [orderId, records] of Object.entries(returnsByOrder)) {
      try {
        const result = await sendBulkReturnApprovalNotification(records);
        notifications.push({ orderId, success: result.success });
      } catch {
        notifications.push({ orderId, success: false });
      }
    }
    const emailsAccepted = notifications.every(
      notification => notification.success
    );

    return NextResponse.json(
      {
        success: true,
        message: `Aprobat ${returns.length} returnări din ${processedOrders.length} comenzi. Verifică rezultatul trimiterii emailurilor.`,
        data: {
          processedOrders,
          notifications,
          totalReturns: returns.length,
          totalOrders: processedOrders.length,
        },
      },
      { status: emailsAccepted ? 200 : 202 }
    );
  } catch (error) {
    console.error("Error in bulk return approval:", error);
    return NextResponse.json(
      { error: "Failed to process bulk return approval" },
      { status: 500 }
    );
  }
}
