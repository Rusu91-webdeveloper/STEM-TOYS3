import React from "react";
import { auth } from "@/lib/auth";
import { PaymentMethods } from "@/features/account/components/PaymentMethods";

export const metadata = {
  title: "Payment Methods | My Account",
  description: "Manage your saved payment methods",
};

export default async function PaymentMethodsPage() {
  const session = await auth();

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Payment Methods
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your saved payment methods and billing information
        </p>
      </div>
      <PaymentMethods />
    </div>
  );
}
