import * as XLSX from "xlsx";
import portfolio from "./portfolio.json";
export { portfolio };
export const KIDSTORY_ID = "26f5418c-965d-4630-994c-b51947cdec04";
export const KIDSTORY_SYNC_MODE = "kidstory-curated-v1";

export type KidstoryIdentity = { sourceId: string; sku: string; ean: string };
export type KidstoryRow = Record<string, string>;

/** Kidstory publishes availability, not a quantity or a purchase cost. */
export function selectKidstoryProducts(
  rows: KidstoryRow[],
  selection: KidstoryIdentity[]
) {
  for (const field of ["sourceId", "sku", "ean"] as const) {
    if (new Set(selection.map(p => p[field])).size !== selection.length)
      throw new Error(`Duplicate Kidstory selection ${field}`);
  }
  return selection.map(entry => {
    const matches = rows.filter(row => row.id === entry.sourceId);
    const row = matches.length === 1 ? matches[0] : undefined;
    const identityValid =
      !!row && row.sku === entry.sku && row.ean === entry.ean;
    const priceText = row?.base_price?.trim() || "";
    const retailPrice = /^\d+(?:[.,]\d{1,2})?$/.test(priceText)
      ? Number(priceText.replace(",", "."))
      : NaN;
    const availabilityValid =
      (row?.stock_status === "1" && row.stock_status_string === "instock") ||
      (row?.stock_status === "0" && row.stock_status_string === "outofstock");
    const valid =
      identityValid &&
      row?.currency === "RON" &&
      Number.isFinite(retailPrice) &&
      retailPrice > 0 &&
      availabilityValid;
    return {
      entry,
      valid,
      row: row || {},
      retailPrice: valid ? retailPrice : null,
      available: valid && row?.stock_status === "1",
      quantity: null,
      purchaseCost: null,
      error: valid
        ? null
        : `Missing, ambiguous or invalid Kidstory data for ${entry.sku}`,
    };
  });
}

export function parseKidstoryCsv(text: string, selection: KidstoryIdentity[]) {
  if (text.length > 20_000_000)
    throw new Error("Kidstory feed exceeds size limit");
  const workbook = XLSX.read(text, { type: "string", raw: true, FS: "|" });
  const rows = XLSX.utils.sheet_to_json<KidstoryRow>(
    workbook.Sheets[workbook.SheetNames[0]],
    { defval: "", raw: true }
  );
  if (
    !rows.length ||
    ![
      "id",
      "sku",
      "ean",
      "base_price",
      "currency",
      "stock_status",
      "stock_status_string",
    ].every(key => key in rows[0])
  )
    throw new Error("Invalid Kidstory CSV headers or empty feed");
  return selectKidstoryProducts(rows, selection);
}

export function kidstoryContent(row: KidstoryRow) {
  const images = [
    row.file,
    ...Array.from({ length: 9 }, (_, i) => row[`image${i + 2}`]),
  ].filter(Boolean);
  if (
    !row.name?.trim() ||
    !row.description?.trim() ||
    !images.length ||
    images.some(url => !/^https?:\/\//.test(url))
  )
    throw new Error(`Missing or invalid Kidstory content: ${row.sku}`);
  return {
    name: row.name,
    description: row.description,
    images,
    tags: [row.brand_name].filter(Boolean),
    attributes: {
      brand: row.brand_name || "",
      age: row.varsta || "",
      ageRange: row.varsta || "",
      shortDescription: row.short_description || "",
      supplierCategory: row.category_name_concat || row.category_name || "",
      availability: row.disponibilitate || row.stock_status_string,
      inventoryMode: "supplier-availability",
    },
  };
}

export async function fetchKidstoryProducts(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "text/csv,*/*" },
  });
  if (!response.ok) throw new Error(`Kidstory feed HTTP ${response.status}`);
  return parseKidstoryCsv(await response.text(), portfolio);
}
