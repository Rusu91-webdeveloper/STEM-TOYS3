import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateReturnLabel } from "@/lib/return-label";
import { getStripeServerClient } from "@/lib/stripe-server";
import { sendReturnApprovedEmail, sendReturnRejectedEmail } from "@/lib/email/return-templates";

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
    const { status } = await request.json();

    console.log(`🔄 Processing return ${returnId} status change to: ${status}`);

    // Validate status
    const validStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "RECEIVED",
      "REFUNDED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
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
            stripePaymentIntentId: true,
            total: true,
            shippingCost: true,
            paymentStatus: true,
          },
        },
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

    if (!returnData) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    // Update return status
    const updatedReturn = await db.return.update({
      where: { id: returnId },
      data: { status },
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
            stripePaymentIntentId: true,
            total: true,
            shippingCost: true,
            paymentStatus: true,
          },
        },
        orderItem: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`✅ Return ${returnId} status updated to: ${status}`);

    // Stripe refund logic for REFUNDED status
    if (status === "REFUNDED") {
      try {
        const stripe = getStripeServerClient();
        const order = updatedReturn.order as any;
        if (!order.stripePaymentIntentId) {
          await db.return.update({
            where: { id: returnId },
            data: {
              refundStatus: "FAILED",
              refundError:
                "Order does not have a Stripe payment intent ID. Cannot process refund.",
            },
          });
          return NextResponse.json(
            {
              error:
                "Order does not have a Stripe payment intent ID. Cannot process refund.",
              refundStatus: "FAILED",
              refundError:
                "Order does not have a Stripe payment intent ID. Cannot process refund.",
            },
            { status: 400 }
          );
        }
        if (order.paymentStatus === "REFUNDED") {
          await db.return.update({
            where: { id: returnId },
            data: { refundStatus: "SUCCESS", refundError: "" },
          });
        } else {
          const refundAmount = Math.round(
            (order.total - order.shippingCost) * 100
          );
          if (refundAmount <= 0) {
            await db.return.update({
              where: { id: returnId },
              data: {
                refundStatus: "FAILED",
                refundError:
                  "Refund amount is zero or negative. Skipping Stripe refund.",
              },
            });
          } else {
            const refund = await stripe.refunds.create({
              payment_intent: order.stripePaymentIntentId,
              amount: refundAmount,
            });
            await db.order.update({
              where: { id: order.id },
              data: { paymentStatus: "REFUNDED" },
            });
            await db.return.update({
              where: { id: returnId },
              data: { refundStatus: "SUCCESS", refundError: "" },
            });
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

    // If status is changed to APPROVED, send email with return label (non-blocking)
    if (status === "APPROVED") {
      console.log(`📧 Queueing return approval email for return ${returnId}`);
      
      // Fire-and-forget: Don't await this - let it run in background
      // This prevents timeout while still sending the email
      sendApprovalEmailAsync(updatedReturn).catch(err => {
        console.error("❌ Background email sending failed:", err);
      });
    }

    // If status is changed to REJECTED, send rejection email (non-blocking)
    if (status === "REJECTED") {
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
            stripePaymentIntentId: true,
            total: true,
            shippingCost: true,
            paymentStatus: true,
          },
        },
        orderItem: {
          include: {
            product: true,
          },
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
      customerName: (updatedReturn.user.name ?? updatedReturn.user.email) as string,
      customerEmail: updatedReturn.user.email,
      customerAddress,
      language: "ro",
    });

    console.log(`✅ Background: PDF generated, size: ${pdfBuffer.length} bytes`);

    // Format order date
    const orderDate = new Date(updatedReturn.order.createdAt).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Convert PDF to Base64 for email attachment
    const pdfBase64 = pdfBuffer.toString("base64");

    console.log(`📧 Background: Sending approval email to ${updatedReturn.user.email}...`);

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
      console.log(`✅ Background: Return approval email sent to ${updatedReturn.user.email}`);
    } else {
      console.error(`❌ Background: Email sending failed:`, result.error);
    }
  } catch (emailError) {
    console.error("❌ Background email error:", emailError);
    console.error("❌ Email error details:", {
      errorMessage: emailError instanceof Error ? emailError.message : "Unknown error",
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
    console.log(`📧 Background: Starting rejection email for return ${updatedReturn.id}`);

    // Format order date
    const orderDate = new Date(updatedReturn.order.createdAt).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`📧 Background: Sending rejection email to ${updatedReturn.user.email}...`);

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
      console.log(`✅ Background: Rejection email sent to ${updatedReturn.user.email}`);
    } else {
      console.error(`❌ Background: Rejection email failed:`, result.error);
    }
  } catch (emailError) {
    console.error("❌ Background rejection email error:", emailError);
    console.error("❌ Email error details:", {
      errorMessage: emailError instanceof Error ? emailError.message : "Unknown error",
      returnId: updatedReturn.id,
      customerEmail: updatedReturn.user.email,
      orderNumber: updatedReturn.order.orderNumber,
    });
    throw emailError;
  }
}
