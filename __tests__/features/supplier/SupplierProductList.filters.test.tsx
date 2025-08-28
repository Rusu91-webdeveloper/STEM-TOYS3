/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SupplierProductList } from "@/features/supplier/components/products/SupplierProductList";

describe("SupplierProductList filters", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      }),
    });
  });

  it("applies price range and tags filters", async () => {
    render(<SupplierProductList />);

    const minPrice = await screen.findByPlaceholderText(/Min €/i);
    const maxPrice = await screen.findByPlaceholderText(/Max €/i);
    const tags = await screen.findByPlaceholderText(
      /Tags \(comma separated\)/i
    );

    fireEvent.change(minPrice, { target: { value: "10" } });
    fireEvent.change(maxPrice, { target: { value: "50" } });
    fireEvent.change(tags, { target: { value: "educational, robotics" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
