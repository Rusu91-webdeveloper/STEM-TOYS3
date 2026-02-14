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
      findFirst: jest.fn(),
    },
  },
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

describe("/api/supplier/invoices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires authentication for invoice list", async () => {
    auth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/supplier/invoices");
    const res = await GET_LIST(req);
    expect(res.status).toBe(401);
  });

  it("returns supplier invoices with computed stats", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1" });
    db.supplierInvoice.findMany.mockResolvedValue([
      {
        id: "i1",
        invoiceNumber: "INV-001",
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"),
        subtotal: 1000,
        commission: 100,
        totalAmount: 900,
        status: "SENT",
        dueDate: new Date("2026-02-15"),
        paidAt: null,
        notes: null,
        createdAt: new Date("2026-02-01"),
        _count: {
          supplierOrders: 3,
        },
      },
      {
        id: "i2",
        invoiceNumber: "INV-002",
        periodStart: new Date("2026-02-01"),
        periodEnd: new Date("2026-02-10"),
        subtotal: 500,
        commission: 50,
        totalAmount: 450,
        status: "PAID",
        dueDate: new Date("2026-02-20"),
        paidAt: new Date("2026-02-12"),
        notes: "Paid quickly",
        createdAt: new Date("2026-02-10"),
        _count: {
          supplierOrders: 1,
        },
      },
    ]);

    const req = new NextRequest("http://localhost/api/supplier/invoices");
    const res = await GET_LIST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.invoices).toHaveLength(2);
    expect(data.invoices[0]).toMatchObject({
      id: "i1",
      orderCount: 3,
      totalAmount: 900,
    });
    expect(data.stats).toMatchObject({
      totalInvoices: 2,
      totalPaid: 450,
      totalPending: 900,
      totalOverdue: 0,
    });
  });

  it("requires supplier role for invoice detail", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "CUSTOMER" } });

    const res = await GET_DETAIL(
      new NextRequest("http://localhost/api/supplier/invoices/i1"),
      { params: Promise.resolve({ id: "i1" }) }
    );

    expect(res.status).toBe(403);
  });

  it("returns invoice detail for supplier-owned invoice", async () => {
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
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe("i1");
  });
});
