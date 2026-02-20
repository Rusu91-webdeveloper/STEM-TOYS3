"use client";

import React from "react";

import { glassCardClass } from "@/features/home/components/homeTheme";
import {
  HOMEPAGE_CONVERSION_EVENTS,
  trackHomepageConversionEvent,
} from "@/lib/analytics/homepage-conversion-events";

interface TrustBadgesRowProps {
  t: (key: string, defaultValue?: string) => string;
}

export default function TrustBadgesRow({ t }: TrustBadgesRowProps) {
  const items: Array<{ icon: string; label: string }> = [
    { icon: "⭐", label: t("fourNineStars", "4.9/5 din recenzii reale") },
    { icon: "🎯", label: t("trustAgeFit", "Recomandări pe vârstă") },
    { icon: "📦", label: t("trustBundleSavings", "Pachete cu economii clare") },
    { icon: "🔒", label: t("secureCheckout", "Plată securizată") },
    { icon: "🚚", label: t("fastDelivery", "Livrare rapidă în România") },
  ];

  return (
    <div aria-label="Trust badges" className="w-full">
      <h4 className="mb-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-emerald-200 sm:mb-3 sm:text-sm">
        {t("trustBadgesHeading", "De ce cumpără părinții de la noi")}
      </h4>
      <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
        {items.map((item, idx) => (
          <li key={idx}>
            <button
              type="button"
              aria-label={item.label}
              className={`${glassCardClass} flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-100 transition hover:border-emerald-400/60 hover:shadow-emerald-500/20 sm:px-4 sm:py-2.5 sm:text-sm`}
              data-conversion="cta"
              data-conversion-type="click"
              data-conversion-category="engagement"
              data-conversion-action="trust_badge_click"
              data-conversion-element={`trust_badge_${idx + 1}`}
              data-conversion-metadata={JSON.stringify({
                badgeLabel: item.label,
              })}
              onClick={() =>
                trackHomepageConversionEvent(
                  HOMEPAGE_CONVERSION_EVENTS.TRUST_BADGE_CLICK,
                  {
                    badge_label: item.label,
                  }
                )
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
