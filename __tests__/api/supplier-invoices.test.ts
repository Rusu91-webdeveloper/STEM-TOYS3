/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET as GET_LIST } from "@/app/api/supplier/invoices/route";
import { GET as GET_DETAIL } from "@/app/api/supplier/invoices/[id]/route";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    supplier: { findUnique: jest.fn() },
    supplierInvoice: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

describe("/api/supplier/invoices", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires supplier auth for list", async () => {
    auth.mockResolvedValue({ user: { role: "CUSTOMER" } });
    const req = new NextRequest("http://localhost/api/supplier/invoices");
    const res = await GET_LIST(req);
    expect(res.status).toBe(403);
  });

  it("returns paginated invoices", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1" });
    db.supplierInvoice.findMany.mockResolvedValue([
      {
        id: "i1",
        invoiceNumber: "INV-001",
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-01-31"),
        subtotal: 100,
        commission: 15,
        totalAmount: 85,
        status: "SENT",
        dueDate: new Date("2024-02-15"),
        paidAt: null,
        createdAt: new Date("2024-02-01"),
      },
    ]);
    db.supplierInvoice.count.mockResolvedValue(1);

    const req = new NextRequest(
      "http://localhost/api/supplier/invoices?page=1&limit=10"
    );
    const res = await GET_LIST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.invoices).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it("requires supplier auth for detail", async () => {
    auth.mockResolvedValue({ user: { role: "CUSTOMER" } });
    const res = await GET_DETAIL(
      new NextRequest("http://localhost/api/supplier/invoices/i1"),
      { params: Promise.resolve({ id: "i1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("returns invoice details for supplier", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1" });
    db.supplierInvoice.findFirst.mockResolvedValue({
      id: "i1",
      invoiceNumber: "INV-001",
      orders: [],
    });

    const res = await GET_DETAIL(
      new NextRequest("http://localhost/api/supplier/invoices/i1"),
      { params: Promise.resolve({ id: "i1" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("i1");
  });
});
