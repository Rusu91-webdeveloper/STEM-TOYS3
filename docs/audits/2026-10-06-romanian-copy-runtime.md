# Romanian catalog review and runtime repairs — 6 October 2026

Owner request: finish the current supplier catalog's Romanian editorial review,
repair public review loading and Redis timeouts, investigate and verify the
crawler's JavaScript loading report. Earlier publication authorization remains
part of this storefront release work.

## Catalog scope and evidence

The public `/api/products?limit=1000` snapshot contains **104 products**, including
unavailable products. Every description was read and rewritten individually.
The two owner-authored books are outside the supplier-copy scope.

- `lib/products/catalog-editorial.ro.json`: reviewed name, age, activity,
  educational purpose, box contents, preparation/specifications and safety for
  each identity/slug. No invented quantities, included batteries, reviews,
  guaranteed developmental outcomes or certifications.
- `docs/audits/2026-10-06-catalog-editorial-source.json`: dated public source
  snapshot, excluding supplier links, credentials, customer data and stock edits.
- Presentation overlay applies after cache reads through the shared public
  shopper boundary. Supplier synchronization continues to own the source rows.
  Names, descriptions, short descriptions, age text and Romanian SEO metadata
  receive the same corrections. Slugs, pricing, availability and ordering remain
  governed by their existing source data.
- `scripts/verify-catalog-editorial.cjs <deployment URL>` reads the complete live
  public catalog and fails for missing reviews or any missing authored section.
  A new catalog identity needs a new editorial entry; unknown products are not
  silently given another product's facts.

The product description's repeated generic educational footer was removed.
Topic tags and fallback FAQs use Romanian with diacritics; internal staging and
upsell tags and duplicate brand badges are hidden. Full age qualifiers appear in
the specifications instead of only a minimum-age chip.

Substantive corrections include the garbled Spider Spy title; broken JavaScript
text in Cleverclixx; copied projector contents and incorrect dimensions in the
weather station; crystal-terrarium minimum age 10+; T-Rex and hologram-kit minimum
age 8+; English-only anatomy audio and KAI application; nemotorized preschool
robots; base-set requirements for Gecko Run extensions; battery and screwdriver
requirements verified against 4M manuals. Assistance qualifiers are retained
(e.g. KAI 10+ with help / 12+, glove 8+ with help / 10+).

### Primary checks for ambiguous facts

