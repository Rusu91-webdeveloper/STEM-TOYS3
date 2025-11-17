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

    // Try to load order and items from DB to build product lines and authoritative total
    let products: Array<{
      name: string;
      code?: string;
      category?: string;
      price: number;
      vat?: number;
      quantity?: number;
    }> = [];
    let finalAmount = amount;

    try {
      const { db } = await import("@/lib/db");
      const orderRecord = await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  sku: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
          shippingAddress: true,
          // Note: billingAddress relation doesn't exist in schema
          // Using shippingAddress for both billing and shipping
        },
      });

      if (orderRecord) {
        finalAmount = orderRecord.total;
        const effectiveVat =
          orderRecord.subtotal && orderRecord.subtotal > 0
            ? Math.round(
                ((orderRecord.tax / orderRecord.subtotal) * 100 + Number.EPSILON) *
                  100
              ) / 100
            : 0;

        products = orderRecord.items.map(item => ({
          name: item.name,
          code: item.product?.sku || item.productId || item.id,
          category: item.product?.category?.name || "Order Item",
          price: item.price,
          vat: effectiveVat,
          quantity: item.quantity,
        }));

        // hydrate customer address from order shipping address if available
        const ship = orderRecord.shippingAddress;
        if (ship) {
          customerData.address = {
            street: ship.addressLine1 || ship.addressLine2 || "",
            city: ship.city || "",
            country: ship.country || "RO",
            postalCode: ship.postalCode || "",
          };
        }
      }
    } catch (dbError) {
      console.error("Failed to enrich Netopia payload with products:", dbError);
      // Continue with provided amount and empty products
    }

    // Create payment data for Netopia
    const orderData = {
      id: orderId,
      amount: finalAmount,
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
      products,
    };

    // Create payment with Netopia
    const paymentResult = await netopiaProvider.createPayment(orderData);

    if (!paymentResult.paymentUrl || !paymentResult.transactionId) {
      return NextResponse.json(
        { error: "Netopia did not return a payment URL" },
        { status: 502 }
      );
    }

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
