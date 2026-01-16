import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ABTestingService } from "@/lib/services/ab-testing-service";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const test = await ABTestingService.getTestById(id);

        if (!test) {
            return NextResponse.json({ error: "Test not found" }, { status: 404 });
        }

        return NextResponse.json(test);
    } catch (error) {
        console.error("Error fetching A/B test:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Schema for updating - allowing partial updates
const updateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    // We generally don't want to update variants/weights while running to avoid data pollution
    // so we keep it simple for now.
});

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (session?.user?.role === "VISITOR") {
            return NextResponse.json({ error: "Demo Mode - Read Only Access", isDemo: true }, { status: 403 });
        }
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await request.json();

        const validation = updateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Validation failed", details: validation.error.flatten() }, { status: 400 });
        }

        const data = validation.data;

        // Direct DB update for fields that don't need complex service logic
        // ABTestingService doesn't have a generic 'updateTest' method visible in snippets
        // so we use Prisma directly for simple metadata updates.
        const updatedTest = await db.aBTest.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(updatedTest);
    } catch (error: any) {
        console.error("Error updating test:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (session?.user?.role === "VISITOR") {
            return NextResponse.json({ error: "Demo Mode - Read Only Access", isDemo: true }, { status: 403 });
        }
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        // Check if test exists
        const test = await db.aBTest.findUnique({ where: { id } });
        if (!test) {
            return NextResponse.json({ error: "Test not found" }, { status: 404 });
        }

        // Hard delete using Prisma (cascades to variants/metrics)
        await db.aBTest.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "Test deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting test:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