- [Plus-Plus Robots 3828](https://plus-plus.com/products/robots): 170 pieces, 7+.
- [TopBright Meteorology Lab 160021](https://topbrighttoys.com/products/meteorology-lab):
  station, cloud cover and USB–DC cable; 19.5 × 17 × 22 cm; 6+; four AA batteries
  not included. Corrects the supplier's unrelated projector/disc contents.
- [4M Rover Robot](https://www.4m-ind.com/product/rover-robot/) and
  [manual](https://www.4m-ind.com/wp-content/uploads/2019/02/3417E.pdf): 5+;
  solar/battery operation; one AAA battery and small crosshead screwdriver not
  included. Image-based manual rendered and visually checked.
- [4M Glow Hi-Speed Maglev](https://www.4m-ind.com/product/kidzlabsglow-hi-speed-maglev/)
  and [manual](https://www.4m-ind.com/wp-content/uploads/2026/01/00-05545_ENG.pdf):
  5+, 127 cm track, manually pushed train, no batteries; adult assistance.
- [4M Fridge Rover](https://www.4m-ind.com/product/zero-gravity-fridge-rover/)
  and [manual](https://www.4m-ind.com/wp-content/uploads/2016/05/3268E.pdf):
  8+, magnet and wound spring, no batteries; small-magnet warning retained.
  Image-based manual rendered and visually checked.
- [4M Hologram Projector](https://www.4m-ind.com/product/hologram-projector/)
  and [manual](https://www.4m-ind.com/wp-content/uploads/2018/01/3394_INS_op.pdf):
  8+, eight paper images, two AAA batteries and small screwdriver not included;
  reflected-image illusion, not a real hologram. Phone is optional, not necessary
  for the included images. Image-based manual rendered and visually checked.
- [4M T-Rex Robot](https://www.4m-ind.com/product/tyrannosaurus-rex-robot/)
  and [manual](https://www.4m-ind.com/wp-content/uploads/2022/12/00-03460_ENG.pdf):
  8+, two AAA batteries and small crosshead screwdriver not included.
- [Fat Brain Air Toobz](https://www.fatbraintoys.com/toy_companies/fat_brain_toy_co/air_toobz.cfm?country=US&kwid=FA454-1&source=pinterest):
  rechargeable fan unit, twenty EVA balls, tubes, connectors and charging cable.
- Existing verified Plus-Plus 240, Secret Recorder and Mega Hydraulic Arm buying
  guides retain their primary-source activity and preparation facts.

Other descriptions use the supplied product-specific facts. Where a number,
compatibility guarantee or battery-inclusion status is absent, copy does not
invent it. Manufacturer instructions remain authoritative for assembly and use.

## Reviews

Production clusters show product pages trying to fetch reviews from
`127.0.0.1:3000` (`ECONNREFUSED`). The server component now reads the database
through the same cached public projection as `/api/reviews`; no deployment URL
or localhost HTTP self-request is needed. Successful review creation invalidates
that product's five-minute cache.

A failed database read is distinct from an empty review list in the UI. Public
responses include display name and review content, without user IDs, email,
order details or purchase identifiers. Verified status is derived from the
stored review/order-item/product/user relationship, not assigned to every row.
No production review, order or user record was created for acceptance testing.

The production build additionally exposed server product reads requesting their
own HTTP API on localhost. The existing public product/book transformation is
now shared by the combined API and server metadata/rendering through a direct,
request-memoized database reader. Database failures propagate instead of becoming
false 404s; inactive products remain hidden and zero-stock detail pages remain
available. The subsequent production build passes without self-request errors.
The extracted reader uses only columns in the current generated schema, RON
currency and nullable-safe supplier names. Legacy references to nonexistent
education/currency columns were removed; they previously yielded undefined.

## Redis rate limits

The old limiter issued GET, TTL and SET under a production 150 ms timeout. A
missing GET value was incorrectly treated as failure, so fresh counters could
never start in Redis. Updates were non-atomic and renewed expiration per request;
timeout timers/retries and circuit tracking also had defects.

The limiter now makes one atomic Lua INCR/PTTL/PEXPIRE operation with a separate
1,000 ms default budget, abortable HTTP request and no retry of an increment.
Configured quotas have separate counter namespaces; first-use counters start
normally and the window does not slide on each request. Local counts mirror
known Redis usage across fallback/recovery, and a circuit bounds repeated
failures with one recovery probe. `Retry-After` is seconds, not an epoch date.
Health includes the effective budget and fallback count. General cache timeout
settings are not changed without evidence that they caused the reported error.

## JavaScript loading investigation

Two Meta external-agent reports, 08:35:58 and 08:45:47 UTC, reference the same
`34634-0c39a5285bceabea.js` on deployment
`dpl_8tUo5c7TPKnapLZ5WZ8Jj8SZV2y5`. Both paths were absent from the current
104-product catalog. The exact deployment-tagged script and importing script
returned 200 JavaScript on reinspection. The failed chunk contains shared UI
code. The service worker already excludes Next.js chunks.

The original network failure is **unconfirmed**; availability afterwards does
not prove what the crawler received then. Do not attribute it to deployment skew,
service-worker caching or a code exception without evidence.

Recovery is now bounded to one document refresh per five minutes on browsing
pages. Cart, checkout, account/auth/admin paths and edited forms are protected.
The edit guard survives error-boundary form removal, and unavailable session
storage disables automatic reload. Error telemetry is retained with `keepalive`.
Global error markup includes required `html`/`body` and Romanian recovery text.
Optional intersection-loaded sections expose a retry instead of an endless
loading state, including clients without IntersectionObserver.

## Verification and release

The implementation was tested at
`af8fd6d8e820681221007c7a16fb927db5d195a0` and squash-merged through
[PR #68](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/68) at
14:16:38 UTC as `803b1efd2bd44c0142ff1bade5dbb6b485e1bdb6`.
The fetched merged tree exactly matches the tested tree.

- 38 focused tests across nine suites pass, including current catalog coverage,
  public review projection, direct product/book reads, Redis first use/timeouts/
  fallback/recovery and chunk/form/retry behavior.
- Scoped ESLint passes. The local production build passes, and the exact Git
  preview build is READY; shared first-load JavaScript is 103 kB.
- Required normal pre-commit full Jest comparisons: baseline and candidate each
  have 64 failing suites / 175 failing tests, with **zero added failures**.
  Required normal pre-push TypeScript comparisons: baseline 1196 diagnostics,
  candidate 1179, with **zero added diagnostics**. This does not certify the
  unrelated existing failures. No hooks were bypassed.
- Scoped migration validation confirms no schema/migration differences.
  No dependency, compiler, Vercel configuration or environment changes.

### Exact preview acceptance

Preview `dpl_D8Hx9NcHnvH1a6CmwibZ2eaDZsFn`, source `af8fd6d8`, is READY at
<https://stem-toys-3-ktkx6pyqq-rusujobs-3774s-projects.vercel.app>.
Vercel protection was accessed using an authorized share link; deployment
protection was not disabled. Credential-bearing browser state is temporary and
excluded from the repository/evidence.

At 14:14 UTC, the complete live catalog and all 104 combined-product responses
match reviewed identity, name, age and authored description. Eight sampled PDPs
return 200 with the reviewed sections; eight review API reads return public
arrays. Database health is connected, and the rate-limit health reports Redis
configured, provider `redis`, circuit closed and a 1000 ms budget. Three ordinary
book API reads return 200. Health counters are per process; the separate health
function is not a distributed aggregate of every book request.

Existing product visibility and merchandising exclusions remain intentional.
An acceptance sample of Spider Spy returned the expected quality-exclusion 404;
its corrected copy was verified through the public catalog and combined API.
The existing name-based exclusions, explicit hidden/ads/homepage flags and
unavailable inventory were not changed by this editorial review.

An isolated browser verifies desktop 1280×800 and mobile 390×844: complete
expanded Romanian description, contents, battery preparation, age and safety;
Romanian topic badge and FAQs; no repeated generic footer or duplicate brand
badge; correct empty review state; no horizontal overflow or captured page
errors. Refusing optional consent leaves Meta/GA scripts absent. Anonymous auth
session reads return 200 with no logged-in user; no authenticated write flow was
changed or customer/order data submitted.

The deployment-scoped preview error scan over the acceptance window returns no
errors. Warning inspection shows only existing successful NextAuth startup
diagnostics; there is no review-read, Redis timeout or chunk-loading failure in
that window. This is bounded acceptance evidence, not a claim that future
network failures cannot recur.

Local evidence: all 104 identities pass the public catalog verification script.
Reviews render the empty state rather than an availability failure. In an
isolated browser against localhost:3016, blocking the real reviews dependency
`84945.0d4d1797cc6b2fce.js` shows a retry; restoring the route and clicking
“Reîncearcă” loads the review section without a document refresh. Blocking
`58548-591d78c743ee180d.js` during client navigation records one automatic
document reload. Its recovery timestamp remains unchanged more than 45 seconds
later while the asset stays blocked. Restoring the route permits normal loading.
Checkout/edit/storage protection is covered by the focused recovery tests.

### Production release and acceptance

The standard production Git build is READY on
<https://www.techtots.ro> and <https://techtots.ro>:

- Deployment: `dpl_EQRyBFu7D1kyLtXiMsHDxhVyZPA6`, source
  `803b1efd2bd44c0142ff1bade5dbb6b485e1bdb6` (`main`).
- Immutable URL:
  <https://stem-toys-3-c1m0ul0o9-rusujobs-3774s-projects.vercel.app>.
- READY at 14:20:09 UTC; build duration about 3 minutes 27 seconds.
  Fresh www lookup confirms this source/deployment and both aliases with no
  alias error. Apex redirects 308 to www.
- Previous verified production rollback artifact:
  `dpl_6LyYMRh5EKjxewp1ur16WdzULNaf`, source `920ae5e6`.

At 14:21 UTC, the production catalog verification passes all **104** current
supplier products. Eight representative combined reads, eight PDPs and eight
review reads pass; database health is connected; Redis is configured with the
1000 ms limiter budget and closed circuit; three ordinary rate-limited book
reads return 200. Anonymous session response is 200 with a null user.

Production desktop 1280×800 and mobile 390×844 browser checks confirm the expanded
description, Romanian age/content/specification text, translated topic and FAQ,
working empty review state and zero horizontal overflow. No browser page errors
were captured. Optional tracking stays absent after refusal. No customer
information, payment, order, review or email was submitted.

The initial error scan through 14:22 UTC is clear, but the extended scan finds
**two critical Meta crawler reports at 14:23:52 UTC** on this new deployment.
Both report `82471-5dd3d741a3ea29aa.js` while visiting the old, unavailable path
`/products/puzzle-123-start-londji-LJ_PZ303U`. The page correctly returns 404.
These are new reports, so the crawler issue is **not classified as resolved**.
Through 14:51 UTC these remain the only deployment-scoped error records; no
review-fetch localhost error or Redis rate-limit timeout was observed.

Further investigation uses Vercel's read-only `vercel.request.count` metrics
schema and queries, including static CDN requests (ordinary runtime logs alone
have no static records for this window). The normalized UTC query interval is
14:23–14:25, scoped to this exact deployment. The stored
[sanitized edge evidence](2026-10-06-crawler-edge-evidence.json) contains no IP
addresses, customer records or authentication material.

- Meta's **Mac** crawler user agent received this exact asset with HTTP 200,
  `application/javascript; charset=utf-8`, CDN MISS, `sfo1` and WAF `allow` in
  that interval. This is a different agent from the two reporters.
- Both error POSTs and the obsolete page request use Meta's **Windows** crawler
  agent. The error POSTs are 200 and the page is 404, all in `sfo1`, WAF `allow`.
  No request for the reported asset is recorded for that Windows agent in
  14:22–14:25; correlating reporter addresses locally also finds no matching
  asset request. Absence of a recorded request is not a complete browser trace.
- The active firewall status has no custom configuration; AI bots are allowed,
  bot protection and attack mode are off, and platform mitigations remain active.
  Application middleware only matches admin routes. No protections were changed.
- A fresh headless browser using the **exact Windows reporter user agent** loads
  the same 404 URL and exact asset successfully, with no captured page errors.
  Direct HTTP also returns 200 JavaScript (24,727 bytes); normal browser headers
  succeed. The old reported `34634` asset also returns 200 (27,048 bytes).

The cause of the crawler's script error remains **unconfirmed**. Missing deployed
assets, a blanket user-agent denial and an always-failing application render do
not fit these checks. Crawler cache reuse, resource cancellation or another
client/network condition remain hypotheses, not established causes. The
reporter's own network trace or a correlated failing CDN request is needed to
identify that boundary. Bounded recovery is published and fault-tested; it is
not evidence that these two crawler executions recovered. Do not suppress their
telemetry, relax the firewall or make speculative platform changes to obtain a
clean scan. This is the remaining open runtime item.

The QA browser and local production server are closed after acceptance.
Temporary preview access state and the task-created read-only local environment
file are removed. The follow-up release record changes documentation only. The separate
funded real guest COD acceptance remains necessary before paid acquisition;
the mandatory card guarantee, configured fees, free-shipping threshold and
advertising settings were not changed by this task.
