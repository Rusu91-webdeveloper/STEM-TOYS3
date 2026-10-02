# Current tasks

- [x] 2026-10-03 — Protect admin analytics GET/POST and publish a draft PR.
      Completed: 2026-10-03. Estimate: 1–2 hours; actual elapsed work time was
      not recorded.
      [PR #57](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/57). All
      46 focused tests pass. Actual Git commit/push hooks pass with zero added
      failures against unchanged main. Existing TypeScript, Jest and historical
      migration failures are documented in the
      [audit](docs/audits/2026-10-03-admin-analytics-auth.md).

## Discovered during work

- [ ] 2026-10-03 — Remove public cookie exports and hardcoded Boribon feed
      credentials; prepare and verify history cleanup. Estimate: 1–2 hours.
      Preserve supplier sync through its existing private feed configuration.
      Supplier credential revocation requires Boribon account access; history
      replacement must account for every remote branch and open pull request.

- [x] 2026-10-03 — Deploy PR #57 to production at the owner's request and verify
      anonymous API denial. Completed: 2026-10-03. Estimate: 5–10 minutes;
      actual rollout and verification: approximately 8 minutes. Production
      commit: `33f24a6a`; deployment: `dpl_5nNryPHZdmbhaMR9Z3LWeHU7KRPN`
      (READY). Anonymous full/realtime/report GET and POST return 403,
      private/no-store. Homepage, login and authentication providers return 200;
      Google is enabled. Owner screenshots confirm Google session role
      ADMIN/isActive true and authenticated analytics GET success (generatedAt
      2026-10-02T22:33:12.890Z). Rollback deployment:
      `dpl_Dmv5v2Bv3u1iWpm1NLadiEZCgHoQ` (commit `f928577a`).

- Repository TypeScript and full Jest checks have substantial existing failures.
  Regression checks must keep those failures visible and block additional ones.
- Full historical migration validation flags unchanged 2025 index removals.
  Database releases still require full validation and a recent backup; this
  security patch changes no schema or migration.
- PR #57 is merged and deployed. Anonymous denial and real ADMIN GET success are
  verified in production. Signed-in non-admin denial and authenticated report
  POST behavior have focused test coverage but remain untested live.
