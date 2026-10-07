# Supplier return destinations and notification design

Date: 7 October 2026. Follow-up on `codex/holds-refunds-privacy`, from clean
`75497776`, continuing
[draft PR #71](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/71). The
owner supplied the KidStory and Boribon dropshipping PDFs, confirmed the company
address and authorized one personal inbox for synthetic acceptance. No
production release, supplier message or production database write occurred.

## Contract decision

The supplied documents were extracted and their relevant pages visually
inspected. Boribon form annotations contain details absent from extracted text.
Both copies show owner signatures but blank supplier signature fields; active
counterparty execution is not established by those copies. Admin review must
confirm that the collaboration/contract remains active and preserve written case
authorization. Full private contracts, signatures, financial data, test inbox
and provider message IDs are excluded from public source.

| Case                                                                                                      | Supplier destination requirements                                                                                                                                                                                           | Otherwise                                                             |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| KidStory ordinary withdrawal/refusal                                                                      | Unused, unassembled, unopened original packaging, original documents, approved ARP, issue date and confirmed physical arrival within ten calendar days of ARP issue.                                                        | Company intake/review.                                                |
| KidStory manufacturing defect/incomplete item                                                             | Approved ARP; initial claim within ten days of supplier invoicing, or explicitly confirmed warranty remedy; same ARP arrival deadline.                                                                                      | Company intake and warranty coordination.                             |
| KidStory wrong item                                                                                       | Approved ARP requested within five days of the earlier verified invoice/delivery anchor; confirmed warehouse and ARP arrival deadline. Invoice/delivery wording is ambiguous, so this routing uses the conservative anchor. | Company intake/manual supplier review.                                |
| Boribon ordinary withdrawal/refusal                                                                       | Unused, sealed and undamaged original packaging, matching description, approved case/warehouse confirmation; physically received no later than day eighteen after delivery.                                                 | Company intake/review; no automatic customer commercial deduction.    |
| Boribon manufacturing defect/incomplete item                                                              | Explicit warranty confirmation and agreed receiving deadline. The ordinary eighteen-day limit does not close warranty handling.                                                                                             | Company intake and warranty coordination.                             |
| Transit damage, unspecified reason, opened ordinary withdrawal, unknown contract or missing/expired proof | Company intake/manual review.                                                                                                                                                                                               | Customer remedy is considered separately from supplier reimbursement. |
| Digital product                                                                                           | Human entitlement review; no parcel, address or identification PDF.                                                                                                                                                         | Supply/consent evidence and conformity rights remain separate.        |

Boribon's PDF identifies B-dul Pipera nr. 2C, clădirea MVK, Voluntari-Pipera,
Ilfov as its depot. KidStory's PDF identifies its registered office but does not
establish the receiving depot; the existing Baicului business address must be
confirmed for the actual ARP. The implementation takes the receiving address
from the supplier database after admin confirmation. It never infers that a
registered office is the authorized warehouse.

The fallback is the owner-confirmed TechTots/WEBIRA REM company address:
Mehedinți 54–56, Bl D5, sc 2, Cluj-Napoca, Cluj, România. Supplier limits govern
TechTots' recourse and routing; they do not automatically reject a customer's
withdrawal/conformity complaint or transfer reseller penalties to the customer.
See
[OUG 140/2021, articles 12 and 16](https://legislatie.just.ro/Public/DetaliiDocument/303291).
Supplier mismatch/integrity reporting deadlines remain an operator follow-up;
customers are not subjected to an invented 48/72-hour rights cutoff.

## Implementation

- `/api/returns/[returnId]/destination` requires a real ADMIN session and CSRF.
  Only pending returns accept a destination review. Client-supplied warehouse
  addresses and forged review metadata are rejected.
- Review evidence records contract, reason, reviewer/time, written confirmation,
  condition/date checks and an address/RMA/deadline snapshot. It is stored in a
  versioned server-owned line alongside existing supplier notes, with no schema
  change. Human notes are retained. Customers never receive commercial evidence.
- Supplier routing is invalidated by changed supplier/reason/authorization or
  expired arrival time. Missing, duplicate or malformed evidence falls back to
  the company. Ordinary notes cannot forge a review. Calendar arithmetic uses
  Europe/Bucharest and covers daylight-saving transitions.
- Destination review and approval updates compare the previously read status and
  update time. A simultaneous change cannot silently overwrite a review or send
  stale approval instructions. Approval email retries preserve the lifecycle.
- Account instructions, PDFs and single/bulk emails use the same destination. A
  bulk email contains one PDF per physical return and no digital shipping PDF.
  Each item card names its own attachment, destination, ARP/RMA and deadline.
- Return approval/rejection/admin notifications use the already configured SMTP
  transport when SMTP credentials exist. The existing confirmation service also
  uses SMTP. Other mail paths retain their configured provider. No Vercel email
  setting was changed and no disabled Brevo send is counted as successful.
- SMTP verifies TLS, limits connection/socket waits and reports actual recipient
  acceptance. Approval routes await it; failed mail returns 202 with saved
  approval and incomplete notification instead of a false delivery claim.
- Approval, rejection and digital messages now share a table-based responsive
  TechTots layout, official logo, navy/cyan palette, readable typography,
  per-item address cards, plain-text alternative and escaped customer/supplier
  content. Identification PDFs use the same branding, embedded Romanian fonts,
  clear destination/reference sections and numbered pages. They identify the
  return; they are not prepaid courier AWBs.

## Acceptance evidence

- Eleven focused suites / 73 tests pass: contract boundaries, evidence expiry,
  malformed/forged metadata, admin/customer/CSRF denial, concurrent updates,
  provider failure/retry, mixed physical/digital routing and attachment mapping.
- Actual local PostgreSQL/API/browser verification used a disposable database at
  `localhost:55432/stemtoys_dev` and development server port 3014. It exercised
  real credentials, ADMIN/customer separation, CSRF, admin review, bulk/single
  approval, rejection, digital admission, hidden customer metadata and expired
  authorization fallback. No live order/payment was used.
- Admin review passed at desktop and 390px mobile after correcting internal
  dialog overflow. The final dialog is 358px wide, with client and scroll width
  both 356px; form controls fit within the viewport. Customer mixed/digital
  instructions also passed at 390px.
- Four original return notifications were accepted by real SMTP. The owner
  confirmed receiving the mixed email with three PDFs and requested a more
  professional design. Three revised mixed/rejection/digital messages were then
  accepted by SMTP. Receipt/rendering of the revised versions still awaits owner
  confirmation; provider acceptance is not proof of inbox receipt.
- Revised HTML was rendered at 1440px/390px without horizontal overflow.
  Supplier and company PDFs render on one page. A long product fixture flows
  across two numbered pages, retaining references/instructions without clipping.
  Extracted PDF text and full rendered pages were checked.
- Public-secret scan and full Jest/TypeScript comparisons remain mandatory
  normal publication hooks. Existing baseline failures are documented in the
  [operations audit](2026-10-07-holds-refunds-privacy.md); a comparison pass
  means no added failures, not a clean global test/typecheck result.

Private extraction, screenshots, HTML/PDF fixtures and acceptance evidence are
in ignored `test-results/supplier-contracts-2026-10-07/`. The test server and
512MB disposable database container were stopped/removed, and temporary SMTP
credentials were removed. The unrelated Docker workload was left alone.

The draft still requires an approved production release, current per-case
supplier authorization, deployed admin acceptance and revised inbox
confirmation. Actual Stripe full/partial sandbox refunds and remaining
privacy/provider agreement evidence are tracked separately. This does not
certify an A+ grade.
