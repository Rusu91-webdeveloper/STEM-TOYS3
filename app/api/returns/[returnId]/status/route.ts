import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { sendReturnRejectedEmail } from "@/lib/email/return-templates";
import { isStripePaymentMethod } from "@/lib/orders/customer-order-display";
import { sendReturnApprovalNotification } from "@/lib/returns/approval-notification";
import { reconcileManualRepayments } from "@/lib/returns/manual-refund-ledger";
import {
  manualRefundAudit,
  manualRefundProofSchema,
} from "@/lib/returns/manual-refund-proof";
import {
  containsDestinationMarker,
  getReturnDestination,
  readDestinationEvidence,
  supplierNotesWithoutDestination,
  writeDestinationEvidence,
} from "@/lib/returns/return-destination";
import {
  refundReviewSchema,
  reviewedStripeRefund,
} from "@/lib/returns/reviewed-stripe-refund";
import {
  canTransitionReturnStatus,
  getAllowedNextReturnStatuses,
  isReturnLifecycleStatus,
  mapReturnStatusToOrderItemStatus,
} from "@/lib/returns/status-machine";
import {
  supplierContract,
  supplierReturnSelect,
} from "@/lib/returns/supplier-return-contracts";
import { getStripeServerClient } from "@/lib/stripe-server";

// Increase timeout for this route (Vercel)
export const maxDuration = 60; // 60 seconds

