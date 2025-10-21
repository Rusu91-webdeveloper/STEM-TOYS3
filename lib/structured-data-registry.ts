type StructuredDataEntry = Record<string, any> | Record<string, any>[] | null;

const structuredDataRegistry = new Map<string, StructuredDataEntry>();

function normalizePath(path: string): string {
  if (!path) return "/";
  try {
    const url = new URL(path, "https://dummy.base");
    path = url.pathname;
  } catch {
    // ignore
  }
  let normalized = path.trim();
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || "/";
}

function getLocalePaths(path: string): string[] {
  const normalized = normalizePath(path);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return ["/"];
  const possibleLocale = segments[0];
  if (possibleLocale.length === 2) {
    const withoutLocale = "/" + segments.slice(1).join("/");
    return [normalized, normalizePath(withoutLocale)];
  }
  return [normalized];
}

export function registerStructuredData(
  path: string | undefined,
  data: StructuredDataEntry
) {
  if (!path || !data) return;
  structuredDataRegistry.set(normalizePath(path), data);
}

export function registerStructuredDataVariants(
  basePath: string | undefined,
  locales: string[],
  data: StructuredDataEntry
) {
  if (!basePath || !data) return;
  registerStructuredData(basePath, data);
  const normalizedBase = normalizePath(basePath);
  locales.forEach(locale => {
    if (!locale) return;
    const localized =
      locale === "ro"
        ? normalizedBase
        : normalizePath(`/${locale}${normalizedBase}`);
    registerStructuredData(localized, data);
  });
}

export function getStructuredDataForPath(path?: string): StructuredDataEntry {
  if (!path) return null;
  const normalized = normalizePath(path);
  if (structuredDataRegistry.has(normalized)) {
    return structuredDataRegistry.get(normalized) ?? null;
  }
  for (const variant of getLocalePaths(normalized)) {
    if (structuredDataRegistry.has(variant)) {
      return structuredDataRegistry.get(variant) ?? null;
    }
  }
  return null;
}

