import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNotificationService } from "@/lib/email/admin-notification-service";
import { syncParentOrderFromSupplierOrders } from "@/lib/order-fulfillment-sync";
import { getStripeServerClient } from "@/lib/stripe-server";

const oosResolutionSchema = z.object({
  action: z.enum([
    "WAIT_RESTOCK",
    "OFFER_REPLACEMENT",
    "PARTIAL_REFUND_ITEM",
    "REPLACEMENT_CONFIRMED",
  ]),
  detail: z.string().optional().default(""),
});

const ACTION_TO_TARGET_STATUS = {
  WAIT_RESTOCK: "ISSUE_DELAYED",
  OFFER_REPLACEMENT: "ISSUE_OOS",
  PARTIAL_REFUND_ITEM: "CANCELLED",
  REPLACEMENT_CONFIRMED: "READY_TO_PLACE",
} as const;

type OosResolutionAction = keyof typeof ACTION_TO_TARGET_STATUS;

function appendBlock(existing: string | null, block: string) {
  return [existing, block].filter(Boolean).join("\n\n");
}

function sanitizeNoteValue(value: string | null | undefined) {
  return (value || "").replace(/[;\n\r]+/g, " | ").trim();
}

function normalizePaymentMethod(value: string | null | undefined) {
  return (value || "").toLowerCase();
}

function isCodPaymentMethod(value: string | null | undefined) {
  const normalized = normalizePaymentMethod(value);
  return normalized === "cash_on_delivery" || normalized === "cod";
}

function isNetopiaPayment(value: string | null | undefined) {
  const normalized = normalizePaymentMethod(value);
  return normalized.includes("netopia");
}

