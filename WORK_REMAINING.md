# Remaining Work for PR #54 - Transactional Email Fixes

## Progress Summary

### ✅ Completed Items:

1. **Legal Details from Shared Constants**
   - Created `lib/config/company-legal.ts` with COMPANY_LEGAL and CONSUMER_RIGHTS
   - Updated `shared-layout.ts` to import and use these constants
   - Values match Footer.tsx: CUI 51813997, Reg. Com. J20/352/2025

2. **Send Path Improvements (Partial)**
   - ✅ Stripe webhook order confirmation - now uses `sendOrderConfirmationImproved`
   - ✅ Netopia webhook order confirmation (1 of 2 places) - improved version
   - ✅ FanCourier AWB creation - automatic shipped email when AWB created
   - ✅ Stripe refund - updated parameters (removed unverifiable estimatedDays)

### 🟡 In Progress / Needs Completion:

#### 1. Complete All Send Paths

**Order Confirmation:**
- ✅ COD checkout
- ✅ Stripe webhook paid (DONE)

- ⚠️ Netopia webhook paid - Line 510 (NEEDS FIX - couldn't find exact match)
- ⚠️ Need to verify all paths actually working with real order IDs

**Payment Failed:**
- ✅ Stripe webhook (already uses `generatePaymentFailedEmail`)

**Refund:**
- ✅ Stripe webhook (uses `generateRefundEmail` but needs interface fix)
- ⚠️ Netopia refund complete route - needs verification

**Shipped Email:**
- ✅ Manual admin shipped (uses improved)
- ✅ Automatic AWB created (DONE - added to fancourier-awb.ts)
- ⚠️ Courier sync shipped - `lib/order-fulfillment-sync.ts` (STILL NEEDS HOOK)

#### 2. Fix RefundData Interface Mismatch

The Stripe webhook now calls:
```typescript
generateRefundEmail({
  customerName: user.name || "Client",
  orderNumber: order.orderNumber,
  refundedAmount: refundAmount,
  originalTotal: order.total,
  refundedAt: new Date(),
})
```

But current interface expects:
```typescript
interface RefundData {
  customerName: string;
  customerEmail: string;  // Not passed now
  orderNumber: string;
  refundAmount: number;  // Should be refundedAmount
  originalPaymentMethod: string;  // Not passed now  
  estimatedDays?: number;  // REMOVED (unverifiable)
}
```

**Action:** Update interface and refund email template to match new signature, remove "5-10 days" claims.

#### 3. Make Template Keys Code-Owned

Modify email template loader to skip DB for these keys:
- `order-confirmation`
- `payment-failed`
- `refund`
- `password-changed`

File: `lib/email/database-first-email.ts` or similar template routing logic

#### 4. Fix All Failing Tests

Current: 26/37 passing
Target: 37/37 passing

Run: `pnpm test __tests__/lib/email/email-templates-improved.test.ts`

Common issues:
- Assertions checking for text not in actual output
- NaN/undefined when optional fields omitted
- Need to match actual generated HTML

#### 5. Type Check All Modified Files

Run: `npx tsc --noEmit` on touched files or full project

#### 6. Generate PNG Screenshots

For 5 scenarios at desktop (600px) and mobile (390px):
1. COD guest order confirmation
2. Paid card order confirmation  
3. Shipped with AWB
4. Payment failed
5. Refund processed

Script: `scripts/generate-email-previews.ts`
Output: `email-previews/*.png`

#### 7. Update PR Description

After all above complete, update PR #54 body with:
- ✅ Test count (37/37 passing)
- ✅ Full path coverage table
- ✅ PNG preview links
- ✅ Remove DB deletion instructions
- ✅ Add note about code-owned template keys

---

## Critical Blockers (Must Fix Before Review)

1. **Netopia webhook line 510** - Find and fix second order confirmation send path
2. **RefundData interface** - Update to match new signature without unverifiable claims
3. **Courier sync hook** - Add shipped email trigger to `lib/order-fulfillment-sync.ts`
4. **Template code-ownership** - Make touched keys bypass DB lookup
5. **All tests passing** - Fix 11 failing tests

## Nice to Have (Not Blockers)

1. Type checks clean across all files
2. PNG screenshots generated
3. PR description fully updated

---

## Next Immediate Actions (Priority Order)

1. Fix RefundData interface and refund email template
2. Find/fix second Netopia webhook send path (line ~510)
3. Add shipped email hook to courier sync
4. Make template keys code-owned
5. Fix failing tests (may need debugging session)
6. Generate screenshots
7. Update PR description
8. Final push to GitHub (resolve auth issue)
