import { NextResponse } from "next/server";

import { publicShippingSettings } from "@/lib/shipping/settings";
import { getShippingSettings } from "@/lib/utils/store-settings";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(
      publicShippingSettings(await getShippingSettings()),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Checkout shipping configuration unavailable:", error);
    return NextResponse.json(
      {
        error: "Configurația de livrare nu este disponibilă. Încearcă din nou.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
