import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  encryptData,
  hashData,
  getCardType,
  maskCardNumber,
  validateCardNumber,
  validateCardExpiry,
} from "@/lib/encryption";

// Schema for card validation
const paymentCardSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z
    .string()
    .min(13, "Card number is invalid")
    .max(19, "Card number is invalid")
    .refine(validateCardNumber, {
      message: "Invalid card number - please check and try again",
    }),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Invalid expiry month"),
  expiryYear: z.string().regex(/^\d{2}$/, "Invalid expiry year"),
  cvv: z.string().regex(/^\d{3,4}$/, "Invalid CVV code"),
  isDefault: z.boolean().default(false),
  billingAddressId: z.string().optional(),
});

// GET - Get all payment cards for the current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const cards = await db.paymentCard.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        isDefault: "desc", // Default cards first
      },
      select: {
        id: true,
        lastFourDigits: true,
        cardholderName: true,
        expiryMonth: true,
        expiryYear: true,
        cardType: true,
        isDefault: true,
        billingAddressId: true,
        createdAt: true,
        // Do not include encrypted fields
      },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching payment cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment cards" },
      { status: 500 }
    );
  }
}

// POST - Add a new payment card
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Handle "none" value for billingAddressId
    if (body.billingAddressId === "none") {
      body.billingAddressId = undefined;
    }

    // Validate request body
    const result = paymentCardSchema.safeParse(body);
    if (!result.success) {
      // Get the first validation error message
      const errorPath = result.error.errors[0].path.join(".");
      const errorMessage = result.error.errors[0].message;

      // Add more specific error messages for common issues
      let specificError = errorMessage;

      if (errorPath === "cardNumber") {
        const cardType = getCardType(body.cardNumber?.replace(/\D/g, "") || "");
        if (cardType === "unknown") {
          specificError = "Card type not recognized. Please check the number.";
        } else {
          specificError = `Invalid ${cardType.toUpperCase()} card number. Please verify and try again.`;
        }
      } else if (errorPath.includes("expiry")) {
        if (body.expiryMonth && body.expiryYear) {
          const isValid = validateCardExpiry(body.expiryMonth, body.expiryYear);
          if (!isValid) {
            specificError = "Card has expired or expiry date is invalid.";
          }
        }
      }

      return NextResponse.json(
        { error: specificError, field: errorPath },
        { status: 400 }
      );
    }

    const {
      cardholderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      isDefault,
      billingAddressId,
    } = result.data;

    // Validate the expiry date is in the future
    if (!validateCardExpiry(expiryMonth, expiryYear)) {
      return NextResponse.json(
        { error: "Card has expired", field: "expiryMonth" },
        { status: 400 }
      );
    }

    // Process card data
    const lastFourDigits = cardNumber.slice(-4);
    const cardType = getCardType(cardNumber);

    // Encrypt sensitive data
    const encryptedCardData = encryptData(cardNumber);
    const encryptedCvv = encryptData(cvv);

    // Use transaction to ensure operations are atomic
    const newCard = await db.$transaction(async tx => {
      // If this is the default card, unset any existing default cards
      if (isDefault) {
        await tx.paymentCard.updateMany({
          where: {
            userId: session.user.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create the new payment card
      return tx.paymentCard.create({
        data: {
          userId: session.user.id,
          cardholderName,
          lastFourDigits,
          encryptedCardData,
          encryptedCvv,
          expiryMonth,
          expiryYear,
          cardType,
          isDefault,
          billingAddressId:
            billingAddressId === "none" ? undefined : billingAddressId,
        },
        select: {
          id: true,
          lastFourDigits: true,
          expiryMonth: true,
          expiryYear: true,
          cardholderName: true,
          cardType: true,
          isDefault: true,
          billingAddressId: true,
          createdAt: true,
          // Do not include encrypted fields
        },
      });
    });

    return NextResponse.json(newCard, { status: 201 });
  } catch (error) {
    console.error("Error creating payment card:", error);
    return NextResponse.json(
      { error: "Failed to create payment card" },
      { status: 500 }
    );
  }
}
