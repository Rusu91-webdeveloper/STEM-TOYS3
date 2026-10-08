import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getOwnerDashboard } from "@/lib/admin/dashboard-service";
import { auth } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const periodSchema = z.coerce.number().int().min(1).max(90);

export const GET = withRateLimit(
  async (request: NextRequest) => {
    try {
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Acces rezervat administratorilor." },
          { status: 403, headers }
        );
      }
      const period = periodSchema.safeParse(
        request.nextUrl.searchParams.get("period") ?? 30
      );
      if (!period.success) {
        return NextResponse.json(
          { error: "Perioada trebuie să fie între 1 și 90 de zile." },
          { status: 400, headers }
        );
      }
      return NextResponse.json(await getOwnerDashboard(period.data), {
        headers,
      });
    } catch (error) {
      console.error("Error fetching owner dashboard:", error);
      return NextResponse.json(
        { error: "Datele magazinului nu au putut fi încărcate." },
        { status: 500, headers }
      );
    }
  },
  { limit: 60, windowMs: 10 * 60 * 1000 }
);
