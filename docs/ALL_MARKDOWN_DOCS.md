## All Markdown Documentation Index

This file lists all markdown docs in the project so tools/AI can quickly see what context exists and jump to the right file instead of re‑inventing explanations.

### Top‑level project docs

- `README.md` – Main project overview, features, tech stack, quick start, and links into the rest of the docs.
- `PROJECT_ARCHITECTURE.md` – Detailed architecture, folder structure, patterns, and performance considerations.
- `API_REFERENCE.md` – REST API surface: public, auth, user, supplier, admin; payloads and error formats.
- `FEATURES_GUIDE.md` – Feature‑by‑feature mapping from UX to implementation (components, endpoints, DB tables).
- `ENVIRONMENT_SETUP.md` – Env vars, local/dev/prod setup, deployment flows, troubleshooting.
- `DATABASE_SAFETY.md` – Operational DB safety guide: local vs production, backup/restore, workflows, emergencies.
- `CURSOR_DATABASE_SAFETY_RULE.md` – Cursor/AI rules enforcing safe DB behavior.
- `PRE_PUSH_SAFETY_GUIDE.md` – Pre‑push and migration validation workflow, scripts and required checks.
- `DATABASE_TABLES_AUDIT.md` – Audit of all Prisma tables, which ones are functional vs partial vs schema‑only.
- `DATABASE_TABLES_EXPLAINED.md` – Plain‑language explanations for advanced/future‑oriented tables (tenants, sharding, AI jobs, pixels).
- `SHIPPING_ANALYSIS_REPORT.md` – Deep dive into shipping prices, delivery logic, legal/UX alignment, and missing pieces.
- `FANCOURIER_INTEGRATION.md` – Technical integration map for Fan Courier (endpoints, payloads, flows).
- `IDE_LAUNCH_PACK_GUIDE.md` – Guide for the 50‑product “launch pack” seed data and how to consume it.
- `WHAT_IS_A_TENANT.md` – Non‑technical explanation of tenants/multi‑tenancy vs the current single‑tenant setup.
- `FEATURE_COMPLETION_PLAN.md` – Remaining partial features, priorities, time estimates, ROI.
- `PROJECT_ASSESSMENT_REPORT.md` – Overall project assessment, ratings, and valuation ranges.

### Returns system docs

- `RETURNS_COMPLETE_FIX_SUMMARY.md` – Final end‑to‑end summary of all historic returns issues and the current behavior.
- `RETURNS_FIX_SUMMARY.md` – Technical breakdown of backend and frontend changes for the returns flow.
- `RETURNS_504_TIMEOUT_FIX.md` – Root cause and fix for the 504 timeout on bulk returns (async emails, longer function timeout).
- `RETURN_DUPLICATE_PREVENTION.md` – Multi‑layer design for preventing duplicate returns (schema, backend, UI).
- `RETURN_BUTTON_LOGIC_GUIDE.md` – Detailed UI/UX logic for when the “Return item” button is shown or hidden.

### Docs folder – operations, fixes, and guides

- `docs/INCIDENTS_AND_FIXES.md` – Index of focused incident/fix docs (returns, admin order cache, COD payment, DB safety).
- `docs/ADMIN_ORDER_STATUS_CACHE_FIX.md` – Why admin order status now refetches from the server and how cache invalidation works.
- `docs/COD_PAYMENT_STATUS_FIX.md` – Business rules for COD orders (`DELIVERED` ⇒ `PAID`) and the backfill script.
- `docs/FAN_COURIER_GUIDE.md` – Operational guide for Fan Courier: setup, pricing, AWB flow, and special cases.
- `docs/GOOGLE_SEARCH_CONSOLE_SETUP.md` – How to configure GSC service account + env vars for the SEO dashboard.
- `docs/SUPPLIER_SYNC_PLAN.md` – Supplier feed sync design, current status, and cron/alert plans.
- `docs/SUPPLIER_ORDER_FLOW.md` – SupplierOrder model (one per order item), creation from webhooks and admin, and relation to AWB/tracking.
- `docs/SOP_DAILY_OPERATIONS.md` – Day‑to‑day SOP for running the business (orders, suppliers, returns, KPIs).
- `docs/ONCALL_FULFILLMENT_PLAYBOOK.md` – Launch on-call response procedures for webhook failures, AWB failures, mixed-supplier orders, and stock mismatches.
- `docs/PRODUCT_IMPORT_GUIDE.md` – Product import script, CSV/JSON schema, and linkage to suppliers/categories.
- `docs/CUSTOMER_SUPPORT_MACROS.md` – Email macros/templates for common support scenarios (orders, delays, returns, defects).
- `docs/BUNDLE_CREATION_GUIDE.md` – Bundle product strategy and the bundle creation script behavior.

### Launch & planning

- `LAUNCH_CHECKLIST.md` – Launch blueprint and timeline for bringing the store live.
