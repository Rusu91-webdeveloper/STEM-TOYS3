/**
 * Customer-facing product URL segment.
 *
 * A stored slug may contain "/" (the Navir gyroscope is
 * `giroscop-navir-N_6010/CB`). That character splits the path, so it never
 * matches `/products/[slug]`. Publish those slugs with hyphens instead.
 */
export function toPublicProductSlug(slug: string): string {
  let value = slug.trim();

  try {
    value = decodeURIComponent(value);
  } catch {
    // Leave malformed escape sequences unchanged.
  }

  return value.replace(/\//g, "-").replace(/%2f/gi, "-").toLowerCase().trim();
}

export function productPublicPath(slug: string): string {
  return `/products/${toPublicProductSlug(slug)}`;
}

export type PublicCatalogRecord =
  | { kind: "product"; isActive: boolean; status: string }
  | { kind: "book"; isActive: boolean };

/**
 * Whether `/products/[slug]` should render or return HTTP 404.
 * The database record decides. There is no hard-coded slug blocklist.
 */
export function resolveProductPageDecision(
  record: PublicCatalogRecord | null
): "render" | "not-found" {
  if (record === null) {
    return "not-found";
  }

  switch (record.kind) {
    case "product":
      return record.isActive && record.status === "APPROVED"
        ? "render"
        : "not-found";
    case "book":
      return record.isActive ? "render" : "not-found";
    default: {
      const _exhaustive: never = record;
      return _exhaustive;
    }
  }
}
