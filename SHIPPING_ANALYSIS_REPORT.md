# Shipping & Delivery Analysis Report

## Next.js E-commerce Project - Romania (EU Law) & FAN Courier Integration

**Date:** January 24, 2026  
**Analyst:** Senior E-commerce Architect  
**Scope:** Shipping prices, delivery logic, checkout flow, legal compliance, FAN
Courier risks

---

## 1. SHIPPING PRICES IMPLEMENTATION

### Current State

**Shipping prices are stored in multiple locations with fallback hierarchy:**

1. **Primary Source: Admin Settings (Database)**
   - **Location:** `StoreSettings.shippingSettings.deliveryPrice`
   - **File:** `app/admin/settings/page.tsx` (lines 760-779)
   - **Structure:**
     ```typescript
     shippingSettings: {
       deliveryPrice: {
         price: string;
         active: boolean;
       }
       freeThreshold: {
         active: boolean;
         price: string;
       }
     }
     ```
   - **Access:** Via `useCheckoutSettings()` hook → `/api/checkout/settings`

2. **Fallback Values:**
   - **File:** `features/checkout/components/PricingBreakdown.tsx` (line 49-51)
   - **File:** `features/checkout/components/CheckoutFlow.tsx` (line 63-65)
   - **File:** `features/checkout/components/PaymentForm.tsx` (line 154-156)
   - **Default:** `15.00 RON` (hardcoded fallback)

3. **Environment Variables (NOT USED for base prices):**
   - **File:** `lib/shipping/shipping-pricing.ts`
   - Only used for **Sameday** courier pricing (Easybox/Home delivery):
     - `SHIPPING_EASYBOX_BASE_PRICE` (default: 19 RON)
     - `SHIPPING_HOME_BASE_PRICE` (default: 25 RON)
     - `SHIPPING_ADDITIONAL_KG_PRICE` (default: 2.5 RON)

### Findings

✅ **19.99 RON & 24.99 RON are NOT explicitly configured**

- The system uses a single `deliveryPrice` from admin settings
- No differentiation between "online payment" (19.99) and "ramburs" (24.99)
  shipping costs
- **RISK:** Current implementation doesn't support different shipping prices by
  payment method

### Files Involved

- `features/checkout/hooks/useCheckoutSettings.ts` - Settings fetching
- `features/checkout/components/PricingBreakdown.tsx` - Price calculation
- `app/admin/settings/page.tsx` - Admin configuration UI
- `lib/utils/store-settings.ts` - Settings persistence
- `app/api/checkout/settings/route.ts` - Settings API endpoint

---

## 2. DELIVERY LOGIC ANALYSIS

### Bundle Products vs Regular Products

**Current State:**

- **Database Schema:** `Product.isBundle` flag exists (schema.prisma line 430)
- **Bundle Structure:** `bundleItems` (JSON array of product IDs),
  `bundleDiscount` (percentage)
- **Shipping Logic:** **NO DIFFERENTIATION** - bundles treated same as regular
  products

**Files:**

- `prisma/schema.prisma` (lines 390-464) - Product model
- `scripts/create-bundles.ts` - Bundle creation script
- `docs/BUNDLE_CREATION_GUIDE.md` - Bundle documentation

**Missing:**

- ❌ No special shipping pricing for bundles (~800 RON value)
- ❌ No weight aggregation logic for bundle items
- ❌ No declared value calculation for high-value bundles

### Weight Handling

**Current Implementation:**

- **Dynamic Weight Calculation:** ✅ Implemented
- **File:** `lib/shipping/shipping-pricing.ts` (lines 146-179)
- **Logic:**
  - Uses `Product.weight` from database
  - Calculates volumetric weight: `volume_cm3 / 6000`
  - Chargeable weight = `max(physical_weight, volumetric_weight)`
  - Falls back to 1kg if weight missing

**Files:**

- `lib/shipping/shipping-pricing.ts` - Weight calculation
- `app/api/checkout/order/route.ts` (lines 340-363) - Order creation weight
  handling
- `app/api/checkout/shipping-quote/route.ts` - Quote generation

**Issues:**

- ⚠️ No validation that bundle items have weights
- ⚠️ No special handling for bundles (should sum bundle item weights)

### Declared Value / Insurance

**Current State:**

- ❌ **NOT IMPLEMENTED**
- No declared value field in Order model
- No insurance calculation logic
- No insurance cost in shipping quotes

**Database Schema:**

- `Order` model has no `declaredValue` or `insuranceAmount` fields
- `Shipment` model has no insurance-related fields

**Risk:**

- 🔴 **HIGH RISK** - FAN Courier requires declared value for packages > 500 RON
- No protection for high-value bundles (~800 RON)

---

## 3. CHECKOUT, ORDER CREATION & CONFIRMATION FLOW

### Payment Method Handling

**Current Implementation:**

- ✅ **Online Payment:** Stripe & Netopia (MobilPay) integration
- ✅ **Ramburs (COD):** Implemented with fee calculation
- **File:** `lib/pricing/cod-fee-calculator.ts`
- **COD Fee:** Dynamic from admin settings (percentage + fixed fee)
- **COD Limits:** B2C: 10,000 RON, B2B: 5,000 RON (configurable via env)

