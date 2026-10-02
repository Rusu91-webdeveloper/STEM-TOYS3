import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { SESSION_CART_STORAGE, getCartId } from "@/lib/cart-storage";
import {
  loadAuthoritativePhysicalLines,
  type ShippingQuoteLineInput,
} from "@/lib/checkout/shipping-quote-lines";
import {
  analyzeSupplierCartComposition,
  calculateMixedSupplierShippingSurcharge,
} from "@/lib/checkout/supplier-cart-rules";
import {
  buildShippingMethodId,
  DEFAULT_COURIERS,
} from "@/lib/shipping/couriers";
import {
  calculateShippingQuote,
  resolveShippingService,
} from "@/lib/shipping/shipping-pricing";
import { getShippingSettings } from "@/lib/utils/store-settings";

const quoteRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        isBook: z.boolean().optional(),
      })
    )
    .max(100),
});

async function readRequestedLines(
  request: NextRequest
): Promise<
  | { ok: true; items: ShippingQuoteLineInput[] }
  | { ok: false; response: NextResponse }
> {
  if (request.method === "GET") {
    const cartId = await getCartId(request);
    const cart = SESSION_CART_STORAGE.get(cartId) ?? [];
    return {
      ok: true,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        isBook: item.isBook,
      })),
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid shipping quote payload" },
        { status: 400 }
      ),
    };
  }

  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid shipping quote items" },
        { status: 400 }
      ),
    };
  }

  return { ok: true, items: parsed.data.items };
}

async function handleShippingQuote(request: NextRequest) {
  try {
    const requested = await readRequestedLines(request);
    if (!requested.ok) return requested.response;

    // Client lines are re-priced here. A size-truncated guest cookie must not
    // turn a full basket into an empty quote.
    const authoritative = await loadAuthoritativePhysicalLines(requested.items);
    const physicalItems = authoritative.lines;
    const products = authoritative.products;
    if (physicalItems.length === 0) {
      return NextResponse.json({
        isDigitalOnly: true,
        methods: [],
      });
    }

    const productMap = new Map(products.map(product => [product.id, product]));
    const supplierCartRules = analyzeSupplierCartComposition(
      physicalItems,
      products
    );

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
      .filter(
        (
          item
        ): item is {
          quantity: number;
          weightKg: number | null;
          dimensions: Record<string, unknown>;
        } => item !== null
      );

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
    const legacyDeliveryPrice =
      (settings as any)?.deliveryPrice?.active === true
        ? Number((settings as any)?.deliveryPrice?.price)
        : null;
    const normalizedLegacyDeliveryPrice =
      legacyDeliveryPrice !== null && Number.isFinite(legacyDeliveryPrice)
        ? legacyDeliveryPrice
        : null;

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
            const singleShipmentPrice =
              Number.isFinite(priceOverride) && priceOverride !== null
                ? priceOverride
                : normalizedLegacyDeliveryPrice !== null
                  ? normalizedLegacyDeliveryPrice
                : (quote?.totalPrice ?? 0);
            
            const codGuaranteeHoldPrice =
              Number.isFinite(priceOverride) && priceOverride !== null && priceOverride > 0
                ? priceOverride
                : normalizedLegacyDeliveryPrice !== null && normalizedLegacyDeliveryPrice > 0
                  ? normalizedLegacyDeliveryPrice
                  : null;
            
            const mixedSupplierSurcharge =
              calculateMixedSupplierShippingSurcharge(
                singleShipmentPrice,
                supplierCartRules
              );

            return {
              id: methodId,
              name: service.name,
              description: service.description,
              estimatedDelivery: service.estimatedDelivery,
              serviceId: service.id,
              price: singleShipmentPrice + mixedSupplierSurcharge,
              pricingVersion: quote?.pricingVersion ?? null,
              basePrice: quote?.basePrice ?? null,
              singleShipmentPrice,
              codGuaranteeHoldPrice,
              mixedSupplierSurcharge,
              isMixedSupplierCart: supplierCartRules.isMixedSupplierCart,
              requiresPrepaid: supplierCartRules.requiresPrepaid,
              supplierCount: supplierCartRules.supplierCount,
              supplierNames: supplierCartRules.supplierNames,
              shippingPolicyMessage: supplierCartRules.isMixedSupplierCart
                ? "Comanda se livrează în mai multe colete. Pentru expedierea separată de la furnizori diferiți se aplică o taxă suplimentară de livrare."
                : null,
              weights: quote?.weights ?? null,
              courierId: courier.id,
              methodType: service.methodType,
              requiresLocker:
                courier.id === "fancourier" && service.methodType === "easybox",
            };
          })
      );

    return NextResponse.json({
      isDigitalOnly: false,
      cartRules: {
        ...supplierCartRules,
        shippingPolicyMessage: supplierCartRules.isMixedSupplierCart
          ? "Comenzile cu furnizori multipli se livrează în mai multe colete și necesită plată online."
          : null,
      },
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

export function GET(request: NextRequest) {
  return handleShippingQuote(request);
}

export function POST(request: NextRequest) {
  return handleShippingQuote(request);
}
