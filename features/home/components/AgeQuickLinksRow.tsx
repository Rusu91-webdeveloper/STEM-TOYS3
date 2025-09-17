"use client";

import React from "react";
import { trackEvent as gaTrackEvent } from "@/lib/analytics/ga4";
import Link from "next/link";

interface AgeQuickLinksRowProps {
  t: (key: string, defaultValue?: string) => string;
}

const AGE_LINKS: Array<{
  id:
    | "PRESCHOOL_3_5"
    | "ELEMENTARY_6_8"
    | "MIDDLE_SCHOOL_9_12"
    | "TEENS_13_PLUS";
  labelKey: string;
  short: string;
  icon: string;
  accent: string;
}> = [
  {
    id: "PRESCHOOL_3_5",
    labelKey: "age3to5H2",
    short: "3–5",
    icon: "🐣",
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "ELEMENTARY_6_8",
    labelKey: "age6to8H2",
    short: "6–8",
    icon: "🎒",
    accent: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "MIDDLE_SCHOOL_9_12",
    labelKey: "age9to12H2",
    short: "9–12",
    icon: "🧠",
    accent: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    id: "TEENS_13_PLUS",
    labelKey: "age13plusH2",
    short: "13+",
    icon: "🚀",
    accent: "bg-amber-100 text-amber-700",
  },
];

export default function AgeQuickLinksRow({ t }: AgeQuickLinksRowProps) {
  return (
    <section aria-label="Age quick links" className="w-full">
      <h4 className="text-xs text-gray-500 font-medium mb-2 text-center">
        {t("findPerfectToysForAge", "Find Perfect Toys for Your Child's Age")}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {AGE_LINKS.map(link => (
          <Link
            key={link.id}
            href={`/products?ageGroup=${encodeURIComponent(link.id)}`}
            aria-label={`${t(link.labelKey)} (${link.short})`}
            className="group flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200"
            onClick={() =>
              gaTrackEvent("age_quick_link_click", {
                age_group: link.id,
              })
            }
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${link.accent}`}
              aria-hidden
            >
              <span className="text-base">{link.icon}</span>
            </div>
            <div className="min-w-0 flex-grow">
              <div className="text-xs font-semibold text-gray-900 truncate">
                {t(link.labelKey)}
              </div>
              <div className="text-[10px] text-gray-500">
                {link.short} {t("years", "yrs")}
              </div>
            </div>
            <svg
              className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
