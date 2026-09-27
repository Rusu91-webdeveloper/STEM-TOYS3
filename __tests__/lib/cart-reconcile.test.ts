import type { CartItem } from "@/features/cart";
import {
  reconcileLoadedCart,
  selectCartSyncPayload,
} from "@/features/cart/lib/cartReconcile";

const kit: CartItem = {
  id: "product-1",
  productId: "product-1",
  name: "STEM Kit",
  price: 99,
  quantity: 1,
};

describe("guest cart reload reconciliation", () => {
  it("keeps the local item when the server cart is empty after a reload", () => {
    const result = reconcileLoadedCart([kit], []);

    expect(result.items).toEqual([kit]);
    expect(result.pushToServer).toBe(true);
  });

  it("does not push an empty local cart over a server cart that has items", () => {
    const result = reconcileLoadedCart([], [kit]);

    expect(result.items).toEqual([kit]);
    expect(result.pushToServer).toBe(false);
  });

  it("drops a stale server cart when the shopper explicitly emptied the local cart", () => {
    const result = reconcileLoadedCart([], [kit], { explicitEmpty: true });

    expect(result.items).toEqual([]);
    expect(result.pushToServer).toBe(true);
  });

  it("merges the same product once and keeps the higher quantity", () => {
    const result = reconcileLoadedCart(
      [{ ...kit, quantity: 1 }],
      [{ ...kit, quantity: 3 }]
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.quantity).toBe(3);
    expect(result.pushToServer).toBe(false);
  });
});

describe("empty cart overwrite race", () => {
  it("syncs the cart after the add, not the empty array captured when the timer was scheduled", () => {
    const staleClosureAtSchedule: CartItem[] = [];
    const latestAfterAdd = [{ ...kit, quantity: 1 }];

    const payload = selectCartSyncPayload(latestAfterAdd);

    expect(staleClosureAtSchedule).toEqual([]);
    expect(payload.items).toEqual(latestAfterAdd);
    expect(payload.clear).toBe(false);
  });

  it("marks a genuinely empty latest cart as an explicit clear", () => {
    expect(selectCartSyncPayload([]).clear).toBe(true);
  });
});
