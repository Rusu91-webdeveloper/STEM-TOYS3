const STATIC_SEED_PATH = "/supplier-feeds/enhanced_v7_clean.csv";

export function isStaticSeedSource(sourceUrl: string | null | undefined) {
  if (!sourceUrl) return false;

  try {
    return new URL(sourceUrl, "https://www.techtots.ro").pathname.endsWith(
      STATIC_SEED_PATH
    );
  } catch {
    return sourceUrl.split("?")[0]?.endsWith(STATIC_SEED_PATH) ?? false;
  }
}

export function assertLiveInventorySource(
  sourceUrl: string | null | undefined
) {
  if (isStaticSeedSource(sourceUrl)) {
    throw new Error(
      "Static seed snapshots must remain inactive and cannot run as recurring supplier inventory feeds."
    );
  }
}
