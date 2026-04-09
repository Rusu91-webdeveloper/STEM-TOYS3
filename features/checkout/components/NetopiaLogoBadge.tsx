"use client";

import Image from "next/image";
import React from "react";

import { useTranslation } from "@/lib/i18n";

export function NetopiaLogoBadge() {
  const { t } = useTranslation();

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-4 text-white shadow-sm sm:py-5"
      aria-label="Netopia Secure Payments Badge"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),rgba(255,255,255,0))]" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-50/90 sm:text-sm">
            {t(
              "netopiaPaymentsSecurityTitle",
              "Plăți securizate pentru piața din România"
            )}
          </p>
          <p className="text-sm font-medium sm:text-base">
            {t(
              "netopiaPaymentsOfficialPartner",
              "Partener oficial Netopia Payments"
            )}
          </p>
          <p className="text-xs text-blue-50/80 sm:text-sm">
            {t(
              "netopiaPaymentsDescription",
              "Tranzacții criptate 3D Secure, suport pentru carduri locale și metode alternative de plată mobilPay."
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 py-2 backdrop-blur sm:px-4">
          <Image
            src="/images/checkout/netopia-logo-vertical.svg"
            alt=""
            width={130}
            height={90}
            className="h-12 w-auto max-w-[7.5rem] object-contain sm:h-14"
          />
        </div>
      </div>
    </div>
  );
}
