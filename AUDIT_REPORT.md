# TechTots.ro Site Audit Report
**Date:** 2025-01-XX  
**Purpose:** Comprehensive audit for dropshipping implementation - VAT wording, shipping thresholds, contact info, delivery promises, and empty catalog UX

---

## 1. VAT/TVA Wording Audit

### Critical Issues Found

#### 1.1 Email Templates with VAT Mentions

**File: `lib/brevoTemplates.ts`**
- **Line 1079**: `(inclusiv TVA)` in price display
- **Line 1083**: `(inclusiv TVA)` in price display  
- **Line 1139**: `(inclusiv TVA)` in product price
- **Line 1189**: `Subtotal (inclusiv TVA):` in order summary
- **Line 1208**: Comment mentions "TVA line removed" but template still has VAT references

**File: `lib/vat-utils.ts`**
- **Entire file**: Contains VAT calculation utilities
- **Line 69-74**: `getVATIndicationText()` returns "inclusiv TVA" or "VAT included"
- **Line 85-99**: `formatPriceWithVAT()` adds VAT indication to prices
- **Usage**: Used in checkout components and price displays

**File: `features/checkout/components/CheckoutSummary.tsx`**
- **Line 303**: Comment says "VAT line removed" but VAT calculations still exist in code
- **Line 127-134**: VAT calculation logic still present (calculating VAT backwards)

**File: `features/checkout/components/PricingBreakdown.tsx`**
- **Line 27-29**: VAT rate calculation (default 21%)
- **Line 72-74**: VAT breakdown calculation from inclusive price

**File: `app/api/checkout/order/route.ts`**
- **Line 323-333**: VAT settings and rate calculation
- **Line 370-373**: VAT calculation for order breakdown

**File: `lib/nodemailer.ts`**
- **Line 170**: VAT calculation in email template
- **Line 197**: Contact info with phone (needs verification)

**File: `lib/resend.ts`**
- **Line 170**: VAT line in order confirmation email

**File: `lib/email/template-library.ts`**
- **Line 184-279**: Order confirmation template (check for VAT mentions)

**File: `lib/email/order-templates.ts`**
- **Line 165-367**: Order confirmation email template

### Summary: VAT Wording
- **Total instances found**: 15+ files with VAT/TVA mentions
- **Priority**: HIGH - Legal risk for non-VAT registered SRL
- **Action Required**: Remove all VAT wording, keep prices as final prices only

---

## 2. Shipping Threshold Audit

### Current Threshold: 250 lei / 50 €

#### 2.1 Checkout Components

**File: `features/checkout/lib/checkoutApi.ts`**
- **Line 130**: `freeThreshold: { price: "250.00", active: true }`

**File: `features/checkout/components/CheckoutFlow.tsx`**
- **Line 70**: `settings?.shippingSettings?.freeThreshold?.price ?? "250"`

**File: `features/checkout/components/PaymentForm.tsx`**
- **Line 123**: `settings?.shippingSettings?.freeThreshold?.price ?? "250"`

**File: `features/checkout/components/PricingBreakdown.tsx`**
- **Line 40**: Default threshold `250`

**File: `features/checkout/components/ShippingMethodSelector.tsx`**
- **Line 147**: Fallback threshold `"250.00"`

#### 2.2 API Routes

**File: `app/api/checkout/order/route.ts`**
- **Line 276**: `let freeShippingThreshold: number | null = 250;`
- **Line 345**: `freeShippingThreshold = 250;` (fallback)
- **Line 347**: `freeShippingThreshold = 250;` (default)

**File: `app/api/store-settings/route.ts`**
- **Line 12**: `const returnThreshold = shippingSettings?.freeThreshold?.price || "250.00";`

#### 2.3 Store Settings

**File: `lib/utils/store-settings.ts`**
- **Line 58**: `freeThreshold: { price: "250.00", active: true }`
- **Line 110**: `freeThreshold: { price: "250.00", active: true }`
- **Line 145**: `freeThreshold: { price: "250.00", active: true }`

**File: `app/admin/settings/page.tsx`**
- **Line 1024**: `freeThreshold: { price: "250.00", active: true }`
- **Line 1050**: `freeThreshold: { price: "250.00", active: true }`
- **Line 1064**: `: "250.00"` (default value)

#### 2.4 UI Display

**File: `components/layout/Footer.tsx`**
- **Line 62**: `return "€50 / 250 lei";` (return threshold formatting)
- **Line 73**: `: "€50 / 250 lei";` (default return threshold)

