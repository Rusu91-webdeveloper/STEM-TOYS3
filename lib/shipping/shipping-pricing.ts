export type ShippingService = "SAMEDAY_EASYBOX" | "SAMEDAY_NEXTDAY_HOME";

export type DimensionsInput = Record<string, unknown> | null | undefined;

export interface ShippingItemInput {
  quantity: number;
  weightKg?: number | null;
  dimensions?: DimensionsInput;
}

export interface ShippingWeights {
  physicalWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  hasDimensions: boolean;
}

export interface ShippingQuote {
  service: ShippingService;
  basePrice: number;
  totalPrice: number;
  breakdown: {
    fuelSurcharge: number;
    extraReteaFee: number;
    atipicFee: number;
  };
  weights: ShippingWeights;
  pricingVersion: string;
}

export interface ShippingPricingConfig {
  pricingVersion: string;
  easyboxBasePrice: number;
  homeBasePrice: number;
  additionalKgPrice: number;
  fuelIndexPercent: number;
  extraReteaFee: number;
  atipicFee: number;
  includeFuelIndex: boolean;
  includeExtraRetea: boolean;
  includeAtipicFee: boolean;
}

const DEFAULT_PRICING_VERSION = "fancourier-2026-01-30";

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return fallback;
};

export function getShippingPricingConfig(): ShippingPricingConfig {
  return {
    pricingVersion:
      process.env.SHIPPING_PRICING_VERSION || DEFAULT_PRICING_VERSION,
    easyboxBasePrice: parseNumber(
      process.env.SHIPPING_EASYBOX_BASE_PRICE,
      19
    ),
    homeBasePrice: parseNumber(process.env.SHIPPING_HOME_BASE_PRICE, 25),
    additionalKgPrice: parseNumber(
      process.env.SHIPPING_ADDITIONAL_KG_PRICE,
      2.5
    ),
    fuelIndexPercent: parseNumber(
      process.env.SHIPPING_FUEL_INDEX_PERCENT,
      0
    ),
    extraReteaFee: parseNumber(
      process.env.SHIPPING_EXTRA_RETEA_FEE,
      8.39
    ),
    atipicFee: parseNumber(process.env.SHIPPING_ATIPIC_FEE, 50),
    includeFuelIndex: parseBoolean(
      process.env.SHIPPING_APPLY_FUEL_INDEX,
      false
    ),
    includeExtraRetea: parseBoolean(
      process.env.SHIPPING_APPLY_EXTRA_RETEA,
      false
    ),
    includeAtipicFee: parseBoolean(
      process.env.SHIPPING_APPLY_ATIPIC_FEE,
      false
    ),
  };
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const normalizeDimensionValue = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const maybeConvertToCm = (value: number): number => {
  // Heuristic: values above 200 are likely mm, convert to cm.
  return value > 200 ? value / 10 : value;
};

export const extractDimensionsCm = (
  dimensions: DimensionsInput
): { width: number; height: number; depth: number } | null => {
  if (!dimensions || typeof dimensions !== "object") return null;
  const record = dimensions as Record<string, unknown>;
  const nestedMm = (record.dimensionsMm ?? record.dimensions_mm) as
    | Record<string, unknown>
    | undefined;

  const width =
    normalizeDimensionValue(record.width) ??
    normalizeDimensionValue(record.w) ??
    normalizeDimensionValue(record.latime) ??
    (nestedMm ? normalizeDimensionValue(nestedMm.width) : null);
  const height =
    normalizeDimensionValue(record.height) ??
    normalizeDimensionValue(record.h) ??
    normalizeDimensionValue(record.inaltime) ??
    (nestedMm ? normalizeDimensionValue(nestedMm.height) : null);
  const depth =
    normalizeDimensionValue(record.depth) ??
    normalizeDimensionValue(record.d) ??
    normalizeDimensionValue(record.adancime) ??
    (nestedMm ? normalizeDimensionValue(nestedMm.depth) : null);

  if (width === null || height === null || depth === null) {
    return null;
  }

  return {
    width: maybeConvertToCm(width),
    height: maybeConvertToCm(height),
    depth: maybeConvertToCm(depth),
  };
};

export const calculateShippingWeights = (
  items: ShippingItemInput[]
): ShippingWeights => {
  let physicalWeightKg = 0;
  let totalVolumeCm3 = 0;
  let hasDimensions = false;

  items.forEach(item => {
    const quantity = Math.max(1, item.quantity || 1);
    if (item.weightKg && Number.isFinite(item.weightKg)) {
      physicalWeightKg += item.weightKg * quantity;
    }

    const dims = extractDimensionsCm(item.dimensions);
    if (dims) {
      hasDimensions = true;
      totalVolumeCm3 += dims.width * dims.height * dims.depth * quantity;
    }
  });

  if (physicalWeightKg <= 0 && items.length > 0) {
    physicalWeightKg = 1;
  }

  const volumetricWeightKg = hasDimensions ? totalVolumeCm3 / 6000 : 0;
  const chargeableWeightKg = Math.max(physicalWeightKg, volumetricWeightKg);

  return {
    physicalWeightKg: roundMoney(physicalWeightKg),
    volumetricWeightKg: roundMoney(volumetricWeightKg),
    chargeableWeightKg: roundMoney(chargeableWeightKg),
    hasDimensions,
  };
};

export const calculateShippingBasePrice = (
  service: ShippingService,
  chargeableWeightKg: number,
  config: ShippingPricingConfig
): number => {
  const basePrice =
    service === "SAMEDAY_EASYBOX"
      ? config.easyboxBasePrice
      : config.homeBasePrice;
  const additionalKg = Math.max(0, Math.ceil(chargeableWeightKg - 1));
  return roundMoney(basePrice + additionalKg * config.additionalKgPrice);
};

export const calculateShippingQuote = (
  service: ShippingService,
  items: ShippingItemInput[],
  config: ShippingPricingConfig = getShippingPricingConfig()
): ShippingQuote => {
  const weights = calculateShippingWeights(items);
  const basePrice = calculateShippingBasePrice(
    service,
    weights.chargeableWeightKg,
    config
  );

  const fuelSurcharge = config.includeFuelIndex
    ? roundMoney((basePrice * config.fuelIndexPercent) / 100)
    : 0;
  const extraReteaFee = config.includeExtraRetea
    ? roundMoney(config.extraReteaFee)
    : 0;
  const atipicFee = config.includeAtipicFee ? roundMoney(config.atipicFee) : 0;

  const totalPrice = roundMoney(
    basePrice + fuelSurcharge + extraReteaFee + atipicFee
  );

  return {
    service,
    basePrice,
    totalPrice,
    breakdown: {
      fuelSurcharge,
      extraReteaFee,
      atipicFee,
    },
    weights,
    pricingVersion: config.pricingVersion,
  };
};

export const resolveShippingService = (
  methodId?: string | null
): ShippingService | null => {
  if (!methodId) return null;
  const normalized = methodId.includes(":")
    ? methodId.split(":")[1]
    : methodId;
  if (
    normalized === "easybox" ||
    normalized === "fanbox" ||
    normalized === "SAMEDAY_EASYBOX"
  ) {
    return "SAMEDAY_EASYBOX";
  }
  if (
    normalized === "home" ||
    normalized === "standard" ||
    normalized === "SAMEDAY_NEXTDAY_HOME"
  ) {
    return "SAMEDAY_NEXTDAY_HOME";
  }
  return null;
};
