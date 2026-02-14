import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ABTestingService } from "@/lib/services/ab-testing-service";
import { ABTestStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const testName = searchParams.get("testName");
        const testId = searchParams.get("testId");
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        if (!testName && !testId) {
            return NextResponse.json({ error: "Test Name or Test ID is required" }, { status: 400 });
        }

        let targetTestId = testId;

        // If name is provided, find the active test by name
        if (testName && !targetTestId) {
            const test = await db.aBTest.findFirst({
                where: {
                    name: testName,
                    status: ABTestStatus.RUNNING,
                    isActive: true
                },
                select: { id: true }
            });

            if (!test) {
                // No running test found with this name
                // Return a neutral/control response or 404? 
                // Better to return 404 so client knows to use default.
                return NextResponse.json({ error: "No active test found" }, { status: 404 });
            }
            targetTestId = test.id;
        }

        if (!targetTestId) {
            return NextResponse.json({ error: "Test not found" }, { status: 404 });
        }

        const test = await db.aBTest.findUnique({
            where: { id: targetTestId },
            include: { variants: true, metrics: true },
        });

        if (!test) {
            return NextResponse.json({ error: "Test not found" }, { status: 404 });
        }

        const variant = ABTestingService.getVariantForUser(test, userId);

        if (!variant) {
            return NextResponse.json({ error: "No variant assigned" }, { status: 404 });
        }

        return NextResponse.json({
            id: variant.id,
            name: variant.name,
            content: variant.content,
            isControl: variant.isControl,
            testId: targetTestId
        });

    } catch (error) {
        console.error("Error getting A/B variant:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
