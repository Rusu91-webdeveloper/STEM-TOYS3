import React from "react";
import { render } from "@testing-library/react";
import { EnhancedProductFilters } from "@/features/products/components/EnhancedProductFilters";

describe("EnhancedProductFilters - Product Type select", () => {
  const t = (key: string, fallback?: string) => fallback || key;

  it('applies black text when "All Types" is selected', () => {
    const { container } = render(
      <EnhancedProductFilters
        filters={[]}
        selectedCategories={[]}
        selectedFilters={{}}
        noPriceFilter
        selectedLearningOutcomes={[]}
        selectedProductType="all"
        selectedSpecialCategories={[]}
        onProductTypeChange={() => {}}
        t={t}
      />
    );

    const trigger = container.querySelector("[role=combobox]");
    expect(trigger).toBeTruthy();
    expect(trigger?.className).toContain("text-black");
  });
});


