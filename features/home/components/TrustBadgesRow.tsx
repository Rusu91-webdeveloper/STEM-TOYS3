"use client";

import React from "react";
import { trackEvent as gaTrackEvent } from "@/lib/analytics/ga4";

interface TrustBadgesRowProps {
  t: (key: string, defaultValue?: string) => string;
}

export default function TrustBadgesRow({ t }: TrustBadgesRowProps) {
  const items: Array<{ icon: string; label: string }> = [
    { icon: "🔒", label: t("secureCheckout", "Secure Checkout") },
    { icon: "⭐", label: t("fourNineStars", "4.9/5 Reviews") },
    { icon: "🛡️", label: t("thirtyDayGuarantee", "30-Day Guarantee") },
  ];

  return (
    <div aria-label="Trust badges" className="w-full">
      <h4 className="text-xs text-gray-500 font-medium mb-2 text-center">
        {t("trustBadgesHeading", "Why customers trust us")}
      </h4>
      <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {items.map((item, idx) => (
          <li key={idx}>
            <button
              type="button"
              aria-label={item.label}
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              onClick={() =>
                gaTrackEvent("trust_badge_click", { label: item.label })
              }
            >
              <span aria-hidden className="text-base sm:text-lg">
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
