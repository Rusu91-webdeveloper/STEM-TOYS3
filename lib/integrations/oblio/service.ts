import "server-only";

import {
  ExternalInvoiceProvider,
  ExternalInvoiceType,
  ExternalSyncStatus,
  EinvoiceSyncStatus,
  InvoiceStatus,
  type OrderStatus,
} from "@prisma/client";
import { createHash, timingSafeEqual } from "crypto";

import { getAppConfig } from "@/lib/config/app-config";
import { db } from "@/lib/db";
import { getTaxSettings } from "@/lib/utils/store-settings";

import {
  getOblioConfig,
  normalizeRomanianTaxId,
  type OblioConfig,
} from "./config";
import {
  collectOblioInvoice,
  createOblioWebhook,
  getOblioInvoice,
  issueOblioInvoice,
  listOblioSeries,
  listOblioVatRates,
  listOblioWebhooks,
  sendOblioEinvoice,
} from "./client";
import type {
  OblioClientPayload,
  OblioDocumentSummary,
  OblioInvoiceLinePayload,
  OblioIssueInvoicePayload,
} from "./types";

type SyncResultStatus = "synced" | "already_synced" | "skipped" | "failed";

export interface SyncOrderInvoiceResult {
  ok: boolean;
  status: SyncResultStatus;
  invoiceId?: string;
  orderId: string;
  message: string;
  warnings?: string[];
}

const isTruthyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const formatOblioDate = (date: Date) => date.toISOString().slice(0, 10);

const buildAddressLine = (
  line1?: string | null,
  line2?: string | null
): string | undefined =>
  [normalizeOptionalString(line1), normalizeOptionalString(line2)]
    .filter(Boolean)
    .join(", ") || undefined;

const inferDocumentNumber = (document: OblioDocumentSummary | undefined) => {
  const raw = document?.number;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  return undefined;
};

const getDocumentLink = (document: OblioDocumentSummary | undefined) =>
  normalizeOptionalString(document?.link);

const hashPayload = (payload: unknown) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");

const isCodPaymentMethod = (paymentMethod: string) =>
  paymentMethod === "cash_on_delivery";

const shouldAutoIssueInvoice = (input: {
  config: OblioConfig;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
}) => {
  if (isCodPaymentMethod(input.paymentMethod)) {
    return input.config.autoIssueCodOnStatuses.includes(
      input.status.toUpperCase()
    );
  }

  return (
    input.config.autoIssueOnlinePayments &&
    input.paymentStatus.toUpperCase() === "PAID"
  );
};

let cachedSeriesName: {
  cif: string;
  seriesName: string;
} | null = null;

let cachedVatRate: {
  cif: string;
  key: string;
  name: string;
  percentage?: number;
} | null = null;

async function resolveSeriesName(config: OblioConfig) {
  if (config.seriesName) {
    return config.seriesName;
  }

  if (cachedSeriesName?.cif === config.companyCif) {
    return cachedSeriesName.seriesName;
  }

  const seriesResponse = await listOblioSeries({ cif: config.companyCif });
  const series =
    seriesResponse.data.find(entry => entry.isDefault) ||
    seriesResponse.data.find(entry =>
      isTruthyString(entry.type)
        ? entry.type.toLowerCase().includes("fact")
        : false
    ) ||
    seriesResponse.data[0];

  if (!series?.name) {
    throw new Error("No Oblio invoice series found for the configured company");
  }

  cachedSeriesName = {
    cif: config.companyCif,
    seriesName: series.name,
  };

  return series.name;
}

async function resolveVatRate(config: OblioConfig) {
  const taxSettings = await getTaxSettings();
  const desiredPercentage =
    taxSettings.active && Number.isFinite(Number(taxSettings.rate))
      ? Number(taxSettings.rate)
      : 0;
  const cacheKey = `${config.companyCif}:${desiredPercentage}`;

  if (cachedVatRate?.key === cacheKey) {
    return cachedVatRate;
  }

  const vatResponse = await listOblioVatRates({ cif: config.companyCif });
  const vatRate =
    vatResponse.data.find(rate => rate.percentage === desiredPercentage) ||
    vatResponse.data.find(rate => rate.default) ||
    vatResponse.data[0];

  if (!vatRate?.name) {
    throw new Error("No Oblio VAT rates available for the configured company");
  }

  cachedVatRate = {
    cif: config.companyCif,
    key: cacheKey,
    name: vatRate.name,
    percentage: vatRate.percentage,
  };

  return cachedVatRate;
}

