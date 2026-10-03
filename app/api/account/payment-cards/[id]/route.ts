import { NextResponse } from "next/server";

import {
  privateCardHeaders,
  rejectLegacyCardWrite,
} from "@/lib/account/legacy-card-writes";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Get a specific payment card
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: privateCardHeaders }
      );
    }

    const { id: cardId } = await params;

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
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404, headers: privateCardHeaders }
      );
    }

    return NextResponse.json(card, { headers: privateCardHeaders });
  } catch {
    console.error("Unable to fetch legacy payment-card metadata");
    return NextResponse.json(
      { error: "Failed to fetch payment card" },
      { status: 500, headers: privateCardHeaders }
    );
  }
}

// Retired legacy cards cannot be edited or selected as a payment method.
export function PUT(
  _req: Request,
  _context: { params: Promise<{ id: string }> }
) {
  return rejectLegacyCardWrite();
}

// DELETE - Delete a payment card
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: privateCardHeaders }
      );
    }

    const { id: cardId } = await params;

    // Check if the card exists and belongs to the user
    const existingCard = await db.paymentCard.findFirst({
      where: {
        id: cardId,
        userId: session.user.id,
      },
      select: { id: true, isDefault: true },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404, headers: privateCardHeaders }
      );
    }

    // Delete the card
    await db.paymentCard.delete({
      where: {
        id: cardId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    // If the deleted card was the default, set another card as default if available
    if (existingCard.isDefault) {
      const anotherCard = await db.paymentCard.findFirst({
        where: {
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (anotherCard) {
        await db.paymentCard.update({
          where: {
            id: anotherCard.id,
          },
          data: {
            isDefault: true,
          },
          select: { id: true },
        });
      }
    }

    return NextResponse.json(
      { message: "Payment card deleted successfully" },
      { status: 200, headers: privateCardHeaders }
    );
  } catch {
    console.error("Unable to remove legacy payment card");
    return NextResponse.json(
      { error: "Failed to delete payment card" },
      { status: 500, headers: privateCardHeaders }
    );
  }
}
