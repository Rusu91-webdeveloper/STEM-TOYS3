import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createMocks } from "node-mocks-http";
import { PUT } from "@/app/api/supplier/settings/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Mock dependencies
vi.mock("@/lib/auth");
vi.mock("@/lib/db");
vi.mock("@/lib/logger");

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db);

describe("/api/supplier/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("PUT", () => {
    it("should update supplier settings successfully", async () => {
      // Mock authenticated supplier session
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "supplier@test.com",
          role: "SUPPLIER",
        },
      } as any);

      // Mock supplier exists
      mockDb.supplier.findUnique.mockResolvedValue({
        id: "supplier-123",
      } as any);

      // Mock successful update
      mockDb.supplier.update.mockResolvedValue({
        id: "supplier-123",
        companyName: "Updated Company",
        description: "Updated description",
        website: "https://updated.com",
        phone: "+1234567890",
        vatNumber: "VAT123456789",
        businessAddress: "123 Updated St",
        businessCity: "Updated City",
        businessState: "Updated State",
        businessCountry: "Updated Country",
        businessPostalCode: "12345",
        contactPersonName: "John Doe",
        contactPersonEmail: "john@updated.com",
        contactPersonPhone: "+1234567890",
        yearEstablished: 2020,
        employeeCount: 50,
        annualRevenue: "100000-500000",
        commissionRate: 15.5,
        paymentTerms: 30,
        minimumOrderValue: 100.0,
      } as any);

      const { req } = createMocks({
        method: "PUT",
        body: {
          companyName: "Updated Company",
          description: "Updated description",
          website: "https://updated.com",
          phone: "+1234567890",
          vatNumber: "VAT123456789",
          businessAddress: "123 Updated St",
          businessCity: "Updated City",
          businessState: "Updated State",
          businessCountry: "Updated Country",
          businessPostalCode: "12345",
          contactPersonName: "John Doe",
          contactPersonEmail: "john@updated.com",
          contactPersonPhone: "+1234567890",
          yearEstablished: 2020,
          employeeCount: 50,
          annualRevenue: "100000-500000",
          commissionRate: 15.5,
          paymentTerms: 30,
          minimumOrderValue: 100.0,
        },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.supplier).toMatchObject({
        id: "supplier-123",
        companyName: "Updated Company",
        description: "Updated description",
        website: "https://updated.com",
        phone: "+1234567890",
        vatNumber: "VAT123456789",
        businessAddress: "123 Updated St",
        businessCity: "Updated City",
        businessState: "Updated State",
        businessCountry: "Updated Country",
        businessPostalCode: "12345",
        contactPersonName: "John Doe",
        contactPersonEmail: "john@updated.com",
        contactPersonPhone: "+1234567890",
        yearEstablished: 2020,
        employeeCount: 50,
        annualRevenue: "100000-500000",
        commissionRate: 15.5,
        paymentTerms: 30,
        minimumOrderValue: 100.0,
      });

      expect(mockDb.supplier.update).toHaveBeenCalledWith({
        where: { id: "supplier-123" },
        data: {
          companyName: "Updated Company",
          description: "Updated description",
          website: "https://updated.com",
          phone: "+1234567890",
          vatNumber: "VAT123456789",
          businessAddress: "123 Updated St",
          businessCity: "Updated City",
          businessState: "Updated State",
          businessCountry: "Updated Country",
          businessPostalCode: "12345",
          contactPersonName: "John Doe",
          contactPersonEmail: "john@updated.com",
          contactPersonPhone: "+1234567890",
          yearEstablished: 2020,
          employeeCount: 50,
          annualRevenue: "100000-500000",
          commissionRate: 15.5,
          paymentTerms: 30,
          minimumOrderValue: 100.0,
        },
        select: expect.any(Object),
      });
    });

    it("should return 403 for non-supplier users", async () => {
      // Mock authenticated non-supplier session
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "user@test.com",
          role: "USER",
        },
      } as any);

      const { req } = createMocks({
        method: "PUT",
        body: { companyName: "Test" },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Not authorized");
    });

    it("should return 403 for unauthenticated users", async () => {
      // Mock no session
      mockAuth.mockResolvedValue(null);

      const { req } = createMocks({
        method: "PUT",
        body: { companyName: "Test" },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Not authorized");
    });

    it("should return 404 when supplier profile not found", async () => {
      // Mock authenticated supplier session
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "supplier@test.com",
          role: "SUPPLIER",
        },
      } as any);

      // Mock supplier not found
      mockDb.supplier.findUnique.mockResolvedValue(null);

      const { req } = createMocks({
        method: "PUT",
        body: { companyName: "Test" },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Supplier profile not found");
    });

    it("should handle database errors gracefully", async () => {
      // Mock authenticated supplier session
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "supplier@test.com",
          role: "SUPPLIER",
        },
      } as any);

      // Mock supplier exists
      mockDb.supplier.findUnique.mockResolvedValue({
        id: "supplier-123",
      } as any);

      // Mock database error
      mockDb.supplier.update.mockRejectedValue(new Error("Database error"));

      const { req } = createMocks({
        method: "PUT",
        body: { companyName: "Test" },
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle invalid JSON gracefully", async () => {
      // Mock authenticated supplier session
      mockAuth.mockResolvedValue({
        user: {
          id: "user-123",
          email: "supplier@test.com",
          role: "SUPPLIER",
        },
      } as any);

      // Mock supplier exists
      mockDb.supplier.findUnique.mockResolvedValue({
        id: "supplier-123",
      } as any);

      // Mock successful update with empty body
      mockDb.supplier.update.mockResolvedValue({
        id: "supplier-123",
      } as any);

      const { req } = createMocks({
        method: "PUT",
        body: "invalid json",
      });

      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
