pnpm run # Netopia Payments Migration TODO - Complete Guide

## Executive Summary

This comprehensive guide outlines the complete migration from Stripe to Netopia
Payments (mobilPay) for the Romanian STEM Toys e-commerce platform. The
migration involves database schema updates, API refactoring, frontend component
changes, and extensive testing to ensure zero-downtime transition.

**Timeline:** 2-3 weeks total (10-15 days development + 3-5 days testing + 1-2
days deployment) **Risk Level:** Medium-High (involves payment processing)
**Business Impact:** 30-50% cost reduction, improved Romanian user conversion

---

## Phase 0: Pre-Migration Assessment (1-2 hours)

### Risk Assessment Matrix

| Risk Category                  | Probability | Impact   | Mitigation Strategy                                 | Owner         |
| ------------------------------ | ----------- | -------- | --------------------------------------------------- | ------------- |
| **Payment Failures**           | Medium      | High     | Comprehensive sandbox testing, gradual rollout      | Dev Team      |
| **Data Loss**                  | Low         | Critical | Database backups, migration validation scripts      | Dev Team      |
| **Currency Conversion Errors** | Medium      | High     | Unit tests, manual verification of conversion logic | Dev Team      |
| **Webhook Signature Issues**   | High        | Medium   | Signature validation testing, fallback mechanisms   | Dev Team      |
| **Romanian Compliance**        | Medium      | Medium   | ANPC requirements verification, legal review        | Business Team |
| **Performance Degradation**    | Low         | Medium   | Load testing, performance monitoring                | Dev Team      |

### Success Metrics Definition

**Technical Metrics:**

- Payment success rate: ≥99.5% (current Stripe baseline)
- API response time: <500ms (current Stripe baseline)
- Webhook processing: <2 seconds
- Database migration: Zero data loss

**Business Metrics:**

- Conversion rate: Maintain or improve current rates
- Transaction volume: No significant drop during migration
- Customer support tickets: <5% increase during transition
- RON transaction percentage: ≥80% of Romanian users

### Communication Plan

**Internal Communication:**

- [ ] Weekly standup updates during migration
- [ ] Daily progress reports to stakeholders
- [ ] Technical documentation updates
- [ ] Team training on Netopia dashboard

**External Communication:**

- [ ] User notification banner during maintenance windows
- [ ] Email updates for Romanian users about improved payment experience
- [ ] Social media posts about enhanced Romanian payment support
- [ ] Customer support script updates for payment-related inquiries

---

## Phase 1: Preparation & Planning (2-3 hours)

### 1.1 Account Setup & Credentials

