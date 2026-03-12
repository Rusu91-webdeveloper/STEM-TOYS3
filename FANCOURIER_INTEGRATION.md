# FanCourier Integration Guide

This document explains how FanCourier is integrated in this project, how the
flow works end-to-end, and what you must configure.

## 1) Overview

The system integrates FanCourier SelfAWB to:

- Create AWB labels for orders.
- Optionally schedule courier pickup requests.
- Email the AWB label PDF to the supplier.

It uses FanCourier **SelfAWB login** (username/password) to obtain a token. No
separate API key is required.

## 2) Required environment configuration

Set these in `.env.local`:

```
FANCOURIER_BASE_URL=https://api.fancourier.ro
FANCOURIER_CLIENT_ID=<numeric>
FANCOURIER_USERNAME=<SelfAWB username>
FANCOURIER_PASSWORD=<SelfAWB password>
```

Recommended sender defaults (used for display + fallback only; pickup address
comes from SelfAWB account):

```
FANCOURIER_SENDER_NAME=...
FANCOURIER_SENDER_PHONE=...
FANCOURIER_SENDER_EMAIL=...
FANCOURIER_SENDER_COUNTY=...
FANCOURIER_SENDER_LOCALITY=...
FANCOURIER_SENDER_STREET=...
FANCOURIER_SENDER_NUMBER=...
FANCOURIER_SENDER_POSTAL_CODE=...
FANCOURIER_SENDER_CONTACT_PERSON=...   # optional
```

Optional (dropshipping): use supplier address as pickup for AWB:

```
FANCOURIER_USE_SUPPLIER_ADDRESS=true   # default: false
```

When `true`, the system uses the supplier's business address (Admin → Suppliers
→ Pickup Address) as the AWB sender, but **only** when the supplier has all of:
`businessAddress`, `businessCity`, `businessState`, `phone`. If any field is
missing or the env var is not set, it falls back to the `FANCOURIER_SENDER_*`
env vars. **Verify with FanCourier that the sender in the AWB payload is used
for pickup before enabling.**

Optional (testing): disable supplier AWB emails while keeping AWB generation
active:

```
DISABLE_SUPPLIER_AWB_EMAIL=true   # default: false
```

Optional (COD): for some FAN accounts, COD AWBs require `info.returnPayment`.

```
FANCOURIER_RETURN_PAYMENT=sender   # default: sender
```

Optional (AWB billing override): if FAN support tells you that the AWB
`info.payment` field must contain your billing company label instead of the
generic `sender` / `recipient` value, set:

```
FANCOURIER_AWB_PAYMENT_LABEL=WEBIRA REM SRL Cluj-Napoca
```

Optional (locker COD): enable COD for FANbox checkout/orders.

```
FANCOURIER_ALLOW_COD_FANBOX=true
NEXT_PUBLIC_FANCOURIER_ALLOW_COD_FANBOX=true
```

Supplier fallback email (used if the supplier profile lacks an email):

```
SUPPLIER_EMAIL=contact@supplier.ro
```

## 3) Where the integration lives (code map)

- FanCourier client: `lib/integrations/fancourier/client.ts`
  - Auth token: `POST /login`
  - Create AWB: `POST /intern-awb`
  - Print label: `GET /awb/label`
  - Create pickup order: `POST /order`
- AWB orchestration: `lib/shipping/fancourier-awb.ts`
- Admin AWB button: `app/admin/orders/[id]/page.tsx`
- Auto AWB triggers:
  - Stripe webhook: `app/api/stripe/webhook/route.ts`
  - Netopia webhook: `app/api/payments/netopia/webhook/route.ts`
  - COD order creation: `app/api/checkout/order/route.ts`
- Shipping method labels: `app/api/checkout/shipping-quote/route.ts` and
  `features/checkout/components/ShippingMethodSelector.tsx`
- Shipping settings (FanCourier pickup toggle): `app/admin/settings/page.tsx`

## 4) Order flow (end-to-end)

### 4.1 Checkout

User enters:

- Shipping address (name, phone, street, city, county/state, postal code)
- Shipping method (FanCourier Standard / FanCourier FANbox)
- Payment method (card or COD)

### 4.2 Order creation

The order is saved with items, shipping address, and payment method.

### 4.3 AWB creation timing

