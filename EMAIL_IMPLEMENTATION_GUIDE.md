# 📧 Email System Implementation Guide - Complete Reference

**Last Updated:** October 7, 2025  
**Purpose:** Single source of truth for email implementation in STEM-TOYS3
project

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Email Providers](#email-providers)
3. [Email Template System](#email-template-system)
4. [Email Automation & Sequences](#email-automation--sequences)
5. [Queue System](#queue-system)
6. [Database Schema](#database-schema)
7. [Configuration & Environment](#configuration--environment)
8. [Usage Examples](#usage-examples)
9. [Email Categories](#email-categories)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### Architecture

```
User Action / Event
    ↓
Email Trigger/Sequence
    ↓
Queue System (Bull)
    ↓
Unified Email Service
    ↓
Email Provider (Primary + Fallback)
    ↓
Template Engine (Variable Replacement)
    ↓
Send via API (Resend/Brevo/Gmail/Zoho)
    ↓
Track in Database (EmailLog, EmailEvent)
```

### Key Components

1. **Unified Email Service** - Provider abstraction with automatic fallback
2. **Template Engine** - Database-stored templates with variable replacement
3. **Queue System** - Reliable delivery with retry logic
4. **Automation Engine** - Triggers and sequences for automated emails
5. **Analytics Engine** - Track opens, clicks, conversions
6. **Provider Adapters** - Resend, Brevo, Gmail, Zoho support

---

## Email Providers

### Supported Providers

#### 1. Resend (Recommended)

**File:** `lib/email/providers/resend.ts`

**Features:**

- Modern API
- Excellent deliverability
- Good dashboard
- Reasonable pricing

**Configuration:**

```bash
EMAIL_PROVIDER=resend
EMAIL_PRIMARY_API_KEY=re_xxx...
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=TechTots STEM Store
```

#### 2. Brevo (Romanian Market)

**File:** `lib/email/providers/brevo.ts`

**Features:**

- Better Romanian market support
- SMTP + API
- Marketing features
- Good for EU compliance

**Configuration:**

```bash
EMAIL_PROVIDER=brevo
EMAIL_PRIMARY_API_KEY=xkeysib-xxx...
BREVO_SMTP_KEY=smtp-key (optional)
```

#### 3. Gmail SMTP

**File:** `lib/email/providers/gmail.ts`

**Features:**

- Free for low volume
- Requires app password
- Lower deliverability
- Good for development

**Configuration:**

```bash
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

#### 4. Zoho

**File:** `lib/email/providers/zoho.ts`

**Features:**

- Professional email hosting
- Good deliverability
- Affordable

### Provider Architecture

**File:** `lib/email/unified-service.ts`

```typescript
export class UnifiedEmailService {
  private primaryProvider: EmailProvider;
  private fallbackProvider?: EmailProvider;

  async sendEmail(request: UnifiedEmailRequest): Promise<UnifiedEmailResponse> {
    // Try primary provider
    // If fails, automatically try fallback
    // Return unified response format
  }
}
```

**Automatic Fallback:**

- Primary fails → Try fallback provider
- Track retry attempts
- Log all attempts
- Return consistent response

---

## Email Template System

### Database Storage

Templates are stored in PostgreSQL, not in code files.

**Table:** `EmailTemplate`

```prisma
model EmailTemplate {
  id        String   @id @default(cuid())
  name      String                    // "Welcome Email"
  slug      String   @unique          // "welcome-email"
  subject   String                    // "Welcome to {{storeName}}!"
  content   String                    // HTML content with variables
  category  String                    // "authentication", "ecommerce", etc.
  isActive  Boolean  @default(true)
  metadata  Json?                     // Additional config
  variables String[]                  // ["userName", "storeName", etc.]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String   @default("system")
}
```

### Template Engine

**File:** `lib/email/template-engine.ts`

**Features:**

1. **Variable Replacement:** `{{variableName}}`
2. **Conditionals:** `{{#if condition}}...{{/if}}`
3. **Loops:** `{{#each items}}...{{/each}}`
4. **Nested Objects:** `{{user.name}}`
5. **Fallback Values:** `{{variableName || 'default'}}`

**Example Template:**

```html
<h1>Bună, {{user.name}}!</h1>
<p>Comanda ta #{{order.orderNumber}} a fost plasată cu succes.</p>

{{#if order.items}}
<h2>Produse comandate:</h2>
<ul>
  {{#each order.items}}
  <li>{{this.name}} - {{this.price}} RON</li>
  {{/each}}
</ul>
{{/if}}

<p>Total: {{order.total}} RON</p>
```

**Usage:**

```typescript
import { TemplateEngine } from "@/lib/email/template-engine";

const engine = new TemplateEngine();
const html = await engine.renderTemplate("order-confirmation", {
  user: { name: "Ion Popescu" },
  order: {
    orderNumber: "12345",
    total: 299,
    items: [{ name: "Robot Kit", price: 299 }],
  },
});
```

### Template Service

**File:** `lib/email/database-template-service.ts`

```typescript
import { DatabaseTemplateService } from "@/lib/email/database-template-service";

// Send email using database template
await DatabaseTemplateService.sendEmailWithDatabaseTemplate({
  templateSlug: "order-confirmation",
  to: "customer@example.com",
  variables: {
    user: { name: "Ion" },
    order: { ... }
  },
  priority: 1 // High priority
});
```

### Template Categories

1. **Authentication** (`auth-templates.ts`)
   - welcome-email
   - verify-email
   - password-reset
   - account-locked
   - two-factor-setup

2. **Ecommerce** (`order-templates.ts`)
   - order-confirmation
   - order-shipped
   - order-delivered
   - order-cancelled
   - refund-processed

3. **Marketing** (`campaign-templates.ts`, `newsletter-templates.ts`)
   - newsletter-monthly
   - product-launch
   - seasonal-promotion
   - abandoned-cart
   - win-back-campaign

4. **Coupons** (`coupon-templates.ts`)
   - coupon-created
   - influencer-coupon-notification
   - coupon-expiring-soon

---

## Email Automation & Sequences

### Email Sequences

**Purpose:** Send a series of emails over time (drip campaigns)

**Database:** `EmailSequence`, `EmailSequenceStep`, `EmailSequenceUser`

**Example: Welcome Sequence**

```typescript
{
  name: "Welcome Sequence",
  trigger: "user_signup",
  isActive: true,
  maxEmails: 5,
  cooldownHours: 24,
  steps: [
    {
      order: 1,
      delayHours: 0,        // Immediate
      templateId: "welcome-email",
      subject: "Bine ai venit!"
    },
    {
      order: 2,
      delayHours: 24,       // After 1 day
      templateId: "first-order-incentive",
      subject: "10% reducere la prima comandă"
    },
    {
      order: 3,
      delayHours: 72,       // After 3 days
      templateId: "educational-content",
      subject: "Ghid STEM pentru părinți"
    }
  ]
}
```

**Usage:**

```typescript
import { EmailAutomationEngine } from "@/lib/email/automation-engine";

const automation = new EmailAutomationEngine();

// Start sequence for new user
await automation.executeEmailSequence("welcome-sequence-id", userId, {
  storeName: "TechTots",
});
```

### Email Triggers

**Purpose:** Send emails based on user actions or events

**Database:** `EmailTrigger`, `EmailTriggerExecution`

**Trigger Types:**

1. **User Action** - After specific user behavior
   - User signs up
   - User makes first purchase
   - User abandons cart
   - User reviews product

2. **Time-Based** - At specific times
   - Daily digest
   - Weekly newsletter
   - Monthly summary
   - Birthday emails

3. **Behavioral** - Based on user patterns
   - Inactive for 30 days
   - High-value customer
   - Frequent buyer
   - At-risk churn

4. **System** - System events
   - Low stock alert
   - Payment failed
   - Subscription expiring

**Example Trigger:**

```typescript
{
  name: "Abandoned Cart Recovery",
  type: "behavioral",
  conditions: [
    { field: "cartUpdatedAt", operator: "olderThan", value: "24 hours" },
    { field: "cartItems.length", operator: "greaterThan", value: 0 },
    { field: "lastPurchaseAt", operator: "isNull", value: true }
  ],
  actions: [
    {
      type: "send_email",
      templateSlug: "abandoned-cart-recovery",
      delayMinutes: 60
    }
  ],
  isActive: true,
  priority: 2
}
```

**Service:** `lib/services/email-trigger-service.ts`

```typescript
import { EmailTriggerService } from "@/lib/services/email-trigger-service";

const triggerService = new EmailTriggerService();

// Process all active triggers
await triggerService.processTriggers();

// Process time-based triggers (run via cron)
await triggerService.processTimeBasedTriggers();
```

---

## Queue System

**Purpose:** Reliable email delivery with retry logic

**File:** `lib/email/queue-system.ts`

**Technology:** Bull (Redis-based queue)

### Features

1. **Priority Queue** - High/Medium/Low priority
2. **Retry Logic** - Automatic retries on failure
3. **Rate Limiting** - Respect provider limits
4. **Batch Processing** - Send multiple emails efficiently
5. **Job Tracking** - Monitor queue status
6. **Error Handling** - Graceful failure handling

### Priority Levels

```typescript
enum EmailPriority {
  HIGH = 1, // Authentication, password resets (immediate)
  MEDIUM = 2, // Order confirmations, receipts (5s delay)
  LOW = 3, // Marketing, newsletters (10s delay)
}
```

### Usage

```typescript
import { addEmailToQueue } from "@/lib/email/queue-system";

// Add email to queue
await addEmailToQueue({
  to: "customer@example.com",
  subject: "Order Confirmation",
  template: "order-confirmation",
  variables: { order: {...} },
  priority: 1, // High priority
  campaignId: "campaign-123",
  metadata: { orderId: "12345" }
});
```

### Queue Processing

```typescript
// Automatic processing in background
// Bull processes jobs based on priority
// Retries failed jobs with exponential backoff
// Tracks metrics (deliveryTime, retryCount, queueTime)
```

---

## Database Schema

### EmailTemplate

**Stores all email templates**

```prisma
model EmailTemplate {
  id            String              @id @default(cuid())
  name          String              // Display name
  slug          String              @unique // Unique identifier
  subject       String              // Email subject with variables
  content       String              // HTML content
  category      String              // "auth", "ecommerce", "marketing"
  isActive      Boolean             @default(true)
  metadata      Json?               // Extra configuration
  variables     String[]            // Required variables
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  createdBy     String              @default("system")

  campaigns     EmailCampaign[]
  emails        EmailLog[]
  sequenceSteps EmailSequenceStep[]
}
```

### EmailLog

**Tracks all sent emails**

```prisma
model EmailLog {
  id          String    @id @default(cuid())
  templateId  String?
  to          String    // Recipient email
  subject     String
  status      String    @default("pending") // pending, sent, delivered, failed
  sentAt      DateTime?
  deliveredAt DateTime?
  openedAt    DateTime?
  clickedAt   DateTime?
  error       String?
  metadata    Json?
  createdAt   DateTime  @default(now())

  template    EmailTemplate? @relation(fields: [templateId], references: [id])
}
```

### EmailEvent

**Tracks email events (sent, opened, clicked)**

```prisma
model EmailEvent {
  id         String         @id @default(cuid())
  emailId    String         @unique
  userId     String?
  email      String
  eventType  EmailEventType // SENT, DELIVERED, OPENED, CLICKED, BOUNCED
  campaignId String?
  sequenceId String?
  templateId String?
  metadata   Json?
  createdAt  DateTime       @default(now())

  user       User?          @relation(fields: [userId], references: [id])
}

enum EmailEventType {
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  UNSUBSCRIBED
  SPAM_REPORTED
  FAILED
}
```

### EmailSequence

**Automated email sequences**

```prisma
model EmailSequence {
  id            String              @id @default(cuid())
  name          String
  description   String?
  trigger       String              // "user_signup", "first_purchase", etc.
  isActive      Boolean             @default(true)
  maxEmails     Int                 @default(5)
  cooldownHours Int                 @default(24)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  createdBy     String

  steps         EmailSequenceStep[]
  users         EmailSequenceUser[]
}
```

### EmailSequenceStep

**Steps in a sequence**

```prisma
model EmailSequenceStep {
  id         String        @id @default(cuid())
  sequenceId String
  order      Int           // 1, 2, 3...
  delayHours Int           @default(0) // Hours after previous step
  templateId String
  subject    String
  content    String
  conditions Json?         // Conditional logic
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  sequence   EmailSequence @relation(fields: [sequenceId], references: [id])
  template   EmailTemplate @relation(fields: [templateId], references: [id])
}
```

### EmailTrigger

**Event-based email triggers**

```prisma
model EmailTrigger {
  id              String                  @id @default(cuid())
  name            String
  description     String?
  type            EmailTriggerType        // SEGMENT_ENTER, LIFECYCLE_CHANGE, etc.
  status          EmailTriggerStatus      // ACTIVE, PAUSED, DRAFT
  conditions      Json                    // Trigger conditions
  actionType      String                  // "send_email", "start_sequence"
  actionData      Json                    // Action configuration
  priority        Int                     @default(0)
  cooldownHours   Int                     @default(24)
  maxExecutions   Int?
  isActive        Boolean                 @default(false)
  createdBy       String
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt

  executions      EmailTriggerExecution[]
}

enum EmailTriggerType {
  SEGMENT_ENTER
  SEGMENT_EXIT
  LIFECYCLE_CHANGE
  BEHAVIOR_EVENT
  TIME_BASED
  CUSTOM_EVENT
}
```

### EmailCampaign

**Bulk email campaigns**

```prisma
model EmailCampaign {
  id          String              @id @default(cuid())
  name        String
  description String?
  templateId  String
  subject     String
  content     String
  status      EmailCampaignStatus @default(DRAFT)
  scheduledAt DateTime?
  sentAt      DateTime?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  createdBy   String
  metadata    Json?

  template    EmailTemplate       @relation(fields: [templateId], references: [id])
}

enum EmailCampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  PAUSED
  CANCELLED
}
```

---

## Configuration & Environment

### Required Environment Variables

**File:** `.env.local`

```bash
# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================

# Primary Email Provider (resend | brevo | gmail | zoho)
EMAIL_PROVIDER=resend

# API Keys
EMAIL_PRIMARY_API_KEY=re_xxx_your_primary_key
EMAIL_FALLBACK_API_KEY=xkeysib_xxx_your_fallback_key

# Resend Configuration
RESEND_API_KEY=re_xxx_your_resend_key

# Brevo Configuration
BREVO_API_KEY=xkeysib_xxx_your_brevo_key
BREVO_SMTP_KEY=smtp_key_optional

# Gmail Configuration (for development)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Sender Information
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=TechTots STEM Store
EMAIL_REPLY_TO=support@yourdomain.com

# Redis (for queue system)
REDIS_URL=redis://localhost:6379
# or Upstash Redis
REDIS_URL=https://your-redis-url.upstash.io
REDIS_TOKEN=your-redis-token
```

### Email Service Factory

**File:** `lib/email/index.ts`

```typescript
import { createEmailService } from "@/lib/email";

// Get configured email service
const emailService = createEmailService();

// Send email
const result = await emailService.sendEmail({
  to: "customer@example.com",
  subject: "Test Email",
  html: "<p>Hello World</p>",
});
```

---

## Usage Examples

### 1. Send Simple Email

```typescript
import { sendEmailWithTemplate } from "@/lib/email/unified-email-service";

await sendEmailWithTemplate({
  templateSlug: "welcome-email",
  to: "newuser@example.com",
  data: {
    userName: "Ion Popescu",
    storeName: "TechTots",
  },
});
```

### 2. Send Order Confirmation

```typescript
import { DatabaseTemplateService } from "@/lib/email/database-template-service";

await DatabaseTemplateService.sendEmailWithDatabaseTemplate({
  templateSlug: "order-confirmation",
  to: order.customerEmail,
  variables: {
    user: {
      name: order.customerName,
      email: order.customerEmail,
    },
    order: {
      orderNumber: order.orderNumber,
      total: order.total,
      items: order.items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    },
    trackingUrl: `https://techtots.ro/orders/${order.id}/track`,
  },
  priority: 1, // High priority
});
```

### 3. Send with Queue

```typescript
import { addEmailToQueue } from "@/lib/email/queue-system";

await addEmailToQueue({
  to: "customer@example.com",
  subject: "Your Monthly Newsletter",
  template: "newsletter-monthly",
  variables: {
    month: "October",
    articles: [...]
  },
  priority: 3, // Low priority (marketing)
  campaignId: "newsletter-oct-2025"
});
```

### 4. Start Email Sequence

```typescript
import { EmailAutomationEngine } from "@/lib/email/automation-engine";

const automation = new EmailAutomationEngine();

// New user signup - start welcome sequence
await automation.executeEmailSequence("welcome-sequence", userId, {
  userName: user.name,
  storeName: "TechTots",
});
```

### 5. Create Email Trigger

```typescript
import { EmailTriggerService } from "@/lib/services/email-trigger-service";

const triggerService = new EmailTriggerService();

// Create abandoned cart trigger
await triggerService.createTrigger({
  name: "Abandoned Cart Recovery",
  type: "BEHAVIOR_EVENT",
  conditions: {
    cartAge: { greaterThan: 24 }, // hours
    hasItems: true,
    noPurchase: true,
  },
  actionType: "send_email",
  actionData: {
    templateSlug: "abandoned-cart-recovery",
    delayMinutes: 60,
  },
  priority: 2,
  isActive: true,
});
```

### 6. Get Template from Database

```typescript
import { prisma } from "@/lib/prisma";

// Get active template
const template = await prisma.emailTemplate.findUnique({
  where: {
    slug: "order-confirmation",
    isActive: true,
  },
});

// Get all templates in a category
const templates = await prisma.emailTemplate.findMany({
  where: {
    category: "ecommerce",
    isActive: true,
  },
});
```

---

## Email Categories

### 1. Authentication Emails

**File:** `lib/email/auth-templates.ts`

- `welcome-email` - New user welcome
- `verify-email` - Email verification
- `password-reset` - Password reset link
- `password-changed` - Password change confirmation
- `account-locked` - Account security alert
- `two-factor-setup` - 2FA setup instructions
- `login-notification` - New login alert

### 2. Ecommerce Emails

**File:** `lib/email/order-templates.ts`

- `order-confirmation` - Order placed
- `payment-received` - Payment successful
- `order-processing` - Order being prepared
- `order-shipped` - Shipping notification
- `order-delivered` - Delivery confirmation
- `order-cancelled` - Cancellation notice
- `refund-initiated` - Refund processing
- `refund-completed` - Refund completed
- `return-approved` - Return accepted

### 3. Marketing Emails

**File:** `lib/email/campaign-templates.ts`, `newsletter-templates.ts`

- `newsletter-monthly` - Monthly updates
- `product-launch` - New product announcement
- `seasonal-promotion` - Holiday/seasonal sales
- `abandoned-cart` - Cart recovery
- `back-in-stock` - Product restocked
- `price-drop` - Price reduction alert
- `win-back-campaign` - Re-engagement
- `customer-survey` - Feedback request

### 4. Coupon Emails

**File:** `lib/email/coupon-templates.ts`

- `coupon-created` - New coupon notification
- `influencer-coupon` - Influencer code ready
- `coupon-expiring-soon` - Expiration reminder
- `exclusive-offer` - VIP customer offer

### 5. Supplier Emails

**Files in:** `lib/email/`

- `supplier-welcome` - New supplier onboarding
- `order-to-supplier` - Order fulfillment request
- `supplier-payment-due` - Payment reminder
- `performance-report` - Monthly performance

---

## Troubleshooting

### Email Not Sending

**Problem:** Emails not being sent

**Solutions:**

1. Check environment variables:

```bash
# Verify in .env.local
EMAIL_PROVIDER=resend
EMAIL_PRIMARY_API_KEY=re_xxx...
EMAIL_FROM=noreply@yourdomain.com
```

2. Check provider status:

```typescript
import { createEmailService } from "@/lib/email";

const service = createEmailService();
// Check if provider is configured
console.log("Provider:", service.primaryProvider.name);
```

3. Check template exists:

```typescript
const template = await prisma.emailTemplate.findUnique({
  where: { slug: "template-slug", isActive: true },
});
if (!template) {
  console.error("Template not found or inactive");
}
```

### Template Variables Not Replacing

**Problem:** Variables showing as `{{variableName}}` in sent emails

**Solutions:**

1. Ensure variables are passed correctly:

```typescript
// Correct
await sendEmailWithTemplate({
  templateSlug: "welcome-email",
  to: "user@example.com",
  data: {
    userName: "Ion", // Match template variable exactly
    storeName: "TechTots",
  },
});
```

2. Check template syntax:

```html
<!-- Correct -->
<p>Bună, {{userName}}!</p>

<!-- Wrong -->
<p>Bună, {{ userName }}!</p>
<!-- No spaces -->
<p>Bună, ${userName}!</p>
<!-- Wrong syntax -->
```

3. Check nested objects:

```typescript
// Template: {{user.name}}
data: {
  user: {
    name: "Ion";
  }
}
```

### Queue Not Processing

**Problem:** Emails stuck in queue

**Solutions:**

1. Check Redis connection:

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

2. Check Bull queue status:

```typescript
import { emailQueue } from "@/lib/email/queue-system";

const jobs = await emailQueue.getWaiting();
console.log("Waiting jobs:", jobs.length);

const failed = await emailQueue.getFailed();
console.log("Failed jobs:", failed.length);
```

3. Restart queue worker:

```bash
# If using separate worker process
npm run worker:restart
```

### Email Going to Spam

**Problem:** Emails landing in spam folder

**Solutions:**

1. Verify SPF record:

```dns
v=spf1 include:_spf.resend.com ~all
```

2. Verify DKIM:

```dns
resend._domainkey.yourdomain.com
```

3. Verify DMARC:

```dns
_dmarc.yourdomain.com
```

4. Use authenticated sender:

```bash
EMAIL_FROM=noreply@yourdomain.com  # Use your domain
EMAIL_FROM_NAME=TechTots STEM Store
```

5. Check content:

- Avoid spam trigger words
- Include unsubscribe link
- Have proper HTML structure
- Include plain text version

### Sequence Not Triggering

**Problem:** Email sequences not starting

**Solutions:**

1. Check sequence is active:

```typescript
const sequence = await prisma.emailSequence.findUnique({
  where: { id: sequenceId },
  include: { steps: true },
});
console.log("Active:", sequence.isActive);
console.log("Steps:", sequence.steps.length);
```

2. Check user not already in sequence:

```typescript
const existing = await prisma.emailSequenceUser.findUnique({
  where: {
    sequenceId_userId: {
      sequenceId,
      userId,
    },
  },
});
if (existing) {
  console.log("User already in sequence");
}
```

3. Check trigger conditions:

```typescript
// Ensure trigger event is firing
console.log("Trigger event:", eventName);
// Check automation engine is processing
await automation.processUserAction(userId, "signup", {});
```

---

## Best Practices

### Email Sending

1. **Use Queue for Non-Critical Emails**
   - Marketing emails: Priority 3
   - Order confirmations: Priority 2
   - Password resets: Priority 1

2. **Always Use Templates**
   - Don't hardcode email content
   - Store templates in database
   - Use template engine for variables

3. **Implement Fallback Provider**
   - Configure secondary provider
   - Automatic failover on errors
   - Monitor delivery rates

4. **Track Email Events**
   - Log all sent emails
   - Track opens and clicks
   - Monitor bounce rates

### Template Management

1. **Use Clear Variable Names**

   ```html
   <!-- Good -->
   {{userName}}, {{orderTotal}}, {{productName}}

   <!-- Bad -->
   {{u}}, {{t}}, {{p}}
   ```

2. **Provide Fallback Values**

   ```html
   <p>Bună, {{userName || 'Prieten'}}!</p>
   ```

3. **Test Templates**
   - Test with real data
   - Check on mobile devices
   - Verify links work
   - Test in different email clients

4. **Keep Templates Updated**
   - Review quarterly
   - Update branding
   - Fix broken links
   - Improve copy

### Automation

1. **Set Appropriate Delays**
   - Welcome email: Immediate
   - Follow-up: 24 hours
   - Win-back: 30 days

2. **Limit Sequence Length**
   - Max 5-7 emails per sequence
   - Respect unsubscribes
   - Monitor engagement

3. **Test Triggers**
   - Test in staging first
   - Monitor execution logs
   - Check for duplicates

### Performance

1. **Use Queue for Bulk Emails**
   - Don't send synchronously
   - Process in background
   - Monitor queue health

2. **Optimize Templates**
   - Minimize HTML size
   - Optimize images
   - Use CDN for assets

3. **Monitor Metrics**
   - Delivery rate
   - Open rate
   - Click-through rate
   - Unsubscribe rate

---

## Quick Reference

### Send Simple Email

```typescript
import { sendEmailWithTemplate } from "@/lib/email/unified-email-service";

await sendEmailWithTemplate({
  templateSlug: "welcome-email",
  to: "user@example.com",
  data: { userName: "Ion" },
});
```

### Send with Queue

```typescript
import { addEmailToQueue } from "@/lib/email/queue-system";

await addEmailToQueue({
  to: "user@example.com",
  template: "newsletter",
  variables: {...},
  priority: 3
});
```

### Get Template

```typescript
import { prisma } from "@/lib/prisma";

const template = await prisma.emailTemplate.findUnique({
  where: { slug: "template-slug", isActive: true },
});
```

### Start Sequence

```typescript
import { EmailAutomationEngine } from "@/lib/email/automation-engine";

const automation = new EmailAutomationEngine();
await automation.executeEmailSequence(sequenceId, userId, context);
```

---

## File Reference

### Core Email Services

- `lib/email/unified-service.ts` - Unified email service
- `lib/email/template-engine.ts` - Template rendering
- `lib/email/database-template-service.ts` - Database templates
- `lib/email/queue-system.ts` - Queue management
- `lib/email/automation-engine.ts` - Sequences & triggers

### Providers

- `lib/email/providers/resend.ts` - Resend provider
- `lib/email/providers/brevo.ts` - Brevo provider
- `lib/email/providers/gmail.ts` - Gmail provider
- `lib/email/providers/zoho.ts` - Zoho provider

### Templates

- `lib/email/auth-templates.ts` - Authentication emails
- `lib/email/order-templates.ts` - Ecommerce emails
- `lib/email/campaign-templates.ts` - Marketing emails
- `lib/email/newsletter-templates.ts` - Newsletters
- `lib/email/coupon-templates.ts` - Coupon emails

### Services

- `lib/services/email-trigger-service.ts` - Trigger management
- `lib/email/analytics-engine.ts` - Email analytics
- `lib/email/personalization-engine.ts` - Personalization
- `lib/email/compliance-manager.ts` - Compliance & GDPR

---

**End of Email Implementation Guide**

For questions or issues, check the codebase or create a GitHub issue.
