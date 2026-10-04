import { NextRequest, NextResponse } from "next/server";

import { validateCsrfForRequest } from "@/lib/csrf";
import { getClientIdentifier, rateLimiter } from "@/lib/rate-limit";
import { receiptText, withdrawalSchema } from "@/lib/returns/withdrawal";
import { registerWithdrawal } from "@/lib/returns/withdrawal-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest) {
  // Preserve the server receipt time even if validation/rate-limit I/O is slow.
  const receivedAt = new Date();
  const security = await validateCsrfForRequest(request);
  if (!security.valid)
    return NextResponse.json(
      {
        error:
          "Validarea de securitate a expirat. Reîncarcă pagina și încearcă din nou.",
      },
      { status: 403, headers }
    );
  const limit = await rateLimiter.checkLimit(
    getClientIdentifier(request),
    "returns:withdrawal",
    { windowMs: 600000, maxRequests: 10 }
  );
  if (!limit.success)
    return NextResponse.json(
      { error: "Prea multe solicitări. Încearcă din nou în câteva minute." },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(limit.retryAfter ?? 600) },
      }
    );
  try {
    const text = await request.text();
    if (text.length > 8192)
      return NextResponse.json(
        { error: "Formularul este prea lung." },
        { status: 413, headers }
      );
    const parsed = withdrawalSchema.safeParse(JSON.parse(text));
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            "Verifică numele, identificarea contractului, emailul și confirmarea retragerii.",
        },
        { status: 400, headers }
      );
    // Receipt records the declaration only. No unauthenticated order lookup,
    // deadline guess, refund, cancellation or delivery-status prerequisite.
    const receipt = await registerWithdrawal(parsed.data, receivedAt);
    return NextResponse.json(
      {
        receipt,
        text: receiptText(receipt),
        emailSent: receipt.customerNotified,
      },
      { status: 201, headers }
    );
  } catch (error) {
    const conflict =
      error instanceof Error &&
      error.message === "WITHDRAWAL_REFERENCE_CONFLICT";
    const invalid = error instanceof SyntaxError;
    return NextResponse.json(
      {
        error: conflict
          ? "Referința formularului nu corespunde. Reîncarcă pagina."
          : invalid
            ? "Formular invalid."
            : "Nu am putut confirma înregistrarea. Reîncearcă sau trimite declarația la info@techtots.ro.",
      },
      { status: conflict ? 409 : invalid ? 400 : 503, headers }
    );
  }
}
