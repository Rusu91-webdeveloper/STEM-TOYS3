# Cookie consent and tracking gates

Date: 3 October 2026. Base: `eeadaab6` (`origin/main`). Branch:
`codex/cookie-consent`. Production release is not authorized by this PR.

## Confirmed behavior and root causes

An isolated anonymous production browser visit showed no cookie banner and made
2 GA collection requests before any consent choice. No Meta request was observed
during that visit. The consent helper explicitly returned `true` when no signal
existed or storage was unavailable. AnalyticsWrapper evaluated that helper only
once. It also used the analytics decision to load advertising pixels, while
Vercel Analytics and Speed Insights loaded outside the wrapper.

Live public Instagram and TikTok config endpoints both returned `data: null`.
This does not certify Vercel's environment-variable settings or the owner's Meta
account configuration. No real Meta ID has been supplied for this task. Meta is
not activated, and no environment/configuration settings are changed.

The live CSP already allows `connect.facebook.net` in script-src. Its
connect-src omits Meta origins. The change adds only
`https://connect.facebook.net` and `https://www.facebook.com` to that directive.
Separately, Facebook's serialized inline JavaScript contains a TypeScript
`as HTMLElement` assertion; this is invalid browser JavaScript and is corrected
to an Element check.

## Implementation

- A Romanian banner offers equal-style accept/refuse actions and independent
  analytics and advertising preferences, with necessary shopping storage always
  available. A persistent settings button also works on checkout pages.
- Only our versioned, explicitly saved choice authorizes tracking. Missing,
  malformed, incompatible, expired, unavailable and legacy permissive signals
  deny both optional categories. Choices last 180 days; timers respect the
  browser's maximum timeout rather than overflowing a six-month delay.
- Preference changes apply in the same document and across tabs. Permission
  expires even if a page is left open. Withdrawal removes known first-party
  tracker cookies and the behavioral tracker session/events, disables Google
  collection, revokes Meta consent and reloads the document to discard SDKs,
  observers and Next's script cache. Shopping cart/auth storage is preserved.
- If storage cannot save a new choice, tracking is denied for the current
  document, the old choice is removed if possible and an error is shown. We
  avoid reloading into a choice that could not be overwritten. Vercel callbacks
  recheck consent before sending. A browser that prevents all persistence cannot
  reliably remember a choice after navigation.
- GA4, Vercel Analytics/Speed Insights and first-party behavior tracking require
  analytics permission. Meta/Instagram/TikTok require advertising permission. No
  optional Google tag loads before permission (basic consent mode); Google's
  default/update commands precede configuration, and advertising signals remain
  denied with analytics-only consent.
- GA4 ignores pre-consent activity and isolates buffered events by consent
  revision, preventing replay across withdrawals/re-grants. Invalid/placeholder
  GA and Facebook IDs do not initialize scripts.
- The privacy policy's cookie section describes these choices and includes a
  settings button. This is not a complete legal-page review or a GDPR compliance
  certification; the remaining company/processor/retention claims still need
  their separate review.

## Verification

Eight focused suites cover the consent reader, runtime cleanup, rendered
choices, category separation, same-document/cross-tab changes, expiry, blocked
storage, GA4 buffering, valid Meta inline JavaScript and the existing
cart/checkout event rules. The initial run passed 40 tests; final results are
recorded below after publication checks.

The real Next.js layout was checked with agent-browser and isolated browser
contexts using a temporary local fixture and the actual cart provider. The
server used a dummy localhost database, not production credentials. The local
configuration notice/API errors are expected; neither production data nor
orders/payments were changed. The fixture was removed before publication.

Desktop (1440 × 900) and mobile (390 × 844) checks passed: zero observed
optional tracking requests before a choice or after initial refusal; refusal
survives refresh; analytics-only choice is saved separately; withdrawal actually
reloads and retains the cart; no JavaScript page errors or horizontal overflow.
Cross-tab refusal reloads the other tab. Development skips GA4, so these local
checks do not prove delivery to the real GA or Meta account.

[Desktop fixture](../qa/cookie-consent/banner-desktop.png),
[mobile fixture](../qa/cookie-consent/banner-mobile.png),
[browser results](../qa/cookie-consent/browser-results.json).

No local build/migration was run because the build script runs migrations.
Repository regression hooks must pass before push; existing full-suite/compiler
failures remain visible. Production remains on `eeadaab6` until owner review.
Repository visibility/history remain unchanged.

## Preview review

1. Open the preview in a fresh browser session. In Network, watch Google/Meta
   script and collection requests plus Vercel metrics and behavior endpoints.
   Before choosing, no optional tracker should load or send data.
2. Refuse optional tracking, refresh and add a product to the cart. The refusal
   and cart should persist; the settings button reopens the choices.
3. Select analytics only: GA/Vercel may load when configured; advertising pixels
   remain absent. Select advertising only: GA/Vercel remain absent.
4. Withdraw consent. The page reloads, tracker cookies are removed, tracking
   stops and the cart remains. Repeat with another tab open.
5. Meta activation requires the correct owner-supplied ID and independent
   verification in Meta Events Manager. No fake ID is deployed.

References: Google's
[basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
blocks tags until permission; its
[developer guide](https://developers.google.com/tag-platform/security/guides/consent)
specifies default/update order. CNIL's
[banner guidance](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite)
provides separate choices, equally easy refusal, ongoing withdrawal and six
months as a general retention recommendation, not a universal legal deadline.
