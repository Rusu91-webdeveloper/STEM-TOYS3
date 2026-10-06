import { NextRequest, NextResponse } from "next/server";

import { getCombinedProduct } from "@/lib/products/product-read";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const product = await getCombinedProduct(slug);
    if (!product)
      return NextResponse.json(
        { error: `No product or book found with slug: ${slug}` },
        { status: 404 }
      );
    return NextResponse.json(product, {
      headers: {
        "Cache-Control": product.id.startsWith("fallback-")
          ? "public, s-maxage=120, stale-while-revalidate=300"
          : "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching combined product/book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
