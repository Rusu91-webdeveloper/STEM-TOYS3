import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { ABTestingService } from "@/lib/services/ab-testing-service";
import { ABTestType, ABTestAudience } from "@prisma/client";

// Schema for creating a new A/B test
const createABTestSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    type: z.nativeEnum(ABTestType),
    targetAudience: z.nativeEnum(ABTestAudience).optional(),
    startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    variants: z.array(z.object({
        name: z.string().min(1, "Variant name is required"),
        content: z.string().min(1, "Variant content is required"),
        weight: z.number().min(0).max(100),
        isControl: z.boolean().optional().default(false),
    })).min(2, "At least 2 variants are required"),
});

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status"); // Optional status filter

        let tests;
        if (status) {
            // If status filter is applied, we might need a more specific query
            // But ABTestingService.getAllTests() returns everything, so we might need to filter in memory or extend the service.
            // Looking at ABTestingService, it has specialized methods:
            // getRunningTests, getCompletedTests.

            if (status === 'RUNNING') {
                tests = await ABTestingService.getRunningTests();
            } else if (status === 'COMPLETED') {
                tests = await ABTestingService.getCompletedTests();
            } else {
                // Fallback to all tests if status doesn't match specific methods
                // Or if 'DRAFT' (Service doesn't have getDraftTests explicitly shown in snippet)
                tests = await ABTestingService.getAllTests();
                // Simple in-memory filter if needed, though getAllTests checks database
                // Let's rely on getAllTests for now as per snippet it seems to return all.
            }
        } else {
            tests = await ABTestingService.getAllTests();
        }

        return NextResponse.json(tests);
    } catch (error) {
        console.error("Error fetching A/B tests:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        // Check for demo mode/visitor restrictions if applicable (copying pattern from other admin routes)
        if (session?.user?.role === "VISITOR") {
            return NextResponse.json(
                {
                    error: "Demo Mode - Read Only Access",
                    message: "This is a demonstration account. Write operations are disabled.",
                    isDemo: true,
                },
                { status: 403 }
            );
        }

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Parse and validate
        const validationResult = createABTestSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        const newTest = await ABTestingService.createABTest({
            ...data,
            createdBy: session.user.id,
            // Ensure types match what service expects
            type: data.type,
            targetAudience: data.targetAudience,
        });

        return NextResponse.json(newTest, { status: 201 });
    } catch (error: any) {
        console.error("Error creating A/B test:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
