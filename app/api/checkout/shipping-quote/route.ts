import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { SESSION_CART_STORAGE, getCartId } from "@/lib/cart-storage";
import { db } from "@/lib/db";
import {
  calculateShippingQuote,
  resolveShippingService,
} from "@/lib/shipping/shipping-pricing";

const SHIPPING_METHODS = [
  {
    id: "easybox",
    name: "Livrare Easy Box",
    description: "Livrare la Easy Box",
    estimatedDelivery: "24-48h",
  },
  {
    id: "home",
    name: "Livrare domiciliu",
    description: "Livrare la adresa ta",
    estimatedDelivery: "24h",
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cartId = await getCartId(request);
    const cart = SESSION_CART_STORAGE.get(cartId) || [];

    const physicalItems = cart.filter(item => item.isBook !== true);
    if (physicalItems.length === 0) {
      return NextResponse.json({
        isDigitalOnly: true,
        methods: [],
      });
    }

    const productIds = physicalItems.map(item => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, weight: true, dimensions: true },
    });
    const productMap = new Map(products.map(product => [product.id, product]));

    const shippingItems = physicalItems
      .map(item => {
        const product = productMap.get(item.productId);
        if (!product) {
          return null;
        }
        return {
          quantity: item.quantity,
          weightKg: product.weight,
          dimensions: product.dimensions as Record<string, unknown>,
        };
      })
      .filter(Boolean);

    if (shippingItems.length === 0) {
      return NextResponse.json({
        isDigitalOnly: true,
        methods: [],
      });
    }

    const methods = SHIPPING_METHODS.map(method => {
      const service = resolveShippingService(method.id);
      const quote = service
        ? calculateShippingQuote(service, shippingItems)
        : null;
      return {
        ...method,
        price: quote?.totalPrice ?? 0,
        pricingVersion: quote?.pricingVersion ?? null,
        basePrice: quote?.basePrice ?? null,
        weights: quote?.weights ?? null,
      };
    });

    return NextResponse.json({
      isDigitalOnly: false,
      methods,
    });
  } catch (error) {
    console.error("Error generating shipping quote:", error);
    return NextResponse.json(
      { error: "Failed to generate shipping quote" },
      { status: 500 }
    );
  }
}
