import { differenceInDays } from "date-fns";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to initiate a return" },
        { status: 401 }
      );
    }

    const { orderItemIds, reason, details } = await request.json();

    if (
      !orderItemIds ||
      !Array.isArray(orderItemIds) ||
      orderItemIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Please select at least one item to return" },
        { status: 400 }
      );
    }

    // Find all order items that belong to the user
    const orderItems = await db.orderItem.findMany({
      where: {
        id: { in: orderItemIds },
        order: {
          userId: session.user.id,
        },
      },
      include: {
        order: true,
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
    });

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: "No valid order items found for return" },
        { status: 404 }
      );
    }

    // Verify all items belong to the same order
    const orderIds = [...new Set(orderItems.map(item => item.orderId))];
    if (orderIds.length > 1) {
      return NextResponse.json(
        { error: "All items must belong to the same order" },
        { status: 400 }
      );
    }

    // Check if the return is within 14 days of delivery
    const order = orderItems[0].order;

    // Use deliveredAt if available, otherwise fall back to order creation date
    // This matches the frontend logic for return eligibility
    const referenceDate = (order as any).deliveredAt
      ? (order as any).deliveredAt
      : order.createdAt;

    const daysSinceReference = differenceInDays(new Date(), referenceDate);
    if (daysSinceReference > 14) {
      const dateType = (order as any).deliveredAt
        ? "delivery"
        : "order placement";
      return NextResponse.json(
        { error: `Returns are only allowed within 14 days of ${dateType}` },
        { status: 400 }
      );
    }

    // Check if any items are already returned
    const alreadyReturnedItems = orderItems.filter(
      item => item.returnStatus !== "NONE"
    );

    if (alreadyReturnedItems.length > 0) {
      const returnedNames = alreadyReturnedItems.map(item => item.name);
      return NextResponse.json(
        {
          error: `Some items have already been returned: ${returnedNames.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Create return records for all items
    const returnData = orderItems.map(item => ({
      orderItemId: item.id,
      orderId: item.orderId,
      userId: session.user.id,
      reason: reason as any,
      status: "PENDING" as const,
      details: details || null,
    }));

    const returnRecords = await db.return.createMany({
      data: returnData,
    });

    // Update order items return status
    await db.orderItem.updateMany({
      where: {
        id: { in: orderItemIds },
      },
      data: {
        returnStatus: "REQUESTED",
      },
    });

    // Get the created return records for email
    const createdReturns = await db.return.findMany({
      where: {
        orderItemId: { in: orderItemIds },
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: orderItems.length,
    });

    // Get user info for emails
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    // Admin email from environment or fallback
    const adminEmail =
      process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "admin@techtots.com";

    // Map reason code to human-readable text
    const reasonLabels = {
      DOES_NOT_MEET_EXPECTATIONS: "Does not meet expectations",
      DAMAGED_OR_DEFECTIVE: "Damaged or defective",
      WRONG_ITEM_SHIPPED: "Wrong item shipped",
      CHANGED_MIND: "Changed my mind",
      ORDERED_WRONG_PRODUCT: "Ordered wrong product",
      OTHER: "Other reason",
    };

    // Send consolidated emails
    try {
      // Send admin notification for bulk return using professional template
      console.log(
        "Sending bulk return admin notification email to:",
        adminEmail
      );

      await import("@/lib/brevoTemplates").then(async ({ emailTemplates }) => {
        await emailTemplates.bulkReturnAdminNotification({
          to: adminEmail,
          customerName: user?.name || "Unknown Customer",
          customerEmail: user?.email || "unknown@email.com",
          orderNumber: order.orderNumber,
          returnItems: orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            sku: item.product?.sku || undefined,
          })),
          reason,
          details,
          returnIds: createdReturns.map(r => r.id),
        });
      });

      // Send customer confirmation email using professional template
      const userEmail = session.user.email;
      if (typeof userEmail === "string" && userEmail) {
        console.log(
          "Sending bulk return customer confirmation email to:",
          userEmail
        );

        await import("@/lib/brevoTemplates").then(
          async ({ emailTemplates }) => {
            await emailTemplates.bulkReturnConfirmation({
              to: userEmail,
              customerName: user?.name || "Valued Customer",
              orderNumber: order.orderNumber,
              returnItems: orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                sku: item.product?.sku || undefined,
              })),
              reason,
              details,
              returnIds: createdReturns.map(r => r.id),
            });
          }
        );
      } else {
        console.warn(
          "User email is missing or invalid, skipping return confirmation email."
        );
      }
    } catch (emailError) {
      console.error("Error sending bulk return emails:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully initiated return for ${orderItems.length} item(s)`,
      data: {
        returnIds: createdReturns.map(r => r.id),
        orderNumber: order.orderNumber,
        itemCount: orderItems.length,
      },
    });
  } catch (error) {
    console.error("Error initiating bulk return:", error);
    return NextResponse.json(
      { error: "Failed to initiate return" },
      { status: 500 }
    );
  }
}
