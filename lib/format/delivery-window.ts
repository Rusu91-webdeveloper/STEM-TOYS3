/** Turn courier codes such as "24-72h" into the Romanian shopper label. */
export function formatDeliveryWindow(
  value: string,
  locale: "ro" | "en" = "ro"
): string {
  const trimmed = value.trim();
  const range = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)\s*h$/i);
  if (range) {
    return locale === "ro"
      ? `${range[1]}–${range[2]} h`
      : `${range[1]}-${range[2]}h`;
  }
  const single = trimmed.match(/^(\d+)\s*h$/i);
  if (single) {
    return locale === "ro" ? `${single[1]} h` : `${single[1]}h`;
  }
  return trimmed;
}
