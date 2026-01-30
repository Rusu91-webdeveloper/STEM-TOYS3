import { SupplierAuthType, SupplierFeedType } from "@prisma/client";

export type FieldMapping = {
  sku?: string;
  name?: string;
  description?: string;
  price?: string;
  stock?: string;
  images?: string | string[];
  currency?: string;
  categoryPath?: string | string[];
  allowedSkus?: string[];
  blockedSkus?: string[];
};

export type SupplierAuthConfig = {
  type: SupplierAuthType;
  apiKey?: string;
  headerName?: string;
  token?: string;
  username?: string;
  password?: string;
};

export type ProductFeedItem = {
  supplierSku: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  stock?: number;
  images?: string[];
  categoryPath?: string[];
  attributes?: Record<string, string | number | boolean | null>;
  raw?: Record<string, any>;
};

export type SyncResult = {
  imported: number;
  updated: number;
  failed: number;
  errors?: string[];
};

export type OrderPushPayload = {
  orderId: string;
  externalOrderId?: string;
  lineItems: Array<{ sku: string; qty: number }>;
  customer: Record<string, any>;
  shipping: Record<string, any>;
  metadata?: Record<string, any>;
};

export interface SupplierConnector {
  type: SupplierFeedType;
  fetchProducts(): Promise<ProductFeedItem[]>;
  syncInventory?(): Promise<SyncResult>;
  pushOrder?(payload: OrderPushPayload): Promise<{ externalId?: string }>;
}

export function applyAuthHeaders(
  auth: SupplierAuthConfig | undefined,
  headers: HeadersInit = {}
): HeadersInit {
  if (!auth || auth.type === SupplierAuthType.NONE) {
    return headers;
  }

  const normalized = Array.isArray(headers)
    ? Object.fromEntries(headers)
    : { ...(headers as Record<string, string>) };

  if (auth.type === SupplierAuthType.API_KEY && auth.apiKey) {
    const header = auth.headerName || "X-API-Key";
    normalized[header] = auth.apiKey;
  }

  if (auth.type === SupplierAuthType.BEARER && auth.token) {
    normalized["Authorization"] = `Bearer ${auth.token}`;
  }

  if (auth.type === SupplierAuthType.BASIC && auth.username && auth.password) {
    const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString(
      "base64"
    );
    normalized["Authorization"] = `Basic ${encoded}`;
  }

  return normalized;
}
