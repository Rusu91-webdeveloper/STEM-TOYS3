# TechTots product and conversion opportunities

Reviewed 1 October 2026, Europe/Bucharest. Recommendations are hypotheses to
test, not measured sales results. This review used the live storefront,
repository implementation and earlier catalog audit, plus manufacturer product
sources. The initial audit changed no storefront code or product records. The
subsequent local implementation is recorded in
[product improvements](2026-10-01-product-improvements.md). Release evidence for
the subsequent implementation is recorded in its PR.

## Production recheck after owner feedback

Vercel's latest deployment list and production-domain inspection identify
`dpl_E83zW27tnsDw3mrkdp1rRV7qDYUy`, READY, at main commit
`c255a753f73ff80ebd671ecc0f02348a56aa1ea4`, serving both production domains. At
the time of that recheck, this worktree was at
`ac305cc91692528de0cd70aee469c19c836109a3`. Implementation subsequently started
from production commit `c255a75` on `codex/product-buying-guidance`. The
deployed homepage source was read at the exact production commit: it selects up
to eight products, with featured ordering and a stable fill. The older local
one-rocket selection must not be used to describe current production behavior.

The owner reports seeing products in the recommended section. Fresh checks of
the public domain (browser and HTTP) and the exact deployment URL still returned
the empty-state text in this session. Response assets identified the same
deployment ID. These results establish a discrepancy between observations; they
do not establish that all visitors see an empty section. The focused one-hour
log query for the homepage error message returned no results, so an error or
timeout was not confirmed.

Correction: treat homepage recommendations as an existing production feature
whose inconsistent observed output may need investigation, not a missing feature
to build. Revalidate the remaining earlier page observations against production
before scheduling changes. No production change was made during this recheck.

## Recommendation

First make the existing assortment easier to understand and buy. Then add a
small number of products that fill clear gaps: preschool construction, logic
games and compatible extensions. Do not import the entire earlier candidate list
or describe already-listed products as new sourcing opportunities.

## Current observations

- The live homepage rendered an empty recommended-products section in the review
  session. The production recheck above supersedes the earlier inference from
  the local allowlist. Current production can select up to eight products; the
  owner sees a populated section. The cause of the differing observations is
  unconfirmed. Investigate the discrepancy before changing the feature.
- Default live browsing displayed 21 products across two pages, and Mathematics
  had a zero count. These are browse observations, not a count of all database
  records or evidence of a catalog outage.
- Plus-Plus PP4185 and PP3828, and Logiblocs 06806IS/06807IS/06808IS, are now
  listed. The 26 September audit's missing-product snapshot is historical.
- The Plus-Plus PP4185 description contains unattributed parent/educator quotes
  and broad recommendation claims. Their provenance was not established. Remove
  them unless genuine source records and appropriate publication permission
  exist.
- Secret Recorder's prominent recommended-age badge says 3–5, while its package
  says over 5. The lower specifications show supplier browsing ranges under a
  manufacturer-age label. Use the exact package/manual recommendation, and keep
  internal gift categories separate from minimum-age guidance.
- Several descriptions contain broken character sequences and repetitive copy.
  Catalog cards expose long descriptions; the screenshot review covered one
  desktop product page, not a full responsive layout audit.
- Secret Recorder has five product images and clear price, availability and
  card/COD payment information. These useful foundations should be retained.

