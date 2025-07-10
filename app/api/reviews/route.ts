import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  withErrorHandling,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  handleZodError,
} from "@/lib/api-error";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// Schema for validating review submission
const reviewSchema = z.object({
  orderItemId: z.string(),
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100),
  content: z.string().min(10).max(1000),
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return unauthorized("You must be logged in to submit a review");
  }

  // Parse and validate request body
  const body = await req.json();
  try {
    const validatedData = reviewSchema.parse(body);

    // Check if the order item belongs to the user and is in "delivered" status
    const orderItem = await db.orderItem.findUnique({
      where: {
        id: validatedData.orderItemId,
      },
      include: {
        order: true,
      },
    });

    if (!orderItem) {
      return notFound("The specified order item does not exist");
    }

    // Verify that the order belongs to the user
    if (orderItem.order.userId !== session.user.id) {
      return forbidden("You can only review items from your own orders");
    }

    // Verify that the order is delivered
    if (orderItem.order.status !== "DELIVERED") {
      return forbidden("You can only review items from delivered orders");
    }

    // Check if the user has already reviewed this order item
    const existingReview = await db.review.findFirst({
      where: {
        userId: session.user.id,
        orderItemId: validatedData.orderItemId,
      },
    });

    if (existingReview) {
      return conflict("You have already reviewed this item");
    }

    // Create the review
    const review = await db.review.create({
      data: {
        userId: session.user.id,
        productId: validatedData.productId,
        orderItemId: validatedData.orderItemId,
        rating: validatedData.rating,
        title: validatedData.title,
        content: validatedData.content,
      },
    });

    logger.info("Created review", {
      reviewId: review.id,
      productId: review.productId,
    });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    throw error; // Let the withErrorHandling wrapper catch this
  }
});

export const GET = withErrorHandling(async (req: NextRequest) => {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return notFound("Product ID is required");
  }

  const reviews = await db.review.findMany({
    where: {
      productId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Format the reviews for the frontend
  const formattedReviews = reviews.map(review => ({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: review.user.name || "Anonymous",
    rating: review.rating,
    title: review.title,
    content: review.content,
    date: review.createdAt.toISOString(),
    verified: true, // Since we verify that the user purchased the item
  }));

  logger.info("Fetched product reviews", {
    productId,
    count: reviews.length,
  });

  return NextResponse.json(formattedReviews, {
    headers: {
      // 🚀 PERFORMANCE: Add caching headers for reviews
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
});
