import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  getLocalOblioInvoiceState,
  syncOrderInvoiceToOblio,
} from "@/lib/integrations/oblio/service";

const syncSchema = z.object({
  force: z.boolean().optional().default(false),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const invoices = await getLocalOblioInvoiceState(id);

  return NextResponse.json({
    success: true,
    invoices,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { force } = syncSchema.parse(body);
  const { id } = await params;

  const result = await syncOrderInvoiceToOblio({
    orderId: id,
    force,
  });

  return NextResponse.json({
    success: result.ok,
    result,
  });
}
