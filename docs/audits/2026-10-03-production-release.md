# Production release — 3 October 2026

## Authorization and source

The owner explicitly requested: “push all the changes we made so far to
production.” Before releasing, fetched origin and confirmed a clean tested
application head `4a3b99de6796d9088367993a57bede7b09f5c4c0` on
`codex/cookie-consent`, with PR #59 mergeable and its Vercel preview successful.
The only subsequent local change was this release's task record.

[PR #59](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/59) was marked
ready and squash-merged using the exact head constraint. Merge commit:
`33d8c2dcf94329d895d8ca5e402132c19a93feb4`, at 18:55:28 EEST. The merged
application tree matches the tested source. No schema, migrations or dependency
changes were included; scoped migration validation passed.

## Production configuration and deployment

Added `NEXT_PUBLIC_FACEBOOK_PIXEL_ID=787839287564208` to the Vercel project's
Production environment as public Config. The existing branch-specific Preview
setting remains. No credentials or Meta account settings were changed. The
production build started after saving this setting, so the compiled public
configuration includes it.

- Project: `prj_ToPwZRPSjvd9qI25Vscf6CeMSrVW` (`stem-toys-3`).
- Deployment: `dpl_9Hikj4uunou8WhjYBxKJ2k1e74go`, READY, production.
- Source: `33d8c2dcf94329d895d8ca5e402132c19a93feb4`.
- Immutable host: `stem-toys-3-hwdeubrkv-rusujobs-3774s-projects.vercel.app`.
- Live aliases confirmed: `techtots.ro` and `www.techtots.ro`.
- Previous production: `dpl_BEoGgQAttgi2De6tJaL3or3UFoCz`, source `eeadaab6`.

## Live checks

Verified on www.techtots.ro using the normal Chrome browser:

- Initial cookie banner is visible; no optional tracking script is mounted
  before a choice.
- Refusing optional cookies and reloading keeps optional scripts absent.
- Advertising-only consent mounts `fbevents.js`, the serialized Pixel
  initialization with ID `787839287564208`, and the existing Romanian event
  script. Analytics scripts remain absent. No captured console errors appeared.
- Reopening settings shows advertising selected and analytics unselected.
- Withdrawal through “Refuz opționale” reloads the document and leaves no
  optional scripts mounted. The QA browser was left with both categories off.
- The privacy article's cookie-settings button opens the preference controls.
- Privacy renders WEBIRA REM S.R.L., confirmed register `J2025035239005`,
  revision 3 October 2026, payment/delivery/tracking providers and rights.

Anonymous HTTP checks: apex privacy redirects to www; privacy, cart and checkout
return 200. Initial privacy HTML contains the corrected operator/register and
providers (NETOPIA is capitalized); the obsolete operator and register are
absent. Admin analytics returns 403 with `Cache-Control: private, no-store` and
“Unauthorized. Admin access required.”

The deployment-scoped runtime error/fatal query after the merge returned no
error rows. This is a limited observation window, not an all-flow guarantee.

Production checks inspect UI and mounted scripts; they do not independently
prove Meta receipt, attribution or purchases. Earlier preview request/response
checks and the owner's Events Manager receipt are recorded in the
[Pixel audit](2026-10-03-meta-pixel-preview.md). No order, payment, saved-card
query or production database mutation was made.

## Validation and remaining work

The deployed source's required hooks had zero added Jest failures or TypeScript
errors: full Jest baseline/candidate 65 failing suites and 179 failed tests;
TypeScript baseline 1208, candidate 1207. Existing repository failures remain.
Focused analytics/consent suites pass (31 tests); broader consent checks and
desktop/mobile preview validation are recorded in the earlier audits.

The saved-card PAN/CVV storage path, deletion scheduling and owner-controlled
retention/provider details remain open in TASKS.md and the privacy audit.
Publishing the corrected notice does not resolve those operational findings.
Purchase tracking, CAPI and a real guest COD order remain unverified. Repository
visibility, public Git history and supplier feed access were not changed,
following the owner's instructions.
