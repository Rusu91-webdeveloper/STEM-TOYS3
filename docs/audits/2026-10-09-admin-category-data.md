# Admin category data correction — 9 October 2026

The owner reported that `/admin/categories` showed five categories, all inactive
and all with zero products, on the live TechTots site.

## Confirmed cause

The legacy admin page fetched the public `/api/categories` endpoint. That
endpoint builds five translated storefront groups (`science`, `technology`,
`engineering`, `mathematics`, `educational-books`); their IDs are group slugs,
not saved category IDs. The response contains neither `isActive` nor
`productCount`. The page treated missing `isActive` as false and missing
`productCount` as zero. Those values did not describe the database records.

A read-only request to the live public API confirmed the exact five-group
response in the screenshot, with active catalog slugs such as `science-kits`,
`robotics` and `construction-sets`. It did not disclose private admin counts.

## Correction

- Use authenticated `/api/admin/categories`, including inactive saved
  categories.
- Display the saved `isActive` value and the actual `Product.categoryId`
  relation count. This count includes all directly assigned products, including
  drafts and inactive products; it is not a storefront grouping or published
  count.
- Validate the response at runtime. Missing fields, malformed data and failed
  requests show a Romanian error with retry, without fabricated zero counts,
  inactive states, stale rows or an empty-catalog claim.
- Disable caching for admin category reads, including denied/error responses.
- Translate the list to Romanian and retain status/count visibility at 390 px.
- Withdraw the edit link pointing to a nonexistent page and the delete button
  without a handler. Existing category creation remains available.

This correction changes no production category statuses, product assignments,
schema or migrations. It does not implement the remaining legacy category
edit/delete workflows or aggregate the five storefront groups in the admin.

## Verification

- Two focused Jest suites / 15 tests pass: real active/inactive/count responses,
  a genuine empty list, storefront/missing/invalid payload rejection, HTTP
  retry, failed refresh, ADMIN authorization and private no-store success/error
  reads.
- Isolated PostgreSQL at localhost:55434 confirms an active test category with
  two attached products (one published, one inactive draft), an active empty
  category and an inactive empty category. Fixture records exist only locally.
- Authenticated local browser rendering matches those records; refresh passes.
- Scoped ESLint passes with five existing warnings in the unchanged creation
  handler. Its initial 2 GiB heap limit was insufficient; a 4 GiB retry
  completed.
- At 390 × 844, page width is 390 px and table width is 308 px. Product counts
  and both statuses remain visible; the slug column is hidden on small screens.

Release comparisons and deployed evidence are recorded on the category fix PR.
Private production counts require an authenticated production admin session;
local fixture counts must never be represented as the owner's live inventory.
