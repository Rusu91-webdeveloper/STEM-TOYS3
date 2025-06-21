import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { emailTemplates } from "@/lib/brevoTemplates";
import { auth } from "@/lib/auth";

// Schema for blog notification validation
const notifySchema = z.object({
  blogId: z.string(),
  categories: z.array(z.string()).optional(),
});

/**
 * Send blog notification to subscribers
 * This is a protected route that only admins can access
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Acces neautorizat" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const result = notifySchema.safeParse(body);

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

    const { blogId, categories } = result.data;

    // Get the blog post
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, message: "Articolul nu a fost găsit" },
        { status: 404 }
      );
    }

    // Get active subscribers
    // If categories are specified, filter by those categories
    const subscribers = await prisma.newsletter.findMany({
      where: {
        isActive: true,
        ...(categories && categories.length > 0
          ? {
              categories: {
                hasSome: categories,
              },
            }
          : {}),
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nu există abonați activi pentru a trimite notificarea.",
      });
    }

    // Send notification to each subscriber
    const emailPromises = subscribers.map((subscriber) =>
      emailTemplates.blogNotification({
        to: subscriber.email,
        name: subscriber.firstName || subscriber.email.split("@")[0],
        blog,
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Notificare trimisă cu succes la ${subscribers.length} abonați.`,
    });
  } catch (error) {
    console.error("Blog notification error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "A apărut o eroare la trimiterea notificării. Te rugăm să încerci din nou.",
      },
      { status: 500 }
    );
  }
}
