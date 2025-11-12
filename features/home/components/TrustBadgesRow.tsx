"use client";

import React from "react";
import { trackEvent as gaTrackEvent } from "@/lib/analytics/ga4";
import { glassCardClass } from "@/features/home/components/homeTheme";

interface TrustBadgesRowProps {
  t: (key: string, defaultValue?: string) => string;
}

export default function TrustBadgesRow({ t }: TrustBadgesRowProps) {
  const items: Array<{ icon: string; label: string }> = [
    { icon: "🔒", label: t("secureCheckout", "Secure Checkout") },
    { icon: "⭐", label: t("fourNineStars", "4.9/5 Reviews") },
    { icon: "🚚", label: t("fastDelivery", "Fast Delivery") },
  ];

  return (
    <div aria-label="Trust badges" className="w-full">
      <h4 className="mb-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-emerald-200 sm:mb-3 sm:text-sm">
        {t("trustBadgesHeading", "Why customers trust us")}
      </h4>
      <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
        {items.map((item, idx) => (
          <li key={idx}>
            <button
              type="button"
              aria-label={item.label}
              className={`${glassCardClass} flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-100 transition hover:border-emerald-400/60 hover:shadow-emerald-500/20 sm:px-4 sm:py-2.5 sm:text-sm`}
              onClick={() =>
                gaTrackEvent("trust_badge_click", { label: item.label })
              }
            >
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/60 via-sky-400/60 to-indigo-400/60 text-sm sm:h-9 sm:w-9 sm:text-lg"
              >
                {item.icon}
              </span>
              <span className="text-left">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
