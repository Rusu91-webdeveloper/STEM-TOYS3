import type { RecipientType } from "@/lib/shipping/cod-thresholds";

export type CodGuaranteeMode = "off" | "always" | "risk_based";

export type CodGuaranteeReason =
  | "all_cod_orders"
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
const DEFAULT_NEW_CUSTOMER_MIN_TOTAL = 200;
const DEFAULT_B2B_MIN_TOTAL = 700;
const DEFAULT_COD_RTO_COUNT_THRESHOLD = 1;

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Retained as legacy response metadata; these thresholds no longer grant exemptions.
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
  _input: CodGuaranteePolicyInput
): CodGuaranteePolicyResult =>
  // Owner policy: every COD order needs authorization. Legacy env overrides,
  // customer history and delivery method cannot disable this server invariant.
  // Delivery eligibility (e.g. prepaid-only lockers) is checked separately.
  ({
    required: true,
    mode: "always",
    reasons: ["all_cod_orders"],
    thresholds: getThresholds(),
  });
