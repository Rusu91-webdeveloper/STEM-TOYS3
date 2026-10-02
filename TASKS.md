# Current tasks

- [ ] 2026-10-03 — Protect admin analytics GET/POST and publish a draft PR.
      Estimate: 1–2 hours. Authorization fix implemented; 32 focused tests pass.
      Publication checks are being reconciled with reproduced failures on
      unchanged main. See
      [audit](docs/audits/2026-10-03-admin-analytics-auth.md).

## Discovered during work

- Repository TypeScript and full Jest checks have substantial existing failures.
  Regression checks must keep those failures visible and block additional ones.
- Full historical migration validation flags unchanged 2025 index removals.
  Database releases still require full validation and a recent backup; this
  security patch changes no schema or migration.
