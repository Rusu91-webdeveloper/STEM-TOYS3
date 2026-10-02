# Remaining Critical Fixes Required

## Status: Partially Complete (3/11 done)

### ✅ Fixed (3/11)
1. **COD detection** - Added `isCodPaymentMethod()` helper, checks for "cash_on_delivery", "cod", "ramburs"
2. **Code-owned keys** - Updated to match actual slugs: order-shipped-fancourier, order-shipped, password-change-confirmation
3. **Company details** - Fixed address to include "Bl D5, sc 2"

### ❌ Still Required (8/11)
4. **Stripe webhook regression** - Must replace `AdminNotificationService.sendNewOrderNotification` with `sendAdminNewOrderNotification` at stripe/webhook.ts ~268, checkout ~1818, netopia ~333. Add webhook tag guards. Don't re-throw on email failure.

5. **Atomic shipped dedupe** - Implemented conditional updateMany but needs Prisma mock test

6. **Card hold** - Logic updated to check COD_GUARANTEE_AUTHORIZED tag and parse notes, but needs verification

7. **Claims** - Must remove "Te vom suna" from card emails, remove hard-coded "2 zile", remove "(1%)" label, remove "Vei primi factura"

8. **Links** - Refund button to /account/orders, remove payment-failed retry button, fix status CANCELLED logic

9. **Contact** - Password email must use COMPANY_LEGAL.email not EMAIL_FROM

10. **Mobile layout** - Add @media (max-width:480px) responsive CSS

11. **Type check** - Fix config.adminEmail → alertEmail, run full project tsc

12. **Cleanup** - Remove docs/previews, regenerate 6 PNG artifacts (not committed)

## Critical Path
The Stripe webhook fix (#4) is BLOCKING - causes 500 errors in production. Must be fixed first before this PR can merge.
