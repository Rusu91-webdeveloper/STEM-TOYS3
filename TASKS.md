# Current tasks

- [x] 2026-10-03 — Configure confirmed Meta Pixel ID `787839287564208`
      for the `codex/cookie-consent` Vercel preview branch and verify consent
      gates against real browser requests. Completed: 2026-10-03.
      Estimate: 30–60 minutes; actual elapsed time was not recorded.
      Preview `ac1fcd70`, deployment `dpl_77ERreNXB3VJUPxBSrRYQiUVozsW`, READY.
      Both viewport checks pass: one PageView HTTP 200 after advertising consent,
      no Meta requests before consent/refusal/analytics-only or after withdrawal.
      Default headless UA suppresses transmission; standard Chrome UA passes.
      See [Pixel audit](docs/audits/2026-10-03-meta-pixel-preview.md).
      Production activation and the full privacy-policy review remain separate.

- [x] 2026-10-03 — Protect admin analytics GET/POST and publish a draft PR.
      Completed: 2026-10-03. Estimate: 1–2 hours; actual elapsed work time was
      not recorded.
      [PR #57](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/57). All
      46 focused tests pass. Actual Git commit/push hooks pass with zero added
      failures against unchanged main. Existing TypeScript, Jest and historical
      migration failures are documented in the
      [audit](docs/audits/2026-10-03-admin-analytics-auth.md).

- [x] 2026-10-03 — Add explicit cookie consent with separate analytics and
      advertising choices, withdrawal and tracking gates; verify a preview PR.
      Completed: 2026-10-03. Estimate: 1–2 hours; actual elapsed time
      was not recorded. Implementation and 44 focused tests complete;
      desktop, mobile and cross-tab local browser checks pass.
      [Draft PR #59](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/59)
      is published. Corrected preview `892e9de5`, deployment
      `dpl_2xiGMQ7UjHiutxQaHWRiifLDGdF7`, is READY. Real storefront
      desktop/mobile, category separation, cross-tab withdrawal and guest-cart
      persistence checks pass. Commit/push hooks report zero new failures.
      Production remains on `eeadaab6`; Meta activation remains separate. Repository visibility/history stay unchanged. See
      [consent audit](docs/audits/2026-10-03-cookie-consent.md).

## Discovered during work

- [x] 2026-10-03 — Remove public cookie exports and hardcoded Boribon feed URLs,
      publish and deploy source cleanup. Completed: 2026-10-03. Estimate: 1–2
      hours; elapsed work time was not recorded.
      [PR #58](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/58),
      production `eeadaab6`, deployment `dpl_BEoGgQAttgi2De6tJaL3or3UFoCz`
      READY. Fifty focused tests and actual commit/push regression hooks pass.
      Live feed verifies all 97 selections without database writes.
      Homepage/products/providers return 200; anonymous analytics GET/POST 403.
- [x] 2026-10-03 — Close the proposed history rewrite as unnecessary for this
      finding. Owner confirms Boribon URLs are public catalog feeds; exported
      admin cookie is expired and rejected. No remote history rewrite applied.
      The earlier prepared rewrite is retained as an unused artifact. See
      [cleanup audit](docs/audits/2026-10-03-public-credential-cleanup.md).
- [x] 2026-10-03 — Close the proposed Boribon URL rotation as unnecessary. Owner
      confirms intentional public catalog access. No supplier message, URL
      replacement or revocation performed; existing feed stays configured.

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
