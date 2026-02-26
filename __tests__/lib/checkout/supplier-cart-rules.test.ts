import {
  analyzeSupplierCartComposition,
  applyMixedSupplierShippingRules,
  calculateMixedSupplierShippingSurcharge,
} from "@/lib/checkout/supplier-cart-rules";

describe("supplier cart checkout rules", () => {
  it("detects mixed supplier physical cart", () => {
    const analysis = analyzeSupplierCartComposition(
      [
        { productId: "p1", isBook: false, quantity: 1 },
        { productId: "p2", isBook: false, quantity: 1 },
      ],
      [
        { id: "p1", supplierId: "s1", supplier: { name: "Kidstory" } },
        { id: "p2", supplierId: "s2", supplier: { name: "Boribon" } },
      ]
    );

    expect(analysis.isMixedSupplierCart).toBe(true);
    expect(analysis.requiresPrepaid).toBe(true);
    expect(analysis.supplierCount).toBe(2);
    expect(analysis.mixedSupplierExtraShipments).toBe(1);
    expect(analysis.supplierNames).toEqual(["Kidstory", "Boribon"]);
  });

  it("ignores digital-only lines for mixed supplier detection", () => {
    const analysis = analyzeSupplierCartComposition(
      [{ productId: "book1", isBook: true, quantity: 1 }],
      []
    );

    expect(analysis.isMixedSupplierCart).toBe(false);
    expect(analysis.supplierCount).toBe(0);
  });

  it("charges only split shipment surcharge when free shipping is eligible", () => {
    const surcharge = calculateMixedSupplierShippingSurcharge(25, {
      isMixedSupplierCart: true,
      mixedSupplierExtraShipments: 1,
    });
    expect(surcharge).toBe(25);

    const result = applyMixedSupplierShippingRules({
      singleShipmentPrice: 25,
      freeShippingEligible: true,
      analysis: {
        isMixedSupplierCart: true,
        mixedSupplierExtraShipments: 1,
      },
    });

    expect(result.mixedSupplierSurcharge).toBe(25);
    expect(result.finalShippingCost).toBe(25);
  });
});
