## Incidents & Fixes Index

This document groups focused incident/fix write‑ups and deep dives so they remain available without cluttering the core documentation.

### Returns system

- `RETURNS_COMPLETE_FIX_SUMMARY.md` – canonical end‑to‑end summary of all historic returns issues, backend/frontend fixes, and the final behavior

### Admin & payments behavior

- `docs/ADMIN_ORDER_STATUS_CACHE_FIX.md` – why the admin dashboard now refetches from the server and how cache invalidation works
- `docs/COD_PAYMENT_STATUS_FIX.md` – business rules for COD orders (`DELIVERED` ⇒ `PAID`) and the backfill script

### Database safety & deployment

- `DATABASE_SAFETY.md` – operational DB safety workflows and emergency playbooks
- `CURSOR_DATABASE_SAFETY_RULE.md` – enforced AI/database safety rules in Cursor
- `PRE_PUSH_SAFETY_GUIDE.md` – pre‑push migration validation and backup protocol

These docs are primarily useful when:

- Investigating regressions in the same areas (returns, admin orders, COD, DB safety)
- Explaining “why this is implemented this way” to future maintainers
- Preparing post‑mortems or similar fixes in new code paths

