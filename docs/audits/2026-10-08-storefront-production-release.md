# Storefront improvements production release — 8 October 2026

## Authorization and source

The owner requested “push it if it is succesfully implemented”, authorizing
publication of the completed storefront changes in
[PR #73](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/73).
Fetched origin and confirmed a clean working tree, unchanged main, clean PR
mergeability and a successful Vercel preview for the exact reviewed head.
No user changes were overwritten or merge protections bypassed.

The reviewed head was `918a1bd5ffd752d54ac6375f610996cc4721a996`.
Its preview, `dpl_B2rvQ4CLqbct88kdXL7C6TPqjp1K`, was READY. The PR was
marked ready and squash-merged with the expected-head constraint at 07:05 UTC
(10:05 Europe/Bucharest), as
`a419d8b39403f32907f09823077363c9f50f0ced`. The reviewed head and merge commit
share Git tree `929c0b5fb076fbde7b98a9f2029000e42fae8055`.

No schema, migration, dependencies or compiler configuration changed. The
existing main-branch Git integration built with the existing production
configuration. No payment, customer order, review, email, provider setting or
database record was created as a verification fixture.

## Deployment and verification

The production deployment is `dpl_6R2BBpzLf3BTX6km3ND4eWH26qHM`, source
`a419d8b39403f32907f09823077363c9f50f0ced`, with immutable URL
<https://stem-toys-3-fb7sno0am-rusujobs-3774s-projects.vercel.app>.
Target: production; framework: Next.js; state: READY. The build took about
2 minutes 57 seconds, from Vercel's building/ready timestamps. Both independent
domain lookups resolve to this deployment; <https://techtots.ro> redirects to
<https://www.techtots.ro>.

Previous READY production rollback candidate:
`dpl_D7EGG5km6bkt29n298KPopuLVUhT`, source
`f1b37da11ee7c921873895d450537086a4583780`.

Anonymous HTTP verification completed at 07:08:48 UTC on both domains:

| Request | Result |
| --- | --- |
| GET homepage, gift finder, products, cart and checkout | 200 |
| GET `/merchant-feed.xml` | 200, well-formed RSS, 97 unique products |
| GET `/api/health/ready` | 200, no-store |
| GET `/api/admin/store-health` | 403, no-store |
| HEAD `/api/health/ready` on www | 200, no-store, empty body |

The feed includes canonical product links, HTTPS images, RON prices and
in-stock availability. It matches the live catalog's 97-product count.

The production browser verified the homepage link to the gift finder,
three real recommendations for age 6/any interest/budget 200, and an honest
empty result for age 3/robotics/budget 100. Gift finder and product detail fit
the 390px viewport without horizontal overflow. The pneumatic-glove page shows
the reviewed contents, preparation and age guidance, official manufacturer
video, configured 19.99 lei delivery estimate and 500 lei free-shipping threshold.
The image dialog changes images with the right arrow; Escape closes it and
restores focus to its trigger. Desktop catalog search `robotica manusa` finds
the correct accented product with reversed words, and list view shows its
plain summary. No cart item, purchase, login or review was submitted.

Screenshots, public HTTP results and the public XML feed are retained locally in
ignored `test-results/release-storefront-2026-10-08/`. Temporary mobile viewport
settings were reset.

At 07:10:46 UTC, Vercel's deployment-scoped warning/error/fatal query from
07:05:03 UTC returned no groups, and the project runtime-error query returned
no clusters in that window. This is a bounded observation, not ongoing incident
coverage. The optional drain inventory returned 404; external drain setup
remains unverified and no monitoring configuration was changed.

## Implementation evidence and remaining acceptance

The [implementation audit](2026-10-07-storefront-excellence.md) records the
buying guidance, gift finder, delivery estimates, manufacturer resources,
accessible catalog controls, delivered-purchase reviews, merchant feed,
operations visibility and performance changes. Its production build and
14 focused suites / 84 tests pass. Full Jest and TypeScript comparisons add
zero regressions; existing repository-wide check debt remains. This release
record uses the normal publication hooks.

Production publication does not complete Merchant Center registration or its
diagnostics, authentic customer material, real inbox rendering, provider
backup retention/restore evidence or field Core Web Vitals. Existing sandbox
payment/refund, supplier/provider and privacy acceptance items in `TASKS.md`
remain open. Marketing schedules and external notification settings are not
activated by this release. No A+ certification is claimed.
