# TechTots Launch Blueprint (Romania 2025)

Practical checklist to track daily progress while building and launching the STEM dropshipping marketplace.

## Week 0 – Foundation

- Confirm SRL legal posture: ANPC distance selling registration, e-Factura onboarding, updated privacy/terms/GDPR pages.
- Deploy production stack (Vercel) and verify Postgres/Redis connections per `ENVIRONMENT_SETUP.md`.
- Configure Stripe (RON), delivery countries, and test checkout workflow (`app/checkout/page.tsx`).
- Prepare staging demo data for admin/supplier dashboards to validate UI flows.

## Weeks 1–2 – Supplier Sourcing

- Build prospect list (target ≥30 suppliers) from Romanian/EU STEM distributors and expo directories.
- Send outreach using supplier landing & application flow; promise dropship terms, CSV onboarding, and co-marketing.
- Collect logistics facts: shipping SLAs, stock sync cadence, return policies, dropship fees.
- Approve first partners in admin (`app/admin/suppliers/page.tsx`) and store compliance docs via Romanian dashboard.

## Weeks 3–4 – Catalog Go-Live

- Bulk import 150–200 SKUs per supplier using admin product tools & CSV templates.
- Map categories/filters (age, discipline, outcomes) for storefront browsing (`app/products/page.tsx`).
- Configure automated commission & invoice schedules in supplier invoice management.
- Stress-test supplier portal (orders, notifications, invoices) with sandbox data.

## Weeks 4–5 – Experience Polish

- Verify end-to-end order flow: shopper checkout → admin fulfillment → supplier status updates → customer emails.
- Localize copy to Romanian and ensure currency formatting across storefront & invoices.
- Confirm compliance dashboard statuses, documentation storage, and alerting.
- Publish help center/FAQ updates reflecting logistics, returns, and GDPR policies.

## Ongoing Marketing & Growth

- Content cadence: 1 blog article/week (AI-assisted drafts), 2 social snippets, 1 STEM kit reel.
- Organic outreach: engage parenting groups, pursue backlinks, offer educator discounts.
- Lifecycle email automations via Resend (welcome, abandoned cart, post-purchase review requests).
- Optional paid tests: RON 1,500/mo split Meta (60%) & Google P-Max (40%); pause underperforming creatives weekly.

## Daily/Weekly Rituals

- **Daily**
  - Check admin dashboard KPIs (orders, revenue, pending tickets).
  - Review supplier portal for new applications/messages; respond within 24h.
  - Monitor Shopify-like metrics: CAC proxy, cart abandon rate, site uptime.
- **Weekly**
  - Update prospect tracker with outreach status and viability notes.
  - Audit marketing performance: content output, organic traffic, ad ROAS (if running).
  - Reconcile supplier invoices/commissions and confirm payouts.
  - Iterate product assortment: add/remove SKUs based on analytics.

## Milestones

- Month 2: 3 active suppliers, 80 live SKUs, 50 orders/month (breakeven CAC).
- Month 4: Launch subscription STEM box, achieve 35% repeat buyers.
- Month 6: 150–200 orders/month, evaluate reinvestment or part-time ops hire.

## Next Steps (This Week)

1. Finalize compliance paperwork and redeploy production with updated legal docs.
2. Compile supplier lead list and send first outreach wave (attach application link).
3. Draft content calendar and AI prompt bank for blog, social, and email sequences.

## e-Factura Automation TODO

- **Gather credentials**: complete ANAF SPV enrollment, obtain qualified digital certificate, and request SmartBill (or chosen provider) API keys/series details.
- **Document tax settings**: map VAT categories, product codes (NC/CPV), company registration data (CUI, address), and payment method labels required on invoices.
- **Add configuration**: extend `.env.local` with e-Factura/SmartBill tokens, series codes, default VAT, and storage bucket for signed XML/PDF archives.
- **Implement service**: create invoice generator module (order → UBL XML), digital signature step (QSCD/cloud), SmartBill upload client, and DB fields for IRN/status.
- **Automate workflow**: hook into order success (Netopia webhook + Stripe capture) to queue invoice jobs, retry on failures, and log IRN/links in admin UI.
- **Testing & go-live**: run SmartBill sandbox tests, verify ANAF acceptance, send sample invoices to accounting, then enable automation in production.
