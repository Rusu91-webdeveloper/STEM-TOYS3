import React from "react";

import { AddressForm } from "@/features/account/components/AddressForm";
import { glassPanelClass } from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Add New Address | My Account",
  description: "Add a new shipping or billing address",
};

export default function NewAddressPage() {
  return (
    <div className="space-y-6 text-slate-100">
      <div
        className={cn(
          glassPanelClass,
          "flex flex-col gap-1 border-white/10 bg-slate-900/70 px-5 py-4 shadow-xl shadow-black/30"
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight">Add New Address</h2>
        <p className="text-sm text-slate-300">
          Add a new shipping or billing address to your account
        </p>
      </div>

      <AddressForm />
    </div>
  );
}
