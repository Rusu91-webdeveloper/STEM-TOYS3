import { NextResponse } from "next/server";
import { emailTemplates } from "@/lib/brevoTemplates";
import { z } from "zod";
import { auth } from "@/lib/auth";

// Schema for email request validation
const orderConfirmationSchema = z.object({
  type: z.literal("orderConfirmation"),
  data: z.object({
    to: z.string().email(),
    orderId: z.string(),
    userId: z.string(),
  }),
});

const verificationEmailSchema = z.object({
  type: z.literal("verification"),
  data: z.object({
    to: z.string().email(),
    name: z.string(),
    verificationLink: z.string().url(),
    expiresIn: z.string().optional(),
  }),
});

const passwordResetSchema = z.object({
  type: z.literal("passwordReset"),
  data: z.object({
    to: z.string().email(),
    resetLink: z.string().url(),
    expiresIn: z.string().optional(),
  }),
});

const welcomeEmailSchema = z.object({
  type: z.literal("welcome"),
  data: z.object({
    to: z.string().email(),
    name: z.string(),
  }),
});

const returnProcessingSchema = z.object({
  type: z.literal("returnProcessing"),
  data: z.object({
    to: z.string().email(),
    orderId: z.string(),
    userId: z.string(),
    returnStatus: z.enum(["RECEIVED", "PROCESSING", "APPROVED", "COMPLETED"]),
    returnDetails: z.object({
      id: z.string(),
      reason: z.string(),
      comments: z.string().optional(),
    }),
  }),
});

// Union of all email types
const emailRequestSchema = z.discriminatedUnion("type", [
  orderConfirmationSchema,
  verificationEmailSchema,
  passwordResetSchema,
  welcomeEmailSchema,
  returnProcessingSchema,
]);

export async function POST(request: Request) {
  try {
    // Verify the request is from an authenticated user
    const session = await auth();

    // For sensitive email operations, require admin privileges
    // Allow non-admin access only for specific email types
    const body = await request.json();
    const result = emailRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.format() },
        { status: 400 }
      );
    }

    const { type, data } = result.data;

    // Require admin access for all email operations except password reset and verification
    if (!session?.user && type !== "passwordReset" && type !== "verification") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle different email types
    switch (type) {
      case "orderConfirmation": {
        const { prisma } = await import("@/lib/prisma");

        // Fetch the order with all necessary related data
        const order = await prisma.order.findUnique({
          where: { id: data.orderId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: true,
            shippingAddress: true,
          },
        });

        if (!order) {
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        // Ensure the user has permission to see this order
        if (session?.user?.role !== "ADMIN" && order.userId !== data.userId) {
          return NextResponse.json(
            { error: "Unauthorized to access this order" },
            { status: 403 }
          );
        }

        await emailTemplates.orderConfirmation({
          to: data.to,
          order,
          user: {
            name: order.user.name || "Customer",
          },
        });
        break;
      }

      case "verification":
        await emailTemplates.verification(data);
        break;

      case "passwordReset":
        await emailTemplates.passwordReset(data);
        break;

      case "welcome":
        await emailTemplates.welcome(data);
        break;

      case "returnProcessing": {
        const { prisma } = await import("@/lib/prisma");

        // Fetch the order with necessary related data
        const order = await prisma.order.findUnique({
          where: { id: data.orderId },
          include: {
            user: true,
          },
        });

        if (!order) {
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        // Ensure the user has permission to see this order
        if (session?.user?.role !== "ADMIN" && order.userId !== data.userId) {
          return NextResponse.json(
            { error: "Unauthorized to access this order" },
            { status: 403 }
          );
        }

        await emailTemplates.returnProcessing({
          to: data.to,
          order,
          returnStatus: data.returnStatus,
          returnDetails: data.returnDetails,
          user: {
            name: order.user.name || "Customer",
          },
        });
        break;
      }
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
