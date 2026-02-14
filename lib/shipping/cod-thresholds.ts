export type RecipientType = "B2B" | "B2C";

const DEFAULT_COD_MAX_B2C = 10000;
const DEFAULT_COD_MAX_B2B = 5000;

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const COD_MAX_B2C = parseNumber(
  process.env.NEXT_PUBLIC_COD_MAX_B2C ?? process.env.COD_MAX_B2C,
  DEFAULT_COD_MAX_B2C
);

export const COD_MAX_B2B = parseNumber(
  process.env.NEXT_PUBLIC_COD_MAX_B2B ?? process.env.COD_MAX_B2B,
  DEFAULT_COD_MAX_B2B
);

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function getRecipientType(
  addresses: Array<Record<string, unknown> | null | undefined>
): RecipientType {
  const hasCompany = addresses.some(address => {
    if (!address) return false;
    return Boolean(
      normalizeString(address.companyName) || normalizeString(address.cui)
    );
  });

  return hasCompany ? "B2B" : "B2C";
}

export function getCodThreshold(recipientType: RecipientType): number {
  return recipientType === "B2B" ? COD_MAX_B2B : COD_MAX_B2C;
}

export function isCodAllowed(
  amountToCollect: number,
  recipientType: RecipientType
): boolean {
  return amountToCollect <= getCodThreshold(recipientType);
}
