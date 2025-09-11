"use client";

import React from "react";

type JsonLdProps = {
  data: object | object[] | null | undefined;
};

/**
 * Safely injects page-scoped JSON-LD into the document head/body.
 * Accepts a single object or an array of objects. No-op for falsy/empty data.
 */
export function SeoJsonLd({ data }: JsonLdProps) {
  if (!data) return null;
  const payload = Array.isArray(data) ? data : [data];
  const filtered = payload.filter(Boolean);
  if (filtered.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(filtered.length === 1 ? filtered[0] : filtered),
      }}
    />
  );
}

export default SeoJsonLd;
