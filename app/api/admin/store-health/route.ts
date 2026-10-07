import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getStoreHealthReport } from "@/lib/monitoring/store-health";
import { withRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const GET = withRateLimit(
  async () => {
    const session = await auth();
    if (session?.user?.role !== "ADMIN")
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    return NextResponse.json(await getStoreHealthReport(), {
      headers: { "Cache-Control": "no-store" },
    });
  },
  { limit: 20, windowMs: 60_000 }
);
