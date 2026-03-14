import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { ensureDefaultOblioWebhooks } from "@/lib/integrations/oblio/service";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const result = await ensureDefaultOblioWebhooks();
  return NextResponse.json({
    success: result.ok,
    message: result.message,
  });
}