**Files:**

- `features/checkout/components/PaymentMethodSelector.tsx`
- `app/api/checkout/order/route.ts` (lines 217-226, 514-525)
- `lib/shipping/cod-thresholds.ts`

**Issues:**

- ⚠️ Shipping price doesn't change based on payment method (should be 19.99 vs
  24.99)
- ⚠️ COD fee calculated but shipping cost remains same

### Customer Notifications

**Email Notifications:**

- ✅ **Order Confirmation:** Sent after payment success
- ✅ **Shipping Notification:** Sent when order status → SHIPPED
- ✅ **Delivery Confirmation:** Sent when order status → DELIVERED
- **Files:**
  - `lib/email/unified-service.ts`
  - `lib/utils/order-status-management.ts` (lines 144-239)
  - `app/api/stripe/webhook/route.ts` (lines 245-275)
  - `app/api/payments/netopia/webhook/route.ts` (lines 193-244)

**SMS Notifications:**

- ❌ **NOT IMPLEMENTED**
- No SMS provider integration found
- No SMS templates or sending logic

**Notification Triggers:**

- Payment webhook → Order confirmation email
- Order status change → Status-specific email
- AWB creation → Shipping email (if AWB created)

### AWB Creation Flow

**Current Implementation:**

- ✅ **Sameday Integration:** Fully implemented
- **File:** `lib/shipping/sameday-awb.ts`
- **Auto-Creation:** After successful payment (webhook handlers)
- **Manual Creation:** Via admin panel (implied, not verified)

**FAN Courier Integration:**

- ❌ **NOT IMPLEMENTED**
- Only references in:
  - `app/admin/orders/[id]/page.tsx` (line 248) - Hardcoded "Fan Courier" string
  - `features/supplier/components/orders/ShippingLabelGenerator.tsx` (line 49) -
    Carrier option
  - `docs/SOP_DAILY_OPERATIONS.md` (line 70) - Manual process mentioned
- **No API integration, no AWB creation logic**

**Files:**

- `lib/shipping/sameday-awb.ts` - Sameday AWB creation
- `lib/integrations/sameday/client.ts` - Sameday API client
- `app/api/stripe/webhook/route.ts` (lines 223-242) - Auto AWB after payment
- `app/api/payments/netopia/webhook/route.ts` (lines 170-190) - Auto AWB after
  payment

**Missing:**

- FAN Courier API client
- FAN Courier AWB creation function
- FAN Courier webhook handlers
- FAN Courier tracking integration

---

## 4. LEGAL & UX ALIGNMENT

### Shipping Policy

**Current State:**

- ❌ **NO DEDICATED SHIPPING POLICY PAGE FOUND**
- Only general delivery info in Terms & Conditions

**Files:**

- `app/terms/page.tsx` (lines 149-155) - Basic delivery section
- No `/shipping` or `/delivery-policy` page

**Content:**

- Terms page mentions: "Termenele de livrare sunt estimative"
- No detailed shipping costs, methods, or delivery times

### Return / Withdrawal Policy

**Current State:**

- ✅ **FULLY IMPLEMENTED**
- **File:** `app/returns/page.tsx`
- **Compliance:** EU Directive 2011/83/EU, 14-day withdrawal right
- **Content:**
  - 14-day withdrawal period
  - Free returns for orders ≥ 199 RON
  - Return process steps
  - Exceptions listed
  - Sustainability commitments

**Files:**

- `app/returns/page.tsx` - Full return policy page
- `app/returns/metadata.ts` - SEO metadata

### Terms & Conditions Consistency

**Current State:**

- ✅ **Terms page exists:** `app/terms/page.tsx`
- ⚠️ **Inconsistency:** Shipping costs not detailed in Terms
- ⚠️ **Inconsistency:** Terms mention "delivery terms are estimates" but no
  actual shipping policy

**Files:**

- `app/terms/page.tsx` - Terms & Conditions
- `app/privacy/page.tsx` - Privacy Policy (exists)
- `app/gdpr/page.tsx` - GDPR Compliance (exists)

**Issues:**

- Shipping costs (19.99/24.99) not mentioned in legal pages
- No shipping policy page to match return policy detail level
- Terms don't specify payment method impact on shipping cost

---

## 5. FAN COURIER SPECIFIC RISKS & MISSING PIECES

### KM Extra Handling

**Risk Level:** 🔴 **HIGH**

- ❌ **NOT IMPLEMENTED**
- No distance calculation logic
- No extra km fee calculation
- FAN Courier charges extra for remote locations
- **Impact:** Undercharging customers, profit loss

### Ramburs Risks

**Risk Level:** 🟡 **MEDIUM**

- ✅ COD limits implemented (10k B2C, 5k B2B)
- ⚠️ No validation for FAN Courier-specific COD limits
- ⚠️ No handling for COD rejection scenarios
- ⚠️ No automatic retry logic for failed COD collections
- **Missing:**
  - FAN Courier COD fee structure
  - COD collection failure handling
  - Customer notification for COD issues

