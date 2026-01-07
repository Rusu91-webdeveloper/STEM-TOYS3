import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import type { CartItem } from "@/features/cart/context/CartContext";
import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { DatabaseTemplateService } from "@/lib/email/database-template-service";
import { getStripeApiVersion, getStripeCurrency } from "@/lib/stripe-config";
import {
  getShippingSettings,
  getTaxSettings,
} from "@/lib/utils/store-settings";
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

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: getStripeApiVersion() })
  : null;

// Order validation schema - more lenient version
const shippingAddressSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional().nullable(),
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

// Guest information schema
const guestInformationSchema = z.object({
  email: z.string().email(),
  createAccount: z.boolean().optional(),
  password: z.string().optional(),
  marketingOptIn: z.boolean().optional(),
});

// Updated order schema
const orderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  shippingMethod: shippingMethodSchema.optional(),
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
  guestInformation: guestInformationSchema.optional(),
  isGuestCheckout: z.boolean().optional(),
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

    // Get the user session (optional for guest checkout)
    const session = await auth();
    const user = session?.user;

    // Validate request body
    const orderData = orderSchema.parse(body);

    // Validate checkout type - either authenticated user or guest with email
    if (
      !user &&
      (!orderData.guestInformation?.email || !orderData.isGuestCheckout)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required or guest information missing",
        },
        { status: 401 }
      );
    }

    // Determine if this is a guest checkout
    const _isGuestCheckout = !user && orderData.isGuestCheckout;

    // Determine payment provider from order data
    const paymentProvider = orderData.paymentProvider || "netopia";
    const isStripePayment = paymentProvider === "stripe" || Boolean(orderData.stripePaymentIntentId);
    const isCODPayment = orderData.paymentMethod === "cash_on_delivery" || paymentProvider === "cod";

    // Only validate Stripe configuration if this is a Stripe payment
    if (isStripePayment) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        console.error(
          "Stripe secret key is not set but order requires Stripe payment."
        );

        // In development, allow order creation but log warning
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Development mode: Stripe payment requested but Stripe not configured. Order will be created with PENDING payment status."
          );
        } else {
          // In production, return an error for Stripe payments
          return NextResponse.json(
            {
              success: false,
              message: "Stripe payment configuration error. Please contact support.",
              error: "STRIPE_NOT_CONFIGURED",
            },
            { status: 500 }
          );
        }
      }
    }

    // Use the items provided in the order data if available, otherwise fetch from database
    let items: CartItem[];

    if (orderData.items && orderData.items.length > 0) {
      // Use the items from the request
      items = orderData.items as CartItem[];
    } else {
      // Fetch products from the database as fallback
      const products = await db.product.findMany({
        where: {
          isActive: true,
        },
        take: 3,
        orderBy: {
          createdAt: "desc",
        },
      });

      // Map database products to cart items
      items = products.map(product => ({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1, // Default quantity
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : undefined,
      }));
    }

    // Generate order information
    const orderId = Math.random().toString(36).substring(2, 12).toUpperCase();
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate subtotal from cart items if not provided
    const subtotal =
      orderData.subtotal ||
      items.reduce((total, item) => total + item.price * item.quantity, 0);

    // Default shipping fallback values
    let standardShippingPrice = 5.99;
    let freeShippingThreshold: number | null = 250;
    let isFreeShippingActive = true;

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

    // Get initial shipping method cost (default to 0 if not provided)
    const baseShippingCost =
      isDigitalOnlyOrder
        ? 0
        : orderData.shippingCost ||
          (orderData.shippingMethod?.price
            ? parseFloat(orderData.shippingMethod.price.toString())
            : 0);

    // Get tax and shipping settings from the database
    let taxRate = 0.21; // Default tax rate (21%)
    let applyTax = true; // Default to applying tax
    let taxRatePercentage = "21"; // For display purposes

    try {
      // Get tax settings
      const taxSettings = (await getTaxSettings()) as any;
      if (taxSettings.rate) {
        // Convert percentage to decimal (e.g., 10% -> 0.10)
        taxRatePercentage = taxSettings.rate; // Keep the percentage for display
        taxRate = parseFloat(taxSettings.rate) / 100;
      }
      // Only apply tax if it's active
      applyTax = taxSettings.active !== false;
      // Check if prices include VAT (EU compliance) - commented out as not used
      // const includeInPrice = taxSettings.includeInPrice !== false;

      // Get shipping settings for free shipping threshold
      const shippingSettings = (await getShippingSettings()) as any;
      if (shippingSettings?.standard?.price) {
        standardShippingPrice = parseFloat(shippingSettings.standard.price);
      }
      if (shippingSettings.freeThreshold?.active) {
        freeShippingThreshold = parseFloat(
          shippingSettings.freeThreshold.price
        );
        isFreeShippingActive = true;
      }
      // If no free shipping config is active, keep default threshold at 250
      if (!shippingSettings.freeThreshold) {
        freeShippingThreshold = 250;
        isFreeShippingActive = true;
      }
    } catch (error) {
      console.error("Error fetching store settings:", error);
      // Continue with default settings
    }

    // Apply free shipping logic
    let finalShippingCost = baseShippingCost;
    const qualifiesForFreeShipping =
      isFreeShippingActive &&
      freeShippingThreshold !== null &&
      subtotal >= freeShippingThreshold;

    if (qualifiesForFreeShipping) {
      finalShippingCost = 0;
    }

    if (!isDigitalOnlyOrder && finalShippingCost === 0 && !qualifiesForFreeShipping) {
      finalShippingCost = standardShippingPrice;
    }

    // Calculate tax based on settings (VAT-inclusive pricing for EU compliance)
    // Note: subtotal already includes VAT, so we calculate VAT backwards for breakdown
    const tax =
      orderData.tax || (applyTax ? subtotal - subtotal / (1 + taxRate) : 0);

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
        discountAmount = selected.discountAmount;
      }
    } catch (couponError) {
      console.error("Error selecting discounts:", couponError);
      // Continue without discount if there's an error
    }

    // Use provided discount amount if available (from frontend validation)
    if (orderData.discountAmount !== undefined) {
      discountAmount = orderData.discountAmount;
    }

    // Calculate COD fee if COD payment method
    let codFee = 0;
    let codAmount = 0;
    if (isCODPayment) {
      // If COD fee is provided in orderData, use it; otherwise calculate it
      if (orderData.codFee !== undefined) {
        codFee = orderData.codFee;
      } else {
        // Calculate COD fee (3% + 5 RON fixed)
        const { calculateCODFee } = await import("@/lib/pricing/cod-fee-calculator");
        const orderTotalBeforeCOD = Math.max(0, subtotal + tax + finalShippingCost - discountAmount);
        const codFeeResult = calculateCODFee(orderTotalBeforeCOD);
        codFee = codFeeResult.fee;
      }
    }

    // Calculate total including shipping, tax, discount, and COD fee
    const orderTotal =
      orderData.total ||
      Math.max(0, subtotal + tax + finalShippingCost - discountAmount + codFee);
    
    // Store COD amount (total to collect on delivery)
    if (isCODPayment) {
      codAmount = orderTotal;
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
          return NextResponse.json(
            {
              success: false,
              message: "Payment amount mismatch. Please refresh and try again.",
              error: "AMOUNT_MISMATCH",
            },
            { status: 400 }
          );
        }

        if (stripePaymentIntent.currency !== stripeCurrency) {
          return NextResponse.json(
            {
              success: false,
              message: "Payment currency mismatch. Please refresh and try again.",
              error: "CURRENCY_MISMATCH",
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

    // Prepare order details for email (includes all calculated values)

    // DEBUG: Log user object and user.id before address creation
    console.log("DEBUG: user object at order creation", user);
    console.log("DEBUG: user.id at order creation", user?.id);
    // Save shipping address to database or get existing address
    let shippingAddressId;

    try {
      // Check if user has an existing address with the same details
      const existingAddress = await db.address.findFirst({
        where: {
          userId: user.id,
          fullName: orderData.shippingAddress.fullName,
          addressLine1: orderData.shippingAddress.addressLine1,
          city: orderData.shippingAddress.city,
          postalCode: orderData.shippingAddress.postalCode,
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
            fullName: orderData.shippingAddress.fullName,
            addressLine1: orderData.shippingAddress.addressLine1,
            addressLine2: orderData.shippingAddress.addressLine2 || null,
            city: orderData.shippingAddress.city,
            state: orderData.shippingAddress.state,
            postalCode: orderData.shippingAddress.postalCode,
            country: orderData.shippingAddress.country,
            phone: orderData.shippingAddress.phone,
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
            discountAmount,
            couponCode: appliedCoupon?.code || null,
            couponId: appliedCoupon?.id || null,
            paymentMethod: orderData.paymentMethod || "card",
            status: "PROCESSING",
            paymentStatus:
              (orderData.paymentStatus as any) ??
              (isCODPayment
                ? "PENDING"
                : isStripePayment
                  ? "PENDING"
                  : "PAID"),
            shippingAddressId,
            stripePaymentIntentId: orderData.stripePaymentIntentId || null,
            // Store COD information in notes field (we can add proper fields later)
            notes: isCODPayment
              ? `COD Order - Fee: ${codFee.toFixed(2)} RON, Amount to Collect: ${codAmount.toFixed(2)} RON${orderData.notes ? ` | ${orderData.notes}` : ""}`
              : orderData.notes || null,
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
          userId: user?.id ?? "guest",
        };

        const customerEmail =
          user?.email || orderData.guestInformation?.email || "";
        if (customerEmail) {
          metadata.userEmail = customerEmail;
        }

        try {
          await stripeClient.paymentIntents.update(
            orderData.stripePaymentIntentId,
            { metadata }
          );
        } catch (stripeError) {
          console.error(
            `Failed to update payment intent ${orderData.stripePaymentIntentId} metadata:`,
            stripeError
          );
        }
      }

      // Send order processing notifications
      try {
        const notificationSettings = await getNotificationSettings();

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
            // TODO: Send admin alert email
          }
        }

        if (notificationSettings?.adminAlerts.outOfStockItems) {
          // Check for out of stock items
          const outOfStockItems = items.filter(item => {
            // This would need to be implemented based on your inventory logic
            return false; // Placeholder
          });

          if (outOfStockItems.length > 0) {
            console.log(`Out of stock alert triggered for order ${dbOrder.id}`);
            // TODO: Send out of stock alert email
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

      if (hasDigitalBooks) {
        console.log(
          `Order contains ${digitalBooks.length} digital book(s), triggering digital processing...`
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
            const allItemsAreDigital = orderWithItems?.items.every(
              item => item.isDigital === true
            );

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
        console.log("No digital books found in order");
      }

      // If Stripe payment already succeeded, mark order as paid (and auto-complete digital-only orders)
      if (stripePaymentIntent?.status === "succeeded") {
        const allItemsAreDigital =
          orderWithItems?.items.every(item => item.isDigital) === true;

        await db.order.update({
          where: { id: dbOrder.id },
          data: {
            paymentStatus: "PAID",
            ...(allItemsAreDigital ? { status: "COMPLETED" } : {}),
          },
        });
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
    try {
      const paymentProvider = orderData.paymentProvider || "netopia";
      const isNetopia = paymentProvider === "netopia";
      const isStripe = paymentProvider === "stripe";
      const stripeSucceeded = stripePaymentIntent?.status === "succeeded";
      const paymentPending =
        orderData.paymentStatus === "PENDING" ||
        (isNetopia && !stripeSucceeded) ||
        (isStripe && !stripeSucceeded);

      if (paymentPending) {
        console.log(
          `ℹ️ Order ${dbOrder?.id || orderId}: payment pending (${paymentProvider}); deferring confirmation email`
        );
      } else {
        const recipientEmail =
          (user?.email as string) || orderData?.guestInformation?.email;

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
                  orderData?.shippingAddress?.fullName ||
                  user?.name ||
                  "Client",
                orderNumber: String(orderNumberForEmail),
                orderTotal: orderTotal,
                items: items.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
                shippingAddress: orderData.shippingAddress,
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
