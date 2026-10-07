import {
  canRequestReturnForItem,
  isWithinReturnWindowForItem,
} from "@/lib/returns/item-eligibility";

const order = {
  status: "DELIVERED",
  createdAt: "2026-08-01T00:00:00Z",
  deliveredAt: "2026-08-04T00:00:00Z",
};
test("a download is not evidence of loss of withdrawal rights", () => {
  expect(
    isWithinReturnWindowForItem(
      order,
      { isDigital: true },
      new Date("2026-10-07")
    )
  ).toBe(true);
  expect(
    isWithinReturnWindowForItem(
      order,
      { isDigital: false },
      new Date("2026-10-07")
    )
  ).toBe(false);
});
test("digital complaints can be made after paid supply without physical delivery", () => {
  expect(
    canRequestReturnForItem(
      { ...order, status: "PROCESSING", paymentStatus: "PAID" },
      { isDigital: true }
    )
  ).toBe(true);
  expect(
    canRequestReturnForItem(
      { ...order, status: "PROCESSING", paymentStatus: "PENDING" },
      { isDigital: true }
    )
  ).toBe(false);
});
test("completion does not extinguish physical return rights", () => {
  expect(
    canRequestReturnForItem(
      { ...order, status: "COMPLETED" },
      { isDigital: false }
    )
  ).toBe(true);
});
