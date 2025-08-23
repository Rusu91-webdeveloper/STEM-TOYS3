import { NextResponse } from "next/server";
import { z } from "zod";

import type { CartItem } from "@/features/cart/context/CartContext";
import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  getShippingSettings,
  getTaxSettings,
} from "@/lib/utils/store-settings";

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
  stripePaymentIntentId: z.string().optional(), // Accept payment intent ID
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

    // Check if Stripe environment variables are set
    const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!stripePublicKey) {
      console.error(
        "Stripe publishable key is not set. Payment processing will fail."
      );

      // In development, return a success response anyway
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Development mode: Creating test order without payment processing"
        );
        const orderId = Math.random()
          .toString(36)
          .substring(2, 12)
          .toUpperCase();
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        return NextResponse.json({
          success: true,
          orderId,
          orderNumber,
          message:
            "Development mode: Test order created without payment processing",
        });
      }

      // In production, return an error
      return NextResponse.json(
        {
          success: false,
          message: "Payment configuration error. Please contact support.",
          error: "STRIPE_NOT_CONFIGURED",
        },
        { status: 500 }
      );
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

    // Get initial shipping method cost (default to 0 if not provided)
    const baseShippingCost =
      orderData.shippingCost ||
      (orderData.shippingMethod?.price
        ? parseFloat(orderData.shippingMethod.price.toString())
        : 0);

    // Get tax and shipping settings from the database
    let taxRate = 0.21; // Default tax rate (21%)
    let applyTax = true; // Default to applying tax
    let taxRatePercentage = "21"; // For display purposes
    let freeShippingThreshold = null;
    let isFreeShippingActive = false;

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
      if (shippingSettings.freeThreshold?.active) {
        freeShippingThreshold = parseFloat(
          shippingSettings.freeThreshold.price
        );
        isFreeShippingActive = true;
      }
    } catch (error) {
      console.error("Error fetching store settings:", error);
      // Continue with default settings
    }

    // Apply free shipping logic
    let finalShippingCost = baseShippingCost;
    if (
      isFreeShippingActive &&
      freeShippingThreshold !== null &&
      subtotal >= freeShippingThreshold
    ) {
      finalShippingCost = 0;
    }

    // Calculate tax based on settings (VAT-inclusive pricing for EU compliance)
    // Note: subtotal already includes VAT, so we calculate VAT backwards for breakdown
    const tax =
      orderData.tax || (applyTax ? subtotal - subtotal / (1 + taxRate) : 0);

    // Handle coupon application
    let appliedCoupon = null;
    let discountAmount = 0;

    if (orderData.couponCode) {
      try {
        // Validate and apply coupon
        const coupon = await db.coupon.findUnique({
          where: { code: orderData.couponCode.toUpperCase() },
          include: {
            _count: {
              select: {
                usages: {
                  where: { userId: user.id },
                },
              },
            },
          },
        });

        if (coupon && coupon.isActive) {
          // Check all coupon conditions
          const now = new Date();
          const isValidTime =
            (!coupon.startsAt || now >= coupon.startsAt) &&
            (!coupon.expiresAt || now <= coupon.expiresAt);
          const hasUsesLeft =
            !coupon.maxUses || coupon.currentUses < coupon.maxUses;
          const userCanUse =
            !coupon.maxUsesPerUser ||
            coupon._count.usages < coupon.maxUsesPerUser;
          const meetsMinimum =
            !coupon.minimumOrderValue || subtotal >= coupon.minimumOrderValue;

          if (isValidTime && hasUsesLeft && userCanUse && meetsMinimum) {
            appliedCoupon = coupon;

            // Calculate discount
            if (coupon.type === "PERCENTAGE") {
              discountAmount = (subtotal * coupon.value) / 100;
              if (
                coupon.maxDiscountAmount &&
                discountAmount > coupon.maxDiscountAmount
              ) {
                discountAmount = coupon.maxDiscountAmount;
              }
            } else {
              discountAmount = Math.min(coupon.value, subtotal);
            }

            // Round to 2 decimal places
            discountAmount = Math.round(discountAmount * 100) / 100;
          }
        }
      } catch (couponError) {
        console.error("Error applying coupon:", couponError);
        // Continue without coupon if there's an error
      }
    }

    // Use provided discount amount if available (from frontend validation)
    if (orderData.discountAmount !== undefined) {
      discountAmount = orderData.discountAmount;
    }

    // Calculate total including shipping, tax, and discount
    const orderTotal =
      orderData.total ||
      Math.max(0, subtotal + tax + finalShippingCost - discountAmount);

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
            paymentMethod: "card", // Default payment method
            status: "PROCESSING",
            paymentStatus: "PAID", // In a real app, this would depend on payment processing
            shippingAddressId,
            stripePaymentIntentId: orderData.stripePaymentIntentId || null,
          },
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

    // Send order confirmation email
    try {
      const orderDetails = {
        id: dbOrder?.id || orderId,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        tax,
        shippingCost: finalShippingCost,
        discountAmount,
        couponCode: appliedCoupon?.code || null,
        total: orderTotal,
        shippingAddress: orderData.shippingAddress,
        shippingMethod: orderData.shippingMethod,
        orderDate: orderData.orderDate || new Date().toISOString(),
        taxRatePercentage,
        isFreeShippingActive,
        freeShippingThreshold,
      };

      await sendEmail({
        to: user.email as string,
        subject: `Confirmare comandă TeechTots #${dbOrder?.id || orderId}`,
        template: "order-confirmation",
        data: {
          order: orderDetails,
        },
      });

      console.log(`Order confirmation email sent to ${user.email}`);
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
