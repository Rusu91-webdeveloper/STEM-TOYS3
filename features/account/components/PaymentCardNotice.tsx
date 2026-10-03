"use client";

import { ShieldCheck } from "lucide-react";

import { useTranslation } from "@/lib/i18n";

export function PaymentCardNotice() {
  const { language } = useTranslation();
  const isRomanian = language === "ro";

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-5 text-slate-100">
      <h3 className="flex items-center gap-2 font-semibold">
        <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
        {isRomanian ? "Plata cu cardul" : "Card payments"}
      </h3>
      <p className="mt-2 text-sm text-slate-300">
        {isRomanian
          ? "Introdu datele cardului numai în formularul procesatorului de plată, la finalizarea comenzii. Adăugarea și modificarea cardurilor în cont nu sunt disponibile."
          : "Enter card details only in the payment provider’s form at checkout. Adding and editing cards in your account is unavailable."}
      </p>
    </div>
  );
}
