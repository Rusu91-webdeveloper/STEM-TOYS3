import { isSupplierSyncHour } from "@/lib/suppliers/schedule";
describe("supplier schedule in Bucharest", () => {
  it.each([
    "2026-07-01T03:00:00Z",
    "2026-07-01T15:00:00Z",
    "2026-01-01T04:00:00Z",
    "2026-01-01T16:00:00Z",
    "2026-03-29T03:00:00Z",
    "2026-10-25T04:00:00Z",
  ])("runs at local 06/18: %s", value =>
    expect(isSupplierSyncHour(new Date(value))).toBe(true)
  );
  it.each([
    "2026-07-01T04:00:00Z",
    "2026-07-01T16:00:00Z",
    "2026-01-01T03:00:00Z",
    "2026-01-01T15:00:00Z",
  ])("skips alternate UTC offset: %s", value =>
    expect(isSupplierSyncHour(new Date(value))).toBe(false)
  );
});
