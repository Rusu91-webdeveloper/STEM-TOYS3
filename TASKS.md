# Current tasks

- [x] 2026-10-09 — Make admin email screens use saved store records and remove
      fictional/failed-read values. Estimate: 2–4 hours. Template filtering and
      content, saved sequence fields/steps, real subscriber/history/trigger
      data, campaign draft/send controls and provider acceptance auditing are
      deployed in PR #78, production source `f808b5b3`, READY on both domains.
      Six focused suites / 45 tests, isolated PostgreSQL, compiled authenticated
      HTTP mutations and local browser checks pass; required Jest/TypeScript
      comparisons add zero regressions. All 44 live anonymous HTTP assertions
      pass. Authenticated production reads confirm 87 templates, 4 active
      subscribers, 17 rules and 12 legacy unconfirmed email logs; no sequences
      or campaigns are saved. Preview and pagination work. No live email was
      sent or test data written. Direct SQL reconciliation requires Neon
      reauthorization. Automatic sequence execution remains open below.
      Completed 2026-10-09; elapsed time not recorded. See the
      [email data audit](docs/audits/2026-10-09-admin-email-data.md).

- [x] 2026-10-09 — Correct the owner's category screen showing all categories as
      inactive with zero products. Estimate: 30–60 minutes. Use real ADMIN
      category records and product relations, validate the response, distinguish
      failed reads from empty results, and verify Romanian desktop/mobile
      rendering. Withdraw broken category actions; preserve catalog data.
      Completed 2026-10-09; elapsed time not recorded. Two focused suites / 15
      tests and real local PostgreSQL/browser refresh/mobile checks pass.
      Publication evidence is recorded on the fix PR. See the
      [category correction audit](docs/audits/2026-10-09-admin-category-data.md).

- [x] 2026-10-09 — Owner authorized deploying all completed admin dashboard
      changes. Estimate: 30–60 minutes. Publish the reviewed branch through the
      existing Git/Vercel production workflow, verify the exact release commit,
      production domains and access boundaries, and record deployed evidence.
      Preserve existing provider acceptance limits and production data. PR #75
      merged as `22ba5e7e`; the production build is READY on both TechTots
      domains. All 40 anonymous HTTP checks, checkout configuration and
      desktop/mobile sign-in checks pass; the release-window runtime scan is
      clear. Private production workflows were not exercised without an admin
      session. Elapsed time not recorded. See the
      [release record](docs/audits/2026-10-09-admin-production-release.md).

- [x] 2026-10-08 — Make the owner admin feel and behave like a premium Romanian
      management system. Estimate: 4–8 hours. Repair configuration saves,
      replace unsupported assurances with verified behaviour, simplify settings,
      verify the core business workflows and retain real data/error states. Core
      settings, real history/restore, checkout consistency, access boundaries
      and Romanian core workflows are implemented locally. Real DB, HTTP and
      desktop/mobile checks pass. Completed locally on 2026-10-09; elapsed time
      not recorded. All 23 focused suites / 151 tests and the production build
      pass. Full Jest/TypeScript comparisons add zero regressions; existing
      repository check debt remains. Live provider and advanced-form acceptance
      remain tracked below. No production deployment.

