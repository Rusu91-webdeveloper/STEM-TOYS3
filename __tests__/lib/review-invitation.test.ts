import { db } from "@/lib/db";
import { getReviewInvitation } from "@/lib/products/review-invitation";
jest.mock("server-only", () => ({}));
jest.mock("@/lib/db", () => ({ db: { order: { findUnique: jest.fn() } } }));
const order = {
  id: "order-1",
  orderNumber: "TT-2026-001",
  userId: "buyer",
  status: "DELIVERED",
  user: { email: "buyer@example.test", isActive: true, anonymized: false },
  items: [
    {
      id: "item-1",
      productId: "product-1",
      product: { name: "Kit", slug: "kit" },
      reviews: [],
    },
  ],
};
beforeEach(() => jest.clearAllMocks());
it("links the persisted delivered purchase through sign-in without exposing email in a URL", async () => {
  (db.order.findUnique as jest.Mock).mockResolvedValue(order);
  const invitation = await getReviewInvitation("order-1", "BUYER@example.test");
  expect(invitation?.orderNumber).toBe("TT-2026-001");
  const url = new URL(invitation!.reviewUrl);
  expect(url.pathname).toBe("/auth/login");
  expect(url.searchParams.get("callbackUrl")).toBe(
    "/account/orders/order-1/review?itemId=item-1&productId=product-1"
  );
  expect(invitation!.reviewUrl).not.toContain("example.test");
});
it.each([
  null,
  { ...order, status: "PROCESSING" },
  { ...order, user: { ...order.user, email: "someone@example.test" } },
  { ...order, user: { ...order.user, isActive: false } },
  { ...order, user: { ...order.user, anonymized: true } },
  { ...order, items: [{ ...order.items[0], reviews: [{ userId: "buyer" }] }] },
  { ...order, items: [{ ...order.items[0], product: null }] },
])("does not invite an ineligible or unrelated purchase: %#", async row => {
  (db.order.findUnique as jest.Mock).mockResolvedValue(row);
  expect(await getReviewInvitation("order-1", "buyer@example.test")).toBeNull();
});
