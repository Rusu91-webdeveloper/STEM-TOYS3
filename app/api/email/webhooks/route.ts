import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  trackEmailOpen,
  trackEmailClick,
  trackEmailBounce,
  trackDeliveryStatus,
} from "@/lib/email/monitoring";
import { EmailDeliveryStatus } from "@/lib/email/types";

// Webhook schemas for different providers
const ResendWebhookSchema = z.object({
  type: z.enum([
    "email.sent",
    "email.delivered",
    "email.delivery_delayed",
    "email.complained",
    "email.bounced",
    "email.opened",
    "email.clicked",
  ]),
  created_at: z.string(),
  data: z.object({
    email_id: z.string(),
    to: z.array(z.string().email()),
    from: z.string().email(),
    subject: z.string(),
    created_at: z.string(),
  }),
});

const BrevoWebhookSchema = z.object({
  event: z.enum([
    "delivered",
    "opened",
    "click",
    "bounce",
    "blocked",
    "spam",
    "invalid",
    "deferred",
    "soft_bounce",
    "hard_bounce",
  ]),
  email: z.string().email(),
  id: z.number(),
  date: z.string(),
  ts: z.number(),
  "message-id": z.string(),
  ts_event: z.number(),
  subject: z.string().optional(),
  tag: z.string().optional(),
  sending_ip: z.string().optional(),
  ts_click: z.number().optional(),
  ts_opens: z.number().optional(),
  link: z.string().optional(),
  reason: z.string().optional(),
  error: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") || "resend";

    if (provider === "resend") {
      return handleResendWebhook(body);
    } else if (provider === "brevo") {
      return handleBrevoWebhook(body);
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported provider" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Error processing email webhook:", error);
    return NextResponse.json(
      { success: false, error: "Invalid webhook payload" },
      { status: 400 }
    );
  }
}

async function handleResendWebhook(body: any) {
  const parsed = ResendWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid Resend webhook payload" },
      { status: 400 }
    );
  }

  const { type, data } = parsed.data;
  const emailId = data.email_id;

  try {
    switch (type) {
      case "email.sent":
        await trackDeliveryStatus(emailId, EmailDeliveryStatus.SENT, {
          provider: "resend",
          sentAt: data.created_at,
        });
        break;

      case "email.delivered":
        await trackDeliveryStatus(emailId, EmailDeliveryStatus.DELIVERED, {
          provider: "resend",
          deliveredAt: data.created_at,
        });
        break;

      case "email.opened":
        await trackEmailOpen(emailId, {
          provider: "resend",
          openedAt: data.created_at,
        });
        break;

      case "email.clicked":
        await trackEmailClick(emailId, "", {
          provider: "resend",
          clickedAt: data.created_at,
        });
        break;

      case "email.bounced":
        await trackEmailBounce(emailId, "hard", "Bounced", {
          provider: "resend",
          bouncedAt: data.created_at,
        });
        break;

      case "email.complained":
        await trackDeliveryStatus(emailId, EmailDeliveryStatus.SPAM_REPORTED, {
          provider: "resend",
          complainedAt: data.created_at,
        });
        break;

      default:
        console.log(`Unhandled Resend webhook type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error processing Resend webhook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function handleBrevoWebhook(body: any) {
  const parsed = BrevoWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid Brevo webhook payload" },
      { status: 400 }
    );
  }

  const {
    event,
    email,
    id,
    date,
    "message-id": messageId,
    link,
    reason,
  } = parsed.data;
  const emailId = messageId || `brevo-${id}`;

  try {
    switch (event) {
      case "delivered":
        await trackDeliveryStatus(emailId, EmailDeliveryStatus.DELIVERED, {
          provider: "brevo",
          deliveredAt: date,
        });
        break;

      case "opened":
        await trackEmailOpen(emailId, {
          provider: "brevo",
          openedAt: date,
        });
        break;

      case "click":
        await trackEmailClick(emailId, link || "", {
          provider: "brevo",
          clickedAt: date,
        });
        break;

      case "bounce":
      case "hard_bounce":
        await trackEmailBounce(emailId, "hard", reason || "Hard bounce", {
          provider: "brevo",
          bouncedAt: date,
        });
        break;

      case "soft_bounce":
        await trackEmailBounce(emailId, "soft", reason || "Soft bounce", {
          provider: "brevo",
          bouncedAt: date,
        });
        break;

      case "spam":
        await trackDeliveryStatus(emailId, EmailDeliveryStatus.SPAM_REPORTED, {
          provider: "brevo",
          spamReportedAt: date,
        });
        break;

      case "blocked":
        await trackDeliveryStatus(emailId, EmailDeliveryStatus.FAILED, {
          provider: "brevo",
          blockedAt: date,
          reason: reason || "Blocked",
        });
        break;

      default:
        console.log(`Unhandled Brevo webhook event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error processing Brevo webhook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
