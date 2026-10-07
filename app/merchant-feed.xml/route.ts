import { NextResponse } from "next/server";

import { getStorefrontCatalog } from "@/lib/products/storefront-catalog";
import { buildMerchantFeed } from "@/lib/seo/merchant-feed";
import { getShippingSettings } from "@/lib/utils/store-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [products, settings] = await Promise.all([
      getStorefrontCatalog(),
      getShippingSettings(),
    ]);
    return new NextResponse(buildMerchantFeed(products, settings), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Merchant catalog unavailable", error);
    return NextResponse.json(
      { error: "Catalog temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
