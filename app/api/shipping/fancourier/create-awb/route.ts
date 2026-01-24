import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createFanAwbForOrder } from "@/lib/shipping/fancourier-awb";

const requestSchema = z.object({
    orderId: z.string().min(1),
});

/**
 * POST /api/shipping/fancourier/create-awb
 * 
 * Creates an AWB (Air Way Bill) for an order using FAN Courier.
 * Requires ADMIN authentication.
 */
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = requestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const result = await createFanAwbForOrder(parsed.data.orderId);

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        // Include warning if manual review is required
        if (result.manualReviewRequired) {
            return NextResponse.json({
                ...result,
                warning: `This order requires manual review: ${result.reviewReason}`,
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("FAN Courier AWB creation failed:", error);
        return NextResponse.json(
            {
                error: "Failed to create AWB",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
