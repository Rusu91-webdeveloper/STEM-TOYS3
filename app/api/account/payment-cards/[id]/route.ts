import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Schema for updating a payment card
const updateCardSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required").optional(),
  expiryMonth: z
    .string()
    .regex(/^(0[1-9]|1[0-2])$/, "Invalid expiry month")
    .optional(),
  expiryYear: z
    .string()
    .regex(/^\d{2}$/, "Invalid expiry year")
    .optional(),
  isDefault: z.boolean().optional(),
  billingAddressId: z.string().optional().nullable(),
});

// GET - Get a specific payment card
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const cardId = params.id;

    // Fetch the card and ensure it belongs to the current user
    const card = await db.paymentCard.findFirst({
      where: {
        id: cardId,
        userId: session.user.id,
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
        updatedAt: true,
        // Never include encryptedCardData or encryptedCvv
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error fetching payment card:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment card" },
      { status: 500 }
    );
  }
}

// PUT - Update a payment card
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const cardId = params.id;
    const body = await req.json();

    // Handle "none" value for billingAddressId
    if (body.billingAddressId === "none") {
      body.billingAddressId = null;
    }

    // Validate request body
    const result = updateCardSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if the card exists and belongs to the user
    const existingCard = await db.paymentCard.findFirst({
      where: {
        id: cardId,
        userId: session.user.id,
      },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const { isDefault, ...cardData } = result.data;

    // Use transaction to ensure all operations are atomic
    const updatedCard = await db.$transaction(async (tx) => {
      // If this is being set as the default card, unset any existing default cards
      if (isDefault && !existingCard.isDefault) {
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

      // Update the card
      return tx.paymentCard.update({
        where: {
          id: cardId,
        },
        data: {
          ...cardData,
          isDefault: isDefault ?? existingCard.isDefault,
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
          updatedAt: true,
        },
      });
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("Error updating payment card:", error);
    return NextResponse.json(
      { error: "Failed to update payment card" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a payment card
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const cardId = params.id;

    // Check if the card exists and belongs to the user
    const existingCard = await db.paymentCard.findFirst({
      where: {
        id: cardId,
        userId: session.user.id,
      },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Delete the card
    await db.paymentCard.delete({
      where: {
        id: cardId,
      },
    });

    // If the deleted card was the default, set another card as default if available
    if (existingCard.isDefault) {
      const anotherCard = await db.paymentCard.findFirst({
        where: {
          userId: session.user.id,
        },
      });

      if (anotherCard) {
        await db.paymentCard.update({
          where: {
            id: anotherCard.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return NextResponse.json(
      { message: "Payment card deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting payment card:", error);
    return NextResponse.json(
      { error: "Failed to delete payment card" },
      { status: 500 }
    );
  }
}
