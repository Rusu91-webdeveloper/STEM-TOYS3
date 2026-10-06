# Crawler chunk recovery, 6 October 2026

Owner requested analysis and repair of the remaining Meta crawler failures. Work
started from main `ccc6a1cb` on `codex/crawler-chunk-recovery`. Release and
production acceptance:
[PR #70](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/70).

## Evidence and diagnosis

The four production reports reference shared chunks 34634 (08:35/08:45 UTC) and
82471 (two reports at 14:23 UTC). A fresh production log query from 08:00 UTC
through approximately 19:16 UTC found those same four reports. The earlier
[edge evidence](2026-10-06-crawler-edge-evidence.json) remains valid: successful
delivery to Meta's Mac agent does not prove delivery to its Windows reporter.
There is no demonstrated missing asset or firewall denial. The original
crawler-side interruption remains historically unknown.

Two application recovery gaps were reproduced with the exact reported Windows
user agent and an aborted real JavaScript asset:

1. The prior application emitted a critical report and refreshed the document
   after one failed download. React had already received the rejected import. A
   local production-build probe counted two asset requests, two documents and
   one locally intercepted critical report before rendering the correct 404.
2. An HTML-inserted script can fail before Webpack attaches `onerror`. The first
   protected preview reproduced one completed, failed script request without a
   prompt retry. Resource Timing recorded a same-origin script with status zero
   and zero encoded/decoded bytes. Webpack reused the failed script element and
   waited for its ordinary timeout.

These are reproduced application failure paths, not proof of the historical Meta
network trigger. Next.js maintainers also describe aborted requests and
recommend chunk retries for transient download failures; retries cannot repair a
browser that cannot make a successful request.
[Maintainer discussion](https://github.com/vercel/next.js/discussions/82651).

## Repair

The client Webpack runtime retries one failed first-party JavaScript chunk after
250 ms, before React receives a rejected import. Concurrent imports share the
attempt. The retry uses a fresh `_chunk_retry` URL and retains `dpl`, so it
requests the same deployment. It does not refresh the document or change
checkout, cart, forms, stock, payment policy, environment variables or data.

When a completed initial script has already failed, the runtime removes only
that failed element and supplies the missed failure to Webpack's normal
callback. The same bounded retry then runs. This path requires a same-origin
chunk, a script timing entry and a known failed response. Successful cached
responses, preload links and unknown timing data are excluded. Browsers without
`responseStatus` retain the ordinary Webpack failure handling and bounded retry.
[API reference](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/responseStatus).

Persistent failures retain the existing error boundary and bounded browsing-page
recovery. A persistent checkout fault also exposed a page boundary that logged
only to the console; chunk failures there now reach the existing `/api/errors`
endpoint. Normal mutable errors include `chunkRetryCount: 1` in page/critical
telemetry. Reports remain enabled. CSS, API requests, external assets and
ordinary application errors are excluded. No dependency, schema or migration
changes were made.

## Verification

29 focused loader/form-recovery/reporting tests pass; scoped lint and formatting
pass. Full Jest comparison with main adds zero regressions (64 failed suites /
175 failed tests on both snapshots). TypeScript comparison adds zero diagnostics
(1,179 existing errors on each snapshot). These are regression checks, not clean
full-suite or full-typecheck results. The initial protected preview completed a
full production build and passed 12 normal desktop/mobile page checks, full
104-product editorial verification, eight product/review reads and DB/Redis
health checks. The corrected runtime must also pass deployed fault acceptance.

`scripts/verify-chunk-retry.cjs` forces both early script failure (before the
Webpack bootstrap executes) and failure after its handler attaches. It checks
desktop/mobile 404 recovery and the real checkout page, transient and persistent
failures, fresh retry URLs, preserved deployment IDs and document counts.
Synthetic error reports and all non-read requests are intercepted locally.
Protected previews use origin-scoped, short-lived Vercel development OIDC
headers. No tokens, browser authentication state, client IPs or raw reports are
committed.

Protected preview `dpl_4UTyorPAGGA5718Rmv8RDF1ASydH` is READY at source
`412d130110d18deb53610e9a2fbfc542e4fb4e41`. Acceptance at approximately 19:36
UTC passed all six fault scenarios: four transient desktop/mobile cases made two
asset requests, one document request and zero reports; both persistent cases
made two asset requests, one document request and exactly one report with retry
count one. Persistent errors remained visible. Transient recovery preserved the
real 404 or checkout's normal guest navigation, and client consent controls
rendered after hydration. Each retry retained `dpl` and used `_chunk_retry`.

The same final application build passed all 12 normal desktop/mobile browser
checks with zero browser exceptions, client reports or static asset failures,
104 catalog entries, eight product pages and review reads, and DB/Redis health.
Sanitized machine-readable results are in
[acceptance evidence](2026-10-06-crawler-recovery-acceptance.json).

The final evidence-only commit must also receive a READY preview and pass the
fault script before merging. Production release state, aliases and live
acceptance are recorded in the linked PR after deployment; preview acceptance
alone is not a production release. Historical Meta network causation remains
unknown, and a bounded clean log window cannot guarantee future external
requests.
