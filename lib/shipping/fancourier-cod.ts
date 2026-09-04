import type {
  FanCourierSenderConfig,
  FanCourierServiceType,
} from "@/lib/integrations/fancourier/types";

export type FanCourierCodBankDetails = {
  bank: string;
  bankAccount: string;
  source: "environment" | "selfawb_branch";
};

type FanCourierBranchBankDetails = {
  bank?: string | null;
  bankAccount?: string | null;
};

type CodBankResolution =
  | { success: true; details: FanCourierCodBankDetails }
  | { success: false; error: string };

export const isFanCourierCodPaymentMethod = (
  paymentMethod?: string | null
): boolean => paymentMethod === "cash_on_delivery" || paymentMethod === "cod";

export const resolveFanCourierService = (input: {
  methodId?: string | null;
  pickupLocation?: string | null;
  isCodPayment: boolean;
}): FanCourierServiceType => {
  const normalized = input.methodId?.includes(":")
    ? input.methodId.split(":")[1]?.toLowerCase().trim()
    : input.methodId?.toLowerCase().trim();
  const wantsFanbox =
    normalized === "easybox" ||
    normalized === "fanbox" ||
    normalized === "fan_box";

  if (wantsFanbox && input.pickupLocation) {
    return input.isCodPayment ? "FANbox Cont Colector" : "FANbox";
  }

  return input.isCodPayment ? "Cont Colector" : "Standard";
};

export const isFanCourierCollectorService = (
  service: FanCourierServiceType
): boolean => service === "Cont Colector" || service === "FANbox Cont Colector";

/**
 * Keep the merchant identity on the customer-facing label while using the
 * supplier warehouse as the physical origin. Courier pickup scheduling gets
 * the supplier's own contact so the driver can coordinate collection.
 */
export const resolveFanCourierSenderProfiles = (input: {
  merchant: FanCourierSenderConfig;
  supplierPickup?: FanCourierSenderConfig | null;
}): {
  customerFacingSender: FanCourierSenderConfig;
  pickupSender: FanCourierSenderConfig;
} => {
  if (!input.supplierPickup) {
    return {
      customerFacingSender: input.merchant,
      pickupSender: input.merchant,
    };
  }

  return {
    customerFacingSender: {
      ...input.merchant,
      county: input.supplierPickup.county,
      locality: input.supplierPickup.locality,
      street: input.supplierPickup.street,
      number: input.supplierPickup.number,
      postalCode: input.supplierPickup.postalCode,
    },
    pickupSender: input.supplierPickup,
  };
};

export const normalizeFanCourierIban = (value: string): string =>
  value.replace(/\s+/g, "").toUpperCase();

export const isValidIban = (value: string): boolean => {
  const iban = normalizeFanCourierIban(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;

  for (const character of rearranged) {
    const numeric = /[A-Z]/.test(character)
      ? String(character.charCodeAt(0) - 55)
      : character;
    for (const digit of numeric) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder === 1;
};

/**
 * Resolve COD payout details without mixing a partial environment override with
 * the bank account registered on a SelfAWB branch.
 */
export const resolveFanCourierCodBankDetails = (input: {
  environment?: Record<string, string | undefined>;
  branch?: FanCourierBranchBankDetails | null;
}): CodBankResolution => {
  const environment = input.environment ?? process.env;
  const environmentBank = environment.FANCOURIER_COD_BANK?.trim() ?? "";
  const environmentIban = environment.FANCOURIER_COD_IBAN?.trim() ?? "";
  const hasEnvironmentOverride = !!environmentBank || !!environmentIban;

  const bank = hasEnvironmentOverride
    ? environmentBank
    : (input.branch?.bank?.trim() ?? "");
  const rawBankAccount = hasEnvironmentOverride
    ? environmentIban
    : (input.branch?.bankAccount?.trim() ?? "");

  if (!bank || !rawBankAccount) {
    return {
      success: false,
      error:
        "FAN Courier COD is blocked: configure both FANCOURIER_COD_BANK and FANCOURIER_COD_IBAN, or register both values on the matching SelfAWB branch.",
    };
  }

  const bankAccount = normalizeFanCourierIban(rawBankAccount);
  if (!isValidIban(bankAccount)) {
    return {
      success: false,
      error:
        "FAN Courier COD is blocked: the configured SelfAWB payout IBAN is invalid.",
    };
  }

  return {
    success: true,
    details: {
      bank,
      bankAccount,
      source: hasEnvironmentOverride ? "environment" : "selfawb_branch",
    },
  };
};
