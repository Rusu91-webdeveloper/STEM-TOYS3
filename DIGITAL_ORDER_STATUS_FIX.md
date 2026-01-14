# Digital Order Status and Email Fix

## Issue Summary

Digital book orders were getting status "COMPLETED" instead of "DELIVERED", and confirmation emails were not being sent for digital orders processed via Netopia payment gateway.

## How Order Status Works

### For Digital Books:
- **Status Flow**: `PROCESSING` → `DELIVERED` (when payment confirmed)
- **Status should be "DELIVERED"** (not "COMPLETED")
- **Emails sent**:
  1. **Digital Book Delivery Email** - Sent by `processDigitalBookOrder()` with download links
  2. **Order Confirmation Email** - Sent after payment is confirmed

### For Physical Products:
- **Status Flow**: `PROCESSING` → `SHIPPED` → `DELIVERED`
- **Status remains "PROCESSING"** when payment is confirmed
- **Email sent**: Order Confirmation Email after payment

### Status "COMPLETED":
- This is a legacy/final status
- **NOT used for digital books** - Digital books should use "DELIVERED"
- May be used for final order closure (e.g., 30 days after delivery)

## Fixes Applied

### 1. Checkout Route (`app/api/checkout/order/route.ts`)
**Issue**: Digital-only orders were being set to status "COMPLETED"  
**Fix**: Changed to set status "DELIVERED" with `deliveredAt` timestamp for digital-only orders

```typescript
// Before:
...(allItemsAreDigital ? { status: "COMPLETED" } : {}),

// After:
...(allItemsAreDigital
  ? { status: "DELIVERED", deliveredAt: new Date() }
  : {}),
```

### 2. Netopia Webhook (`app/api/payments/netopia/webhook/route.ts`)
**Issue**: All paid orders were set to status "COMPLETED"  
**Fix**: 
- Check if order contains only digital items BEFORE setting status
- Set status to "DELIVERED" for digital-only orders, "PROCESSING" for physical orders
- Send confirmation email for digital orders (in addition to delivery email)

**Changes**:
1. Added order query before status determination to check if all items are digital
2. Set status to "DELIVERED" for digital orders, "PROCESSING" for physical orders
3. Set `deliveredAt` timestamp for digital orders instead of `completedAt`
4. Added confirmation email sending for digital orders

### 3. Stripe Webhook (`app/api/stripe/webhook/route.ts`)
**Already correct**: Already sets status to "DELIVERED" for digital-only orders and sends both emails

## Email Flow

### For Digital Book Orders:
1. **Payment Confirmed** → Webhook processes order
2. **Digital Book Processing** → `processDigitalBookOrder()` creates download links and sends **Digital Book Delivery Email**
3. **Confirmation Email** → Order confirmation email sent (with order details)

### For Physical Product Orders:
1. **Payment Confirmed** → Webhook processes order
2. **Confirmation Email** → Order confirmation email sent
3. **Status Updates** → Status changes to SHIPPED, then DELIVERED as order progresses

## Testing Checklist

For a digital book order:
- [ ] Status is set to "DELIVERED" (not "COMPLETED")
- [ ] `deliveredAt` timestamp is set
- [ ] Digital Book Delivery Email is sent with download links
- [ ] Order Confirmation Email is sent
- [ ] Customer can access download links in their account

For a physical product order:
- [ ] Status is set to "PROCESSING" (not "COMPLETED")
- [ ] Order Confirmation Email is sent
- [ ] Status can progress to SHIPPED, then DELIVERED

## Related Files

- `app/api/checkout/order/route.ts` - Order creation
- `app/api/payments/netopia/webhook/route.ts` - Netopia payment webhook
- `app/api/stripe/webhook/route.ts` - Stripe payment webhook
- `lib/services/digital-order-service.ts` - Digital book processing
- `lib/email/database-template-service.ts` - Email sending
