import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  evaluateCodGuaranteePolicy,
  isLockerShippingMethodId,
} from "@/lib/checkout/cod-guarantee-policy";
import { resolveCodGuaranteeCustomerStats } from "@/lib/checkout/cod-guarantee-risk";

const querySchema = z.object({
  orderTotal: z
    .string()
    .transform(value => Number.parseFloat(value))
    .refine(value => Number.isFinite(value) && value >= 0, {
      message: "orderTotal must be a valid positive number",
    }),
  recipientType: z.enum(["B2B", "B2C"]).default("B2C"),
  shippingMethodId: z.string().optional(),
  guestEmail: z.string().optional(),
  phone: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const parsedQuery = querySchema.safeParse({
      orderTotal: request.nextUrl.searchParams.get("orderTotal") ?? "0",
      recipientType:
        request.nextUrl.searchParams.get("recipientType") ?? undefined,
      shippingMethodId:
        request.nextUrl.searchParams.get("shippingMethodId") ?? undefined,
      guestEmail: request.nextUrl.searchParams.get("guestEmail") ?? undefined,
      phone: request.nextUrl.searchParams.get("phone") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedQuery.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { orderTotal, recipientType, shippingMethodId, guestEmail, phone } =
      parsedQuery.data;
    const userStats = await resolveCodGuaranteeCustomerStats(
      session?.user?.id
        ? { userId: session.user.id, phone }
        : { guestEmail, phone }
    );

    const policy = evaluateCodGuaranteePolicy({
      orderTotal,
      recipientType,
      isLockerDelivery: isLockerShippingMethodId(shippingMethodId),
      priorOrderCount: userStats.priorOrderCount,
      priorCodRtoCount: userStats.priorCodRtoCount,
    });

    if (!session?.user?.id) {
      // Guests only learn whether a guarantee is required and the amount that
      // was evaluated. Account history, ids, and reason codes stay off the body.
      return NextResponse.json({
        required: policy.required,
        amount: Math.round(orderTotal * 100) / 100,
        mode: policy.mode,
        thresholds: policy.thresholds,
      });
    }

    return NextResponse.json({
      required: policy.required,
      mode: policy.mode,
      reasons: policy.reasons,
      thresholds: policy.thresholds,
      userStats,
    });
  } catch (error) {
    console.error("Error evaluating COD guarantee policy:", error);
    return NextResponse.json(
      { error: "Failed to evaluate COD guarantee policy" },
      { status: 500 }
    );
  }
}
