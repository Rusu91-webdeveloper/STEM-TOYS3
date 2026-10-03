# Meta Pixel preview configuration — 2026-10-03

Production activation was subsequently authorized and completed on 3
October 2026. The historical preview-only scope below describes the earlier
setup; see the [production release record](2026-10-03-production-release.md) for
the production environment, deployment and live verification.

## Source and scope

The owner supplied the Meta manual-installation base code. Its
`fbq('init', '787839287564208')` confirms the browser Pixel ID, resolving the
earlier ambiguity between an App-labelled dataset and a website Pixel. This
identifier is public browser configuration, not an API access token.

Fetched Git state before work: production `origin/main` is `eeadaab6`;
`codex/cookie-consent` and draft
[PR #59](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/59) are at
`ac1fcd70572efd3cff839887383a51aee9af7549`. The worktree was clean.

Vercel project `stem-toys-3`, ID `prj_ToPwZRPSjvd9qI25Vscf6CeMSrVW`, had no
`NEXT_PUBLIC_FACEBOOK_PIXEL_ID` in its Project environment-variable search.
Configured that key as Config with value `787839287564208`, scoped only to
Preview branch `codex/cookie-consent`. Vercel confirmed the saved value and
branch. Production, Development and global Preview were not selected.

Redeployed the latest branch source with the Preview target and existing Build
Cache disabled, because Next.js public variables are embedded at build time.
Deployment: `dpl_77ERreNXB3VJUPxBSrRYQiUVozsW`; host:
`stem-toys-3-nnh9yg7ba-rusujobs-3774s-projects.vercel.app`.

The existing consent-gated `components/analytics/FacebookPixel.tsx` uses this
environment variable. No additional base-code or unconditional noscript image
was inserted. No Instagram/TikTok database configuration or Meta account
settings were changed. The production deployment was not promoted or rebuilt.

## Verification

Deployment is READY. Browser checks against that immutable preview pass at
1440px and 390px widths with Playwright's standard Desktop Chrome user agent:

- No Meta SDK or event requests before a choice, after refusal/reload, or with
  analytics consent alone.
- Advertising-only consent loads `fbevents.js` and the configuration for
  `787839287564208`, both HTTP 200. One `PageView` request for this ID receives
  HTTP 200 per tested load. The pre-existing `RomanianSTEMView` custom event
  also receives HTTP 200; there is no second `PageView` initialization.
- Withdrawal reloads the document, removes `_fbp`/`_fbc` cookies and produces no
  subsequent Meta requests during the observation window.
- No JavaScript exceptions or Content Security Policy violations.

The first checks using Chromium's default headless user agent loaded the SDK and
Pixel config (HTTP 200) and initialized two events, but sent no `/tr/` request.
Repeating the identical flow while changing only the user agent to Playwright's
standard Desktop Chrome value sends both events successfully. The downloaded
Meta configuration includes a HeadlessChrome classification. This is an observed
test-client difference, not evidence of a storefront-code defect. No source
change was made to force Meta to accept headless traffic.

Network evidence is retained in
[`../qa/meta-pixel/preview-results.json`](../qa/meta-pixel/preview-results.json).
This records host/path, Pixel ID, event and response status, with no full event
payloads, browser identifiers or preview-access tokens. A 200 response proves
transmission, not that Events Manager attributes/reports it correctly.

This is a configuration-only change with documentation; the consent source and
its previously passing focused checks remain unchanged. Required Git regression
hooks run for publication. There are no schema/migration changes.

## Remaining work

The owner's 2026-10-03 16:04:26 screenshot confirms Meta Events Manager Overview
receipt: dataset `787839287564208`, `PageView` and `RomanianSTEMView` Active,
three events each. This does not identify the source browser or verify the
separate Test events pane. Purchase conversion tracking, attribution and
campaign readiness remain unverified. The privacy review is recorded in
[2026-10-03-privacy-policy.md](2026-10-03-privacy-policy.md); its remaining
operational/security findings must be handled before release approval.

To disable this preview configuration, remove the branch-specific public key and
rebuild the preview. Previously built immutable deployments retain their
compiled value; ordinary refusal/withdrawal continues to prevent tracking.
