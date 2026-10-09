# Admin email data correction — 9 October 2026

The owner reported empty email template/sequence pages and misleading email
automation figures on the live admin. This change repairs their database
connections and retires unsupported metrics. It is not a certification that
every advanced admin integration is operational.

## Confirmed causes

- The template UI sent `category=all&isActive=all`. The API treated these as a
  literal category and `isActive=false`, hiding saved templates. The list also
  omitted `content`, breaking preview/edit and the duplicate automation view.
- The automation hub counted the first page of templates as subscribers. It
  invented monthly growth, targets, comparisons and operational statuses. Recent
  activity showed template records as completed email work.
- Sequence handlers used nonexistent `delayBetweenEmails`, `metadata` and
  visual-flow fields. The editor could appear to save a flow discarded by its
  API. The real schema stores `cooldownHours` and ordered email steps.
- Trigger management read segmentation rules and mutated a different table.
  Trigger email execution marked a log as sent without calling a provider.
- Campaign sending used hard-coded recipients. Failure paths could claim
  success, and several displayed actions had no implementation.
- Legacy advanced/dashboard report endpoints still generated simulated data;
  local product detail/edit pages could use development mock products.
- A wider source audit found image optimization writing invented sizes and
  compression statistics, supplier performance grading without return/issue
  data, and supplier-invoice sending setting SENT without a provider call.

Read-only live browser inspection reproduced the false subscriber count and
operational statuses, empty template results and the duplicate template view's
error boundary. No live data was edited or email sent.

## Implemented behaviour

| Admin information                   | Actual source                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| Templates and categories            | `EmailTemplate`, including saved HTML/metadata, active/inactive records and total matching count |
| Sequences, steps and participants   | `EmailSequence`, ordered `EmailSequenceStep`, relation count on `EmailSequenceUser`              |
| Subscribers                         | `Newsletter`, with independent active/inactive counts and searchable pagination                  |
| Campaigns                           | `EmailCampaign`, with real draft create/edit/delete and chosen recipients                        |
| Email history                       | `EmailLog`, with recipient, subject, timestamp, template, status and failure reason              |
| Trigger rules and execution history | `EmailTrigger` and `EmailTriggerExecution`                                                       |
| Recorded engagement                 | Distinct message IDs in `EmailEvent`; repeated opens/clicks cannot inflate rates                 |

ADMIN authentication and private no-store responses cover email reads and
mutations. Runtime contracts reject incomplete payloads; failed requests clear
stale rows and show retry, instead of zero values or an empty-list claim.

Campaigns require explicit recipients. Non-test recipients must be active
newsletter subscribers; a test accepts one chosen address. Draft creation and
editing send nothing. Non-test sending atomically claims the draft before
provider calls, preventing concurrent duplicate sends. Partial failures remain
visible and the campaign is paused; it is not automatically retried. Unsupported
scheduled sending is rejected explicitly.

Template previews now show saved HTML in a sandboxed frame, without invented
customers, orders, prices or unsubscribe links. Variables remain visible until
actual send data is supplied. Templates owned by transactional code are labelled
so editing a database copy does not promise to change those messages.

Brevo/SMTP sends persist `accepted` only with a real provider acknowledgement.
Provider exceptions, missing configuration, simulated IDs and missing message
IDs produce failed records. Database audit failure must not convert an already
accepted email into a send failure that callers might retry. Acceptance does not
certify inbox delivery. Old `sent` logs remain visible but unverified: legacy
trigger code could create that status without sending anything.

Marketing triggers check active newsletter subscription and both active/status
flags before sending. Provider failure creates a failed execution, never an
invented successful send. The older email service now reads saved active
templates and calls the real provider; its in-memory queue only simulated
delivery and is not used as acceptance. Hard-coded legacy workflow triggers and
automatic default sequence creation are retired. Failures in tracking after
acceptance cannot cause a caller to retry an accepted message.

Statistics use saved SENT events, exclude tests and count each message once.
Events without a corresponding SENT record do not invent a denominator. Rates
without any recorded sends are unavailable, rather than assumed zero. Provider
acceptance totals include logged tests; tracked marketing statistics exclude
them. Historical messages without logs and expired tracking events cannot be
reconstructed from the database.

Simulated legacy report endpoints now return a source-unavailable response
behind ADMIN authorization. Image optimization and supplier-invoice sending also
report unavailable without writing fake processing results or invoice status.
The complete image pipeline, supplier score sources and invoice dispatch remain
pending; core real order/supplier reports are preserved. Product detail/edit
load actual product records. Existing business reports and their paid-order
definitions remain unchanged.

## Verification and limits

The separate PostgreSQL database is `localhost:55434/stemtoys_admin_email_dev`.
Safety validation passed before initialization. No schema change, migration or
production database write is included. Fixtures are explicitly local and cannot
describe live store totals.

`scripts/verify-admin-emails-local.ts` refuses an occupied database and is
restricted to that exact local address. Fixtures cover 28 templates over two
pages, active/inactive categories, three subscribers, saved sequence steps and
an enrollment, a campaign, trigger execution, accepted/failed/unverified logs,
duplicate engagement events, an orphan event and excluded test events. Direct
PostgreSQL assertions pass, including distinct-message percentages and missing
denominator states.

The authenticated HTTP script uses the same isolated database and existing test
credentials. Read checks pass for real counts, pagination, filtering, saved
content/steps and ADMIN access/no-store responses. Its optional `--mutations`
workflow also passes create/edit/reload/delete of explicitly disposable local
templates, sequences and campaign drafts, plus trigger pause. It sends no
emails.

Browser verification confirms separate subscriber/template totals, page-two
records, saved HTML preview and the sequence editor's persisted fields and
participant protection. History, campaigns, subscriber records and distinct
metrics are visible in the browser. Narrow layout has no document overflow at
the browser's actual 520 CSS-pixel minimum width (390 was requested but not
applied by the desktop browser). The viewport override was reset. Local fixture
screenshots are kept separately from production evidence. Focused API,
delivery-audit, trigger, older-service and component tests cover source
contracts, failed refresh/retry, authorization, provider failures and opt-in.
Final regression/build results and publication status are recorded below as
checks complete.

Neon connector access currently returns a reauthorization requirement. Private
production counts and live provider/inbox receipt remain unverified. No external
email was sent during this work.

## Remaining automation work

The legacy sequence execution engine contains unfinished database/progress
methods and timer-based scheduling unsuitable for durable serverless runs.
Saving a real sequence is now functional, but activating its configuration does
not certify automatic enrollment or execution. The interface states this
explicitly; this change does not enable a new automatic mail schedule against
existing customers. A durable worker, enrollment event wiring, opt-in rules,
idempotent progress and provider acceptance tests remain necessary before
sequence execution can be advertised as operational.

The previous dashboard audit also retains unresolved live payment/refund,
courier and inbox acceptance, advanced forms and cost/margin source coverage.
Those are tracked in `TASKS.md`; the entire admin cannot yet be called fully
verified.