export async function PATCH(
  request: Request,
  context: { params: Promise<{ returnId: string }> }
) {
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
            discountAmount: true,
            paymentStatus: true,
          },
        },
        orderItem: {
          include: {
            product: {
              include: {
                supplier: {
                  select: supplierReturnSelect,
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
      const allowedTransitions = getAllowedNextReturnStatuses(
        returnData.status
      );
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
    const nextOrderItemStatus = hasStatusUpdate
      ? mapReturnStatusToOrderItemStatus(status)
      : null;
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
      if (
        typeof supplierAuthorizationNotes === "string" &&
        containsDestinationMarker(supplierAuthorizationNotes)
      ) {
        return NextResponse.json(
          {
            error:
              "Destination evidence must be saved through destination review",
          },
          { status: 400 }
        );
      }
      const plainNotes =
        typeof supplierAuthorizationNotes === "string" &&
        supplierAuthorizationNotes.trim().length > 0
          ? supplierAuthorizationNotes.trim()
          : null;
      updateData.supplierAuthorizationNotes = writeDestinationEvidence(
        plainNotes,
        readDestinationEvidence(returnData.supplierAuthorizationNotes)
      );
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
            where: {
              id: returnId,
              status: returnData.status,
              updatedAt: returnData.updatedAt,
            },
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
                  discountAmount: true,
                  paymentStatus: true,
                },
              },
              orderItem: {
                include: {
                  product: {
                    include: {
                      supplier: {
                        select: supplierReturnSelect,
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
        const paymentMethod = order.paymentMethod || "";
        const isStripeRefundableOrder = isStripePaymentMethod(paymentMethod);
        const isOrderAlreadyRefunded = order.paymentStatus === "REFUNDED";
        const isReturnAlreadyRefundSuccessful =
          returnData.refundStatus === "SUCCESS";
        const isPaidLikeOrderStatus =
          order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED";

        let processorFullyRefunded = isOrderAlreadyRefunded;
        let manualAudit: string | null = null;
        let manualProof: Parameters<typeof manualRefundAudit>[0] | null = null;
        const finalizeRefundState = async () => {
          await db.$transaction(
            async tx => {
              if (manualProof) {
                const previous = await tx.return.findMany({
                  where: { orderId: order.id, refundStatus: "SUCCESS" },
                  select: { id: true, resolutionNotes: true },
                });
                processorFullyRefunded = reconcileManualRepayments(previous, {
                  returnId,
                  orderTotal: Number(order.total),
                  proof: manualProof,
                }).fullyRefunded;
              }
              const shouldMarkOrderRefunded =
                processorFullyRefunded && order.paymentStatus !== "REFUNDED";
              await tx.return.update({
                where: { id: returnId },
                data: {
                  status: "REFUNDED",
                  refundStatus: "SUCCESS",
                  refundError: "",
                  ...(manualAudit
                    ? {
                        resolutionNotes: [
                          returnData.resolutionNotes,
                          manualAudit,
                        ]
                          .filter(Boolean)
                          .join("\n"),
                      }
                    : {}),
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
            },
            { isolationLevel: "Serializable" }
          );
        };

        if (isReturnAlreadyRefundSuccessful || isOrderAlreadyRefunded) {
          console.log(
            `ℹ️ Return ${returnId} already has successful refund status. Skipping duplicate Stripe refund.`
          );
          await finalizeRefundState();
        } else {
          if (!isStripeRefundableOrder) {
            const proof = manualRefundProofSchema.safeParse(
              body.manualRefundProof
            );
            if (
              !proof.success ||
              !isPaidLikeOrderStatus ||
              proof.data.review.amountRon > Number(order.total)
            ) {
              const error =
                "Refundul trebuie confirmat în procesatorul de plăți înainte să marchezi returul ca REFUNDED.";
              await db.return.update({
                where: { id: returnId },
                data: { refundStatus: "FAILED", refundError: error },
              });
              return NextResponse.json(
                { error, manualProofRequired: true, refundStatus: "FAILED" },
                { status: 400 }
              );
            }
            manualProof = proof.data;
            manualAudit = manualRefundAudit(proof.data, session.user.id);
            processorFullyRefunded =
              Math.round(proof.data.review.amountRon * 100) ===
              Math.round(Number(order.total) * 100);
            await finalizeRefundState();
          } else {
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

            const review = refundReviewSchema.safeParse(body.refundReview);
            if (!review.success) {
              return NextResponse.json(
                {
                  error:
                    "Verifică și confirmă suma rambursării: reduceri, rambursări anterioare și livrarea standard la retragerea din întreaga comandă. Nu deduce transportul de retur ori o penalizare automată.",
                  refundReviewRequired: true,
                },
                { status: 400 }
              );
            }
            const result = await reviewedStripeRefund(getStripeServerClient(), {
              review: review.data,
              returnId: updatedReturn.id,
              orderNumber: order.orderNumber,
              orderItemId: updatedReturn.orderItemId,
              paymentIntentId: order.stripePaymentIntentId,
              orderTotal: Number(order.total),
              reviewerId: session.user.id,
            });
            if (!result.succeeded) {
              await db.return.update({
                where: { id: returnId },
                data: {
                  refundStatus: "PENDING",
                  refundError: `Stripe: ${result.status}. Verifică procesatorul și reîncearcă sincronizarea; nu iniția o altă rambursare.`,
                },
              });
              return NextResponse.json(
                {
                  error: "Rambursarea Stripe nu este încă finalizată.",
                  refundStatus: "PENDING",
                },
                { status: 409 }
              );
            }
            processorFullyRefunded = result.fullyRefunded;

            await finalizeRefundState();
          }
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

    let notification: { success: boolean; error?: string } | undefined;
    if (hasStatusUpdate && (status === "APPROVED" || status === "REJECTED")) {
      try {
        notification =
          status === "APPROVED"
            ? await sendReturnApprovalNotification(updatedReturn)
            : await sendRejectionEmailAsync(updatedReturn);
      } catch {
        notification = {
          success: false,
          error:
            "Email sending failed; retry the same status after correcting the mail configuration.",
        };
      }
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
            discountAmount: true,
            paymentStatus: true,
          },
        },
        orderItem: {
          include: {
            product: {
              include: {
                supplier: {
                  select: supplierReturnSelect,
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
    return NextResponse.json(
      {
        success: true,
        notification,
        return: finalReturn
          ? {
              ...finalReturn,
              destination: getReturnDestination(finalReturn),
              destinationReview: readDestinationEvidence(
                finalReturn.supplierAuthorizationNotes
              ),
              supplierContract: supplierContract(
                finalReturn.orderItem.product?.supplier
              ),
              supplierAuthorizationNotes: supplierNotesWithoutDestination(
                finalReturn.supplierAuthorizationNotes
              ),
            }
          : null,
      },
      { status: notification?.success === false ? 202 : 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating return status:", error);

    // Check for Prisma errors
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Return changed during review. Reload before retrying." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update return status" },
      { status: 500 }
    );
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
    return result;
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
