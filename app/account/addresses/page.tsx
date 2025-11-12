import { PlusCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { AddressList } from "@/features/account/components/AddressList";
import { glassPanelClass, gradientButtonClass } from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Address Book | My Account",
  description: "Manage your shipping and billing addresses",
};

export default function AddressesPage() {
  return (
    <div className="space-y-6 text-slate-100">
      <div
        className={cn(
          glassPanelClass,
          "flex flex-col gap-4 border-white/10 bg-slate-900/70 px-5 py-4 shadow-xl shadow-black/30 sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Address Book</h2>
          <p className="text-sm text-slate-300">
            Manage your shipping and billing addresses
          </p>
        </div>
        <Button
          asChild
          className={cn(
            "inline-flex items-center gap-2 transition hover:scale-[1.02]",
            gradientButtonClass
          )}
        >
          <Link href="/account/addresses/new">
            <PlusCircle className="h-4 w-4" />
            Add New Address
          </Link>
        </Button>
      </div>

      <AddressList />
    </div>
  );
}
