import React from "react";

import { AddressForm } from "@/features/account/components/AddressForm";

export const metadata = {
  title: "Add New Address | My Account",
  description: "Add a new shipping or billing address",
};

export default function NewAddressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Add New Address
        </h2>
        <p className="text-sm text-muted-foreground">
          Add a new shipping or billing address to your account
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <AddressForm />
      </div>
    </div>
  );
}
