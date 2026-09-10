# TechTots Kidstory High-Impact Portfolio

Date: 2026-09-10
Status: proposed curation, not activated in production

## Goal

Enhance the existing TechTots assortment rather than simply increase product count. The current Boribon portfolio already provides strong depth in engineering, electronics, chemistry, logic, magnetic construction and full-size science kits. Kidstory should therefore be used selectively to add visually striking, highly demonstrable products that strengthen TechTots' identity and create better material for short-form content and paid ads.

Kidstory `base_price` is treated only as a B2C/retail reference. The planned TechTots extra 25% buffer is intentionally ignored in this portfolio decision.

## Portfolio architecture

The proposed Kidstory layer contains 25 SKUs:

- 7 HERO products — products that can anchor campaigns, landing pages and video content.
- 9 CORE products — strong evergreen products that deepen key STEM themes.
- 4 ACQUISITION products — low-price, visually interesting first purchases and basket builders.
- 4 ECOSYSTEM products — repeat-purchase/refill accessories around two flagship systems.
- 1 TEST product — excellent creative potential but should be physically tested before paid advertising.

The machine-readable source is `lib/suppliers/kidstory/portfolio.json`.

## HERO additions

1. **Air Toobz — Fat Brain Toys (`F4541ML`)**
   - Role: flagship physics/engineering product.
   - Why it belongs: the airflow is visible, interactive and immediately understandable on video. It also has an accessory ecosystem.
   - Content angle: "Can you make this ball float?"

2. **Aqua Dragons Volcano with LED (`AD6102`)**
   - Role: biology/life-science flagship.
   - Why it belongs: living organisms create a multi-day or multi-week content narrative instead of a one-time unboxing.
   - Content angle: hatch, observe and document development over time.

3. **Code A Maze (`6801INS`)**
   - Role: coding flagship.
   - Why it belongs: tangible, screen-free programming gives TechTots a strong coding proposition for younger children.
   - Content angle: "Program a robot without a screen."

4. **Glow-in-the-dark high-speed Maglev train (`4M-05545`)**
   - Role: physics/transport-engineering flagship.
   - Why it belongs: magnetic levitation is visually compelling and connects directly to real-world transport technology.
   - Content angle: "Why doesn't the train touch the track?"

5. **Carson MicroFlip + 24 prepared slides (`MP-250BUN`)**
   - Role: young-scientist flagship.
   - Why it belongs: 100–250x observation plus smartphone capture can generate an almost unlimited stream of educational content.
   - Content angle: "Guess what this is at 250x."

6. **Mega Hydraulic Arm (`4M-03427`)**
   - Role: mechanical-engineering flagship.
   - Why it belongs: children build a working system and can visibly understand pressure and movement.
   - Content angle: "Move a robot arm using only water pressure."

7. **Hologram Projector (`4M-03394`)**
   - Role: affordable visual hero.
   - Why it belongs: high curiosity at a relatively accessible price; useful for Reels/TikTok and impulse gifting.
   - Content angle: "Build a 3D hologram illusion at home."

## CORE additions

- Carson MicroFlip standard (`MP-250`) — lower-cost entry into microscopy.
- Carson BugView (`HU-10`) — outdoor biology and observation.
- 4M T-Rex Robot (`4M-03460`) — robotics + dinosaurs.
- 4M Motorised Robot Hand (`4M-03407`) — visible mechanical robotics.
- 4M motion-sensor spider (`4M-03473`) — sensors/electronics with a strong surprise hook.
- 4M magnetic levitation kit (`4M-03299`) — several visible magnetism experiments.
- 4M hybrid solar rover (`4M-03417`) — renewable-energy engineering.
- 4M Space Exploration (`4M-05537`) — hands-on space science.
- Logiblocs Spy Tech (`06805IS`) — electronics presented through missions and storytelling.

## ACQUISITION products

These are intentionally inexpensive and should be used for first-purchase offers, gift guides, bundles and add-to-cart merchandising.

