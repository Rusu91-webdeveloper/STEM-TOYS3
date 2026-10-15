# Admin cancellation email — 15 October 2026

The owner cancelled an order from the admin dashboard successfully but did not
receive its cancellation email with the supplied reason.

## Confirmed findings

`PATCH /api/admin/orders/[id]` persisted the cancellation and reason, then
awaited `sendOrderCancellationEmail` without checking its returned `success`
flag. The provider service resolves failures as `{ success: false, error }`, so
these failures bypassed the exception handler and both admin screens still
showed an unqualified success message. The existing email template already
received the reason correctly.

Cancellation used `getEmailService()` and its separate provider selection; order
confirmations use `lib/nodemailer.ts` with the store's `EMAIL_*` SMTP
configuration and acceptance audit. Read-only production configuration
inspection confirmed `EMAIL_PROVIDER=brevo`, SMTP configuration keys and no
Resend key. The initial Resend-default hypothesis was therefore incorrect. No
matching runtime logs were available in the inspected window, and the affected
order was not identified. The particular Brevo rejection or inbox-delivery cause
remains unverified; configuration presence does not certify provider health.

## Implemented behaviour

- Cancellation uses the same SMTP sender as order confirmations. No provider
  credentials or production configuration are changed.
- The supplied reason appears in both HTML and plain text and remains in the
  order notes. Markup in the reason is escaped in HTML. An omitted reason stays
  omitted rather than being replaced with an invented explanation.
- The response separates the saved order from `emailNotification.status`:
  `accepted`, `failed` or `not-required`. Acceptance requires an SMTP message ID
  and an accepted recipient; it does not claim inbox delivery.
- Both admin screens retain the saved cancellation and show a Romanian warning
  if the notification fails. The list still closes its form and reloads the
  saved order; the details screen updates its saved state.
- Re-submitting an already-cancelled status does not resend an email or append
  another cancellation reason. This guards sequential repeats, not concurrent
  cancellation requests or a later transition back into cancellation.
- SMTP acceptance and rejection use the existing email history audit. An audit
  write failure does not turn an accepted message into a failed send that might
  be retried. Failures before transport, such as missing recipients or rendering
  exceptions, are reported in the response and server logs.

## Verification and limits

Focused Jest coverage exercises the real cancellation handler, renderer, SMTP
adapter and delivery audit with mocked authentication, persistence and external
transport. It covers the reason, Romanian text and HTML escaping, omitted
reasons, SMTP exceptions/rejections/missing acknowledgements, missing
recipients, sequential repeat submission and audit failure after acceptance.
Component tests exercise both admin screens, including the warning, saved state
and existing CSRF retry behaviour. Existing ADMIN/CSRF denial checks remain
unchanged.

```sh
pnpm exec jest --runInBand --runTestsByPath \
  __tests__/api/admin/order-cancellation-email.test.ts \
  __tests__/api/admin/order-status-csrf.test.ts \
  __tests__/app/admin/order-status-updates.test.tsx \
  __tests__/app/admin/orders.test.tsx \
  __tests__/api/csrf-token.test.ts \
  __tests__/lib/delivered-review-email.test.ts \
  __tests__/lib/email/delivery-audit.test.ts
node scripts/typecheck-regressions.js HEAD
```

The first seven cancellation regression cases failed before the fix. The seven
focused suites pass all 47 checks after the fix. Full TypeScript comparison
against starting commit `1ff1faae` found 1,144 baseline errors, 1,143 current
errors and zero added errors; repository-wide type checking is not clean.

Formatting passes for the changed client, API, component, test and fix-record
files. Changed-file ESLint reports three pre-existing errors in unchanged parts
of `lib/email/order-templates.ts`: import grouping at line 8 and unused
`createButton`/`createProductCard` bindings in other templates. The other
changed TypeScript files have no lint errors; existing warnings remain. The
first lint process exhausted its default heap; the completed retry used an 8 GB
limit.

No production order was changed, customer email sent, schema/migration applied
or deployment performed. The missed email has not been resent. Live SMTP
acceptance and customer inbox receipt still require an explicitly authorized
send after deployment. Other status-email templates retain their existing
provider paths and are outside this cancellation fix.
