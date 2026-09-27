import React from "react";

import { appConfig } from "@/lib/config/app-config";
import { TECHTOTS_SOCIAL_LINKS } from "@/lib/config/social-links";

interface StandardEmailFooterProps {
  isMarketing?: boolean;
  unsubscribeUrl?: string;
  currentYear?: number;
  siteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export default function StandardEmailFooter({
  isMarketing = false,
  unsubscribeUrl = "#",
  currentYear = new Date().getFullYear(),
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro",
  contactEmail = appConfig.contactEmail,
  contactPhone = appConfig.storePhoneFormatted,
}: StandardEmailFooterProps) {
  return (
    <footer
      style={{
        marginTop: "20px",
        paddingTop: "20px",
        borderTop: "1px solid #eee",
        fontSize: "12px",
        color: "#666",
        textAlign: "center",
      }}
    >
      <p>© {currentYear} TechTots. Toate drepturile rezervate.</p>

      {/* Contact Information */}
      <p>
        Email: {contactEmail}
        <br />
        Telefon: {contactPhone}
      </p>

      {/* Social Media Links */}
      <div style={{ margin: "15px 0" }}>
        {TECHTOTS_SOCIAL_LINKS.map(link => (
          <a
            key={link.name}
            href={link.href}
            style={{
              textDecoration: "none",
              margin: "0 5px",
              color: "#334155",
            }}
          >
            {link.name}
          </a>
        ))}
      </div>

      {/* Legal Links */}
      <p>
        <a
          href={`${siteUrl}/privacy`}
          style={{ color: "#666", margin: "0 5px" }}
        >
          Politica de confidențialitate
        </a>{" "}
        |{" "}
        <a href={`${siteUrl}/terms`} style={{ color: "#666", margin: "0 5px" }}>
          Termeni și condiții
        </a>
        {isMarketing && (
          <>
            {" "}
            |{" "}
            <a href={unsubscribeUrl} style={{ color: "#666", margin: "0 5px" }}>
              Dezabonare
            </a>
          </>
        )}
      </p>
    </footer>
  );
}

/**
 * Usage in email template:
 *
 * HTML output to add to templates:
 *
 * <!-- Footer -->
 * <footer style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
 *   <p>© 2025 TechTots. Toate drepturile rezervate.</p>
 *
 *   <!-- Contact Information -->
 *   <p>
 *     Email: info@techtots.ro<br>
 *     Telefon: +40 712 345 678<br>
 *     Adresă: Strada Exemplu 123, Sector 1, București, România
 *   </p>
 *
 *   <!-- Social Media Links -->
 *   Social links come from TECHTOTS_SOCIAL_LINKS (same URLs as the site footer).
 *
 *   <!-- Legal Links -->
 *   <p>
 *     <a href="{{siteUrl}}/privacy" style="color: #666; margin: 0 5px;">Politica de confidențialitate</a> |
 *     <a href="{{siteUrl}}/terms" style="color: #666; margin: 0 5px;">Termeni și condiții</a>
 *     {{#if isMarketing}} |
 *     <a href="{{unsubscribeUrl}}" style="color: #666; margin: 0 5px;">Dezabonare</a>
 *     {{/if}}
 *   </p>
 * </footer>
 */
