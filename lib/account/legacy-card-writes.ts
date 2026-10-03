import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export const privateCardHeaders = { "Cache-Control": "private, no-store" };

/** Retired account cards are not provider tokens. Never parse card input here. */
export async function rejectLegacyCardWrite() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: privateCardHeaders }
      );
    }

    return NextResponse.json(
      {
        code: "LEGACY_CARD_STORAGE_DISABLED",
        error:
          "Salvarea și modificarea cardurilor în cont nu sunt disponibile. Introdu datele cardului numai în formularul procesatorului de plată, la finalizarea comenzii.",
      },
      { status: 410, headers: privateCardHeaders }
    );
  } catch {
    console.error("Unable to authenticate legacy payment-card request");
    return NextResponse.json(
      { error: "Unable to verify authentication" },
      { status: 500, headers: privateCardHeaders }
    );
  }
}
