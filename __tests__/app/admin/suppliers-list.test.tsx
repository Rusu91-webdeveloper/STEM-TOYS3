import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminSupplierList } from "@/features/supplier/components/admin/AdminSupplierList";

const originalFetch = global.fetch;
const supplier = {
  id: "supplier-original-ID",
  companyName: "Furnizor de test",
  businessCity: "Cluj",
  businessCountry: "România",
  contactPersonEmail: "supplier@example.test",
  contactPersonPhone: "+40700000000",
  status: "APPROVED",
  createdAt: "2026-10-08",
  productCategories: [],
  _count: { products: 2, orders: 1 },
};
const response = (page: number) => ({
  ok: true,
  json: () =>
    Promise.resolve({
      suppliers: [
        {
          ...supplier,
          companyName: page === 1 ? "Furnizor de test" : "Furnizor pagina doi",
        },
      ],
      pagination: { page, limit: 20, total: 21, pages: 2 },
      filters: { statusCounts: { APPROVED: 21 } },
    }),
});
describe("supplier list pagination and truthful availability", () => {
  beforeEach(() => {
    global.fetch = jest
      .fn()
      .mockImplementation((url: string) =>
        Promise.resolve(
          response(
            Number(new URL(url, "http://localhost").searchParams.get("page"))
          )
        )
      );
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("uses global totals and loads the second page; searches reset to page one on the server", async () => {
    render(<AdminSupplierList />);
    expect(await screen.findByText("Furnizor de test")).toBeVisible();
    expect(screen.getByText("Pagina 1 din 2 · 21 furnizori")).toBeVisible();
    expect(screen.queryByText("Calificativ")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Înainte$/ }));
    expect(await screen.findByText("Furnizor pagina doi")).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Caută furnizori" }), {
      target: { value: "Produs" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Aplică căutarea furnizorilor" })
    );
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringMatching(/page=1.*search=Produs/),
        expect.objectContaining({ cache: "no-store" })
      )
    );
  });
  it("shows an error without zero totals or an empty business list when loading fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    });
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<AdminSupplierList />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Furnizorii nu au putut fi încărcați"
    );
    expect(
      screen.queryByText("Nu există furnizori pentru filtrele alese.")
    ).toBeNull();
    expect(screen.queryByText("Total furnizori")).toBeNull();
    error.mockRestore();
  });
});