function buildClientPayload(input: {
  billingAddress: {
    companyName?: string | null;
    cui?: string | null;
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    country: string;
    phone: string;
  };
  userEmail?: string | null;
  config: OblioConfig;
}): OblioClientPayload {
  const companyName = normalizeOptionalString(input.billingAddress.companyName);
  const clientCif =
    normalizeRomanianTaxId(input.billingAddress.cui) ||
    input.config.b2cFallbackCif;

  return {
    cif: clientCif,
    name:
      companyName ||
      normalizeOptionalString(input.billingAddress.fullName) ||
      normalizeOptionalString(input.userEmail) ||
      "Client final",
    address: buildAddressLine(
      input.billingAddress.addressLine1,
      input.billingAddress.addressLine2
    ),
    state: normalizeOptionalString(input.billingAddress.state),
    city: normalizeOptionalString(input.billingAddress.city),
    country: normalizeOptionalString(input.billingAddress.country) || "Romania",
    email: normalizeOptionalString(input.userEmail || undefined),
    phone: normalizeOptionalString(input.billingAddress.phone),
    contact: normalizeOptionalString(input.billingAddress.fullName),
    vatPayer: companyName ? 0 : undefined,
    save: input.config.saveClients ? 1 : 0,
  };
}

function buildOrderLines(input: {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    isDigital: boolean;
    productId: string | null;
    product?: {
      sku?: string | null;
      description?: string | null;
    } | null;
  }>;
  config: OblioConfig;
  vatName: string;
  vatPercentage?: number;
  vatIncluded: boolean;
}): OblioInvoiceLinePayload[] {
  return input.items.map(item => ({
    name: item.name,
    code:
      normalizeOptionalString(item.product?.sku) ||
      normalizeOptionalString(item.productId) ||
      item.id,
    description: normalizeOptionalString(
      item.product?.description || undefined
    ),
    measuringUnit: input.config.defaultMeasuringUnit,
    currency: "RON",
    quantity: item.quantity,
    price: item.price,
    vatName: input.vatName,
    vatPercentage: input.vatPercentage,
    vatIncluded: input.vatIncluded ? 1 : 0,
    productType: item.isDigital ? "Serviciu" : input.config.defaultProductType,
    management: input.config.management,
    save: input.config.saveProducts ? 1 : 0,
  }));
}

async function buildIssuePayload(input: {
  order: Awaited<ReturnType<typeof getOrderForInvoice>>;
  config: OblioConfig;
}) {
  const order = input.order;
  if (!order) {
    throw new Error("Order not found");
  }

  const taxSettings = await getTaxSettings();
  const vatRate = await resolveVatRate(input.config);
  const seriesName = await resolveSeriesName(input.config);
  const issueDate = new Date();
  const appConfig = await getAppConfig();

  const billingAddress = order.billingAddress || order.shippingAddress;
  if (!billingAddress) {
    throw new Error("Order is missing both billing and shipping addresses");
  }

  const payload: OblioIssueInvoicePayload = {
    cif: input.config.companyCif,
    client: buildClientPayload({
      billingAddress,
      userEmail: order.user?.email,
      config: input.config,
    }),
    issueDate: formatOblioDate(issueDate),
    dueDate: formatOblioDate(issueDate),
    seriesName,
    language: input.config.language,
    precision: input.config.precision,
    currency: "RON",
    workStation: input.config.workstation,
    sendEmail: input.config.sendEmailOnIssue ? 1 : 0,
    notes: `Comanda ${order.orderNumber} ${appConfig.storeName}`.trim(),
    orderNumber: order.orderNumber,
    products: buildOrderLines({
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        isDigital: item.isDigital,
        productId: item.productId,
        product: item.product,
      })),
      config: input.config,
      vatName: vatRate.name,
      vatPercentage: vatRate.percentage,
      vatIncluded: Boolean(taxSettings.active && taxSettings.includeInPrice),
    }),
  };

  return payload;
}

async function getOrderForInvoice(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      shippingAddress: true,
      billingAddress: true,
      items: {
        include: {
          product: {
            select: {
              description: true,
              sku: true,
            },
          },
        },
      },
      invoices: {
        where: {
          provider: ExternalInvoiceProvider.OBLIO,
          documentType: ExternalInvoiceType.INVOICE,
        },
      },
    },
  });
}

const buildErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown Oblio integration error";
};

