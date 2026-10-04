# Consumer return costs and reviewed refunds

Owner approved this follow-up to draft PR #64 on 4 October 2026. Keep the PR
draft; do not merge or promote. This is implementation evidence, not a
certification of the entire shop. Private supplier/courier contracts remain
outside the repository.

## Policy and primary sources

- Ordinary statutory withdrawal: customer pays direct return carriage to the
  chosen carrier, after precontract disclosure. No automatic penalty or fixed
  restocking fee. Full withdrawal refunds amounts paid, including the initial
  standard delivery charge; the expressly selected premium delivery difference
  is excluded. Refund is due within 14 days of notice, with the statutory
  goods/proof-of-dispatch withholding right. Return dispatch is within 14 days
  of notice, not approval. OUG 34/2014, articles 11, 13, 14 and 25:
  https://www.ancom.ro/uploads/links_files/OUG_34_2014.pdf
- Nonconformity: TechTots arranges necessary transport/remedy without consumer
  cost. Supplier/courier liability is an internal recovery matter. Legal
  conformity rights are separate from the 14-day withdrawal window:
  https://europa.eu/youreurope/business/selling-in-eu/consumer-contracts-guarantees/consumer-guarantees/index_ro.htm
- COD refusal/noncollection alone is neither a withdrawal declaration nor
  authority for automatic guarantee capture. An individual damages claim needs
  evidence and legal grounds. Valid withdrawal must not be penalized. Existing
  outbound-only card authorization is retained; marking COD rejected does not
  capture it. There is no replacement automated damages-charge path.
- Stripe pending/failed refunds are not successful reimbursements. Processor
  history, remaining charge balance and a stable idempotency key prevent a retry
  after database failure from initiating a duplicate refund:
  https://docs.stripe.com/refunds https://docs.stripe.com/api/refunds/list

The separate notice/function requirements and official asset verification are
recorded in
[the legal-guarantee audit](2026-10-04-legal-guarantee-withdrawal.md).

## Root issues and implementation

1. Public terms/returns/shipping, COD consent and the footer had language that
   could imply automatic capture or obscure standard-delivery refunds. Shared
   policy constants now provide the customer-cost, seller-cost and refund
   explanation. Checkout shows it before placing an order for all payment
   methods. A new COD consent version prevents reuse of older accepted wording.
2. The admin COD-rejection route could call Stripe capture by default. It now
   records rejection only, enforces ADMIN plus CSRF, and rejects the legacy
   `captureGuarantee: true` request. Admin text explains the separate review.
3. Stripe returns automatically refunded undiscounted item price times quantity,
   omitting standard delivery for full withdrawal and potentially ignoring
   discounts/prior refunds. Admin must enter and confirm the exact reviewed
   amount and calculation. The API checks order and processor limits, handles
   existing refunds on retries, and marks full payment refunded only when the
   processor charge is fully refunded. It does not infer this from return-row
   counts. Checkout cancellation and public guest intake are not automated
   refund instructions.
4. COD/Netopia status switching lacked an explicit actual-payment proof. Admin
   must first make the repayment separately, then record its reference, time,
   amount and acceptance of the repayment method without extra consumer fees.
   The audit is stored in the existing return record. This form does not
   transfer COD/Netopia funds. Several partial manual reimbursements require
   separate order-level reconciliation; the implementation deliberately does not
   infer full repayment by counting item returns.
5. Account return gates treated all complaints as 14-day withdrawals and
   mandatory photos could block requests. Physical conformity complaints remain
   accessible after the withdrawal window; photos are optional. Unknown delivery
   evidence is admitted for review rather than expired from purchase date. This
   is admission, not automatic acceptance of every warranty claim.
6. Approval emails incorrectly counted 14 days from approval and a generated PDF
   could be mistaken for prepaid postage. Single/bulk instructions use the
   notice-based dispatch deadline and reason-specific costs. PDFs clearly
   identify the return and do not promise prepaid transport. Supplier ARP/RMA
   does not condition consumer rights or suspend legal deadlines.

Concurrent Cursor's protected COD-settings/helper/selector/test files were not
changed. Flat 9.90 lei / 0% remains admin-driven. No schema, migration,
dependency, credential or production setting was changed.

## Verification and remaining acceptance

