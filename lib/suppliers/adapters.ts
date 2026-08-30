import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import {
  SupplierAuthType,
  SupplierFeed,
  SupplierFeedType,
} from "@prisma/client";
import * as XLSX from "xlsx";

import {
  FieldMapping,
  ProductFeedItem,
  SupplierAuthConfig,
  SupplierConnector,
  applyAuthHeaders,
} from "@/lib/suppliers/types";

type ConnectorInit = {
  feed: SupplierFeed;
  mapping: FieldMapping;
};

function normalizeMapping(raw: unknown): FieldMapping {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const mapping = raw as Record<string, any>;
  return {
    sku: mapping.sku || mapping.SKU || mapping.Sku,
    name: mapping.name || mapping.title || mapping.Name,
    description: mapping.description || mapping.Description,
    price: mapping.price || mapping.Price,
    cost: mapping.cost || mapping.costPrice || mapping.cogs || mapping.supplierPrice,
    vat: mapping.vat || mapping.VAT || mapping.TVA,
    costVatMode: mapping.costVatMode || mapping.cost_vat_mode,
    costLookupFile: mapping.costLookupFile || mapping.cost_lookup_file,
    costLookupSku: mapping.costLookupSku || mapping.cost_lookup_sku,
    costLookupCost: mapping.costLookupCost || mapping.cost_lookup_cost,
    costLookupDiscount:
      mapping.costLookupDiscount ||
      mapping.cost_lookup_discount ||
      mapping.discount_lookup_field,
    lookupMergeMode: mapping.lookupMergeMode || mapping.lookup_merge_mode,
    lookupMergeOverrideFields: Array.isArray(mapping.lookupMergeOverrideFields)
      ? mapping.lookupMergeOverrideFields
      : Array.isArray(mapping.lookup_merge_override_fields)
        ? mapping.lookup_merge_override_fields
        : undefined,
    requiredFields: Array.isArray(mapping.requiredFields)
      ? mapping.requiredFields
      : Array.isArray(mapping.required_fields)
        ? mapping.required_fields
        : undefined,
    enforceAllowedSkus:
      typeof mapping.enforceAllowedSkus === "boolean"
        ? mapping.enforceAllowedSkus
        : typeof mapping.enforce_allowed_skus === "boolean"
          ? mapping.enforce_allowed_skus
          : undefined,
    discountFloorPct:
      typeof mapping.discountFloorPct === "number"
        ? mapping.discountFloorPct
        : typeof mapping.discountFloorPct === "string"
          ? Number(mapping.discountFloorPct)
          : undefined,
    overrideMarginPct:
      typeof mapping.overrideMarginPct === "number"
        ? mapping.overrideMarginPct
        : typeof mapping.overrideMarginPct === "string"
          ? Number(mapping.overrideMarginPct)
          : undefined,
    retailPrice:
      mapping.retailPrice ||
      mapping.retail ||
      mapping.priceRetail ||
      mapping.retail_price,
    discountPct:
      mapping.discountPct || mapping.discount || mapping.discount_pct,
    zeroDiscountMargin:
      typeof mapping.zeroDiscountMargin === "number"
        ? mapping.zeroDiscountMargin
        : typeof mapping.zeroDiscountMargin === "string"
          ? Number(mapping.zeroDiscountMargin)
          : undefined,
    zeroDiscountValue:
      mapping.zeroDiscountValue || mapping.zeroDiscountEquals || undefined,
    stock: mapping.stock || mapping.Stock || mapping.quantity,
    images: mapping.images || mapping.Images,
    currency: mapping.currency || mapping.Currency,
    categoryPath: mapping.categoryPath || mapping.CategoryPath,
    rowFilterField: mapping.rowFilterField || mapping.row_filter_field,
    rowFilterValues: Array.isArray(mapping.rowFilterValues)
      ? mapping.rowFilterValues
      : Array.isArray(mapping.row_filter_values)
        ? mapping.row_filter_values
        : undefined,
    allowedSkus: Array.isArray(mapping.allowedSkus) ? mapping.allowedSkus : undefined,
    blockedSkus: Array.isArray(mapping.blockedSkus) ? mapping.blockedSkus : undefined,
    autoCreateProducts:
      typeof mapping.autoCreateProducts === "boolean"
        ? mapping.autoCreateProducts
        : typeof mapping.auto_create_products === "boolean"
          ? mapping.auto_create_products
          : undefined,
    authoritativeForMissingStock:
      typeof mapping.authoritativeForMissingStock === "boolean"
        ? mapping.authoritativeForMissingStock
        : typeof mapping.authoritative_for_missing_stock === "boolean"
          ? mapping.authoritative_for_missing_stock
          : undefined,
    minimumExpectedItems:
      typeof mapping.minimumExpectedItems === "number"
        ? mapping.minimumExpectedItems
        : typeof mapping.minimum_expected_items === "number"
          ? mapping.minimum_expected_items
          : undefined,
  };
}

