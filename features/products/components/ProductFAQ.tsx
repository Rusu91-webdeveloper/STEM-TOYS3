"use client";

import React from "react";

type ProductFAQProps = {
  faq: Array<{ question: string; answer: string }> | undefined;
};

export default function ProductFAQ({ faq }: ProductFAQProps) {
  const items = Array.isArray(faq)
    ? faq.filter(q => q && q.question && q.answer)
    : [];
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">FAQ</h3>
      <div className="space-y-2">
        {items.map((q, idx) => (
          <details key={idx} className="group rounded-md border px-3 py-2">
            <summary className="cursor-pointer list-none text-sm font-medium text-gray-900">
              {q.question}
            </summary>
            <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
              {q.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
