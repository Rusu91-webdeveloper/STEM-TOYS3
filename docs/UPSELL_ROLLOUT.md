# Compatible add-on rollout

The reviewed launch selection is `data/upsell/launch-selection.json`: 18
products, 13 Boribon and 5 Kidstory, with 20 pairings across 9 base SKUs. Air
Toobz and thematic standalone toys are excluded. The research CSV remains a
backlog, not an activation list.

`stage-upsell-batch-2.ts` now reconciles this explicit selection instead of
importing every high/medium research row. Existing products retain IDs, names,
URLs, category assignments and unrelated metadata. The script refreshes supplier
descriptions/images, pricing and inventory; repairs missing links; adds
canonical supplier freshness metadata and Kidstory availability attributes;
merges pairings; and derives age groups from supplier age bands. Supplier bands
are discovery labels, not an assertion of an exact safety minimum.

Preview the production activation:

```bash
pnpm exec tsx scripts/stage-upsell-batch-2.ts --production --activate
```

Apply after reviewing the preview:

```bash
pnpm exec tsx scripts/stage-upsell-batch-2.ts --production --apply --activate
```

Without `--apply`, there are no database writes. Without `--activate`,
new/inactive records stay hidden, and already-active records stay active. Remote
databases require `--production`; the default is the configured local database.
The explicit selection prevents an old research row from publishing a deferred
product.

Before applying, the script writes a mode-0600 product/link snapshot and preview
into `~/.codex/backups/upsell-rollout-<timestamp>/`. All writes share one
transaction and the same advisory locks as supplier sync. Any identity conflict,
mapping conflict, missing base, missing age/content, unavailable supplier item
or database failure stops the batch. Reservations remain deducted. No other
products are deactivated and no purchase cost is inferred from retail price.

For recovery, use `before.json` to restore changed product/link fields,
preserving any orders and inventory reservations created since activation. Newly
created SKUs are listed as `create` in `preview.json`; deactivate them instead
of deleting records referenced by orders. Do not blindly overwrite live
reservation quantities with the snapshot.

`CompleteSetUpsell` displays active approved in-stock products with valid image
URLs. Curated supplier items also require a fresh mapped supplier record.
Results are ordered by price then slug and capped at six after validation. Both
string and array pairing metadata are supported.

Verification includes focused rollout, availability, supplier-sync, listing and
product-page tests; a production preview; and post-activation checks of
identities, images, prices, pairings, public pages and stock responses. No
checkout order or payment is necessary to verify this rollout.

## Release verification — 26 September 2026

- Production dry-run: 18 products, seven updates and 11 creates; all identities,
  base products, availability, content and age groups validated.
- Primary image URLs: 18/18 returned HTTP 200 with image content types.
- Scoped TypeScript check (including the importer) and ESLint of changed
  application/test files passed.
- Full-repository typecheck is already red in unrelated files (including
  nonexistent admin order route imports and removed Prisma enum imports). The
  full Jest run reported 63 failing suites, 81 passing, two skipped; examples
  include missing `vitest`/`node-mocks-http` and existing ESM mock failures. The
  obsolete Boribon portfolio-count assertion found in this run was corrected
  locally as part of this change.
- Database safety check confirmed the default development URL is localhost. A
  separate full production archive was created and checked with
  `pg_restore --list`; per-record snapshots are also created by the importer.
- No Prisma schema or migration changes are included.
