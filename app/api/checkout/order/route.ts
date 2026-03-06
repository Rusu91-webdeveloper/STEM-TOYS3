import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import type { CartItem } from "@/features/cart/context/CartContext";
import { auth } from "@/lib/auth";
import { COD_CONSENT_VERSION } from "@/lib/checkout/cod-consent";
import { formatCodGuaranteeAuthorizationNote } from "@/lib/checkout/cod-guarantee";
import {
  evaluateCodGuaranteePolicy,
  isLockerShippingMethodId,
} from "@/lib/checkout/cod-guarantee-policy";
import { getCodGuaranteeUserStats } from "@/lib/checkout/cod-guarantee-risk";
import {
  analyzeSupplierCartComposition,
  applyMixedSupplierShippingRules,
} from "@/lib/checkout/supplier-cart-rules";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { AdminNotificationService } from "@/lib/email/admin-notification-service";
import { DatabaseTemplateService } from "@/lib/email/database-template-service";
import {
  getCodThreshold,
  getRecipientType,
} from "@/lib/shipping/cod-thresholds";
import {
  DEFAULT_COURIERS,
  parseShippingMethodId,
} from "@/lib/shipping/couriers";
import { calculateDeclaredValue } from "@/lib/shipping/declared-value";
import { checkFreeShipping } from "@/lib/shipping/shipping-price-resolver";
import {
  calculateShippingQuote,
  resolveShippingService,
} from "@/lib/shipping/shipping-pricing";
import { getStripeApiVersion, getStripeCurrency } from "@/lib/stripe-config";
import {
  shouldAutoFulfillOrder,
  calculateProcessingTime,
  shouldHoldForReview,
  isSignatureRequired,
  getWarehouseLocation,
  getPackagingNotes,
  isQualityCheckRequired,
  shouldAlertHighValueOrder,
  getNotificationSettings,
} from "@/lib/utils/order-processing";
import {
  getShippingSettings,
  getTaxSettings,
} from "@/lib/utils/store-settings";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: getStripeApiVersion() })
  : null;

// Order validation schema - more lenient version
const shippingAddressSchema = z
  .object({
    companyName: z.string().optional(),
    cui: z.string().optional(),
    fullName: z.string().min(1, "Full name is required"),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional().nullable(),
    street: z.string().optional(),
    streetNumber: z.string().optional(),
    block: z.string().optional(),
    entrance: z.string().optional(),
    floor: z.string().optional(),
    apartment: z.string().optional(),
    addressDetails: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
    phone: z.string().min(1, "Phone number is required"),
  })
  .passthrough(); // Allow additional fields

const shippingMethodSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z
      .union([z.number(), z.string().transform(val => parseFloat(val) || 0)])
      .optional(),
  })
  .passthrough();

const paymentDetailsSchema = z
  .object({
    cardNumber: z.string().optional(),
    nameOnCard: z.string().optional(),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(), // Make CVV optional
  })
  .passthrough();

const orderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().positive(),
  isBook: z.boolean().optional(), // Add isBook flag to identify book items
  selectedLanguage: z.string().optional(),
});

// Updated order schema
const orderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  shippingMethod: shippingMethodSchema.optional(),
  lockerId: z.string().optional(),
  lockerAddressSnapshot: z.unknown().optional(),
  paymentDetails: paymentDetailsSchema.optional(),
  billingAddressSameAsShipping: z.boolean().optional(),
  orderDate: z.string().optional(),
  status: z.string().optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  shippingCost: z.number().optional(),
  total: z.number().optional(),
  items: z.array(orderItemSchema).optional(),
  couponCode: z.string().nullable().optional(),
  discountAmount: z.number().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z
    .enum([
      "PENDING",
      "PAID",
      "FAILED",
      "REFUNDED",
      "PROCESSING",
      "COMPLETED",
      "CANCELLED",
    ])
    .optional(),
  paymentProvider: z.string().optional(),
  stripePaymentIntentId: z.string().optional(), // Accept payment intent ID
  codFee: z.number().optional(), // COD fee amount
  codAmount: z.number().optional(), // Total COD amount to collect
  codConsentAccepted: z.boolean().optional(),
  codConsentAcceptedAt: z.string().optional(),
  codConsentVersion: z.string().optional(),
  codConsentText: z.string().optional(),
  codGuaranteePaymentIntentId: z.string().optional(),
  codGuaranteeAmount: z.number().optional(),
  notes: z.string().nullable().optional(),
  orderNotes: z.string().optional(),
});

// Helper function to format Zod errors
function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.errors) {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  }
  return errors;
}

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

type CheckoutAddressInput = z.infer<typeof shippingAddressSchema>;

const parseStreetAndNumber = (
  addressLine1: string,
  addressLine2?: string | null,
  city?: string
): { street: string | null; streetNumber: string | null } => {
  const normalizedCity = (city || "").trim().toLowerCase();
  const line1Parts = addressLine1
    .split(",")
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => part.toLowerCase() !== normalizedCity);
  const primary = line1Parts[0] || addressLine1.trim();

  const match = primary.match(
    /^(.*?)(?:\s+(?:nr\.?|no\.?)?\s*(\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?))$/i
  );

  const street = normalizeOptionalString(match?.[1] || primary);
  let streetNumber = normalizeOptionalString(match?.[2]);
  if (!streetNumber) {
    const fromLine2 = normalizeOptionalString(addressLine2);
    if (fromLine2 && /^\d+[a-zA-Z]?(?:\s*-\s*\d+[a-zA-Z]?)?$/.test(fromLine2)) {
      streetNumber = fromLine2.replace(/\s+/g, "");
    }
  }

  return { street, streetNumber };
};

const normalizeCheckoutAddress = (input: CheckoutAddressInput) => {
  const country = normalizeOptionalString(input.country) || input.country;
  const city = normalizeOptionalString(input.city) || input.city;
  const street = normalizeOptionalString(input.street);
  const streetNumber = normalizeOptionalString(input.streetNumber);
  const block = normalizeOptionalString(input.block);
  const entrance = normalizeOptionalString(input.entrance);
  const floor = normalizeOptionalString(input.floor);
  const apartment = normalizeOptionalString(input.apartment);
  const addressDetails = normalizeOptionalString(input.addressDetails);

  const parsed = parseStreetAndNumber(
    input.addressLine1,
    input.addressLine2,
    city
  );
  const finalStreet = street || parsed.street;
  const finalStreetNumber = streetNumber || parsed.streetNumber;
  const isRomania = (country || "").toUpperCase() === "RO";

  if (isRomania && (!finalStreet || !finalStreetNumber)) {
    return {
      success: false as const,
      error:
        "Street and street number are required for Romanian deliveries. Please complete address details.",
    };
  }

  const line1 = [finalStreet, finalStreetNumber]
    .filter(Boolean)
    .join(" ")
    .trim();

  const legacyLine2 = normalizeOptionalString(input.addressLine2);
  const line2Parts = [
    block ? `Bl. ${block}` : null,
    entrance ? `Sc. ${entrance}` : null,
    floor ? `Et. ${floor}` : null,
    apartment ? `Ap. ${apartment}` : null,
    addressDetails || null,
    !block && !entrance && !floor && !apartment && !addressDetails
      ? legacyLine2
      : null,
  ].filter(Boolean) as string[];

  return {
    success: true as const,
    address: {
      ...input,
      city,
      country,
      street: finalStreet || undefined,
      streetNumber: finalStreetNumber || undefined,
      block: block || undefined,
      entrance: entrance || undefined,
      floor: floor || undefined,
      apartment: apartment || undefined,
      addressDetails: addressDetails || undefined,
      addressLine1: line1 || input.addressLine1,
      addressLine2: line2Parts.length > 0 ? line2Parts.join(", ") : null,
    },
  };
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const appendOrderNote = (
  currentNotes: string | null | undefined,
  nextNote: string
) => [currentNotes, nextNote].filter(Boolean).join(" | ");

async function compensateFailedStripeOrder(input: {
  orderId: string;
  paymentIntentId: string;
  reason: string;
}) {
  const failureTimestamp = new Date().toISOString();
  const financeReviewReason =
    "Stripe capture failed after order creation. Manual finance review required.";
  const failureNote = `Stripe capture failed at ${failureTimestamp} - PI: ${input.paymentIntentId} - ${input.reason}`;

  await db.$transaction(async tx => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
            isDigital: true,
          },
        },
      },
    });

    if (!order) {
      return;
    }

    if (
      order.paymentStatus === "FAILED" &&
      order.status === "CANCELLED" &&
      order.notes?.includes(failureNote)
    ) {
      return;
    }

    for (const item of order.items) {
      if (!item.productId || item.isDigital === true) {
        continue;
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
          reservedQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    const couponUsages = await tx.couponUsage.findMany({
      where: { orderId: input.orderId },
      select: {
        couponId: true,
      },
    });

    if (couponUsages.length > 0) {
      await tx.couponUsage.deleteMany({
        where: { orderId: input.orderId },
      });

      const usageCounts = couponUsages.reduce<Map<string, number>>(
        (acc, usage) => {
          acc.set(usage.couponId, (acc.get(usage.couponId) || 0) + 1);
          return acc;
        },
        new Map()
      );

      for (const [couponId, count] of usageCounts.entries()) {
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            currentUses: {
              decrement: count,
            },
          },
        });
      }
    }

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
        manualShippingReviewRequired: true,
        shippingReviewReason: financeReviewReason,
        notes: appendOrderNote(order.notes, failureNote),
      },
    });
  });
}

