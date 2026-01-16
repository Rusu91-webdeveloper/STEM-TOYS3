import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { ABTestingService } from "@/lib/services/ab-testing-service";

const statusActionSchema = z.object({
    action: z.enum(["START", "PAUSE", "STOP"]),
});

export async function POST(
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

        const validation = statusActionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid action", details: validation.error.flatten() }, { status: 400 });
        }

        const { action } = validation.data;
        let result;

        switch (action) {
            case "START":
                result = await ABTestingService.startTest(id);
                break;
            case "PAUSE":
                result = await ABTestingService.pauseTest(id);
                break;
            case "STOP":
                result = await ABTestingService.stopTest(id);
                break;
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error(`Error changing test status to ${request.body}:`, error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
