import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { SESSION_CART_STORAGE, getCartId } from "@/lib/cart-storage";
import { db } from "@/lib/db";
import {
  calculateShippingQuote,
  resolveShippingService,
} from "@/lib/shipping/shipping-pricing";
import {
  buildShippingMethodId,
  DEFAULT_COURIERS,
} from "@/lib/shipping/couriers";
import { getShippingSettings } from "@/lib/utils/store-settings";

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

    const settings = await getShippingSettings();
    const configuredCouriers =
      (settings as any)?.couriers && Array.isArray((settings as any).couriers)
        ? (settings as any).couriers
        : DEFAULT_COURIERS;

    const methods = configuredCouriers
      .filter((courier: any) => courier.enabled !== false)
      .flatMap((courier: any) =>
        (courier.services || [])
          .filter((service: any) => service.enabled !== false)
          .map((service: any) => {
            const methodId = buildShippingMethodId(courier.id, service.id);
            const pricingKey =
              service.methodType === "easybox" ? "easybox" : "home";
            const resolvedService = resolveShippingService(pricingKey);
            const quote = resolvedService
              ? calculateShippingQuote(resolvedService, shippingItems)
              : null;

            const priceOverride = service.priceOverride
              ? Number(service.priceOverride)
              : null;

            return {
              id: methodId,
              name: service.name,
              description: service.description,
              estimatedDelivery: service.estimatedDelivery,
              price:
                Number.isFinite(priceOverride) && priceOverride !== null
                  ? priceOverride
                  : quote?.totalPrice ?? 0,
              pricingVersion: quote?.pricingVersion ?? null,
              basePrice: quote?.basePrice ?? null,
              weights: quote?.weights ?? null,
              courierId: courier.id,
            };
          })
      );

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
