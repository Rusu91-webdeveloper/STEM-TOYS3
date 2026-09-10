import * as XLSX from "xlsx";
import portfolio from "./portfolio.json";

export const BORIBON_ID = "ee75eea8-9f64-4076-96a2-52f5d6926c14";
export const BORIBON_SYNC_MODE = "boribon-curated-v1";
export const BORIBON_FEED_URL =
  "https://www.boribon.ro/feed/products/6b4ddf7503cbf24a7fe711636e57d127";
export const BORIBON_MAX_AGE_MS = 14 * 60 * 60 * 1000;
export { portfolio };
export type BoribonRow = Record<string, string>;

function number(value: string | undefined): number | null {
  if (!value?.trim() || !/^\d+(?:[.,]\d+)?$/.test(value.trim())) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function selectBoribonProducts(rows: BoribonRow[]) {
  return portfolio.map(entry => {
    // A model can be reused for different products. Require ID, EAN and model.
    const matches = rows.filter(row => String(row.id) === entry.sourceId);
    const row = matches.length === 1 ? matches[0] : undefined;
    const identityValid =
      row && row.model?.trim() === entry.model && row.sku?.trim() === entry.ean;
    const price = identityValid ? number(row.price_b2c) : null;
    const quantity = identityValid ? number(row.quantity) : null;
    const valid = Boolean(
      identityValid &&
        price !== null &&
        price > 0 &&
        quantity !== null &&
        Number.isSafeInteger(quantity)
    );
    return {
      entry,
      row: row || {},
      price,
      stock: valid ? quantity! : 0,
      valid,
      error: valid
        ? null
        : `Missing, ambiguous or invalid supplier data for ${entry.model}`,
    };
  });
}

export async function fetchBoribonProducts() {
  const response = await fetch(BORIBON_FEED_URL, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "text/csv,*/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Boribon feed HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 20_000_000)
    throw new Error("Boribon feed exceeds size limit");
  return parseBoribonCsv(text);
}

export function parseBoribonCsv(text: string) {
  const workbook = XLSX.read(text, { type: "string", raw: true });
  const rows = XLSX.utils.sheet_to_json<BoribonRow>(
    workbook.Sheets[workbook.SheetNames[0]],
    { defval: "", raw: true }
  );
  if (
    !rows.length ||
    !["id", "model", "sku", "price_b2c", "quantity"].every(
      key => key in rows[0]
    )
  ) {
    throw new Error("Invalid Boribon CSV headers or empty feed");
  }
  return selectBoribonProducts(rows);
}

export function boribonStockIsFresh(
  lastSyncAt: Date | string | null | undefined,
  now = Date.now()
) {
  const timestamp = lastSyncAt ? new Date(lastSyncAt).getTime() : NaN;
  return (
    Number.isFinite(timestamp) &&
    timestamp <= now &&
    now - timestamp < BORIBON_MAX_AGE_MS
  );
}

export function isCuratedBoribon(supplierId: string | null, metadata: unknown) {
  return (
    supplierId === BORIBON_ID &&
    typeof metadata === "object" &&
    metadata !== null &&
    "boribon" in metadata
  );
}
