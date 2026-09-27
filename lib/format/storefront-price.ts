const leiAmount = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Shopper-facing price. Machine values (JSON-LD, Stripe, Netopia) stay numeric.
 * Example: 168 -> "168,00 lei".
 */
export function formatStorefrontPrice(price: number): string {
  const amount = Number.isFinite(price) ? price : 0;
  return `${leiAmount.format(amount)} lei`;
}
