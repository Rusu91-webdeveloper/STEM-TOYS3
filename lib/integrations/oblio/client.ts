import "server-only";

import { getOblioConfig } from "./config";
import type {
  OblioApiResponse,
  OblioAuthorizeResponse,
  OblioCollectPayload,
  OblioDocumentSummary,
  OblioEinvoiceResponse,
  OblioIssueInvoicePayload,
  OblioSeries,
  OblioVatRate,
  OblioWebhookCreatePayload,
  OblioWebhookRecord,
} from "./types";

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

export class OblioClientError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = "OblioClientError";
    this.status = status;
    this.payload = payload;
  }
}

const TOKEN_SKEW_MS = 60_000;

const ensureOk = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<T> => {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = await response.text().catch(() => null);
  }

  if (!response.ok) {
    throw new OblioClientError(
      `${fallbackMessage} (${response.status})`,
      response.status,
      payload
    );
  }

  return payload as T;
};

const appendFormValue = (
  params: URLSearchParams,
  key: string,
  value: unknown
) => {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      appendFormValue(params, `${key}[${index}]`, entry)
    );
    return;
  }

  if (typeof value === "object") {
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      appendFormValue(params, `${key}[${nestedKey}]`, nestedValue);
    }
    return;
  }

  params.append(key, String(value));
};

const toFormBody = (payload: Record<string, unknown>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    appendFormValue(params, key, value);
  }
  return params;
};

const getAuthToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_SKEW_MS) {
    return cachedToken.token;
  }

  const config = getOblioConfig();
  const body = new URLSearchParams();
  body.set("email", config.clientEmail);
  body.set("apiSecret", config.clientSecret);

  const response = await fetch(`${config.baseUrl}/api/authorize/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = await ensureOk<OblioApiResponse<OblioAuthorizeResponse>>(
    response,
    "Oblio authorization failed"
  );

  const token = payload.data?.access_token;
  if (!token) {
    throw new OblioClientError("Oblio access token missing from response");
  }

  const expiresInSeconds = payload.data?.expires_in ?? 3600;
  cachedToken = {
    token,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };

  return token;
};

const oblioRequest = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const config = getOblioConfig();
  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers,
  });

  return ensureOk<T>(response, `Oblio request failed for ${path}`);
};

export const issueOblioInvoice = async (payload: OblioIssueInvoicePayload) => {
  return oblioRequest<OblioApiResponse<OblioDocumentSummary>>(
    "/api/docs/invoice",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
};

export const getOblioInvoice = async (input: {
  cif: string;
  seriesName: string;
  number: string | number;
}) => {
  const query = new URLSearchParams({
    cif: input.cif,
    seriesName: input.seriesName,
    number: String(input.number),
  });

  return oblioRequest<OblioApiResponse<OblioDocumentSummary>>(
    `/api/docs/invoice?${query.toString()}`,
    { method: "GET" }
  );
};

export const collectOblioInvoice = async (payload: OblioCollectPayload) => {
  return oblioRequest<OblioApiResponse<OblioDocumentSummary>>(
    "/api/docs/collect",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: toFormBody(payload),
    }
  );
};

export const sendOblioEinvoice = async (input: {
  cif: string;
  seriesName: string;
  number: string | number;
}) => {
  return oblioRequest<OblioApiResponse<OblioEinvoiceResponse>>(
    "/api/docs/einvoice",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: toFormBody(input as Record<string, unknown>),
    }
  );
};

export const listOblioSeries = async (input: { cif: string }) => {
  const query = new URLSearchParams({ cif: input.cif });
  return oblioRequest<OblioApiResponse<OblioSeries[]>>(
    `/api/nomenclature/series?${query.toString()}`,
    { method: "GET" }
  );
};

export const listOblioVatRates = async (input: { cif: string }) => {
  const query = new URLSearchParams({ cif: input.cif });
  return oblioRequest<OblioApiResponse<OblioVatRate[]>>(
    `/api/nomenclature/vat_rates?${query.toString()}`,
    { method: "GET" }
  );
};

export const listOblioInvoices = async (input: {
  cif: string;
  limit?: number;
  offset?: number;
  seriesName?: string;
  withEinvoiceStatus?: boolean;
}) => {
  const query = new URLSearchParams({
    cif: input.cif,
  });

  if (typeof input.limit === "number") {
    query.set("limit", String(input.limit));
  }
  if (typeof input.offset === "number") {
    query.set("offset", String(input.offset));
  }
  if (input.seriesName) {
    query.set("seriesName", input.seriesName);
  }
  if (input.withEinvoiceStatus) {
    query.set("withEinvoiceStatus", "1");
  }

  return oblioRequest<OblioApiResponse<OblioDocumentSummary[]>>(
    `/api/docs/invoice/list?${query.toString()}`,
    { method: "GET" }
  );
};

export const listOblioWebhooks = async () => {
  return oblioRequest<OblioApiResponse<OblioWebhookRecord[]>>("/api/webhooks", {
    method: "GET",
  });
};

export const createOblioWebhook = async (
  payload: OblioWebhookCreatePayload
) => {
  return oblioRequest<OblioApiResponse<OblioWebhookRecord>>("/api/webhooks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const deleteOblioWebhook = async (input: { id: string | number }) => {
  return oblioRequest<OblioApiResponse<{ deleted?: boolean }>>(
    `/api/webhooks/${encodeURIComponent(String(input.id))}`,
    {
      method: "DELETE",
    }
  );
};
