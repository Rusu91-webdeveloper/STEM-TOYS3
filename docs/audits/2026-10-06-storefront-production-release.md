# Storefront production release — 6 October 2026

## Authorization and source

The owner explicitly requested “publish” after reviewing the storefront quality
preview. Fetched origin and confirmed a clean working tree, successful exact-head
Vercel preview and clean mergeability for
[PR #67](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/67).
Marked the PR ready and squash-merged with the head constraint
`5ab45776859949410ebc540801f390fba5c72869`.

The PR merged at 08:31:49 UTC as
`d4271611b725d862c896c683788690623415fb59`. The merged tree exactly matches the
tested preview tree. No schema, migration, dependency, Vercel configuration or
environment-variable changes were included. The standard production Git build
used the existing production configuration.

The released behavior and pre-release evidence are recorded in the
[quality audit](2026-10-06-storefront-quality.md). Publication does not constitute
acceptance of a funded real guest COD order or authorize paid advertising.

## Deployment result

- URL: <https://www.techtots.ro>.
- Target: production; framework: Next.js; status: READY.
- Deployment: `dpl_8tUo5c7TPKnapLZ5WZ8Jj8SZV2y5`.
- Source: `d4271611b725d862c896c683788690623415fb59`.
- Immutable URL:
  <https://stem-toys-3-7ccb3vub2-rusujobs-3774s-projects.vercel.app>.
- Vercel confirms both `www.techtots.ro` and `techtots.ro` as live aliases,
  without an alias error. A fresh www lookup confirms the same deployment.
- Build duration: about 3 minutes 4 seconds, from Vercel timestamps.
- Previous production rollback candidate:
  `dpl_3Vjvsqm7AfKvpBYFYBgwJLmUsw5b`, source
  `2a71caeeda784812a92e8471787cba70b8e85540`.

## Live acceptance checks

Anonymous read-only HTTP verification on www.techtots.ro passed:

- Homepage, products, cart, checkout, Romanian science category and sampled
  product return 200. Apex redirects 308 to www.
- Cart and checkout each emit one `noindex, nofollow` robots tag. Missing route
  and missing product each return 404 and one `noindex` tag.
- Homepage emits exactly one WebSite, Organization and OnlineStore entity.
- All six old category aliases redirect 308 to their Romanian canonical paths,
  preserving `?page=2`.
- Two actual catalog cache HIT responses contain 104 products and 475 image
  references. All 475 references point to owned `/images/catalog/` files;
  there are zero external supplier image URLs in those responses.

An isolated browser with no customer credentials verified mobile 393×852 and
desktop 1280×577. The default catalog renders 96 available products, with no
“Stoc epuizat” cards, loaded visible sampled images at opacity 1, and zero
horizontal overflow. Consent banner heights are 169 px mobile and 93 px desktop.
Refusing optional cookies leaves Meta and GA scripts absent.

The sampled product displays the normalized Romanian title, configured 9.90 lei
COD fee and mandatory card-guarantee notice. Added one 168 lei item to the
isolated guest cart; mobile cart displays the same COD notice, one-line price
and 44 px quantity buttons without overflow. The checkout landing renders the
three stages Livrare / Plată / Verificare, one România input and the selected
product in its summary, without overflow. No browser page errors were captured.

No customer details, card information, payment authorization or order were
submitted. The QA browser was closed; the owner's browser was not modified.

## Post-deployment observability and remaining work

The deployment-scoped log scan from 08:31:49 through 08:37:17 UTC is not clean:
product review reads still attempt localhost:3000 and log ECONNREFUSED while
returning product pages with HTTP 200. Redis rate-limit operations also time out
and use their existing in-memory fallback on HTTP-200 cart/books requests.
These issues were already recorded on 4 October; this PR does not change those
paths.

One Meta crawler reported a chunk-load failure at 08:35:58 UTC. The exact public
chunk URL subsequently returned HTTP 200 JavaScript, and the QA browser did not
reproduce the error. A subsequent query counted one such report. Its cause
remains unconfirmed and is tracked in TASKS.md; this is not evidence that an
intermittent failure is fixed. Runtime logs and the existing client-error
endpoint provide observations; Vercel CLI confirms no configured external
drains. No monitoring configuration was changed.

The owner must still fund the temporary shipping authorization and complete a
real guest COD order from beginning to end before paid acquisition. The card
guarantee remains mandatory. MP-250 remains unavailable according to the
supplier's successful sync; no inventory was overridden. Free shipping remains
500 lei. Full editorial rewriting of supplier descriptions is still a separate
quality improvement.

Pre-release required baseline/candidate checks added zero Jest failures and zero
TypeScript diagnostics. Existing repository debt remains: 64 failing suites,
175 failing tests and 1196 TypeScript diagnostics. The build and focused checks
passed as recorded in the quality audit. This release record changes only
documentation and must use normal Git hooks.

## Follow-up, 6 October 2026

The owner subsequently requested the complete supplier-copy review and runtime
repairs. [PR #68](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/68) is
merged and its production build is READY. All 104 current supplier descriptions
are reviewed; direct product/review reads, atomic Redis limiting and bounded
chunk recovery are verified. Two further Meta crawler reports occurred on the new deployment at
14:23:52 UTC. Edge and exact-agent browser checks pass, but the reporting
crawler's network cause and recovery remain unconfirmed; this item stays open. See the
[editorial/runtime release evidence](2026-10-06-romanian-copy-runtime.md) for
exact source, deployment and live acceptance. Funded guest COD acceptance remains
separate and advertising was not enabled.
