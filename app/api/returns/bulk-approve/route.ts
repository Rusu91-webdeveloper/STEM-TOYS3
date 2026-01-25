import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateReturnLabel } from "@/lib/return-label";
import { sendBulkReturnApprovedEmail } from "@/lib/email/return-templates";

// Increase timeout for this route (Vercel)
export const maxDuration = 60; // 60 seconds

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { returnIds } = await request.json();

    if (!returnIds || !Array.isArray(returnIds) || returnIds.length === 0) {
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

    // Check if all returns are already processed (not PENDING)
    const nonPendingReturns = existingReturns.filter(r => r.status !== "PENDING");
    if (nonPendingReturns.length === existingReturns.length) {
      const statusInfo = existingReturns.map(r => `${r.id.slice(-6)}: ${r.status}`).join(", ");
      return NextResponse.json(
        { 
          error: `Toate returnările selectate au fost deja procesate. Status curent: ${statusInfo}`,
          details: existingReturns
        },
        { status: 400 }
      );
    }

    // Get all returns with order and product details (only PENDING ones)
    const returns = await db.return.findMany({
      where: {
        id: { in: returnIds },
        status: "PENDING", // Only approve pending returns
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
      console.log(`⚠️ Only ${returns.length} of ${returnIds.length} returns are PENDING. Skipping ${returnIds.length - returns.length} already processed returns.`);
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

    // STEP 1: Update ALL return statuses first (fast operation)
    console.log(`📝 Updating ${returns.length} returns to APPROVED status...`);
    
    await db.$transaction(async tx => {
      await Promise.all(
        returns.map(returnItem =>
          tx.return.update({
            where: { id: returnItem.id },
            data: { status: "APPROVED" },
          })
        )
      );
    });
    
    console.log(`✅ All ${returns.length} returns updated to APPROVED`);

    // Build response data
    const processedOrders = Object.entries(returnsByOrder).map(([orderId, orderReturns]) => {
      const firstReturn = orderReturns[0];
      return {
        orderId,
        orderNumber: firstReturn.order.orderNumber,
        customerEmail: firstReturn.user.email,
        itemCount: orderReturns.length,
        returnIds: orderReturns.map(r => r.id),
      };
    });

    // STEP 2: Fire-and-forget email sending (non-blocking)
    // This runs in background after we return the response
    console.log(`📧 Queueing emails for ${processedOrders.length} orders...`);
    
    sendBulkApprovalEmailsAsync(returnsByOrder).catch(err => {
      console.error("❌ Background bulk email sending failed:", err);
    });

    // Return immediately - don't wait for emails
    return NextResponse.json({
      success: true,
      message: `Aprobat ${returns.length} returnări din ${processedOrders.length} comenzi. Emailurile se trimit în fundal.`,
      data: {
        processedOrders,
        totalReturns: returns.length,
        totalOrders: processedOrders.length,
      },
    });
  } catch (error) {
    console.error("Error in bulk return approval:", error);
    return NextResponse.json(
      { error: "Failed to process bulk return approval" },
      { status: 500 }
    );
  }
}

// Async helper function to send bulk approval emails - runs in background
async function sendBulkApprovalEmailsAsync(returnsByOrder: Record<string, any[]>) {
  console.log(`📧 Background: Starting bulk email processing...`);
  
  for (const [orderId, orderReturns] of Object.entries(returnsByOrder)) {
    try {
      const firstReturn = orderReturns[0];
      const customer = firstReturn.user;
      const order = firstReturn.order;
      const defaultAddress = customer.addresses[0];

      const customerAddress = defaultAddress
        ? `${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress.state}, ${defaultAddress.postalCode}, ${defaultAddress.country}`
        : undefined;

      const allProductNames = orderReturns
        .map((r: any) => r.orderItem.name)
        .join(", ");
      const allReturnIds = orderReturns.map((r: any) => r.id);

      console.log(`📄 Background: Generating PDF for order ${order.orderNumber}...`);

      // Generate one return label for all items
      const pdfBuffer = await generateReturnLabel({
        orderId: order.id,
        orderNumber: order.orderNumber,
        returnId: allReturnIds.join(","),
        productName: `${orderReturns.length} articol(e): ${allProductNames}`,
        productId: orderReturns[0].orderItem.productId || "",
        productSku: orderReturns
          .map((r: any) => r.orderItem.product?.sku || "N/A")
          .join(", "),
        reason: "Returnare în bloc",
        customerName: customer.name || customer.email,
        customerEmail: customer.email,
        customerAddress,
        language: "ro",
      });

      console.log(`✅ Background: PDF generated for order ${order.orderNumber}`);

      const orderDate = new Date(order.createdAt).toLocaleDateString("ro-RO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const pdfBase64 = pdfBuffer.toString("base64");

      console.log(`📧 Background: Sending email to ${customer.email}...`);

      // Use the proper email template via UnifiedEmailService
      const result = await sendBulkReturnApprovedEmail({
        to: customer.email,
        customerName: customer.name || "Client",
        orderNumber: order.orderNumber,
        orderDate,
        items: orderReturns.map((r: any) => ({
          productName: r.orderItem.name,
          quantity: r.orderItem.quantity,
          reason: r.reason,
        })),
        pdfBase64,
      });

      if (result.success) {
        console.log(`✅ Background: Email sent to ${customer.email} for order ${order.orderNumber}`);
      } else {
        console.error(`❌ Background: Email failed for ${customer.email}:`, result.error);
      }
    } catch (emailError) {
      console.error(`❌ Background: Error sending email for order ${orderId}:`, emailError);
      // Continue processing other orders even if one fails
    }
  }
  
  console.log(`✅ Background: Bulk email processing complete`);
}
