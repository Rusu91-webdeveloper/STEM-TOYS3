import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { OwnerDashboard } from "@/app/admin/components/owner-dashboard";
import type { DashboardData } from "@/lib/admin/dashboard-types";

const data: DashboardData = {
  summary: {
    paidOrderValue: 1234,
    paidOrders: 3,
    orders: 5,
    cancelledOrders: 1,
    customers: 2,
  },
  previous: {
    paidOrderValue: 0,
    paidOrders: 0,
    orders: 0,
    cancelledOrders: 0,
    customers: 0,
  },
  catalog: { activeProducts: 12, activeSuppliers: 2 },
  attention: {
    awaitingPayment: 1,
    shippingReview: 1,
    openReturns: 2,
    outOfStock: 3,
  },
  recentOrders: [
    {
      id: "order-record-id",
      orderNumber: "TT-001",
      customerId: "customer-record-id",
      customer: "Client de test",
      date: "2026-10-08T08:00:00Z",
      amount: 120,
      currency: "RON",
      status: "PROCESSING",
      paymentStatus: "PAID",
    },
  ],
  topProducts: [
    { id: "product-id", name: "Robot de test", sales: 2, revenue: 100 },
  ],
  salesByDay: [{ date: "2026-10-08", value: 1234 }],
  metadata: {
    generatedAt: "2026-10-08T08:00:00Z",
    start: "2026-09-08T21:00:00Z",
    end: "2026-10-08T08:00:00Z",
    previousStart: "2026-08-09T21:00:00Z",
    days: 30,
    currency: "RON",
    timezone: "Europe/Bucharest",
  },
};
const operations = {
  supplierHealth: [],
  summary: {
    readyToPlaceCount: 1,
    awbWorkCount: 0,
    issueCount: 0,
    overdueIssueCount: 0,
    unnotifiedIssueCount: 0,
    manualRefundsPendingCount: 0,
  },
};
const response = (value: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: () => Promise.resolve(value),
});
const originalFetch = global.fetch;

describe("owner dashboard data trust", () => {
  beforeEach(() => {
    global.fetch = jest.fn(input =>
      Promise.resolve(
        response(String(input).includes("operations") ? operations : data)
      )
    ) as jest.Mock;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows real records, payment status and correct record links", async () => {
    render(<OwnerDashboard />);
    expect(await screen.findByText("Client de test")).toHaveAttribute(
      "href",
      "/admin/customers/customer-record-id"
    );
    expect(screen.getByRole("link", { name: "TT-001" })).toHaveAttribute(
      "href",
      "/admin/orders/order-record-id"
    );
    expect(screen.getByText("Achitată")).toBeVisible();
    expect(screen.getByText("În procesare")).toBeVisible();
    expect(screen.getAllByText("Fără bază de comparație")).toHaveLength(3);
    expect(screen.queryByText("+100%")).toBeNull();
  });
  it("shows an error instead of zero sales after a failed load", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({}, false));
    render(<OwnerDashboard />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Datele nu au putut fi încărcate"
    );
    expect(screen.queryByText("Valoare comenzi achitate")).toBeNull();
  });
  it("keeps business data visible when the independent operations request fails", async () => {
    (global.fetch as jest.Mock).mockImplementation(input =>
      Promise.resolve(
        response(
          String(input).includes("operations") ? {} : data,
          !String(input).includes("operations")
        )
      )
    );
    render(<OwnerDashboard />);
    expect(await screen.findByText("Valoare comenzi achitate")).toBeVisible();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Situația operațională"
    );
    expect(
      screen.queryByText("Nu există sarcini în categoriile verificate.")
    ).toBeNull();
  });
  it("does not show previous-period figures while a new period is loading", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    const next = new Promise(done => {
      resolve = done;
    });
    render(<OwnerDashboard report />);
    await screen.findByText("Valoare comenzi achitate");
    (global.fetch as jest.Mock).mockReturnValue(next);
    fireEvent.change(screen.getByLabelText("Perioada raportului"), {
      target: { value: "7" },
    });
    expect(screen.queryByText("Valoare comenzi achitate")).toBeNull();
    await act(async () => {
      resolve(
        response({ ...data, summary: { ...data.summary, paidOrderValue: 700 } })
      );
      await Promise.resolve();
    });
    expect(await screen.findByText(/700,00/)).toBeVisible();
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/admin/dashboard?period=7",
      expect.objectContaining({ cache: "no-store" })
    );
  });
  it("ignores an older request that resolves after the latest period", async () => {
    let resolveOld: (value: unknown) => void = () => undefined;
    (global.fetch as jest.Mock).mockReturnValueOnce(
      new Promise(done => {
        resolveOld = done;
      })
    );
    render(<OwnerDashboard report />);
    fireEvent.change(screen.getByLabelText("Perioada raportului"), {
      target: { value: "7" },
    });
    await screen.findByText("Valoare comenzi achitate");
    await act(async () => {
      resolveOld(
        response({
          ...data,
          summary: { ...data.summary, paidOrderValue: 9999 },
        })
      );
      await Promise.resolve();
    });
    expect(screen.queryByText(/9.999,00/)).toBeNull();
  });
  it("marks retained data as stale after a refresh failure", async () => {
    render(<OwnerDashboard report />);
    await screen.findByText("Valoare comenzi achitate");
    (global.fetch as jest.Mock).mockResolvedValue(response({}, false));
    fireEvent.click(
      screen.getByRole("button", { name: "Actualizează datele" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ultima situație încărcată"
    );
    expect(screen.getByText("Valoare comenzi achitate")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Reîncearcă" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  });
});
