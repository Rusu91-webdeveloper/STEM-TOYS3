import { NextResponse } from "next/server";
import { rateLimitHealth } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = rateLimitHealth.status;
  return NextResponse.json({ ok: true, data });
}
