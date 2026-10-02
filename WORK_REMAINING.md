# Remaining Work for PR #54 - Transactional Email Fixes

## Critical Items to Complete Before Review

### 1. ✅ Legal Details from Shared Constants (DONE)
- [x] Created `lib/config/company-legal.ts` with COMPANY_LEGAL and CONSUMER_RIGHTS
- [x] Updated `shared-layout.ts` to import and use these constants
- [x] Values match Footer.tsx: CUI 51813997, Reg. Com. J20/352/2025

### 2. Coverage of Every Send Path (IN PROGRESS)

#### Order Confirmation Paths:
- [x] COD checkout - `app/api/checkout/order/route.ts` (uses improved)
- [ ] Stripe webhook paid - `app/api/stripe/webhook/route.ts` line ~458 (still uses old DatabaseTemplateService)
- [ ] Netopia webhook paid - `app/api/payments/netopia/webhook/route.ts` lines 510 & 561 (still uses old DatabaseTemplateService)

#### Payment Failed:
- [ ] Stripe webhook - `app/api/stripe/webhook/route.ts` line ~151 (check if uses improved)

#### Shipped Email:
- [x] Manual admin shipped - `app/api/admin/orders/[id]/route.ts` (uses improved)
- [ ] Automatic AWB created - `lib/shipping/fancourier-awb.ts` line ~1570 (needs to call sendShippedEmailImproved after AWB propagated)
- [ ] Courier sync shipped - `lib/order-fulfillment-sync.ts` (needs hook when status becomes SHIPPED)

### 3. Make Template Keys Code-Owned (TODO)

Need to modify the email template loader to skip DB lookup for these keys:
- `order-confirmation`
- `payment-failed`
- `refund`
- `password-changed`

File to modify: `lib/email/database-first-email.ts` or template service

### 4. Remove Unverifiable Claims (TODO)

Check and fix:
- [ ] `lib/email/payment-and-refund-emails.ts` - Remove "5-10 days" unless payment provider confirms
- [ ] Any other hard-coded timings without source

### 5. Fix All Failing Tests (TODO)

Current: 26/37 passing
Target: 37/37 passing

File: `__tests__/lib/email/email-templates-improved.test.ts`

Issues to fix:
- Assertions checking for exact text that may not be in template
- Check what's actually in generated HTML vs what tests expect

### 6. Type Check All Modified Files (TODO)

Run: `npx tsc --noEmit` on:
- `lib/email/shared-layout.ts`
- `lib/email/order-confirmation-improved.ts`
- `lib/email/shipped-email-improved.ts`
- `lib/email/payment-and-refund-emails.ts`
- `lib/email/password-changed-email.ts`
- `lib/email/admin-new-order-email.ts`
- `lib/email/order-email-integration.ts`
- `lib/config/company-legal.ts`
- All modified API routes

### 7. Generate PNG Screenshots (TODO)

For each of 5 scenarios, generate PNG at:
- Desktop width (~600px email container)
- Mobile width (~390px)

Scenarios:
1. COD guest order confirmation
2. Paid card order confirmation
3. Shipped with AWB
4. Payment failed
5. Refund processed

Save to: `email-previews/*.png`
Commit them with git

### 8. Update PR Description (TODO)

After all above complete:
- Update test count (37/37 passing)
- Add path coverage table showing all send paths fixed
- Add links to PNG screenshots
- Remove DB deletion instructions
- Add note about code-owned template keys

---

## Next Steps (Ordered by Priority)

1. Fix all order confirmation send paths (Stripe & Netopia webhooks)
2. Hook automatic shipped email into AWB creation and courier sync
3. Check/fix Stripe payment-failed path
4. Make template keys code-owned
5. Remove unverifiable claims
6. Fix all failing tests
7. Run type checks
8. Generate PNG screenshots
9. Update PR description
10. Final commit and push