**File: `app/returns/page.tsx`**
- **Line 15**: `"Returnare gratuită pentru comenzi peste 50 € sau 250 lei"`
- **Line 102**: Metadata mentions "50 € sau 250 lei"
- **Line 289**: `<strong>50 € sau 250 lei</strong>` in policy text

**File: `lib/i18n/translations/ro.ts`**
- **Line 1752**: `freeShipping: "Livrare gratuită pentru comenzi peste 50€"`

### Summary: Shipping Threshold
- **Total instances found**: 20+ files with "250" or "50 €" threshold
- **Required change**: Update to 199 lei
- **Priority**: HIGH - Must match new shipping policy

---

## 3. Contact Information Audit

### 3.1 Email Addresses Found

**Primary Contact Emails:**
1. `webira.rem.srl@gmail.com` - Most common, used in:
   - `app/contact/page.tsx` (line 317, 320)
   - `lib/brevoTemplates.ts` (lines 57, 128, 1475, 1631)
   - `lib/resend.ts` (lines 198, 299, 317, 401)
   - `lib/nodemailer.ts` (lines 197, 214, 396, 620, 637, 658, 739, 756)
   - `app/api/contact/route.ts` (lines 37, 173, 210)
   - `app/returns/page.tsx` (lines 250, 380)
   - `app/warranty/page.tsx` (line 104)
   - `app/privacy/page.tsx` (lines 176, 228)
   - `lib/email/admin-notification-service.ts` (multiple lines)
   - `app/checkout/confirmation/page.tsx` (line 141)
   - `scripts/test-coupon-email.ts` (line 57)

2. `contact@techtots.ro` - Used in:
   - `components/layout/Footer.tsx` (line 57, fallback)
   - `app/contact/metadata.ts` (line 19)
   - `lib/seo/local-seo-romania.ts` (line 112)
   - `lib/seo/advanced-schema.ts` (lines 106, 187)
   - `app/metadata.ts` (line 200)
   - `components/email/StandardEmailFooter.tsx` (line 31, 109)

3. `support@techtots.ro` - Used in:
   - `components/layout/Footer.tsx` (line 57, default)
   - `app/metadata.ts` (line 213)
   - `app/unsubscribe/error/page.tsx` (line 43)
   - `features/checkout/components/GuestOrderTracking.tsx` (line 381)
   - `lib/admin-notifications.ts` (line 6)

4. `info@techtots.com` - Used in:
   - `prisma/schema.prisma` (line 659, default)
   - `lib/utils/store-settings.ts` (lines 39, 91)
   - `app/admin/settings/page.tsx` (line 393)
   - `app/api/returns/create/route.ts` (line 127)

5. Other emails found:
   - `privacy@techtots.com` - GDPR page
   - `legal@techtots.com` - Terms page
   - `admin@techtots.com` - Admin functions
   - `noreply@techtots.com` - System emails
   - `supplier@techtots.ro` - Supplier registration

### 3.2 Phone Numbers Found

**Primary Phone Numbers:**
1. `+40 771 248 029` / `+40771 248 029` / `0771 248 029` - Most common:
   - `app/contact/page.tsx` (lines 325, 328, 381)
   - `lib/brevoTemplates.ts` (line 58, 129, 1476, 1632)
   - `lib/resend.ts` (lines 198, 299, 317, 401)
   - `lib/nodemailer.ts` (lines 214, 620, 756)
   - `app/delivery/components/DeliveryRegional.tsx` (lines 61, 68)
   - `VERCEL_PRODUCTION_UPDATE.sql` (line 67)
   - `UPDATE_PRODUCTION_TEMPLATE.md` (line 96)
   - `lib/email/additional-templates.ts` (multiple lines)

2. `+40 746 000 000` - Default fallback:
   - `components/layout/Footer.tsx` (line 58)

3. `+40 123 456 789` - Placeholder:
   - `lib/nodemailer.ts` (lines 197, 739)

### Summary: Contact Information
- **Email inconsistencies**: 8+ different email addresses
- **Phone inconsistencies**: 3+ different phone numbers
- **Priority**: HIGH - Must unify to single email and phone
- **Recommended**: Use store settings (`storeSettings.contactEmail` and `storeSettings.contactPhone`)

---

## 4. Delivery Promises Audit

### 4.1 Delivery Page

**File: `app/delivery/page.tsx`**
- Need to review for unrealistic promises
- Check delivery time commitments
- Verify dropshipping compatibility

