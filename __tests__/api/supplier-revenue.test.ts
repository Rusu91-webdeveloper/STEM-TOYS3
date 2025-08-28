import { NextRequest } from "next/server";
import { GET } from "@/app/api/supplier/revenue/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Mock dependencies
jest.mock("@/lib/auth");
jest.mock("@/lib/db");

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockDb = db as jest.Mocked<typeof db>;

describe("GET /api/supplier/revenue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 403 for unauthorized user", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/supplier/revenue");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Not authorized");
  });

  it("should return 403 for non-supplier user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", role: "CUSTOMER" },
    } as any);

    const request = new NextRequest("http://localhost:3000/api/supplier/revenue");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Not authorized");
  });

  it("should return 404 if supplier not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", role: "SUPPLIER" },
    } as any);
    mockDb.supplier.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/supplier/revenue");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Supplier not found");
  });

  it("should return revenue series successfully", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user1", role: "SUPPLIER" },
    } as any);
    mockDb.supplier.findUnique.mockResolvedValue({ id: "supplier1" } as any);
    mockDb.supplierOrder.findMany.mockResolvedValue([
      { createdAt: new Date("2024-01-15"), supplierRevenue: 100, commission: 10 },
      { createdAt: new Date("2024-02-15"), supplierRevenue: 200, commission: 20 },
    ] as any[]);

    const request = new NextRequest("http://localhost:3000/api/supplier/revenue");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.series).toBeDefined();
    expect(Array.isArray(data.series)).toBe(true);
    expect(data.series.length).toBeGreaterThan(0);
    expect(data.series[0]).toHaveProperty("month");
    expect(data.series[0]).toHaveProperty("revenue");
    expect(data.series[0]).toHaveProperty("commission");
  });
});
