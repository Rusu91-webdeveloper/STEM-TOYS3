type SupplierProductRef = {
  id: string;
  supplierId?: string | null;
  supplier?: {
    id?: string;
    name?: string | null;
    companyName?: string | null;
  } | null;
};

type CartLineLike = {
  productId: string;
  quantity?: number;
  isBook?: boolean;
};

export interface SupplierCartAnalysis {
  isMixedSupplierCart: boolean;
  supplierCount: number;
  supplierNames: string[];
  fulfillmentSourceIds: string[];
  requiresPrepaid: boolean;
  mixedSupplierExtraShipments: number;
}

const INTERNAL_SOURCE_ID = "__INTERNAL__";
const INTERNAL_SOURCE_NAME = "Internal stock";

const round2 = (value: number) => Math.round(value * 100) / 100;

export function analyzeSupplierCartComposition(
  cartItems: CartLineLike[],
  products: SupplierProductRef[]
): SupplierCartAnalysis {
  const physicalLines = cartItems.filter(item => item.isBook !== true);
  const productMap = new Map(products.map(product => [product.id, product]));

  const sourceMap = new Map<string, string>();

  for (const line of physicalLines) {
    const product = productMap.get(line.productId);
    const sourceId = product?.supplierId || INTERNAL_SOURCE_ID;
    const sourceName =
      product?.supplier?.name ||
      product?.supplier?.companyName ||
      (sourceId === INTERNAL_SOURCE_ID ? INTERNAL_SOURCE_NAME : sourceId);

    if (!sourceMap.has(sourceId)) {
      sourceMap.set(sourceId, sourceName);
    }
  }

  const supplierCount = sourceMap.size;
  const isMixedSupplierCart = supplierCount > 1;
  const mixedSupplierExtraShipments = Math.max(0, supplierCount - 1);

  return {
    isMixedSupplierCart,
    supplierCount,
    supplierNames: Array.from(sourceMap.values()),
    fulfillmentSourceIds: Array.from(sourceMap.keys()),
    requiresPrepaid: isMixedSupplierCart,
    mixedSupplierExtraShipments,
  };
}

export function calculateMixedSupplierShippingSurcharge(
  singleShipmentPrice: number,
  analysis: Pick<SupplierCartAnalysis, "isMixedSupplierCart" | "mixedSupplierExtraShipments">
): number {
  if (!analysis.isMixedSupplierCart || analysis.mixedSupplierExtraShipments <= 0) {
    return 0;
  }

  const base = Number.isFinite(singleShipmentPrice)
    ? Math.max(0, singleShipmentPrice)
    : 0;

  return round2(base * analysis.mixedSupplierExtraShipments);
}

export function applyMixedSupplierShippingRules(input: {
  singleShipmentPrice: number;
  freeShippingEligible: boolean;
  analysis: Pick<
    SupplierCartAnalysis,
    "isMixedSupplierCart" | "mixedSupplierExtraShipments"
  >;
}) {
  const base = Number.isFinite(input.singleShipmentPrice)
    ? Math.max(0, input.singleShipmentPrice)
    : 0;
  const surcharge = calculateMixedSupplierShippingSurcharge(base, input.analysis);

  const firstShipmentCharge = input.freeShippingEligible ? 0 : base;
  const finalShippingCost = round2(firstShipmentCharge + surcharge);

  return {
    singleShipmentPrice: round2(base),
    freeShippingEligible: input.freeShippingEligible,
    mixedSupplierSurcharge: surcharge,
    finalShippingCost,
  };
}

