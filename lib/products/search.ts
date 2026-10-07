export function normalizeProductSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Romanian diacritics and word order should not hide a matching product. */
export function matchesProductSearch(
  product: { name?: string; description?: string; tags?: string[] },
  query: string
): boolean {
  const haystack = normalizeProductSearch(
    `${product.name ?? ""} ${product.description?.replace(/<[^>]*>/g, " ") ?? ""} ${(product.tags ?? []).join(" ")}`
  );
  return normalizeProductSearch(query)
    .trim()
    .split(/\s+/)
    .every(word => haystack.includes(word));
}
