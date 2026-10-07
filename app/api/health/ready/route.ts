import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

async function readiness() {
  if (
    !process.env.DATABASE_URL ||
    !(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)
  )
    return { status: "not_ready", reason: "Configuration unavailable" };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Readiness timeout")), 2000);
      }),
    ]);
    return { status: "ready" };
  } catch {
    return { status: "not_ready", reason: "Database unavailable" };
  } finally {
    if (timer) clearTimeout(timer);
    // Keep the shared pool alive for requests and subsequent probes.
  }
}

export async function GET() {
  const result = await readiness();
  return NextResponse.json(
    { ...result, timestamp: new Date().toISOString() },
    { status: result.status === "ready" ? 200 : 503, headers }
  );
}

export async function HEAD() {
  const result = await readiness();
  return new NextResponse(null, {
    status: result.status === "ready" ? 200 : 503,
    headers,
  });
}
