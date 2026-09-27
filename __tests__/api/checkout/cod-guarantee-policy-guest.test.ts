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
    order: { count: jest.fn(), findMany: jest.fn() },
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
  const previousNewCustomer = process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COD_GUARANTEE_MODE = "risk_based";
    delete process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL;
    auth.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(null);
    db.order.count.mockResolvedValue(0);
    db.order.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    if (previousMode === undefined) {
      delete process.env.COD_GUARANTEE_MODE;
    } else {
      process.env.COD_GUARANTEE_MODE = previousMode;
    }
    if (previousNewCustomer === undefined) {
      delete process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL;
    } else {
      process.env.COD_GUARANTEE_NEW_CUSTOMER_MIN_TOTAL = previousNewCustomer;
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
    expect(JSON.stringify(payload)).not.toMatch(
      /guest@example.com|priorOrder/i
    );
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
    db.order.count.mockResolvedValueOnce(3);
    db.order.findMany.mockResolvedValueOnce([{ id: "refused_order" }]);

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

  it("does not require a guarantee for a new guest under 200 lei", async () => {
    const response = await GET(
      policyRequest({
        orderTotal: "199",
        recipientType: "B2C",
        shippingMethodId: "fancourier:standard",
        guestEmail: "new@example.com",
        phone: "0711000000",
      })
    );
    const payload = await response.json();

    expect(payload.required).toBe(false);
    expect(payload.thresholds.newCustomerMinTotal).toBe(200);
    expect(payload.reasons).toBeUndefined();
    expect(payload.userStats).toBeUndefined();
  });

  it("requires a guarantee for a new guest at 200 lei", async () => {
    const response = await GET(
      policyRequest({
        orderTotal: "200",
        recipientType: "B2C",
        shippingMethodId: "fancourier:standard",
        guestEmail: "new@example.com",
      })
    );
    const payload = await response.json();

    expect(payload.required).toBe(true);
    expect(payload.amount).toBe(200);
    expect(payload.reasons).toBeUndefined();
  });

  it("requires a guarantee when the phone has a refusal on a different email", async () => {
    db.order.findMany.mockResolvedValue([
      {
        id: "ord_refused",
        shippingAddress: { phone: "+40 722-111-222" },
      },
    ]);

    const response = await GET(
      policyRequest({
        orderTotal: "50",
        recipientType: "B2C",
        shippingMethodId: "fancourier:standard",
        guestEmail: "other@example.com",
        phone: "0722 111 222",
      })
    );
    const payload = await response.json();

    expect(payload.required).toBe(true);
    expect(payload.amount).toBe(50);
    expect(payload.mode).toBe("risk_based");
    expect(Object.keys(payload).sort()).toEqual([
      "amount",
      "mode",
      "required",
      "thresholds",
    ]);
    expect(JSON.stringify(payload)).not.toContain("ord_refused");
    expect(JSON.stringify(payload)).not.toContain("722");
  });

  it("applies the same phone refusal rule to a logged-in shopper", async () => {
    auth.mockResolvedValue({
      user: { id: "user_1", email: "buyer@example.com" },
    });
    db.order.count.mockResolvedValue(4);
    db.order.findMany.mockImplementation(
      (args: {
        select?: { shippingAddress?: unknown };
        where?: { userId?: string };
      }) => {
        if (args.select?.shippingAddress) {
          return Promise.resolve([
            {
              id: "ord_other_account",
              shippingAddress: { phone: "0040722111222" },
            },
          ]);
        }
        return Promise.resolve([]);
      }
    );

    const response = await GET(
      policyRequest({
        orderTotal: "50",
        recipientType: "B2C",
        phone: "40722111222",
        guestEmail: "someone-else@example.com",
      })
    );
    const payload = await response.json();

    expect(payload.required).toBe(true);
    expect(payload.reasons).toEqual(["repeat_cod_rto"]);
    expect(payload.userStats).toEqual({
      priorOrderCount: 4,
      priorCodRtoCount: 1,
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(JSON.stringify(payload)).not.toContain("ord_other_account");
  });

  it("requires a guarantee for a logged-in new customer at 200 lei", async () => {
    auth.mockResolvedValue({
      user: { id: "user_1", email: "buyer@example.com" },
    });
    db.order.count.mockResolvedValue(0);

    const response = await GET(
      policyRequest({
        orderTotal: "200",
        recipientType: "B2C",
        phone: "0711111111",
      })
    );
    const payload = await response.json();

    expect(payload.required).toBe(true);
    expect(payload.reasons).toContain("new_customer_high_value");
  });
});
