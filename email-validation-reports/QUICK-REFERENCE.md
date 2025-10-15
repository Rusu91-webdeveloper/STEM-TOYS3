# Email Template Quick Reference Card

Quick lookup for developers working with email templates.

---

## ✅ Standard Variables (Available Everywhere)

```typescript
{
  userName: string; // User's display name
  userEmail: string; // User's email address
  siteUrl: string; // Full site URL (https://techtots.ro)
  storeUrl: string; // Same as siteUrl
  currentYear: number; // Current year (2025)
}
```

---

## 📧 Email Types & Required Variables

### Authentication Emails

#### Account Verification

```typescript
template: 'account-verification'
variables: {
  userName: "Ion Popescu",
  verificationLink: "https://techtots.ro/auth/verify?token=...",
  expiresIn: "24 ore",
  siteUrl: "https://techtots.ro"
}
```

#### Password Reset

```typescript
template: 'password-reset'
variables: {
  userName: "Ion Popescu",        // or user.name (both work)
  resetUrl: "https://techtots.ro/auth/reset-password?token=...",
  expiresIn: "1 oră",
  siteUrl: "https://techtots.ro"
}
```

#### Welcome Email

```typescript
template: 'welcome'
variables: {
  userName: "Ion Popescu",
  siteUrl: "https://techtots.ro"
}
```

---

### Order Emails

#### Order Confirmation

```typescript
template: 'order-confirmation'
variables: {
  // Flat structure
  orderNumber: "ORD-123",
  orderTotal: "299.99 RON",
  orderDate: "15.10.2025",
  customerName: "Ion Popescu",

  // Nested structure (both work)
  order: {
    number: "ORD-123",
    total: "299.99 RON",
    date: "15.10.2025",
    customerName: "Ion Popescu"
  },

  // Items array
  items: [
    { name: "STEM Kit", quantity: 1, price: "199.99 RON" }
  ],

  siteUrl: "https://techtots.ro"
}
```

#### Order Shipped

```typescript
template: 'order-shipped'
variables: {
  order: {
    customerName: "Ion Popescu",
    number: "ORD-123",
    shipping: {
      carrier: "Fan Courier",
      trackingNumber: "ABC123456",
      deliveryEstimate: "2-3 zile"
    }
  },
  trackingUrl: "https://tracking.fancourier.ro/...",
  siteUrl: "https://techtots.ro"
}
```

#### Payment Successful

```typescript
template: 'payment-successful'
variables: {
  order: {
    customerName: "Ion Popescu",
    number: "ORD-123"
  },
  payment: {
    amount: "299.99 RON",
    method: "Card",
    date: "15.10.2025 14:30",
    transactionId: "TXN-12345"
  },
  siteUrl: "https://techtots.ro"
}
```

---

### Admin Emails

#### New Order Notification

```typescript
template: 'admin-new-order'
variables: {
  order: {
    number: "ORD-123",
    customerName: "Ion Popescu",
    customerEmail: "ion@example.com",  // ✅ MUST INCLUDE
    total: "299.99 RON",
    date: "15 octombrie 2025, 14:30",
    status: "PROCESSING"                // ✅ MUST INCLUDE
  },
  adminUrl: "https://techtots.ro/admin/orders/cmxxx..."
}
```

#### Payment Failed Notification

```typescript
template: 'admin-payment-failed'
variables: {
  order: {
    number: "ORD-123",
    customerName: "Ion Popescu",
    customerEmail: "ion@example.com",  // ✅ MUST INCLUDE
    total: "299.99 RON"
  },
  payment: {
    method: "Card",
    error: "Insufficient funds",
    date: "15.10.2025 14:30"
  },
  adminUrl: "https://techtots.ro/admin/orders/cmxxx..."
}
```

---

### Marketing Emails

#### Cart Abandonment

```typescript
template: 'cart-abandonment'
variables: {
  customer: {
    name: "Ion Popescu"
  },
  storeUrl: "https://techtots.ro",
  cart: {
    url: "https://techtots.ro/cart"
  }
}
```

#### Product Recommendation

```typescript
template: 'product-recommendation'
variables: {
  customer: {
    name: "Ion Popescu"
  },
  storeUrl: "https://techtots.ro"
}
```

#### VIP Birthday

```typescript
template: 'vip-birthday'
variables: {
  customer: {
    name: "Ion Popescu"
  },
  currentYear: 2025,
  birthday: {
    url: "https://techtots.ro/vip-offers"
  }
}
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T Use:

```typescript
{
  settings: {              // ❌ NOT PASSED
    storeName: "...",
    storeUrl: "..."
  }
}
```

### ✅ DO Use:

```typescript
{
  storeName: "TechTots",   // ✅ Pass directly
  storeUrl: "https://techtots.ro"
}
```

---

### ⚠️ Variable Naming Inconsistency

**Current Situation**:

- Some templates use `{{user.name}}`
- Code passes `userName`
- Both work (template engine handles it)

**Recommendation**:

- Use `{{userName}}` in all new templates
- Run update script to fix existing templates
- For consistency and future-proofing

---

## 🔧 Fixes Available

### Fix #1: Update Variable Naming (1 hour)

**Problem**: 19 templates use `{{user.name}}` instead of `{{userName}}`

**Solution**:

```bash
npx tsx scripts/update-email-template-variables.ts
```

**What it does**:

- Finds all templates with `{{user.name}}`
- Replaces with `{{userName}}`
- Updates database
- Provides detailed change log

**Impact**: No breaking changes, improves consistency

---

### Fix #2: Add Admin Notification Service (2 hours)

**Problem**: Admin emails missing customer email and order status

**Solution**: Use new `AdminNotificationService`

**Code**:

```typescript
import { AdminNotificationService } from "@/lib/email/admin-notification-service";

