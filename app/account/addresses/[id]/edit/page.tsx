"use client";

import React from "react";

import { AddressForm } from "@/features/account/components/AddressForm";
import { glassPanelClass } from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Edit Address | My Account",
  description: "Edit your shipping or billing address",
};

interface EditAddressPageProps {
  params: {
    id: string;
  };
}

export default function EditAddressPage({ params }: EditAddressPageProps) {
  return (
    <div className="space-y-6 text-slate-100">
      <div
        className={cn(
          glassPanelClass,
          "flex flex-col gap-1 border-white/10 bg-slate-900/70 px-5 py-4 shadow-xl shadow-black/30"
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight">Edit Address</h2>
        <p className="text-sm text-slate-300">
          Update the details for this address
        </p>
      </div>

      <AddressForm isEditing addressId={params.id} />
    </div>
  );
}
