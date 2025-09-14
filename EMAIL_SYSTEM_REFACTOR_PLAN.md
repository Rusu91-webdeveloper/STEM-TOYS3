# 🚨 EMAIL SYSTEM COMPLETE REFACTOR PLAN

## 🎯 MAIN GOAL

Transform the current broken email system (4 conflicting services, hardcoded
templates, no tracking, inconsistent APIs) into a unified, scalable, and
reliable email infrastructure that can handle enterprise-level email operations
with proper monitoring, analytics, and deliverability.

## 🚨 CRITICAL ISSUES TO FIX

### 1. **ARCHITECTURE CHAOS**

- **PROBLEM**: 4 different email services running simultaneously
- **FILES TO REMOVE/DEPRECATE**:
  - `lib/nodemailer.ts` (760 lines of hardcoded HTML templates)
  - `lib/brevo.ts` (redundant API wrapper)
  - `lib/resend.ts` (duplicate template system)
  - `lib/email/email-service.ts` (over-engineered wrapper)
- **SOLUTION**: Create ONE unified service with provider abstraction

### 2. **TEMPLATE SYSTEM DISASTER**

- **PROBLEM**: Hardcoded templates mixed with database templates
- **SPECIFIC ISSUES**:
  - 600+ lines of HTML hardcoded in `nodemailer.ts`
  - Inconsistent Romanian translations
  - Different phone numbers across templates (+40 123 456 789 vs +40 771
    248 029)
  - No responsive design
  - Mixed color schemes and branding
- **SOLUTION**: Database-driven template engine with unified design system

### 3. **NO EMAIL TRACKING**

- **PROBLEM**: EmailEvent table exists but analytics engine doesn't use it
- **MISSING**: Delivery status, open tracking, click tracking, bounce handling
- **SOLUTION**: Connect analytics engine to database with proper event tracking

### 4. **PERFORMANCE NIGHTMARE**

- **PROBLEM**: Fake performance engine with no actual queuing
- **ISSUES**: Synchronous email sending, no rate limiting, no retry logic
- **SOLUTION**: Real queue system with Redis + Bull Queue

### 5. **SECURITY VULNERABILITIES**

- **PROBLEM**: No email authentication, inconsistent configs
- **MISSING**: SPF/DKIM/DMARC setup, rate limiting, input validation
- **SOLUTION**: Complete email security implementation

## 📋 DETAILED IMPLEMENTATION PLAN

### PHASE 1: FOUNDATION (Week 1-2) - CRITICAL

#### Step 1.1: Choose Primary Email Provider

```bash
# DECISION REQUIRED: Which provider to use?
# OPTIONS:
# 1. Resend (recommended - modern API, good deliverability)
# 2. Brevo (better Romanian market support)
# 3. Gmail SMTP (current fallback, least reliable)

# ENVIRONMENT VARIABLES TO SET:
EMAIL_PROVIDER=resend  # or brevo or gmail
EMAIL_PRIMARY_API_KEY=your_primary_key
EMAIL_FALLBACK_API_KEY=your_fallback_key
EMAIL_FROM=webira.rem.srl@gmail.com
EMAIL_FROM_NAME=TechTots STEM Store
```

#### Step 1.2: Create Unified Email Service

**FILE**: `lib/email/unified-service.ts`

```typescript
// REQUIREMENTS:
// - Provider abstraction (Resend/Brevo/Gmail)
// - Automatic failover between providers
// - Consistent error handling
// - Unified configuration
// - Single interface for all operations

export class UnifiedEmailService {
  private primaryProvider: EmailProvider;
  private fallbackProvider: EmailProvider;

  async sendEmail(request: UnifiedEmailRequest): Promise<UnifiedEmailResponse> {
    // Try primary provider first
    // If fails, try fallback
    // Log all attempts
    // Return consistent response format
  }
}
```

#### Step 1.3: Fix Database Schema

**FILE**: `prisma/schema.prisma`

```sql
-- FIX EmailEvent model:
model EmailEvent {
  id          String   @id @default(cuid())
  emailId     String   @unique
  userId      String?
  email       String
  eventType   EmailEventType
  timestamp   DateTime @default(now())  // ADD THIS
  metadata    Json?                     // ADD THIS

  -- ADD RELATIONSHIPS:
  campaign    EmailCampaign? @relation(fields: [campaignId], references: [id])
  campaignId  String?
  template    EmailTemplate? @relation(fields: [templateId], references: [id])
  templateId  String?

  -- ADD INDEXES:
  @@index([email])
  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
  @@index([campaignId])
  @@index([templateId])
}

-- ADD EmailDeliveryStatus enum:
enum EmailDeliveryStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
  UNSUBSCRIBED
  SPAM_REPORTED
}
```

