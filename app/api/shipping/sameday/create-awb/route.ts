import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createAwbForOrder } from "@/lib/shipping/sameday-awb";

const requestSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = requestSchema.parse(await request.json());
    const result = await createAwbForOrder(body.orderId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sameday AWB creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create AWB" },
      { status: 500 }
    );
  }
}
