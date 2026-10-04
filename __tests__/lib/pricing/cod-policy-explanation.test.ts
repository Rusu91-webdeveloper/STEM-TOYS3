import { buildFAQItems, faqStructuredData } from "@/app/faq/content";
import { calculateCODFee } from "@/lib/pricing/cod-fee-calculator";
import {
  codFeeExplanation,
  DEFAULT_COD_SETTINGS,
  formatCodFeeLabel,
} from "@/lib/pricing/cod-settings";
import {
  publicShippingSettings,
  defaultShippingSettings,
} from "@/lib/shipping/settings";

test("configured live COD rate controls both labels and the calculated fee", () => {
  const configured = { active: true, percentage: "0.01", fixedFee: "5.00" };
  expect(formatCodFeeLabel(configured)).toBe("0,01% + 5,00 lei");
  expect(codFeeExplanation(configured)).toContain("5,00 lei + 0,01%");
  expect(
    calculateCODFee(168 + 19.99, {
      percentage: Number(configured.percentage) / 100,
      fixedFee: Number(configured.fixedFee),
    }).fee
  ).toBe(5.02);
});

test("COD fallback matches the verified live fee when settings cannot load", () => {
  expect(DEFAULT_COD_SETTINGS.percentage).toBe("0.01");
  expect(DEFAULT_COD_SETTINGS.fixedFee).toBe("5.00");
  expect(formatCodFeeLabel(DEFAULT_COD_SETTINGS)).toBe("0,01% + 5,00 lei");
  const explanation = codFeeExplanation(DEFAULT_COD_SETTINGS);
  expect(explanation).toContain("5,00 lei + 0,01%");
  expect(
    calculateCODFee(187.99, {
      percentage: Number(DEFAULT_COD_SETTINGS.percentage) / 100,
      fixedFee: Number(DEFAULT_COD_SETTINGS.fixedFee),
    }).fee
  ).toBe(5.02);
  const items = buildFAQItems(DEFAULT_COD_SETTINGS);
  const answer = items.at(-1)!.answer;
  expect(answer).toContain("Fiecare comandă ramburs");
  expect(answer).toContain("rambursul nu este disponibil");
  expect(answer).toContain("autorizarea nu este o plată");
  expect(faqStructuredData(items).mainEntity.at(-1)!.acceptedAnswer.text).toBe(
    answer
  );
});

test("COD fee label formats percentage 0 as flat fee only", () => {
  expect(formatCodFeeLabel({ active: true, percentage: "0", fixedFee: "9.90" })).toBe("9,90 lei");
  expect(formatCodFeeLabel({ active: true, percentage: "0", fixedFee: "15" })).toBe("15,00 lei");
});

test("COD fee label formats percentage > 0 with both components", () => {
  expect(formatCodFeeLabel({ active: true, percentage: "1", fixedFee: "7" })).toBe("1,00% + 7,00 lei");
  expect(formatCodFeeLabel({ active: true, percentage: "0.5", fixedFee: "10" })).toBe("0,50% + 10,00 lei");
});

test("COD fee label returns empty string for invalid or inactive settings", () => {
  expect(formatCodFeeLabel({ active: false, percentage: "1", fixedFee: "7" })).toBe("");
  expect(formatCodFeeLabel({ active: true, percentage: "-1", fixedFee: "7" })).toBe("");
  expect(formatCodFeeLabel({ active: true, percentage: "1", fixedFee: "-5" })).toBe("");
});

test("a configured COD rate takes precedence in the public explanation", () => {
  expect(
    codFeeExplanation({ active: true, percentage: "1", fixedFee: "7" })
  ).toContain("7,00 lei + 1,00%");
});

test("percentage 0 explanation omits the percentage component", () => {
  const explanation = codFeeExplanation({ active: true, percentage: "0", fixedFee: "9.90" });
  expect(explanation).toContain("9,90 lei");
  expect(explanation).not.toContain("%");
  expect(explanation).not.toContain("din suma de plată");
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
