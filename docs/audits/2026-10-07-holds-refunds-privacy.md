# COD hold expiry, refund acceptance and privacy operations

Date: 7 October 2026. Baseline: clean detached
`baa18e299cbfb065f3b0d92bfab6c77603d3f99b` (merged PR #70), fetched
`origin/main`, branch `codex/holds-refunds-privacy`. The owner requested repairs
to these three remaining readiness items. Existing project memory was reviewed
before implementation. No schema or migration change.

[PR #64](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/64) is
**merged**, at `8185af93ab7f5d568ad1cad14cf499df16b55202`, 4 October 2026 at
23:20:37 UTC. Earlier task records describing its draft state are historical.
This follow-up repairs additional implementation gaps and records the remaining
operational acceptance; it does not certify an A+ grade or complete legal
compliance.

## Final card-hold procedure

The transport authorization is separate from payment for the COD order. Stripe's
expanded latest charge supplies `card.capture_before`; no fixed seven-day
deadline is guessed. The shared settlement procedure verifies RON, manual
capture, `paymentFlow=cod_guarantee`, and matching order metadata where
recorded.

| Event                 | Active authorization                                                                                                                                  | Expired or already cancelled authorization                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery/completion   | Request cancellation of the shipping hold; record Stripe confirmation. Collect/reconcile the actual COD payment through the ordinary payment process. | Record expiry/already released. Delivery remains valid. Reconcile the actual COD payment separately; never revive the hold or create a new debit.                                              |
| Customer cancellation | Request cancellation; preserve the cancellation reason and settlement evidence.                                                                       | Record expiry/already released. No automatic replacement authorization or capture. Review any separate payment or reimbursement on its evidence.                                               |
| Refusal/RTO           | Record refusal and request cancellation. Keep the existing policy for independently reviewed transport costs and conformity cases.                    | Record expiry/already released. The expired hold is not a source of funds. No automatic debit; any separately justified claim requires human review and an appropriate agreed payment process. |

If Stripe shows an actual captured amount, the result is `captured_review`, not
"hold released". The operator must inspect payment/refund history and
entitlement before any refund. Wrong or unusual payment state produces
`review_required`. Provider failures produce `retry_required`; they never claim
successful release. An authorization release is not a refund and issuer
availability timing is not promised as a fixed number of days.

Admin delivery/cancellation, refusal, the legacy admin status endpoint and
courier fulfillment updates share this procedure. The refusal endpoint continues
to deny capture requests and refuses to overwrite PAID/REFUNDED COD payments.
Both legacy `cod` and current `cash_on_delivery` records can record an unsettled
refusal. Conflicting COD/prepaid checkout fields are rejected before
payment/order writes, and ordinary prepaid capture remains available. The
complete server-owned COD consent text is saved with version
`2026-10-07-expiry-v3`. Public terms/returns/shipping now describe the same
procedure.

Settlement evidence is appended with compare-and-swap so concurrent courier or
cancellation notes survive. Repeated outcomes are not duplicated. Admin order
details show the outcome and known Stripe deadline, and the refusal button says
"Release Hold". The authenticated daily worker retries up to three terminal COD
orders per run with short provider timeouts, rotating failed rows by
`updatedAt`. `review_required` and `captured_review` stop automatic retries and
require operator attention. Its JSON response exposes retention/hold summaries
and returns 503 for cleanup failures or holds requiring retry.

Operator procedure: review any `retry_required`, `review_required` or
`captured_review` notice in order details. Re-saving a terminal order status can
request immediate settlement again. Use the recorded PI in Stripe, retain the
provider outcome, and never mark the COD order paid merely because its shipping
hold expired or was released. The daily queue is a bounded fallback, not a
promise that an arbitrary backlog completes in one day.

## Returns, repayments and email acceptance

Authenticated admin review/retry and CSRF checks are exercised. Incomplete
withdrawal email retry returns 202 with `deliveryComplete=false`; both
notification flags must be true for 200. Development mail simulation remains
undelivered in the durable outbox. The Resend adapter now checks the SDK's
`{data,error}` response, records `data.id`, and passes `replyTo` using the
installed SDK field. Rejected or unacknowledged sends cannot become successful
email acceptance; the unified service also honors `success=false` before trying
its fallback. Provider acceptance still does not prove delivery to an actual
inbox.

Manual repayments now reconcile audit proofs across successful returns in a
serializable transaction. A partial repayment leaves the order PAID; cumulative
repayments equal to its total set REFUNDED. Duplicate payment references,
overpayment, replacement proofs on retry, or ambiguous historical proof require
review rather than a guessed balance. Existing reviewed Stripe refunds retain
their idempotent history checks and separately reviewed amount.

### Digital products

Previously, every digital return was blocked even though checkout does not
persist item-level express supply consent, acknowledgement of withdrawal-right
loss and durable confirmation of that agreement. Digital withdrawal/conformity
requests now enter human review for paid/delivered purchases, including paid
orders still PROCESSING. Admission is not automatic refund entitlement. A
download count alone does not establish a withdrawal exception. Review actual
supply, notice, timing, consent and confirmation evidence; conformity rights
remain separate.

The account entry/form, submitted confirmation and approval emails explain that
digital requests need no parcel or transport charge. The selected-reason review
panel keeps digital requests in manual review without physical shipping costs.
Digital-only approvals have no physical return label; mixed approvals
distinguish physical instructions. Refunding a digital item stops new token
generation and access through old tokens even when other items keep the order
PAID. Merely opening a complaint does not revoke paid access.

### Remaining acceptance matrix

| Check                            | Local evidence                                                                                           | External completion still required                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated admin review/retry | Real credentials, ADMIN/customer separation, CSRF, durable review and failure/retry state.               | Confirm deployed admin workflow after approved release.                                                                                                                                         |
| Full/partial Stripe refunds      | Focused reviewed-refund tests cover processor history, pending/failure/retry and amounts.                | Stripe test-mode order, actual partial/full refunds through authenticated routes, provider IDs/history and retry evidence. Connector currently requires reauthentication.                       |
| Manual repayment                 | Actual local database/API partial then cumulative full repayment with immutable bank-reference evidence. | Reconcile a real completed repayment only when independently confirmed by operator evidence.                                                                                                    |
| Redesigned emails                | Template and transport failure/acceptance tests, preserved withdrawal receipt evidence.                  | Explicitly authorized customer/merchant test addresses; inspect actual inbox rendering, links, HTML/text, timestamps and attachments where relevant. Record message IDs and receiving evidence. |

Do not use real customers or production funds as acceptance fixtures. Current
tests sent no real email and moved no real money. The owner question for
authorized inboxes and a Stripe test-mode fixture is pending.

## Privacy operation and remaining owner evidence

The existing account erasure is a real serializable cleanup, not a delayed
30-day promise. It closes login and clears account/profile, marketing, old
cards, non-order addresses and other covered account relations. Financial
records, order-linked addresses and minimal request evidence are preserved for
reviewed exceptions. Open orders/returns go into the admin review queue; staff
accounts cannot use customer self-erasure. Actual local database assertions
cover rollback and retained invoice/address relations.

The admin request queue now shows a one-calendar-month response deadline from
receipt, clamped for month end, and flags overdue cases. This is a response
deadline, not a universal deletion date. The configured application retention
worker removes bounded batches of EmailEvent and PerformanceMetric records; it
does not delete orders, invoices or legal withdrawal EmailLog receipts.

Daily operator procedure:

1. Review `/admin/privacy` pending requests and their response deadlines.
   Resolve fulfillment/refund blockers and document any necessary retained
   records and lawful exception before processing the request. Give the
   requester an actual response; closing an account is not evidence that a
   response was sent.
2. Review authorized maintenance results for retention errors and policy
   categories requiring manual review. Confirm completed scheduled production
   execution, not merely that `vercel.json` contains a schedule.
3. Review related mailbox/support, guest transactions, supplier/courier records
   and provider-held data outside this account transaction. Document any
   required recipient request, retention exception, backup expiry and restore
   procedure.
4. Keep dated evidence for provider contracts/roles, transfer arrangements and
   actual category-specific retention settings. Do not infer agreement
   acceptance from installed code or published provider terms.

| Owner-controlled item            | Known evidence                                                                                                                                      | Required confirmation                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Operator identity                | WEBIRA REM S.R.L., CUI 51813997; registration J2025035239005 owner-confirmed 3 October.                                                             | Confirm the current registered/contact address: Mehedinți 54–56, Bl D5, sc 2, Cluj-Napoca, Cluj, România, and the separately applicable return destination.        |
| Application retention            | Project record says owner approved EmailEvent 30 days / PerformanceMetric 60 days on 4 October; bounded worker exists and local deletion is tested. | Re-read current production policies and retain a successful scheduled cleanup result. Scoped Neon access failed in this session; live values were not reconfirmed. |
| GA4                              | Project record confirms two months and reset-on-activity disabled on 4 October.                                                                     | Preserve current settings evidence and distinguish aggregate/provider retention.                                                                                   |
| Hosting/database/storage         | Vercel, configured database and file-storage integrations are present.                                                                              | Actual deployed providers, accepted agreements, roles, transfers, backup/log retention and deletion/restore handling.                                              |
| Transactional/support mail       | SMTP and unified Resend/Brevo/Gmail adapter paths exist; deployed transport is not established by repository defaults.                              | Identify each active provider and support mailbox; accepted terms/DPA where applicable, retention and actual inbox acceptance.                                     |
| Payments/delivery                | Stripe, NETOPIA and FAN Courier integration paths.                                                                                                  | Applicable accepted contracts and roles, provider-held evidence/retention and rights routing.                                                                      |
| Identity/measurement/advertising | Google sign-in/GA4 and Meta integration paths; optional uses remain consent-dependent.                                                              | Accepted applicable provider terms/addenda, enabled uses and transfer evidence.                                                                                    |

The owner address/agreement question is pending. The live Vercel project was
READY during a read-only check. A narrowed maintenance-log query returned no
records and a broader query timed out, so scheduled production cleanup remains
unobserved in this follow-up. Production data/settings were not changed.

## Verification and release boundary

Completed verification:

- 28 focused Jest suites / 194 tests passed, including authenticated denials,
  settlement races, refund proof reconciliation, digital access and email
  provider acceptance/failure behavior.
- Both real local verification scripts passed. Account erasure covers login
  closure, rollback, retained invoice/address relations, review queues and
  configured retention. The holds/refunds script verifies real credentials,
  ADMIN/customer separation, CSRF, durable review/retry and undelivered outbox
  state, partial then full manual repayment, paid digital complaint admission,
  privacy deadlines and desktop/mobile return form behavior without horizontal
  overflow or browser errors. No actual email or payment was sent.
- Complete Jest comparison: baseline and current both have 64 failed suites /
  175 failed tests, with zero added failures. Every changed test passes;
  existing repository failures remain visible.
- Complete TypeScript comparison: baseline and current both have 1,178
  diagnostics, with zero added diagnostics. This is not a clean full typecheck.
- Scoped syntax/style ESLint comparison: baseline 68 errors, current 39, zero
  added errors. Type-aware ESLint rules were excluded from this memory-limited
  run; the complete TypeScript comparison is separate.
- Public-secret scan and `git diff --check` passed. No dependency, schema or
  migration change. The normal commit/push hooks must pass before publication.

Evidence logs and viewport screenshots are retained locally in ignored
`test-results/operations-2026-10-07/`. Local verification uses only a disposable
PostgreSQL 16 database `localhost:55432/stemtoys_dev` and a development server
at `http://localhost:3014`. Both verification scripts reject other database
hosts/ports/names. Use an isolated local environment without payment or mail
provider credentials, run `pnpm run db:check-safety`, then the scripts:

```sh
pnpm exec tsx scripts/verify-account-erasure.ts
pnpm exec tsx scripts/verify-holds-refunds-privacy.ts
```

The second script needs Playwright's Chromium headless shell, the server running
on port 3014 and a generated local schema. It creates synthetic credentials and
records in the disposable database, tests real login/API/UI behavior, and stores
desktop/mobile screenshots in ignored `test-results/operations-2026-10-07/`. The
disposable container and development server were removed/stopped after the
successful checks. Remove the disposable container after every rerun. It must
never target a live storefront or use actual inboxes/payment credentials.

Mac resource pressure interrupted an intermediate acceptance run and full
checks. After the owner requested diagnosis, panic logs showed watchdog timeouts
and low swap space. Work resumed after disk availability increased from about 8
GB to 77 GB. Remaining heavy checks run sequentially; the disposable database
has a 512 MB container memory limit. No interrupted run is counted as a pass.

No production merge/deployment is authorized by this follow-up. Publish the fix
as a draft for review. Live acceptance and owner confirmations above remain
required before declaring all three readiness items closed.

## Primary sources

- [Stripe manual authorization/capture](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method):
  `capture_before`, automatic release after expiry and separate capture.
- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
  and installed SDK 4.5.1 definitions: resolved `{data,error}` and `data.id`.
- [OUG 34/2014, consolidated](https://legislatie.just.ro/Public/DetaliiDocument/254147):
  digital withdrawal exception requires the applicable prior express agreement,
  acknowledgement and confirmation conditions; physical/digital review differs.
- [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj) and
  [ANSPDCP response guidance](https://www.dataprotection.ro/?page=Plangeri_raspuns_nu):
  response timing, justified extensions and erasure exceptions.
- Existing
  [4 October privacy/retention evidence](2026-10-04-shipping-privacy-trust.md)
  and [return-cost/refund policy audit](2026-10-04-return-cost-policy.md).
