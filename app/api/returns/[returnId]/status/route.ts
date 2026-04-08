import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStripePaymentMethod } from "@/lib/orders/customer-order-display";
import { generateReturnLabel } from "@/lib/return-label";
import {
  canTransitionReturnStatus,
  getAllowedNextReturnStatuses,
  isReturnLifecycleStatus,
  mapReturnStatusToOrderItemStatus,
} from "@/lib/returns/status-machine";
import { getStripeServerClient } from "@/lib/stripe-server";
import {
  sendReturnApprovedEmail,
  sendReturnRejectedEmail,
} from "@/lib/email/return-templates";

// Increase timeout for this route (Vercel)
export const maxDuration = 60; // 60 seconds

export async function PATCH(
  request: Request,
  context: { params: Promise<{ returnId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Properly await params in Next.js 15
    const params = await context.params;
    const returnId = params.returnId;
    const rawBody = await request.json();
    const body =
      rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
        ? rawBody
        : {};
    const {
      status,
      supplierAuthorizationStatus,
      supplierAuthorizationNumber,
      supplierAuthorizationNotes,
      supplierAuthorizationDeadline,
      liability,
      resolutionStatus,
      externalClaimDeadline,
      resolutionNotes,
    } = body ?? {};

    const hasStatusUpdate = typeof status === "string";
    const hasSupplierAuthUpdate =
      "supplierAuthorizationStatus" in (body ?? {}) ||
      "supplierAuthorizationNumber" in (body ?? {}) ||
      "supplierAuthorizationNotes" in (body ?? {}) ||
      "supplierAuthorizationDeadline" in (body ?? {});
    const hasCaseTrackingUpdate =
      "liability" in (body ?? {}) ||
      "resolutionStatus" in (body ?? {}) ||
      "externalClaimDeadline" in (body ?? {}) ||
      "resolutionNotes" in (body ?? {});

    if (!hasStatusUpdate && !hasSupplierAuthUpdate && !hasCaseTrackingUpdate) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    console.log(
      `🔄 Processing return ${returnId} update`,
      JSON.stringify({
        status: hasStatusUpdate ? status : undefined,
        supplierAuthorizationStatus,
      })
    );

    // Validate status
    if (hasStatusUpdate && !isReturnLifecycleStatus(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const validSupplierAuthorizationStatuses = [
      "PENDING",
      "REQUESTED",
      "APPROVED",
      "REJECTED",
      "EXPIRED",
    ];
    if (
      supplierAuthorizationStatus != null &&
      !validSupplierAuthorizationStatuses.includes(supplierAuthorizationStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid supplier authorization status value" },
        { status: 400 }
      );
    }

    const validLiabilityValues = [
      "UNDECIDED",
      "SUPPLIER",
      "COURIER",
      "INTERNAL",
      "CUSTOMER",
    ];
    if (liability != null && !validLiabilityValues.includes(liability)) {
      return NextResponse.json(
        { error: "Invalid liability value" },
        { status: 400 }
      );
    }

    const validResolutionStatuses = [
      "OPEN",
      "WAITING_SUPPLIER",
      "WAITING_COURIER",
      "READY_TO_REFUND",
      "REFUNDED",
      "REJECTED",
      "CLOSED",
    ];
    if (
      resolutionStatus != null &&
      !validResolutionStatuses.includes(resolutionStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid resolution status value" },
        { status: 400 }
      );
    }

    let parsedSupplierAuthorizationDeadline: Date | null | undefined;
    if ("supplierAuthorizationDeadline" in (body ?? {})) {
      if (
        supplierAuthorizationDeadline == null ||
        supplierAuthorizationDeadline === ""
      ) {
        parsedSupplierAuthorizationDeadline = null;
      } else {
        const parsedDate = new Date(supplierAuthorizationDeadline);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid supplier authorization deadline" },
            { status: 400 }
          );
        }
        parsedSupplierAuthorizationDeadline = parsedDate;
      }
    }

    let parsedExternalClaimDeadline: Date | null | undefined;
    if ("externalClaimDeadline" in (body ?? {})) {
      if (externalClaimDeadline == null || externalClaimDeadline === "") {
        parsedExternalClaimDeadline = null;
      } else {
        const parsedDate = new Date(externalClaimDeadline);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid external claim deadline" },
            { status: 400 }
          );
        }
        parsedExternalClaimDeadline = parsedDate;
      }
    }

    // Get return data with order and product details
    const returnData = await db.return.findUnique({
      where: { id: returnId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            paymentMethod: true,
            stripePaymentIntentId: true,
            total: true,
            shippingCost: true,
            paymentStatus: true,
          },
        },
        orderItem: {
          include: {
            product: {
              include: {
                supplier: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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

    if (!returnData) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (
      hasStatusUpdate &&
      !canTransitionReturnStatus(returnData.status, status)
    ) {
      const allowedTransitions = getAllowedNextReturnStatuses(returnData.status);
      return NextResponse.json(
        {
          error: `Invalid status transition from ${returnData.status} to ${status}.`,
          allowedTransitions,
        },
        { status: 400 }
      );
    }

    // Update return status
    const updateData: Record<string, unknown> = {};
    const nextOrderItemStatus =
      hasStatusUpdate ? mapReturnStatusToOrderItemStatus(status) : null;
    const isRefundTransition = hasStatusUpdate && status === "REFUNDED";

    if (hasStatusUpdate && !isRefundTransition) {
      updateData.status = status;
    }

    if ("supplierAuthorizationStatus" in (body ?? {})) {
      updateData.supplierAuthorizationStatus = supplierAuthorizationStatus;
      if (
        supplierAuthorizationStatus === "REQUESTED" &&
        !returnData.supplierAuthorizationRequestedAt
      ) {
        updateData.supplierAuthorizationRequestedAt = new Date();
      }
    }

    if ("supplierAuthorizationNumber" in (body ?? {})) {
      updateData.supplierAuthorizationNumber =
        typeof supplierAuthorizationNumber === "string" &&
        supplierAuthorizationNumber.trim().length > 0
          ? supplierAuthorizationNumber.trim()
          : null;
    }

    if ("supplierAuthorizationNotes" in (body ?? {})) {
      updateData.supplierAuthorizationNotes =
        typeof supplierAuthorizationNotes === "string" &&
        supplierAuthorizationNotes.trim().length > 0
          ? supplierAuthorizationNotes.trim()
          : null;
    }

    if ("supplierAuthorizationDeadline" in (body ?? {})) {
      updateData.supplierAuthorizationDeadline =
        parsedSupplierAuthorizationDeadline;
    }

    if ("liability" in (body ?? {})) {
      updateData.liability = liability;
    }

    if ("resolutionStatus" in (body ?? {})) {
      updateData.resolutionStatus = resolutionStatus;
    }

    if ("externalClaimDeadline" in (body ?? {})) {
      updateData.externalClaimDeadline = parsedExternalClaimDeadline;
    }

    if ("resolutionNotes" in (body ?? {})) {
      updateData.resolutionNotes =
        typeof resolutionNotes === "string" && resolutionNotes.trim().length > 0
          ? resolutionNotes.trim()
          : null;
    }

    const updatedReturn =
      Object.keys(updateData).length > 0
        ? await db.return.update({
            where: { id: returnId },
            data: updateData,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  addresses: {
                    where: { isDefault: true },
                    take: 1,
                  },
                },
              },
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  createdAt: true,
                  paymentMethod: true,
                  stripePaymentIntentId: true,
                  total: true,
                  shippingCost: true,
                  paymentStatus: true,
                },
              },
              orderItem: {
                include: {
                  product: {
                    include: {
                      supplier: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              reportLogs: {
                orderBy: {
                  sentAt: "desc",
                },
                take: 10,
              },
            },
          })
        : returnData;

    if (hasStatusUpdate) {
      console.log(`✅ Return ${returnId} status updated to: ${status}`);
    } else {
      console.log(`✅ Return ${returnId} supplier authorization updated`);
    }

    if (hasStatusUpdate && status !== "REFUNDED" && nextOrderItemStatus) {
      await db.orderItem.update({
        where: { id: returnData.orderItemId },
        data: { returnStatus: nextOrderItemStatus },
      });
    }

    // Stripe refund logic for REFUNDED status
    if (isRefundTransition) {
      try {
        const order = updatedReturn.order as any;
        const orderItem = updatedReturn.orderItem as any;
        const paymentMethod = order.paymentMethod || "";
        const isStripeRefundableOrder =
          isStripePaymentMethod(paymentMethod) ||
          Boolean(order.stripePaymentIntentId);
        const isOrderAlreadyRefunded = order.paymentStatus === "REFUNDED";
        const isReturnAlreadyRefundSuccessful =
          returnData.refundStatus === "SUCCESS";
        const isPaidLikeOrderStatus =
          order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED";

        const finalizeRefundState = async () => {
          const [orderItemCount, refundedReturnCount] = await Promise.all([
            db.orderItem.count({
              where: { orderId: order.id },
            }),
            db.return.count({
              where: { orderId: order.id, status: "REFUNDED" },
            }),
          ]);

          const shouldMarkOrderRefunded =
            orderItemCount > 0 &&
            refundedReturnCount + (returnData.status === "REFUNDED" ? 0 : 1) >=
              orderItemCount &&
            order.paymentStatus !== "REFUNDED";

          await db.$transaction(async tx => {
            await tx.return.update({
              where: { id: returnId },
              data: {
                status: "REFUNDED",
                refundStatus: "SUCCESS",
                refundError: "",
              },
            });

            await tx.orderItem.update({
              where: { id: returnData.orderItemId },
              data: {
                returnStatus: mapReturnStatusToOrderItemStatus("REFUNDED"),
              },
            });

            if (shouldMarkOrderRefunded) {
              await tx.order.update({
                where: { id: order.id },
                data: { paymentStatus: "REFUNDED" },
              });
            }
          });
        };

        if (isReturnAlreadyRefundSuccessful || isOrderAlreadyRefunded) {
          console.log(
            `ℹ️ Return ${returnId} already has successful refund status. Skipping duplicate Stripe refund.`
          );
          await finalizeRefundState();
        } else {
          if (!isStripeRefundableOrder) {
            const refundErrorMessage =
              "Refundul trebuie confirmat în procesatorul de plăți înainte să marchezi returul ca REFUNDED.";

            await db.return.update({
              where: { id: returnId },
              data: {
                refundStatus: "FAILED",
                refundError: refundErrorMessage,
              },
            });
            return NextResponse.json(
              {
                error: refundErrorMessage,
                refundStatus: "FAILED",
                refundError: refundErrorMessage,
              },
              { status: 400 }
            );
          }

          if (!order.stripePaymentIntentId) {
            const refundErrorMessage =
              "Order does not have a Stripe payment intent ID. Cannot process refund.";

            await db.return.update({
              where: { id: returnId },
              data: {
                refundStatus: "FAILED",
                refundError: refundErrorMessage,
              },
            });
            return NextResponse.json(
              {
                error: refundErrorMessage,
                refundStatus: "FAILED",
                refundError: refundErrorMessage,
              },
              { status: 400 }
            );
          }

          if (!isPaidLikeOrderStatus) {
            const refundErrorMessage =
              "Only paid Stripe orders can be marked as refunded.";

            await db.return.update({
              where: { id: returnId },
              data: {
                refundStatus: "FAILED",
                refundError: refundErrorMessage,
              },
            });
            return NextResponse.json(
              {
                error: refundErrorMessage,
                refundStatus: "FAILED",
                refundError: refundErrorMessage,
              },
              { status: 400 }
            );
          }

          const refundAmount = Math.round(
            Number(orderItem.price || 0) * Number(orderItem.quantity || 0) * 100
          );
          if (refundAmount <= 0) {
            const refundErrorMessage =
              "Refund amount is zero or negative. Skipping Stripe refund.";

            await db.return.update({
              where: { id: returnId },
              data: {
                refundStatus: "FAILED",
                refundError: refundErrorMessage,
              },
            });
            return NextResponse.json(
              {
                error: refundErrorMessage,
                refundStatus: "FAILED",
                refundError: refundErrorMessage,
              },
              { status: 400 }
            );
          }

          const stripe = getStripeServerClient();
          await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: refundAmount,
            metadata: {
              returnId: updatedReturn.id,
              orderNumber: order.orderNumber,
              orderItemId: updatedReturn.orderItemId,
            },
          });

          await finalizeRefundState();
        }
      } catch (refundError) {
        await db.return.update({
          where: { id: returnId },
          data: {
            refundStatus: "FAILED",
            refundError:
              refundError instanceof Error
                ? refundError.message
                : String(refundError),
          },
        });
        return NextResponse.json(
          {
            error: "Stripe refund failed",
            details:
              refundError instanceof Error ? refundError.message : refundError,
            refundStatus: "FAILED",
            refundError:
              refundError instanceof Error
                ? refundError.message
                : String(refundError),
          },
          { status: 500 }
        );
      }
    }

    // If status is changed to APPROVED, send email with return label (non-blocking)
    if (hasStatusUpdate && status === "APPROVED") {
      console.log(`📧 Queueing return approval email for return ${returnId}`);

      // Fire-and-forget: Don't await this - let it run in background
      // This prevents timeout while still sending the email
      sendApprovalEmailAsync(updatedReturn).catch(err => {
        console.error("❌ Background email sending failed:", err);
      });
    }

    // If status is changed to REJECTED, send rejection email (non-blocking)
    if (hasStatusUpdate && status === "REJECTED") {
      console.log(`📧 Queueing return rejection email for return ${returnId}`);

      // Fire-and-forget: Don't await this - let it run in background
      sendRejectionEmailAsync(updatedReturn).catch(err => {
        console.error("❌ Background rejection email sending failed:", err);
      });
    }

    // Always return the updated return object (with refundStatus/refundError if set)
    const finalReturn = await db.return.findUnique({
      where: { id: returnId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            addresses: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            paymentMethod: true,
            stripePaymentIntentId: true,
            total: true,
            shippingCost: true,
            paymentStatus: true,
          },
        },
        orderItem: {
          include: {
            product: {
              include: {
                supplier: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        reportLogs: {
          orderBy: {
            sentAt: "desc",
          },
          take: 10,
        },
      },
    });
    if (finalReturn && finalReturn.refundError == null) {
      finalReturn.refundError = "";
    }
    return NextResponse.json({ success: true, return: finalReturn });
  } catch (error: unknown) {
    console.error("Error updating return status:", error);

    // Check for Prisma errors
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update return status" },
      { status: 500 }
    );
  }
}

// Async helper function to send approval email with PDF - runs in background
async function sendApprovalEmailAsync(updatedReturn: any) {
  try {
    console.log(`📧 Background: Starting email for return ${updatedReturn.id}`);

    // Get customer address from default address if available
    const defaultAddress = updatedReturn.user.addresses[0];
    const customerAddress = defaultAddress
      ? `${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress.state}, ${defaultAddress.postalCode}, ${defaultAddress.country}`
      : undefined;

    console.log(`📄 Background: Generating PDF label...`);

    // Generate return label PDF
    const pdfBuffer = await generateReturnLabel({
      orderId: updatedReturn.order.id,
      orderNumber: updatedReturn.order.orderNumber,
      returnId: updatedReturn.id,
      productName: updatedReturn.orderItem.name,
      productId: updatedReturn.orderItem.productId || "",
      productSku: updatedReturn.orderItem.product?.sku || "",
      reason: updatedReturn.reason,
      customerName: (updatedReturn.user.name ??
        updatedReturn.user.email) as string,
      customerEmail: updatedReturn.user.email,
      customerAddress,
      language: "ro",
    });

    console.log(
      `✅ Background: PDF generated, size: ${pdfBuffer.length} bytes`
    );

    // Format order date
    const orderDate = new Date(
      updatedReturn.order.createdAt
    ).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Convert PDF to Base64 for email attachment
    const pdfBase64 = pdfBuffer.toString("base64");

    console.log(
      `📧 Background: Sending approval email to ${updatedReturn.user.email}...`
    );

    // Use the new proper email template that uses UnifiedEmailService
    const result = await sendReturnApprovedEmail({
      to: updatedReturn.user.email,
      customerName: updatedReturn.user.name ?? "Client",
      orderNumber: updatedReturn.order.orderNumber,
      orderDate,
      productName: updatedReturn.orderItem.name,
      quantity: updatedReturn.orderItem.quantity,
      reason: updatedReturn.reason,
      pdfBase64,
    });

    if (result.success) {
      console.log(
        `✅ Background: Return approval email sent to ${updatedReturn.user.email}`
      );
    } else {
      console.error(`❌ Background: Email sending failed:`, result.error);
    }
  } catch (emailError) {
    console.error("❌ Background email error:", emailError);
    console.error("❌ Email error details:", {
      errorMessage:
        emailError instanceof Error ? emailError.message : "Unknown error",
      returnId: updatedReturn.id,
      customerEmail: updatedReturn.user.email,
      orderNumber: updatedReturn.order.orderNumber,
    });
    throw emailError;
  }
}

// Async helper function to send rejection email - runs in background
async function sendRejectionEmailAsync(updatedReturn: any) {
  try {
    console.log(
      `📧 Background: Starting rejection email for return ${updatedReturn.id}`
    );

    // Format order date
    const orderDate = new Date(
      updatedReturn.order.createdAt
    ).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(
      `📧 Background: Sending rejection email to ${updatedReturn.user.email}...`
    );

    // Use the new proper email template that uses UnifiedEmailService
    const result = await sendReturnRejectedEmail({
      to: updatedReturn.user.email,
      customerName: updatedReturn.user.name ?? "Client",
      orderNumber: updatedReturn.order.orderNumber,
      orderDate,
      productName: updatedReturn.orderItem.name,
      reason: updatedReturn.reason,
    });

    if (result.success) {
      console.log(
        `✅ Background: Rejection email sent to ${updatedReturn.user.email}`
      );
    } else {
      console.error(`❌ Background: Rejection email failed:`, result.error);
    }
  } catch (emailError) {
    console.error("❌ Background rejection email error:", emailError);
    console.error("❌ Email error details:", {
      errorMessage:
        emailError instanceof Error ? emailError.message : "Unknown error",
      returnId: updatedReturn.id,
      customerEmail: updatedReturn.user.email,
      orderNumber: updatedReturn.order.orderNumber,
    });
    throw emailError;
  }
}
