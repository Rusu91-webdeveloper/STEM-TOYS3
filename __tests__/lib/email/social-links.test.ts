/**
 * @jest-environment node
 */

import { renderSocialLinksHtml, TECHTOTS_SOCIAL_LINKS } from "@/lib/config/social-links";
import { generateSocialLinks } from "@/lib/email/base";

const FOOTER_SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/people/TechTots/61577557110903/",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/techtots_romania/",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/techtots-romania-b28541388",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@TechTots_Romania",
  },
] as const;

const UNVERIFIED = [
  "facebook.com/techtots",
  "https://youtube.com/techtots",
  "linkedin.com/company/techtots",
];

describe("email social links", () => {
  it("renders every footer social profile and no unverified account", () => {
    expect([...TECHTOTS_SOCIAL_LINKS]).toEqual([...FOOTER_SOCIAL_LINKS]);

    const html = generateSocialLinks();
    const rendered = renderSocialLinksHtml();

    expect(html.match(/<a /g)).toHaveLength(FOOTER_SOCIAL_LINKS.length);
    expect(rendered.match(/<a /g)).toHaveLength(FOOTER_SOCIAL_LINKS.length);

    for (const link of FOOTER_SOCIAL_LINKS) {
      expect(html).toContain(`href="${link.href}"`);
      expect(html).toContain(link.name);
      expect(rendered).toContain(`href="${link.href}"`);
      expect(rendered).toContain(link.name);
    }

    for (const unverified of UNVERIFIED) {
      expect(html).not.toContain(unverified);
      expect(rendered).not.toContain(unverified);
    }
  });
});
