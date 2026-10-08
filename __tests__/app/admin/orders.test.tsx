import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import OrdersPage from "@/app/admin/orders/page";
import { downloadCsv } from "@/lib/admin/csv-export";

let mockCustomerId: string | null = null;
const mockToast = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(mockCustomerId ? { customerId: mockCustomerId } : {}),
}));
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));
jest.mock("@/lib/admin/csv-export", () => ({ downloadCsv: jest.fn() }));
const originalFetch = global.fetch;
const order = {
  id: "ORD-EUR",
  dbId: "OriginalCaseID",
  customer: "Client",
  email: "client@example.test",
  date: "2026-10-08",
  total: 888,
  currency: "EUR",
  paymentStatus: "PAID",
  status: "Processing",
  payment: "card",
  items: 1,
  suppliers: [],
  workflowLabel: "Allocate supplier lines",
  workflowBucket: "needs_action",
};
const response = (page: number) => ({
  ok: true,
  json: () =>
    Promise.resolve({
      orders: [{ ...order, id: page === 2 ? "ORD-PAGE-2" : order.id }],
      pagination: { page, limit: 10, total: 11, pages: 2 },
    }),
});
describe("order list business workflows", () => {
  beforeEach(() => {
    mockCustomerId = null;
    jest.clearAllMocks();
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
  it("retains original currency and database IDs in the list and exported page", async () => {
    render(<OrdersPage />);
    expect(
      (await screen.findAllByRole("link", { name: "ORD-EUR" }))[0]
    ).toHaveAttribute("href", "/admin/orders/OriginalCaseID");
    expect(screen.getAllByText(/888,00.*EUR/)[0]).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Exportă pagina" }));
    expect(downloadCsv).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["Monedă"]),
      [expect.arrayContaining([888, "EUR"])]
    );
  });
  it("searches on the server from page one, then resets all filters when opening another customer's history", async () => {
    const view = render(<OrdersPage />);
    (await screen.findAllByRole("link", { name: "ORD-EUR" }))[0];
    fireEvent.click(screen.getByRole("button", { name: /^Înainte$/ }));
    await screen.findAllByRole("link", { name: "ORD-PAGE-2" });
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "ORD" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Caută comenzi$/ }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringMatching(/search=ORD&page=1/),
        expect.any(Object)
      )
    );
    mockCustomerId = "CustomerOriginalID";
    view.rerender(<OrdersPage />);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/admin/orders?customerId=CustomerOriginalID&page=1&limit=10",
        expect.objectContaining({ cache: "no-store" })
      )
    );
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
  it("reports unavailable data without claiming zero orders or offering an empty export", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<OrdersPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Lista comenzilor nu a putut fi încărcată"
    );
    expect(
      screen.getByRole("button", { name: "Exportă pagina" })
    ).toBeDisabled();
    expect(screen.queryByText(/Se afișează/)).toBeNull();
    expect(screen.queryByText("Comenzi pe pagină")).toBeNull();
    error.mockRestore();
  });
});