export async function syncOrderInvoiceToOblio(input: {
  orderId: string;
  force?: boolean;
}): Promise<SyncOrderInvoiceResult> {
  const config = getOblioConfig();
  if (!config.enabled) {
    return {
      ok: false,
      status: "skipped",
      orderId: input.orderId,
      message: "Oblio integration is disabled",
    };
  }

  const order = await getOrderForInvoice(input.orderId);
  if (!order) {
    return {
      ok: false,
      status: "failed",
      orderId: input.orderId,
      message: "Order not found",
    };
  }

  if (order.status === "CANCELLED" && !input.force) {
    return {
      ok: false,
      status: "skipped",
      orderId: input.orderId,
      message: "Cancelled orders are not invoiced automatically",
    };
  }

  if (
    !input.force &&
    !shouldAutoIssueInvoice({
      config,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
    })
  ) {
    return {
      ok: false,
      status: "skipped",
      orderId: input.orderId,
      message: "Order is not yet eligible for automatic Oblio invoicing",
    };
  }

  const existingInvoice = order.invoices[0];
  if (
    existingInvoice &&
    existingInvoice.syncStatus === ExternalSyncStatus.SYNCED &&
    existingInvoice.status !== InvoiceStatus.CANCELLED &&
    !input.force
  ) {
    return {
      ok: true,
      status: "already_synced",
      invoiceId: existingInvoice.id,
      orderId: input.orderId,
      message: "Order already has a synced Oblio invoice",
    };
  }

  const payload = await buildIssuePayload({ order, config });
  const requestHash = hashPayload(payload);
  const now = new Date();

  const localInvoice = existingInvoice
    ? await db.orderInvoice.update({
        where: { id: existingInvoice.id },
        data: {
          status: InvoiceStatus.DRAFT,
          syncStatus: ExternalSyncStatus.PENDING,
          einvoiceStatus: EinvoiceSyncStatus.NOT_SENT,
          issueDate: now,
          dueDate: now,
          totalAmount: order.total,
          currency: payload.currency || "RON",
          seriesName: payload.seriesName,
          payload,
          response: undefined,
          requestHash,
          errorMessage: null,
          lastSyncAt: now,
          collectType:
            !isCodPaymentMethod(order.paymentMethod) &&
            config.autoCollectOnlinePayments
              ? config.onlineCollectType
              : null,
          collectDocumentNumber: order.orderNumber,
        },
      })
    : await db.orderInvoice.create({
        data: {
          orderId: order.id,
          provider: ExternalInvoiceProvider.OBLIO,
          documentType: ExternalInvoiceType.INVOICE,
          status: InvoiceStatus.DRAFT,
          syncStatus: ExternalSyncStatus.PENDING,
          einvoiceStatus: EinvoiceSyncStatus.NOT_SENT,
          issueDate: now,
          dueDate: now,
          totalAmount: order.total,
          currency: payload.currency || "RON",
          seriesName: payload.seriesName,
          payload,
          requestHash,
          lastSyncAt: now,
          collectType:
            !isCodPaymentMethod(order.paymentMethod) &&
            config.autoCollectOnlinePayments
              ? config.onlineCollectType
              : null,
          collectDocumentNumber: order.orderNumber,
        },
      });

  const warnings: string[] = [];

  try {
    const issueResponse = await issueOblioInvoice(payload);
    const document = issueResponse.data;
    const seriesName = document.seriesName || payload.seriesName;
    const number = inferDocumentNumber(document);
    const providerLink = getDocumentLink(document);

    let status = InvoiceStatus.SENT;
    let einvoiceStatus = EinvoiceSyncStatus.NOT_SENT;
    let responsePayload: Record<string, unknown> = {
      issue: issueResponse,
    };

    if (
      !isCodPaymentMethod(order.paymentMethod) &&
      order.paymentStatus === "PAID" &&
      config.autoCollectOnlinePayments &&
      seriesName &&
      number
    ) {
      try {
        const collectResponse = await collectOblioInvoice({
          cif: config.companyCif,
          seriesName,
          number,
          collect: {
            type: config.onlineCollectType,
            documentNumber: order.orderNumber,
            issueDate: formatOblioDate(now),
            value: order.total,
          },
        });
        responsePayload.collect = collectResponse;
        status = InvoiceStatus.PAID;
      } catch (error) {
        warnings.push(`Oblio collect step failed: ${buildErrorMessage(error)}`);
      }
    }

    if (config.autoSendEinvoice && seriesName && number) {
      try {
        const einvoiceResponse = await sendOblioEinvoice({
          cif: config.companyCif,
          seriesName,
          number,
        });
        responsePayload.einvoice = einvoiceResponse;
        einvoiceStatus = EinvoiceSyncStatus.SENT;
      } catch (error) {
        warnings.push(
          `Oblio e-Factura send failed: ${buildErrorMessage(error)}`
        );
      }
    }

    let remoteDocument: OblioDocumentSummary | undefined = document;
    if (seriesName && number) {
      try {
        const remoteInvoice = await getOblioInvoice({
          cif: config.companyCif,
          seriesName,
          number,
        });
        remoteDocument = remoteInvoice.data || document;
        responsePayload.remote = remoteInvoice;
      } catch (error) {
        warnings.push(
          `Oblio invoice refresh failed: ${buildErrorMessage(error)}`
        );
      }
    }

    await db.orderInvoice.update({
      where: { id: localInvoice.id },
      data: {
        providerInvoiceId: number,
        providerLink:
          getDocumentLink(remoteDocument) ||
          providerLink ||
          localInvoice.providerLink,
        seriesName,
        number,
        status,
        syncStatus: ExternalSyncStatus.SYNCED,
        einvoiceStatus,
        syncedAt: now,
        collectedAt: status === InvoiceStatus.PAID ? now : null,
        response: responsePayload,
        errorMessage: warnings.length > 0 ? warnings.join(" | ") : null,
        lastSyncAt: now,
      },
    });

    return {
      ok: true,
      status: "synced",
      invoiceId: localInvoice.id,
      orderId: input.orderId,
      message: "Order synced to Oblio successfully",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    await db.orderInvoice.update({
      where: { id: localInvoice.id },
      data: {
        syncStatus: ExternalSyncStatus.FAILED,
        status: InvoiceStatus.DRAFT,
        errorMessage: buildErrorMessage(error),
        response: {
          error: buildErrorMessage(error),
        },
        lastSyncAt: now,
      },
    });

    return {
      ok: false,
      status: "failed",
      invoiceId: localInvoice.id,
      orderId: input.orderId,
      message: buildErrorMessage(error),
    };
  }
}

export async function ensureDefaultOblioWebhooks() {
  const config = getOblioConfig();
  if (!config.enabled || !config.webhookBaseUrl) {
    return {
      ok: false,
      message:
        "Oblio webhooks skipped because integration or base URL is not configured",
    };
  }

  const targetUrl = `${config.webhookBaseUrl.replace(/\/+$/, "")}/api/integrations/oblio/webhook`;
  const topics = ["Invoice/*", "Stock/*"];
  const existing = await listOblioWebhooks();
  const existingKeys = new Set(
    existing.data.map(webhook => `${webhook.topic}:${webhook.url}`)
  );

  const created: string[] = [];
  for (const topic of topics) {
    const key = `${topic}:${targetUrl}`;
    if (existingKeys.has(key)) continue;

    await createOblioWebhook({
      name: `TechTots ${topic}`,
      url: targetUrl,
      topic,
    });
    created.push(topic);
  }

  return {
    ok: true,
    message:
      created.length > 0
        ? `Created Oblio webhooks for ${created.join(", ")}`
        : "Oblio webhooks already configured",
  };
}

export function verifyOblioWebhookSignature(input: {
  rawBody: string;
  encodedHeader?: string | null;
}) {
  if (!input.encodedHeader) {
    return false;
  }

  try {
    const decoded = Buffer.from(input.encodedHeader, "base64").toString("utf8");
    const expected = Buffer.from(decoded);
    const actual = Buffer.from(input.rawBody);

    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function handleOblioWebhookEvent(
  payload: Record<string, unknown>
) {
  const topic = normalizeOptionalString(payload.topic);
  const seriesName =
    normalizeOptionalString(payload.seriesName) ||
    normalizeOptionalString(payload.documentSeries);
  const number =
    normalizeOptionalString(payload.number) ||
    normalizeOptionalString(payload.documentNumber);

  if (seriesName && number) {
    const invoice = await db.orderInvoice.findFirst({
      where: {
        provider: ExternalInvoiceProvider.OBLIO,
        documentType: ExternalInvoiceType.INVOICE,
        seriesName,
        number,
      },
    });

    if (invoice) {
      await db.orderInvoice.update({
        where: { id: invoice.id },
        data: {
          lastSyncAt: new Date(),
          metadata: {
            lastWebhookTopic: topic,
            lastWebhookPayload: payload,
          },
        },
      });
    }
  }

  return {
    ok: true,
    topic: topic || "unknown",
  };
}

export async function getLocalOblioInvoiceState(orderId: string) {
  return db.orderInvoice.findMany({
    where: {
      orderId,
      provider: ExternalInvoiceProvider.OBLIO,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export const shouldSyncCodInvoiceForStatus = (
  status: OrderStatus | string | undefined
) => {
  if (!status) return false;
  const config = getOblioConfig();
  return config.autoIssueCodOnStatuses.includes(String(status).toUpperCase());
};