function buildCostLookup(
  filePath: string,
  skuField: string,
  costField: string,
  discountField?: string
): Map<string, { cost?: number; discountPct?: number; row?: Record<string, any> }> {
  const lookup = new Map<string, { cost?: number; discountPct?: number; row?: Record<string, any> }>();
  if (!fs.existsSync(filePath)) return lookup;
  const text = fs.readFileSync(filePath, "utf-8");
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const usePipeDelimiter =
    firstLine.includes("|") && !firstLine.includes(",");

  const rows = usePipeDelimiter
    ? parseDelimitedText(text, "|")
    : (() => {
        const workbook = XLSX.read(text, { type: "string" });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) return [];
        return XLSX.utils.sheet_to_json<Record<string, any>>(
          workbook.Sheets[firstSheet],
          { defval: "" }
        );
      })();

  for (const row of rows) {
    const sku = String(row[skuField] ?? "").trim();
    const cost = parseNumber(row[costField]);
    const discountPct = discountField
      ? parseDiscountPct(row[discountField])
      : undefined;
    if (!sku || (cost === undefined && discountPct === undefined)) continue;
    lookup.set(sku, {
      cost: cost !== undefined && cost > 0 ? cost : undefined,
      discountPct,
      row,
    });
  }

  return lookup;
}

function parseImages(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  const raw = String(value);
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(v => String(v).trim()).filter(Boolean);
      }
    } catch {
      // Fall back to delimiter parsing for malformed input.
    }
  }
  return raw.split(/[|,;]/).map(v => v.trim()).filter(Boolean);
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseVat(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseMargin(value: unknown): number | undefined {
  const parsed = parseNumber(value);
  if (parsed === undefined) return undefined;
  if (parsed <= 1) return parsed;
  return parsed / 100;
}

function parseDiscountPct(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  if (text === "") return false;
  if (text === "0" || text === "0.0" || text === "0.00") return false;
  return true;
}

function mergeLookupAttributes(
  feedRow: Record<string, any>,
  lookupRow: Record<string, any>,
  overrideFields: string[]
): Record<string, any> {
  const merged: Record<string, any> = { ...feedRow };
  const overrideSet = new Set(overrideFields);

  for (const [key, value] of Object.entries(lookupRow)) {
    if (overrideSet.has(key)) continue;
    if (hasValue(value)) {
      merged[key] = value;
    }
  }

  for (const field of overrideFields) {
    if (hasValue(feedRow[field])) {
      merged[field] = feedRow[field];
    } else if (hasValue(lookupRow[field])) {
      merged[field] = lookupRow[field];
    }
  }

  return merged;
}

function parseDelimitedText(
  text: string,
  delimiter: string
): Record<string, any>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      row.push(currentVal);
      currentVal = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(currentVal);
      rows.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal);
    rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1).filter(r =>
    r.some(cell => String(cell).trim() !== "")
  );

  return dataRows.map(cols => {
    const record: Record<string, any> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      record[header] = (cols[idx] ?? "").trim();
    });
    return record;
  });
}

