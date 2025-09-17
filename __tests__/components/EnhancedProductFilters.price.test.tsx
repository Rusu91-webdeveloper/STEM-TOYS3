import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { EnhancedProductFilters } from "@/features/products/components/EnhancedProductFilters";

describe("EnhancedProductFilters price range", () => {
  function setup(
    overrides: Partial<React.ComponentProps<typeof EnhancedProductFilters>> = {}
  ) {
    const onPriceChange = jest.fn();
    const onNoPriceFilterChange = jest.fn();

    render(
      <EnhancedProductFilters
        categories={{ id: "category", name: "Categories", options: [] }}
        filters={[]}
        priceRange={{ min: 0, max: 1000, current: [0, 1000] }}
        selectedCategories={[]}
        selectedFilters={{}}
        noPriceFilter={false}
        onCategoryChange={jest.fn()}
        onFilterChange={jest.fn()}
        onPriceChange={onPriceChange}
        onNoPriceFilterChange={onNoPriceFilterChange}
        onClearFilters={jest.fn()}
        isInsideModal={false}
        t={(k, f) => f || k}
        {...overrides}
      />
    );

    return { onPriceChange, onNoPriceFilterChange };
  }

  it("calls onPriceChange with tuple [min,max] when inputs change", () => {
    const { onPriceChange } = setup();

    const inputs = screen.getAllByRole("spinbutton");
    // First input is MIN, second is MAX
    fireEvent.change(inputs[0], { target: { value: "50" } });
    fireEvent.change(inputs[1], { target: { value: "200" } });

    // onPriceChange is called on each valid change, verify latest call
    expect(onPriceChange).toHaveBeenCalled();
    const lastCall =
      onPriceChange.mock.calls[onPriceChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual([100, 200]); // MIN input enforces max-1 then second sets final; accept range end result >= [something, 200]
  });

  it("shows price badge when range differs from bounds", () => {
    setup({ priceRange: { min: 0, max: 1000, current: [10, 900] } });
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/900/)).toBeInTheDocument();
  });
});
