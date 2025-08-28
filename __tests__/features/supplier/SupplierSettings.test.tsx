import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SupplierSettings } from "@/features/supplier/components/settings/SupplierSettings";

// Mock fetch
global.fetch = vi.fn();

describe("SupplierSettings", () => {
  const mockSupplierData = {
    id: "supplier-123",
    companyName: "Test Company",
    companySlug: "test-company",
    description: "Test description",
    website: "https://test.com",
    phone: "+1234567890",
    vatNumber: "VAT123456789",
    businessAddress: "123 Test St",
    businessCity: "Test City",
    businessState: "Test State",
    businessCountry: "Test Country",
    businessPostalCode: "12345",
    contactPersonName: "John Doe",
    contactPersonEmail: "john@test.com",
    contactPersonPhone: "+1234567890",
    yearEstablished: 2020,
    employeeCount: 25,
    annualRevenue: "100000-500000",
    certifications: [],
    productCategories: [],
    commissionRate: 15.0,
    paymentTerms: 30,
    minimumOrderValue: 100.0,
    logo: null,
    catalogUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should render loading state initially", () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SupplierSettings />);

    expect(screen.getByText("Loading settings...")).toBeInTheDocument();
  });

  it("should render supplier settings form when data loads successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSupplierData,
    });

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    expect(screen.getByText("Company Information")).toBeInTheDocument();
    expect(screen.getByText("Contact Information")).toBeInTheDocument();
    expect(screen.getByText("Business Address")).toBeInTheDocument();
    expect(screen.getByText("Business Details")).toBeInTheDocument();
    expect(screen.getByText("Financial Settings")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();

    // Check form fields are populated
    expect(screen.getByDisplayValue("Test Company")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://test.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+1234567890")).toBeInTheDocument();
    expect(screen.getByDisplayValue("VAT123456789")).toBeInTheDocument();
  });

  it("should display error when API call fails", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load settings")).toBeInTheDocument();
    });
  });

  it("should display error when API returns error response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load settings")).toBeInTheDocument();
    });
  });

  it("should update form fields when user types", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSupplierData,
    });

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Company")).toBeInTheDocument();
    });

    const companyNameInput = screen.getByDisplayValue("Test Company");
    fireEvent.change(companyNameInput, {
      target: { value: "Updated Company" },
    });

    expect(screen.getByDisplayValue("Updated Company")).toBeInTheDocument();
  });

  it("should save settings successfully", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSupplierData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, supplier: mockSupplierData }),
      });

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Settings saved successfully!")
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/supplier/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockSupplierData),
    });
  });

  it("should display error when save fails", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSupplierData,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Save failed" }),
      });

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Save failed")).toBeInTheDocument();
    });
  });

  it("should handle network errors during save", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSupplierData,
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("should disable save button while saving", async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSupplierData,
      })
      .mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({ ok: true, json: async () => ({ success: true }) }),
              100
            )
          )
      );

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it("should handle numeric input fields correctly", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSupplierData,
    });

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("2020")).toBeInTheDocument();
    });

    const yearInput = screen.getByDisplayValue("2020");
    fireEvent.change(yearInput, { target: { value: "2021" } });

    expect(screen.getByDisplayValue("2021")).toBeInTheDocument();
  });

  it("should handle select dropdown correctly", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSupplierData,
    });

    render(<SupplierSettings />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    // Find the revenue select and click it
    const revenueSelect = screen.getByText("$100,000 - $500,000");
    fireEvent.click(revenueSelect);

    // Should show the select options
    await waitFor(() => {
      expect(screen.getByText("$0 - $50,000")).toBeInTheDocument();
      expect(screen.getByText("$50,000 - $100,000")).toBeInTheDocument();
      expect(screen.getByText("$100,000 - $500,000")).toBeInTheDocument();
      expect(screen.getByText("$500,000 - $1,000,000")).toBeInTheDocument();
      expect(screen.getByText("$1,000,000+")).toBeInTheDocument();
    });
  });
});
