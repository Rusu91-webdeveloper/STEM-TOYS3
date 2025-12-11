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
    stock: mapping.stock || mapping.Stock || mapping.quantity,
    images: mapping.images || mapping.Images,
    currency: mapping.currency || mapping.Currency,
    categoryPath: mapping.categoryPath || mapping.CategoryPath,
  };
}

function parseImages(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  const raw = String(value);
  return raw.split(/[|,;]/).map(v => v.trim()).filter(Boolean);
}

function mapRecordToItem(
  record: Record<string, any>,
  mapping: FieldMapping,
  fallbackCurrency?: string
): ProductFeedItem | null {
  const supplierSku = mapping.sku
    ? String(record[mapping.sku] ?? "").trim()
    : "";

  if (!supplierSku) {
    return null;
  }

  const priceValue = mapping.price
    ? Number(record[mapping.price] ?? 0)
    : undefined;
  const stockValue = mapping.stock
    ? Number(record[mapping.stock] ?? 0)
    : undefined;

  return {
    supplierSku,
    name: mapping.name ? String(record[mapping.name] ?? "") : undefined,
    description: mapping.description
      ? String(record[mapping.description] ?? "")
      : undefined,
    price: Number.isFinite(priceValue) ? priceValue : undefined,
    currency:
      (mapping.currency
        ? String(record[mapping.currency] ?? fallbackCurrency ?? "")
        : fallbackCurrency) || undefined,
    stock: Number.isFinite(stockValue) ? stockValue : undefined,
    images: mapping.images ? parseImages(record[mapping.images]) : [],
    categoryPath: mapping.categoryPath
      ? parseImages(record[mapping.categoryPath])
      : [],
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

  return {
    type: SupplierFeedType.CSV,
    async fetchProducts() {
      if (!feed.sourceUrl) return [];

      const headers = applyAuthHeaders(getAuthConfig(feed));
      const response = await fetch(feed.sourceUrl, { headers });

      if (!response.ok) {
        throw new Error(
          `CSV download failed (${response.status} ${response.statusText})`
        );
      }

      const text = await response.text();
      const workbook = XLSX.read(text, { type: "string" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) return [];

      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(
        workbook.Sheets[firstSheet],
        { defval: "" }
      );

      return rows
        .map(row => mapRecordToItem(row, resolvedMapping, currency))
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
