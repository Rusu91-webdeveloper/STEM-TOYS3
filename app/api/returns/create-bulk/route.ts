import { NextResponse } from "next/server";

import { appConfig } from "@/lib/config/app-config";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isUniqueConstraintError } from "@/lib/returns/errors";
import {
  RETURN_PHOTO_LIMIT,
  RETURN_REASON_LABELS_RO,
  RETURN_WINDOW_DAYS,
  getReturnReferenceDate,
  getLiabilityForReturnReason,
  isReturnReason,
  isWithinReturnWindowForOrder,
  normalizeReturnDetails,
  normalizeReturnPhotos,
} from "@/lib/returns/policy";
import { mapReturnStatusToOrderItemStatus } from "@/lib/returns/status-machine";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Trebuie să fii autentificat pentru a iniția un retur." },
        { status: 401 }
      );
    }

    const { orderItemIds, reason, details, photos } = await request.json();
    const normalizedDetails = normalizeReturnDetails(details);
    const normalizedPhotos = normalizeReturnPhotos(photos);
    const normalizedOrderItemIds = Array.isArray(orderItemIds)
      ? [...new Set(
          orderItemIds
            .filter((id): id is string => typeof id === "string")
            .map(id => id.trim())
            .filter(Boolean)
        )]
      : [];

    if (normalizedOrderItemIds.length === 0) {
      return NextResponse.json(
        { error: "Selectează cel puțin un produs pentru retur." },
        { status: 400 }
      );
    }

    if (!isReturnReason(reason)) {
      return NextResponse.json(
        { error: "Te rugăm să selectezi un motiv valid de retur." },
        { status: 400 }
      );
    }
    const returnReason = reason;
    const defaultLiability = getLiabilityForReturnReason(returnReason);

    if (normalizedPhotos.length === 0) {
      return NextResponse.json(
        {
          error:
            "Te rugăm să încarci cel puțin o fotografie. Pozele se salvează împreună cu cererea de retur pentru analiză și pentru relația cu furnizorul.",
        },
        { status: 400 }
      );
    }

    // Find all order items that belong to the user
    const orderItems = await db.orderItem.findMany({
      where: {
        id: { in: normalizedOrderItemIds },
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
        { error: "Nu am găsit produse valide pentru retur." },
        { status: 404 }
      );
    }

    if (orderItems.length !== normalizedOrderItemIds.length) {
      return NextResponse.json(
        {
          error:
            "Unele produse selectate nu au fost găsite sau nu aparțin contului tău.",
        },
        { status: 400 }
      );
    }

    // Verify all items belong to the same order
    const orderIds = [...new Set(orderItems.map(item => item.orderId))];
    if (orderIds.length > 1) {
      return NextResponse.json(
        { error: "Toate produsele selectate trebuie să aparțină aceleiași comenzi." },
        { status: 400 }
      );
    }

    // Check if the return is within 14 days of delivery
    const order = orderItems[0].order;

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Poți returna doar produse din comenzi livrate." },
        { status: 400 }
      );
    }

    const digitalItems = orderItems.filter(item => item.isDigital);
    if (digitalItems.length > 0) {
      return NextResponse.json(
        {
          error: `Produsele digitale nu pot fi returnate: ${digitalItems
            .map(item => item.name)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Use deliveredAt if available, otherwise fall back to order creation date
    // This matches the frontend logic for return eligibility
    const referenceDate = getReturnReferenceDate(order as any);
    if (!isWithinReturnWindowForOrder(order as any)) {
      const dateType = (order as any).deliveredAt
        ? "livrare"
        : "plasarea comenzii";
      return NextResponse.json(
        {
          error: `Returul poate fi solicitat doar în primele ${RETURN_WINDOW_DAYS} zile calendaristice de la ${dateType}.`,
        },
        { status: 400 }
      );
    }

    // Check if any items are already returned or have pending returns
    const alreadyReturnedItems = orderItems.filter(
      item => item.returnStatus !== "NONE"
    );

    if (alreadyReturnedItems.length > 0) {
      const returnedNames = alreadyReturnedItems.map(item => item.name);
      return NextResponse.json(
        {
          error: `Unele produse au deja retur înregistrat: ${returnedNames.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Additional check: verify no pending returns exist for these items
    // This prevents duplicate returns if the previous request timed out but still created records
    const existingReturns = await db.return.findMany({
      where: {
        orderItemId: { in: normalizedOrderItemIds },
        userId: session.user.id,
        status: {
          in: ["PENDING", "APPROVED", "RECEIVED"],
        },
      },
    });

    if (existingReturns.length > 0) {
      const affectedItemIds = existingReturns.map(r => r.orderItemId);
      const affectedItems = orderItems.filter(item =>
        affectedItemIds.includes(item.id)
      );
      const affectedNames = affectedItems.map(item => item.name);

      return NextResponse.json(
        {
          error: `Unele produse au deja retururi active sau în așteptare: ${affectedNames.join(
            ", "
          )}. Verifică pagina de retururi.`,
        },
        { status: 400 }
      );
    }

    // Create return records for all items using a transaction
    // This ensures atomicity - either all succeed or none
    const returnData = orderItems.map(item => ({
      orderItemId: item.id,
      orderId: item.orderId,
      userId: session.user.id,
      reason: returnReason as any,
      status: "PENDING" as const,
      details: normalizedDetails,
      photos: normalizedPhotos,
      liability: defaultLiability,
    }));

    // Use transaction to ensure data consistency
    const createdReturns = await db.$transaction(async tx => {
      // Create return records
      await tx.return.createMany({
        data: returnData,
      });

      // Update order items return status
      await tx.orderItem.updateMany({
        where: {
          id: { in: normalizedOrderItemIds },
        },
        data: {
          returnStatus: mapReturnStatusToOrderItemStatus("PENDING"),
        },
      });

      // Get the created return records
      const returns = await tx.return.findMany({
        where: {
          orderItemId: { in: normalizedOrderItemIds },
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: orderItems.length,
      });

      return returns;
    });

    // Get user info for emails
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    // Admin email from environment via appConfig
    const adminEmail = appConfig.adminEmail;

    // Map reason code to human-readable text
    // Send consolidated emails asynchronously (don't await - fire and forget)
    // This prevents email sending from blocking the API response
    const sendEmailsAsync = async () => {
      try {
        // Send admin notification for bulk return using professional template
        console.log(
          "Sending bulk return admin notification email to:",
          adminEmail
        );

        const { sendBulkReturnNotificationEmail } = await import(
          "@/lib/email/migration-helper"
        );
        await sendBulkReturnNotificationEmail({
          to: adminEmail,
          customerName: user?.name || "Unknown Customer",
          customerEmail: user?.email || "unknown@email.com",
          orderNumber: order.orderNumber,
          returnItems: orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            sku: item.product?.sku || undefined,
          })),
          reason: RETURN_REASON_LABELS_RO[returnReason],
          details: normalizedDetails || undefined,
          returnIds: createdReturns.map(r => r.id),
        });

        // Send customer confirmation email using professional template
        const userEmail = session.user.email;
        if (typeof userEmail === "string" && userEmail) {
          console.log(
            "Sending bulk return customer confirmation email to:",
            userEmail
          );

          const { sendBulkReturnConfirmationEmail } = await import(
            "@/lib/email/migration-helper"
          );
          await sendBulkReturnConfirmationEmail({
            to: userEmail,
            customerName: user?.name || "Valued Customer",
            orderNumber: order.orderNumber,
            returnItems: orderItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              sku: item.product?.sku || undefined,
            })),
            reason: RETURN_REASON_LABELS_RO[returnReason],
            details: normalizedDetails || undefined,
            returnIds: createdReturns.map(r => r.id),
          });
        } else {
          console.warn(
            "User email is missing or invalid, skipping return confirmation email."
          );
        }
      } catch (emailError) {
        console.error("Error sending bulk return emails:", emailError);
        // Don't fail the request if email fails
      }
    };

    // Fire and forget - don't wait for emails to send
    sendEmailsAsync().catch(err =>
      console.error("Background email sending failed:", err)
    );

    return NextResponse.json({
      success: true,
      message: `Cerere de retur trimisă pentru ${orderItems.length} produs(e).`,
      data: {
        returnIds: createdReturns.map(r => r.id),
        orderNumber: order.orderNumber,
        itemCount: orderItems.length,
        savedPhotos: normalizedPhotos.length,
        maxPhotos: RETURN_PHOTO_LIMIT,
        referenceDate: referenceDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error initiating bulk return:", error);

    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        {
          error:
            "Unul sau mai multe produse au deja un retur activ. Verifică pagina de retururi înainte să trimiți o nouă cerere.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Nu am putut iniția returul." },
      { status: 500 }
    );
  }
}
