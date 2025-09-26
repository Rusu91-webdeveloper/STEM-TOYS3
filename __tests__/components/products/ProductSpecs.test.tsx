import React from "react";
import { render, screen } from "@testing-library/react";
import ProductSpecs from "@/features/products/components/ProductSpecs";

describe("ProductSpecs", () => {
  it("renders humanized labels and hides sensitive specs", () => {
    const product: any = {
      ageGroup: "ELEMENTARY_6_8",
      productType: "ROBOTICS",
      learningOutcomes: ["CRITICAL_THINKING", "CREATIVITY"],
      specialCategories: ["NEW_ARRIVALS", "SALE_ITEMS"],
      sku: "SECRET",
      barcode: "1234567890123",
      weight: 2.3,
      dimensions: { w: 10, h: 20 },
      supplier: { companySlug: "brand", companyName: "Brand" },
      tags: ["robot", "kids"],
    };

    render(<ProductSpecs product={product} />);

    expect(screen.getByText(/Elementary/i)).toBeInTheDocument();
    expect(screen.getByText(/Robotics/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical Thinking/i)).toBeInTheDocument();
    expect(screen.getByText(/Creativity/i)).toBeInTheDocument();
    expect(screen.getByText(/New Arrivals/i)).toBeInTheDocument();
    expect(screen.getByText(/Sale Items/i)).toBeInTheDocument();

    // Sensitive entries should not be present in UI
    expect(screen.queryByText(/SKU/i)).toBeNull();
    expect(screen.queryByText(/GTIN/i)).toBeNull();
    expect(screen.queryByText(/Dimensions/i)).toBeNull();
    expect(screen.queryByText(/Weight/i)).toBeNull();
  });
});
