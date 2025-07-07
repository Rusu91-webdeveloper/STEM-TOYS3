import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { emailTemplates } from "@/lib/brevoTemplates";
import { prisma } from "@/lib/prisma";

// Schema for newsletter subscription validation
const subscribeSchema = z.object({
  email: z.string().email("Adresa de email nu este validă"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

/**
 * Handle newsletter subscription requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Date invalide",
          errors: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, categories } = result.data;

    // Check if the email already exists
    const existingSubscriber = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      // If the subscriber exists but is inactive, reactivate them
      if (!existingSubscriber.isActive) {
        await prisma.newsletter.update({
          where: { email },
          data: {
            isActive: true,
            firstName: firstName || existingSubscriber.firstName,
            lastName: lastName || existingSubscriber.lastName,
            categories: categories || existingSubscriber.categories,
            updatedAt: new Date(),
          },
        });

        // Send welcome back email
        await emailTemplates.newsletterResubscribe({
          to: email,
          name:
            firstName || existingSubscriber.firstName || email.split("@")[0],
        });

        return NextResponse.json({
          success: true,
          message: "Te-ai abonat din nou cu succes la newsletter-ul nostru!",
        });
      }

      // If already active, just return success
      return NextResponse.json({
        success: true,
        message: "Ești deja abonat la newsletter-ul nostru!",
      });
    }

    // Create a new subscriber
    await prisma.newsletter.create({
      data: {
        email,
        firstName,
        lastName,
        categories: categories || [],
        isActive: true,
      },
    });

    // Send welcome email
    await emailTemplates.newsletterWelcome({
      to: email,
      name: firstName || email.split("@")[0],
    });

    return NextResponse.json({
      success: true,
      message: "Te-ai abonat cu succes la newsletter-ul nostru!",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "A apărut o eroare la procesarea abonării. Te rugăm să încerci din nou.",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle newsletter unsubscribe requests
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email-ul este necesar" },
        { status: 400 }
      );
    }

    // Find the subscriber
    const subscriber = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return NextResponse.json(
        { success: false, message: "Abonatul nu a fost găsit" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.newsletter.update({
      where: { email },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Te-ai dezabonat cu succes de la newsletter-ul nostru.",
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "A apărut o eroare la procesarea dezabonării. Te rugăm să încerci din nou.",
      },
      { status: 500 }
    );
  }
}
