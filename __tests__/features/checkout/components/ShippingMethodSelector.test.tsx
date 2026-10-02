/**
 * Pure function extracted from ShippingMethodSelector for testing.
 * Maps quote response methods to ShippingMethod objects.
 */
export function mapQuoteMethods(
  methods: Array<{
    id: string;
    name: string;
    description: string;
    estimatedDelivery: string;
    price: number;
    singleShipmentPrice?: number;
    mixedSupplierSurcharge?: number;
    isMixedSupplierCart?: boolean;
    requiresPrepaid?: boolean;
    supplierCount?: number;
    supplierNames?: string[];
    shippingPolicyMessage?: string | null;
    courierId?: string;
    serviceId?: string;
    methodType?: "home" | "easybox";
    requiresLocker?: boolean;
    codGuaranteeHoldPrice?: number | null;
  }>,
  options: {
    isFreeShipping: boolean;
    mixedSupplierCart: boolean;
  }
) {
  return methods.map(method => ({
    id: method.id,
    name: method.name,
    description: method.description,
    estimatedDelivery: method.estimatedDelivery,
    courierId: method.courierId,
    serviceId: method.serviceId,
    methodType: method.methodType,
    requiresLocker: Boolean(method.requiresLocker),
    singleShipmentPrice: method.singleShipmentPrice,
    mixedSupplierSurcharge: method.mixedSupplierSurcharge,
    isMixedSupplierCart: Boolean(method.isMixedSupplierCart),
    requiresPrepaid: Boolean(method.requiresPrepaid),
    supplierCount: method.supplierCount,
    supplierNames: method.supplierNames,
    shippingPolicyMessage: method.shippingPolicyMessage || null,
    codGuaranteeHoldPrice: method.codGuaranteeHoldPrice ?? null,
    price: options.isFreeShipping
      ? options.mixedSupplierCart
        ? method.mixedSupplierSurcharge ?? method.price
        : 0
      : method.price,
  }));
}

describe("ShippingMethodSelector quote mapping", () => {
  it("preserves codGuaranteeHoldPrice when present", () => {
    const quoteMethods = [
      {
        id: "fancourier:standard",
        name: "FAN Courier Standard",
        description: "Livrare 1-2 zile",
        estimatedDelivery: "1-2 zile",
        price: 19.99,
        codGuaranteeHoldPrice: 19.99,
      },
    ];

    const mapped = mapQuoteMethods(quoteMethods, {
      isFreeShipping: false,
      mixedSupplierCart: false,
    });

    expect(mapped[0].codGuaranteeHoldPrice).toBe(19.99);
  });

  it("preserves codGuaranteeHoldPrice even when price is 0 due to free shipping", () => {
    const quoteMethods = [
      {
        id: "fancourier:standard",
        name: "FAN Courier Standard",
        description: "Livrare 1-2 zile",
        estimatedDelivery: "1-2 zile",
        price: 19.99,
        codGuaranteeHoldPrice: 19.99,
      },
    ];

    const mapped = mapQuoteMethods(quoteMethods, {
      isFreeShipping: true,
      mixedSupplierCart: false,
    });

    expect(mapped[0].price).toBe(0);
    expect(mapped[0].codGuaranteeHoldPrice).toBe(19.99);
  });

  it("sets codGuaranteeHoldPrice to null when missing from quote", () => {
    const quoteMethods = [
      {
        id: "fancourier:standard",
        name: "FAN Courier Standard",
        description: "Livrare 1-2 zile",
        estimatedDelivery: "1-2 zile",
        price: 19.99,
      },
    ];

    const mapped = mapQuoteMethods(quoteMethods, {
      isFreeShipping: false,
      mixedSupplierCart: false,
    });

    expect(mapped[0].codGuaranteeHoldPrice).toBeNull();
  });

  it("preserves explicit null codGuaranteeHoldPrice", () => {
    const quoteMethods = [
      {
        id: "fancourier:standard",
        name: "FAN Courier Standard",
        description: "Livrare 1-2 zile",
        estimatedDelivery: "1-2 zile",
        price: 0,
        codGuaranteeHoldPrice: null,
      },
    ];

    const mapped = mapQuoteMethods(quoteMethods, {
      isFreeShipping: false,
      mixedSupplierCart: false,
    });

    expect(mapped[0].codGuaranteeHoldPrice).toBeNull();
  });
});