AWB creation happens automatically:

- **COD orders**: right after order creation.
- **Online paid orders**: after payment is confirmed (Stripe/Netopia webhook).

You can also manually create the AWB from **Admin → Orders → (Order)** using the
“Create AWB” button.

### 4.4 AWB payload sent to FanCourier

The payload includes:

- `clientId` from env
- Packages, weight, dimensions
- COD amount (if COD)
- Return payment party for COD (`info.returnPayment`) when required by account
  rules
- AWB payment billing label from `FANCOURIER_AWB_PAYMENT_LABEL` when required by
  your FAN account; otherwise the integration defaults to `sender`
- Declared value (insurance) when applicable
- Recipient address from checkout
- Service:
  - `Standard` for non-locker deliveries
  - `FANbox` for locker deliveries with prepaid card payment
  - `FANbox Cont Colector` for locker deliveries with COD (ramburs)
- AWB options codes (`info.options`) resolved from env:
  - `FANCOURIER_AWB_OPTIONS` (global)
  - `FANCOURIER_AWB_OPTIONS_STANDARD` (Standard only)
  - `FANCOURIER_AWB_OPTIONS_FANBOX` (FANbox only)
  - For FANbox shipments, option `V` is auto-added.
  - For card-at-locker (mPOS), FAN docs reference option `Y` (enable in
    `FANCOURIER_AWB_OPTIONS_FANBOX` only after FAN activates this capability on
    your account).

### 4.5 FanCourier pickup address

**FanCourier picks up from the address configured in your SelfAWB account.**

For dropshipping (supplier packs, courier picks from supplier):

- The **SelfAWB pickup address must be the supplier’s warehouse**.
- The courier does not choose items; the supplier must pack the order.

### 4.6 AWB label email to supplier

After AWB creation:

- The system downloads the AWB PDF and emails it to the supplier.
- Email goes to supplier’s contact email (from supplier profile).
- If missing, it falls back to `SUPPLIER_EMAIL`.
- If `DISABLE_SUPPLIER_AWB_EMAIL=true`, email sending is skipped (AWB creation
  still works).

### 4.7 Optional pickup scheduling

If enabled in **Admin → Settings → Shipping → FanCourier Pickup**, the system:

- Calls `POST /order` to schedule a pickup
- Uses the configured pickup window + optional notes
- Uses the order’s weight/dimensions

If disabled, pickup is manual (supplier calls FanCourier or uses their
dashboard).

## 5) Multi-supplier behavior

If an order contains items from **multiple suppliers**:

- The system **flags the order for manual shipping review**.
- Auto label email and pickup scheduling are skipped to avoid wrong pickup.

If a product has **no supplier assigned**:

- The order is also flagged for manual review.

## 6) FANbox (locker) behavior

The system selects `FANbox` only if a pickup location exists:

- `lockerId` or `lockerAddressSnapshot` is present
- Otherwise it falls back to `Standard`

If you want FANbox to work:

- Ensure the checkout collects a locker selection and stores it.

## 7) Admin settings (pickup scheduling)

Location: **Admin → Settings → Shipping → FanCourier Pickup**

Fields:

- Enable/disable auto pickup
- Pickup window start/end (HH:MM)
- Offset days (0 = same day)
- Optional pickup notes

## 8) Common issues

1. **Base URL mismatch**
   - Must be `https://api.fancourier.ro` (no `/v2`).
2. **Invalid client ID**
   - Must be numeric.
3. **No supplier email**
   - Configure supplier contact email, or set `SUPPLIER_EMAIL` fallback.
4. **Pickup address wrong**
   - Must be configured in SelfAWB, not in this code.

## 9) What FanCourier knows (and what it doesn’t)

FanCourier receives:

- Pickup address (from your SelfAWB account)
- Recipient address
- Package weight/dimensions
- COD amount (if COD)

FanCourier does **not** receive product details. The supplier must pack and
label the order before pickup.

## 10) Testing checklist

- Confirm `.env.local` settings are correct.
- Place a test order with a physical item.
- Ensure AWB is created (admin order page shows it).
- Confirm supplier receives label email.
- If pickup auto scheduling is enabled, confirm a pickup is created.

---

If you want multi-supplier split shipments or per-supplier pickup addresses, we
can extend the workflow accordingly.