- 86 focused service/API/React tests pass: reviewed Stripe amount including
  delivery, duplicate/recovery/pending/partial limits, manual repayment proof,
  ADMIN/CSRF, no COD capture, physical conformity outside 14 days, optional
  photos, delivery-date evidence and Romanian/English precontract copy.
- The TypeScript comparison initially reported four old UploadThing errors as
  new: truncated union diagnostics displayed different subsets of the same
  allowed values. Diagnostic collection now requests the full union before
  canonical comparison. A real compiler fixture verifies all 50 members are
  retained; existing tests still reject changed members/messages. Upload limits
  and the upload router remain unchanged. 18 diagnostic/release-check tests
  pass.
- New runtime-file lint passes without errors/warnings. Whole-repository
  TypeScript/Jest debt is assessed by mandatory baseline comparisons, not
  described as a clean repository run.
- Local public returns page renders the policy and corrected footer. At 390 CSS
  pixels the document has no horizontal overflow. Two PDF previews with
  fictitious inputs (RO/EN) were generated and visually checked, one page each,
  with legible instructions and no overlap. Neither preview contains real
  customer data or is committed.
- Local DB safety check confirms localhost:55432. That database is unavailable;
  authenticated real-DB writes and financial end-to-end acceptance are not
  claimed. No real refund, capture or email was performed.

Before release: use an authorized fictitious preview order/inbox to verify
receipt persistence and merchant/customer mail delivery; authenticate as ADMIN
to review it. Use a Stripe test payment for full/partial/pending/retry refund
acceptance and check actual processor history. Separately confirm the
COD/Netopia manual-repayment audit and COD rejection without capture. Audit
guarantee release/expiry when processing a valid withdrawal or cancellation; do
not collect a damages charge from a mere rejection status.

Known separate scope: the existing account API still blanket-excludes digital
items. Review express digital-supply consent, loss-of-withdrawal acknowledgement
and digital conformity remedies before claiming the entire shop compliant.
Public withdrawal intake remains available without an account or reason.

### Deployed-copy follow-up, 5 October 2026

The first deployed return-policy preview still imported the older COD hold
explanation into shipping and FAQ. Shipping also retained an unconditional
advance-logistics withholding sentence. Both pages now use the shared reviewed
RTO policy; shipping states the statutory refund rule instead of that sentence.
FAQ explains that withdrawal can be declared before delivery, although the
14-day goods window runs from receipt. Executed FAQ/JSON-LD and source-boundary
regression checks cover these omissions. The protected fee helper, selector and
fee tests remain unchanged; the fee continues to come from admin settings.

### Preview acceptance, 5 October 2026

- Verified deployment `dpl_2t6UFz5YoRMJb9TH7hKCNKDzqMYd`, source
  `67e2e4d914b7c608eac5edc6dd868c6882753668`, READY, preview target:
  https://stem-toys-3-f9puubzyl-rusujobs-3774s-projects.vercel.app
- Browser checks confirm shipping and FAQ/JSON-LD no longer display the old
  capture/advance-retention promises. Admin-configured COD fee renders 9.90 lei.
  Terms retain standard-delivery refunds and free conformity remedies.
- With the owner's explicit authorization for the test recipients, submitted one
  clearly labelled fictitious guest declaration with no real order/contract.
  Reference: `withdrawal_bcb2c7a7-49f6-401a-badc-49e2db825caa`. Server receipt
  time: `2026-10-04T22:40:27.415Z` (05 October, 01:40:27 Bucharest). The
  deployed app confirmed registration and customer email sending. The downloaded
  UTF-8 receipt contains the same reference/time, declaration and current
  cost/refund/dispatch policy. No customer email address or private receipt file
  is committed. Actual inbox delivery awaits owner confirmation; provider
  acceptance alone is not proof of inbox delivery.
- Unauthenticated preview admin page redirects to login and its API returns
  `Admin access required`. Authenticated admin processing was not performed. No
  order cancellation, real withdrawal, refund or card capture was performed.
- Required publication checks: complete Jest baseline/current both 64 failing
  suites / 175 failing tests, zero regressions; complete TypeScript baseline
  1,200 / current 1,195 diagnostics, zero added. Existing repository debt
  remains. Follow-up copy lint has zero errors and two warnings in unchanged
  expressions.

The earlier local-database/mail limitation above describes the local session.
This later authorized preview test verifies deployed registration and receipt
export; actual inbox delivery was confirmed separately by the owner.
Authenticated review and processor acceptance remain distinct release checks. PR
#64 stays draft.
