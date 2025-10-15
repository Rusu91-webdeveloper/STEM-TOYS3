# Email Template Fix Implementation Guide

## Priority 1: CRITICAL & HIGH Fixes (Must Fix This Week)

### Fix #1: Admin Email - Order Customer Information

**Priority**: HIGH **Impact**: Admin emails show empty customer email and status
**Effort**: 2 hours

#### Templates Affected:

1. `Admin - Comandă Nouă` (id: cmge0t1am000g1k2flvxrhm4y)
2. `Admin - Plată Eșuată` (id: cmge0t14l000d1k2ffybhvqdp)

#### Current State:

Templates use these variables:

```html
{{order.customerEmail}}
<!-- ❌ Not passed -->
{{order.status}}
<!-- ❌ Not passed -->
```

#### Implementation Steps:

**Step 1: Find where admin order emails are sent**

```bash
# Search for admin email sending code
grep -r "admin-new-order" app/ lib/
grep -r "admin.*order" lib/email/
```

**Step 2: Update email sending function**

File: `lib/email/admin-notification-service.ts` (create if doesn't exist)

```typescript
import { DatabaseTemplateService } from "./database-template-service";
import { prisma } from "@/lib/prisma";

export class AdminNotificationService {
  /**
   * Send new order notification to admin
   */
  static async sendNewOrderNotification(
    orderId: string,
    adminEmail: string = process.env.ADMIN_EMAIL || "admin@techtots.ro"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch complete order with user info
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          shippingAddress: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Prepare complete order data
      const orderData = {
        number: order.orderNumber,
        customerName:
          order.user?.name || order.shippingAddress?.fullName || "Guest",
        customerEmail: order.user?.email || "N/A", // ✅ Now included
        total: order.total,
        date: order.createdAt.toLocaleDateString("ro-RO"),
        status: order.status, // ✅ Now included
      };

      return await DatabaseTemplateService.sendEmailWithTemplate({
        to: adminEmail,
        templateSlug: "admin-new-order",
        data: {
          order: orderData,
          adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`,
        },
      });
    } catch (error) {
      console.error("Failed to send admin order notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send payment failed notification to admin
   */
  static async sendPaymentFailedNotification(
    orderId: string,
    paymentError: string,
    adminEmail: string = process.env.ADMIN_EMAIL || "admin@techtots.ro"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      return await DatabaseTemplateService.sendEmailWithTemplate({
        to: adminEmail,
        templateSlug: "admin-payment-failed",
        data: {
          order: {
            number: order.orderNumber,
            customerName: order.user?.name || "Guest",
            customerEmail: order.user?.email || "N/A", // ✅ Now included
            total: order.total,
          },
          payment: {
            method: order.paymentMethod,
            error: paymentError,
            date: new Date().toLocaleDateString("ro-RO"),
          },
          adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}`,
        },
      });
    } catch (error) {
      console.error("Failed to send payment failed notification:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
```

**Step 3: Use the new service in order creation**

File: `app/api/checkout/order/route.ts`

```typescript
import { AdminNotificationService } from "@/lib/email/admin-notification-service";

// After order is created successfully, around line 870
// Add this:

// Send admin notification
try {
  await AdminNotificationService.sendNewOrderNotification(
    dbOrder.id,
    process.env.ADMIN_EMAIL
  );
  console.log(`✅ Admin notification sent for order ${dbOrder.orderNumber}`);
} catch (adminEmailError) {
  console.error("Failed to send admin notification:", adminEmailError);
  // Don't fail the order if admin email fails
}
```

**Step 4: Update payment failure handler**

File: `app/api/stripe/webhook/route.ts` or payment handler

```typescript
import { AdminNotificationService } from "@/lib/email/admin-notification-service";

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  // ... existing code ...

  // Notify admin of payment failure
  await AdminNotificationService.sendPaymentFailedNotification(
    orderId,
    paymentIntent.last_payment_error?.message || "Unknown payment error"
  );
}
```

**Testing Checklist**:

- [ ] Create test order and verify admin email includes `customerEmail`
- [ ] Verify admin email includes `status`
- [ ] Test payment failure notification
- [ ] Check email formatting and all variables display correctly

---

### Fix #2: Standardize user.name vs userName

**Priority**: HIGH **Impact**: 19 templates use inconsistent variable naming
**Effort**: 1 hour (if updating templates) or 3 hours (if updating services)

#### Option A: Update Templates (RECOMMENDED - Faster)

**Pros**:

- Single source of truth
- Easier to maintain
- Less code changes

**Cons**:

- Requires database updates
- Need to update 19 templates

**Implementation**:

Create a migration script:

File: `scripts/update-email-template-variables.ts`

```typescript
import { prisma } from "../lib/prisma";

async function updateTemplateVariables() {
  console.log("🔄 Updating email template variables...\n");

  // Get all templates that use user.name
  const templates = await prisma.emailTemplate.findMany({
    where: {
      OR: [
        { content: { contains: "{{user.name}}" } },
        { subject: { contains: "{{user.name}}" } },
      ],
    },
  });

  console.log(`Found ${templates.length} templates to update\n`);

  for (const template of templates) {
    console.log(`Updating template: ${template.name} (${template.slug})`);

    // Replace user.name with userName in both subject and content
    const updatedSubject = template.subject.replace(
      /\{\{user\.name\}\}/g,
      "{{userName}}"
    );
    const updatedContent = template.content.replace(
      /\{\{user\.name\}\}/g,
      "{{userName}}"
    );

    // Update the template
    await prisma.emailTemplate.update({
      where: { id: template.id },
      data: {
        subject: updatedSubject,
        content: updatedContent,
        variables: template.variables.map(v =>
          v === "user.name" ? "userName" : v
        ),
      },
    });

    console.log(`✅ Updated: ${template.name}\n`);
  }

  console.log("✅ All templates updated successfully!");
}

updateTemplateVariables().catch(console.error);
```

**Run the script**:

```bash
npx tsx scripts/update-email-template-variables.ts
```

#### Option B: Update Email Services (Alternative)

**Implementation**: Add `user` object to all email sends

File: `lib/email/database-template-service.ts`

```typescript
// Update sendEmailWithTemplate to always include user object
static async sendEmailWithTemplate(options: {
  to: string;
  templateSlug: string;
  data: Record<string, any>;
  subject?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {

  // ... existing code ...

  // Normalize data to support both userName and user.name
  const normalizedData = {
    ...options.data,
    // If userName exists, also add user.name for backward compatibility
    ...(options.data.userName && {
      user: {
        name: options.data.userName,
        email: options.data.userEmail || options.to
      }
    })
  };

  // Use normalizedData instead of options.data for template replacement
  // ... rest of code ...
}
```

**Recommendation**: **Choose Option A** - It's cleaner and maintains
consistency.

---

## Priority 2: MEDIUM Fixes (Should Fix This Month)

### Fix #3: Verify Email Change Confirmation Variables

**Priority**: MEDIUM **Impact**: Email change confirmation may not work
**Effort**: 2 hours

#### Investigation Steps:

**Step 1: Find email change functionality**

```bash
grep -r "email-change" app/ lib/
grep -r "change.*email" app/api/
```

**Step 2: Verify implementation**

Expected implementation in: `app/api/user/change-email/route.ts` or similar

```typescript
export async function POST(request: Request) {
  try {
    const { newEmail, currentEmail } = await request.json();

    // ... validation and checks ...

    // Send confirmation email
    await DatabaseTemplateService.sendEmailWithTemplate({
      to: newEmail, // Send to NEW email
      templateSlug: "email-change-confirmation",
      data: {
        userName: user.name,
        oldEmail: currentEmail, // ✅ Verify this is passed
        newEmail: newEmail, // ✅ Verify this is passed
        confirmationUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm-email-change?token=${confirmationToken}&email=${encodeURIComponent(newEmail)}`,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // ... error handling ...
  }
}
```

**If Not Implemented**: Create the endpoint

**Testing Checklist**:

- [ ] Test email change flow end-to-end
- [ ] Verify confirmation email is sent
- [ ] Verify `oldEmail` and `newEmail` appear correctly
- [ ] Test confirmation link works

---

## Priority 3: DOCUMENTATION Updates (Should Complete This Month)

### Fix #4: Create TypeScript Type Definitions

**Priority**: MEDIUM **Impact**: Better code safety and autocomplete **Effort**:
3 hours

File: `types/email-variables.ts`

```typescript
/**
 * Type definitions for email template variables
 */

export interface BaseEmailVariables {
  siteUrl: string;
  storeUrl: string;
  currentYear?: number;
}

export interface AuthEmailVariables extends BaseEmailVariables {
  userName: string;
  userEmail?: string;
}

export interface VerificationEmailVariables extends AuthEmailVariables {
  verificationLink: string;
  expiresIn: string;
}

export interface PasswordResetEmailVariables extends AuthEmailVariables {
  resetUrl: string;
  expiresIn: string;
}

export interface EmailChangeVariables extends AuthEmailVariables {
  oldEmail: string;
  newEmail: string;
  confirmationUrl: string;
}

export interface LoginNotificationVariables extends AuthEmailVariables {
  loginDate: string;
  device: string;
  location: string;
  browser: string;
  resetPasswordUrl: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: string | number;
}

export interface OrderEmailVariables extends BaseEmailVariables {
  order: {
    number: string;
    customerName: string;
    customerEmail?: string;
    total: string | number;
    date: string;
    status?: string;
  };
  items?: OrderItem[];
  customerName?: string; // Flat alternative
  orderNumber?: string; // Flat alternative
  orderTotal?: string | number; // Flat alternative
  orderDate?: string; // Flat alternative
}

export interface ShippingEmailVariables extends OrderEmailVariables {
  trackingUrl: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface PaymentEmailVariables extends OrderEmailVariables {
  payment: {
    method: string;
    amount: string | number;
    date: string;
    transactionId?: string;
    error?: string;
  };
  retryPaymentUrl?: string;
}

export interface ReturnEmailVariables extends BaseEmailVariables {
  return: {
    number: string;
    reason: string;
    product: string;
    date: string;
    status?: string;
  };
  customer: {
    name: string;
    email?: string;
  };
}

export interface AdminEmailVariables extends OrderEmailVariables {
  adminUrl: string;
  issue?: {
    type: string;
    description: string;
    priority: string;
  };
}

export interface MarketingEmailVariables extends BaseEmailVariables {
  customer: {
    name: string;
    email?: string;
  };
  product?: {
    name: string;
    description?: string;
    price?: string | number;
    url?: string;
    image?: string;
  };
  offer?: {
    title: string;
    description?: string;
    discount: string;
    validUntil?: string;
    url?: string;
  };
}

// Utility type for template slug to variable mapping
export interface EmailTemplateVariables {
  "account-verification": VerificationEmailVariables;
  "password-reset": PasswordResetEmailVariables;
  "email-change-confirmation": EmailChangeVariables;
  "login-notification": LoginNotificationVariables;
  "order-confirmation": OrderEmailVariables;
  "order-shipped": ShippingEmailVariables;
  "payment-successful": PaymentEmailVariables;
  "payment-failed": PaymentEmailVariables;
  "admin-new-order": AdminEmailVariables;
  "admin-payment-failed": AdminEmailVariables;
  // Add more as needed
}

// Helper type to get variables for a specific template
export type VariablesForTemplate<T extends keyof EmailTemplateVariables> =
  EmailTemplateVariables[T];
```

**Update database-template-service.ts to use types**:

```typescript
import type {
  VerificationEmailVariables,
  OrderEmailVariables,
} from "@/types/email-variables";

export class DatabaseTemplateService {
  static async sendVerificationEmail(
    to: string,
    userName: string,
    verificationLink: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    const variables: VerificationEmailVariables = {
      userName,
      verificationLink,
      expiresIn: "24 ore",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      storeUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    };

    return this.sendEmailWithTemplate({
      to,
      templateSlug: "account-verification",
      data: variables,
    });
  }

  // ... similar updates for other methods ...
}
```

---

### Fix #5: Variable Documentation

**Priority**: MEDIUM **Effort**: 2 hours

Create: `docs/email-variables.md`

````markdown
# Email Template Variables Reference

## Standard Variables (Available in All Templates)

| Variable      | Type   | Description         | Example               |
| ------------- | ------ | ------------------- | --------------------- |
| `siteUrl`     | string | Full URL to website | `https://techtots.ro` |
| `storeUrl`    | string | Same as siteUrl     | `https://techtots.ro` |
| `currentYear` | number | Current year        | `2025`                |

## Authentication Email Variables

### Account Verification

Template: `account-verification`

| Variable           | Type   | Required | Description                                |
| ------------------ | ------ | -------- | ------------------------------------------ |
| `userName`         | string | Yes      | User's display name                        |
| `verificationLink` | string | Yes      | Full URL to verify email                   |
| `expiresIn`        | string | Yes      | Human-readable expiration (e.g., "24 ore") |
| `siteUrl`          | string | Yes      | Base URL of the site                       |

**Example**:

```typescript
{
  userName: "Ion Popescu",
  verificationLink: "https://techtots.ro/auth/verify?token=abc123",
  expiresIn: "24 ore",
  siteUrl: "https://techtots.ro"
}
```
````

### Password Reset

Template: `password-reset`

| Variable    | Type   | Required | Description                |
| ----------- | ------ | -------- | -------------------------- |
| `userName`  | string | No       | User's display name        |
| `resetUrl`  | string | Yes      | Full URL to reset password |
| `expiresIn` | string | Yes      | Human-readable expiration  |
| `siteUrl`   | string | Yes      | Base URL of the site       |

// ... continue for all template types ...

````

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] **Unit Tests**: Create tests for all new email service functions
- [ ] **Integration Tests**: Test email sending end-to-end
- [ ] **Visual Tests**: Preview all affected templates with sample data
- [ ] **Variable Tests**: Verify all variables are replaced correctly

### Test Script

Create: `scripts/test-email-templates.ts`

```typescript
import { DatabaseTemplateService } from '@/lib/email/database-template-service';

async function testEmailTemplates() {
  console.log('🧪 Testing Email Templates\n');

  // Test authentication emails
  console.log('Testing account verification email...');
  const verificationResult = await DatabaseTemplateService.sendVerificationEmail(
    'test@example.com',
    'Test User',
    'https://techtots.ro/auth/verify?token=test123'
  );
  console.log(verificationResult.success ? '✅ Pass' : '❌ Fail', '\n');

  // Test order emails
  console.log('Testing order confirmation email...');
  const orderResult = await DatabaseTemplateService.sendOrderConfirmationEmail(
    'test@example.com',
    {
      customerName: 'Test User',
      orderNumber: 'TEST-001',
      orderTotal: 299.99,
      items: [
        { name: 'STEM Kit', quantity: 1, price: 299.99 }
      ],
      shippingAddress: {}
    }
  );
  console.log(orderResult.success ? '✅ Pass' : '❌ Fail', '\n');

  // Add more tests...

  console.log('✅ All email template tests complete!');
}

testEmailTemplates().catch(console.error);
````

---

## Deployment Plan

### Phase 1: Immediate Fixes (This Week)

1. Create `admin-notification-service.ts`
2. Update order creation to send admin notifications
3. Update payment failure handler
4. Test admin emails

### Phase 2: Standardization (Week 2)

1. Run template variable update script
2. Verify all templates display correctly
3. Update documentation

### Phase 3: Type Safety (Week 3)

1. Add TypeScript type definitions
2. Update all email services to use types
3. Add Zod validation

### Phase 4: Monitoring (Week 4)

1. Add email sending metrics
2. Set up error alerts
3. Create dashboard for email health

---

## Rollback Plan

If issues occur after deployment:

1. **Revert Template Changes**:

   ```sql
   -- Restore from backup if needed
   -- Templates are versioned in database
   ```

2. **Revert Code Changes**:

   ```bash
   git revert <commit-hash>
   ```

3. **Hotfix Process**:
   - Identify failing template
   - Fix in database directly
   - Deploy code fix after

---

## Success Metrics

- ✅ All 5 identified issues resolved
- ✅ 100% of templates tested and working
- ✅ Type definitions in place for all email functions
- ✅ Documentation complete and up-to-date
- ✅ Zero email sending failures due to variable issues
- ✅ Admin receives all critical order notifications

---

## Maintenance

### Regular Tasks

**Weekly**:

- Review email sending logs for failures
- Check for new template variable errors

**Monthly**:

- Review and update email templates
- Test all email types with real data
- Update documentation as needed

**Quarterly**:

- Audit all email templates
- Review variable naming conventions
- Update type definitions

---

Generated: ${new Date().toISOString()} Version: 1.0
