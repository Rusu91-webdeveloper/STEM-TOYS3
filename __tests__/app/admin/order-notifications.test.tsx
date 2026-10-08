import { fireEvent, render, screen } from "@testing-library/react";

import AdminOrderNotificationsBell from "@/app/admin/components/admin-order-notifications-bell";

jest.mock("@/components/ui/dropdown-menu", () => {
  const Container = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    DropdownMenu: Container,
    DropdownMenuContent: Container,
    DropdownMenuItem: Container,
    DropdownMenuLabel: Container,
    DropdownMenuTrigger: Container,
    DropdownMenuSeparator: () => <hr />,
  };
});

const response = (notifications: unknown[], ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: () => Promise.resolve({ notifications }),
});
const originalFetch = global.fetch;
const item = {
  id: "record-id",
  orderNumber: "TT-200",
  status: "SHIPPED",
  paymentStatus: "PAID",
  total: 888,
  currency: "EUR",
  createdAt: "2026-10-08T08:00:00Z",
  customerName: "Client de test",
  customerEmail: null,
  supplierOrderCount: 1,
  hasTracking: true,
  fulfillmentStatus: "SHIPPED",
  actionBucket: "in_progress",
  actionLabel: "In transit / awaiting delivery",
};

describe("truthful Romanian order notifications", () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue(response([item]));
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });
  it("shows the original order currency, translated actions and the record link", async () => {
    render(<AdminOrderNotificationsBell />);
    expect(await screen.findByText("În tranzit")).toBeVisible();
    expect(screen.getByText(/888,00.*EUR/)).toBeVisible();
    expect(screen.getByRole("link", { name: /TT-200/ })).toHaveAttribute(
      "href",
      "/admin/orders/record-id"
    );
    expect(
      screen.getByRole("button", { name: "Notificări comenzi" })
    ).toBeVisible();
  });
  it("reports unavailable data instead of claiming that there are no orders", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response([], false));
    render(<AdminOrderNotificationsBell />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Notificările nu au putut fi actualizate"
    );
    expect(screen.queryByText("Nu există comenzi recente.")).toBeNull();
  });
  it("labels retained notification data after refresh failure", async () => {
    render(<AdminOrderNotificationsBell />);
    await screen.findByText("În tranzit");
    (global.fetch as jest.Mock).mockResolvedValue(response([], false));
    fireEvent.click(
      screen.getByRole("button", { name: "Actualizează notificările" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ultimele date încărcate"
    );
    expect(screen.getByText("În tranzit")).toBeVisible();
    expect(screen.getByRole("button", { name: "Citite" })).toBeDisabled();
  });
});
