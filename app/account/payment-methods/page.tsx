import React from "react";

import { PaymentMethods } from "@/features/account/components/PaymentMethods";
import { glassPanelClass } from "@/features/home/components/homeTheme";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Payment Methods | My Account",
  description: "Manage your saved payment methods",
};

export default async function PaymentMethodsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div
        className={cn(
          glassPanelClass,
          "flex flex-col gap-1 border-white/10 bg-slate-900/70 px-5 py-4 shadow-xl shadow-black/30"
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight">Payment Methods</h2>
        <p className="text-sm text-slate-300">
          Manage your saved payment methods and billing information
        </p>
      </div>
      <PaymentMethods />
    </div>
  );
}
