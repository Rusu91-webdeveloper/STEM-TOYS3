# Current tasks

- [ ] 2026-10-03 — Work through the remaining audit items one at a time at the
      owner's request. Start with saved-card safety: trace account/checkout
      callers, stop application collection/storage of full card details, verify
      authorization and checkout regressions, and publish a reviewable fix.
      Estimate for step 1: 1–2 hours. Inventory/cleanup of any existing
      sensitive records requires a separate verified operation; no speculative
      data purge.
- [ ] Subsequent steps: checkout and Meta conversion verification; deletion and
      retention handling; terms/warranty and consumer links; evidence-based
      verification and fixes for remaining COD/FANbox, claims, catalog and SEO
      findings. Resolve missing business facts before dependent changes.

- [x] 2026-10-03 — At the owner's request, release all pending PR #59 changes to
      production, configure the confirmed public Meta Pixel ID for production,
      verify consent/withdrawal and privacy on techtots.ro, and record the
      release. Estimate: 20–40 minutes. No schema/migration changes. Existing
      card-storage, erasure and operational retention follow-ups remain open.
      Completed: 2026-10-03, 19:03 EEST; actual elapsed time was not recorded.
      PR #59 merged as
      `33d8c2dc`; production deployment `dpl_9Hikj4uunou8WhjYBxKJ2k1e74go` is
      READY on techtots.ro and www.techtots.ro. See
      [production release record](docs/audits/2026-10-03-production-release.md).

- [x] 2026-10-03 — Apply the owner's confirmed trade-register number
      `J2025035239005` to the shared legal config, footer fallback and privacy
      notice. Completed: 2026-10-03. Estimate: 15–30 minutes; editing and scoped
      validation took about 3 minutes, excluding Git hooks and Vercel build.
      Existing About/footer translations already agree. Formatting, ESLint and
      diff checks pass. Publication/preview verification recorded in
      [draft PR #59](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/59).

- [x] 2026-10-03 — Review and correct the privacy policy against verified
      operator, processing flows, consent behavior and official legal/provider
      sources. Record Meta account receipt and publish a reviewable preview.
      Estimate: 1–2 hours. Do not invent operational retention or transfer
      facts. Draft review completed: 2026-10-03, 16:47 EEST. Estimate: 1–2
      hours; actual elapsed time was not recorded. PR #59 remains a draft.
      Initial preview c1d50d3c is READY; server HTML, desktop/mobile layout,
      anchors and cookie-settings controls verified. Register-number conflict
      found in preview; optional identifier omitted pending certificate
      confirmation. Full comparisons add no Jest failures or TypeScript errors.
      See [privacy audit](docs/audits/2026-10-03-privacy-policy.md).
- [ ] Owner follow-up: confirm the company address, GA4 retention setting,
      operational deletion schedule and provider agreements before final
      operational privacy review. Production Meta was activated at the owner's
      explicit request; these follow-ups remain open.
- [ ] Follow-up from 2026-10-03 privacy review: investigate the authenticated
      saved-card POST that persists encrypted PAN/CVV; replace direct card
      storage with provider tokenization and plan authorized cleanup. Estimate:
      after scope/data inventory.
- [ ] Follow-up from 2026-10-03 privacy review: reconcile the GDPR deletion
      endpoint with actual scheduled cleanup, guest/order retention and
      one-month response rules. Estimate: after scope/data inventory.

- [x] 2026-10-03 — Configure confirmed Meta Pixel ID `787839287564208` for the
      `codex/cookie-consent` Vercel preview branch and verify consent gates
      against real browser requests. Completed: 2026-10-03. Estimate: 30–60
      minutes; actual elapsed time was not recorded. Preview `ac1fcd70`,
      deployment `dpl_77ERreNXB3VJUPxBSrRYQiUVozsW`, READY. Both viewport checks
      pass: one PageView HTTP 200 after advertising consent, no Meta requests
      before consent/refusal/analytics-only or after withdrawal. Default
      headless UA suppresses transmission; standard Chrome UA passes. See
      [Pixel audit](docs/audits/2026-10-03-meta-pixel-preview.md). Production
      activation remains separate; the privacy draft review is recorded above.

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
      Completed: 2026-10-03. Estimate: 1–2 hours; actual elapsed time was not
      recorded. Implementation and 44 focused tests complete; desktop, mobile
      and cross-tab local browser checks pass.
      [Draft PR #59](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/59)
      is published. Corrected preview `892e9de5`, deployment
      `dpl_2xiGMQ7UjHiutxQaHWRiifLDGdF7`, is READY. Real storefront
      desktop/mobile, category separation, cross-tab withdrawal and guest-cart
      persistence checks pass. Commit/push hooks report zero new failures.
      Production remains on `eeadaab6`; Meta activation remains separate.
      Repository visibility/history stay unchanged. See
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
