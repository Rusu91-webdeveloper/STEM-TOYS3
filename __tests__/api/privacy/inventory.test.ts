/** @jest-environment node */
import { GET } from "@/app/api/admin/privacy/inventory/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: { paymentCard: { count: jest.fn() }, consentLog: { count: jest.fn() } },
}));
const mockAuth = auth as jest.Mock;
const count = db.paymentCard.count as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  count.mockResolvedValue(0);
  (db.consentLog.count as jest.Mock).mockResolvedValue(0);
});
it.each([
  null,
  { user: { id: "c", role: "CUSTOMER" } },
  { user: { id: "v", role: "VISITOR" } },
])("denies non-admin %j without inventory access", async session => {
  mockAuth.mockResolvedValue(session);
  expect((await GET()).status).toBe(403);
  expect(count).not.toHaveBeenCalled();
});
it("returns counts only for an administrator, including PAN/CVV ciphertext counts", async () => {
  mockAuth.mockResolvedValue({ user: { id: "a", role: "ADMIN" } });
  count
    .mockResolvedValueOnce(4)
    .mockResolvedValueOnce(3)
    .mockResolvedValueOnce(2);
  const response = await GET();
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const data = await response.json();
  expect(data.legacyCards).toEqual({
    total: 4,
    withCardData: 3,
    withCvv: 2,
  });
  expect(JSON.stringify(data)).not.toMatch(/cardholder|lastFourDigits|userId/);
  expect(count.mock.calls[2][0]).toMatchObject({
    where: {
      AND: [{ encryptedCvv: { not: null } }, { encryptedCvv: { not: "" } }],
    },
  });
});
