import { NextRequest } from "next/server";

import { GET } from "@/app/api/admin/categories/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({ db: { category: { findMany: jest.fn() } } }));

const endpoint = "http://localhost:3000/api/admin/categories";

describe("admin categories API", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (auth as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
    (db.category.findMany as jest.Mock).mockResolvedValue([]);
  });

  it.each([
    null,
    { user: { role: "CUSTOMER" } },
    { user: { role: "SUPPLIER" } },
  ])(
    "denies non-admin sessions before querying category records: %j",
    async session => {
      (auth as jest.Mock).mockResolvedValue(session);
      const response = await GET(new NextRequest(endpoint));
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(db.category.findMany).not.toHaveBeenCalled();
    }
  );

  it("includes active and inactive records and maps relation counts without changing status", async () => {
    (db.category.findMany as jest.Mock).mockResolvedValue([
      {
        id: "saved-active",
        name: "Știință",
        slug: "science-kits",
        isActive: true,
        _count: { products: 12, blogs: 2 },
      },
      {
        id: "saved-inactive",
        name: "Robotică",
        slug: "robotics",
        isActive: false,
        _count: { products: 3, blogs: 0 },
      },
    ]);
    const response = await GET(new NextRequest(endpoint));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(db.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true, blogs: true } } },
    });
    expect(await response.json()).toEqual([
      {
        id: "saved-active",
        name: "Știință",
        slug: "science-kits",
        isActive: true,
        productCount: 12,
        blogCount: 2,
      },
      {
        id: "saved-inactive",
        name: "Robotică",
        slug: "robotics",
        isActive: false,
        productCount: 3,
        blogCount: 0,
      },
    ]);
  });

  it("returns an empty catalog only for an actual successful empty query", async () => {
    const response = await GET(new NextRequest(endpoint));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("returns an uncached error rather than zero counts when the database fails", async () => {
    (db.category.findMany as jest.Mock).mockRejectedValue(
      new Error("Database unavailable")
    );
    const response = await GET(new NextRequest(endpoint));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      error: "Failed to fetch categories",
    });
  });
});
