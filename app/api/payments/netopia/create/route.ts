import { NextResponse } from "next/server";
import { NetopiaProvider } from "@/lib/payments/NetopiaProvider";

export async function POST(request: Request) {
  try {
    const {
      orderId,
      amount,
      currency = "RON",
      customerData,
      paymentMethod,
    } = await request.json();

    // Validate required fields
    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount" },
        { status: 400 }
      );
    }

    // Initialize Netopia provider
    const netopiaProvider = new NetopiaProvider();

    // Create payment data for Netopia
    const orderData = {
      id: orderId,
      amount,
      currency,
      customer: customerData || {
        name: "Customer",
        email: "customer@example.com",
        phone: "",
        address: {
          street: "",
          city: "",
          country: "Romania",
          postalCode: "",
        },
      },
      metadata: {
        orderId,
        createdAt: new Date().toISOString(),
      },
    };

    // Create payment with Netopia
    const paymentResult = await netopiaProvider.createPayment(orderData);

    // Update order in database with Netopia transaction details
    try {
      const { db } = await import("@/lib/db");

      await db.order.update({
        where: { id: orderId },
        data: {
          netopiaTransactionId: paymentResult.transactionId,
          netopiaInvoiceId: paymentResult.invoiceId,
          netopiaPaymentUrl: paymentResult.paymentUrl,
          paymentMethod:
            paymentMethod || `netopia_${currency.toLowerCase()}`,
          // Update payment status to pending
          paymentStatus: "PENDING",
        },
      });
    } catch (dbError) {
      console.error("Failed to update order with Netopia data:", dbError);
      // Continue with payment creation even if DB update fails
    }

    return NextResponse.json({
      paymentUrl: paymentResult.paymentUrl,
      invoiceId: paymentResult.invoiceId,
      transactionId: paymentResult.transactionId,
      status: paymentResult.status,
    });
  } catch (error) {
    console.error("Error creating Netopia payment:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to create payment",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
