# 📧 Email Templates Migration Guide

## Overview

This guide helps you migrate from hardcoded email templates to the new Email
Templates system in your admin panel. This migration provides better
flexibility, easier management, and no-code email updates.

## ✅ What's Been Done

### 1. Email Templates Created

The following email templates have been automatically created in your database:

- **Welcome Email** (`welcome-email`)
- **Email Verification** (`email-verification`)
- **Password Reset** (`password-reset`)
- **Order Confirmation** (`order-confirmation`)

### 2. New Service Created

- `lib/email/template-service.ts` - Service for sending emails using database
  templates

## 🔄 Migration Steps

### Step 1: Update Import Statements

**Before (Hardcoded):**

```typescript
import { sendWelcomeEmail } from "@/lib/email/auth-templates";
import { sendVerificationEmail } from "@/lib/email/auth-templates";
import { sendPasswordResetEmail } from "@/lib/email/auth-templates";
```

**After (Template Service):**

```typescript
import { EmailTemplateService } from "@/lib/email/template-service";
```

### Step 2: Update Function Calls

#### Welcome Email

**Before:**

```typescript
await sendWelcomeEmail({
  to: user.email,
  name: user.name,
});
```

**After:**

```typescript
await EmailTemplateService.sendWelcomeEmail({
  to: user.email,
  name: user.name,
  storeName: storeSettings.storeName,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
});
```

#### Email Verification

**Before:**

```typescript
await sendVerificationEmail({
  to: user.email,
  name: user.name,
  verificationLink: verificationUrl,
  expiresIn: "24 ore",
});
```

**After:**

```typescript
await EmailTemplateService.sendVerificationEmail({
  to: user.email,
  name: user.name,
  verificationLink: verificationUrl,
  expiresIn: "24 ore",
  storeName: storeSettings.storeName,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
});
```

#### Password Reset

**Before:**

```typescript
await sendPasswordResetEmail({
  to: user.email,
  resetLink: resetUrl,
  expiresIn: "1 oră",
});
```

**After:**

```typescript
await EmailTemplateService.sendPasswordResetEmail({
  to: user.email,
  resetLink: resetUrl,
  expiresIn: "1 oră",
  storeName: storeSettings.storeName,
});
```

#### Order Confirmation

**Before:**

```typescript
await emailService.orderConfirmation({
  to: order.email,
  order: orderData,
});
```

**After:**

```typescript
await EmailTemplateService.sendOrderConfirmationEmail({
  to: order.email,
  order: orderData,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  storeName: storeSettings.storeName,
});
```

## 📍 Files to Update

### 1. Authentication Files

- `lib/auth/register.ts` - User registration
- `lib/auth/verify-email.ts` - Email verification
- `lib/auth/reset-password.ts` - Password reset

### 2. Order Processing Files

- `app/api/checkout/route.ts` - Order confirmation
- `lib/orders/process-order.ts` - Order processing

### 3. Any Other Email Sending Files

Search for these imports and update them:

```bash
grep -r "sendWelcomeEmail\|sendVerificationEmail\|sendPasswordResetEmail\|orderConfirmation" app/ lib/
```

## 🎯 Benefits After Migration

### ✅ Immediate Benefits

1. **No Code Changes for Email Updates** - Edit emails directly in admin panel
2. **Version Control** - Track email changes over time
3. **A/B Testing Ready** - Easy to create variations
4. **Better Organization** - All emails in one place

### ✅ Long-term Benefits

1. **Non-Technical Team Access** - Marketing team can update emails
2. **Faster Iterations** - No deployment needed for email changes
3. **Consistency** - Standardized email structure
4. **Analytics** - Track email performance

## 🔧 Admin Panel Usage

### Accessing Email Templates

1. Go to `/admin/email-templates`
2. View all available templates
3. Click "Edit" to modify any template
4. Preview changes before saving

### Template Variables

Each template supports dynamic variables:

**Welcome Email:**

- `{{name}}` - User's name
- `{{storeName}}` - Store name
- `{{baseUrl}}` - Website URL

**Email Verification:**

- `{{name}}` - User's name
- `{{storeName}}` - Store name
- `{{verificationLink}}` - Verification URL
- `{{expiresIn}}` - Link expiration time
- `{{baseUrl}}` - Website URL

**Password Reset:**

- `{{storeName}}` - Store name
- `{{resetLink}}` - Reset URL
- `{{expiresIn}}` - Link expiration time

**Order Confirmation:**

- `{{orderId}}` - Order ID
- `{{orderDate}}` - Order date
- `{{orderItems}}` - HTML table of items
- `{{subtotal}}` - Order subtotal
- `{{tax}}` - Tax amount
- `{{shippingCost}}` - Shipping cost
- `{{total}}` - Total amount
- `{{shippingAddress}}` - Shipping address
- `{{baseUrl}}` - Website URL
- `{{storeName}}` - Store name

## 🚨 Important Notes

### 1. Fallback Strategy

Keep the old hardcoded functions as backup during migration:

```typescript
try {
  await EmailTemplateService.sendWelcomeEmail({...});
} catch (error) {
  console.error('Template email failed, falling back to hardcoded:', error);
  await sendWelcomeEmail({...}); // Fallback
}
```

### 2. Testing

Test each email type after migration:

- Welcome emails
- Email verification
- Password reset
- Order confirmation

### 3. Monitoring

Monitor email delivery rates after migration to ensure everything works
correctly.

## 🎉 Migration Complete!

Once you've updated all the files, you can:

1. **Remove old hardcoded files** (optional):
   - `lib/email/auth-templates.ts` (after confirming templates work)
   - Email functions from `lib/nodemailer.ts`

2. **Start using the admin panel** to manage emails

3. **Create new email templates** for other use cases

## 📞 Support

If you encounter any issues during migration:

1. Check the browser console for errors
2. Verify template variables are correctly passed
3. Test with the fallback strategy first
4. Check the admin panel for template status

---

**Happy migrating! 🚀**
