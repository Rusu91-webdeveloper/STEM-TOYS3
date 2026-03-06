import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  evaluateCodGuaranteePolicy,
  isLockerShippingMethodId,
} from "@/lib/checkout/cod-guarantee-policy";
import { getCodGuaranteeUserStats } from "@/lib/checkout/cod-guarantee-risk";

const querySchema = z.object({
  orderTotal: z
    .string()
    .transform(value => Number.parseFloat(value))
    .refine(value => Number.isFinite(value) && value >= 0, {
      message: "orderTotal must be a valid positive number",
    }),
  recipientType: z.enum(["B2B", "B2C"]).default("B2C"),
  shippingMethodId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const parsedQuery = querySchema.safeParse({
      orderTotal: request.nextUrl.searchParams.get("orderTotal") ?? "0",
      recipientType:
        request.nextUrl.searchParams.get("recipientType") ?? undefined,
      shippingMethodId:
        request.nextUrl.searchParams.get("shippingMethodId") ?? undefined,
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

    const { orderTotal, recipientType, shippingMethodId } = parsedQuery.data;
    const userStats = await getCodGuaranteeUserStats(session.user.id);

    const policy = evaluateCodGuaranteePolicy({
      orderTotal,
      recipientType,
      isLockerDelivery: isLockerShippingMethodId(shippingMethodId),
      priorOrderCount: userStats.priorOrderCount,
      priorCodRtoCount: userStats.priorCodRtoCount,
    });

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
