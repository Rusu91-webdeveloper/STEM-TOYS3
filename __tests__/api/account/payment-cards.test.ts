/** @jest-environment node */
import { NextRequest } from "next/server";

import {
  DELETE,
  GET as getCard,
  PUT,
} from "@/app/api/account/payment-cards/[id]/route";
import { GET, POST } from "@/app/api/account/payment-cards/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    paymentCard: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockAuth = auth as jest.Mock;
const mockCards = db.paymentCard as jest.Mocked<typeof db.paymentCard>;
const endpoint = "http://localhost:3000/api/account/payment-cards";
const context = () => ({ params: Promise.resolve({ id: "card-1" }) });
const metadata = {
  id: "card-1",
  lastFourDigits: "4242",
  cardholderName: "Test Customer",
  cardType: "visa",
  expiryMonth: "12",
  expiryYear: "30",
  isDefault: false,
};

function expectNoDatabaseAccess() {
  Object.values(mockCards).forEach(fn => expect(fn).not.toHaveBeenCalled());
  expect(db.$transaction).not.toHaveBeenCalled();
}

function expectPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
}

beforeEach(() => {
  jest.resetAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "customer-1" } });
});

describe.each([
  ["anonymous", null],
  ["missing user", {}],
  ["missing ID", { user: {} }],
])("denies %s", (_label, session) => {
  beforeEach(() => mockAuth.mockResolvedValue(session));

  it("blocks collection reads before querying records", async () => {
    const response = await GET();
    expect(response.status).toBe(401);
    expectPrivate(response);
    expectNoDatabaseAccess();
  });

  it.each(["GET", "DELETE"])(
    "blocks item %s before querying records",
    async method => {
      const request = new NextRequest(`${endpoint}/card-1`, { method });
      const response =
        method === "GET"
          ? await getCard(request, context())
          : await DELETE(request, context());
      expect(response.status).toBe(401);
      expectPrivate(response);
      expectNoDatabaseAccess();
    }
  );

  it.each(["POST", "PUT"])("blocks %s without reading input", async method => {
    const request = new NextRequest(endpoint, { method, body: "invalid JSON" });
    const parse = jest.spyOn(request, "json");
    const response =
      method === "POST" ? await POST(request) : await PUT(request, context());
    expect(response.status).toBe(401);
    expectPrivate(response);
    expect(parse).not.toHaveBeenCalled();
    expectNoDatabaseAccess();
  });
});

describe("retired card writes", () => {
  it.each([
    ["POST", "invalid JSON"],
    ["PUT", "invalid JSON"],
    ["POST", JSON.stringify({ cardNumber: "4242424242424242", cvv: "123" })],
    ["PUT", JSON.stringify({ isDefault: true })],
  ])(
    "rejects authenticated %s without parsing, storing or echoing details",
    async (method, body) => {
      const request = new NextRequest(endpoint, { method, body });
      const parse = jest.spyOn(request, "json");
      const response =
        method === "POST" ? await POST(request) : await PUT(request, context());
      expect(response.status).toBe(410);
      expectPrivate(response);
      const payload = await response.json();
      expect(payload).toMatchObject({ code: "LEGACY_CARD_STORAGE_DISABLED" });
      expect(JSON.stringify(payload)).not.toContain("4242424242424242");
      expect(payload).not.toHaveProperty("cvv");
      expect(parse).not.toHaveBeenCalled();
      expectNoDatabaseAccess();
    }
  );

  it("fails closed when authentication errors and never logs input", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    mockAuth.mockRejectedValue(new Error("authentication unavailable"));
    const request = new NextRequest(endpoint, {
      method: "POST",
      body: "private input",
    });
    const parse = jest.spyOn(request, "json");
    const response = await POST(request);
    expect(response.status).toBe(500);
    expectPrivate(response);
    expect(parse).not.toHaveBeenCalled();
    expectNoDatabaseAccess();
    expect(log).toHaveBeenCalledWith(
      "Unable to authenticate legacy payment-card request"
    );
    log.mockRestore();
  });
});

