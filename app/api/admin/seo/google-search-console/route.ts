import { NextRequest, NextResponse } from "next/server";

import { settingsRequest } from "@/lib/admin/settings-http";

// Legacy reporting included generated figures, including provider-error fallbacks.
// Keep the boundary explicit until its collection path guarantees sourced data.
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  return settingsRequest(request, () =>
    NextResponse.json(
      {
        error:
          "Raportul SEO este indisponibil până la conectarea și verificarea sursei de date reale.",
      },
      { status: 503 }
    )
  );
}
export const POST = GET;