- [ ] **Create Netopia Merchant Account**
  - Register at [admin.netopia-payments.com](https://admin.netopia-payments.com)
  - Complete KYC verification for Romanian business
  - Obtain production credentials (API Key, Signature, Merchant ID)
  - Request sandbox environment access
  - **Success Criteria:** Dashboard login confirmed, sandbox credentials
    received
  - **Timeline:** 1-2 business days

- [ ] **Environment Variables Setup**
  - Create `.env.netopia` template with required variables:
    ```bash
    NETOPIA_API_KEY=your_api_key_here
    NETOPIA_SIGNATURE=your_signature_here
    NETOPIA_MERCHANT_ID=your_merchant_id
    NETOPIA_SANDBOX=true
    PAYMENT_PROVIDER=netopia
    NETOPIA_WEBHOOK_SECRET=webhook_signature_key
    ```
  - **Success Criteria:** Environment template created and validated

### 1.2 Dependencies & Infrastructure

- [ ] **Install Netopia SDK**
  - Run `npm install netopia-payment2@^2.0.0`
  - Verify package compatibility with current Next.js version
  - Update `package.json` with exact version pinning
  - **Success Criteria:** Package installed without conflicts, types available

- [ ] **Currency Conversion Service**
  - Implement RON/USD exchange rate service
  - Add caching for exchange rates (update every 4 hours)
  - Handle exchange rate API failures gracefully
  - **Success Criteria:** Accurate RON conversion with fallback rates

- [ ] **Payment Provider Interface**
  - Create `lib/payments/IPaymentProvider.ts`:
    ```typescript
    interface IPaymentProvider {
      createPayment(orderData: OrderData): Promise<PaymentResult>;
      handleWebhook(payload: any, signature: string): Promise<void>;
      refund(transactionId: string, amount: number): Promise<RefundResult>;
      getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
    }
    ```
  - **Success Criteria:** Interface compiles and is implemented by both
    providers

### 1.3 Backup & Documentation

- [ ] **Configuration Backup**
  - Create `.env.stripe.backup` with all current Stripe credentials
  - Document all Stripe-specific code locations in codebase
  - Backup current payment-related database state
  - **Success Criteria:** Complete backup archive created

- [ ] **Code Audit & Documentation**
  - Map all Stripe API calls across the codebase
  - Document current payment flow user journey
  - Identify all payment-related UI components
  - **Success Criteria:** Complete code inventory documented

---

## Phase 2: Database Schema Migration (3-4 hours)

### 2.1 Schema Updates

- [ ] **Update Prisma Schema**
  - Add Netopia fields to Order model:

    ```prisma
    model Order {
      // Existing fields...
      netopiaTransactionId String?
      netopiaInvoiceId     String?
      netopiaPaymentUrl    String?

      // Update payment method enum
      paymentMethod PaymentMethod @updated
    }

    enum PaymentMethod {
      STRIPE_CARD
      NETOPIA_CARD
      NETOPIA_SMS
      NETOPIA_WALLET
    }
    ```

  - Add PaymentProvider enum if not exists
  - **Success Criteria:** Schema validates without errors

- [ ] **Migration Script Creation**
  - Run `npx prisma migrate dev --name add-netopia-fields`
  - Generate migration SQL script for production deployment
  - Test migration on development database copy
  - **Success Criteria:** Migration applies without data loss

### 2.2 Data Migration Strategy

- [ ] **Historical Data Migration Script**
  - Create `scripts/migrate-payment-data.ts`:

    ```typescript
    // Migrate existing Stripe payment IDs to Netopia fields
    const migratePaymentData = async () => {
      const orders = await prisma.order.findMany({
        where: { stripePaymentId: { not: null } },
      });

      for (const order of orders) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            netopiaTransactionId: `migrated_${order.stripePaymentId}`,
            netopiaInvoiceId: `invoice_${order.id}`,
          },
        });
      }
    };
    ```

  - Handle edge cases (failed payments, partial refunds)
  - **Success Criteria:** All historical orders have Netopia placeholder fields

- [ ] **Data Validation Script**
  - Create verification script to ensure data integrity
  - Compare order totals and payment statuses
  - Generate migration report with before/after statistics
  - **Success Criteria:** 100% data integrity maintained

---

## Phase 3: Backend API Implementation (8-10 hours)

### 3.1 Netopia Provider Implementation

- [ ] **Core Provider Class**
  - Create `lib/payments/NetopiaProvider.ts` implementing `IPaymentProvider`
  - Implement payment creation with proper error handling:

    ```typescript
    class NetopiaProvider implements IPaymentProvider {
      private netopia: NetopiaSDK;

      async createPayment(orderData: OrderData): Promise<PaymentResult> {
        try {
          const invoice = await this.netopia.createInvoice({
            amount: orderData.amount,
            currency: orderData.currency || "RON",
            orderId: orderData.id,
            customerData: orderData.customer,
            returnUrl: `${process.env.APP_URL}/checkout/netopia/callback`,
          });

          return {
            paymentUrl: invoice.paymentUrl,
            invoiceId: invoice.id,
            transactionId: invoice.transactionId,
          };
        } catch (error) {
          throw new PaymentError("NETOPIA_CREATION_FAILED", error.message);
        }
      }
    }
    ```

  - **Success Criteria:** Test payments created successfully in sandbox

- [ ] **Webhook Handler Implementation**
  - Create `/api/payments/netopia/webhook/route.ts`:

    ```typescript
    export async function POST(request: Request) {
      try {
        const payload = await request.json();
        const signature = request.headers.get("x-netopia-signature");

        const provider = new NetopiaProvider();
        await provider.handleWebhook(payload, signature);

        // Update order status based on notification
        if (payload.status === "confirmed") {
          await updateOrderStatus(payload.orderId, "PAID");
          await sendOrderConfirmationEmail(payload.orderId);
        }

        return Response.json({ received: true });
      } catch (error) {
        console.error("Netopia webhook error:", error);
        return Response.json({ error: "Invalid webhook" }, { status: 400 });
      }
    }
    ```

  - Implement signature verification using Netopia's algorithm
  - **Success Criteria:** Webhook accepts valid payloads, rejects invalid ones

### 3.2 API Routes Migration

- [ ] **Payment Creation Endpoint**
  - Create `/api/payments/netopia/create/route.ts`
  - Replace Stripe payment intent creation logic
  - Handle currency conversion for USD orders
  - **Success Criteria:** Returns proper Netopia payment URL and invoice data

- [ ] **Refund Endpoint**
  - Create `/api/payments/netopia/refund/route.ts`
  - Implement partial and full refund logic
  - Update order and payment records accordingly
  - **Success Criteria:** Refunds process correctly in sandbox

- [ ] **Payment Status Endpoint**
  - Create `/api/payments/netopia/status/route.ts`
  - Query Netopia API for real-time payment status
  - Cache results to avoid excessive API calls
  - **Success Criteria:** Accurate status reporting

### 3.3 Error Handling & Logging

- [ ] **Custom Error Classes**
  - Create Netopia-specific error types:

    ```typescript
    export class NetopiaPaymentError extends Error {
      constructor(
        public code: NetopiaErrorCode,
        message: string
      ) {
        super(message);
        this.name = "NetopiaPaymentError";
      }
    }

    export enum NetopiaErrorCode {
      INVALID_SIGNATURE = "INVALID_SIGNATURE",
      PAYMENT_DECLINED = "PAYMENT_DECLINED",
      TIMEOUT = "TIMEOUT",
      INVALID_AMOUNT = "INVALID_AMOUNT",
    }
    ```

  - **Success Criteria:** All Netopia errors properly categorized

- [ ] **Sentry Integration**
  - Add Netopia-specific error tracking
  - Configure alerts for payment failures
  - Log payment success/failure rates
  - **Success Criteria:** Payment errors appear in Sentry dashboard

---

## Phase 4: Frontend Implementation (6-8 hours)

### 4.1 Payment Method Selection

- [ ] **Dynamic Payment Methods**
  - Update `PaymentMethodSelector.tsx` to detect user location
  - Show Netopia options for Romanian users:

    ```tsx
    const paymentMethods = useMemo(() => {
      const isRomanian =
        userLocation === "RO" ||
        userLocale === "ro" ||
        billingAddress?.country === "Romania";

      if (isRomanian) {
        return [
          { id: "netopia_card", name: "Card bancar", icon: "💳", fee: "1.5%" },
          {
            id: "netopia_sms",
            name: "Plată prin SMS",
            icon: "📱",
            fee: "2.0%",
          },
          {
            id: "netopia_wallet",
            name: "Portofel mobilPay",
            icon: "👛",
            fee: "1.2%",
          },
        ];
      }

      return stripeMethods; // Fallback to Stripe
    }, [userLocation, userLocale, billingAddress]);
    ```

  - **Success Criteria:** Romanian users see Netopia options by default

- [ ] **Romanian UI Components**
  - Add ANPC trust badges and compliance notices
  - Implement Romanian localization for payment methods
  - Add currency display in RON for Romanian users
  - **Success Criteria:** UI meets Romanian e-commerce regulations

### 4.2 Checkout Flow Updates

- [ ] **Netopia Payment Form**
  - Create `NetopiaPaymentForm.tsx` component:

    ```tsx
    export function NetopiaPaymentForm({ order }: { order: Order }) {
      const handleSubmit = async () => {
        try {
          const response = await fetch("/api/payments/netopia/create", {
            method: "POST",
            body: JSON.stringify({
              orderId: order.id,
              amount: order.totalAmount,
              currency: "RON", // Convert USD to RON
              customerData: order.customer,
            }),
          });

          const { paymentUrl } = await response.json();
          window.location.href = paymentUrl; // Redirect to Netopia
        } catch (error) {
          setError("Payment initiation failed. Please try again.");
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Pay with Netopia"}
          </Button>
        </form>
      );
    }
    ```

  - **Success Criteria:** Form submits and redirects to Netopia payment page

- [ ] **Callback Handling**
  - Create `/checkout/netopia/callback/page.tsx`:

    ```tsx
    export default function NetopiaCallback() {
      useEffect(() => {
        const handleCallback = async () => {
          const urlParams = new URLSearchParams(window.location.search);
          const status = urlParams.get("status");
          const orderId = urlParams.get("orderId");

          if (status === "success") {
            // Verify payment with backend
            await fetch(`/api/payments/netopia/verify/${orderId}`);
            router.push("/checkout/success");
          } else {
            router.push("/checkout/failure");
          }
        };

        handleCallback();
      }, []);

      return <LoadingSpinner message="Verifying payment..." />;
    }
    ```

  - **Success Criteria:** Users redirected appropriately based on payment result

### 4.3 Feature Flags & Gradual Rollout

- [ ] **Feature Flag Implementation**
  - Add payment provider feature flags:
    ```typescript
    const PAYMENT_FEATURES = {
      NETOPIA_ENABLED: process.env.NEXT_PUBLIC_NETOPIA_ENABLED === "true",
      STRIPE_ENABLED: process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true",
      GRADUAL_ROLLOUT_PERCENTAGE: parseInt(
        process.env.GRADUAL_ROLLOUT_PERCENTAGE || "0"
      ),
    };
    ```
  - Implement user segmentation for gradual rollout
  - **Success Criteria:** Feature flags control payment provider selection

---

## Phase 5: Testing & Quality Assurance (6-8 hours)

### 5.1 Unit Testing

- [ ] **Provider Tests**
  - Test NetopiaProvider methods with mocked SDK
  - Verify error handling for all failure scenarios
  - Test currency conversion logic
  - **Success Criteria:** All unit tests pass (≥90% coverage)

- [ ] **API Route Tests**
  - Test webhook signature validation
  - Test payment creation with various amounts
  - Test refund processing
  - **Success Criteria:** All API tests pass

### 5.2 Integration Testing

- [ ] **End-to-End Payment Flow**
  - Complete payment journey in sandbox environment
  - Test all payment methods (card, SMS, wallet)
  - Verify order status updates
  - **Success Criteria:** Full payment flow works without errors

- [ ] **Edge Case Testing**

  ```typescript
  // Test scenarios to cover:
  const testScenarios = [
    { name: "Payment timeout", amount: 100, delay: 30000 },
    { name: "Invalid card", amount: 100, cardNumber: "4000000000000002" },
    { name: "Insufficient funds", amount: 10000, balance: 50 },
    { name: "Network failure", amount: 100, networkError: true },
    {
      name: "Currency conversion",
      amount: 100,
      currency: "USD",
      expectedRON: 475,
    },
    { name: "Partial refund", amount: 100, refundAmount: 50 },
  ];
  ```

  - **Success Criteria:** All edge cases handled gracefully

### 5.3 Performance Testing

- [ ] **Load Testing**
  - Simulate 100 concurrent payment requests
  - Test webhook processing under load
  - Monitor database performance during peak loads
  - **Success Criteria:** Performance meets or exceeds Stripe baseline

- [ ] **Security Testing**
  - Test webhook signature validation with invalid signatures
  - Attempt SQL injection in payment data
  - Test rate limiting on payment endpoints
  - **Success Criteria:** No security vulnerabilities found

---

## Phase 6: Deployment & Monitoring (3-4 hours)

### 6.1 Environment Setup

- [ ] **Staging Deployment**
  - Deploy Netopia credentials to staging environment
  - Configure sandbox mode for all environments except production
  - Update deployment scripts to include Netopia SDK
  - **Success Criteria:** Staging environment deploys successfully

- [ ] **Production Credentials**
  - Obtain and validate production Netopia credentials
  - Configure production webhook endpoints
  - Update DNS/webhook URLs in Netopia dashboard
  - **Success Criteria:** Production credentials configured and tested

### 6.2 Gradual Rollout Strategy

- [ ] **Phase 1: 5% of Romanian users**
  - Enable Netopia for 5% of Romanian users
  - Monitor error rates and conversion metrics
  - Duration: 24 hours
  - **Success Criteria:** No critical issues, conversion rate maintained

- [ ] **Phase 2: 25% of Romanian users**
  - Increase to 25% of Romanian users
  - Monitor performance metrics
  - Duration: 48 hours
  - **Success Criteria:** Performance stable, error rates acceptable

- [ ] **Phase 3: 100% of Romanian users**
  - Full rollout for all Romanian users
  - Keep Stripe as fallback option
  - Monitor for 1 week
  - **Success Criteria:** Successful migration, improved metrics

### 6.3 Monitoring & Alerts

- [ ] **Real-time Monitoring Setup**
  - Configure payment success rate alerts (<99.5%)
  - Set up latency monitoring (>500ms)
  - Add Netopia-specific error tracking
  - **Success Criteria:** Real-time visibility into payment system health

- [ ] **Business Metrics Dashboard**
  - Track conversion rates by payment provider
  - Monitor average order values
  - Track payment method preferences
  - **Success Criteria:** Comprehensive business intelligence available

---

## Phase 7: Post-Migration Optimization (2-3 hours)

### 7.1 Performance Optimization

- [ ] **Code Optimization**
  - Remove unused Stripe code after successful migration
  - Optimize Netopia API calls with proper caching
  - Implement payment method recommendations based on user behavior
  - **Success Criteria:** Improved performance metrics

### 7.2 User Experience Improvements

- [ ] **Payment Method Optimization**
  - Analyze which Netopia payment methods perform best
  - Optimize UI based on user preferences
  - Implement payment method auto-selection
  - **Success Criteria:** Improved conversion rates

### 7.3 Cost Analysis

- [ ] **Financial Impact Assessment**
  - Compare Stripe vs Netopia transaction costs
  - Calculate ROI of migration
  - Identify additional cost-saving opportunities
  - **Success Criteria:** Quantified financial benefits

---

## Rollback Procedures

### Immediate Rollback (< 30 minutes)

```bash
# 1. Switch environment variables
cp .env.stripe.backup .env.local
echo "PAYMENT_PROVIDER=stripe" >> .env.local

# 2. Redeploy application
npm run build
npm run start

# 3. Verify Stripe payments working
curl -X POST /api/payments/stripe/test
```

### Gradual Rollback (1-2 hours)

```typescript
// Update feature flags to reduce Netopia traffic
PAYMENT_FEATURES = {
  NETOPIA_ENABLED: true,
  GRADUAL_ROLLOUT_PERCENTAGE: 50, // Reduce from 100% to 50%
  STRIPE_ENABLED: true,
};
```

### Complete Rollback (4-6 hours)

1. Disable Netopia feature flags
2. Restore Stripe environment variables
3. Update payment method selection logic
4. Test full Stripe payment flow
5. Communicate rollback to users
6. Monitor for 48 hours post-rollback

---

## Risk Mitigation Checklist

### Pre-Migration

- [ ] Database backup completed
- [ ] Rollback procedures documented and tested
- [ ] Communication plan ready
- [ ] Monitoring alerts configured
- [ ] Team trained on Netopia dashboard

### During Migration

- [ ] Feature flags working correctly
- [ ] Gradual rollout progressing smoothly
- [ ] Error rates within acceptable limits
- [ ] Customer support prepared for inquiries
- [ ] Performance metrics monitored continuously

### Post-Migration

- [ ] Full payment flow tested in production
- [ ] Business metrics meeting targets
- [ ] User feedback collected and analyzed
- [ ] Documentation updated
- [ ] Lessons learned documented

---

## Success Criteria & Go-Live Checklist

### Technical Readiness

- [ ] All phases completed successfully
- [ ] Sandbox testing passed for all scenarios
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Rollback procedures tested

### Business Readiness

- [ ] Stakeholder approval obtained
- [ ] Communication plan executed
- [ ] Customer support trained
- [ ] Monitoring dashboards configured
- [ ] Success metrics defined and tracked

### Legal & Compliance

- [ ] ANPC compliance verified
- [ ] PCI compliance maintained
- [ ] Romanian payment regulations met
- [ ] Terms of service updated
- [ ] Privacy policy reviewed

---

## Resources & Documentation

### Netopia Resources

- **Official API Documentation:**
  [apidoc.netopia-payments.com](https://apidoc.netopia-payments.com)
- **SDK Documentation:**
  [github.com/netopiapayments/javascript-sdk](https://github.com/netopiapayments/javascript-sdk)
- **Sandbox Environment:**
  [sandbox.netopia-payments.com](https://sandbox.netopia-payments.com)
- **Merchant Dashboard:**
  [admin.netopia-payments.com](https://admin.netopia-payments.com)

### Internal Documentation

- **Migration Runbook:** `/docs/netopia-migration-runbook.md`
- **API Documentation:** `/docs/api/netopia-payments-api.md`
- **Testing Guide:** `/docs/testing/netopia-payment-testing.md`
- **Troubleshooting:** `/docs/troubleshooting/netopia-issues.md`

### Support Contacts

- **Netopia Technical Support:** support@netopia-payments.com
- **Development Team:** dev@stemtoys.ro
- **Business Stakeholders:** business@stemtoys.ro
- **Customer Support:** support@stemtoys.ro

---

**Migration Commander:** [Assign team member] **Start Date:** [Set target date]
**Go-Live Date:** [Set target date + 2-3 weeks] **Rollback Coordinator:**
[Assign team member]

**Remember:** A successful migration requires careful planning, thorough
testing, and close monitoring. Take it one phase at a time, and don't hesitate
to rollback if any critical issues arise. 🚀🇷🇴
