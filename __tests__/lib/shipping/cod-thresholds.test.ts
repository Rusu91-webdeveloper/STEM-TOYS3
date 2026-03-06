import { getCodThreshold, isCodAllowed } from "@/lib/shipping/cod-thresholds";

describe("cod thresholds", () => {
  const originalB2C = process.env.COD_MAX_B2C;
  const originalB2B = process.env.COD_MAX_B2B;
  const originalPublicB2C = process.env.NEXT_PUBLIC_COD_MAX_B2C;
  const originalPublicB2B = process.env.NEXT_PUBLIC_COD_MAX_B2B;

  afterEach(() => {
    if (originalB2C === undefined) {
      delete process.env.COD_MAX_B2C;
    } else {
      process.env.COD_MAX_B2C = originalB2C;
    }

    if (originalB2B === undefined) {
      delete process.env.COD_MAX_B2B;
    } else {
      process.env.COD_MAX_B2B = originalB2B;
    }

    if (originalPublicB2C === undefined) {
      delete process.env.NEXT_PUBLIC_COD_MAX_B2C;
    } else {
      process.env.NEXT_PUBLIC_COD_MAX_B2C = originalPublicB2C;
    }

    if (originalPublicB2B === undefined) {
      delete process.env.NEXT_PUBLIC_COD_MAX_B2B;
    } else {
      process.env.NEXT_PUBLIC_COD_MAX_B2B = originalPublicB2B;
    }
  });

  it("caps COD at 500 RON even if env values are higher", () => {
    process.env.COD_MAX_B2C = "10000";
    process.env.COD_MAX_B2B = "9000";

    expect(getCodThreshold("B2C")).toBe(500);
    expect(getCodThreshold("B2B")).toBe(500);
  });

  it("rejects COD amounts above 500 RON", () => {
    expect(isCodAllowed(500, "B2C")).toBe(true);
    expect(isCodAllowed(500.01, "B2C")).toBe(false);
  });
});
