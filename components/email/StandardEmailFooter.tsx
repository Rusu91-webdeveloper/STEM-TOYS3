import React from "react";

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
  contactEmail = "webira.rem.srl@gmail.com",
  contactPhone = "+40 771 248 029",
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
        <a
          href="https://facebook.com/techtots"
          style={{
            textDecoration: "none",
            margin: "0 5px",
            color: "#3b5998",
          }}
        >
          Facebook
        </a>
        <a
          href="https://instagram.com/techtots"
          style={{
            textDecoration: "none",
            margin: "0 5px",
            color: "#e1306c",
          }}
        >
          Instagram
        </a>
        <a
          href="https://linkedin.com/company/techtots"
          style={{
            textDecoration: "none",
            margin: "0 5px",
            color: "#0077b5",
          }}
        >
          LinkedIn
        </a>
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
 *     Email: contact@techtots.ro<br>
 *     Telefon: +40 712 345 678<br>
 *     Adresă: Strada Exemplu 123, Sector 1, București, România
 *   </p>
 *
 *   <!-- Social Media Links -->
 *   <div style="margin: 15px 0;">
 *     <a href="https://facebook.com/techtots" style="text-decoration: none; margin: 0 5px; color: #3b5998;">Facebook</a>
 *     <a href="https://instagram.com/techtots" style="text-decoration: none; margin: 0 5px; color: #e1306c;">Instagram</a>
 *     <a href="https://linkedin.com/company/techtots" style="text-decoration: none; margin: 0 5px; color: #0077b5;">LinkedIn</a>
 *   </div>
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
