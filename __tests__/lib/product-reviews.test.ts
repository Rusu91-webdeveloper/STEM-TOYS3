import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { getProductReviews } from "@/lib/products/reviews";

jest.mock("@/lib/db", () => ({ db: { review: { findMany: jest.fn() } } }));
jest.mock("next/cache", () => ({ unstable_cache: jest.fn(fn => fn) }));

const row = {
  id: "review-1",
  productId: "product-1",
  userId: "buyer-1",
  rating: 4,
  title: "Util",
  content: "Un experiment interesant.",
  createdAt: new Date("2026-10-01T12:00:00Z"),
  user: { name: "Ana" },
  orderItem: {
    productId: "product-1",
    order: { userId: "buyer-1", status: "DELIVERED" },
  },
};

beforeEach(() => jest.clearAllMocks());

it("reads stored reviews directly and projects only public fields", async () => {
  (db.review.findMany as jest.Mock).mockResolvedValue([row]);
  expect(await getProductReviews("product-1")).toEqual([
    {
      id: "review-1",
      productId: "product-1",
      userName: "Ana",
      rating: 4,
      title: "Util",
      content: "Un experiment interesant.",
      date: "2026-10-01T12:00:00.000Z",
      verified: true,
    },
  ]);
  expect(db.review.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { productId: "product-1" },
      orderBy: { createdAt: "desc" },
    })
  );
  expect(unstable_cache).toHaveBeenCalledWith(
    expect.any(Function),
    ["public-product-reviews", "product-1"],
    { revalidate: 300, tags: ["reviews-product-1"] }
  );
});

it("does not invent verification for an unrelated order item", async () => {
  (db.review.findMany as jest.Mock).mockResolvedValue([
    {
      ...row,
      user: { name: null },
      orderItem: {
        productId: "other",
        order: { userId: "buyer-1", status: "DELIVERED" },
      },
    },
    {
      ...row,
      orderItem: { productId: "product-1", order: { userId: "other-buyer" } },
    },
  ]);
  const reviews = await getProductReviews("product-1");
  expect(reviews.map(x => x.verified)).toEqual([false, false]);
  expect(reviews[0].userName).toBe("Client");
});

it("distinguishes an empty catalog from a database failure", async () => {
  (db.review.findMany as jest.Mock).mockResolvedValue([]);
  expect(await getProductReviews("product-1")).toEqual([]);
  (db.review.findMany as jest.Mock).mockRejectedValue(
    new Error("database unavailable")
  );
  await expect(getProductReviews("product-1")).rejects.toThrow(
    "database unavailable"
  );
});

it("does not label an undelivered purchase as verified", async () => {
  (db.review.findMany as jest.Mock).mockResolvedValue([
    {
      ...row,
      orderItem: {
        productId: "product-1",
        order: { userId: "buyer-1", status: "PROCESSING" },
      },
    },
  ]);
  expect((await getProductReviews("product-1"))[0].verified).toBe(false);
});
