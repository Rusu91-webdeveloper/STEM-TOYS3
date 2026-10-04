import fs from "node:fs";
import path from "node:path";

import { COD_CONSENT_TEXT } from "@/lib/checkout/cod-consent";
import { RETURN_POLICY_COD_RTO_RO } from "@/lib/returns/policy";

const projectRoot = process.cwd();

describe("COD outbound guarantee copy", () => {
  it("preserves withdrawal rights and does not promise automatic RTO capture", () => {
    expect(RETURN_POLICY_COD_RTO_RO).toContain(
      "nu declanșează automat încasarea"
    );
    expect(RETURN_POLICY_COD_RTO_RO).toContain(
      "O retragere legală comunicată valabil nu este penalizată"
    );
    expect(RETURN_POLICY_COD_RTO_RO).toContain(
      "TechTots suportă returul la expeditor"
    );
    expect(COD_CONSENT_TEXT).toContain(RETURN_POLICY_COD_RTO_RO);
    expect(COD_CONSENT_TEXT).toContain("nu limitează drepturile legale");
  });

  it("does not promise recovery beyond the authorized outbound amount", () => {
    const customerFacingSources = [
      "app/faq/content.ts",
      "app/returns/page.tsx",
      "app/shipping/page.tsx",
      "app/terms/page.tsx",
      "features/checkout/components/OrderReview.tsx",
      "features/checkout/components/PaymentMethodSelector.tsx",
      "features/checkout/components/cod-panels/CodRambursConsentPanel.tsx",
      "features/checkout/components/cod-panels/CodRambursGuaranteePanel.tsx",
      "features/home/components/HeroSection.tsx",
      "lib/checkout/cod-consent.ts",
      "lib/i18n/translations/en.ts",
      "lib/i18n/translations/ro.ts",
      "lib/returns/policy.ts",
    ]
      .map(file => fs.readFileSync(path.join(projectRoot, file), "utf8"))
      .join("\n");

    expect(customerFacingSources).not.toMatch(/tur\s*\+\s*retur/i);
    expect(customerFacingSources).not.toMatch(
      /diferențe peste garanția COD|fluxuri legale(?:\/|\s+și\s+)contabile/i
    );
  });
});
