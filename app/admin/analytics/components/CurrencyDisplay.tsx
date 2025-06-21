"use client";

import { useCurrency } from "@/lib/currency";

export function CurrencyDisplay({ value }: { value: number }) {
  const { formatPrice } = useCurrency();
  return <>{formatPrice(value)}</>;
}
