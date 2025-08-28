/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET as GET_PDF } from "@/app/api/supplier/invoices/[id]/pdf/route";
import { POST as POST_MARK } from "@/app/api/supplier/invoices/[id]/mark-paid/route";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    supplier: { findUnique: jest.fn() },
    supplierInvoice: { findFirst: jest.fn(), updateMany: jest.fn() },
  },
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

describe("supplier invoice actions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("generates PDF", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1", companyName: "Acme" });
    db.supplierInvoice.findFirst.mockResolvedValue({
      id: "i1",
      invoiceNumber: "INV-001",
      periodStart: new Date("2024-01-01"),
      periodEnd: new Date("2024-01-31"),
      subtotal: 100,
      commission: 15,
      totalAmount: 85,
      status: "SENT",
      orders: [],
    });
    const res = await GET_PDF(
      new NextRequest("http://localhost/api/supplier/invoices/i1/pdf"),
      { params: Promise.resolve({ id: "i1" }) }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
  });

  it("marks invoice as paid", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1" });
    db.supplierInvoice.updateMany.mockResolvedValue({ count: 1 });
    const res = await POST_MARK(
      new NextRequest("http://localhost/api/supplier/invoices/i1/mark-paid", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "i1" }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
