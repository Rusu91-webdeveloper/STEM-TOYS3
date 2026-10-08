import {
  dashboardRange,
  percentageChange,
  formatRon,
} from "@/lib/admin/dashboard-metrics";

describe("owner dashboard metric boundaries", () => {
  it("uses Romanian calendar dates even when UTC is still the previous day", () => {
    const range = dashboardRange(1, new Date("2026-10-07T22:30:00Z"));
    expect(range.start.toISOString()).toBe("2026-10-07T21:00:00.000Z");
    expect(range.dates).toEqual(["2026-10-08"]);
    expect(range.previousStart.toISOString()).toBe("2026-10-06T21:00:00.000Z");
  });
  it.each([
    ["2026-03-29T12:00:00Z", "2026-03-28T22:00:00.000Z"],
    ["2026-10-25T12:00:00Z", "2026-10-24T21:00:00.000Z"],
  ])(
    "handles midnight at a daylight-saving transition: %s",
    (now, expected) => {
      expect(dashboardRange(1, new Date(now)).start.toISOString()).toBe(
        expected
      );
    }
  );
  it("fills exactly 30 calendar days across a month boundary", () => {
    const range = dashboardRange(30, new Date("2026-10-08T08:00:00Z"));
    expect(range.dates).toHaveLength(30);
    expect(range.dates[0]).toBe("2026-09-09");
    expect(range.dates[29]).toBe("2026-10-08");
  });
  it("does not invent a 100% increase when the previous period has no sales", () => {
    expect(percentageChange(0, 0)).toBe(0);
    expect(percentageChange(200, 0)).toBeNull();
    expect(percentageChange(0, 200)).toBe(-100);
    expect(percentageChange(150, 100)).toBe(50);
  });
  it("formats monetary values in Romanian lei", () => {
    expect(formatRon(123.45)).toContain("123,45");
    expect(formatRon(0)).toContain("RON");
  });
});
