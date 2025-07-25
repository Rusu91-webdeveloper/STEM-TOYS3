import { NextResponse } from "next/server";
import { z } from "zod";

import { emailTemplates } from "@/lib/resend";

// Schema for email request validation
const orderConfirmationSchema = z.object({
  type: z.literal("orderConfirmation"),
  data: z.object({
    to: z.string().email(),
    order: z.object({
      id: z.string(),
      items: z.array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          price: z.number(),
        })
      ),
      total: z.number(),
      shippingCost: z.number(),
      tax: z.number(),
      taxRatePercentage: z.string().optional(),
      isFreeShippingActive: z.boolean().optional(),
      freeShippingThreshold: z.number().optional(),
    }),
  }),
});

const orderShippedSchema = z.object({
  type: z.literal("orderShipped"),
  data: z.object({
    to: z.string().email(),
    order: z.object({
      id: z.string(),
    }),
    trackingInfo: z.object({
      carrier: z.string(),
      trackingNumber: z.string(),
      trackingUrl: z.string().url(),
    }),
  }),
});

const passwordResetSchema = z.object({
  type: z.literal("passwordReset"),
  data: z.object({
    to: z.string().email(),
    resetLink: z.string().url(),
  }),
});

// Union of all email types
const emailRequestSchema = z.discriminatedUnion("type", [
  orderConfirmationSchema,
  orderShippedSchema,
  passwordResetSchema,
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const result = emailRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { type, data } = result.data;

    // Send the appropriate email based on the type
    switch (type) {
      case "orderConfirmation":
        await emailTemplates.orderConfirmation(data);
        break;
      case "orderShipped":
        await emailTemplates.orderShipped(data);
        break;
      case "passwordReset":
        await emailTemplates.passwordReset(data);
        break;
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
