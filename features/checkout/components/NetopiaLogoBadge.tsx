"use client";

import React from "react";

import NTPLogo from "ntp-logo-react";

import { useTranslation } from "@/lib/i18n";

export function NetopiaLogoBadge() {
  const { t } = useTranslation();

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-5 text-white shadow-sm"
      aria-label="Netopia Secure Payments Badge"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),rgba(255,255,255,0))]" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-50/90">
            {t(
              "netopiaPaymentsSecurityTitle",
              "Plăți securizate pentru piața din România"
            )}
          </p>
          <p className="text-base font-medium">
            {t(
              "netopiaPaymentsOfficialPartner",
              "Partener oficial Netopia Payments"
            )}
          </p>
          <p className="text-sm text-blue-50/80">
            {t(
              "netopiaPaymentsDescription",
              "Tranzacții criptate 3D Secure, suport pentru carduri locale și metode alternative de plată mobilPay."
            )}
          </p>
        </div>

        <div className="flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
          <NTPLogo color="#ffffff" version="vertical" secret="156180" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}


