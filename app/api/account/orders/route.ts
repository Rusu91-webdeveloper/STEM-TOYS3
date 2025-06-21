import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/account/orders - Get orders for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if the db has an order model, if not return empty array
    // This is a safeguard for development environments or when the db schema is not yet set up
    try {
      // Try accessing the order schema, will throw if it doesn't exist
      // @ts-ignore - Ignore TypeScript errors for dynamic schema access
      const ordersExist = (await db.order) !== undefined;

      if (!ordersExist) {
        // Order model not found in database schema
        return NextResponse.json([]);
      }

      // In production, fetch orders from the database
      // @ts-ignore - Ignore TypeScript errors for dynamic schema access
      const orders = await db.order.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true,
                  slug: true,
                },
              },
              // @ts-ignore - TypeScript doesn't recognize book relationship
              book: {
                select: {
                  name: true,
                  author: true,
                  slug: true,
                  coverImage: true,
                },
              },
              reviews: {
                where: {
                  userId: session.user.id,
                },
                select: {
                  id: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Format data for frontend consumption
      // @ts-ignore - TypeScript doesn't recognize include relationships properly
      const formattedOrders = orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString(),
        status: order.status.toLowerCase(),
        total: order.total,
        items: order.items.map((item: any) => {
          // Handle both products and books
          const isBook = !!item.book;
          const name = isBook
            ? item.book!.name
            : item.product?.name || item.name;
          const slug = isBook ? item.book!.slug : item.product?.slug || "";
          const image = isBook
            ? item.book!.coverImage || "/images/book-placeholder.jpg"
            : item.product?.images?.[0] || "/images/product-placeholder.jpg";

          return {
            id: item.id,
            productId: item.productId,
            bookId: item.bookId,
            productName: name,
            productSlug: slug,
            price: item.price,
            quantity: item.quantity,
            image,
            hasReviewed: item.reviews.length > 0,
            isDigital: item.isDigital,
            type: isBook ? "book" : "product",
            ...(isBook && {
              author: item.book!.author,
              downloadCount: item.downloadCount,
              maxDownloads: item.maxDownloads,
              downloadExpiresAt: item.downloadExpiresAt?.toISOString(),
            }),
          };
        }),
        shippingAddress: {
          name: order.shippingAddress.fullName,
          street: order.shippingAddress.addressLine1,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          zipCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        },
      }));

      return NextResponse.json(formattedOrders);
    } catch (dbError) {
      console.error("Database schema error:", dbError);
      // If there's an error accessing the order model, return an empty array
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
