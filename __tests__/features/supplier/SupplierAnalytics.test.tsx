/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import { SupplierAnalytics } from "@/features/supplier/components/analytics/SupplierAnalytics";

describe("SupplierAnalytics component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders stats from API", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalProducts: 10,
        activeProducts: 8,
        totalOrders: 25,
        pendingOrders: 3,
        totalRevenue: 1200,
        monthlyRevenue: 300,
        commissionEarned: 180,
        pendingInvoices: 2,
      }),
    });

    render(<SupplierAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/Product Performance/i)).toBeInTheDocument();
      expect(screen.getByText("€1,200")).toBeInTheDocument();
      expect(screen.getByText("€300")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("8/10")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    render(<SupplierAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/i)).toBeInTheDocument();
    });
  });
});