function resolveMappedValues(
  record: Record<string, any>,
  field?: string | string[]
): unknown[] {
  if (!field) return [];
  const fields = Array.isArray(field) ? field : [field];
  return fields
    .map(key => record[key])
    .filter(value => value !== undefined && value !== null && String(value).trim() !== "");
}

function mapRecordToItem(
  record: Record<string, any>,
  mapping: FieldMapping,
  fallbackCurrency?: string
): ProductFeedItem | null {
  const skuValues = resolveMappedValues(record, mapping.sku);
  const supplierSku = skuValues.length
    ? String(skuValues[0] ?? "").trim()
    : "";

  if (!supplierSku) {
    return null;
  }

  const priceValue = mapping.price
    ? parseNumber(record[mapping.price])
    : undefined;
  let costValue = mapping.cost
    ? parseNumber(record[mapping.cost])
    : undefined;
  const retailValue = mapping.retailPrice
    ? parseNumber(record[mapping.retailPrice])
    : undefined;
  const stockValue = mapping.stock
    ? parseNumber(record[mapping.stock])
    : undefined;

  const imageValues = resolveMappedValues(record, mapping.images);
  const categoryValues = resolveMappedValues(record, mapping.categoryPath);

  const vatValue = mapping.vat ? parseVat(record[mapping.vat]) : undefined;
  const costVatMode = mapping.costVatMode?.toString().toLowerCase();
  if (
    costValue !== undefined &&
    vatValue !== undefined &&
    costVatMode === "net"
  ) {
    costValue = Math.round(costValue * (1 + vatValue / 100) * 100) / 100;
  }

  const resolvedRetailPrice = retailValue;

  return {
    supplierSku,
    name: mapping.name ? String(record[mapping.name] ?? "") : undefined,
    description: mapping.description
      ? String(record[mapping.description] ?? "")
      : undefined,
    price: Number.isFinite(priceValue ?? NaN) ? priceValue : undefined,
    cost: Number.isFinite(costValue ?? NaN) ? costValue : undefined,
    retailPrice: Number.isFinite(resolvedRetailPrice ?? NaN)
      ? resolvedRetailPrice
      : undefined,
    currency:
      (mapping.currency
        ? String(record[mapping.currency] ?? fallbackCurrency ?? "")
        : fallbackCurrency) || undefined,
    stock: Number.isFinite(stockValue ?? NaN) ? stockValue : undefined,
    images: imageValues.flatMap(value => parseImages(value)),
    categoryPath: categoryValues.flatMap(value => parseImages(value)),
    attributes: record,
    raw: record,
  };
}

