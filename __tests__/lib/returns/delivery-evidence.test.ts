import { isWithinReturnWindowForOrder } from "@/lib/returns/policy";

describe("withdrawal deadline evidence", () => {
  const now = new Date("2026-10-04T12:00:00Z");
  const createdAt = new Date("2026-08-01T12:00:00Z");

  it("does not reject a withdrawal using purchase date when delivery date is unknown", () => {
    expect(isWithinReturnWindowForOrder({ createdAt, deliveredAt: null }, now)).toBe(true);
  });

  it("accepts delivery within 14 days even when purchase happened earlier", () => {
    expect(isWithinReturnWindowForOrder({ createdAt, deliveredAt: "2026-09-30T12:00:00Z" }, now)).toBe(true);
  });

  it("uses the evidenced delivery date for the ordinary withdrawal gate", () => {
    expect(isWithinReturnWindowForOrder({ createdAt, deliveredAt: "2026-09-01T12:00:00Z" }, now)).toBe(false);
  });
});
