# Gift merchandising — September 12, 2026

Homepage selection is explicitly rocket → glove → wind car → Navir. `lib/products/merchandising.ts` is the durable allowlist and order. Only active, approved products with sellable stock >1 qualify; there is no newest/random fallback. If a selected SKU becomes unavailable, the strip shrinks rather than inventing stock or substituting accessories. Hover Racer is not promoted.

Default `/products` browse excludes books, stock ≤1, Air Toobz, Aqua refill, Fridge Rover and malformed titles. Search preserves product access except malformed titles; books remain accessible through their category. Customer-selected sorting remains available; default ordering ranks the four gifts first. DB `metadata.merchandising.browseHidden` can hide an item, and Emanuel may explicitly set `keepLowStock: true` to keep a low-stock product in browse. This never overrides the homepage stock threshold.

`featured` is true only on the four selected gifts. `metadata.merchandising.featuredOrder`, `homepageExcluded`, and `adsExcluded` record editorial decisions. No advertising feed integration was identified or changed; these flags do not assert Meta readiness. Bluetooth, chemistry and anatomy remain browseable at healthy stock but are excluded from featuring/ads selection.

The idempotent `scripts/apply-merchandising.ts --production` previews current production; `--apply` creates a restricted product recovery snapshot before a transaction. It does not change stock, reservations, price, identity, active status or supplier feed configuration. Boribon recurring sync preserves the changed content. Recovery should restore only attributes, metadata, ageGroup and featured from the snapshot; never roll stock back across subsequent orders.

Verified supplier age evidence is retained in `lib/suppliers/boribon/portfolio.json` and written to attributes with source URLs. Glove uses 8+ and MIDDLE_SCHOOL_9_12, with 8+ assisted / 10+ individual copy. Rocket and Navir are 6+; wind car is 8+. The 25 blank age groups belong to Kidstory products without verified age-on-box evidence; broad supplier browsing bands were not converted into maker age claims. They remain blank and excluded from age filters. Kidstory quantity 1 is a conservative availability capacity, not proof of one physical supplier unit; it is hidden from default browse without altering inventory.

Production audit before rollout: 88 active products; rocket 59 / 168 RON / 3 images, glove 91 / 206 RON / 5 images, wind car 69 / 258 RON / 4 images, Navir 25 / 125 RON / 5 images. All four APPROVED. These are timestamped audit observations, not marketing metrics or guaranteed future inventory.

Verification: 11 focused merchandising, gift landing page and supplier-sync tests passed. Local database safety check passed. Full typecheck and historical migration validation have pre-existing failures; no migrations are introduced. Full production table backup (83 tables) and per-product recovery snapshots are stored outside Git under `~/.codex/backups/`.

Product metadata now uses each product’s own title/description; unknown ages are no longer guessed as 8–12. Zero-review PDP stars are hidden. The legacy product-metadata test suite expects removed JSON-LD-in-metadata behavior and still fails its three existing assertions; the two new title/age integrity tests pass.
