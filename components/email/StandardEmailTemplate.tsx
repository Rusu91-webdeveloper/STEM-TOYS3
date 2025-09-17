import React from "react";
import StandardEmailFooter from "./StandardEmailFooter";

interface StandardEmailTemplateProps {
  title: string;
  headline: string;
  content: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  isMarketing?: boolean;
  unsubscribeUrl?: string;
  logoUrl?: string;
  siteUrl?: string;
}

export default function StandardEmailTemplate({
  title,
  headline,
  content,
  ctaText,
  ctaLink,
  isMarketing = false,
  unsubscribeUrl = "#",
  logoUrl,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtots.ro",
}: StandardEmailTemplateProps) {
  const currentYear = new Date().getFullYear();
  const defaultLogoUrl = `${siteUrl}/TechTots_LOGO.png`;

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.6,
        color: "#333",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {/* Header with Logo */}
      <header style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src={logoUrl || defaultLogoUrl}
          alt="TechTots Logo"
          style={{ maxWidth: "180px" }}
        />
      </header>

      {/* Main Content */}
      <main
        style={{
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ color: "#3498db", marginTop: 0 }}>{headline}</h1>

        {/* Email-specific content */}
        <div>{content}</div>

        {/* Call-to-action button */}
        {ctaText && ctaLink && (
          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <a
              href={ctaLink}
              style={{
                backgroundColor: "#3498db",
                color: "white",
                padding: "12px 24px",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                display: "inline-block",
              }}
            >
              {ctaText}
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <StandardEmailFooter
        isMarketing={isMarketing}
        unsubscribeUrl={unsubscribeUrl}
        currentYear={currentYear}
        siteUrl={siteUrl}
      />
    </div>
  );
}

/**
 * Usage in email template system:
 *
 * HTML output to use as template starting point:
 *
 * <!DOCTYPE html>
 * <html>
 * <head>
 *   <meta charset="utf-8">
 *   <meta name="viewport" content="width=device-width, initial-scale=1.0">
 *   <title>{{emailTitle}} - TechTots</title>
 * </head>
 * <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
 *   <!-- Header with Logo -->
 *   <header style="text-align: center; margin-bottom: 20px;">
 *     <img src="{{siteUrl}}/TechTots_LOGO.png" alt="TechTots Logo" style="max-width: 180px;" />
 *   </header>
 *
 *   <!-- Main Content -->
 *   <main style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
 *     <h1 style="color: #3498db; margin-top: 0;">{{emailHeadline}}</h1>
 *
 *     <!-- Email-specific content goes here -->
 *     {{emailContent}}
 *
 *     <!-- Call-to-action button -->
 *     <div style="text-align: center; margin: 30px 0;">
 *       <a href="{{ctaLink}}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">{{ctaText}}</a>
 *     </div>
 *   </main>
 *
 *   <!-- Footer -->
 *   <footer style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
 *     <p>© {{currentYear}} TechTots. Toate drepturile rezervate.</p>
 *
 *     <!-- Contact Information -->
 *     <p>
 *       Email: contact@techtots.ro<br>
 *       Telefon: +40 712 345 678<br>
 *       Adresă: Strada Exemplu 123, Sector 1, București, România
 *     </p>
 *
 *     <!-- Social Media Links -->
 *     <div style="margin: 15px 0;">
 *       <a href="https://facebook.com/techtots" style="text-decoration: none; margin: 0 5px; color: #3b5998;">Facebook</a>
 *       <a href="https://instagram.com/techtots" style="text-decoration: none; margin: 0 5px; color: #e1306c;">Instagram</a>
 *       <a href="https://linkedin.com/company/techtots" style="text-decoration: none; margin: 0 5px; color: #0077b5;">LinkedIn</a>
 *     </div>
 *
 *     <!-- Legal Links -->
 *     <p>
 *       <a href="{{siteUrl}}/privacy" style="color: #666; margin: 0 5px;">Politica de confidențialitate</a> |
 *       <a href="{{siteUrl}}/terms" style="color: #666; margin: 0 5px;">Termeni și condiții</a>
 *       {{#if isMarketing}} |
 *       <a href="{{unsubscribeUrl}}" style="color: #666; margin: 0 5px;">Dezabonare</a>
 *       {{/if}}
 *     </p>
 *   </footer>
 * </body>
 * </html>
 */
