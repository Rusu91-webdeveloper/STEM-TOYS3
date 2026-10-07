/** @jest-environment node */
export {};
beforeAll(() =>
  jest.useFakeTimers().setSystemTime(new Date("2026-10-07T12:00:00Z"))
);
afterAll(() => jest.useRealTimers());
const mockAuth = jest.fn();
const mockCsrf = jest.fn();
const mockFind = jest.fn();
const mockUpdate = jest.fn();
jest.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/csrf", () => ({ validateCsrfForRequest: () => mockCsrf() }));
jest.mock("@/lib/db", () => ({
  db: {
    return: {
      findUnique: (...args: unknown[]) => mockFind(...args),
      updateMany: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));
const record = {
  id: "ret",
  status: "PENDING",
  reason: "CHANGED_MIND",
  updatedAt: new Date("2026-10-07T00:00:00Z"),
  supplierAuthorizationStatus: "APPROVED",
  supplierAuthorizationNumber: "ARP-TEST",
  supplierAuthorizationRequestedAt: new Date("2026-10-05T12:00:00Z"),
  supplierAuthorizationDeadline: new Date("2026-10-16T12:00:00Z"),
  supplierAuthorizationNotes: "Human notes",
  orderItem: {
    isDigital: false,
    product: {
      supplierId: "kid",
      supplier: {
        id: "kid",
        name: "Kidstory",
        cui: "39581359",
        businessAddress: "Depozit confirmat 80",
        businessCity: "București",
      },
    },
  },
};
const supplierReview = {
  target: "SUPPLIER",
  condition: "SEALED_UNUSED",
  confirmation: "TEST written confirmation",
  warehouseConfirmed: true,
  contractActiveConfirmed: true,
  originalDocumentsConfirmed: true,
  authorizationIssuedAt: "2026-10-06T12:00:00Z",
  expectedArrivalAt: "2026-10-09T12:00:00Z",
};
async function request(body: unknown) {
  const { PATCH } = await import(
    "@/app/api/returns/[returnId]/destination/route"
  );
  return PATCH(
    new Request("http://localhost/api/returns/ret/destination", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ returnId: "ret" }) }
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
  mockCsrf.mockResolvedValue({ valid: true });
  mockFind.mockResolvedValue(record);
  mockUpdate.mockResolvedValue({ count: 1 });
});
test.each([null, { user: { id: "customer", role: "CUSTOMER" } }])(
  "rejects an unauthorized reviewer before accessing returns",
  async session => {
    mockAuth.mockResolvedValue(session);
    expect((await request(supplierReview)).status).toBe(403);
    expect(mockFind).not.toHaveBeenCalled();
  }
);
test("requires CSRF before any destination mutation", async () => {
  mockCsrf.mockResolvedValue({ valid: false });
  expect((await request(supplierReview)).status).toBe(403);
  expect(mockUpdate).not.toHaveBeenCalled();
});
test("persists reviewer, supplier, warehouse, expiry and review checks while preserving human notes", async () => {
  const response = await request(supplierReview);
  const data = await response.json();
  expect(response.status).toBe(200);
  expect(data.destination.target).toBe("SUPPLIER");
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: "ret", status: "PENDING", updatedAt: record.updatedAt },
      data: {
        supplierAuthorizationNotes: expect.stringContaining(
          '[RETURN_DESTINATION_V1 {"version":1'
        ),
      },
    })
  );
  const notes = mockUpdate.mock.calls[0][0].data.supplierAuthorizationNotes;
  expect(notes).toContain('"reviewer":"admin"');
  expect(notes).toContain('"warehouseConfirmed":true');
  expect(notes).toContain("Human notes");
  expect(data.destination).not.toHaveProperty("confirmation");
});
test("company fallback requires no supplier approval and clears obsolete routing evidence", async () => {
  mockFind.mockResolvedValue({
    ...record,
    supplierAuthorizationStatus: "REJECTED",
  });
  const response = await request({ target: "COMPANY" });
  expect(response.status).toBe(200);
  expect((await response.json()).destination.address).toContain("Mehedinți");
});
test("cannot silently replace an approved customer destination", async () => {
  mockFind.mockResolvedValue({ ...record, status: "APPROVED" });
  expect((await request(supplierReview)).status).toBe(409);
  expect(mockUpdate).not.toHaveBeenCalled();
});
test("rejects missing confirmation, client-supplied addresses and unapproved suppliers", async () => {
  for (const review of [
    { ...supplierReview, warehouseConfirmed: false },
    { ...supplierReview, address: "arbitrary" },
  ])
    expect((await request(review)).status).toBe(400);
  mockFind.mockResolvedValue({
    ...record,
    supplierAuthorizationStatus: "PENDING",
  });
  expect((await request(supplierReview)).status).toBe(400);
  expect(mockUpdate).not.toHaveBeenCalled();
});
test("a concurrent status/review change is detected before saving a stale destination", async () => {
  mockUpdate.mockResolvedValue({ count: 0 });
  expect((await request(supplierReview)).status).toBe(409);
});
test("unknown return IDs have no destination write", async () => {
  mockFind.mockResolvedValue(null);
  expect((await request({ target: "COMPANY" })).status).toBe(404);
  expect(mockUpdate).not.toHaveBeenCalled();
});