// POST /api/checkout/order - Create a new order
export async function POST(request: Request) {
  try {
    // Parse the request body first
    let body;
    try {
      const bodyText = await request.text();
      body = JSON.parse(bodyText);
      console.log(
        "Processing order with payload:",
        JSON.stringify(body, null, 2)
      );
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON payload",
          error:
            parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Create a new Request object for CSRF validation since we consumed the body
    const requestForCsrf = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(body),
    });

    // Validate CSRF token
    const csrfResult = await validateCsrfForRequest(requestForCsrf, body);
    if (!csrfResult.valid) {
      console.error(
        `CSRF validation failed for /api/checkout/order: ${csrfResult.error}`
      );
      return NextResponse.json(
        {
          success: false,
          message: "Security validation failed",
          error: "CSRF_VALIDATION_FAILED",
        },
        { status: 403 }
      );
    }

    // Checkout is authenticated-only at launch.
    const session = await auth();
    const user = session?.user;

    // Validate request body
    const orderData = orderSchema.parse(body);
    const normalizedShippingAddressResult = normalizeCheckoutAddress(
      orderData.shippingAddress
    );
    if (!normalizedShippingAddressResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: normalizedShippingAddressResult.error,
          error: "INVALID_SHIPPING_ADDRESS",
        },
        { status: 400 }
      );
    }

    let normalizedBillingAddress: CheckoutAddressInput | undefined = undefined;
    if (orderData.billingAddress) {
      const normalizedBillingAddressResult = normalizeCheckoutAddress(
        orderData.billingAddress
      );
      if (!normalizedBillingAddressResult.success) {
        return NextResponse.json(
          {
            success: false,
            message: normalizedBillingAddressResult.error,
            error: "INVALID_BILLING_ADDRESS",
          },
          { status: 400 }
        );
      }
      normalizedBillingAddress = normalizedBillingAddressResult.address;
    }

    const shippingAddressData = normalizedShippingAddressResult.address;
    const billingAddressData = normalizedBillingAddress;

    const shippingMethodId = orderData.shippingMethod?.id || "";
    const lockerRequired = isLockerShippingMethodId(shippingMethodId);
    if (lockerRequired && !normalizeOptionalString(orderData.lockerId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected locker delivery method requires locker selection (lockerId missing).",
          error: "LOCKER_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
          error: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    // Determine payment provider from order data without trusting a broad client default.
    const requestedPaymentMethod =
      normalizeOptionalString(orderData.paymentMethod) || "";
    const requestedPaymentProvider =
      normalizeOptionalString(orderData.paymentProvider) || null;
    const isCODPayment =
      requestedPaymentMethod === "cash_on_delivery" ||
      requestedPaymentProvider === "cod";
    const isNetopiaPayment =
      requestedPaymentMethod.startsWith("netopia_") ||
      (requestedPaymentProvider === "netopia" &&
        requestedPaymentMethod.startsWith("netopia_"));
    const isStripePayment =
      requestedPaymentMethod === "stripe_new" ||
      requestedPaymentProvider === "stripe" ||
      (!isCODPayment &&
        !isNetopiaPayment &&
        Boolean(orderData.stripePaymentIntentId));
    const paymentProvider = isCODPayment
      ? "cod"
      : isNetopiaPayment
        ? "netopia"
        : isStripePayment
          ? "stripe"
          : null;
    const codGuaranteeUserStats = isCODPayment
      ? await getCodGuaranteeUserStats(user.id)
      : { priorOrderCount: 0, priorCodRtoCount: 0 };

    if (lockerRequired && isCODPayment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cash on delivery is not available for FANbox/Easybox deliveries. Please use online card payment.",
          error: "COD_NOT_ALLOWED_FOR_LOCKER",
        },
        { status: 400 }
      );
    }

    const codConsentAccepted = orderData.codConsentAccepted === true;
    const codConsentVersion = normalizeOptionalString(
      orderData.codConsentVersion
    );
    const codConsentText = normalizeOptionalString(orderData.codConsentText);
    const codConsentAcceptedAtRaw = normalizeOptionalString(
      orderData.codConsentAcceptedAt
    );
    const codConsentAcceptedAtDate = codConsentAcceptedAtRaw
      ? new Date(codConsentAcceptedAtRaw)
      : null;
    const codConsentAcceptedAt =
      codConsentAcceptedAtDate &&
      !Number.isNaN(codConsentAcceptedAtDate.getTime())
        ? codConsentAcceptedAtDate.toISOString()
        : null;
    const codGuaranteePaymentIntentId = normalizeOptionalString(
      orderData.codGuaranteePaymentIntentId
    );
    const codGuaranteeAmountInput =
      typeof orderData.codGuaranteeAmount === "number"
        ? Math.round(orderData.codGuaranteeAmount * 100) / 100
        : null;
    let effectiveCodGuaranteePaymentIntentId = codGuaranteePaymentIntentId;
    let effectiveCodGuaranteeAmountInput = codGuaranteeAmountInput;
    let codGuaranteeReleaseNote: string | null = null;

    if (isCODPayment) {
      if (
        !codConsentAccepted ||
        !codConsentVersion ||
        !codConsentText ||
        !codConsentAcceptedAt
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "COD consent is required. Please accept COD delivery and return cost terms before placing the order.",
            error: "COD_CONSENT_REQUIRED",
          },
          { status: 400 }
        );
      }

      if (codConsentVersion !== COD_CONSENT_VERSION) {
        return NextResponse.json(
          {
            success: false,
            message:
              "COD terms were updated. Please review and accept the latest terms before placing the order.",
            error: "COD_CONSENT_VERSION_MISMATCH",
            details: {
              expectedVersion: COD_CONSENT_VERSION,
              receivedVersion: codConsentVersion,
            },
          },
          { status: 400 }
        );
      }
    }

    // Optional testing gate: keep checkout admin-only only when explicitly enabled.
    const isAdmin = user?.role === "ADMIN";
    const checkoutAdminOnly = process.env.CHECKOUT_ADMIN_ONLY === "true";
    if (checkoutAdminOnly && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Checkout is temporarily disabled for testing. Please try again later.",
          error: "CHECKOUT_DISABLED_FOR_NON_ADMIN",
        },
        { status: 403 }
      );
    }

    // Only validate Stripe configuration if this order needs Stripe validation
    if (isStripePayment) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        console.error(
          "Stripe secret key is not set but order requires Stripe validation."
        );

        // In development, allow order creation but log warning
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Development mode: Stripe validation requested but Stripe not configured."
          );
        } else {
          // In production, return an error for Stripe payments
          return NextResponse.json(
            {
              success: false,
              message: "Stripe configuration error. Please contact support.",
              error: "STRIPE_NOT_CONFIGURED",
            },
            { status: 500 }
          );
        }
      }
    }

    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Your cart is empty. Refresh checkout and try again.",
          error: "EMPTY_CART",
        },
        { status: 400 }
      );
    }

    const items = orderData.items as CartItem[];

    // Generate order information
    const orderId = Math.random().toString(36).substring(2, 12).toUpperCase();
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate subtotal from cart items if not provided
    const subtotal = roundMoney(
      items.reduce((total, item) => total + item.price * item.quantity, 0)
    );

    // Default shipping fallback values
    let finalShippingCost = 0;
    let shippingBasePrice = 0;
    let shippingTotalEstimate = 0;
    let pricingVersion: string | null = null;

    // Detect if the order contains only digital items (books)
    let hasPhysicalItems = items.some(item => item.isBook === false);
    if (!hasPhysicalItems) {
      const itemsNeedingTypeCheck = items.filter(
        item => item.isBook === undefined
      );

      if (itemsNeedingTypeCheck.length > 0) {
        try {
          const potentialBookIds = itemsNeedingTypeCheck.map(
            item => item.productId
          );
          const books = await db.book.findMany({
            where: { id: { in: potentialBookIds } },
            select: { id: true },
          });
          const bookIdSet = new Set(books.map(book => book.id));
          hasPhysicalItems = itemsNeedingTypeCheck.some(
            item => !bookIdSet.has(item.productId)
          );
        } catch (error) {
          console.error("Failed to verify digital items for shipping:", error);
          hasPhysicalItems = true; // Fall back to charging shipping if uncertain
        }
      }
    }
    const isDigitalOnlyOrder = items.length > 0 && !hasPhysicalItems;

    let supplierCartAnalysis = {
      isMixedSupplierCart: false,
      supplierCount: 0,
      supplierNames: [] as string[],
      fulfillmentSourceIds: [] as string[],
      requiresPrepaid: false,
      mixedSupplierExtraShipments: 0,
    };

    if (!isDigitalOnlyOrder) {
      const physicalIdsForSupplierAnalysis = items
        .filter(item => item.isBook !== true && item.productId)
        .map(item => item.productId) as string[];

      if (physicalIdsForSupplierAnalysis.length > 0) {
        try {
          const supplierProducts = await db.product.findMany({
            where: { id: { in: physicalIdsForSupplierAnalysis } },
            select: {
              id: true,
              supplierId: true,
              supplier: {
                select: {
                  id: true,
                  name: true,
                  companyName: true,
                },
              },
            },
          });

          supplierCartAnalysis = analyzeSupplierCartComposition(
            items,
            supplierProducts
          );
        } catch (supplierAnalysisError) {
          console.error(
            "Failed to analyze supplier composition for checkout order:",
            supplierAnalysisError
          );
        }
      }
    }

    if (isCODPayment && supplierCartAnalysis.requiresPrepaid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Produsele din această comandă sunt expediate de la furnizori diferiți, iar rambursul nu este disponibil. Finalizează comanda prin plată online cu cardul.",
          error: "MIXED_SUPPLIER_PREPAID_REQUIRED",
          details: {
            supplierCount: supplierCartAnalysis.supplierCount,
            supplierNames: supplierCartAnalysis.supplierNames,
          },
        },
        { status: 400 }
      );
    }

    if (!isDigitalOnlyOrder && !orderData.shippingMethod?.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A valid shipping method is required for physical products.",
          error: "SHIPPING_METHOD_REQUIRED",
        },
        { status: 400 }
      );
    }

    const requestedShippingCost = isDigitalOnlyOrder
      ? 0
      : typeof orderData.shippingMethod?.price === "number"
        ? orderData.shippingMethod.price
        : Number(orderData.shippingMethod?.price || 0);

    shippingBasePrice = roundMoney(Math.max(0, requestedShippingCost));
    shippingTotalEstimate = shippingBasePrice;
    finalShippingCost = shippingBasePrice;

    // Keep checkout/order API in sync with /api/checkout/shipping-quote:
    // if a courier service has priceOverride configured, it must win.
    let selectedServicePriceOverride: number | null = null;
    let shippingSettingsForPricing: unknown = null;
    if (!isDigitalOnlyOrder && orderData.shippingMethod?.id) {
      try {
        const shippingSettings = await getShippingSettings();
        shippingSettingsForPricing = shippingSettings;
        const configuredCouriers =
          (shippingSettings as any)?.couriers &&
          Array.isArray((shippingSettings as any).couriers)
            ? (shippingSettings as any).couriers
            : DEFAULT_COURIERS;

        const { courierId, serviceId } = parseShippingMethodId(
          orderData.shippingMethod.id
        );
        const selectedCourier = configuredCouriers.find(
          (courier: any) =>
            courier.id === courierId && courier.enabled !== false
        );
        const selectedService = selectedCourier?.services?.find(
          (service: any) =>
            service.id === serviceId && service.enabled !== false
        );

        const overrideRaw = selectedService?.priceOverride;
        if (
          overrideRaw !== undefined &&
          overrideRaw !== null &&
          overrideRaw !== ""
        ) {
          const parsedOverride = Number(overrideRaw);
          if (Number.isFinite(parsedOverride)) {
            selectedServicePriceOverride = parsedOverride;
          }
        }
      } catch (shippingSettingsError) {
        console.error(
          "Failed to resolve shipping service price override:",
          shippingSettingsError
        );
      }
    }

    if (!isDigitalOnlyOrder) {
      const productIds = items
        .filter(item => item.isBook !== true)
        .map(item => item.productId);

      if (productIds.length > 0) {
        const products = await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, weight: true, dimensions: true },
        });
        const productMap = new Map(
          products.map(product => [product.id, product])
        );

        const shippingItems = items
          .filter(item => item.isBook !== true)
          .map(item => {
            const product = productMap.get(item.productId);
            if (!product) return null;
            return {
              quantity: item.quantity,
              weightKg: product.weight,
              dimensions: product.dimensions as Record<string, unknown>,
            };
          })
          .filter(Boolean) as Array<{
          quantity: number;
          weightKg?: number | null;
          dimensions?: Record<string, unknown>;
        }>;

        const service = resolveShippingService(orderData.shippingMethod?.id);
        if (!service) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Selected shipping method is invalid. Refresh checkout and choose a delivery option again.",
              error: "INVALID_SHIPPING_METHOD",
            },
            { status: 400 }
          );
        }

        if (service && shippingItems.length > 0) {
          const quote = calculateShippingQuote(service, shippingItems);
          shippingBasePrice = quote.basePrice;
          shippingTotalEstimate = quote.totalPrice;
          pricingVersion = quote.pricingVersion;

          // Priority:
          // 1. Admin priceOverride (always wins — definitive admin control)
          // 2. Frontend price (what the customer was shown at checkout)
          // 3. Server-calculated quote (safety net when no frontend price)
          // This prevents a mismatch where the UI shows one price but the
          // order/email stores a different server-recalculated value.
          if (selectedServicePriceOverride !== null) {
            finalShippingCost = selectedServicePriceOverride;
          } else {
            finalShippingCost = quote.totalPrice;
          }
        }
      }
    }

    if (isDigitalOnlyOrder) {
      finalShippingCost = 0;
      shippingBasePrice = 0;
      shippingTotalEstimate = 0;
    }

    if (!isDigitalOnlyOrder) {
      let freeShippingEligible = false;
      try {
        if (!shippingSettingsForPricing) {
          shippingSettingsForPricing = await getShippingSettings();
        }
        freeShippingEligible = checkFreeShipping(
          subtotal,
          shippingSettingsForPricing
        );
      } catch (shippingRulesError) {
        console.error(
          "Failed to evaluate free shipping rules:",
          shippingRulesError
        );
      }

      const shippingRuleResult = applyMixedSupplierShippingRules({
        singleShipmentPrice:
          selectedServicePriceOverride !== null
            ? selectedServicePriceOverride
            : shippingTotalEstimate,
        freeShippingEligible,
        analysis: supplierCartAnalysis,
      });

      finalShippingCost = shippingRuleResult.finalShippingCost;
      shippingTotalEstimate = shippingRuleResult.finalShippingCost;
    }

    // Get tax settings from the database (dynamic from admin)
    let taxRate = 0;
    let applyTax = false;
    let taxRatePercentage = "0";
    let includeInPrice = true;

    try {
      const taxSettings = (await getTaxSettings()) as any;
      const isTaxEnabled = taxSettings?.active === true;

      if (isTaxEnabled && taxSettings.rate) {
        taxRatePercentage = taxSettings.rate;
        taxRate = parseFloat(taxSettings.rate) / 100;
      }
      applyTax = isTaxEnabled;
      includeInPrice = taxSettings?.includeInPrice !== false;
    } catch (error) {
      console.error("Error fetching store settings:", error);
    }

    let tax = 0;
    if (applyTax && taxRate > 0) {
      if (includeInPrice) {
        // Tax is included in prices - calculate backwards
        const subtotalExcludingVAT = subtotal / (1 + taxRate);
        tax = subtotal - subtotalExcludingVAT;
      } else {
        // Tax is not included - add it to subtotal
        tax = subtotal * taxRate;
      }
    }

    // Handle coupon application (one-discount-per-order with best selection)
    let appliedCoupon = null;
    let discountAmount = 0;

    try {
      const { AutoDiscountService } = await import(
        "@/lib/services/discount-service"
      );

      // 1) Compute welcome discount eligibility for NEW users
      const welcome = user?.id
        ? await AutoDiscountService.getNewUserDiscount(user.id, subtotal)
        : null;

      // 2) If manual coupon provided, validate it
      let manualCoupon: any = null;
      if (orderData.couponCode) {
        const candidate = await db.coupon.findUnique({
          where: { code: (orderData.couponCode || "").toUpperCase() },
          include: {
            _count: {
              select: {
                usages: {
                  where: { userId: user?.id || "" },
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

      // 3) Compare and select best discount
      const selected = AutoDiscountService.compareDiscounts(
        welcome,
        manualCoupon,
        subtotal
      );
      if (selected) {
        appliedCoupon = selected.selectedCoupon;
        discountAmount = roundMoney(selected.discountAmount);
      }
    } catch (couponError) {
      console.error("Error selecting discounts:", couponError);
      // Continue without discount if there's an error
    }

    // Calculate COD fee if COD payment method
    let codFee = 0;
    let codAmount = 0;
    if (isCODPayment) {
      // Always calculate COD fee server-side using current settings
      const { getCODSettings } = await import("@/lib/utils/store-settings");
      const { calculateCODFee } = await import(
        "@/lib/pricing/cod-fee-calculator"
      );
      const orderTotalBeforeCOD = Math.max(
        0,
        subtotal + tax + finalShippingCost - discountAmount
      );

      let codConfig = undefined;
      try {
        const codSettings = await getCODSettings();
        if (codSettings?.active) {
          codConfig = {
            percentage: parseFloat(codSettings.percentage || "3") / 100,
            fixedFee: lockerRequired
              ? 0
              : parseFloat(codSettings.fixedFee || "5.00"),
          };
        }
      } catch (error) {
        console.error("Error fetching COD settings, using default:", error);
      }

      const codFeeResult = calculateCODFee(
        orderTotalBeforeCOD,
        codConfig || (lockerRequired ? { fixedFee: 0 } : undefined)
      );
      codFee = codFeeResult.fee;
    }

    // Calculate total including shipping, tax, discount, and COD fee
    const orderTotal = roundMoney(
      Math.max(0, subtotal + tax + finalShippingCost - discountAmount + codFee)
    );

    // Store COD amount (total to collect on delivery)
    if (isCODPayment) {
      codAmount = orderTotal;
    }

    const requiresOnlineAuthorization =
      !isCODPayment && !isNetopiaPayment && orderTotal > 0;

    if (
      requiresOnlineAuthorization &&
      requestedPaymentMethod !== "stripe_new" &&
      !orderData.stripePaymentIntentId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unsupported checkout payment method. Please reselect card payment and try again.",
          error: "UNSUPPORTED_PAYMENT_METHOD",
        },
        { status: 400 }
      );
    }

    if (requiresOnlineAuthorization && !orderData.stripePaymentIntentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Card payment authorization is required before placing this order.",
          error: "STRIPE_INTENT_REQUIRED",
        },
        { status: 400 }
      );
    }

    const recipientType = getRecipientType([
      shippingAddressData,
      billingAddressData,
    ]);

    // Calculate declared value for insurance (bundles and high-value orders)
    let declaredValue: number | null = null;
    if (!isDigitalOnlyOrder) {
      // Fetch product bundle status if we have product IDs
      const cartProductIds = items
        .filter(item => item.productId && item.isBook !== true)
        .map(item => item.productId);

      if (cartProductIds.length > 0) {
        const productBundleInfo = await db.product.findMany({
          where: { id: { in: cartProductIds } },
          select: { id: true, isBundle: true },
        });

        // Fetch insurance threshold from admin settings
        const { getInsuranceThreshold } = await import(
          "@/lib/shipping/declared-value"
        );
        const insuranceThreshold = await getInsuranceThreshold();

        const declaredValueResult = calculateDeclaredValue({
          cartTotal: orderTotal,
          items: items
            .filter(item => item.productId && item.isBook !== true)
            .map(item => ({
              productId: item.productId,
              price: item.price,
              quantity: item.quantity,
              isBundle:
                productBundleInfo.find(p => p.id === item.productId)
                  ?.isBundle || false,
            })),
          threshold: insuranceThreshold,
        });

        declaredValue = declaredValueResult.declaredValue;

        if (declaredValue) {
          console.log(
            `[Order] Declared value set to ${declaredValue} RON (reason: ${declaredValueResult.reason})`
          );
        }
      }
    }

    if (isCODPayment) {
      const codThreshold = getCodThreshold(recipientType);
      if (orderTotal > codThreshold) {
        return NextResponse.json(
          {
            success: false,
            message:
              "COD amount exceeds allowed threshold for the selected recipient type.",
            error: "COD_THRESHOLD_EXCEEDED",
            details: {
              recipientType,
              threshold: codThreshold,
              codAmount: orderTotal,
            },
          },
          { status: 400 }
        );
      }
    }

    const codGuaranteePolicy = isCODPayment
      ? evaluateCodGuaranteePolicy({
          orderTotal,
          recipientType,
          isLockerDelivery: lockerRequired,
          priorOrderCount: codGuaranteeUserStats.priorOrderCount,
          priorCodRtoCount: codGuaranteeUserStats.priorCodRtoCount,
        })
      : null;
    const codGuaranteeRequired = codGuaranteePolicy?.required === true;

    if (isCODPayment && codGuaranteeRequired) {
      if (
        !effectiveCodGuaranteePaymentIntentId ||
        !effectiveCodGuaranteeAmountInput
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "COD guarantee authorization is required before placing this order.",
            error: "COD_GUARANTEE_REQUIRED",
            details: {
              reasons: codGuaranteePolicy?.reasons ?? [],
            },
          },
          { status: 400 }
        );
      }
    }

    const expectedCodGuaranteeAmount = isCODPayment
      ? Math.round(Math.max(finalShippingCost, shippingBasePrice) * 2 * 100) /
        100
      : 0;
    const expectedCodGuaranteeMinor = Math.round(
      expectedCodGuaranteeAmount * 100
    );

    if (
      isCODPayment &&
      codGuaranteeRequired &&
      effectiveCodGuaranteeAmountInput !== null
    ) {
      if (
        Math.abs(
          effectiveCodGuaranteeAmountInput - expectedCodGuaranteeAmount
        ) > 0.01
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "COD guarantee amount mismatch. Please refresh checkout and authorize the updated guarantee amount.",
            error: "COD_GUARANTEE_AMOUNT_MISMATCH",
            details: {
              expectedAmount: expectedCodGuaranteeAmount,
              providedAmount: effectiveCodGuaranteeAmountInput,
            },
          },
          { status: 400 }
        );
      }
    }

    if (
      isCODPayment &&
      codGuaranteeRequired &&
      effectiveCodGuaranteePaymentIntentId
    ) {
      if (!stripeClient) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Stripe client not configured for COD guarantee validation.",
            error: "STRIPE_CLIENT_MISSING",
          },
          { status: 500 }
        );
      }

      try {
        const codGuaranteeIntent = await stripeClient.paymentIntents.retrieve(
          effectiveCodGuaranteePaymentIntentId
        );

        if (codGuaranteeIntent.amount !== expectedCodGuaranteeMinor) {
          return NextResponse.json(
            {
              success: false,
              message:
                "COD guarantee authorization amount is invalid. Please reauthorize and try again.",
              error: "COD_GUARANTEE_AMOUNT_MISMATCH",
              details: {
                paymentIntentAmount: codGuaranteeIntent.amount,
                expectedAmount: expectedCodGuaranteeMinor,
              },
            },
            { status: 400 }
          );
        }

        if (codGuaranteeIntent.currency !== getStripeCurrency()) {
          return NextResponse.json(
            {
              success: false,
              message:
                "COD guarantee currency mismatch. Please refresh and try again.",
              error: "COD_GUARANTEE_INTENT_INVALID",
            },
            { status: 400 }
          );
        }

        if (
          codGuaranteeIntent.status !== "requires_capture" &&
          codGuaranteeIntent.status !== "succeeded"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "COD guarantee was not authorized successfully. Please reauthorize and try again.",
              error: "COD_GUARANTEE_INTENT_INVALID",
              details: {
                paymentIntentStatus: codGuaranteeIntent.status,
              },
            },
            { status: 400 }
          );
        }
      } catch (err) {
        console.error(
          `Failed to validate COD guarantee payment intent ${effectiveCodGuaranteePaymentIntentId}:`,
          err
        );
        return NextResponse.json(
          {
            success: false,
            message:
              "Failed to validate COD guarantee authorization. Please try again.",
            error: "COD_GUARANTEE_INTENT_INVALID",
          },
          { status: 500 }
        );
      }
    }

    if (isCODPayment && !codGuaranteeRequired) {
      if (effectiveCodGuaranteePaymentIntentId && stripeClient) {
        try {
          const staleGuaranteeIntent =
            await stripeClient.paymentIntents.retrieve(
              effectiveCodGuaranteePaymentIntentId
            );
          if (staleGuaranteeIntent.status === "requires_capture") {
            await stripeClient.paymentIntents.cancel(
              effectiveCodGuaranteePaymentIntentId,
              {
                cancellation_reason: "abandoned",
              }
            );
            codGuaranteeReleaseNote = `COD Guarantee released automatically at ${new Date().toISOString()} - PI: ${effectiveCodGuaranteePaymentIntentId}`;
          }
        } catch (releaseError) {
          console.warn(
            `Failed to auto-release optional COD guarantee ${effectiveCodGuaranteePaymentIntentId}:`,
            releaseError
          );
        }
      }
      effectiveCodGuaranteePaymentIntentId = null;
      effectiveCodGuaranteeAmountInput = null;
    }

    // Validate Stripe payment intent (amount/currency) before creating order
    const expectedAmountMinor = Math.round(orderTotal * 100);
    const stripeCurrency = getStripeCurrency();
    let stripePaymentIntent: Stripe.PaymentIntent | null = null;

    if (isStripePayment && orderData.stripePaymentIntentId) {
      if (!stripeClient) {
        return NextResponse.json(
          {
            success: false,
            message: "Stripe client not configured for payment validation.",
            error: "STRIPE_CLIENT_MISSING",
          },
          { status: 500 }
        );
      }

      try {
        stripePaymentIntent = await stripeClient.paymentIntents.retrieve(
          orderData.stripePaymentIntentId
        );

        if (stripePaymentIntent.amount !== expectedAmountMinor) {
          console.error(
            `Payment amount mismatch: Payment intent amount (${stripePaymentIntent.amount}) does not match order total (${expectedAmountMinor}). This usually happens when a discount code is applied after the payment intent was created.`
          );
          return NextResponse.json(
            {
              success: false,
              message:
                "Payment amount mismatch. This may occur if you applied a discount code after selecting your payment method. Please go back and apply the discount code before selecting your payment method, or refresh the page and try again.",
              error: "AMOUNT_MISMATCH",
              details: {
                paymentIntentAmount: stripePaymentIntent.amount,
                expectedAmount: expectedAmountMinor,
                difference: stripePaymentIntent.amount - expectedAmountMinor,
              },
            },
            { status: 400 }
          );
        }

        if (stripePaymentIntent.currency !== stripeCurrency) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Payment currency mismatch. Please refresh and try again.",
              error: "CURRENCY_MISMATCH",
            },
            { status: 400 }
          );
        }

        if (
          stripePaymentIntent.metadata.userId &&
          stripePaymentIntent.metadata.userId !== user.id
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This payment authorization does not belong to the current user.",
              error: "PAYMENT_INTENT_USER_MISMATCH",
            },
            { status: 403 }
          );
        }

        if (
          stripePaymentIntent.status !== "requires_capture" &&
          stripePaymentIntent.status !== "succeeded"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Card payment has not been authorized yet. Complete payment and try again.",
              error: "PAYMENT_NOT_AUTHORIZED",
              details: {
                paymentIntentStatus: stripePaymentIntent.status,
              },
            },
            { status: 400 }
          );
        }
      } catch (err) {
        console.error(
          `Failed to validate Stripe payment intent ${orderData.stripePaymentIntentId}:`,
          err
        );
        return NextResponse.json(
          {
            success: false,
            message: "Failed to validate Stripe payment. Please try again.",
            error: "INTENT_VALIDATION_FAILED",
          },
          { status: 500 }
        );
      }
    }

    // Validate stock for physical products before creating order
    const physicalProductIds = items
      .filter(item => item.isBook !== true && item.productId)
      .map(item => item.productId) as string[];
    if (physicalProductIds.length > 0) {
      const productsWithStock = await db.product.findMany({
        where: { id: { in: physicalProductIds } },
        select: { id: true, name: true, stockQuantity: true },
      });
      const productStockMap = new Map(
        productsWithStock.map(p => [
          p.id,
          { name: p.name, stockQuantity: p.stockQuantity },
        ])
      );
      for (const item of items) {
        if (item.isBook === true || !item.productId) continue;
        const info = productStockMap.get(item.productId);
        if (!info) continue;
        const available = info.stockQuantity ?? 0;
        if (available < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              message: "Insufficient stock",
              error: "INSUFFICIENT_STOCK",
              details: {
                productName: info.name,
                requested: item.quantity,
                available,
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // Guest checkout: Order and Address require userId. Do not use user.id when user is null.
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required to complete checkout. Please sign in or register.",
          error: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    // Prepare order details for email (includes all calculated values)

    // DEBUG: Log user object and user.id before address creation
    console.log("DEBUG: user object at order creation", user);
    console.log("DEBUG: user.id at order creation", user?.id);
    // Save shipping address to database or get existing address
    let shippingAddressId;

    try {
      const shippingCompanyName = normalizeOptionalString(
        shippingAddressData.companyName
      );
      const shippingCui = normalizeOptionalString(shippingAddressData.cui);

      // Check if user has an existing address with the same details
      const existingAddress = await db.address.findFirst({
        where: {
          userId: user.id,
          fullName: shippingAddressData.fullName,
          addressLine1: shippingAddressData.addressLine1,
          city: shippingAddressData.city,
          postalCode: shippingAddressData.postalCode,
          ...(shippingCompanyName ? { companyName: shippingCompanyName } : {}),
          ...(shippingCui ? { cui: shippingCui } : {}),
        },
      });

      if (existingAddress) {
        shippingAddressId = existingAddress.id;
      } else {
        // Create new address
        const newAddress = await db.address.create({
          data: {
            userId: user.id,
            name: "Shipping Address", // Default name
            companyName: shippingCompanyName,
            cui: shippingCui,
            fullName: shippingAddressData.fullName,
            addressLine1: shippingAddressData.addressLine1,
            addressLine2: shippingAddressData.addressLine2 || null,
            city: shippingAddressData.city,
            state: shippingAddressData.state,
            postalCode: shippingAddressData.postalCode,
            country: shippingAddressData.country,
            phone: shippingAddressData.phone,
          },
        });
        shippingAddressId = newAddress.id;
      }
    } catch (dbError) {
      console.error("Failed to create/find shipping address:", dbError);
      // Use a placeholder ID for development
      if (process.env.NODE_ENV === "development") {
        shippingAddressId = "address-placeholder";
      } else {
        throw dbError;
      }
    }

    // Create order and items in a single database transaction
    let dbOrder;
    const operationalNotes: string[] = [];
    if (supplierCartAnalysis.isMixedSupplierCart) {
      operationalNotes.push(
        `Split shipment order (${supplierCartAnalysis.supplierCount} fulfillment sources${supplierCartAnalysis.supplierNames.length ? `: ${supplierCartAnalysis.supplierNames.join(", ")}` : ""}). Prepaid only.`
      );
    }
    if (codGuaranteeReleaseNote) {
      operationalNotes.push(codGuaranteeReleaseNote);
    }
    const codConsentVersionTag = codConsentVersion
      ? `COD_CONSENT_V${codConsentVersion.replace(/[^A-Za-z0-9]/g, "_")}`
      : null;
    const orderTags = supplierCartAnalysis.isMixedSupplierCart
      ? ["MIXED_SUPPLIER", "MULTI_PARCEL"]
      : [];
    if (isCODPayment && codConsentVersionTag) {
      orderTags.push(codConsentVersionTag);
    }
    if (isCODPayment && effectiveCodGuaranteePaymentIntentId) {
      orderTags.push("COD_GUARANTEE_AUTHORIZED");
    }
    const codConsentSnapshot = codConsentText
      ? codConsentText.slice(0, 500)
      : null;
    const codGuaranteeAuthorizationNote =
      isCODPayment && effectiveCodGuaranteePaymentIntentId
        ? formatCodGuaranteeAuthorizationNote({
            authorizedAt: new Date().toISOString(),
            paymentIntentId: effectiveCodGuaranteePaymentIntentId,
            amount: expectedCodGuaranteeAmount,
          })
        : null;
    try {
      console.log(
        `Creating order with ${items.length} items:`,
        items.map(item => ({
          name: item.name,
          productId: item.productId,
          isBook: item.isBook,
        }))
      );

      dbOrder = await db.$transaction(async tx => {
        // First, create the order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            total: orderTotal,
            subtotal,
            tax,
            shippingCost: finalShippingCost,
            shippingBasePrice,
            shippingTotalEstimate,
            codFeeEstimate: isCODPayment ? codFee : null,
            pricingVersion,
            discountAmount,
            couponCode: appliedCoupon?.code || null,
            couponId: appliedCoupon?.id || null,
            paymentMethod: requestedPaymentMethod || "card",
            shippingMethod: orderData.shippingMethod?.id || null,
            lockerId: orderData.lockerId || null,
            lockerAddressSnapshot:
              orderData.lockerAddressSnapshot ?? Prisma.JsonNull,
            recipientType,
            declaredValue,
            codAmount: isCODPayment ? codAmount : null,
            currency: "RON",
            tags: orderTags,
            // For Netopia we keep the order in a "pending review" state
            // (valid OrderStatus enum) until the IPN/webhook confirms
            // payment success or failure. The actual payment lifecycle
            // is represented by paymentStatus = PENDING/PAID/FAILED.
            status: isNetopiaPayment ? "PENDING_REVIEW" : "PROCESSING",
            paymentStatus:
              (orderData.paymentStatus as any) ??
              ((isCODPayment || isNetopiaPayment || requiresOnlineAuthorization)
                ? "PENDING"
                : "PAID"),
            shippingAddressId,
            stripePaymentIntentId: orderData.stripePaymentIntentId || null,
            // Store COD information in notes field (we can add proper fields later)
            notes:
              [
                isCODPayment
                  ? `COD Order - Fee: ${codFee.toFixed(
                      2
                    )} RON, Amount to Collect: ${codAmount.toFixed(2)} RON`
                  : null,
                isCODPayment && codConsentAcceptedAt && codConsentVersion
                  ? `COD Consent accepted at ${codConsentAcceptedAt} (version ${codConsentVersion})`
                  : null,
                isCODPayment && codConsentSnapshot
                  ? `COD Consent terms snapshot: ${codConsentSnapshot}`
                  : null,
                codGuaranteeAuthorizationNote,
                ...(orderData.notes ? [orderData.notes] : []),
                ...operationalNotes,
              ]
                .filter(Boolean)
                .join(" | ") || null,
          },
        });

        // Apply order processing logic
        console.log("Applying order processing logic...");

        // Check if order should be held for review
        const shouldHold = await shouldHoldForReview(
          orderTotal,
          orderData.orderNotes
        );
        if (shouldHold) {
          console.log(
            `Order ${newOrder.id} held for review due to high value or keywords`
          );
          await tx.order.update({
            where: { id: newOrder.id },
            data: { status: "PENDING_REVIEW" },
          });
        }

        // Check if order should be auto-fulfilled
        const shouldAutoFulfill = await shouldAutoFulfillOrder(
          orderTotal,
          items
        );
        if (shouldAutoFulfill && !shouldHold) {
          console.log(`Order ${newOrder.id} eligible for auto-fulfillment`);
          // Auto-fulfillment will be handled by background job
        }

        // Calculate processing time
        const processingTime = await calculateProcessingTime(
          orderData.shippingMethod?.name || "standard"
        );
        console.log(
          `Order ${newOrder.id} processing time: ${processingTime} hours`
        );

        // Check if signature is required
        const signatureRequired = await isSignatureRequired(orderTotal);
        if (signatureRequired) {
          console.log(`Order ${newOrder.id} requires signature for delivery`);
        }

        // Get fulfillment details
        const warehouseLocation = await getWarehouseLocation();
        const packagingNotes = await getPackagingNotes();
        const qualityCheckRequired = await isQualityCheckRequired();

        console.log(`Order ${newOrder.id} fulfillment details:`, {
          warehouseLocation,
          packagingNotes,
          qualityCheckRequired,
          signatureRequired,
        });

        // If coupon was applied, track its usage and update coupon stats
        if (appliedCoupon && discountAmount > 0) {
          // Create coupon usage record
          await tx.couponUsage.create({
            data: {
              couponId: appliedCoupon.id,
              userId: user.id,
              orderId: newOrder.id,
            },
          });

          // Update coupon usage count
          await tx.coupon.update({
            where: { id: appliedCoupon.id },
            data: {
              currentUses: {
                increment: 1,
              },
            },
          });
        }

        // Then, add items - validate and create each item
        for (const item of items) {
          console.log(
            `Processing item: ${item.name} (ID: ${item.productId}, isBook: ${item.isBook})`
          );

          // First, let's determine if this is a book or a product
          let isBook = item.isBook === true;
          let productId = item.productId;

          // If isBook is not explicitly set, try to detect it by checking if the ID exists in the books table
          if (isBook === false || item.isBook === undefined) {
            const bookCheck = await tx.book.findUnique({
              where: { id: item.productId },
              select: { id: true, name: true },
            });

            if (bookCheck) {
              isBook = true;
              console.log(
                `Detected book: ${bookCheck.name} (ID: ${item.productId})`
              );
            }
          }

          if (isBook) {
            // For books, the item.productId is actually the book ID
            console.log(`Processing book item: ${item.name}`);

            // Check if this is a deleted book (contains "Deleted" in name)
            if (item.name.includes("(Deleted)")) {
              console.log(`Skipping deleted book: ${item.name}`);
              continue; // Skip this item, don't create an order item for it
            }

            // Validate the book exists and is active (item.productId is the book ID)
            const book = await tx.book.findUnique({
              where: { id: item.productId },
              select: { id: true, name: true, isActive: true },
            });

            if (!book) {
              console.log(
                `Book ${item.productId} not found, skipping item: ${item.name}`
              );
              continue; // Skip this item instead of throwing error
            }

            if (!book.isActive) {
              console.log(
                `Book ${book.name} is inactive, skipping item: ${item.name}`
              );
              continue; // Skip this item instead of throwing error
            }

            // For books, productId is already the book ID
            productId = book.id;
            console.log(`Validated book: ${book.name} (Book ID: ${productId})`);
          } else {
            // For regular products, validate the product exists
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { id: true, name: true, isActive: true },
            });

            if (!product) {
              console.log(
                `Product ${item.productId} not found, skipping item: ${item.name}`
              );
              continue; // Skip this item instead of throwing error
            }

            if (!product.isActive) {
              console.log(
                `Product ${product.name} is inactive, skipping item: ${item.name}`
              );
              continue; // Skip this item instead of throwing error
            }

            console.log(
              `Validated product: ${product.name} (ID: ${productId})`
            );
          }

          // Create the order item with book-specific fields if it's a book
          let orderItemData;
          if (isBook) {
            orderItemData = {
              orderId: newOrder.id,
              bookId: productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              isDigital: true,
              maxDownloads: 5,
              downloadExpiresAt: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ),
            };
          } else {
            orderItemData = {
              orderId: newOrder.id,
              productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            };
          }

          const orderItem = await tx.orderItem.create({
            data: orderItemData,
          });

          console.log(
            `Created order item: ${orderItem.id} for ${isBook ? "book" : "product"} ${productId}${isBook ? " (digital)" : ""}${item.selectedLanguage ? ` in ${item.selectedLanguage}` : ""}`
          );

          // --- INVENTORY UPDATE LOGIC ---
          if (!isBook && productId) {
            await tx.product.update({
              where: { id: productId },
              data: {
                stockQuantity: { decrement: item.quantity },
                reservedQuantity: { increment: item.quantity },
                // Optionally, increment totalSold here if you want to count as sold immediately:
                // totalSold: { increment: item.quantity },
              },
            });
            console.log(
              `Updated inventory for product ${productId}: -${item.quantity} stock, +${item.quantity} reserved.`
            );
          }
          // --- END INVENTORY UPDATE LOGIC ---
        }

        return newOrder;
      });

      console.log(
        `Successfully created order ${dbOrder.id} with ${items.length} items`
      );

      if (stripeClient && orderData.stripePaymentIntentId) {
        const metadata: Record<string, string> = {
          orderId: dbOrder.id,
          orderNumber: dbOrder.orderNumber || orderNumber,
          userId: user.id,
        };

        const customerEmail = user.email || "";
        if (customerEmail) {
          metadata.userEmail = customerEmail;
        }

        try {
          // Update metadata first
          await stripeClient.paymentIntents.update(
            orderData.stripePaymentIntentId,
            { metadata }
          );

          // CRITICAL: Capture the payment if using manual capture mode
          // With manual capture, funds are authorized (held) but not captured until we explicitly capture
          // This prevents charging customers who cancel before completing the order
          if (stripePaymentIntent?.status === "requires_capture") {
            console.log(
              `Capturing PaymentIntent ${orderData.stripePaymentIntentId} for order ${dbOrder.id}...`
            );
            const capturedIntent = await stripeClient.paymentIntents.capture(
              orderData.stripePaymentIntentId
            );

            if (capturedIntent.status === "succeeded") {
              console.log(
                `✅ Successfully captured payment for order ${dbOrder.id}`
              );
              // Update the stripePaymentIntent variable for downstream checks
              stripePaymentIntent = capturedIntent;
            } else {
              console.error(
                `❌ Unexpected status after capture: ${capturedIntent.status}`
              );
            }
          }
        } catch (stripeError) {
          const captureFailureMessage =
            stripeError instanceof Error
              ? stripeError.message
              : "Unknown Stripe capture error";
          console.error(
            `Failed to update/capture payment intent ${orderData.stripePaymentIntentId}:`,
            stripeError
          );
          await compensateFailedStripeOrder({
            orderId: dbOrder.id,
            paymentIntentId: orderData.stripePaymentIntentId,
            reason: captureFailureMessage,
          });
          throw new Error(
            "Card payment capture failed after order creation. The order was cancelled and inventory was restored."
          );
        }
      }

      if (
        stripeClient &&
        isCODPayment &&
        effectiveCodGuaranteePaymentIntentId
      ) {
        const codGuaranteeMetadata: Record<string, string> = {
          orderId: dbOrder.id,
          orderNumber: dbOrder.orderNumber || orderNumber,
          userId: user.id,
          paymentFlow: "cod_guarantee",
          guaranteeAmount: expectedCodGuaranteeAmount.toFixed(2),
        };

        const customerEmail = user.email || "";
        if (customerEmail) {
          codGuaranteeMetadata.userEmail = customerEmail;
        }

        try {
          await stripeClient.paymentIntents.update(
            effectiveCodGuaranteePaymentIntentId,
            {
              metadata: codGuaranteeMetadata,
            }
          );
        } catch (stripeError) {
          console.error(
            `Failed to update COD guarantee payment intent ${effectiveCodGuaranteePaymentIntentId}:`,
            stripeError
          );
        }
      }

      // Send order processing notifications
      try {
        const notificationSettings = await getNotificationSettings();

        if (dbOrder?.id) {
          AdminNotificationService.sendNewOrderNotification(dbOrder.id).catch(
            err => {
              console.error(
                `Failed to send admin new order notification for ${dbOrder.id}:`,
                err
              );
            }
          );
        }

        if (notificationSettings?.orderConfirmation) {
          console.log(
            `Sending order confirmation email for order ${dbOrder.id}`
          );
          // Order confirmation email will be sent by existing email logic
        }

        if (notificationSettings?.adminAlerts.highValueOrders) {
          const shouldAlert = await shouldAlertHighValueOrder(orderTotal);
          if (shouldAlert) {
            console.log(
              `High value order alert triggered for order ${dbOrder.id} (${orderTotal} RON)`
            );
            // Send high value order alert to admin
            AdminNotificationService.sendOrderIssueNotification(
              dbOrder.id,
              "HIGH_VALUE_ORDER",
              `High value order received: ${orderTotal.toFixed(2)} RON`,
              "MEDIUM"
            ).catch(err => {
              console.error(`Failed to send high value order alert:`, err);
            });
          }
        }

        if (notificationSettings?.adminAlerts.outOfStockItems) {
          // Check for low stock items after inventory decrement
          const physicalProductIds = items
            .filter(item => item.isBook !== true && item.productId)
            .map(item => item.productId);

          if (physicalProductIds.length > 0) {
            const productsWithStock = await db.product.findMany({
              where: { id: { in: physicalProductIds } },
              select: {
                id: true,
                name: true,
                stockQuantity: true,
                reorderPoint: true,
              },
            });

            // Check each product for low stock
            for (const product of productsWithStock) {
              const minimumStock = product.reorderPoint || 5; // Default to 5 if no reorderPoint set
              if (product.stockQuantity <= minimumStock) {
                console.log(
                  `⚠️ Low stock alert: ${product.name} has ${product.stockQuantity} units (minimum: ${minimumStock})`
                );
                // Send low stock alert email (async, don't await to not block order)
                AdminNotificationService.sendLowStockAlert(
                  product.id,
                  product.stockQuantity,
                  minimumStock
                ).catch(err => {
                  console.error(
                    `Failed to send low stock alert for ${product.name}:`,
                    err
                  );
                });
              }
            }
          }
        }
      } catch (notificationError) {
        console.error(
          "Error sending order processing notifications:",
          notificationError
        );
        // Don't fail the order creation if notifications fail
      }

      // Check if this order contains digital books by checking the actual order items created
      const orderWithItems = await db.order.findUnique({
        where: { id: dbOrder.id },
        include: {
          items: true,
        },
      });

      const digitalBooks =
        orderWithItems?.items.filter(item => item.bookId !== null) || [];
      const hasDigitalBooks = digitalBooks.length > 0;
      const allItemsAreDigital =
        orderWithItems?.items.every(item => item.isDigital === true) === true;
      const hasPhysicalItems =
        orderWithItems?.items.some(item => item.isDigital !== true) === true;

      // ⚠️ CRITICAL: Only process digital books if payment is already verified as PAID
      // Digital books should NOT be processed for:
      // - COD orders (payment collected on delivery)
      // - Netopia orders (processed via webhook after payment verification)
      // - Stripe orders (processed via webhook after payment verification)
      // - Any order with PENDING payment status

      const stripeSucceeded = stripePaymentIntent?.status === "succeeded";

      if (stripeSucceeded) {
        await db.order.update({
          where: { id: dbOrder.id },
          data: {
            paymentStatus: "PAID",
            ...(orderData.stripePaymentIntentId
              ? { stripePaymentIntentId: orderData.stripePaymentIntentId }
              : {}),
            ...(allItemsAreDigital
              ? { status: "DELIVERED", deliveredAt: new Date() }
              : {}),
          },
        });
      }

      const orderPaymentStatus = stripeSucceeded
        ? "PAID"
        : dbOrder.paymentStatus;
      const paymentIsVerified =
        orderPaymentStatus === "PAID" || stripeSucceeded;

      if (hasDigitalBooks) {
        if (paymentIsVerified) {
          console.log(
            `✅ Order contains ${digitalBooks.length} digital book(s) and payment is verified - processing digital books...`
          );

          // Create language preferences map from cart items
          const languagePreferences = new Map<string, string>();

          // Match cart items with order items to extract language preferences
          for (const orderItem of digitalBooks) {
            // Find the corresponding cart item by matching the item name
            const cartItem = items.find(item => item.name === orderItem.name);

            if (cartItem?.selectedLanguage) {
              languagePreferences.set(orderItem.id, cartItem.selectedLanguage);
              console.log(
                `Language preference for order item ${orderItem.id}: ${cartItem.selectedLanguage}`
              );
            } else {
              console.log(
                `No language preference found for order item ${orderItem.id} (${orderItem.name})`
              );
            }
          }

          try {
            // Process digital order with language preferences
            // processDigitalBookOrder will verify payment status again as an additional safeguard
            const digitalOrderService = await import(
              "@/lib/services/digital-order-service"
            );
            if (digitalOrderService.processDigitalBookOrder) {
              await digitalOrderService.processDigitalBookOrder(
                dbOrder.id,
                languagePreferences
              );
              console.log("Digital book processing completed successfully");

              // Check if this order contains ONLY digital books
              if (allItemsAreDigital) {
                // Automatically mark digital-only orders as delivered
                await db.order.update({
                  where: { id: dbOrder.id },
                  data: {
                    status: "DELIVERED",
                    deliveredAt: new Date(),
                  },
                });
                console.log(
                  `✅ Digital-only order ${dbOrder.orderNumber} automatically marked as DELIVERED`
                );
              }
            } else {
              console.log("Digital order processing not available");
            }
          } catch (digitalError) {
            // Log error but don't fail the order - digital processing can be retried later
            console.error("Failed to process digital books:", digitalError);
          }
        } else {
          console.log(
            `⏸️ Order contains ${digitalBooks.length} digital book(s) but payment status is ${orderPaymentStatus} - deferring digital book processing until payment is verified`
          );
          console.log(
            `   Digital books will be processed via webhook after payment verification (Stripe/Netopia) or after COD payment is received`
          );
        }
      } else {
        console.log("No digital books found in order");
      }

      if (isCODPayment && hasPhysicalItems) {
        try {
          const { OrderProcessor } = await import("@/lib/order-processor");
          let supplierOrderCount = await db.supplierOrder.count({
            where: { orderId: dbOrder.id },
          });

          if (supplierOrderCount === 0) {
            const processResult = await OrderProcessor.processNewOrder(
              dbOrder.id
            );
            if (!processResult.success && processResult.errors.length > 0) {
              console.warn(
                `[CHECKOUT][COD] Supplier orders had errors for order ${dbOrder.id}:`,
                processResult.errors
              );
            }
            supplierOrderCount = await db.supplierOrder.count({
              where: { orderId: dbOrder.id },
            });
          }

          if (supplierOrderCount === 0) {
            const reason =
              "Supplier orders were not created for this COD order. Manual fulfillment review required: create or fix supplier lines in Admin and then create the AWB/shipping label manually.";
            await db.order.update({
              where: { id: dbOrder.id },
              data: {
                manualShippingReviewRequired: true,
                shippingReviewReason: reason,
              },
            });
            // Notify admin that this order needs manual supplier/shipping review
            AdminNotificationService.sendOrderIssueNotification(
              dbOrder.id,
              "MANUAL_SHIPPING_REVIEW_REQUIRED",
              reason,
              "HIGH"
            ).catch(err => {
              console.error(
                `[CHECKOUT][COD] Failed to send manual shipping review notification for order ${dbOrder.id}:`,
                err
              );
            });
            console.warn(
              `[CHECKOUT][COD] Skipping AWB for order ${dbOrder.id}: ${reason}`
            );
          } else {
            const existingAwbShipment = await db.shipment.findFirst({
              where: {
                orderId: dbOrder.id,
                awbNumber: { not: null },
              },
              select: { awbNumber: true, courier: true },
            });
            if (existingAwbShipment?.awbNumber) {
              console.log(
                `ℹ️ Order ${dbOrder.id}: AWB already exists for COD order: ${existingAwbShipment.awbNumber} (${existingAwbShipment.courier})`
              );
            } else {
              const { createCourierAwbForOrder } = await import(
                "@/lib/shipping/awb-dispatcher"
              );
              const awbResult = await createCourierAwbForOrder(dbOrder.id);
              if (awbResult.success) {
                console.log(
                  `✅ Order ${dbOrder.id}: AWB created for COD order: ${awbResult.awbNumber}`
                );
              } else {
                console.warn(
                  `⚠️ Order ${dbOrder.id}: AWB creation failed for COD order:`,
                  awbResult.error
                );
              }
            }
          }
        } catch (awbError) {
          console.error(
            `❌ Order ${dbOrder.id}: AWB creation error for COD order:`,
            awbError
          );
        }
      }
    } catch (dbError) {
      console.error("Failed to create order in database:", dbError);
      console.error("Error details:", {
        message: dbError instanceof Error ? dbError.message : "Unknown error",
        orderData: {
          userId: user.id,
          orderNumber,
          itemCount: items.length,
          items: items.map(item => ({
            name: item.name,
            productId: item.productId,
            isBook: item.isBook,
          })),
        },
      });

      // Always throw the error - don't swallow it in development
      throw new Error(
        `Order creation failed: ${dbError instanceof Error ? dbError.message : "Unknown database error"}`
      );
    }

    // Send order confirmation email only when payment is already confirmed
    // Netopia: email is sent from the webhook after status 3/5 (success)
    // Stripe: send only if payment intent already succeeded
    // COD: send immediately (order is confirmed, payment collected on delivery)
    try {
      const emailPaymentProvider = paymentProvider || "manual";
      const isNetopia = emailPaymentProvider === "netopia";
      const isStripe = emailPaymentProvider === "stripe";
      const isCOD =
        requestedPaymentMethod === "cash_on_delivery" ||
        emailPaymentProvider === "cod";
      const stripeSucceeded = stripePaymentIntent?.status === "succeeded";
      const paymentPending =
        orderData.paymentStatus === "PENDING" ||
        (isNetopia && !stripeSucceeded) ||
        (isStripe && !stripeSucceeded);

      // For COD orders, send email immediately even though payment is pending
      // COD orders are confirmed - we just collect payment on delivery
      if (paymentPending && !isCOD) {
        console.log(
          `ℹ️ Order ${dbOrder?.id || orderId}: payment pending (${emailPaymentProvider}); deferring confirmation email`
        );
      } else {
        if (isCOD) {
          console.log(
            `📧 Order ${dbOrder?.id || orderId}: COD order - sending confirmation email immediately`
          );
        }
        const recipientEmail = user.email;

        if (!recipientEmail) {
          console.warn(
            `Order ${dbOrder?.id || orderId}: no recipient email found (user or guest). Skipping confirmation email.`
          );
        } else {
          const orderNumberForEmail =
            dbOrder?.orderNumber || dbOrder?.id || orderId;

          const sendResult =
            await DatabaseTemplateService.sendOrderConfirmationEmail(
              recipientEmail,
              {
                customerName:
                  shippingAddressData?.fullName || user?.name || "Client",
                orderNumber: String(orderNumberForEmail),
                orderTotal,
                items: items.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
                shippingAddress: shippingAddressData,
                subtotal,
                tax,
                shippingCost: finalShippingCost,
                discountAmount,
                codFee,
                taxRatePercentage,
              }
            );

          if (sendResult.success) {
            console.log(
              `✅ Order confirmation email sent to ${recipientEmail}`
            );
          } else {
            console.error(
              `❌ Failed to send order confirmation email for order ${orderNumberForEmail}:`,
              sendResult.error
            );
          }
        }
      }
    } catch (emailError) {
      // Log error but don't fail the order process
      console.error("Failed to send order confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: dbOrder?.id || orderId,
      orderNumber: dbOrder?.orderNumber || orderNumber,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Failed to create order:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error);

      // Log the validation errors for debugging
      console.error(
        "Validation errors:",
        JSON.stringify(formattedErrors, null, 2)
      );
      console.error("Validation error details:", error.errors);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid order data",
          error: formattedErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
