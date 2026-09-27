/**
 * Verified TechTots profiles from the site footer.
 * Email templates must render this whole list. Do not drop a network.
 */
export interface TechtotsSocialLink {
  name: "Facebook" | "Instagram" | "LinkedIn" | "YouTube";
  href: string;
}

export const TECHTOTS_SOCIAL_LINKS: readonly TechtotsSocialLink[] = [
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
];

export function renderSocialLinksHtml(
  linkStyle = "display: inline-block; margin: 0 8px; text-decoration: none;"
): string {
  return TECHTOTS_SOCIAL_LINKS.map(
    link =>
      `<a href="${link.href}" style="${linkStyle}">${link.name}</a>`
  ).join("");
}
