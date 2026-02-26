import {
  deriveOrderFulfillmentSummary,
  normalizeSupplierFulfillmentPhase,
} from "@/lib/utils/supplier-fulfillment";

describe("supplier fulfillment helpers", () => {
  it("maps legacy pending supplier lines to READY_TO_PLACE", () => {
    expect(
      normalizeSupplierFulfillmentPhase({
        status: "PENDING",
      })
    ).toBe("READY_TO_PLACE");
  });

  it("derives PARTIALLY_SHIPPED for mixed progress orders", () => {
    const summary = deriveOrderFulfillmentSummary([
      {
        status: "SHIPPED",
        supplierId: "kidstory",
        trackingNumber: "AWB1",
      },
      {
        status: "PENDING",
        supplierId: "boribon",
      },
    ]);

    expect(summary.dbOrderStatus).toBe("SHIPPED");
    expect(summary.displayStatus).toBe("PARTIALLY_SHIPPED");
    expect(summary.hasMixedSuppliers).toBe(true);
  });

  it("derives ISSUE when no shipment exists but one line is out of stock", () => {
    const summary = deriveOrderFulfillmentSummary([
      {
        status: "ISSUE_OOS",
        supplierId: "kidstory",
      },
      {
        status: "READY_TO_PLACE",
        supplierId: "boribon",
      },
    ]);

    expect(summary.dbOrderStatus).toBe("PROCESSING");
    expect(summary.displayStatus).toBe("ISSUE");
    expect(summary.hasIssues).toBe(true);
  });
});
