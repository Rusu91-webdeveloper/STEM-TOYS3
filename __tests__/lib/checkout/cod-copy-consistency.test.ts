import fs from "node:fs";
import path from "node:path";

import { COD_CONSENT_TEXT } from "@/lib/checkout/cod-consent";
import { RETURN_POLICY_COD_RTO_RO } from "@/lib/returns/policy";

const projectRoot = process.cwd();

describe("COD outbound guarantee copy", () => {
  it("states the authorization cap and who pays return to sender", () => {
    expect(RETURN_POLICY_COD_RTO_RO).toContain(
      "acoperă numai costul transportului tur"
    );
    expect(RETURN_POLICY_COD_RTO_RO).toContain(
      "putem încasa cel mult suma autorizată"
    );
    expect(RETURN_POLICY_COD_RTO_RO).toContain(
      "returului la expeditor rămâne suportat de TechTots"
    );

    expect(COD_CONSENT_TEXT).toContain(
      "acopera numai costul transportului tur"
    );
    expect(COD_CONSENT_TEXT).toContain(
      "poate fi incasata cel mult suma autorizata"
    );
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
