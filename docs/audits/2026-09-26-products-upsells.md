# Product and upsell production audit — 26 September 2026

## Outcome

Local main was fast-forwarded from 7cff34a to
ad4750ddbe196d9ad3548c42f301fdd3533f8562. Vercel deployment
dpl_4yU6bjrWAbiRm7VGB4gwZ3SSCBM1 is READY, production, and aliased to
techtots.ro and www.techtots.ro at the same commit. No production records were
changed during this audit.

The product-page fixes are deployed and verified by HTTP requests. The upsell
feature code is deployed, but the product rollout is incomplete: no active
products have upsellFor pairings and no checked page renders Completează setul.

## Work merged

- PR #30/#31: MicroFlip plain product retained; bundle disabled; incompatible
  Aqua Dragons AD4004 refill disabled; six Boribon add-ons staged; supplier-sync
  handling added.
- PR #32: removed stale product slug blocklist; normalized public slugs and
  handled slash-containing legacy URLs.
- PR #33: added second-batch staging script and supplier portfolio entries.
- PR #34: corrected Kidstory availability-based browse filtering and age-group
  mapping.
- PR #35: added candidate CSV; deduplicated repeated candidates; supported
  multiple base SKUs; added tests and dry-run backups.

## Production evidence

- Database examined in PostgreSQL READ ONLY transactions: 206 total product
  records; 63 active Boribon and 23 active Kidstory products.
- All 86 active APPROVED product page URLs returned HTTP 200; none contained
  NEXT_HTTP_ERROR_FALLBACK;404. This checks page responses, not an order/payment
  journey.
- All active products have an ageGroup value.
- Active Boribon and Kidstory feeds last reported SUCCESS at approximately 06:00
  Europe/Bucharest, 26 September.
- Active product prices match their current supplier portfolio feed prices. One
  stock difference: TB_160022 database 129 versus current feed 128; this can
  reflect movement since the scheduled sync.
- MP-250 is active; MP-250BUN and AD4004 are inactive, consistent with the
  recorded catalog fixes.

## Upsell inventory

| Supplier | Batch 2 unique candidates | Missing from production | Existing but inactive/unpaired | Active paired upsells |
| -------- | ------------------------: | ----------------------: | -----------------------------: | --------------------: |
| Boribon  |                        28 |                      24 |                              4 |                     0 |
| Kidstory |                        15 |                      15 |                              0 |                     0 |

The CSV contains 64 pairing rows: 48 high/medium rows reduce to 43 distinct
candidate products across 28 base SKUs; 16 low-confidence rows are excluded. All
43 selected candidates currently pass supplier identity/price/availability
checks and have extractable image URLs and descriptions. This validates feed
content presence, not the visual accuracy or compatibility of every
image/product.

The earlier six Boribon add-ons are separate from batch 2: K_550202, K_550203,
K_550204, DJ05648, CC-1027, CC-1029. All are inactive, have zero images in
production, and have stock. The normal Boribon sync does not populate their
images. The batch-2 script explicitly excludes these six, so running it will not
complete them.

Four batch-2 products already exist inactive, with images but no upsell pairing:
DJ05641, B_2901, DJ05642, F_569016. The script skips existing inactive records,
so they require an update path rather than another insert.

## Readiness issues in the deployed implementation

1. scripts/stage-upsell-batch-2.ts creates inactive records by design; deploying
   the code does not run this import or activate products. Production currently
   has 39 of the 43 candidate SKUs missing.
2. The script skips all existing SKUs without repairing pairings or content;
   this leaves the four existing candidates unpaired and the initial six
   incomplete.
3. New products receive generic metadata.supplier rather than metadata.boribon
   or metadata.kidstory. lib/suppliers/curated-stock.ts uses those
   supplier-specific markers to recognize products for freshness checks in
   checkout and stock APIs. The six existing staged records also lack the
   Boribon marker. Restore the normal supplier metadata before activation.
4. New Kidstory product attributes omit inventoryMode: supplier-availability.
   With stockQuantity=1 they are hidden by browse filtering until a successful
   Kidstory content sync restores the attribute. Populate the canonical
   attributes at creation.
5. Boribon ageGroup is left null for new batch-2 records. This does not cause
   the former unfiltered-listing problem, but leaves age-filter coverage
   incomplete.
6. Product and SupplierProduct creation are separate writes. A failed link
   creation can leave a product that is skipped on rerun; use an atomic
   create/update workflow.
7. CompleteSetUpsell selects up to six active approved records without
   availability filtering or explicit ordering. It can recommend sold-out items
   and has no deterministic relevance priority.
8. Supplier sync return counts include uninstalled entries despite skipping
   their updates. The upsell-safety tests expose this reporting defect,
   alongside incomplete mocks/assertions.

## Are these the right products, and enough?

