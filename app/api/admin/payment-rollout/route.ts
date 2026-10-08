import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getRolloutStatistics } from "@/lib/middleware/payment-provider";

// GET - Get current rollout statistics and configuration
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN")
      return NextResponse.json(
        { error: "Acces rezervat administratorilor." },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
      );
    const stats = await getRolloutStatistics();

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Error getting rollout statistics:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get rollout statistics",
      },
      { status: 500 }
    );
  }
}

// The legacy update helper returned success without persisting any changes.
export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN")
      return NextResponse.json(
        { error: "Acces rezervat administratorilor." },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
      );
    return NextResponse.json(
      {
        error:
          "Configurarea furnizorilor de plată se face în mediul de găzduire. Acest endpoint nu salvează modificări.",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Payment configuration access failed:", error);
    return NextResponse.json(
      { error: "Configurația nu este disponibilă." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
