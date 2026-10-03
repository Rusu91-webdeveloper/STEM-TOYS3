import { NextResponse } from "next/server";

import {
  privateCardHeaders,
  rejectLegacyCardWrite,
} from "@/lib/account/legacy-card-writes";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Existing records remain visible to their owner for removal; never read secrets.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: privateCardHeaders }
      );
    }

    const cards = await db.paymentCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
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
      },
    });

    return NextResponse.json(cards, { headers: privateCardHeaders });
  } catch {
    console.error("Unable to fetch legacy payment-card metadata");
    return NextResponse.json(
      { error: "Failed to fetch payment cards" },
      { status: 500, headers: privateCardHeaders }
    );
  }
}

export function POST(_request: Request) {
  return rejectLegacyCardWrite();
}
