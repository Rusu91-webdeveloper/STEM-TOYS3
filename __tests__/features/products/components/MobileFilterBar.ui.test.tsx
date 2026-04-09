import React from "react";
import { render, screen } from "@testing-library/react";

import { MobileFilterBar } from "@/features/products/components/MobileFilterBar";

describe("MobileFilterBar", () => {
  const t = (key: string, fallback?: string) => fallback || key;

  it("renders the compact category, age, and price chips for mobile", () => {
    render(
      <MobileFilterBar
        activeFilterCount={2}
        categoryLabel="Category"
        ageLabel="6-8 years"
        priceLabel="50-100 lei"
        categoryActive={false}
        ageActive={true}
        priceActive={true}
        onOpenPanel={() => {}}
        onClearFilters={() => {}}
        searchQuery=""
        onSearchQueryChange={() => {}}
        onClearSearch={() => {}}
        t={t}
      />
    );

    expect(screen.getByRole("button", { name: /Category/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /6-8 years/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /50-100 lei/i })).toBeTruthy();
    expect(screen.getByPlaceholderText(/Search toys by name/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Clear all/i })).toBeTruthy();
  });
});
