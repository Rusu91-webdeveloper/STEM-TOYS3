import { buildFAQItems, faqStructuredData } from "@/app/faq/content";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";
import {
  codFeeExplanation,
  DEFAULT_COD_SETTINGS,
} from "@/lib/pricing/cod-settings";
import {
  publicShippingSettings,
  defaultShippingSettings,
} from "@/lib/shipping/settings";

test("published COD rate matches the amount charged for the reported 168 lei basket", () => {
  expect(calculateCODFee(168 + 19.99).fee).toBe(5.02);
  expect(codFeeExplanation(DEFAULT_COD_SETTINGS)).toContain("5,00 lei + 0,01%");
  const items = buildFAQItems(DEFAULT_COD_SETTINGS);
  const answer = items.at(-1)!.answer;
  expect(answer).toContain("Fiecare comandă ramburs");
  expect(answer).toContain("rambursul nu este disponibil");
  expect(answer).toContain("autorizarea nu este o plată");
  expect(faqStructuredData(items).mainEntity.at(-1)!.acceptedAnswer.text).toBe(
    answer
  );
});

test("a configured COD rate takes precedence in the public explanation", () => {
  expect(
    codFeeExplanation({ active: true, percentage: "1", fixedFee: "7" })
  ).toContain("7,00 lei + 1,00%");
});

test("the public shipping contract excludes stale legacy rates without mutating stored settings", () => {
  const settings = {
    ...defaultShippingSettings(),
    onlinePaymentPrice: { price: "24.99" },
    rambursPrice: { price: "25" },
  };
  const publicSettings = publicShippingSettings(settings);
  expect(publicSettings.deliveryPrice.price).toBe("19.99");
  expect(publicSettings.freeThreshold.price).toBe("500.00");
  expect(publicSettings).not.toHaveProperty("onlinePaymentPrice");
  expect(publicSettings).not.toHaveProperty("rambursPrice");
  expect(publicSettings).not.toHaveProperty("__source");
  expect(settings.onlinePaymentPrice.price).toBe("24.99");
});