export function createBaseLinkerCsvAdapter({
  feed,
  mapping,
}: ConnectorInit): SupplierConnector {
  const resolvedMapping = normalizeMapping(mapping);
  const currency = resolvedMapping.currency || "RON";
  const rowFilterValues = new Set(
    (resolvedMapping.rowFilterValues ?? [])
      .map(value => String(value).trim())
      .filter(Boolean)
  );

  return {
    type: SupplierFeedType.CSV,
    async fetchProducts() {
      if (!feed.sourceUrl) return [];

      const sourceUrl = feed.sourceUrl;
      let text = "";

      if (sourceUrl.startsWith("file://")) {
        const filePath = fileURLToPath(sourceUrl);
        text = fs.readFileSync(filePath, "utf-8");
      } else {
        const resolvedPath = path.isAbsolute(sourceUrl)
          ? sourceUrl
          : path.resolve(process.cwd(), sourceUrl);

        if (fs.existsSync(resolvedPath)) {
          text = fs.readFileSync(resolvedPath, "utf-8");
        } else {
          const headers = applyAuthHeaders(getAuthConfig(feed));
          const response = await fetch(sourceUrl, { headers });

          if (!response.ok) {
            throw new Error(
              `CSV download failed (${response.status} ${response.statusText})`
            );
          }
          text = await response.text();
        }
      }
      const firstLine = text.split(/\r?\n/, 1)[0] || "";
      const usePipeDelimiter =
        firstLine.includes("|") && !firstLine.includes(",");

      const rows = usePipeDelimiter
        ? parseDelimitedText(text, "|")
        : (() => {
            const workbook = XLSX.read(text, { type: "string" });
            const firstSheet = workbook.SheetNames[0];
            if (!firstSheet) return [];
            return XLSX.utils.sheet_to_json<Record<string, any>>(
              workbook.Sheets[firstSheet],
              { defval: "" }
            );
          })();

      let costLookup: Map<
        string,
        { cost?: number; discountPct?: number; row?: Record<string, any> }
      > | null = null;
      if (resolvedMapping.costLookupFile) {
        const lookupPath = path.isAbsolute(resolvedMapping.costLookupFile)
          ? resolvedMapping.costLookupFile
          : path.resolve(process.cwd(), resolvedMapping.costLookupFile);
        costLookup = buildCostLookup(
          lookupPath,
          resolvedMapping.costLookupSku || "sku",
          resolvedMapping.costLookupCost || "b2b_price_gross_RON",
          resolvedMapping.costLookupDiscount || "discount_pct"
        );
      }

      const filteredRows =
        resolvedMapping.rowFilterField && rowFilterValues.size > 0
          ? rows.filter(
              row =>
                rowFilterValues.has(
                  String(row[resolvedMapping.rowFilterField as string] ?? "").trim()
                )
            )
          : rows;

      return filteredRows
        .map(row => mapRecordToItem(row, resolvedMapping, currency))
        .map(item => {
          if (!item) return item;
          const lookup = costLookup?.get(item.supplierSku);

          if (lookup?.cost !== undefined && (item.cost ?? 0) <= 0) {
            item.cost = lookup.cost;
          }

          if (
            lookup?.row &&
            resolvedMapping.retailPrice &&
            (!Number.isFinite(item.retailPrice ?? NaN) ||
              (item.retailPrice ?? 0) <= 0)
          ) {
            const lookupRetail = parseNumber(
              lookup.row[resolvedMapping.retailPrice]
            );
            if (lookupRetail !== undefined && lookupRetail > 0) {
              item.retailPrice = lookupRetail;
            }
          }

          if (
            lookup?.row &&
            resolvedMapping.images &&
            (!item.images || item.images.length === 0)
          ) {
            const imageFields = Array.isArray(resolvedMapping.images)
              ? resolvedMapping.images
              : [resolvedMapping.images];
            const imagesFromLookup = imageFields.flatMap(field =>
              parseImages(lookup.row?.[field])
            );
            if (imagesFromLookup.length > 0) {
              item.images = imagesFromLookup;
            }
          }

          const discountFromFeed = resolvedMapping.discountPct
            ? item.attributes?.[resolvedMapping.discountPct]
            : undefined;
          const discountPct =
            parseDiscountPct(discountFromFeed) ?? lookup?.discountPct;

          const floorPct = parseNumber(resolvedMapping.discountFloorPct);
          const overrideMarginPct = parseMargin(
            resolvedMapping.overrideMarginPct
          );
          const zeroDiscountValue = resolvedMapping.zeroDiscountValue ?? "0%";
          const zeroDiscountMargin = parseMargin(
            resolvedMapping.zeroDiscountMargin
          );

          const baseCost =
            Number.isFinite(item.cost ?? NaN)
              ? (item.cost as number)
              : Number.isFinite(item.price ?? NaN)
                ? (item.price as number)
                : undefined;

          if (baseCost && baseCost > 0) {
            if (
              floorPct !== undefined &&
              discountPct !== undefined &&
              discountPct < floorPct &&
              overrideMarginPct !== undefined
            ) {
              item.retailPrice =
                Math.round((baseCost / (1 - overrideMarginPct)) * 100) / 100;
            } else if (
              zeroDiscountMargin !== undefined &&
              String(discountFromFeed ?? "").trim() === zeroDiscountValue
            ) {
              item.retailPrice =
                Math.round((baseCost / (1 - zeroDiscountMargin)) * 100) / 100;
            }
          }

          if (
            lookup?.row &&
            resolvedMapping.lookupMergeMode === "lookup-preferred"
          ) {
            const overrideFields =
              resolvedMapping.lookupMergeOverrideFields ?? [];
            item.attributes = mergeLookupAttributes(
              item.attributes ?? {},
              lookup.row,
              overrideFields
            );
          }
          return item;
        })
        .filter((item): item is ProductFeedItem => !!item);
    },
  };
}

