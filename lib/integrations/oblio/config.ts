import "server-only";

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const parseIntSafe = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeUrl = (value: string | undefined, fallback: string) =>
  (value || fallback).replace(/\/+$/, "");

export const normalizeRomanianTaxId = (value: string | undefined | null) => {
  if (!value) return "";
  return value.trim().toUpperCase().replace(/\s+/g, "").replace(/^RO/, "");
};

export interface OblioConfig {
  enabled: boolean;
  baseUrl: string;
  clientEmail: string;
  clientSecret: string;
  companyCif: string;
  seriesName?: string;
  language: "RO" | "EN";
  precision: number;
  sendEmailOnIssue: boolean;
  saveProducts: boolean;
  saveClients: boolean;
  autoIssueOnlinePayments: boolean;
  autoIssueCodOnStatuses: string[];
  autoCollectOnlinePayments: boolean;
  onlineCollectType: string;
  autoSendEinvoice: boolean;
  b2cFallbackCif: string;
  defaultMeasuringUnit: string;
  defaultProductType: string;
  management?: string;
  workstation?: string;
  webhookBaseUrl?: string;
  webhookSecret?: string;
}

export function getOblioConfig(): OblioConfig {
  const enabled = parseBoolean(process.env.OBLIO_ENABLED, false);
  const clientEmail =
    process.env.OBLIO_CLIENT_EMAIL || process.env.OBLIO_EMAIL || "";
  const clientSecret =
    process.env.OBLIO_CLIENT_SECRET || process.env.OBLIO_API_SECRET || "";
  const companyCif = normalizeRomanianTaxId(
    process.env.OBLIO_COMPANY_CIF || process.env.STORE_CUI || ""
  );

  if (enabled) {
    if (!clientEmail) {
      throw new Error("OBLIO_CLIENT_EMAIL is required when OBLIO_ENABLED=true");
    }
    if (!clientSecret) {
      throw new Error(
        "OBLIO_CLIENT_SECRET is required when OBLIO_ENABLED=true"
      );
    }
    if (!companyCif) {
      throw new Error(
        "OBLIO_COMPANY_CIF or STORE_CUI is required when OBLIO_ENABLED=true"
      );
    }
  }

  const codStatusesRaw =
    process.env.OBLIO_AUTO_ISSUE_COD_STATUSES || "SHIPPED,DELIVERED,COMPLETED";
  const autoIssueCodOnStatuses = codStatusesRaw
    .split(",")
    .map(value => value.trim().toUpperCase())
    .filter(Boolean);

  return {
    enabled,
    baseUrl: normalizeUrl(process.env.OBLIO_BASE_URL, "https://www.oblio.eu"),
    clientEmail,
    clientSecret,
    companyCif,
    seriesName: process.env.OBLIO_SERIES_NAME?.trim() || undefined,
    language:
      process.env.OBLIO_LANGUAGE?.trim().toUpperCase() === "EN" ? "EN" : "RO",
    precision: parseIntSafe(process.env.OBLIO_PRECISION, 2),
    sendEmailOnIssue: parseBoolean(
      process.env.OBLIO_SEND_EMAIL_ON_ISSUE,
      false
    ),
    saveProducts: parseBoolean(process.env.OBLIO_SAVE_PRODUCTS, true),
    saveClients: parseBoolean(process.env.OBLIO_SAVE_CLIENTS, true),
    autoIssueOnlinePayments: parseBoolean(
      process.env.OBLIO_AUTO_ISSUE_ONLINE_PAYMENTS,
      true
    ),
    autoIssueCodOnStatuses,
    autoCollectOnlinePayments: parseBoolean(
      process.env.OBLIO_AUTO_COLLECT_ONLINE_PAYMENTS,
      true
    ),
    onlineCollectType:
      process.env.OBLIO_ONLINE_PAYMENT_COLLECT_TYPE?.trim() || "Card",
    autoSendEinvoice: parseBoolean(process.env.OBLIO_AUTO_SEND_EINVOICE, true),
    b2cFallbackCif:
      process.env.OBLIO_B2C_FALLBACK_CIF?.trim() || "0000000000000",
    defaultMeasuringUnit:
      process.env.OBLIO_DEFAULT_MEASURING_UNIT?.trim() || "buc",
    defaultProductType:
      process.env.OBLIO_DEFAULT_PRODUCT_TYPE?.trim() || "Marfa",
    management: process.env.OBLIO_MANAGEMENT?.trim() || undefined,
    workstation: process.env.OBLIO_WORKSTATION?.trim() || undefined,
    webhookBaseUrl:
      process.env.OBLIO_WEBHOOK_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      undefined,
    webhookSecret: process.env.OBLIO_WEBHOOK_SECRET?.trim() || undefined,
  };
}