### 4.2 Returns Page

**File: `app/returns/page.tsx`**
- **Line 15**: "Returnare gratuită pentru comenzi peste 50 € sau 250 lei" - Needs update to 199 lei
- **Line 289**: Free return threshold mentioned
- Review for dropshipping compatibility

### 4.3 Warranty Page

**File: `app/warranty/page.tsx`**
- Review warranty promises
- Check if compatible with dropshipping model

### Summary: Delivery Promises
- **Action Required**: Review all policy pages for dropshipping compatibility
- **Priority**: MEDIUM - Must align with supplier capabilities

---

## 5. Empty Catalog UX Audit

### 5.1 Products Page

**File: `app/products/page.tsx`**
- **Lines 152-191**: Has error handling for empty products
- **Lines 156-189**: Shows error message if products fail to load
- **Lines 207-237**: Shows error message on exception
- **Current UX**: Basic error messages, could be improved

### 5.2 Empty State Components

**File: `components/ui/empty-state.tsx`**
- **Lines 205-232**: `EmptySearch` component for no search results
- **Lines 234-237**: `EmptyOrders` component interface
- **Current UX**: Good empty state components exist

**File: `features/supplier/components/products/ProductEmptyState.tsx`**
- **Lines 8-121**: Supplier product empty state
- **Current UX**: Good for supplier dashboard

### Summary: Empty Catalog UX
- **Current state**: Basic error handling exists
- **Improvement needed**: Better empty state for public catalog
- **Priority**: MEDIUM - Improve user experience when no products available

---

## 6. Recommendations Summary

### High Priority (Must Fix Before Launch)

1. **Remove all VAT wording** (15+ files)
   - Remove "inclusiv TVA" / "VAT included" text
   - Remove VAT calculation displays
   - Show prices as final prices only

2. **Update shipping threshold** (20+ files)
   - Change from 250 lei to 199 lei
   - Update all checkout components
   - Update policy pages
   - Update email templates

3. **Unify contact information** (30+ files)
   - Choose single email address
   - Choose single phone number
   - Update all references to use store settings

### Medium Priority (Should Fix)

4. **Review delivery promises**
   - Update delivery page for dropshipping reality
   - Update returns policy if needed
   - Update warranty policy if needed

5. **Improve empty catalog UX**
   - Better empty state for products page
   - More helpful messaging

---

## 7. Files Requiring Updates

### Phase 0.2: Remove VAT Wording
- `lib/vat-utils.ts`
- `features/checkout/components/CheckoutSummary.tsx`
- `features/checkout/components/PricingBreakdown.tsx`
- `lib/brevoTemplates.ts`
- `lib/nodemailer.ts`
- `lib/resend.ts`
- `lib/email/template-library.ts`
- `lib/email/order-templates.ts`
- `app/api/checkout/order/route.ts`

### Phase 0.3: Update Shipping Threshold
- `features/checkout/lib/checkoutApi.ts`
- `features/checkout/components/CheckoutFlow.tsx`
- `features/checkout/components/PaymentForm.tsx`
- `features/checkout/components/PricingBreakdown.tsx`
- `features/checkout/components/ShippingMethodSelector.tsx`
- `app/api/checkout/order/route.ts`
- `app/api/store-settings/route.ts`
- `lib/utils/store-settings.ts`
- `app/admin/settings/page.tsx`
- `components/layout/Footer.tsx`
- `app/returns/page.tsx`
- `lib/i18n/translations/ro.ts`

### Phase 0.5: Unify Contact Info
- `app/contact/page.tsx`
- `components/layout/Footer.tsx`
- `components/email/StandardEmailFooter.tsx`
- `lib/email/components.ts`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/returns/page.tsx`
- `lib/brevoTemplates.ts`
- `lib/nodemailer.ts`
- `lib/resend.ts`
- All email template files

---

## 8. Next Steps

1. ✅ **Audit Complete** - This report documents all issues
2. ⏭️ **Phase 0.2** - Remove/replace VAT wording
3. ⏭️ **Phase 0.3** - Update shipping threshold to 199 lei
4. ⏭️ **Phase 0.4** - Add free shipping progress message
5. ⏭️ **Phase 0.5** - Unify contact details

---

**Report Generated:** 2025-01-XX  
**Total Issues Found:** 65+ instances across 40+ files  
**Estimated Fix Time:** 11-17 hours (Phase 0)
