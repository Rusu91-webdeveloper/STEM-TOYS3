import {
  normalizeCourierName,
  normalizeTrackingStatus,
} from "@/lib/shipping/courier-status-sync";

describe("courier status sync helpers", () => {
  describe("normalizeCourierName", () => {
    it("normalizes supported carriers", () => {
      expect(normalizeCourierName("FanCourier")).toBe("FANCOURIER");
      expect(normalizeCourierName("fan courier")).toBe("FANCOURIER");
      expect(normalizeCourierName("SAMEDAY")).toBe("SAMEDAY");
    });

    it("returns unknown for unsupported carriers", () => {
      expect(normalizeCourierName("dpd")).toBe("UNKNOWN");
      expect(normalizeCourierName(null)).toBe("UNKNOWN");
    });
  });

  describe("normalizeTrackingStatus", () => {
    it("treats delivered wording as delivered", () => {
      expect(
        normalizeTrackingStatus({
          statusText: "Livrat destinatarului",
        })
      ).toBe("DELIVERED");
    });

    it("treats in-transit wording as shipped activity", () => {
      expect(
        normalizeTrackingStatus({
          statusText: "Colet preluat de curier si in tranzit",
        })
      ).toBe("IN_TRANSIT");
    });

    it("treats predat as courier handoff", () => {
      expect(
        normalizeTrackingStatus({
          statusText: "Predat",
        })
      ).toBe("IN_TRANSIT");
    });

    it("treats out-for-delivery wording as last-mile", () => {
      expect(
        normalizeTrackingStatus({
          statusText: "Expeditia este in livrare",
        })
      ).toBe("OUT_FOR_DELIVERY");
    });

    it("treats refusal/return wording as exception", () => {
      expect(
        normalizeTrackingStatus({
          statusText: "Refuz la livrare, retur la expeditor",
        })
      ).toBe("EXCEPTION");
    });

    it("falls back to label created for awb-only states", () => {
      expect(
        normalizeTrackingStatus({
          statusText: "AWB creat",
        })
      ).toBe("LABEL_CREATED");
    });
  });
});