- Zero-gravity Fridge Rover (`4M-03268`) — 34 RON B2C reference.
- Mini geode experiment (`4M-03925`) — 31 RON B2C reference.
- Plus-Plus Robot 100 pieces (`PP4105`) — 39 RON B2C reference.
- Plus-Plus Space activity set (`PP3989`) — 66 RON B2C reference.

## REPEAT-PURCHASE ecosystems

### Air Toobz

Keep the main product and add only accessories that deepen experimentation:

- 20 extra balls (`F5601ML`)
- Direction switch (`F5621ML`)
- Flexible 30 m extension (`F5631ML`)

Avoid importing every Air Toobz accessory automatically. Add new accessories only when the main product has proven demand.

### Aqua Dragons

- Starter refill (`AD4004`)

The refill makes Aqua Dragons strategically more valuable than a typical one-time science kit.

## TEST BEFORE PAID ADS

**Crystal-growing Dinosaur Terrarium (`4M-03926/EU`)**

The concept is exceptional for content: crystals + chemistry + geology + dinosaurs + visible transformation. However, external feedback is mixed enough that TechTots should buy and test one unit before using it in paid campaigns. It can still be listed after unit-economics validation, but it should not be promoted as a hero until the real experience has been verified internally.

## What Kidstory should NOT be used for

Do not expand the catalogue simply because a product is described as educational or STEM.

Deprioritize:

- generic sensory toys without a strong STEM mechanism;
- decorative glow products that do not teach a meaningful concept;
- basic craft products whose primary value is art rather than STEAM learning;
- many near-identical variants of the same 4M robot;
- very basic electronics sets when Boribon already offers deeper Thames & Kosmos / Gigo / TopBright circuit products;
- large numbers of Plus-Plus variants — use a few affordable STEM-themed examples instead;
- generic magnetic-tile SKUs when the Boribon portfolio already has Cleverclixx magnetic construction and marble-run coverage;
- additional full-size microscopes that duplicate the existing Boribon TopBright microscope. Carson is being added for portable/mobile microscopy, not to duplicate the laboratory segment.

## How this complements Boribon

The 63-product Boribon portfolio should remain the foundation. It already includes strong hero products in early engineering, electronics, mechanics/energy, magnetic construction, logic, anatomy, microscopy and chemistry.

Kidstory adds different forms of excitement:

- visible airflow — Air Toobz;
- living science — Aqua Dragons;
- screen-free coding — Code A Maze;
- levitation — Maglev;
- smartphone microscopy — Carson MicroFlip;
- working hydraulics — Mega Hydraulic Arm;
- optics/holograms — Hologram Projector;
- low-cost science hooks — Fridge Rover and geode;
- repeat-purchase ecosystems — Air Toobz accessories and Aqua Dragons refill.

This is a complementary strategy, not a supplier-vs-supplier competition.

## Activation guardrails

Do **not** make these 25 products live merely from this manifest.

Before activation for each SKU:

1. Add or confirm private Kidstory `b2b_price_gross_RON`.
2. Validate gross margin using the intended TechTots pricing policy after removal of the extra 25% B2C buffer.
3. Confirm current supplier stock.
4. Confirm exact recommended age and safety warnings.
5. Check that the SKU/EAN does not duplicate an existing product identity.
6. Preserve supplier B2C as a reference price; never infer B2B cost from it.
7. For hero products, ideally purchase one sample for content and product-experience verification.

## Recommended content-studio sample order

If budget permits, the first physical samples TechTots should buy for its own studio are:

1. Air Toobz
2. Aqua Dragons Volcano
3. Maglev Train
4. Carson MicroFlip bundle
5. Mega Hydraulic Arm
6. Hologram Projector
7. Code A Maze

These seven products alone can support a substantial library of demonstrations, educational explainers, hooks, comparisons and parent-facing ads.

## Next implementation step

Once B2B cost data is available for the proposed SKUs, generate a validated Kidstory allowlist from `lib/suppliers/kidstory/portfolio.json`, merge it with any existing Kidstory winners that still pass the curation criteria, and preview the supplier sync before production activation. Do not overwrite the verified Boribon portfolio.
