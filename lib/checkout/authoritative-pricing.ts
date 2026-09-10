import { CURATED_SUPPLIER_IDS, curatedStockIsFresh, isCuratedSupplier } from "@/lib/suppliers/curated-stock";
import { db } from "@/lib/db";
import {
  analyzeSupplierCartComposition,
  applyMixedSupplierShippingRules,
  type SupplierCartAnalysis,
} from "@/lib/checkout/supplier-cart-rules";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";
import {
  DEFAULT_COURIERS,
  parseShippingMethodId,
} from "@/lib/shipping/couriers";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";
import {
  calculateShippingQuote,
  resolveShippingService,
} from "@/lib/shipping/shipping-pricing";
import { productStoredWeightToKg } from "@/lib/shipping/store-weight-to-kg";
import {
  getCODSettings,
  getShippingSettings,
  getStoreSettings,
  getTaxSettings,
} from "@/lib/utils/store-settings";

export type CheckoutPricingItemInput = {
  productId: string;
  quantity: number;
  isBook?: boolean;
  selectedLanguage?: string;
  variantId?: string;
  image?: string;
  slug?: string;
  name?: string;
  price?: number;
};

export type AuthoritativeCheckoutItem = CheckoutPricingItemInput & {
  name: string;
  price: number;
  isBook: boolean;
};

