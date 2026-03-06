import type { RecipientType } from "@/lib/shipping/cod-thresholds";

export type CodGuaranteeMode = "off" | "always" | "risk_based";

export type CodGuaranteeReason =
  | "high_order_value"
  | "new_customer_high_value"
  | "repeat_cod_rto"
  | "b2b_high_value";

export interface CodGuaranteePolicyInput {
  orderTotal: number;
  recipientType: RecipientType;
  isLockerDelivery: boolean;
  priorOrderCount: number;
  priorCodRtoCount: number;
}

export interface CodGuaranteePolicyResult {
  required: boolean;
  mode: CodGuaranteeMode;
  reasons: CodGuaranteeReason[];
  thresholds: {
    highOrderValue: number;
    newCustomerMinTotal: number;
    b2bMinTotal: number;
    codRtoCount: number;
  };
}

const DEFAULT_HIGH_ORDER_VALUE_THRESHOLD = 500;
const DEFAULT_NEW_CUSTOMER_MIN_TOTAL = 350;
const DEFAULT_B2B_MIN_TOTAL = 700;
const DEFAULT_COD_RTO_COUNT_THRESHOLD = 1;

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeMode = (value: string | undefined): CodGuaranteeMode => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "off") return "off";
  if (normalized === "always") return "always";
  return "risk_based";
};

const getMode = (): CodGuaranteeMode =>
  normalizeMode(
    process.env.COD_GUARANTEE_MODE || process.env.NEXT_PUBLIC_COD_GUARANTEE_MODE
  );

const getThresholds = () => ({
  highOrderValue: parseNumber(
    process.env.COD_GUARANTEE_HIGH_ORDER_THRESHOLD,
    DEFAULT_HIGH_ORDER_VALUE_THRESHOLD
  ),
  newCustomerMinTotal: parseNumber(
    process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL,
    DEFAULT_NEW_CUSTOMER_MIN_TOTAL
  ),
  b2bMinTotal: parseNumber(
    process.env.COD_GUARANTEE_B2B_MIN_TOTAL,
    DEFAULT_B2B_MIN_TOTAL
  ),
  codRtoCount: Math.max(
    1,
    Math.round(
      parseNumber(
        process.env.COD_GUARANTEE_RTO_COUNT_THRESHOLD,
        DEFAULT_COD_RTO_COUNT_THRESHOLD
      )
    )
  ),
});

export const isLockerShippingMethodId = (shippingMethodId?: string | null) => {
  const methodId = (shippingMethodId || "").trim().toLowerCase();
  if (!methodId) return false;
  return methodId.includes("fanbox") || methodId.includes("easybox");
};

export const evaluateCodGuaranteePolicy = (
  input: CodGuaranteePolicyInput
): CodGuaranteePolicyResult => {
  const mode = getMode();
  const thresholds = getThresholds();

  if (mode === "off" || input.isLockerDelivery) {
    return {
      required: false,
      mode,
      reasons: [],
      thresholds,
    };
  }

  if (mode === "always") {
    return {
      required: true,
      mode,
      reasons: ["high_order_value"],
      thresholds,
    };
  }

  const reasons: CodGuaranteeReason[] = [];

  if (input.orderTotal >= thresholds.highOrderValue) {
    reasons.push("high_order_value");
  }

  if (
    input.priorOrderCount === 0 &&
    input.orderTotal >= thresholds.newCustomerMinTotal
  ) {
    reasons.push("new_customer_high_value");
  }

  if (input.priorCodRtoCount >= thresholds.codRtoCount) {
    reasons.push("repeat_cod_rto");
  }

  if (
    input.recipientType === "B2B" &&
    input.orderTotal >= thresholds.b2bMinTotal
  ) {
    reasons.push("b2b_high_value");
  }

  return {
    required: reasons.length > 0,
    mode,
    reasons,
    thresholds,
  };
};
