import { NextResponse } from "next/server";

import { getTaxSettings } from "@/lib/utils/store-settings";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(
      { taxSettings: await getTaxSettings() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Checkout configuration unavailable:", error);
    return NextResponse.json(
      { error: "Configurația nu este disponibilă. Încearcă din nou." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
