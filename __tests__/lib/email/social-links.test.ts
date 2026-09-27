/**
 * @jest-environment node
 */

import { renderSocialLinksHtml, TECHTOTS_SOCIAL_LINKS } from "@/lib/config/social-links";
import { generateSocialLinks } from "@/lib/email/base";

const UNVERIFIED = [
  "facebook.com/techtots",
  "https://youtube.com/techtots",
  "linkedin.com/company/techtots",
];

describe("email social links", () => {
  it("uses the same profiles as the site footer", () => {
    const html = generateSocialLinks();

    for (const link of TECHTOTS_SOCIAL_LINKS) {
      expect(html).toContain(link.href);
      expect(renderSocialLinksHtml()).toContain(link.href);
    }

    for (const unverified of UNVERIFIED) {
      expect(html).not.toContain(unverified);
    }
  });
});
