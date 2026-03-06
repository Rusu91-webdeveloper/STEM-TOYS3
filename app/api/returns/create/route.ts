import { NextResponse } from "next/server";

import { appConfig } from "@/lib/config/app-config";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  RETURN_REASON_LABELS_RO,
  RETURN_WINDOW_DAYS,
  isReturnReason,
  isWithinReturnWindowForOrder,
  normalizeReturnDetails,
} from "@/lib/returns/policy";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Trebuie să fii autentificat pentru a iniția un retur." },
        { status: 401 }
      );
    }

    const { orderItemId, reason, details } = await request.json();
    const normalizedDetails = normalizeReturnDetails(details);

    // Find the order item
    const orderItem = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
        product: {
          select: {
            name: true,
            sku: true,
            images: true,
          },
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "Produsul nu a fost găsit." },
        { status: 404 }
      );
    }

    if (!isReturnReason(reason)) {
      return NextResponse.json(
        { error: "Te rugăm să selectezi un motiv valid de retur." },
        { status: 400 }
      );
    }
    const returnReason = reason;

    // Check if item is a digital book (not returnable)
    if ((orderItem as any).isDigital) {
      return NextResponse.json(
        {
          error: "Produsele digitale nu pot fi returnate.",
        },
        { status: 400 }
      );
    }

    // Verify the user owns this order
    if (
      orderItem.order.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Nu ai permisiunea să inițiezi acest retur." },
        { status: 403 }
      );
    }

    // Check if a return already exists for this order item
    const existingReturn = await db.return.findFirst({
      where: {
        orderItemId: orderItem.id,
        userId: session.user.id,
      },
    });
    if (existingReturn) {
      return NextResponse.json(
        { error: "Ai trimis deja o cerere de retur pentru acest produs." },
        { status: 400 }
      );
    }

    // Only allow returns for delivered items
    if (orderItem.order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Poți returna doar produse din comenzi livrate." },
        { status: 400 }
      );
    }

    if (!isWithinReturnWindowForOrder(orderItem.order as any)) {
      return NextResponse.json(
        {
          error: `Returul poate fi solicitat doar în primele ${RETURN_WINDOW_DAYS} zile calendaristice de la livrare.`,
        },
        { status: 400 }
      );
    }

    // Create the return record
    const returnRecord = await db.return.create({
      data: {
        userId: session.user.id,
        orderId: orderItem.orderId,
        orderItemId: orderItem.id,
        reason: returnReason,
        details: returnReason === "OTHER" ? normalizedDetails : null,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Update the order item status to reflect return requested
    await db.orderItem.update({
      where: { id: orderItem.id },
      data: { returnStatus: "REQUESTED" },
    });

    // Get store settings for admin email
    const storeSettings = await db.storeSettings.findFirst();
    const adminEmail = storeSettings?.contactEmail || appConfig.adminEmail;

    // Email configuration verified

    // Map reason code to human-readable text
    // Send emails
    try {
      // Send admin notification using new unified system
      const { sendReturnNotificationEmail } = await import(
        "@/lib/email/migration-helper"
      );
      await sendReturnNotificationEmail({
        to: adminEmail,
        orderNumber: orderItem.order.orderNumber,
        productName: orderItem.name,
        productSku: orderItem.product?.sku || undefined,
        customerName: returnRecord.user.name || returnRecord.user.email,
        customerEmail: returnRecord.user.email,
        reason: RETURN_REASON_LABELS_RO[returnReason],
        details: normalizedDetails || undefined,
        returnId: returnRecord.id,
      });

      // Send customer confirmation email
      const userEmail = session.user.email;
      if (typeof userEmail === "string" && userEmail) {
        const { sendReturnConfirmationEmail } = await import(
          "@/lib/email/migration-helper"
        );
        await sendReturnConfirmationEmail({
          to: userEmail,
          orderNumber: orderItem.order.orderNumber,
          productName: orderItem.name,
          returnId: returnRecord.id,
        });
      } else {
        console.warn(
          "User email is missing or invalid, skipping return confirmation email."
        );
      }
    } catch (emailError) {
      console.error("Error sending return emails:", emailError);
      // Log more details about the error
      console.error("Error details:", JSON.stringify(emailError, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: "Cererea de retur a fost înregistrată.",
      data: returnRecord,
    });
  } catch (error) {
    console.error("Error initiating return:", error);
    return NextResponse.json(
      { error: "Nu am putut iniția returul." },
      { status: 500 }
    );
  }
}
