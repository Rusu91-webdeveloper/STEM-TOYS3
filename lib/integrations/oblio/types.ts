export interface OblioApiResponse<T> {
  status: number;
  statusMessage?: string;
  data: T;
}

export interface OblioAuthorizeResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface OblioSeries {
  name: string;
  type?: string;
  isDefault?: boolean;
}

export interface OblioVatRate {
  name: string;
  percentage?: number;
  default?: boolean;
}

export interface OblioClientPayload {
  cif?: string;
  name: string;
  rc?: string;
  code?: string;
  address?: string;
  state?: string;
  city?: string;
  country?: string;
  iban?: string;
  bank?: string;
  email?: string;
  phone?: string;
  contact?: string;
  vatPayer?: 0 | 1;
  save?: 0 | 1;
}

export interface OblioInvoiceLinePayload {
  name: string;
  code?: string;
  description?: string;
  measuringUnit?: string;
  currency?: string;
  quantity: number;
  price: number;
  discount?: number;
  discountType?: "procentual" | "valoric";
  vatName?: string;
  vatPercentage?: number;
  vatIncluded?: 0 | 1;
  productType?: string;
  management?: string;
  save?: 0 | 1;
}

export interface OblioIssueInvoicePayload {
  cif: string;
  client: OblioClientPayload;
  issueDate?: string;
  dueDate?: string;
  seriesName: string;
  language?: "RO" | "EN";
  precision?: number;
  currency?: string;
  products: OblioInvoiceLinePayload[];
  notes?: string;
  deliveryDate?: string;
  orderNumber?: string;
  workStation?: string;
  sendEmail?: 0 | 1;
}

export interface OblioCollectPayload {
  cif: string;
  seriesName: string;
  number: string | number;
  collect: {
    type: string;
    documentNumber?: string;
    issueDate?: string;
    value?: number;
  };
}

export interface OblioDocumentSummary {
  documentType?: string;
  seriesName?: string;
  number?: string | number;
  link?: string;
  collects?: Array<{
    issueDate?: string;
    type?: string;
    number?: string;
    value?: number;
  }>;
}

export interface OblioEinvoiceResponse {
  text?: string;
  sent?: boolean;
  code?: number;
}

export interface OblioWebhookCreatePayload {
  name: string;
  url: string;
  topic: string;
}

export interface OblioWebhookRecord {
  id?: string | number;
  name?: string;
  url?: string;
  topic?: string;
}
