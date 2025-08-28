import { NextRequest } from "next/server";
import { POST } from "@/app/api/supplier/invoices/generate/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Mock dependencies
jest.mock("@/lib/auth");
jest.mock("@/lib/db");

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDb = db as jest.Mocked<typeof db>;

describe("POST /api/supplier/invoices/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 403 for unauthorized user", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/supplier/invoices/generate", {
      method: "POST",
      body: JSON.stringify({ periodStart: "2024-01-01", periodEnd: "2024-01-31" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Not authorized");
  });

  it("should return 403 for non-supplier user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", role: "CUSTOMER" },
    } as any);

    const request = new NextRequest("http://localhost:3000/api/supplier/invoices/generate", {
      method: "POST",
      body: JSON.stringify({ periodStart: "2024-01-01", periodEnd: "2024-01-31" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Not authorized");
  });

  it("should return 404 if supplier not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", role: "SUPPLIER" },
    } as any);
    mockDb.supplier.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/supplier/invoices/generate", {
      method: "POST",
      body: JSON.stringify({ periodStart: "2024-01-01", periodEnd: "2024-01-31" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Supplier not found");
  });

  it("should return 400 for invalid period dates", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", role: "SUPPLIER" },
    } as any);
    mockDb.supplier.findUnique.mockResolvedValue({ id: "supplier1", commissionRate: 0.1 } as any);

    const request = new NextRequest("http://localhost:3000/api/supplier/invoices/generate", {
      method: "POST",
      body: JSON.stringify({ periodStart: "invalid-date", periodEnd: "2024-01-31" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid or missing periodStart/periodEnd");
  });

  it("should generate invoice successfully", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", role: "SUPPLIER" },
    } as any);
    mockDb.supplier.findUnique.mockResolvedValue({ id: "supplier1", commissionRate: 0.1 } as any);
    mockDb.supplierOrder.findMany.mockResolvedValue([
      { totalPrice: 100, commission: 10, supplierRevenue: 90 },
      { totalPrice: 200, commission: 20, supplierRevenue: 180 },
    ] as any[]);
    mockDb.supplierInvoice.count.mockResolvedValue(0);
    mockDb.supplierInvoice.create.mockResolvedValue({
      id: "invoice1",
      invoiceNumber: "INV-202401-1",
      totalAmount: 270,
      status: "SENT",
    } as any);

    const request = new NextRequest("http://localhost:3000/api/supplier/invoices/generate", {
      method: "POST",
      body: JSON.stringify({ periodStart: "2024-01-01", periodEnd: "2024-01-31" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.invoice).toEqual({
      id: "invoice1",
      invoiceNumber: "INV-202401-1",
      totalAmount: 270,
      status: "SENT",
    });
    expect(mockDb.supplierInvoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        supplierId: "supplier1",
        invoiceNumber: "INV-202401-1",
        subtotal: 300,
        commission: 30,
        totalAmount: 270,
        status: "SENT",
      }),
      select: expect.any(Object),
    });
  });
});
