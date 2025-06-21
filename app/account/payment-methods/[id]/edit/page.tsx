import React from "react";
import { auth } from "@/lib/auth";
import { PaymentCardForm } from "@/features/account/components/PaymentCardForm";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Payment Method | My Account",
  description: "Edit your payment method details",
};

export default async function EditPaymentMethodPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  const cardId = params.id;

  // Fetch the card to be edited
  const card = await db.paymentCard.findFirst({
    where: {
      id: cardId,
      userId: session.user.id,
    },
    select: {
      id: true,
      cardholderName: true,
      lastFourDigits: true,
      expiryMonth: true,
      expiryYear: true,
      cardType: true,
      isDefault: true,
      billingAddressId: true,
    },
  });

  if (!card) {
    notFound();
  }

  // Get user addresses for the billing address option
  const addresses = await db.address.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      fullName: true,
      addressLine1: true,
      city: true,
      state: true,
    },
  });

  // Format addresses for the form
  const formattedAddresses = addresses.map((address) => ({
    id: address.id,
    name: `${address.name} - ${address.fullName}, ${address.addressLine1}, ${address.city}, ${address.state}`,
  }));

  const initialData = {
    cardholderName: card.cardholderName,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    isDefault: card.isDefault,
    billingAddressId: card.billingAddressId || undefined,
    // Not including card number and CVV as they should not be editable
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Edit Payment Method
        </h2>
        <p className="text-sm text-muted-foreground">
          Update your payment card details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span>Edit Card</span>
            <span className="ml-2 text-sm text-muted-foreground">
              •••• {card.lastFourDigits}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentCardForm
            initialData={initialData}
            isEditing={true}
            cardId={cardId}
            addresses={formattedAddresses}
          />
        </CardContent>
      </Card>
    </div>
  );
}
