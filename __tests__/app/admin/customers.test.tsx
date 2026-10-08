import { fireEvent, render, screen } from "@testing-library/react";

import CustomersPage from "@/app/admin/customers/page";

jest.mock("@/components/admin/RoleChangeDialog", () => ({
  RoleChangeDialog: () => null,
}));
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const originalFetch = global.fetch;
const customer = {
  id: "CaseSensitiveID",
  name: "Client de test",
  email: "customer@dashboard.local",
  joined: "2026-10-08",
  orders: 2,
  spent: 120,
  status: "Active",
  role: "CUSTOMER",
};
const response = (ok = true) => ({
  ok,
  json: () =>
    Promise.resolve({
      customers: [customer],
      pagination: { total: 25, page: 1, limit: 10, pages: 3 },
    }),
});

describe("customer list trust", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(response());
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("keeps original IDs and shows paid RON spending with the correct total", async () => {
    render(<CustomersPage />);
    expect(
      await screen.findByRole("link", { name: "Client de test" })
    ).toHaveAttribute("href", "/admin/customers/CaseSensitiveID");
    expect(screen.getByText(/120,00.*RON/)).toBeVisible();
    expect(screen.getByText("Se afișează 1 din 25 clienți")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Email All" })).toBeNull();
  });
  it("does not claim an empty customer list when loading failed", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response(false));
    render(<CustomersPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Lista clienților nu a putut fi încărcată"
    );
    expect(screen.queryByText(/Nu există clienți/)).toBeNull();
    expect(screen.queryByText(/Se afișează/)).toBeNull();
  });
  it("labels the last successful data when a refresh fails", async () => {
    render(<CustomersPage />);
    await screen.findByText("Client de test");
    (global.fetch as jest.Mock).mockResolvedValue(response(false));
    fireEvent.click(screen.getByRole("button", { name: "Reîncarcă clienții" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ultima situație încărcată"
    );
    expect(screen.getByText("Client de test")).toBeVisible();
  });
});