### PHASE 2: TEMPLATE SYSTEM OVERHAUL (Week 2-3)

#### Step 2.1: Remove All Hardcoded Templates

**FILES TO CLEAN UP**:

- `lib/nodemailer.ts` lines 132-760 (welcome template)
- `lib/nodemailer.ts` lines 280-418 (verification template)
- `lib/nodemailer.ts` lines 420-660 (order confirmation)
- `lib/nodemailer.ts` lines 662-760 (password reset)
- `lib/resend.ts` lines 84-421 (duplicate templates)

#### Step 2.2: Create Unified Template Engine

**FILE**: `lib/email/template-engine.ts`

```typescript
// REQUIREMENTS:
// - Handlebars/Mustache template engine
// - Database template loading
// - Variable validation and sanitization
// - Conditional blocks {{#if condition}}
// - Loop support {{#each items}}
// - Image processing and optimization
// - Responsive design helpers
// - Template preview functionality

export class TemplateEngine {
  async renderTemplate(
    templateSlug: string,
    variables: Record<string, any>
  ): Promise<string> {
    // Load template from database
    // Validate variables
    // Process conditionals and loops
    // Optimize images
    // Return rendered HTML
  }
}
```

#### Step 2.3: Create Design System

**FILE**: `lib/email/design-system.ts`

```typescript
// REQUIREMENTS:
// - Consistent color palette
// - Typography system
// - Spacing system
// - Component library (buttons, cards, alerts)
// - Responsive breakpoints
// - Dark mode support
// - Romanian language support

export const designSystem = {
  colors: {
    primary: "#10b981",
    secondary: "#3b82f6",
    accent: "#f59e0b",
    // ... consistent color palette
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: {
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      // ... consistent sizing
    },
  },
  // ... complete design system
};
```

### PHASE 3: QUEUE SYSTEM IMPLEMENTATION (Week 3-4)

#### Step 3.1: Install Dependencies

```bash
npm install redis bull @types/redis @types/bull
```

#### Step 3.2: Create Email Queue System

**FILE**: `lib/email/queue-system.ts`

```typescript
// REQUIREMENTS:
// - Redis connection management
// - Bull Queue setup
// - Email job processor
// - Retry logic with exponential backoff
// - Rate limiting (60 emails/minute)
// - Batch processing (50 emails/batch)
// - Dead letter queue for failed emails
// - Queue monitoring and metrics

export class EmailQueueSystem {
  private queue: Queue;

  async addEmailJob(emailData: EmailJobData): Promise<void> {
    // Add job to queue with priority
    // Set retry attempts
    // Set rate limiting
  }

  private async processEmailJob(job: Job): Promise<void> {
    // Process email sending
    // Handle failures
    // Track metrics
  }
}
```

### PHASE 4: SECURITY & MONITORING (Week 4-5)

#### Step 4.1: Email Authentication Setup

**DNS RECORDS REQUIRED**:

```dns
; SPF Record
TXT "v=spf1 include:_spf.google.com include:spf.brevo.com include:resend.com ~all"

; DKIM Record (get from email provider)
TXT "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

; DMARC Record
TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@techtots.com"
```

#### Step 4.2: Implement Monitoring

**FILE**: `lib/email/monitoring.ts`

```typescript
// REQUIREMENTS:
// - Delivery rate tracking
// - Bounce rate monitoring
// - Open/click rate analytics
// - Error rate alerting
// - Performance metrics
// - Health check endpoints

export class EmailMonitoring {
  async trackDelivery(
    emailId: string,
    status: EmailDeliveryStatus
  ): Promise<void> {
    // Store in database
    // Update metrics
    // Trigger alerts if needed
  }
}
```

### PHASE 5: API UNIFICATION (Week 5-6)

#### Step 5.1: Consolidate API Endpoints

**FILES TO MERGE**:

- `app/api/email/route.ts`
- `app/api/email/brevo/route.ts`
- `app/api/marketing/email/route.ts`

