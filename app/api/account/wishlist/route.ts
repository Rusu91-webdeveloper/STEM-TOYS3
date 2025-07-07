import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/account/wishlist - Get wishlist for authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if the db has a wishlist model
    try {
      // @ts-ignore - Ignore TypeScript errors for dynamic schema access
      const wishlistExists = (await db.wishlist) !== undefined;

      if (!wishlistExists) {
        // Wishlist model not found in database schema
        return NextResponse.json([]);
      }

      // Fetch user's wishlist items
      // @ts-ignore - Ignore TypeScript errors for dynamic schema access
      const wishlistItems = await db.wishlist.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              slug: true,
              images: true,
              stockQuantity: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Format data for frontend consumption
      const formattedItems = wishlistItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        image: item.product.images?.[0] || "/images/product-placeholder.jpg",
        slug: item.product.slug,
        inStock: item.product.stockQuantity > 0,
        dateAdded: item.createdAt.toISOString(),
      }));

      return NextResponse.json(formattedItems);
    } catch (dbError) {
      console.error("Database schema error:", dbError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

// POST /api/account/wishlist - Add item to wishlist
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    try {
      // Check if item already exists in wishlist
      // @ts-ignore - Ignore TypeScript errors for dynamic schema access
      const existingItem = await db.wishlist.findFirst({
        where: {
          userId: session.user.id,
          productId,
        },
      });

      if (existingItem) {
        return NextResponse.json(
          { message: "Product already in wishlist" },
          { status: 200 }
        );
      }

      // Add to wishlist
      // @ts-ignore - Ignore TypeScript errors for dynamic schema access
      await db.wishlist.create({
        data: {
          userId: session.user.id,
          productId,
        },
      });

      return NextResponse.json(
        { message: "Product added to wishlist" },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to add item to wishlist" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Failed to add item to wishlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/account/wishlist - Remove item from wishlist
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get ID from URL params
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Wishlist item ID is required" },
        { status: 400 }
      );
    }

    try {
      // Delete the wishlist item
      // @ts-ignore - Ignore TypeScript errors for dynamic schema access
      await db.wishlist.delete({
        where: {
          id,
          userId: session.user.id, // Ensure only the owner can delete
        },
      });

      return NextResponse.json(
        { message: "Item removed from wishlist" },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to remove item from wishlist" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to remove item from wishlist" },
      { status: 500 }
    );
  }
}