function isPaidLikeStatus(value: string | null | undefined) {
  return ["PAID", "COMPLETED"].includes((value || "").toUpperCase());
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
    const { action, detail } = oosResolutionSchema.parse(body);

    const supplierOrder = await db.supplierOrder.findUnique({
      where: { id: supplierOrderId },
      include: {
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
            price: true,
            quantity: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            paymentMethod: true,
            paymentStatus: true,
            stripePaymentIntentId: true,
            netopiaTransactionId: true,
            notes: true,
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

    const targetStatus = ACTION_TO_TARGET_STATUS[action];
    const timestamp = new Date().toISOString();
    const detailText = (detail || "").trim();
    const detailNoteValue = sanitizeNoteValue(detailText);
    const decisionNote = [
      `[OOS_DECISION] ${timestamp}`,
      `supplierLine=${supplierOrder.id}`,
      `action=${action}`,
      `targetStatus=${targetStatus}`,
      `product=${supplierOrder.orderItem.name || "Unknown"}`,
      detailNoteValue ? `detail=${detailNoteValue}` : undefined,
      `by=${session.user.email || "admin"}`,
    ]
      .filter(Boolean)
      .join(" ; ");

    const paymentMethod = supplierOrder.order.paymentMethod;
    const paymentStatus = supplierOrder.order.paymentStatus;
    const lineAmount =
      Number(supplierOrder.orderItem.price || 0) *
      Number(supplierOrder.quantity || supplierOrder.orderItem.quantity || 0);
    const lineAmountCents = Math.round(lineAmount * 100);

    let refundResult:
      | {
          attempted: boolean;
          status:
            | "SUCCESS"
            | "PENDING_MANUAL"
            | "SKIPPED_NOT_PREPAID"
            | "SKIPPED_ALREADY_PROCESSED"
            | "FAILED";
          mode?: "stripe" | "netopia-manual";
          amount?: number;
          amountCents?: number;
          refundId?: string | null;
          message?: string;
        }
      | undefined;

    let extraSupplierNotes: string[] = [];
    let extraOrderNotes: string[] = [];

    if (action === "PARTIAL_REFUND_ITEM") {
      const alreadyRefundLogged =
        supplierOrder.notes?.includes("[OOS_REFUND_SUCCESS]") ||
        supplierOrder.notes?.includes("[OOS_REFUND_REQUESTED]");

      if (alreadyRefundLogged) {
        refundResult = {
          attempted: false,
          status: "SKIPPED_ALREADY_PROCESSED",
          amount: lineAmount,
          amountCents: lineAmountCents,
          message: "Refund already logged for this supplier line.",
        };
      } else if (lineAmountCents <= 0) {
        refundResult = {
          attempted: false,
          status: "FAILED",
          amount: lineAmount,
          amountCents: lineAmountCents,
          message: "Refund amount is zero or negative.",
        };
        extraSupplierNotes.push(
          `[OOS_REFUND_FAILED] ${timestamp} ; amount=${lineAmount.toFixed(
            2
          )} ; reason=INVALID_AMOUNT`
        );
      } else if (
        isCodPaymentMethod(paymentMethod) ||
        !isPaidLikeStatus(paymentStatus)
      ) {
        refundResult = {
          attempted: false,
          status: "SKIPPED_NOT_PREPAID",
          amount: lineAmount,
          amountCents: lineAmountCents,
          message:
            "Order is not prepaid/paid. No automatic refund executed for this line.",
        };
        extraSupplierNotes.push(
          `[OOS_REFUND_SKIPPED] ${timestamp} ; amount=${lineAmount.toFixed(
            2
          )} ; reason=NOT_PREPAID_OR_NOT_PAID`
        );
      } else if (supplierOrder.order.stripePaymentIntentId) {
        try {
          const stripe = getStripeServerClient();
          const stripeRefund = await stripe.refunds.create(
            {
              payment_intent: supplierOrder.order.stripePaymentIntentId,
              amount: lineAmountCents,
              metadata: {
                source: "supplier_oos_resolution",
                action,
                supplierOrderId: supplierOrder.id,
                orderId: supplierOrder.order.id,
                orderNumber: supplierOrder.order.orderNumber,
                orderItemId: supplierOrder.orderItem.id,
              },
            },
            {
              idempotencyKey: `supplier-oos-refund:${supplierOrder.id}:${lineAmountCents}`,
            }
          );

          refundResult = {
            attempted: true,
            status: "SUCCESS",
            mode: "stripe",
            amount: lineAmount,
            amountCents: lineAmountCents,
            refundId: stripeRefund.id,
            message: "Stripe partial refund executed.",
          };

          const refundNote = `[OOS_REFUND_SUCCESS] ${timestamp} ; mode=STRIPE ; refundId=${
            stripeRefund.id
          } ; amount=${lineAmount.toFixed(2)} ; by=${session.user.email || "admin"}`;
          extraSupplierNotes.push(refundNote);
          extraOrderNotes.push(
            `[PARTIAL_REFUND] ${timestamp} ; source=OOS_SUPPLIER_LINE ; supplierOrderId=${
              supplierOrder.id
            } ; amount=${lineAmount.toFixed(2)} ; stripeRefundId=${
              stripeRefund.id
            } ; by=${session.user.email || "admin"}`
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stripe refund failed";
          refundResult = {
            attempted: true,
            status: "FAILED",
            mode: "stripe",
            amount: lineAmount,
            amountCents: lineAmountCents,
            message,
          };
          extraSupplierNotes.push(
            `[OOS_REFUND_FAILED] ${timestamp} ; mode=STRIPE ; amount=${lineAmount.toFixed(
              2
            )} ; error=${sanitizeNoteValue(message)}`
          );
        }
      } else if (
        isNetopiaPayment(paymentMethod) ||
        supplierOrder.order.netopiaTransactionId
      ) {
        const requestId = `OOS-REF-${Date.now()}-${supplierOrder.id.slice(-6).toUpperCase()}`;
        refundResult = {
          attempted: false,
          status: "PENDING_MANUAL",
          mode: "netopia-manual",
          amount: lineAmount,
          amountCents: lineAmountCents,
          refundId: requestId,
          message:
            "Netopia partial refunds require manual processing. Admin notification was sent.",
        };

        const requestNote = `[OOS_REFUND_REQUESTED] ${timestamp} ; mode=NETOPIA_MANUAL ; requestId=${requestId} ; amount=${lineAmount.toFixed(
          2
        )} ; supplierOrderId=${supplierOrder.id} ; by=${session.user.email || "admin"}`;
        extraSupplierNotes.push(requestNote);
        extraOrderNotes.push(requestNote);

        const issueDescription =
          `OOS partial refund requested for order ${supplierOrder.order.orderNumber}. ` +
          `Supplier line ${supplierOrder.id} (${supplierOrder.orderItem.name} x${supplierOrder.quantity}). ` +
          `Amount: ${lineAmount.toFixed(2)} RON. ` +
          `Netopia transaction: ${supplierOrder.order.netopiaTransactionId || "N/A"}. ` +
          `Reason/detail: ${detailText || "OOS supplier line cancellation"}. ` +
          `Please process manually in Netopia dashboard and record completion in order notes.`;

        AdminNotificationService.sendOrderIssueNotification(
          supplierOrder.order.id,
          "OOS_PARTIAL_REFUND_REQUEST",
          issueDescription,
          "HIGH"
        ).catch(err => {
          console.error(
            "Failed to send OOS partial refund admin notification:",
            err
          );
        });
      } else {
        refundResult = {
          attempted: false,
          status: "FAILED",
          amount: lineAmount,
          amountCents: lineAmountCents,
          message:
            "Unsupported payment method for automatic OOS partial refund.",
        };
        extraSupplierNotes.push(
          `[OOS_REFUND_FAILED] ${timestamp} ; amount=${lineAmount.toFixed(
            2
          )} ; reason=UNSUPPORTED_PAYMENT_METHOD ; paymentMethod=${sanitizeNoteValue(
            paymentMethod
          )}`
        );
      }
    }

    const finalSupplierNotes = [decisionNote, ...extraSupplierNotes].reduce(
      (acc, note) => appendBlock(acc, note),
      supplierOrder.notes ?? null
    );

    const finalOrderNotes = extraOrderNotes.reduce(
      (acc, note) => appendBlock(acc, note),
      supplierOrder.order.notes ?? null
    );

    const updated = await db.$transaction(async tx => {
      const updatedSupplierOrder = await tx.supplierOrder.update({
        where: { id: supplierOrder.id },
        data: {
          status: targetStatus,
          notes: finalSupplierNotes,
          updatedAt: new Date(),
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              paymentMethod: true,
              paymentStatus: true,
            },
          },
        },
      });

      if (extraOrderNotes.length > 0) {
        await tx.order.update({
          where: { id: supplierOrder.order.id },
          data: {
            notes: finalOrderNotes,
          },
        });
      }

      return updatedSupplierOrder;
    });

    await syncParentOrderFromSupplierOrders(
      supplierOrder.order.id,
      "admin-oos-resolution"
    );

    return NextResponse.json({
      success: true,
      supplierOrder: updated,
      resolution: {
        action,
        targetStatus,
        detail: detailText || null,
      },
      refund: refundResult || null,
    });
  } catch (error) {
    console.error("Error applying OOS resolution:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to apply OOS resolution" },
      { status: 500 }
    );
  }
}
