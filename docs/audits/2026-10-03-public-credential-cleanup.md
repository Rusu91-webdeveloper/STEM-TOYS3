# Public cookie and supplier feed URL cleanup

Date: 3 October 2026. Base: `33f24a6a` (fetched `origin/main`).

## Corrected assessment: owner confirmation

On 3 October 2026, the owner clarified that the Boribon URLs are public catalog
feeds. Their appearance in a public repository does not establish disclosure of
confidential credentials. The earlier private-feed classification was an
unverified assumption and is superseded by this clarification. No misuse was
established by this investigation.

URL revocation/replacement and the prepared repository history rewrite are not
required for these public feeds or the already expired/rejected exported admin
cookie. Both proposed follow-ups are closed as unnecessary for this finding.
No remote history rewrite, supplier contact or URL rotation was performed. The
deployed source cleanup and configured feed remain in place. This conclusion is
limited to the findings below, not a complete audit of other secrets.

## Released source cleanup

[PR #58](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/58) was merged
at 2026-10-02 23:35:11 UTC as `eeadaab64592ff6c400437e2f08a1c54d7370304`. Vercel
deployment `dpl_BEoGgQAttgi2De6tJaL3or3UFoCz` is READY, and both production
domains resolve to it. Public GitHub reads at that exact commit return 404 for
both cookie files and show no known credential in any of the three affected
source files.

Production homepage, product listing and authentication providers return 200;
Google and credentials providers remain available. Anonymous analytics GET and
POST return 403 without data and use private/no-store cache headers. The
error/fatal runtime-log query scoped to this deployment over the preceding ten
minutes returned no rows. A real production sync job was not invoked.

Actual commit and push hooks passed: full Jest remains at 65 failing suites and
179 failing tests, and TypeScript remains at 1,205 errors, with zero added
failures in either comparison. No schema or migration changed. These results
certify no added failures, not a clean full repository check.

Rollback, if needed: previous READY deployment
`dpl_5nNryPHZdmbhaMR9Z3LWeHU7KRPN` (`33f24a6a`). That version contains the old
hardcoded URLs, so any rollback requires carrying the source cleanup forward.

## Confirmed exposure

The GitHub repository is public. `admin-cookies.txt` contains a localhost-only
`admin-session` JWT with ADMIN role. Its cookie expiry and JWT expiry claim are
both 2025-09-15 23:39:14 UTC. `cookies.txt` contains only a cookie-jar header.
The email-template JWT verifier checks expiry; the exposed token is already
expired. These files must be removed, but they do not establish a current admin
session leak or disclosure of the authentication signing secret. An otherwise
unauthenticated live request supplying the exported cookie to
`/api/admin/email-templates` returned 401 Unauthorized.

Seven Boribon catalog feed URLs were hardcoded in three source files. The
primary URL returned HTTP 200 with the expected CSV headers during a read-only
check. The owner confirms these are intended public catalog feeds; their
availability does not establish a secret leak or require revocation. No URL
identifier values, cookie values or personal identifiers are stored in this
audit.

The live admin's active curated Boribon feed stores exactly the URL currently
hardcoded in the sync. Comparison used a private-URL fingerprint, not printed
credentials. Its status is SUCCESS. Six older brand feeds are inactive.

## Released change

- Delete both cookie files and ignore cookie-jar filenames.
- Block tracked cookie exports and literal credential-bearing Boribon feed URLs
  in the actual Git pre-commit hook, with filename-only diagnostics.
- Use `SupplierFeed.sourceUrl` for curated Boribon sync, as the existing
  Kidstory sync does. No configuration or database row needs changing for this
  removal.
- Standalone fetch/install helpers use a private `BORIBON_FEED_URL`; setup and
  feed-check scripts require private `BORIBON_FEED_URLS` and have no hardcoded
  defaults. Existing feed names are preserved on setup reruns.
- Validate the Boribon HTTPS host/path before requesting a feed. Missing or
  invalid URLs fail before network access or stock writes. Fetch failures omit
  credential-bearing URLs from persistent sync errors.
- The checker reports numbered feeds rather than logging private URLs.

No schema, migration, manual production database writes or credential rotations
are included in this patch. The completed analytics release record is also
updated with the owner's production ADMIN success evidence.

## Verification and history preparation

- Six focused suites pass: 50 tests, covering private URL precedence, call-time
  environment reads, URL rejection, secret-safe network failures, missing URL
  without stock writes, sync configuration forwarding and the commit guard.
- Upsell staging also passes its stored Boribon URL; the isolated integration
  verifier supplies a non-secret fixture URL for its mocked fetch.
- The checker without private configuration exits with an explicit missing-env
  error before attempting a download.
- The updated fetcher read the live primary feed and validated all 97 portfolio
  selections; no database connection, stock write or sync job was invoked.
- Targeted ESLint comparison reports 23 current errors versus 24 on unchanged
  main, with zero added errors. Existing test-mock/import and unused-variable
  lint debt remains visible; this is not a clean full-repository lint result.
- Current working-tree scan finds neither cookie file nor any of the seven known
  feed credentials.
- Historical scan: 7,923 reachable blob versions, eight containing private feed
  URLs, seven unique credentials. No additional historical Boribon credential or
  committed `.env` file was found in this bounded scan; this is not a complete
  secret scan of every credential category.

A separate private mirror was cloned and cleaned with
`git-filter-repo --sensitive-data-removal`. A local original mirror is retained
outside the workspace with restricted directory permissions. The preparation
rewrote 899 of 1,135 commits, including 50 branch tips and 63 GitHub
pull-request refs. It preserves all 115 refs and removes the two cookie paths
and known feed credentials from every reachable blob. Tip comparison across all
refs confirms only the two file removals and exact credential substitutions; no
unrelated file changes occurred. The preparation is a snapshot of the
pre-cleanup remote and must be refreshed/reverified after the candidate lands or
remote refs move.

After release, the original mirror was refreshed and a new clean mirror was
prepared. Final verification covers all 116 refs, 901 rewritten commits, 50
branch tips and 64 pull-request refs. All 7,938 reachable blob versions are free
of the known feed credentials, cookie paths and exported cookie value; tip
comparison again found no unrelated tree changes. The sanitized main has an
identical tree to released `eeadaab6` and maps to `9866ed43`.

Private preparation and verification are under
`/tmp/techtots-secret-remediation/`. The original and final clean mirrors are
retained, alongside a plan-only apply script. It requires `--apply` after owner
approval and refuses to push if remote heads/tags have moved or changed in
number. The intended push is atomic and uses explicit leases per changed ref.

GitHub history has not been replaced. The preparation above was undertaken
before the owner clarified that the feeds are public. Its references to feed
credentials describe the initial classification, not a confirmed secret leak.
The proposed rewrite is now closed as unnecessary for this finding. Replacing
50 branch histories would change commit identities, affect existing pull
requests and require clone cleanup; no such change is planned. No GitHub Support
request was sent. The private draft and prepared mirrors are unused artifacts,
not authorization to apply or submit them.

The active public catalog feed remains usable as intended. No rotation is
required on the basis of this finding. No
authentication secret has been proven exposed by these cookie files, so a mass
logout is not justified by the expired token alone. Any separately proven
signing-secret leak would require rotation and a production redeployment.

Reference:
[GitHub sensitive-data removal guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
