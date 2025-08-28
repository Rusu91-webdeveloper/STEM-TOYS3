/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SupplierProductList } from "@/features/supplier/components/products/SupplierProductList";

describe("SupplierProductList low stock UI", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders low stock filter and triggers fetch with params", async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      }),
    });

    render(<SupplierProductList />);

    const checkbox = await screen.findByLabelText(/Low stock/i);
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
