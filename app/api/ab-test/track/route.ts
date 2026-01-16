import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ABTestingService } from "@/lib/services/ab-testing-service";

const trackMetricSchema = z.object({
    testId: z.string().min(1),
    variantId: z.string().min(1),
    metric: z.enum(["impressions", "clicks", "conversions", "socialShares", "timeOnPage", "bounceRate"]),
    value: z.number().optional().default(1),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = trackMetricSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Validation failed", details: validation.error.flatten() }, { status: 400 });
        }

        const { testId, variantId, metric, value } = validation.data;

        await ABTestingService.trackMetric(testId, variantId, metric as any, value);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error tracking A/B metric:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