export class CheckoutPricingError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "CheckoutPricingError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function deriveInitialPaymentStatus(input: {
  isCODPayment: boolean;
  isNetopiaPayment: boolean;
  requiresOnlineAuthorization: boolean;
}) {
  return input.isCODPayment ||
    input.isNetopiaPayment ||
    input.requiresOnlineAuthorization
    ? "PENDING"
    : "PAID";
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

function isCODPaymentMethod(value: string | null | undefined) {
  return value === "cash_on_delivery" || value === "cod";
}

export async function resolveCheckoutPricing(input: {
  userId: string;
  items: CheckoutPricingItemInput[];
  shippingMethodId?: string | null;
  couponCode?: string | null;
  paymentMethod?: string | null;
}) {
  if (!input.items.length) {
    throw new CheckoutPricingError(
      "EMPTY_CART",
      "Your cart is empty. Refresh checkout and try again."
    );
  }

  const uniqueIds = Array.from(
    new Set(input.items.map(item => item.productId))
  );

  const [books, products] = await Promise.all([
    db.book.findMany({
      where: {
        id: { in: uniqueIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    }),
    db.product.findMany({
      where: {
        id: { in: uniqueIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        weight: true,
        dimensions: true,
        supplierId: true,
        metadata: true,
        stockQuantity: true,
        supplierProducts: { where: { supplierId: { in: CURATED_SUPPLIER_IDS } }, select: { lastSyncAt: true, status: true } },
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
    }),
  ]);

  for (const product of products) {
    if (
      isCuratedSupplier(product.supplierId, product.metadata) &&
      !product.supplierProducts.some(p => p.status === "MAPPED" && curatedStockIsFresh(p.lastSyncAt))
    ) {
      throw new CheckoutPricingError(
        "SUPPLIER_STOCK_UNAVAILABLE",
        "Stocul furnizorului se actualizează. Te rugăm să încerci din nou în câteva minute.",
        503
      );
    }
  }

  const bookMap = new Map(books.map(book => [book.id, book]));
  const productMap = new Map(products.map(product => [product.id, product]));

  const authoritativeItems: AuthoritativeCheckoutItem[] = input.items.map(
    item => {
      const product = productMap.get(item.productId);
      const book = bookMap.get(item.productId);
      const resolvedAsBook =
        item.isBook === true || (!product && Boolean(book));

      if (resolvedAsBook) {
        if (!book) {
          throw new CheckoutPricingError(
            "INVALID_CART_ITEM",
            "One or more books are no longer available. Refresh your cart and try again.",
            400,
            { productId: item.productId, itemType: "book" }
          );
        }

        return {
          ...item,
          name: book.name,
          price: book.price,
          isBook: true,
        };
      }

      if (!product) {
        throw new CheckoutPricingError(
          "INVALID_CART_ITEM",
          "One or more products are no longer available. Refresh your cart and try again.",
          400,
          { productId: item.productId, itemType: "product" }
        );
      }

      return {
        ...item,
        name: product.name,
        price: product.price,
        isBook: false,
      };
    }
  );

  const subtotal = roundMoney(
    authoritativeItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
  );

  const isDigitalOnlyOrder =
    authoritativeItems.length > 0 &&
    authoritativeItems.every(item => item.isBook === true);

  const supplierCartAnalysis: SupplierCartAnalysis = isDigitalOnlyOrder
    ? {
        isMixedSupplierCart: false,
        supplierCount: 0,
        supplierNames: [],
        fulfillmentSourceIds: [],
        requiresPrepaid: false,
        mixedSupplierExtraShipments: 0,
      }
    : analyzeSupplierCartComposition(authoritativeItems, products);

  let finalShippingCost = 0;
  let shippingBasePrice = 0;
  let shippingTotalEstimate = 0;
  let pricingVersion: string | null = null;

  if (!isDigitalOnlyOrder) {
    const shippingMethodId = input.shippingMethodId || "";
    if (!shippingMethodId) {
      throw new CheckoutPricingError(
        "SHIPPING_METHOD_REQUIRED",
        "A valid shipping method is required for physical products."
      );
    }

    const shippingSettings = await getShippingSettings();
    const configuredCouriers =
      shippingSettings?.couriers && Array.isArray(shippingSettings.couriers)
        ? shippingSettings.couriers
        : DEFAULT_COURIERS;

    const { courierId, serviceId } = parseShippingMethodId(shippingMethodId);
    const selectedCourier = configuredCouriers.find(
      (courier: any) => courier.id === courierId && courier.enabled !== false
    );
    const selectedService = selectedCourier?.services?.find(
      (service: any) => service.id === serviceId && service.enabled !== false
    );

    let selectedAdminShippingPrice: number | null = null;
    const overrideRaw = selectedService?.priceOverride;
    if (
      overrideRaw !== undefined &&
      overrideRaw !== null &&
      overrideRaw !== ""
    ) {
      const parsedOverride = Number(overrideRaw);
      if (Number.isFinite(parsedOverride)) {
        selectedAdminShippingPrice = parsedOverride;
      }
    }

    if (
      selectedAdminShippingPrice === null &&
      shippingSettings?.deliveryPrice?.active === true
    ) {
      const legacyDeliveryPrice = Number(shippingSettings.deliveryPrice.price);
      if (Number.isFinite(legacyDeliveryPrice)) {
        selectedAdminShippingPrice = legacyDeliveryPrice;
      }
    }

    const service = resolveShippingService(shippingMethodId);
    if (!service) {
      throw new CheckoutPricingError(
        "INVALID_SHIPPING_METHOD",
        "Selected shipping method is invalid. Refresh checkout and choose a delivery option again."
      );
    }

    const storeSettings = await getStoreSettings();
    const weightUnit =
      (storeSettings as { weightUnit?: string | null }).weightUnit ?? "kg";

    const shippingItems = authoritativeItems
      .filter(item => item.isBook !== true)
      .map(item => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new CheckoutPricingError(
            "INVALID_CART_ITEM",
            "One or more products are no longer available. Refresh your cart and try again.",
            400,
            { productId: item.productId, itemType: "product" }
          );
        }

        return {
          quantity: item.quantity,
          weightKg: productStoredWeightToKg(product.weight, weightUnit),
          dimensions: product.dimensions as Record<string, unknown>,
        };
      });

    const quote = calculateShippingQuote(service, shippingItems);
    shippingBasePrice = quote.basePrice;
    shippingTotalEstimate = quote.totalPrice;
    pricingVersion = quote.pricingVersion;

    const freeShippingEligible = checkFreeShipping(subtotal, shippingSettings);
    const shippingRuleResult = applyMixedSupplierShippingRules({
      singleShipmentPrice:
        selectedAdminShippingPrice !== null
          ? selectedAdminShippingPrice
          : quote.totalPrice,
      freeShippingEligible,
      analysis: supplierCartAnalysis,
    });

    finalShippingCost = shippingRuleResult.finalShippingCost;
    shippingTotalEstimate = shippingRuleResult.finalShippingCost;
  }

  let tax = 0;
  let taxRatePercentage = "0";
  let includeInPrice = true;

  const taxSettings = (await getTaxSettings()) as any;
  const isTaxEnabled = taxSettings?.active === true;
  if (isTaxEnabled && taxSettings?.rate) {
    taxRatePercentage = taxSettings.rate;
    const taxRate = parseFloat(taxSettings.rate) / 100;
    includeInPrice = taxSettings.includeInPrice !== false;

    if (taxRate > 0) {
      if (includeInPrice) {
        const subtotalExcludingVAT = subtotal / (1 + taxRate);
        tax = subtotal - subtotalExcludingVAT;
      } else {
        tax = subtotal * taxRate;
      }
    }
  }
  tax = roundMoney(tax);

  let appliedCoupon = null;
  let discountAmount = 0;

  try {
    const { AutoDiscountService } = await import(
      "@/lib/services/discount-service"
    );

    const welcome = await AutoDiscountService.getNewUserDiscount(
      input.userId,
      subtotal
    );

    let manualCoupon: any = null;
    if (input.couponCode) {
      const candidate = await db.coupon.findUnique({
        where: { code: input.couponCode.toUpperCase() },
        include: {
          _count: {
            select: {
              usages: {
                where: { userId: input.userId },
              },
            },
          },
        },
      });

      if (candidate && candidate.isActive) {
        const now = new Date();
        const isValidTime =
          (!candidate.startsAt || now >= candidate.startsAt) &&
          (!candidate.expiresAt || now <= candidate.expiresAt);
        const hasUsesLeft =
          !candidate.maxUses || candidate.currentUses < candidate.maxUses;
        const userCanUse =
          !candidate.maxUsesPerUser ||
          (candidate._count?.usages || 0) < candidate.maxUsesPerUser;
        const meetsMinimum =
          !candidate.minimumOrderValue ||
          subtotal >= candidate.minimumOrderValue;

        if (isValidTime && hasUsesLeft && userCanUse && meetsMinimum) {
          manualCoupon = candidate;
        }
      }
    }

    const selected = AutoDiscountService.compareDiscounts(
      welcome,
      manualCoupon,
      subtotal
    );
    if (selected) {
      appliedCoupon = selected.selectedCoupon;
      discountAmount = roundMoney(selected.discountAmount);
    }
  } catch (error) {
    console.error("Error selecting discounts:", error);
  }

  let codFee = 0;
  if (isCODPaymentMethod(input.paymentMethod)) {
    let codConfig = undefined;
    const codSettings = await getCODSettings();
    if (codSettings?.active) {
      codConfig = {
        percentage: parseFloat(codSettings.percentage || "3") / 100,
        fixedFee: parseFloat(codSettings.fixedFee || "5.00"),
      };
    }

    const orderTotalBeforeCOD = Math.max(
      0,
      subtotal + tax + finalShippingCost - discountAmount
    );
    codFee = calculateCODFee(orderTotalBeforeCOD, codConfig).fee;
  }

  const orderTotal = roundMoney(
    Math.max(0, subtotal + tax + finalShippingCost - discountAmount + codFee)
  );
  const codGuaranteeAmount = isCODPaymentMethod(input.paymentMethod)
    ? roundMoney(Math.max(finalShippingCost, shippingBasePrice))
    : 0;

  return {
    items: authoritativeItems,
    subtotal,
    tax,
    taxRatePercentage,
    includeInPrice,
    finalShippingCost,
    shippingBasePrice,
    shippingTotalEstimate,
    pricingVersion,
    discountAmount,
    appliedCoupon,
    codFee,
    orderTotal,
    codGuaranteeAmount,
    isDigitalOnlyOrder,
    supplierCartAnalysis,
    products,
  };
}
