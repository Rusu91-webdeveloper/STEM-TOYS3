# Public cookie and supplier credential cleanup

Date: 3 October 2026. Base: `33f24a6a` (fetched `origin/main`).

## Confirmed exposure

The GitHub repository is public. `admin-cookies.txt` contains a localhost-only
`admin-session` JWT with ADMIN role. Its cookie expiry and JWT expiry claim are
both 2025-09-15 23:39:14 UTC. `cookies.txt` contains only a cookie-jar header.
The email-template JWT verifier checks expiry; the exposed token is already
expired. These files must be removed, but they do not establish a current admin
session leak or disclosure of the authentication signing secret. An otherwise
unauthenticated live request supplying the exported cookie to
`/api/admin/email-templates` returned 401 Unauthorized.

Seven private Boribon feed URLs are hardcoded in three current source files. The
primary URL returned HTTP 200 with the expected CSV headers during a read-only
check. Treat the URLs as compromised and have Boribon revoke and replace them.
No tokens, cookie values or personal identifiers are stored in this audit.

The live admin's active curated Boribon feed stores exactly the URL currently
hardcoded in the sync. Comparison used a private-URL fingerprint, not printed
credentials. Its status is SUCCESS. Six older brand feeds are inactive.

## Candidate change

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

No schema, migration, production database writes or credential rotations are
included in the candidate. The unrelated completed analytics release record is
also updated with the owner's production ADMIN success evidence.

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

GitHub history has not been replaced. Replacing 50 branch histories changes
commit identities, affects existing pull requests and requires clone cleanup.
The user must approve that destructive repository-wide operation after reviewing
the candidate and the concrete impact. Use an atomic push with explicit leases
for writable heads/tags, not a blind mirror push. GitHub pull-request refs are
read-only and cached views require GitHub Support cleanup; that external contact
has not been authorized or sent.

The active supplier credential is still usable until Boribon revokes it.
Removing source/history cannot revoke a copy someone already downloaded. No
authentication secret has been proven exposed by these cookie files, so a mass
logout is not justified by the expired token alone. Any separately proven
signing-secret leak would require rotation and a production redeployment.

Reference:
[GitHub sensitive-data removal guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