- [x] 2026-10-08 — Assess whether the redesigned admin is seamless and ready for
      the owner's premium standard. Estimate: 20–40 minutes; elapsed time not
      recorded. Read-only local browser/API and source review confirmed missing
      backup routes, fabricated settings activity, stale save payloads,
      disconnected security controls and incomplete Romanian inner pages. The
      overview's checks do not certify all management workflows. Findings and
      verification limits are in the
      [dashboard audit](docs/audits/2026-10-08-admin-dashboard.md#readiness-follow-up--8-october-2026).

- [x] 2026-10-08 — Audit and redesign the owner/admin dashboard in Romanian.
      Estimate: 3–5 hours; elapsed time not recorded. Nine primary business
      sections, paid-order reporting from actual records, operational attention,
      supplier visibility and explicit failure states are implemented locally.
      Simulated report displays and inactive customer actions are withdrawn;
      customer spending/pagination and notification currencies are corrected.
      Eight focused suites / 48 tests, isolated PostgreSQL and desktop/mobile
      checks pass. Full Jest/TypeScript comparisons add zero regressions;
      existing check debt remains. No production publication or schema change.
      Advanced settings/report source gaps remain documented in the
      [dashboard audit](docs/audits/2026-10-08-admin-dashboard.md).

## Discovered During Work

- [ ] 2026-10-09 — Complete withdrawn image optimization, supplier performance
      scores and supplier-invoice dispatch. Existing implementations simulated
      processing statistics, scored unmeasured return/issue data, or marked
      invoices SENT without sending. They now fail explicitly without data
      writes. Real file processing/storage, complete score sources and invoice
      provider acceptance are required before these actions return success.
      Estimate: 3–6 hours depending on provider/storage access.

- [ ] 2026-10-09 — Replace the unfinished email sequence execution engine with
      durable scheduling, real event enrollment, opt-in enforcement and
      idempotent progress. The editor now persists actual sequence steps and
      identifies activation as saved configuration; automatic execution is not
      certified. No new schedule should silently send to existing customers.
      Estimate: 4–8 hours including provider acceptance and recovery.

- [x] 2026-10-08 — Resolve stale legacy settings callbacks. The canonical editor
      now submits current section drafts directly, with save/reload and conflict
      verification. Legacy Hours/Orders/Inventory/Marketing editors are
      withdrawn; existing metadata consumers are preserved. Estimate: 1–2 hours.
- [x] 2026-10-08 — Make security settings reflect enforced authentication.
      Unsupported MFA/timeout controls and fabricated status are withdrawn;
      server-side ADMIN rendering and API checks are verified. The screen
      describes actual session and credential configuration. Estimate: 2–4
      hours.
- [x] 2026-10-08 — Connect configuration snapshots/history/restore to real ADMIN
      services with version checks and automatic pre-change copies. Database and
      browser save/restore pass. Copies cover editable settings, not the full
      database. Fabricated activity/health are withdrawn. Estimate: 2–4 hours.
- [ ] 2026-10-08 — Complete advanced legacy forms and provider acceptance. Core
      Romanian order/customer/catalog/return/supplier lists, currency displays,
      searches, settings, stock and return-note persistence are verified
      locally. Real payment/refund, inbox receipt and courier AWB execution
      still require provider acceptance; gross paid-order reports explicitly do
      not deduct partial refunds. Estimate: 4–8 hours for remaining
      provider/advanced-form scope, depending on available integration access.

## Earlier tasks

- [x] 2026-10-08 — Owner authorized publication of the completed storefront
      improvements. PR #73 merged as `a419d8b3`; the production build is READY
      on both TechTots domains. Live desktop/mobile gift finder, product
      guidance, image keyboard/focus behavior and catalog search/list pass.
      Public feed contains 97 unique products; readiness succeeds and anonymous
      operations access is denied. No release-window runtime errors were found.
      See the
      [release record](docs/audits/2026-10-08-storefront-production-release.md).
      Merchant Center, real inbox/customer material, backup/restore evidence and
      field performance remain external acceptance items.

- [x] 2026-10-07 — Implement the storefront A+ review improvements beyond
      testing. Estimate: 2–4 hours; elapsed time not recorded. Branch
      `codex/storefront-excellence` from clean `f1b37da1`. Buying summaries for
      all 104 reviewed products, qualified age labels, gift finder, early
      shipping estimates, official demonstrations/manuals, Romanian search and
      accessible controls, genuine purchase reviews/delivery invitations,
      Merchant feed and admin health visibility are implemented. Local
      desktop/mobile, feed, access-control and focused checks are recorded in
      the [storefront audit](docs/audits/2026-10-07-storefront-excellence.md).
      Production build and 84 focused checks pass; full Jest/TypeScript
      comparisons add zero regressions. Existing repository check debt remains.
      Production publication completed on 8 October in PR #73. Merchant Center
      registration, authentic customer footage and provider backup/restore
      confirmation remain separate acceptance steps.

- [x] 2026-10-07 — Owner explicitly authorized publishing all completed PR #71
      changes to production. Estimate: 30–60 minutes. Confirm exact reviewed
      commit, merge, verify the production deployment and both TechTots domains,
      check anonymous access restrictions and record release evidence. Supplier
      destinations require case approval/warehouse/deadline review; company
      fallback and digital exceptions remain in place. No live payment or
      customer return is used as a test fixture. Release does not close the
      outstanding Stripe sandbox, inbox or privacy/provider acceptance items. PR
      #71 merged as `7c9cce07`; its production build is READY on both domains.
      Public pages, anonymous API denials and desktop/mobile checks pass. No
      release-window runtime errors were found. See the
      [production release record](docs/audits/2026-10-07-holds-returns-production-release.md).

- [x] 2026-10-07 — Implement supplier/company return destinations from the
      owner's two supplied dropshipping contracts. Estimate: 2–4 hours. Review
      contract conditions and address evidence; record authenticated destination
      review before approval; keep emails, identification PDFs and account
      instructions consistent for single, mixed and digital returns. Preserve
      consumer remedies independently of supplier reimbursement and verify SMTP
      transport. Implemented authenticated contract review, safe company
      fallback, per-item destinations and PDFs, digital exceptions, SMTP
      acceptance/retry, and professional email/PDF branding. Eleven focused
      suites / 73 tests and real local admin/API/mobile/PDF checks pass. Owner
      confirmed the original mixed email with three PDFs; three revised messages
      were accepted by SMTP, with revised receipt/rendering pending. Details in
      the
      [supplier audit](docs/audits/2026-10-07-supplier-return-destinations.md).
      Owner subsequently authorized production release on 7 October; PR #71 is
      merged as 7c9cce07. Release verification is tracked above.

- [ ] 2026-10-07 — Finalize COD hold expiry, returns/refund acceptance and
      privacy operations at the owner's request. Estimate: 3–5 hours; elapsed
      time not recorded. Branch `codex/holds-refunds-privacy` from clean main
      `baa18e29`. Implementation now defines delivery/cancellation/refusal after
      expiry, shared verified release/retry evidence, cumulative manual
      repayment, digital-product review and refund access control, truthful
      email acceptance, and calendar-month privacy response deadlines. PR #64 is
      already merged. Implementation/local validation completed 7 October: 194
      focused tests, real local admin/refund/erasure and desktop/mobile checks
      pass; full Jest and TypeScript comparisons add zero failures. Existing
      repository test/type debt remains. Local/regression evidence and the draft
      follow-up are recorded in
      [the operations audit](docs/audits/2026-10-07-holds-refunds-privacy.md).
      Published as
      [PR #71](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/71), now
      merged and deployed after the owner's explicit release request. Owner
      confirmed company address and authorized Gmail test inbox. Current Neon
      30/60-day auto-delete policies and daily cron HTTP 200 were verified;
      5,593 overdue performance records remain, with deletion counts unobserved.
      Added aggregate cron evidence that survives console stripping and the
      production warn log level; 14 focused tests pass. Two real withdrawal SMTP
      messages were accepted; rendering confirmation remains pending. Four
      return-email sends initially failed because Brevo's key is disabled (401).
      Return notifications now use existing SMTP credentials; four original and
      three redesigned messages were accepted. Owner confirmed the original
      mixed email's three PDFs; revised rendering remains pending. Supplier
      contracts supplied/reviewed; per-case warehouse authorization and active
      execution remain required. Stripe is reconnected but verified access
      remains live-only; actual sandbox refunds and remaining provider
      agreements are pending. Mac restarts interrupted intermediate checks;
      resumed checks run one heavy job at a time after storage was freed. This
      does not certify an A+.

- [x] 2026-10-06 — Owner requested analysis and repair of the remaining Meta
      crawler chunk failures. Estimate: 1–2 hours. Branch
      codex/crawler-chunk-recovery from current main ccc6a1cb. Preserve
      checkout, entered forms and error telemetry. Reproduce the failed shared
      chunk and add bounded client-loader recovery before React receives a
      rejected import; verify transient/persistent failures, desktop/mobile,
      protected paths and the exact deployed build. Implemented retry before
      rejected imports reach React, recovery for initial script failures missed
      before handler attachment, and persistent page-error reporting. All six
      protected-preview fault cases pass, including real checkout and mobile; 29
      focused tests pass with zero added full-suite/typecheck regressions.
      Normal storefront, catalog and review checks pass. Exact production
      release/acceptance is recorded in
      [PR #70](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/70), after
      its publication gate. The historical bot network trigger remains unknown;
      the reproduced application paths are repaired. See
      [crawler recovery audit](docs/audits/2026-10-06-crawler-chunk-recovery.md).

- [x] 2026-10-06 — Finish the Romanian catalog editorial review and resolve
      storefront review/Redis defects at the owner's request. Estimate: 4–6
      hours. Review every current supplier product against its supplied facts,
      preserve verified ages/contents/specifications, repair public review
      reads, correct Redis rate limiting and investigate chunk loading with
      failure-path and desktop/mobile verification. Preserve production data and
      payment policy; finish the implementation and its deployment evidence
      without stopping at a partial diagnosis. Work from
      codex/romanian-copy-runtime, retaining the previous release record. All
      104 current supplier descriptions were reviewed individually; 38 focused
      tests pass and required complete Jest/ TypeScript comparisons add zero
      failures/diagnostics. PR #68 merged as 803b1efd; production is READY on
      both domains, with full catalog, sampled product/review and desktop/mobile
      checks passed. Redis acceptance is clear; crawler recovery is fault-tested
      but new Meta reports remain open below. Existing merchandising and
      payment/ads policy remain unchanged. See
      [editorial/runtime release](docs/audits/2026-10-06-romanian-copy-runtime.md).
      Elapsed work time not recorded.

- [x] 2026-10-06 — Resolve the remaining Meta crawler script-loading boundary.
      New production reports at 14:23:52 UTC reference chunk 82471 on an
      obsolete PDP that correctly returns 404. Edge queries show the same asset
      delivered 200 JavaScript to Meta's Mac agent; no asset request is recorded
      for the Windows reporter agent in the failure window. Exact Windows-agent
      browser reproduction passes. No confirmed missing asset, firewall denial
      or app render exception. Recovery safeguards are deployed and
      fault-tested, but crawler recovery and the original cause were then
      unconfirmed. Follow-up reproduced and repaired the client-loader recovery
      paths, including an initial script failing before handler attachment.
      Deployed transient and persistent fault acceptance passes; reports and
      protections remain enabled. The historical external trigger is still
      unknown, so this does not claim a complete original crawler network trace.
      See the crawler recovery audit above, the editorial/runtime audit and
      sanitized edge evidence.

- [x] 2026-10-06 — Improve storefront quality after the external C+ review.
      Estimate: 3–5 hours. Implement stock visibility, earlier admin-priced COD
      disclosure, image delivery, compact consent/catalog/checkout, Romanian
      copy/category URLs and SEO fixes; verify desktop/mobile and publish a
      reviewable draft. Owner subsequently authorized publication. PR #67 merged
      as d4271611; production is READY on both shop domains, with live
      desktop/mobile catalog, cart, checkout landing and SEO checks passed.
      Funded real guest COD acceptance remains pending before paid ads. See
      [production release](docs/audits/2026-10-06-storefront-production-release.md)
      and [quality audit](docs/audits/2026-10-06-storefront-quality.md). Elapsed
      work time not recorded.

- [x] 2026-10-06 — Investigate the production crawler chunk-load report after
      the storefront release. Estimate: 30–60 minutes. One Meta crawler error
      was reported for chunk 34634 at 08:35:58 UTC; the same public asset then
      returned 200 JavaScript, and the desktop/mobile QA browser had no page
      errors. Cause is unconfirmed. Preserve the exact deployment evidence; do
      not classify this as fixed or a proven release regression. Existing
      review-fetch localhost errors and Redis rate-limit fallbacks remain
      recorded in the 4 October task and the release audit. Investigation found
      a second report for the same asset; original network cause remains
      unconfirmed. Bounded browsing-page recovery and optional-section retry
      were implemented and fault-tested, preserving checkout/edited forms.
      Published through PR #68; current asset delivery passes ordinary and Meta
      user-agent checks. Two new crawler reports on PR #68 are separately
      recorded below; this historical investigation does not certify resolution.
      See the 6 October editorial/runtime release audit.

- [x] 2026-10-05 — Remove the storefront header legal band at the owner's
      request; put accessible withdrawal/guarantee entries in the footer and
      explain withdrawal using order terminology. Preserve the official asset,
      checkout notice, separate confirmation, receipt and tracking isolation.
      Estimate: 30–60 minutes. Implemented on codex/withdrawal-footer-copy from
      merged main 8185af93. 27 focused tests pass; scoped lint passes. Desktop
      and measured 390px mobile verification confirms no overflow, one-click
      notice rendering, accessible footer link and separate form review. No
      declaration/email was submitted. Elapsed time not recorded.

- [x] 2026-10-05 — Redesign customer and merchant withdrawal emails after inbox
      acceptance exposed an unformatted monospace text block. Estimate: 45–90
      minutes. Preserve the exact declaration, durable reference/time,
      plain-text fallback and delivery/retry behavior; verify desktop/mobile
      rendering and publish only to draft PR #64. Implemented branded HTML with
      distinct customer/merchant content, readable Romanian local time, complete
      receipt evidence and customer policy. 22 focused tests pass;
      desktop/mobile previews checked, including maximum-length fields at 390
      CSS pixels without overflow. Inbox rendering of the revised email remains
      to be accepted; keep the PR draft. Elapsed time not recorded.

- [ ] 2026-10-04 — Apply the owner-approved consumer return-cost policy before
      purchase and throughout returns. Customer pays direct withdrawal return
      carriage; full withdrawal includes refund of initial standard delivery;
      nonconformity is remedied without customer transport costs. Remove
      implicit COD guarantee capture, require reviewed refund amounts and
      correct dispatch deadlines in customer instructions. Estimate: 2–4 hours.
      Continue draft PR #64; preserve configured COD fees and supplier changes.
      Implementation complete: precontract copy, no automatic COD capture,
      reviewed Stripe amount/retry checks and manual repayment proof. 86 focused
      tests and local mobile/PDF checks pass. Authorized preview guest intake
      and receipt export pass on 5 October; owner confirms both inbox
      deliveries. Authenticated admin and financial acceptance remain pending;
      keep draft. Evidence: docs/audits/2026-10-04-return-cost-policy.md.

- [ ] 2026-10-04 — Implement the official Romanian harmonised legal-guarantee
      notice and the online contract-withdrawal function under OUG 18/2026.
      Estimate: 2–4 hours. Verify official design/dates, guest access, two-stage
      confirmation, durable receipt, persistence and merchant processing.
      Preserve concurrent Cursor work; no production release without review.
      Notice, guest two-stage form, durable receipt/outbox and ADMIN review
      implemented. 35 focused tests pass; local browser checks pass for the
      notice/review/security failure path. Real local persistence is blocked by
      unavailable Docker/Postgres. Prepare draft preview for owner-approved
      inbox/persistence/admin acceptance.
      [Draft PR #64](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/64).
      Required full Jest/TypeScript comparisons add zero failures/diagnostics.
      Fix discovered mobile overlap: the withdrawal link must remain usable
      while the guarantee notice is open. Keep the legal form isolated from
      optional tracking, including SDKs loaded on previous pages. Evidence:
      docs/audits/2026-10-04-legal-guarantee-withdrawal.md.

- [x] 2026-10-04 — Owner's later instruction: preserve the Cursor dynamic COD
      lookup/formatter and flat 9.90 lei / 0% fallback; correct PR #62's
      description and keep further changes draft without force-pushing. PR #62
      had already merged at 15:18 EEST before this instruction arrived and its
      deployment is live. Description corrected; shared branch pulled with
      --ff-only; current production API confirms 9.90 / 0%. Prepare a separate
      draft follow-up for the fallback/tests and release evidence.
      [Draft PR #63](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/63)
      is published for review; required Jest/TypeScript comparisons add zero
      failures. Owner subsequently authorized merging on 4 October after
      checking concurrent Cursor work. PR #63 merged as 26adeac4; production is
      READY on both domains, with shipping/COD/policy/access checks passed.
      Cursor preserved; no force-push. Release evidence is recorded in PR #63.
- [x] 2026-10-04 — Discovered in production log review: product-review fetch
      uses NEXT_PUBLIC_BASE_URL or localhost:3000 and currently hits
      ECONNREFUSED 127.0.0.1:3000, returning empty reviews on sampled HTTP-200
      product pages. The fetch code dates to July 2025; PR #62 did not change
      it. Investigate the public review read path separately; do not invent
      ratings or change production configuration as part of draft-only COD
      follow-up. Estimate: 30–60 minutes. Redis rate-limit timeout on /api/books
      also fell back to memory; no evidence of a failed books response (HTTP
      200). Resolved at the owner's request on 6 October through PR #68: shared
      direct public review reads remove self-HTTP localhost calls; atomic Redis
      counters use their own bounded budget and tested fallback/ recovery. Live
      public reads and deployment-scoped acceptance checks pass; no production
      rows or environment settings were changed. Evidence:
      docs/audits/2026-10-06-romanian-copy-runtime.md.
- [x] 2026-10-04 — At the owner's request, fix shipping consistency first: trace
      the cart drawer, authoritative checkout settings, stale shipping defaults
      and COD fee explanations. Estimate: 1–2 hours. Verify the exact configured
      rates and threshold before editing or changing payment totals.
- [x] 2026-10-04 — Then finish privacy operations: verify retention settings,
      correct account-erasure behavior and inventory historical sensitive card
      records using aggregate read-only evidence. Estimate: 2–4 hours. Resolve
      business choices and recovery requirements before dependent data changes.
- [x] 2026-10-04 — Then fix legal/trust content: terms, warranty wording and
      revision, consumer links and unsupported claims. Estimate: 1–2 hours. Use
      current official sources and verified business facts; remove claims
      without evidence. Complete and verify these three scopes in that order.
      Implementation and local verification:
      docs/audits/2026-10-04-shipping-privacy-trust.md. Live aggregate card
      inventory verified empty; GA4 2 months/reset disabled saved and reloaded.
      Owner-approved application policies saved: email-event logs 30 days,
      performance metrics 60 days, daily cleanup enabled. Final
      approved-retention preview and production checks passed. PR #62 merged at
      15:18 EEST as 7a282f63; production dpl_4c9SX2trBtgxuwLi3fsTtTQ9bHxm is
      READY. Both shop domains return current shipping settings, legal/privacy
      wording and guest denial. Authenticated admin UI confirms 30/60-day
      automatic policies and zero total/PAN/CVV card records. Work spanned
      interrupted sessions; elapsed time was not recorded. No manual cleanup or
      real customer erasure was performed. Later draft-only COD instructions are
      recorded separately above; the first scheduled cleanup is unobserved.
- [x] 2026-10-04 — Release owner-approved PR #61 to production and verify the
      live COD policy, guest token issuance, storefront and consented tracking.
      Estimate: 15–30 minutes. Owner confirmed the payment form works but has
      insufficient funds; successful card authorization/order placement remain
      pending. Preserve that limitation and record the production deployment.
      Completed 02:37 EEST; merge/build/live verification took about 8 minutes,
      excluding release-record publication. PR #61 merged as `9ce31e48`;
      production `dpl_2GkKsmuuepNP7wEg3F51oACiJhzu` is READY on both shop
      domains. Live mandatory COD policy, guest cookie/token continuity, admin
      denial, storefront and consent withdrawal checks pass. No error/fatal rows
      appeared in the deployment-scoped observation window. See
      [production record](docs/audits/2026-10-04-cod-production-release.md).
- [x] 2026-10-04 — Require a shipping-cost card authorization for every COD
      order, including low-value orders and returning customers, as explicitly
      requested by the owner. Trace and fix the guest checkout CSRF failure
      observed in the owner test; preserve signed-token validation. Estimate:
      1–2 hours. Verify denial paths and publish a reviewable preview. Real card
      authorization/order submission remains an owner acceptance step. Completed
      2026-10-04; elapsed time was not recorded. Every eligible COD order now
      requires a server-priced shipping hold; lockers remain prepaid only. Guest
      token issuance/parsing and original-request validation are repaired. 84
      focused tests pass and required full Jest/TypeScript comparisons have zero
      added failures/diagnostics. Source `3c6412e8` is READY; deployed
      policy/token/cookie flags and shipping copy are verified. Fresh checkout
      prepared with blank customer fields; production unchanged.
      [Draft PR #61](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/61);
      see [COD audit](docs/audits/2026-10-04-mandatory-cod-guarantee.md).
- [ ] 2026-10-04 — Review Stripe authorization expiry against delivery and
      refusal timing; define operational handling of `capture_before` before
      promising that every late refusal's shipping cost remains recoverable.
- [x] 2026-10-03, 21:58 EEST — Connect consent-gated Meta product/cart/checkout
      events to the real storefront, verify authoritative paid-purchase signals,
      correct IDs/RON values and duplicate prevention, and publish a preview.
      Estimate: 1–2 hours. Owner confirmed COD Purchase only after payment
      collection. Prepare the guest COD test for owner completion; do not invent
      customer details or submit a chargeable order without a concrete order.
      2026-10-04 browser investigation: analytics-only/refusal correctly block
      Meta; its consented iframe/form event transport is blocked by CSP. Allow
      only the Facebook tracking path and repeat preview verification. Completed
      2026-10-04; active work spanned interrupted sessions (elapsed time
      includes restart/waits). Browser proves one ViewContent, AddToCart and
      InitiateCheckout, correct ID/quantity/168 RON and HTTP 200, with no
      advertising traffic before consent/after withdrawal. 55 focused tests
      pass; full baseline comparisons have zero added failures/diagnostics.
      [Draft PR #61](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/61);
      verified source `ae3f48d4`, audit records deployment and limitations.
- [ ] 2026-10-04 — Owner: complete prepared guest COD order with real details
      and verify receipt in Meta Events Manager. Live paid-card Purchase proof
      remains open. Actual COD Purchase requires a verified cash-collection
      signal and consent-aware server integration; delivery alone is
      insufficient. Owner confirmed the card form works but has insufficient
      funds. Successful shipping authorization and completed order remain
      pending after release.
- [x] 2026-10-04 — Discovered during tracking verification: cart drawer shows
      Gratuit shipping for a 168 lei cart; checkout correctly shows 19,99 lei.
      Corrected and released in PR #62; verified preview drawer/cart totals at
      206/412/618 lei and configured rates on both live domains.
- [x] 2026-10-03, 21:39 EEST — Merge the owner-approved saved-card fix, verify
      the resulting production deployment and record authenticated acceptance.
      Estimate: 10–20 minutes. Existing-record inventory remains a separate
      operation. Completed 21:44 EEST; merge and production checks took about 5
      minutes, excluding release-record publication checks.
      [PR #60](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/60) merged
      as `9bc2ef3c`. Production deployment `dpl_72wNAcBJnoDSTpyMruMnyCx3Gmx8` is
      READY on both shop domains; homepage, anonymous API denial, account login
      and auth-provider checks pass. No release errors encountered.
- [ ] 2026-10-03 — Work through the remaining audit items one at a time at the
      owner's request. Start with saved-card safety: trace account/checkout
      callers, stop application collection/storage of full card details, verify
      authorization and checkout regressions, and publish a reviewable fix.
      Estimate for step 1: 1–2 hours. Inventory/cleanup of any existing
      sensitive records requires a separate verified operation; no speculative
      data purge.
- [x] 2026-10-03 — Implement and publish saved-card collection containment.
      Completed 2026-10-03, 20:54 EEST; elapsed time was not recorded.
      [PR #60](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/60), final
      source `6aa13dc8`. Fifty-six focused tests pass; required full Jest and
      TypeScript comparisons report zero regressions. Disk exhaustion initially
      blocked the test snapshot; clearing generated Jest cache resolved it. No
      schema/migration changes or database cleanup. The owner deployed the final
      source to production and confirmed authenticated account-page, redirect
      and checkout-option checks. PR #60 merged as `9bc2ef3c`. Existing-record
      inventory completed read-only on 2026-10-04: zero live card/PAN/CVV rows,
      also confirmed by the authenticated admin UI. Historical recovery-point
      contents/offline exports were not inspected. See
      [saved-card audit](docs/audits/2026-10-03-saved-card-safety.md).
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
      PR #59 merged as `33d8c2dc`; production deployment
      `dpl_9Hikj4uunou8WhjYBxKJ2k1e74go` is READY on techtots.ro and
      www.techtots.ro. See
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
- [ ] Follow-up from 2026-10-03 privacy review: inventory and plan authorized
      cleanup of any historical encrypted PAN/CVV records. Account POST/PUT
      collection is disabled by PR #60; checkout continues to use its payment
      providers. Estimate: after verified access and aggregate data inventory.
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