export function createBaseLinkerXmlAdapter({
  feed,
  mapping,
}: ConnectorInit): SupplierConnector {
  // Placeholder: add fast-xml-parser or similar when the XML contract is known
  const resolvedMapping = normalizeMapping(mapping);

  return {
    type: SupplierFeedType.XML,
    async fetchProducts() {
      console.warn(
        `[supplier][${feed.id}] XML adapter is stubbed. Add XML parsing once the feed structure is confirmed. Current mapping keys: ${Object.keys(resolvedMapping)
          .filter(Boolean)
          .join(", ")}`
      );
      return Promise.resolve<ProductFeedItem[]>(
        resolvedMapping && feed.sourceUrl ? [] : []
      );
    },
  };
}

export function createGenericApiAdapter({
  feed,
  mapping,
}: ConnectorInit): SupplierConnector {
  const resolvedMapping = normalizeMapping(mapping);
  const currency = resolvedMapping.currency || "RON";

  return {
    type: SupplierFeedType.API,
    async fetchProducts() {
      if (!feed.sourceUrl) return [];

      const headers = applyAuthHeaders(getAuthConfig(feed));
      const response = await fetch(feed.sourceUrl, { headers });

      if (!response.ok) {
        throw new Error(
          `API fetch failed (${response.status} ${response.statusText})`
        );
      }

      const payload = await response.json();
      const records: Record<string, any>[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.products)
            ? payload.products
            : [];

      return records
        .map(record => mapRecordToItem(record, resolvedMapping, currency))
        .filter((item): item is ProductFeedItem => !!item);
    },
  };
}

export function createAppAdapter({
  feed,
  mapping,
}: ConnectorInit): SupplierConnector {
  // Placeholder for Shopify/Woo/Wix app bridge connectors
  const resolvedMapping = normalizeMapping(mapping);

  return {
    type: SupplierFeedType.APP,
    async fetchProducts() {
      console.warn(
        `[supplier][${feed.id}] App adapter is stubbed. Wire the platform API once available. Current mapping keys: ${Object.keys(
          resolvedMapping
        )
          .filter(Boolean)
          .join(", ")}`
      );
      return Promise.resolve<ProductFeedItem[]>([]);
    },
  };
}

function getAuthConfig(feed: SupplierFeed): SupplierAuthConfig | undefined {
  if (!feed.authType || feed.authType === SupplierAuthType.NONE) {
    return undefined;
  }

  if (feed.authType === SupplierAuthType.API_KEY) {
    return {
      type: SupplierAuthType.API_KEY,
      apiKey: feed.apiKey ?? undefined,
      headerName: feed.authHeader ?? undefined,
    };
  }

  if (feed.authType === SupplierAuthType.BEARER) {
    return {
      type: SupplierAuthType.BEARER,
      token: feed.apiKey ?? undefined,
    };
  }

  if (feed.authType === SupplierAuthType.BASIC) {
    return {
      type: SupplierAuthType.BASIC,
      username: feed.username ?? undefined,
      password: feed.password ?? undefined,
    };
  }

  return undefined;
}
