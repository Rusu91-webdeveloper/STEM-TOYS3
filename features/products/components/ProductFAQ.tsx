"use client";

import React from "react";

import {
  productBodyTextClass,
  productMutedTextClass,
  productSubSectionCardClass,
  productTitleClass,
} from "./productTheme";

type ProductFAQProps = {
  faq: Array<{ question: string; answer: string }> | undefined;
};

export default function ProductFAQ({ faq }: ProductFAQProps) {
  const items = Array.isArray(faq)
    ? faq.filter(q => q && q.question && q.answer)
    : [];
  if (items.length === 0) return null;

  return (
    <div className={`${productSubSectionCardClass} space-y-4`}>
      <h3 className={productTitleClass}>FAQ</h3>
      <div className="space-y-3">
        {items.map((q, idx) => (
          <details
            key={idx}
            className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 transition hover:border-white/20"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100 outline-none ring-0 transition group-open:text-emerald-300">
              {q.question}
            </summary>
            <div
              className={`mt-2 whitespace-pre-line text-sm ${productMutedTextClass}`}
            >
              {q.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
