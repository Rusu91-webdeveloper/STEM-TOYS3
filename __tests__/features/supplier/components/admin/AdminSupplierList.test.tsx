/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminSupplierList } from "@/features/supplier/components/admin/AdminSupplierList";
import { type Supplier } from "@/features/supplier/types/supplier";

// Mock fetch
global.fetch = jest.fn();

const mockSuppliers: Supplier[] = [
  {
    id: "supplier-1",
    userId: "user-1",
    companyName: "TechCorp Inc",
    companySlug: "techcorp-inc",
    description: "Leading tech supplier",
    website: "https://techcorp.com",
    phone: "+1234567890",
    vatNumber: "VAT123456",
    taxId: "TAX789012",
    businessAddress: "123 Tech Street",
    businessCity: "Tech City",
    businessState: "Tech State",
    businessCountry: "USA",
    businessPostalCode: "12345",
    contactPersonName: "John Doe",
    contactPersonEmail: "john@techcorp.com",
    contactPersonPhone: "+1234567890",
    yearEstablished: 2010,
    employeeCount: 50,
    annualRevenue: "5000000",
    certifications: ["ISO 9001", "ISO 14001"],
    productCategories: ["Electronics", "Software"],
    status: "PENDING",
    commissionRate: 15.0,
    paymentTerms: 30,
    minimumOrderValue: 1000.0,
    termsAccepted: true,
    privacyAccepted: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    anpcApproval: false,
    iscApproval: false,
    romanianComplianceStatus: "PENDING",
    romanianCurrency: "RON",
    romanianPaymentTerms: 30,
  },
  {
    id: "supplier-2",
    userId: "user-2",
    companyName: "EduTools Ltd",
    companySlug: "edutools-ltd",
    description: "Educational tools supplier",
    website: "https://edutools.com",
    phone: "+1987654321",
    vatNumber: "VAT654321",
    taxId: "TAX210987",
    businessAddress: "456 Education Ave",
    businessCity: "Edu City",
    businessState: "Edu State",
    businessCountry: "Canada",
    businessPostalCode: "67890",
    contactPersonName: "Jane Smith",
    contactPersonEmail: "jane@edutools.com",
    contactPersonPhone: "+1987654321",
    yearEstablished: 2015,
    employeeCount: 25,
    annualRevenue: "2000000",
    certifications: ["ISO 9001"],
    productCategories: ["Educational Materials", "STEM Kits"],
    status: "APPROVED",
    approvedAt: new Date("2024-01-15"),
    commissionRate: 12.0,
    paymentTerms: 45,
    minimumOrderValue: 500.0,
    termsAccepted: true,
    privacyAccepted: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-15"),
    anpcApproval: true,
    iscApproval: true,
    romanianComplianceStatus: "APPROVED",
    romanianCurrency: "RON",
    romanianPaymentTerms: 30,
  },
  {
    id: "supplier-3",
    userId: "user-3",
    companyName: "Rejected Supplies",
    companySlug: "rejected-supplies",
    description: "Rejected supplier",
    website: "https://rejected.com",
    phone: "+1122334455",
    businessAddress: "789 Fail Street",
    businessCity: "Fail City",
    businessState: "Fail State",
    businessCountry: "UK",
    businessPostalCode: "11223",
    contactPersonName: "Bob Wilson",
    contactPersonEmail: "bob@rejected.com",
    contactPersonPhone: "+1122334455",
    certifications: [],
    productCategories: ["Hardware"],
    status: "REJECTED",
    rejectionReason: "Does not meet quality standards",
    commissionRate: 15.0,
    paymentTerms: 30,
    minimumOrderValue: 1000.0,
    termsAccepted: true,
    privacyAccepted: true,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    anpcApproval: false,
    iscApproval: false,
    romanianComplianceStatus: "REJECTED",
    romanianCurrency: "RON",
    romanianPaymentTerms: 30,
  },
];

const mockSuppliersResponse = {
  suppliers: mockSuppliers,
  pagination: {
    page: 1,
    limit: 10,
    total: 3,
    pages: 1,
  },
  filters: {
    statusCounts: {
      PENDING: 1,
      APPROVED: 1,
      REJECTED: 1,
      SUSPENDED: 0,
      INACTIVE: 0,
      TOTAL: 3,
    },
  },
};