Enough for a first rollout: yes. The shortfall is preparation and activation,
not the quantity of researched candidates. Start with the six existing add-ons
and the strongest compatible systems: Gecko Run K_550205, Cleverclixx
CC-1026/CC-1010, Logiblocs 06806IS/06808IS/06807IS, and compatible
Plus-Plus/Nano Clics additions.

Separate verified compatible extensions from thematic cross-sells.
Crystal-growing kits, Fridolin puzzles, astronomy activities and sibling
Fischertechnik kits can be useful recommendations, but should use a
related-products heading rather than implying they are required or physically
compatible components of the base set. The CSV's confidence label is research
evidence, not independent compatibility certification.

Air Toobz F4641DT is reintroduced by batch 2 despite being explicitly deferred
in the older runbook. F5311ML is another Air Toobz accessory. The base product
is active but excluded by the browse name filter. Resolve that merchandising
intent before activating these pairings.

Suggested launch approach: 1–3 clearly useful, available recommendations per
selected base product, with verified age suitability and images; reuse existing
products; keep low-confidence suggestions out of the first batch. DJ05642 has
only two feed units, so prioritize better-stocked options. Do not activate all
43 indiscriminately.

## Verification

Focused Jest run: 67 passed, 6 failed across six suites. Product-page access,
listing visibility, age mapping, batch-2 logic and pairing suites passed.
upsell-safety.test.ts failed: two incorrect update counts, two warning argument
assertions, and two incomplete transaction mocks. These failures do not
establish a production catalog outage, but the suite is not green.

No staging/import script was applied, no sync was manually triggered, and no
deployment or purchase was performed. HTTP checks do not prove image rendering,
cart behavior or payment completion. Compatibility recommendations are based on
repository research and current supplier feed evidence.

## Candidate-by-candidate snapshot

