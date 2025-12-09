"use client";

import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import React from "react";

import { useTranslation } from "@/lib/i18n";

const paymentNetworks = ["Visa", "Mastercard", "Apple Pay", "Google Pay", "Revolut"];

export function StripeLogoBadge() {
  const { t } = useTranslation();

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-[#0b1026] via-[#1a1f3f] to-[#3c2af7] px-5 py-5 text-indigo-50 shadow-xl"
      aria-label="Stripe secure payments badge"
    >
      <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,rgba(99,91,255,0.45),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(111,114,255,0.25),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(21,163,255,0.18),transparent_35%)]" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-indigo-100/80">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>
              {t(
                "stripeSecureCheckout",
                "Secure checkout powered by Stripe"
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 shadow-inner shadow-indigo-900/40 backdrop-blur">
              <div className="rounded-lg bg-white px-3 py-1 text-xl font-black tracking-tight text-[#635bff] shadow-sm">
                stripe
              </div>
              <span className="rounded-full bg-[#0a1026]/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-50 ring-1 ring-white/15">
                Preferred
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {paymentNetworks.map(network => (
                <span
                  key={network}
                  className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-50 backdrop-blur"
                >
                  {network}
                </span>
              ))}
            </div>
          </div>

          <p className="max-w-2xl text-sm text-indigo-100/80">
            {t(
              "stripeSecurityDetails",
              "3D Secure, PSD2 compliant, and encrypted end-to-end with instant confirmation. We never store your card details."
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-indigo-50 shadow-inner shadow-indigo-900/30 backdrop-blur">
          <div className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4 text-indigo-100" aria-hidden="true" />
            <span>
              {t("stripeSecureEncryption", "TLS 1.2+ encryption & PCI DSS compliant")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-indigo-100/90">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>
              {t("stripeFastPayouts", "Fast captures, refunds, and modern wallets supported")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
