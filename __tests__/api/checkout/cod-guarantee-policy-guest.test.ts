/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET } from "@/app/api/checkout/cod-guarantee-policy/route";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: jest.fn() },
    order: { count: jest.fn() },
  },
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

function policyRequest(query: Record<string, string>) {
  const params = new URLSearchParams(query);
  return new NextRequest(
    `http://localhost/api/checkout/cod-guarantee-policy?${params.toString()}`
  );
}

describe("GET /api/checkout/cod-guarantee-policy guests", () => {
  const previousMode = process.env.COD_GUARANTEE_MODE;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COD_GUARANTEE_MODE = "risk_based";
    auth.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(null);
    db.order.count.mockResolvedValue(0);
  });

  afterEach(() => {
    if (previousMode === undefined) {
      delete process.env.COD_GUARANTEE_MODE;
    } else {
      process.env.COD_GUARANTEE_MODE = previousMode;
    }
  });

  it("treats a guest without history as a new customer and omits account data", async () => {
    const response = await GET(
      policyRequest({
        orderTotal: "120.00",
        recipientType: "B2C",
        shippingMethodId: "fancourier:standard",
        guestEmail: "Guest@Example.com",
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.required).toBe(false);
    expect(payload.amount).toBe(120);
    expect(payload.userStats).toBeUndefined();
    expect(payload.reasons).toBeUndefined();
    expect(JSON.stringify(payload)).not.toMatch(/guest@example.com|priorOrder/i);
    expect(db.order.count).not.toHaveBeenCalled();
  });

  it("requires a guarantee for a new guest above the value threshold", async () => {
    const response = await GET(
      policyRequest({
        orderTotal: "420",
        recipientType: "B2C",
        shippingMethodId: "fancourier:standard",
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.required).toBe(true);
    expect(payload.amount).toBe(420);
    expect(payload.reasons).toBeUndefined();
  });

  it("uses COD history for a known guest email without echoing that account", async () => {
    db.user.findUnique.mockResolvedValue({
      id: "user_secret",
      role: "CUSTOMER",
      name: "Hidden Name",
    });
    db.order.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1);

    const response = await GET(
      policyRequest({
        orderTotal: "80",
        recipientType: "B2C",
        shippingMethodId: "fancourier:standard",
        guestEmail: "parent@example.com",
      })
    );
    const payload = await response.json();
    const body = JSON.stringify(payload);

    expect(payload.required).toBe(true);
    expect(body).not.toContain("user_secret");
    expect(body).not.toContain("Hidden Name");
    expect(body).not.toContain("priorOrderCount");
    expect(body).not.toContain("repeat_cod_rto");
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "parent@example.com" },
      select: { id: true, role: true },
    });
  });

  it("does not reveal a staff account looked up by guest email", async () => {
    db.user.findUnique.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
      name: "Staff",
    });

    const response = await GET(
      policyRequest({
        orderTotal: "120",
        shippingMethodId: "fancourier:standard",
        guestEmail: "staff@example.com",
      })
    );
    const payload = await response.json();

    expect(payload.required).toBe(false);
    expect(JSON.stringify(payload)).not.toContain("admin_1");
    expect(db.order.count).not.toHaveBeenCalled();
  });

  it("keeps the logged-in response and ignores a guest email", async () => {
    auth.mockResolvedValue({
      user: { id: "user_1", email: "buyer@example.com" },
    });
    db.order.count.mockResolvedValue(0);

    const response = await GET(
      policyRequest({
        orderTotal: "120",
        recipientType: "B2C",
        guestEmail: "someone-else@example.com",
      })
    );
    const payload = await response.json();

    expect(payload.required).toBe(false);
    expect(payload.userStats).toEqual({
      priorOrderCount: 0,
      priorCodRtoCount: 0,
    });
    expect(payload.reasons).toEqual([]);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
});
