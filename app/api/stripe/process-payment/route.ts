import { NextRequest, NextResponse } from "next/server";
import { stripeServer } from "@/lib/stripe-server-integration";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, cardData, currency = "usd" } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!cardData || !cardData.number || !cardData.exp_month || !cardData.exp_year || !cardData.cvc) {
      return NextResponse.json(
        { success: false, error: "Invalid card data" },
        { status: 400 }
      );
    }

    // Process payment server-side
    const result = await stripeServer.processPayment(amount, cardData, currency);

    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentIntent: result.paymentIntent,
        message: "Payment processed successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Payment processing failed" 
      },
      { status: 500 }
    );
  }
}
