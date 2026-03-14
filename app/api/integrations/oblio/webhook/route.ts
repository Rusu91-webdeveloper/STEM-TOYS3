import { NextRequest, NextResponse } from "next/server";

import { getOblioConfig } from "@/lib/integrations/oblio/config";
import {
  handleOblioWebhookEvent,
  verifyOblioWebhookSignature,
} from "@/lib/integrations/oblio/service";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader =
    request.headers.get("X-Oblio-Signature") ||
    request.headers.get("X-Oblio-Payload");

  const config = getOblioConfig();
  if (config.webhookSecret) {
    const providedSecret = request.headers.get("X-Oblio-Webhook-Secret");
    if (providedSecret !== config.webhookSecret) {
      return NextResponse.json(
        { success: false, error: "Invalid Oblio webhook secret" },
        { status: 401 }
      );
    }
  }

  if (
    !verifyOblioWebhookSignature({ rawBody, encodedHeader: signatureHeader })
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid Oblio webhook signature" },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const result = await handleOblioWebhookEvent(payload);
  return NextResponse.json({
    success: result.ok,
    topic: result.topic,
  });
}
