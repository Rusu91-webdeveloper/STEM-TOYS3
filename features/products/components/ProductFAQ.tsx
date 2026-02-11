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
            className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition hover:border-slate-300"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 outline-none ring-0 transition group-open:text-emerald-700">
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