describe("legacy card metadata and removal", () => {
  it("lists only owner-scoped metadata, including an empty result", async () => {
    mockCards.findMany
      .mockResolvedValueOnce([metadata] as never)
      .mockResolvedValueOnce([]);
    const first = await GET();
    expect(first.status).toBe(200);
    expectPrivate(first);
    expect(await first.json()).toEqual([metadata]);
    expect(mockCards.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "customer-1" },
        select: expect.objectContaining({ lastFourDigits: true }),
      })
    );
    const query = mockCards.findMany.mock.calls[0][0];
    expect(query?.select).not.toHaveProperty("encryptedCardData");
    expect(query?.select).not.toHaveProperty("encryptedCvv");
    expect(await (await GET()).json()).toEqual([]);
  });

  it("reads individual metadata with ownership and no encrypted columns", async () => {
    mockCards.findFirst.mockResolvedValue(metadata as never);
    const response = await getCard(new NextRequest(endpoint), context());
    expect(response.status).toBe(200);
    expectPrivate(response);
    expect(await response.json()).toEqual(metadata);
    const query = mockCards.findFirst.mock.calls[0][0];
    expect(query?.where).toEqual({ id: "card-1", userId: "customer-1" });
    expect(query?.select).not.toHaveProperty("encryptedCardData");
    expect(query?.select).not.toHaveProperty("encryptedCvv");
  });

  it.each(["GET", "DELETE"])(
    "hides missing/another owner's card for %s",
    async method => {
      mockCards.findFirst.mockResolvedValue(null);
      const request = new NextRequest(endpoint, { method });
      const response =
        method === "GET"
          ? await getCard(request, context())
          : await DELETE(request, context());
      expect(response.status).toBe(404);
      expectPrivate(response);
      expect(mockCards.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "card-1", userId: "customer-1" },
        })
      );
      expect(mockCards.delete).not.toHaveBeenCalled();
    }
  );

  it("preserves owner removal without reading secret columns", async () => {
    mockCards.findFirst.mockResolvedValue({
      id: "card-1",
      isDefault: false,
    } as never);
    mockCards.delete.mockResolvedValue({} as never);
    const response = await DELETE(
      new NextRequest(endpoint, { method: "DELETE" }),
      context()
    );
    expect(response.status).toBe(200);
    expectPrivate(response);
    expect(mockCards.findFirst).toHaveBeenCalledWith({
      where: { id: "card-1", userId: "customer-1" },
      select: { id: true, isDefault: true },
    });
    expect(mockCards.delete).toHaveBeenCalledWith({
      where: { id: "card-1", userId: "customer-1" },
      select: { id: true },
    });
  });

  it("preserves removal of a default card with metadata-only fallback lookup", async () => {
    mockCards.findFirst
      .mockResolvedValueOnce({ id: "card-1", isDefault: true } as never)
      .mockResolvedValueOnce({ id: "card-2" } as never);
    const response = await DELETE(
      new NextRequest(endpoint, { method: "DELETE" }),
      context()
    );
    expect(response.status).toBe(200);
    expect(mockCards.findFirst).toHaveBeenLastCalledWith({
      where: { userId: "customer-1" },
      select: { id: true },
    });
    expect(mockCards.update).toHaveBeenCalledWith({
      where: { id: "card-2" },
      data: { isDefault: true },
      select: { id: true },
    });
  });

  it("handles a database error without logging sensitive error details", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCards.findMany.mockRejectedValue(
      new Error("sensitive database detail")
    );
    const response = await GET();
    expect(response.status).toBe(500);
    expectPrivate(response);
    expect(await response.json()).toEqual({
      error: "Failed to fetch payment cards",
    });
    expect(log).toHaveBeenCalledWith(
      "Unable to fetch legacy payment-card metadata"
    );
    log.mockRestore();
  });
});