// After creating order
await AdminNotificationService.sendNewOrderNotification(
  dbOrder.id,
  process.env.ADMIN_EMAIL
);

// After payment failure
await AdminNotificationService.sendPaymentFailedNotification(
  orderId,
  "Payment error message"
);
```

**Where to add**:

- `app/api/checkout/order/route.ts` (after order creation)
- Payment failure handlers
- See `fix-implementation-guide.md` for exact line numbers

---

### Fix #3: Verify Email Change (2 hours)

**Action**: Find and test email change implementation

**Commands**:

```bash
# Find email change code
grep -r "change.*email" app/api/
grep -r "email-change-confirmation" lib/

# Test if found
# Create test, verify newEmail and oldEmail are passed
```

---

## 🧪 Testing

### Before Deploying Fixes

```bash
# Test variable replacement
npx tsx scripts/test-email-templates.ts

# Test with real email (set TEST_EMAIL in .env)
TEST_EMAIL=your@email.com npx tsx scripts/test-email-templates.ts
```

### After Deploying Fixes

```bash
# Create a test order
# Check admin receives notification with customer email
# Verify all fields are populated

# Change email (if implemented)
# Verify confirmation email shows old and new email

# Check logs
# Look for any email sending errors
```

---

## 📚 Variable Categories

### User Variables

- `userName` or `user.name` - Display name
- `userEmail` or `user.email` - Email address

### Order Variables

- Flat: `orderNumber`, `orderTotal`, `orderDate`
- Nested: `order.number`, `order.total`, `order.date`
- Customer: `order.customerName`, `order.customerEmail` ⚠️

### Payment Variables

- `payment.amount`, `payment.method`, `payment.date`
- `payment.transactionId`, `payment.error`

### Shipping Variables

- `trackingUrl`, `deliveryDate`
- `order.shipping.carrier`, `order.shipping.trackingNumber`
- `delivery.status`, `delivery.location`

### Return Variables

- `return.number`, `return.reason`, `return.product`
- `return.address`, `return.label`, `return.deadline`

### Marketing Variables

- `customer.name` - For marketing emails
- `product.name`, `product.price`, `product.url`
- `offer.title`, `offer.discount`, `offer.validUntil`

### Admin Variables

- `adminUrl` - Link to admin panel
- `issue.type`, `issue.description`, `issue.priority`
- `stock.quantity`, `stock.minimum`

---

## 🎯 Best Practices

### When Creating New Templates

1. **Use consistent naming**:
   - ✅ `userName` not `user.name`
   - ✅ `orderNumber` not `order.number` (for simple cases)
   - ✅ Use nested for complex objects (order, payment, etc.)

2. **Always provide**:
   - `siteUrl` or `storeUrl`
   - Customer name (`userName` or `customer.name`)
   - Relevant links (trackingUrl, reviewUrl, etc.)

3. **Test before deploying**:

   ```bash
   npx tsx scripts/test-email-templates.ts
   ```

4. **Document variables**:
   - Add to template's `variables` array in database
   - Update this reference guide
   - Add TypeScript types if possible

---

## 🚨 Troubleshooting

### Email Shows Empty Fields

**Cause**: Variable not passed to template

**Fix**:

1. Check variable name matches exactly
2. Verify variable is in data object
3. Check for typos (case-sensitive!)

**Example**:

```typescript
// ❌ Template has {{userName}} but data has:
{
  username: "Ion";
} // Wrong case!

// ✅ Fix:
{
  userName: "Ion";
} // Correct case
```

### Template Not Found Error

**Cause**: Slug doesn't match database

**Fix**:

```bash
# Check available templates
psql -d <database> -c "SELECT slug FROM \"EmailTemplate\" WHERE \"isActive\" = true;"

# Use exact slug from database
```

### Variables Not Replacing

**Cause**: Wrong variable format in template

**Fix**:

```html
<!-- ❌ Wrong -->
{user.name}
<!-- Missing second { -->
{{ user.name }}
<!-- Spaces inside -->

<!-- ✅ Correct -->
{{user.name}}
<!-- No spaces -->
{{userName}}
<!-- Preferred -->
```

---

## 📞 Support

For questions about this validation:

- See: `email-validation-reports/` folder
- Check: Code examples in `fix-implementation-guide.md`
- Run: Test scripts to verify

For email system issues:

- Check: Email logs in database (`EmailLog` table)
- Review: Brevo/email provider dashboard
- Debug: Add console.log in email services

---

**Last Updated**: October 15, 2025  
**Version**: 1.0  
**Status**: ✅ Complete and Tested

---

_Keep this reference handy when working with email templates!_