**NEW FILE**: `app/api/email/v2/route.ts`

```typescript
// REQUIREMENTS:
// - Single POST endpoint for all email types
// - Unified request/response schema
// - Proper validation with Zod
// - Consistent error handling
// - API versioning
// - Rate limiting middleware

export async function POST(request: Request) {
  // Validate request schema
  // Route to appropriate handler
  // Return consistent response
}
```

## 🔧 SPECIFIC TECHNICAL REQUIREMENTS

### 1. **UNIFIED EMAIL REQUEST SCHEMA**

```typescript
interface UnifiedEmailRequest {
  to: string | string[];
  template: string;
  variables: Record<string, any>;
  priority?: 1 | 2 | 3; // 1=high, 2=normal, 3=low
  scheduledAt?: Date;
  campaignId?: string;
  segmentId?: string;
  tracking?: boolean;
  personalization?: boolean;
}
```

### 2. **UNIFIED EMAIL RESPONSE SCHEMA**

```typescript
interface UnifiedEmailResponse {
  success: boolean;
  emailId: string;
  provider: string;
  messageId?: string;
  error?: string;
  metrics: {
    deliveryTime: number;
    retryCount: number;
    queueTime: number;
  };
}
```

### 3. **TEMPLATE VARIABLE SYSTEM**

```typescript
// SUPPORTED VARIABLES:
interface TemplateVariables {
  // User data
  user: {
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };

  // Order data
  order: {
    id: string;
    total: number;
    items: OrderItem[];
    shippingAddress: Address;
  };

  // Site data
  site: {
    name: string;
    url: string;
    logoUrl: string;
    contactEmail: string;
    contactPhone: string;
  };

  // Dynamic content
  products: Product[];
  recommendations: Product[];
}
```

## 🚨 MIGRATION STRATEGY

### Step 1: Audit Current Usage

```bash
# Find all email service calls in codebase
grep -r "sendEmail\|sendMail\|emailTemplates" --include="*.ts" --include="*.tsx" .
```

### Step 2: Create Migration Script

**FILE**: `scripts/migrate-email-system.ts`

```typescript
// REQUIREMENTS:
// - Backup current email configurations
// - Migrate existing templates to database
// - Update all service calls
// - Test email delivery
// - Create rollback plan
```

### Step 3: Staging Testing

- Deploy to staging environment
- Test all email flows
- Verify deliverability
- Performance testing
- Load testing with queue system

### Step 4: Production Migration

- Schedule maintenance window
- Deploy new system
- Monitor email delivery
- Rollback plan ready
- Post-migration verification

## 📊 SUCCESS METRICS

### Performance Targets

- **Email delivery time**: < 5 seconds (currently unknown)
- **Delivery rate**: > 98% (currently unknown)
- **Template render time**: < 100ms (currently unknown)
- **Queue processing**: 100 emails/minute (currently 0)

### Reliability Targets

- **Uptime**: 99.9%
- **Error rate**: < 0.1%
- **Retry success rate**: > 95%
- **Failed email recovery**: 100%

### Business Impact

- **Template maintenance time**: -80% (from hours to minutes)
- **Email delivery reliability**: +90% (from unknown to 98%+)
- **Developer productivity**: +70% (unified API)
- **Customer complaints**: -60% (reliable delivery)

## 🚨 CRITICAL SUCCESS FACTORS

1. **DO NOT** try to fix everything at once - follow the phases
2. **DO NOT** remove old system until new system is tested
3. **DO NOT** skip the database schema updates
4. **DO NOT** ignore email authentication setup
5. **DO NOT** deploy without proper monitoring
6. **DO** test every change in staging first
7. **DO** maintain rollback capability
8. **DO** document all changes
9. **DO** monitor email delivery metrics
10. **DO** validate Romanian translations

## 🎯 IMMEDIATE NEXT STEPS

1. **START WITH**: Choose primary email provider (Resend recommended)
2. **THEN**: Create unified email service class
3. **THEN**: Fix database schema
4. **THEN**: Remove hardcoded templates
5. **THEN**: Implement queue system

**ESTIMATED TOTAL TIME**: 6 weeks with 1 developer **CRITICAL PATH**: Email
provider choice → Unified service → Database schema → Queue system

This plan provides the AI with complete context, specific file paths, code
examples, and step-by-step instructions to transform the email system from its
current broken state to a production-ready, scalable solution.
