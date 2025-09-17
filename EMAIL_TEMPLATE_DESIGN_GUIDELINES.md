# Email Template Design Guidelines

## Overview

These guidelines ensure all TechTots email templates are professional,
consistent, and effective across all email clients. Following these standards
will improve email deliverability, user experience, and brand reputation.

## Required Elements

Our analysis identified several missing elements in current email templates.
**All email templates must include**:

### Technical Requirements

- ✅ DOCTYPE declaration: `<!DOCTYPE html>`
- ✅ Proper HTML structure with `<html>`, `<head>`, and `<body>` tags
- ✅ Meta charset tag: `<meta charset="utf-8">`
- ✅ Viewport meta tag:
  `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- ✅ Title tag: `<title>Subject - TechTots</title>`

### Brand Elements

- ✅ Company logo at the top of the email
- ✅ Consistent color scheme matching the TechTots website
- ✅ Company name/branding in the header section
- ✅ Footer with complete contact information

### Legal and Trust Elements

- ✅ Unsubscribe link in every marketing email
- ✅ Company physical address in the footer
- ✅ Social media links in the footer
- ✅ Privacy policy link
- ✅ Terms of service link
- ✅ Copyright notice with current year

## Email Template Structure

For consistent, professional emails, follow this structure:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{emailTitle}} - TechTots</title>
  </head>
  <body
    style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"
  >
    <!-- Header with Logo -->
    <header style="text-align: center; margin-bottom: 20px;">
      <img
        src="{{siteUrl}}/TechTots_LOGO.png"
        alt="TechTots Logo"
        style="max-width: 180px;"
      />
    </header>

    <!-- Main Content -->
    <main
      style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
    >
      <h1 style="color: #3498db; margin-top: 0;">{{emailHeadline}}</h1>

      <!-- Email-specific content goes here -->
      {{emailContent}}

      <!-- Call-to-action button -->
      <div style="text-align: center; margin: 30px 0;">
        <a
          href="{{ctaLink}}"
          style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;"
          >{{ctaText}}</a
        >
      </div>
    </main>

    <!-- Footer -->
    <footer
      style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;"
    >
      <p>© {{currentYear}} TechTots. Toate drepturile rezervate.</p>

      <!-- Contact Information -->
      <p>
        Email: contact@techtots.ro<br />
        Telefon: +40 712 345 678<br />
        Adresă: Strada Exemplu 123, Sector 1, București, România
      </p>

      <!-- Social Media Links -->
      <div style="margin: 15px 0;">
        <a
          href="https://facebook.com/techtots"
          style="text-decoration: none; margin: 0 5px; color: #3b5998;"
          >Facebook</a
        >
        <a
          href="https://instagram.com/techtots"
          style="text-decoration: none; margin: 0 5px; color: #e1306c;"
          >Instagram</a
        >
        <a
          href="https://linkedin.com/company/techtots"
          style="text-decoration: none; margin: 0 5px; color: #0077b5;"
          >LinkedIn</a
        >
      </div>

      <!-- Legal Links -->
      <p>
        <a href="{{siteUrl}}/privacy" style="color: #666; margin: 0 5px;"
          >Politica de confidențialitate</a
        >
        |
        <a href="{{siteUrl}}/terms" style="color: #666; margin: 0 5px;"
          >Termeni și condiții</a
        >
        {{#if isMarketing}} |
        <a href="{{unsubscribeUrl}}" style="color: #666; margin: 0 5px;"
          >Dezabonare</a
        >
        {{/if}}
      </p>
    </footer>
  </body>
</html>
```

## Design Best Practices

### Responsive Design

1. Use percentage-based widths (instead of fixed-pixel) where possible
2. Set a max-width of 600px on the main container
3. Use the viewport meta tag for mobile responsiveness
4. Test on multiple screen sizes (desktop, tablet, mobile)

### Typography

1. Use web-safe fonts like Arial, Helvetica, Georgia
2. Set a reasonable line height (1.5-1.6) for readability
3. Use a font size of 16px for body text
4. Keep headings proportional and consistent
5. Use appropriate spacing between paragraphs

### Color Scheme

1. Primary Color: #3498db (TechTots Blue)
2. Secondary Color: #f39c12 (TechTots Orange)
3. Background Color: #f9f9f9 (Light Gray)
4. Text Color: #333333 (Dark Gray)
5. Accent Colors: #2ecc71 (Green), #e74c3c (Red)

### Images

1. Always include alt text
2. Optimize images for email (under 200KB)
3. Use proper dimensions that fit within email width
4. Include the company logo in every email
5. Use product images where relevant

### Content Guidelines

1. Keep subject lines clear and under 50 characters
2. Use a clear hierarchy with headers and subheaders
3. Keep paragraphs short (3-4 lines maximum)
4. Include a clear call-to-action button
5. Personalize content with user's name where appropriate

### Technical Considerations

1. Use inline CSS (not external stylesheets)
2. Avoid JavaScript (not supported in most email clients)
3. Use tables for layout for maximum compatibility
4. Test in multiple email clients before sending
5. Ensure all links work and have proper tracking parameters

## Variable Usage Guidelines

When using variables in templates, follow these guidelines:

1. Always define all variables used in the template in the `variables` array
2. For loop variables, include both `#each arrayName` and `/each` in the
   variables list
3. For conditional variables, include both `#if conditionName` and `/if` in the
   variables list
4. Standard variables like `siteUrl` should be included in all templates
5. Always test templates with realistic data before sending

## Email Types and Special Considerations

### Transactional Emails

- Order confirmations
- Shipping notifications
- Password resets
- Account notifications

_Requirements:_ Clear subject lines, important information visible without
scrolling, minimal promotional content, clear next steps.

### Marketing Emails

- Newsletters
- Promotional offers
- Product announcements
- Sales campaigns

_Requirements:_ Compelling subject lines, clear value proposition, strong
call-to-action, unsubscribe option, compliance with GDPR.

### Automated Sequence Emails

- Welcome series
- Abandoned cart
- Re-engagement campaigns

_Requirements:_ Consistent branding across series, clear progression,
non-overlapping schedules.

## Implementation Plan

To improve current templates:

1. ✅ **Phase 1:** Correct all template variables (completed)
2. **Phase 2:** Update templates to include required elements:
   - Add footer with contact information
   - Add unsubscribe links to marketing emails
   - Add social media links
   - Add company address
3. **Phase 3:** Review and optimize for mobile devices
4. **Phase 4:** Test in multiple email clients

## Testing Checklist

Before deploying a template:

- [ ] All variables render correctly
- [ ] Template displays correctly on mobile devices
- [ ] All links work and point to correct destinations
- [ ] Images load correctly and have alt text
- [ ] Unsubscribe link works (for marketing emails)
- [ ] No broken layouts in major email clients
- [ ] Subject line is clear and properly formatted

## Tools for Email Design

- Litmus: For email testing across clients
- Mail-Tester: To check spam score
- Campaign Monitor: CSS inliner
- Responsinator: For checking responsive design

By following these guidelines, TechTots email templates will maintain a
professional, consistent appearance that reinforces the brand and provides a
good user experience.