| Supplier | SKU         | Candidate                                                                              | Confidence | Feed price RON | Availability                 | Production state   | Base SKUs            |
| -------- | ----------- | -------------------------------------------------------------------------------------- | ---------- | -------------: | ---------------------------- | ------------------ | -------------------- |
| Boribon  | CC-1026     | Set de construit cu mini placi magnetice, Cleverclixx                                  | med        |            126 | 30 units                     | Missing            | CC- 1009, CC-1004    |
| Boribon  | CC-1010     | Joc magnetic de construit cu set de roti 25 piese, Cleverclixx                         | high       |            221 | 12 units                     | Missing            | CC- 1009             |
| Boribon  | DJ05641     | Set de constructie trasee Zig & Go Bila cea mai mare 27 piese, Djeco                   | high       |            212 | 5 units                      | Inactive; unpaired | DJ05640              |
| Boribon  | F_579435    | Set de constructie si bricolaj Builder-Box, Fischertechnik                             | high       |            154 | 15 units                     | Missing            | F_579434             |
| Boribon  | K_550205    | Kit STEM Sarpe - extindere pentru cursa cu obstacole cu bila metalica, Thames & Kosmos | high       |            103 | 6 units                      | Missing            | K_550201             |
| Boribon  | clics_NC007 | Nano Clics Pentru construit vehicule 250 piese, Clicformers                            | high       |            119 | 10 units                     | Missing            | clics_NC002          |
| Kidstory | 06806IS     | Joc electronic Logiblocs - set Smart Circuit                                           | high       |             99 | Available (quantity unknown) | Missing            | 06805IS              |
| Kidstory | 06808IS     | Joc electronic Logiblocs - set Secret Recorder                                         | high       |             99 | Available (quantity unknown) | Missing            | 06805IS              |
| Kidstory | F4641DT     | Pachet de extindere , tuburi suplimentare Air Toobz                                    | high       |            300 | Available (quantity unknown) | Missing            | F4541ML              |
| Kidstory | F5311ML     | Air Toobz Toobzters - Set de 5 accesorii pufoase pentru traseele Air Toobz             | high       |             75 | Available (quantity unknown) | Missing            | F4541ML              |
| Kidstory | PP3828      | Set constructie Plus-Plus, 170 piese, Roboti                                           | high       |             50 | Available (quantity unknown) | Missing            | PP4105               |
| Boribon  | B_2901      | Kit STEM Discover, Bakoba                                                              | med        |            181 | 11 units                     | Inactive; unpaired | B_2701               |
| Boribon  | B_2702      | Joc de construit cu blocuri Adventure, Bakoba                                          | med        |            238 | 20 units                     | Missing            | B_2701               |
| Boribon  | CC-1023     | Set magnetic de construit Brick Tiles 16 piese, Cleverclixx                            | med        |            170 | 13 units                     | Missing            | CC- 1009             |
| Boribon  | DJ05642     | Set de constructie trasee Zig & Go Dring 25 piese, Djeco                               | med        |            184 | 2 units                      | Inactive; unpaired | DJ05640              |
| Boribon  | DJ07916     | Joc creativ DIY Printre stele, Djeco                                                   | med        |             90 | 24 units                     | Missing            | DJ07985              |
| Boribon  | Egm_630679  | Jocuri magnetice Tangram, Egmont Toys                                                  | med        |            103 | 9 units                      | Missing            | Egm_630680           |
| Boribon  | F_569016    | Kit STEM Construieste si joaca Labirint Fischertechnik                                 | med        |            129 | 17 units                     | Inactive; unpaired | F_569015             |
| Boribon  | F_576105    | Kit STEM Camion de santier de asamblat si manevrat, Fischertechnik                     | med        |            129 | 26 units                     | Missing            | F_576103             |
| Boribon  | FR_17104    | Joc logic IQ puzzle din lemn Extra piesa-4, Fridolin                                   | med        |             36 | 17 units                     | Missing            | Fr_17101             |
| Boribon  | FR_17106    | Joc logic IQ puzzle din lemn Extra piesa-6, Fridolin                                   | med        |             36 | 15 units                     | Missing            | Fr_17101             |
| Boribon  | G_7457      | Kit STEM Asambleaza si construieste, Genius Toy                                        | med        |            191 | 52 units                     | Missing            | G_7076               |
| Boribon  | G_7445      | Kit STEM Construieste roboti extraterestrii, Genius Toy                                | med        |            201 | 52 units                     | Missing            | G_7268, G_7449       |
| Boribon  | MR_712432   | Joc transfer Harta astronomica, Moulin Roty                                            | med        |             87 | 8 units                      | Missing            | MR_712031, TB_160285 |
| Boribon  | MR_712441   | Cutie mica cu lupa pentru observarea insectelor, Moulin Roty                           | med        |             89 | 11 units                     | Missing            | MR_712207            |
| Boribon  | MR_712030   | Busola solara de buzunar Le Jardin du Moulin, Moulin Roty                              | med        |             89 | 9 units                      | Missing            | MR_712207            |
| Boribon  | N_7020X     | Lupa Explora, Navir                                                                    | med        |             44 | 15 units                     | Missing            | N_1050X              |
| Boribon  | N_3050X     | Periscop Explora, Navir                                                                | med        |             52 | 10 units                     | Missing            | N_1050X              |
| Boribon  | N_8027X     | Cutie mare pentru insecte Explora, Navir                                               | med        |             50 | 24 units                     | Missing            | N_1050X              |
| Boribon  | N_HT32389   | Identificator de stele, varianta de buzunar, Navir                                     | med        |            179 | 17 units                     | Missing            | TB_160285            |
| Boribon  | clics_NC005 | Nano Clics Pentru constructii fantastice 250 piese, Clicformers                        | med        |            119 | 5 units                      | Missing            | clics_NC002          |
| Boribon  | clics_NC006 | Nano Clics Pentru construit animale salbatice 250 piese, Clicformers                   | med        |            119 | 5 units                      | Missing            | clics_NC002          |
| Boribon  | clics_NC001 | Nano Clics Pentru micii constructori creativi, Clicformers                             | med        |             76 | 10 units                     | Missing            | clics_NC002          |
| Kidstory | 06807IS     | Joc electronic Logiblocs - set Alarma Sonerie                                          | med        |             99 | Available (quantity unknown) | Missing            | 06805IS              |
| Kidstory | 4M-03479    | Magnet gigant - KidzLabs                                                               | med        |             69 | Available (quantity unknown) | Missing            | 4M-03299, 4M-05545   |
| Kidstory | 4M-03291    | Kit experimente KidzLabs - Stiinta magnetismului                                       | med        |             97 | Available (quantity unknown) | Missing            | 4M-03299             |
| Kidstory | 4M-03463    | Kit STEM - Lanterna Spionului 6 in 1 - KidzLabs                                        | med        |            102 | Available (quantity unknown) | Missing            | 4M-03473             |
| Kidstory | 4M-03462    | Kit STEM - Monocular cu vedere nocturna KidzLabs                                       | med        |            102 | Available (quantity unknown) | Missing            | 4M-03473             |
| Kidstory | 4M-03295    | Set educativ STEM - Stiinta Spionului, KidzLabs                                        | med        |             90 | Available (quantity unknown) | Missing            | 4M-03473             |
| Kidstory | 4M-03929/EU | Set experimente de crescut Cristale, rosu                                              | med        |             69 | Available (quantity unknown) | Missing            | 4M-03926/EU          |
| Kidstory | 4M-03930/EU | Set experimente de crescut Cristale, albastru                                          | med        |             69 | Available (quantity unknown) | Missing            | 4M-03926/EU          |
| Kidstory | 4M-03257    | Set Planetarium Sistemul Solar KidzLabs                                                | med        |             91 | Available (quantity unknown) | Missing            | 4M-05537             |
| Kidstory | PP4185      | Set constructie Plus-Plus, tub 240 piese, Basic, culori standard                       | med        |             69 | Available (quantity unknown) | Missing            | PP3989, PP4105       |
