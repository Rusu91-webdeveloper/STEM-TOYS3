import { NextResponse } from "next/server";
import { NetopiaProvider } from "@/lib/payments/NetopiaProvider";
import { prepareNetopiaAmount, formatCurrency } from "@/lib/utils/currency-converter";

export async function POST(request: Request) {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 [API] Netopia Payment Creation Request Received");
  console.log("═══════════════════════════════════════════════════════════");
  
  try {
    const {
      orderId,
      amount,
      currency = "RON",
      customerData,
      paymentMethod,
    } = await request.json();

    console.log("📋 [API] Request Parameters:");
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Amount: ${amount} ${currency}`);
    console.log(`   Payment Method: ${paymentMethod || "Not specified"}`);
    console.log(`   Customer: ${customerData?.name || "Not provided"} (${customerData?.email || "No email"})`);

    // Validate required fields
    if (!orderId || !amount || amount <= 0) {
      console.error("❌ [API] Validation failed - missing required fields");
      console.error(`   Order ID: ${orderId ? "✓" : "✗"}`);
      console.error(`   Amount: ${amount > 0 ? "✓" : "✗ (must be > 0)"}`);
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount" },
        { status: 400 }
      );
    }

    console.log("✅ [API] Request validation passed");

    // Initialize Netopia provider
    console.log("🔧 [API] Initializing Netopia provider...");
    let netopiaProvider;
    try {
      netopiaProvider = new NetopiaProvider();
      console.log("✅ [API] Netopia provider initialized successfully");
    } catch (providerError) {
      console.error("❌ [API] Failed to initialize Netopia provider:", providerError);
      return NextResponse.json(
        { 
          error: "Netopia payment gateway initialization failed",
          details: process.env.NODE_ENV === "development" 
            ? (providerError instanceof Error ? providerError.message : "Unknown error")
            : "Configuration error - contact support"
        },
        { status: 500 }
      );
    }

    // Try to load order and items from DB to build product lines and authoritative total
    console.log("🗄️  [API] Loading order data from database...");
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
        console.log("✅ [API] Order found in database");
        console.log(`   Order Number: ${orderRecord.orderNumber}`);
        console.log(`   Total: ${orderRecord.total} RON`);
        console.log(`   Items: ${orderRecord.items.length}`);
        
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

        console.log(`✅ [API] Loaded ${products.length} products from order`);

        // hydrate customer address from order shipping address if available
        const ship = orderRecord.shippingAddress;
        if (ship) {
          customerData.address = {
            street: ship.addressLine1 || ship.addressLine2 || "",
            city: ship.city || "",
            country: ship.country || "RO",
            postalCode: ship.postalCode || "",
          };
          console.log("✅ [API] Customer address loaded from order");
        }
      } else {
        console.warn("⚠️  [API] Order not found in database");
        console.warn("   Using provided amount and customer data");
      }
    } catch (dbError) {
      console.error("❌ [API] Database error while loading order:", dbError);
      console.warn("   Continuing with provided amount and empty products");
      // Continue with provided amount and empty products
    }

    // Convert currency to RON if needed (Netopia only accepts RON)
    console.log("💱 [API] Preparing amount for Netopia...");
    console.log(`   Input: ${finalAmount} ${currency}`);
    
    let amountInRON = finalAmount;
    let conversionInfo;
    
    try {
      const prepared = prepareNetopiaAmount(finalAmount, currency);
      amountInRON = prepared.amountInRON;
      conversionInfo = prepared.conversionInfo;
      
      if (conversionInfo) {
        console.log("✅ [API] Currency converted:");
        console.log(`   From: ${formatCurrency(conversionInfo.originalAmount, conversionInfo.originalCurrency)}`);
        console.log(`   To: ${formatCurrency(conversionInfo.convertedAmount, "RON")}`);
        console.log(`   Rate: 1 ${conversionInfo.originalCurrency} = ${conversionInfo.exchangeRate} RON`);
      } else {
        console.log("✅ [API] Amount already in RON, no conversion needed");
      }
    } catch (conversionError) {
      console.error("❌ [API] Currency conversion failed:", conversionError);
      return NextResponse.json(
        {
          error: "Currency conversion failed",
          details: conversionError instanceof Error 
            ? conversionError.message 
            : "Unable to convert currency to RON",
        },
        { status: 400 }
      );
    }
    
    // Create payment data for Netopia
    const orderData = {
      id: orderId,
      amount: amountInRON,
      currency: "RON",
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
    console.log("💳 [API] Creating Netopia payment...");
    console.log(`   Final Amount: ${finalAmount} ${currency}`);
    console.log(`   Products: ${products.length} items`);
    
    let paymentResult;
    try {
      paymentResult = await netopiaProvider.createPayment(orderData);
      console.log("✅ [API] Payment created successfully");
    } catch (paymentError) {
      console.error("❌ [API] Payment creation failed:", paymentError);
      throw paymentError;
    }

    if (!paymentResult.paymentUrl || !paymentResult.transactionId) {
      console.error("❌ [API] Invalid payment result");
      console.error("   Payment URL:", paymentResult.paymentUrl ? "Present" : "Missing");
      console.error("   Transaction ID:", paymentResult.transactionId ? "Present" : "Missing");
      return NextResponse.json(
        { error: "Netopia did not return a payment URL" },
        { status: 502 }
      );
    }

    console.log("📝 [API] Payment result:");
    console.log(`   Payment URL: ${paymentResult.paymentUrl}`);
    console.log(`   Transaction ID: ${paymentResult.transactionId}`);
    console.log(`   Invoice ID: ${paymentResult.invoiceId}`);
    
    if (conversionInfo) {
      console.log(`   ⚠️  Currency Conversion Applied:`);
      console.log(`      Original: ${formatCurrency(conversionInfo.originalAmount, conversionInfo.originalCurrency)}`);
      console.log(`      Charged: ${formatCurrency(conversionInfo.convertedAmount, "RON")}`);
    }

    // Update order in database with Netopia transaction details
    console.log("🗄️  [API] Updating order in database...");
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
      console.log("✅ [API] Order updated successfully in database");
    } catch (dbError) {
      console.error("❌ [API] Failed to update order in database:", dbError);
      console.warn("   Payment was created but order update failed");
      console.warn("   Manual intervention may be required");
      // Continue with payment creation even if DB update fails
    }

    console.log("✅ [API] Payment creation completed successfully");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    return NextResponse.json({
      paymentUrl: paymentResult.paymentUrl,
      invoiceId: paymentResult.invoiceId,
      transactionId: paymentResult.transactionId,
      status: paymentResult.status,
      ...(conversionInfo && {
        currencyConversion: {
          original: {
            amount: conversionInfo.originalAmount,
            currency: conversionInfo.originalCurrency,
          },
          converted: {
            amount: conversionInfo.convertedAmount,
            currency: "RON",
          },
          rate: conversionInfo.exchangeRate,
          note: conversionInfo.note,
        },
      }),
    });
  } catch (error) {
    console.error("");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("❌ [API] Netopia Payment Creation FAILED");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("Error details:", error);
    console.error("");

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to create payment",
        details: errorMessage, // EXPOSING ERROR FOR DEBUGGING
        debug_env: {
          node_env: process.env.NODE_ENV,
          site_url: process.env.NEXT_PUBLIC_SITE_URL || "MISSING",
        }
      },
      { status: 500 }
    );
  }
}
