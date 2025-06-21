import React from "react";
import { auth } from "@/lib/auth";
import { PaymentCardForm } from "@/features/account/components/PaymentCardForm";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Add Payment Method | My Account",
  description: "Add a new payment method to your account",
};

export default async function AddPaymentMethodPage() {
  const session = await auth();

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Add Payment Method
        </h2>
        <p className="text-sm text-muted-foreground">
          Add a new payment method to your account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Card Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentCardForm addresses={formattedAddresses} />
        </CardContent>
      </Card>
    </div>
  );
}