### Failed Delivery / Returns

**Risk Level:** 🔴 **HIGH**

- ❌ **NO FAN COURIER INTEGRATION**
- No webhook handlers for delivery status updates
- No automatic return processing
- No failed delivery notification system
- **Impact:**
  - Manual tracking required
  - Delayed customer communication
  - No automatic return label generation

**Current (Sameday only):**

- `lib/shipping/sameday-awb.ts` - AWB creation
- No equivalent for FAN Courier

### Invoice & Compliance Issues

**Risk Level:** 🟡 **MEDIUM**

- ✅ Invoice generation exists (Netopia integration)
- ⚠️ No FAN Courier-specific invoice requirements handling
- ⚠️ No AWB number on invoices (if required by FAN)
- ⚠️ No declared value on invoices

**Files:**

- `app/api/payments/netopia/webhook/route.ts` - Invoice handling
- `lib/payments/NetopiaProvider.ts` - Payment provider

**Missing:**

- FAN Courier AWB number on invoices
- Declared value field on invoices
- FAN Courier compliance documentation

### Additional FAN Courier Risks

1. **API Integration Missing:**
   - No FAN Courier API client
   - No authentication/credentials management
   - No rate calculation integration

2. **Tracking Integration Missing:**
   - No FAN Courier tracking API calls
   - No automatic status updates
   - Manual tracking only

3. **Service Selection Missing:**
   - No FAN Courier service type selection (Standard, Express, etc.)
   - No price comparison between services

4. **Address Validation Missing:**
   - No FAN Courier address validation
   - No delivery area verification
   - Risk of invalid addresses

---

## SUMMARY OF FINDINGS

### ✅ What Works

1. **Shipping price storage:** Admin settings with database persistence
2. **Weight calculation:** Dynamic volumetric/physical weight logic
3. **COD handling:** Fee calculation and limits
4. **Email notifications:** Order confirmation, shipping, delivery
5. **Return policy:** Comprehensive, EU-compliant
6. **Sameday integration:** Full AWB creation and tracking

### ❌ Critical Missing Pieces

1. **FAN Courier Integration:** Complete absence
2. **Payment method shipping differentiation:** No 19.99 vs 24.99 logic
3. **Bundle shipping logic:** No special handling for high-value bundles
4. **Declared value/insurance:** Not implemented
5. **Shipping policy page:** Missing dedicated page
6. **SMS notifications:** Not implemented
7. **KM extra fees:** No distance-based pricing
8. **FAN Courier webhooks:** No delivery status updates

### ⚠️ Risks Identified

1. **Financial:** Undercharging for shipping (no km extras, no declared value
   fees)
2. **Compliance:** Missing shipping policy, incomplete legal documentation
3. **Operational:** Manual FAN Courier processes, no automation
4. **Customer Experience:** No SMS updates, delayed notifications
5. **Legal:** Terms don't match actual shipping behavior

---

## RECOMMENDED FILE PATHS FOR IMPLEMENTATION

### High Priority

1. **FAN Courier Integration:**
   - `lib/integrations/fancourier/client.ts` (NEW)
   - `lib/shipping/fancourier-awb.ts` (NEW)
   - `app/api/shipping/fancourier/create-awb/route.ts` (NEW)

2. **Shipping Price Differentiation:**
   - `features/checkout/components/PricingBreakdown.tsx` (MODIFY)
   - `app/api/checkout/order/route.ts` (MODIFY)
   - `lib/utils/shipping-pricing.ts` (NEW/MODIFY)

3. **Bundle Shipping Logic:**
   - `lib/shipping/bundle-shipping.ts` (NEW)
   - `app/api/checkout/shipping-quote/route.ts` (MODIFY)

4. **Declared Value:**
   - `prisma/schema.prisma` (ADD fields to Order/Shipment)
   - `lib/shipping/declared-value.ts` (NEW)

5. **Shipping Policy Page:**
   - `app/shipping/page.tsx` (NEW)
   - `app/shipping/metadata.ts` (NEW)

### Medium Priority

6. **SMS Notifications:**
   - `lib/sms/` (NEW directory)
   - `lib/sms/provider.ts` (NEW)

7. **KM Extra Calculation:**
   - `lib/shipping/distance-calculator.ts` (NEW)
   - Integration with FAN Courier API

8. **Legal Pages Update:**
   - `app/terms/page.tsx` (MODIFY - add shipping details)

---

## NEXT STEPS RECOMMENDATION

1. **Immediate:** Implement payment method shipping differentiation (19.99 vs
   24.99)
2. **High Priority:** Build FAN Courier API integration
3. **High Priority:** Add declared value/insurance logic
4. **Medium Priority:** Create shipping policy page
5. **Medium Priority:** Implement bundle shipping logic
6. **Low Priority:** Add SMS notifications

---

**Report Generated:** January 24, 2026  
**Analysis Complete:** ✅ Ready for implementation planning