describe("AdminSupplierList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should render loading state initially", () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AdminSupplierList />);

    expect(screen.getByText("Loading suppliers...")).toBeInTheDocument();
  });

  it("should render suppliers list when data loads successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("Supplier Management")).toBeInTheDocument();
    });

    // Check header
    expect(
      screen.getByText("Manage supplier applications and approvals")
    ).toBeInTheDocument();

    // Check stats cards
    expect(screen.getByText("Total Suppliers")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();

    // Check suppliers table
    expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    expect(screen.getByText("EduTools Ltd")).toBeInTheDocument();
    expect(screen.getByText("Rejected Supplies")).toBeInTheDocument();
  });

  it("should display error message when API call fails", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("should display error message when API returns error response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch suppliers")).toBeInTheDocument();
    });
  });

  it("should filter suppliers by search term", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Search for "TechCorp"
    const searchInput = screen.getByPlaceholderText("Search suppliers...");
    fireEvent.change(searchInput, { target: { value: "TechCorp" } });

    // Should still show TechCorp but not others
    expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    expect(screen.queryByText("EduTools Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Rejected Supplies")).not.toBeInTheDocument();
  });

  it("should filter suppliers by status", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Filter by APPROVED status
    const statusSelect = screen.getByText("Filter by status");
    fireEvent.click(statusSelect);

    const approvedOption = screen.getByText("Approved");
    fireEvent.click(approvedOption);

    // Should show only approved supplier
    expect(screen.queryByText("TechCorp Inc")).not.toBeInTheDocument();
    expect(screen.getByText("EduTools Ltd")).toBeInTheDocument();
    expect(screen.queryByText("Rejected Supplies")).not.toBeInTheDocument();
  });

  it("should sort suppliers by company name", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Sort by company name
    const sortSelect = screen.getByText("Sort by");
    fireEvent.click(sortSelect);

    const companyNameOption = screen.getByText("Company Name");
    fireEvent.click(companyNameOption);

    // Should sort alphabetically: EduTools, Rejected Supplies, TechCorp
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("EduTools Ltd");
    expect(rows[2]).toHaveTextContent("Rejected Supplies");
    expect(rows[3]).toHaveTextContent("TechCorp Inc");
  });

  it("should toggle sort order", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Click sort order toggle (should be descending by default)
    const sortOrderButton = screen.getByText("↓ Descending");
    fireEvent.click(sortOrderButton);

    // Should now show ascending
    expect(screen.getByText("↑ Ascending")).toBeInTheDocument();
  });

  it("should show approve/reject buttons for pending suppliers", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // TechCorp is PENDING, so should have action buttons
    const approveButtons = screen.getAllByRole("button", { name: /approve/i });
    const rejectButtons = screen.getAllByRole("button", { name: /reject/i });

    expect(approveButtons.length).toBeGreaterThan(0);
    expect(rejectButtons.length).toBeGreaterThan(0);
  });

  it("should not show action buttons for non-pending suppliers", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("EduTools Ltd")).toBeInTheDocument();
    });

    // EduTools is APPROVED, should not have approve/reject buttons in the table actions
    // (only in the detailed view)
    const tableRows = screen.getAllByRole("row");
    const eduToolsRow = tableRows.find(row =>
      row.textContent?.includes("EduTools Ltd")
    );

    // The approved supplier should not have approve/reject buttons in the table
    expect(eduToolsRow).not.toHaveTextContent("Approve");
    expect(eduToolsRow).not.toHaveTextContent("Reject");
  });

  it("should approve supplier successfully", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuppliersResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: "Supplier approved" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSuppliersResponse,
          suppliers: mockSuppliers.map(s =>
            s.id === "supplier-1" ? { ...s, status: "APPROVED" as const } : s
          ),
        }),
      });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Find and click approve button for TechCorp
    const approveButtons = screen
      .getAllByRole("button")
      .filter(button => button.querySelector('[data-lucide="check-circle"]'));
    fireEvent.click(approveButtons[0]);

    // Should refresh the list and update status
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/suppliers/supplier-1",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APPROVED" }),
        }
      );
    });
  });

  it("should reject supplier successfully", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuppliersResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: "Supplier rejected" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockSuppliersResponse,
          suppliers: mockSuppliers.map(s =>
            s.id === "supplier-1" ? { ...s, status: "REJECTED" as const } : s
          ),
        }),
      });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Find and click reject button for TechCorp
    const rejectButtons = screen
      .getAllByRole("button")
      .filter(button => button.querySelector('[data-lucide="x-circle"]'));
    fireEvent.click(rejectButtons[0]);

    // Should refresh the list and update status
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/suppliers/supplier-1",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REJECTED" }),
        }
      );
    });
  });

  it("should display error when status update fails", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuppliersResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Try to approve supplier
    const approveButtons = screen
      .getAllByRole("button")
      .filter(button => button.querySelector('[data-lucide="check-circle"]'));
    fireEvent.click(approveButtons[0]);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText("Failed to update status")).toBeInTheDocument();
    });
  });

  it("should refresh suppliers list when refresh button is clicked", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    // Should call API again
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("should display empty state when no suppliers match search", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Search for non-existent supplier
    const searchInput = screen.getByPlaceholderText("Search suppliers...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    // Should show empty state
    expect(
      screen.getByText("No suppliers found matching your criteria.")
    ).toBeInTheDocument();
  });

  it("should display status badges correctly", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("should display supplier details correctly", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuppliersResponse,
    });

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Check contact information display
    expect(screen.getByText("john@techcorp.com")).toBeInTheDocument();
    expect(screen.getByText("jane@edutools.com")).toBeInTheDocument();
    expect(screen.getByText("bob@rejected.com")).toBeInTheDocument();

    // Check categories display
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("STEM Kits")).toBeInTheDocument();

    // Check dates
    expect(screen.getByText("1/1/2024")).toBeInTheDocument();
  });

  it("should handle network errors gracefully during status updates", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuppliersResponse,
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(<AdminSupplierList />);

    await waitFor(() => {
      expect(screen.getByText("TechCorp Inc")).toBeInTheDocument();
    });

    // Try to approve supplier
    const approveButtons = screen
      .getAllByRole("button")
      .filter(button => button.querySelector('[data-lucide="check-circle"]'));
    fireEvent.click(approveButtons[0]);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText("Failed to update status")).toBeInTheDocument();
    });
  });
});
