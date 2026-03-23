# PROJECT_MAP.md — STEM-TOYS3

## Project identity
- **Project:** STEM-TOYS3 / TechTots
- **Type:** Full-stack STEM educational toys e-commerce platform
- **Primary market:** Romania
- **Primary purpose:** Sell STEM products through a modern storefront with admin operations, supplier workflows, localized payments/shipping, SEO content, and launch-ready operations.

---

## High-level stack
- **Frontend:** Next.js 15 App Router, React 19, TypeScript, Tailwind, Shadcn/Radix
- **Backend:** Next.js route handlers / server actions + Prisma
- **Database:** PostgreSQL (Neon) via Prisma
- **Cache / sessions / limits:** Redis / Upstash
- **Auth:** NextAuth.js
- **Payments:** Stripe + Netopia support appears present in docs/codebase
- **Email:** Resend + email automation tooling
- **Monitoring:** Sentry + analytics hooks
- **Testing:** Jest + Playwright
- **Deployment:** Vercel / Railway-related files present

---

## Codebase scale snapshot
Cheap/local scan snapshot:
- `app/` → **579 files**
- `components/` → **179 files**
- `features/` → **216 files**
- `lib/` → **344 files**
- `prisma/` → **29 files**
- `scripts/` → **54 files**
- `__tests__/` → **98 files**
- `e2e/` → **6 files**
- top-level docs are extensive

This is a **large project** in both feature count and operational surface area.

---

## Main system surfaces

### 1) Public storefront
Main customer-facing commerce surface.

Key routes include:
- `/`
- `/products`
- `/products/[slug]`
- `/categories`
- `/checkout`
- `/blog`
- `/contact`
- `/faq`
- legal/info pages
- Romanian SEO landing pages and educational content pages

### 2) Customer account area
For logged-in customer self-service.

Key routes include:
- `/account`
- `/account/orders`
- `/account/addresses`
- `/account/payment-methods`
- `/account/returns`
- `/account/wishlist`
- `/account/settings`
- `/account/digital-library`

### 3) Admin platform
Large internal operations surface.

Key routes include:
- `/admin`
- `/admin/orders`
- `/admin/order-management`
- `/admin/products`
- `/admin/categories`
- `/admin/customers`
- `/admin/analytics`
- `/admin/advanced-analytics`
- `/admin/seo-dashboard`
- `/admin/email-*`
- `/admin/suppliers`
- `/admin/supplier-invoices`
- `/admin/returns`
- `/admin/ops-queue`
- `/admin/messages`
- `/admin/settings`
- `/admin/store-settings`
- `/admin/content-calendar`
- `/admin/competitor-analysis`

### 4) Supplier portal
Meaningful B2B / dropshipping support surface.

Key routes include:
- `/supplier`
- `/supplier/dashboard`
- `/supplier/products`
- `/supplier/orders`
- `/supplier/analytics`
- `/supplier/performance`
- `/supplier/payments`
- `/supplier/messages`
- `/supplier/support`
- `/supplier/invoices`
- `/supplier/settings`
- `/supplier/apply`
- `/supplier/register`

### 5) API layer
A substantial API surface exists under `app/api/*`.

Observed routes include:
- cart
- products
- categories
- orders
- newsletter
- blog
- reviews
- email
- auth-related helpers
- health/debug/test routes
- inngest webhook route
- uploadthing route
- store settings

### 6) Business logic layer
`lib/` is broad and likely contains the real operational logic.

Observed domains include:
- auth / authorization
- email / notifications
- cache / invalidation
- db helpers
- order processing / fulfillment sync
- conversion tracking
- image management / upload
- performance / monitoring
- pricing / shipping / returns helpers
- security / CSRF / rate limits

### 7) Data layer
Prisma schema indicates a broad platform, not just a basic shop.

Visible domains include:
- users / auth / 2FA / security logs
- tenants / organizations
- orders / payments / returns
- suppliers / support / tickets / invoices
- segmentation / lifecycle data
- blogs / content / email sequences
- wishlist / reviews / downloads
- analytics / personalization / advanced customer fields

---

## Operational / business modules inferred
This project is not just a storefront. It appears to include:
- commerce engine
- admin operations layer
- supplier/dropshipping workflows
- localized Romanian shipping/payment logic
- email automation
- content/SEO engine
- analytics/reporting
- customer account area
- returns and support flows
- launch/ops documentation

---

## Documentation footprint
The project already contains unusually rich documentation, including:
- architecture docs
- API reference
- features guide
- environment setup
- database safety and audit docs
- shipping analysis
- Fan Courier integration doc
- launch checklist
- supplier sync and operations docs
- SEO / analytics / support docs

This is a strength: the project already has internal memory; it just needs to be compressed into founder-useful project intelligence.

---

## Key architectural observation
STEM-TOYS3 appears to be a **platform-grade e-commerce codebase**, not a simple single-purpose store.

That means analysis must account for 3 different realities:
1. **What is built**
2. **What is actually needed for launch**
3. **What is extra complexity that can wait**

That distinction will matter more than raw feature count.

---

## Immediate map summary
If I had to explain the project in one sentence:

**STEM-TOYS3 is a large Romanian STEM commerce platform with storefront, admin, supplier, analytics, logistics, content, and automation layers — probably more powerful than what is strictly required for an initial focused launch.**