Live reference pages: [homepage](https://www.techtots.ro/),
[catalog](https://www.techtots.ro/products),
[catalog page 2](https://www.techtots.ro/products?page=2),
[Plus-Plus Basic](https://www.techtots.ro/products/set-constructie-plus-plus-tub-240-piese-basic-culori-standard-pp4185),
[Secret Recorder](https://www.techtots.ro/products/joc-electronic-logiblocs-set-secret-recorder-06808is).

## Prioritized enhancements

| Priority | Change                                                                     | Purpose                                                    | Evidence to collect                                                         |
| -------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1        | Correct age labels; remove unsupported quotes/claims; repair text encoding | Give parents consistent, trustworthy information           | Package/manual matched to exact SKU; review provenance; content review      |
| 1        | Investigate differing homepage recommendation output before making changes | Ensure the existing product selection renders consistently | Compare affected visits, deployed selection rules and actual availability   |
| 2        | Put a concise buying summary above the cart button                         | Explain what the child does and what the parent needs      | Exact contents, batteries/tools, instruction language and age verified      |
| 2        | Offer age + interest + budget entry points                                 | Reduce the work of choosing                                | Relevant nonempty results; minimum-age restrictions preserved               |
| 2        | Show real product demonstrations                                           | Make the experience tangible                               | Actual exact-SKU footage or licensed maker video; no simulated results      |
| 3        | Add 1–3 useful complementary recommendations                               | Help buyers choose additions without overwhelming them     | Compatibility, availability, image accuracy and recommendation relevance    |
| 3        | Make delivery costs and return conditions easy to find near purchase       | Reduce uncertainty before checkout                         | Current shipping rules and eligibility, not a blanket free-delivery promise |

Suggested collections: gifts under 100 lei, gifts 100–200 lei, construction,
first electronics, space exploration, logic challenges. Price bands are proposed
navigation choices. Populate them from actual prices and stock. Hide empty
collections; do not invent educational classification solely to fill
Mathematics.

Suggested product-page summary order:

1. Exact manufacturer minimum age.
2. One sentence about the activity.
3. What is included.
4. What must be supplied separately.
5. Instruction language and a working manual link.
6. Availability, price, delivery information and the cart button.

Factual Romanian copy draft for Secret Recorder, using its current listed
contents:

> Construiește un dispozitiv care înregistrează și redă mesaje, folosind blocuri
> electronice conectabile. Setul include baza de alimentare, un buton, un senzor
> de lumină și un recorder. Necesită 3 baterii AAA, care nu sunt incluse.

Validate the exact supplied version before publishing. Add its package-derived
age separately. Keep learning claims tied to observable actions, such as
connecting a sensor and testing a circuit, rather than guaranteed outcomes.

## Existing products to merchandise first

| Product                                   | Observed price, RON | Suggested role                                             |
| ----------------------------------------- | ------------------: | ---------------------------------------------------------- |
| Plus-Plus Robots PP3828                   |                  50 | Accessible construction gift                               |
| Plus-Plus Basic PP4185                    |                  69 | Open-ended construction; rewrite unsupported content first |
| Logiblocs Smart Circuit / Secret Recorder |             99 each | First electronics; correct age guidance first              |
| KidzLabs Mega Hydraulic Arm 4M-03427      |                 148 | Demonstration-led engineering gift                         |
| STEAM Space Exploration 4M-05537          |                 194 | Themed science gift                                        |
| Code A Maze 6801INS                       |                 406 | Higher-priced coding gift; show how one challenge works    |

Prices were observed in the live browse session and may change. These are
editorial merchandising suggestions, not bestsellers. Every homepage candidate
needs verified minimum age, image accuracy, availability and supplier freshness.

Logiblocs Spy Tech already lists the same block types supplied by the smaller
Logiblocs kits. A smaller kit is a sensible alternative price point; presenting
it as an extension needs an explanation of what additional duplicates enable. Do
not imply that the smaller kit introduces a capability already in Spy Tech.

## Additional products worth validating with suppliers

| Candidate                                           | Fit                                                  | Conditions before launch                                                                  |
| --------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Cleverclixx Mini Tiles CC-1026, 28 pieces           | Compact construction option; maker lists age 3+      | Confirm exact supplied package, landed margin, stock and magnetic-piece warnings          |
| Cleverclixx Wheels CC-1010, 25 pieces               | Vehicle-building option; maker lists age 3+          | Demonstrate the supplied chassis and tiles; verify exact base-set compatibility if paired |
| Gecko Run starter plus one Snake extension K_550205 | Engineering system with a clear repeat-purchase path | Starter must be available; Snake is not playable alone; maker lists 8+                    |
| Djeco Cubologic 16 DJ08576                          | Logic/pattern challenge that broadens the assortment | Verify current supplier listing, package age, images and classification before activation |

The earlier audit includes these systems or their relatives; inspect existing
records before importing duplicates. Current supplier stock and purchase costs
were not revalidated in this review. These candidates have product-fit evidence,
not proven Romanian demand or conversion performance.

Manufacturer references:

- [Cleverclixx Mini Tiles CC-1026](https://cleverclixx.com/de/products/mini-tiles-pack-intense-28-pieces)
- [Cleverclixx Wheels CC-1010](https://cleverclixx.com/nl/products/cleverclixx-wheels-pack-intense-25-pieces)
- [Gecko Run Snake](https://www.thamesandkosmos.co.uk/product/gecko-run-snake/)
- [Djeco Cubologic 16 rules](https://media-library.djeco.com/images/files/DJ08576-RDJ-FR-EN-DE-ES-IT-PT-NL-SV-DA-RU.pdf)

## Honest trust and offers

- Use actual product photos, contents, demonstrations, manuals and customer
  support details as evidence even when there are no reviews.
- Request genuine feedback after delivery. Label a review verified only when it
  is linked to a real purchase. Show no rating when no reviews exist.
- Distinguish physically compatible accessories from products with a related
  theme. A second space kit is not necessarily an extension to the first.
- Offer optional gift wrapping or a product-specific Romanian activity sheet
  only once fulfillment/content actually exists. A bundle may be useful without
  a discount; show its total and never invent savings or previous prices.
- Avoid anonymous praise, invented customer totals, unsupported awards,
  artificial urgency and guaranteed educational results. Supplier-provided
  marketing prose still needs evidence before publication.

## Measurement and rollout

Start with three representative pages and a small homepage selection. Confirm
product view, add-to-cart, checkout start and purchase tracking works. Measure
product-view-to-cart rate, checkout completion and completed-order conversion,
split by device and traffic source. Check refunds, COD refusals and contribution
margin alongside order value; larger baskets are not automatically better.

Record a baseline before changing presentation. Compare equivalent traffic and
acknowledge campaign or seasonal differences. At low traffic, observe buying
sessions and support questions rather than claiming an uplift from a handful of
orders. No conversion rate, revenue forecast or uplift was estimated here.

Recommended sequence: revalidate factual corrections and homepage consistency;
clearer product summaries and demonstrations; buying guides and related
products; then a small supplier-verified assortment expansion.

## Review limits

No production database or customer analytics were read. No checkout, payment or
fulfillment journey was tested. Homepage emptiness was observed in one live
session, with the same empty result in the later recheck, while the owner
reports populated output. Search-indexed TechTots catalog content was stale and
was not used as the authority for current product counts, prices or assortment.
