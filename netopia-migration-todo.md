# Netopia Payments Migration TODO

## Project Analysis Summary

### Database Schema Analysis

Based on the Prisma schema and related models:

| Table     | Payment-Related Fields                                                                            | Types/Examples                                                                                                                                                                                    | Migration Notes                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Order`   | `id`, `totalAmount`, `currency`, `status`, `stripePaymentId`, `paymentStatus`, `paymentMethod`    | `id: String`, `totalAmount: Decimal`, `currency: String (default: 'USD')`, `stripePaymentId: String?`, `paymentStatus: OrderStatus (enum: PENDING, PAID, FAILED)`, `paymentMethod: PaymentMethod` | Need to add `netopiaTransactionId: String?`, `netopiaInvoiceId: String?` for Netopia integration. Migrate existing `stripePaymentId` values to new fields if keeping historical data. |
| `Payment` | `id`, `orderId`, `amount`, `currency`, `status`, `provider`, `providerTransactionId`, `createdAt` | `provider: PaymentProvider (enum: STRIPE, NETOPIA)`, `providerTransactionId: String`                                                                                                              | New table added for multi-provider support. Existing Stripe payments will populate this table during migration.                                                                       |
| `User`    | `billingAddress`, `paymentMethods` (relation to PaymentMethod table)                              | Complex nested objects with card details                                                                                                                                                          | Payment methods table needs to support both Stripe tokens and Netopia wallet data.                                                                                                    |
| `Cart`    | `total`, `currency`                                                                               | Standard cart fields                                                                                                                                                                              | No direct payment integration, but ensure currency conversion for RON.                                                                                                                |

**Key Risks:**

- **Data Migration:** Existing orders with `stripePaymentId` need preservation.
  Run a migration script to populate new Netopia fields.
- **Currency Handling:** Current system defaults to USD; Netopia prioritizes
  RON. Add currency conversion logic.
- **Backward Compatibility:** Keep Stripe fields during transition period.

### API Routes Analysis

Current Stripe-integrated endpoints:

| Endpoint                       | Method | Purpose                   | Stripe Code Example                                                                                                                                     | Migration Notes                                                                                        |
| ------------------------------ | ------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/api/stripe/payment-intent`   | POST   | Create payment intent     | `js const paymentIntent = await stripe.paymentIntents.create({ amount: amount * 100, currency: 'usd', metadata: { orderId } }); `                       | Replace with Netopia invoice creation: `POST /invoice` with `{ amount, currency: 'RON', orderId }`     |
| `/api/stripe/webhook`          | POST   | Handle Stripe webhooks    | `js const event = stripe.webhooks.constructEvent(payload, sig, endpointSecret); if (event.type === 'payment_intent.succeeded') { /* update order */ } ` | Replace with Netopia notification handler: Validate signature, parse JSON payload, update order status |
| `/api/checkout/payment-intent` | POST   | Checkout payment creation | Similar to above, uses Stripe for session creation                                                                                                      | Adapt to call Netopia provider based on user location/currency                                         |
| `/api/payments/refund`         | POST   | Process refunds           | `js await stripe.refunds.create({ payment_intent: intentId }); `                                                                                        | Use Netopia refund API: `POST /refund` with transaction ID                                             |

**Request/Response Shapes:**

- Current: `{ clientSecret: string }` for payment intents
- Netopia: `{ paymentUrl: string, invoiceId: string }` for hosted payment pages

### Frontend Components Analysis

- **Checkout Flow:** `features/checkout/components/StripePaymentForm.tsx` uses
  `@stripe/react-stripe-js` for Elements
- **Payment Method Selection:** `PaymentMethodSelector.tsx` shows saved cards
- **Error Handling:** Centralized in `features/checkout/lib/errorHandling.ts`
- **Hooks:** `useCheckoutSettings.ts` for configuration

**Stripe-Specific Code Snippets:**

```tsx
// Stripe Elements usage
<Elements stripe={stripePromise}>
  <CheckoutForm />
</Elements>;

// Payment confirmation
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: elements.getElement(CardElement) },
});
```

### Environment Variables

- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` - Will be commented out during
  migration
- Need to add: `NETOPIA_API_KEY`, `NETOPIA_SIGNATURE`, `NETOPIA_SANDBOX=true`

### Dependencies & Edge Cases

- **Packages:** `stripe@^12.0.0`, `@stripe/stripe-js@^2.0.0`
- **Recurring Payments:** Not currently implemented; Netopia supports
  subscriptions via recurring billing
- **Installments:** Netopia supports card installments (2-12 months)
- **Refunds:** Partial/full refunds supported
- **Multi-currency:** Stripe handles USD; Netopia prioritizes RON with
  conversion
- **Error Logging:** Uses Sentry for payment failures
- **Email Notifications:** Order confirmation emails sent on successful payment

**Risks Identified:**

- Webhook signature validation differences
- PCI compliance (Netopia handles card data)
- Romanian-specific requirements (ANPC approval display)

## High-Level Migration Overview

**Why Netopia?** As a Romanian e-commerce platform targeting local customers,
Netopia offers:

- Native RON support with lower fees (1.5-2.5% vs Stripe's 2.9% + €0.25)
- Direct integration with Romanian banks (BCR, BRD, Raiffeisen)
- Local trust signals and compliance requirements
- Better user experience for Romanian payment methods

**Benefits:** 30-50% cost reduction, improved conversion rates, regulatory
compliance **Risks:** API differences, webhook handling, data migration,
rollback complexity **Timeline:** 1-2 weeks for full testing (5-10 days
development + 3-5 days testing)

## Detailed TODO List

### Phase 1: Preparation (2-3 hours)

- [ ] **Sign up for Netopia Account**
  - Create merchant account at
    [admin.netopia-payments.com](https://admin.netopia-payments.com)
  - Obtain API credentials (merchant ID, secret key, signature)
  - Success Criteria: Dashboard access confirmed
- [ ] **Install Netopia SDK**
  - Run `npm install netopia-payment2`
  - Add to package.json dependencies
  - Success Criteria: Package installed without conflicts
- [ ] **Backup Current Stripe Configuration**
  - Create `.env.stripe.backup` with current keys
  - Document all Stripe-specific code locations
  - Success Criteria: Backup file created
- [ ] **Create Payment Provider Interface**
  - Implement `lib/payments/IPaymentProvider.ts` with common methods
  - Success Criteria: Interface defines `createPayment`, `handleWebhook`,
    `refund`

### Phase 2: Comment Out Stripe (4-6 hours)

- [ ] **Environment Variables**
  - Comment out `STRIPE_*` variables in `.env.local`
  - Add `PAYMENT_PROVIDER=netopia` flag for gradual rollout
  - Success Criteria: App starts without Stripe errors
- [ ] **API Routes**
  - Wrap Stripe code in conditional blocks:
    ```js
    if (process.env.PAYMENT_PROVIDER === "stripe") {
      // Existing Stripe code
    } else {
      // Netopia implementation
    }
    ```
  - Apply to `/api/stripe/*`, `/api/checkout/payment-intent`
  - Success Criteria: Routes return 501 (Not Implemented) for Stripe calls
- [ ] **Frontend Components**
  - Add feature flags to payment components
  - Display "Payment system under maintenance" for Stripe users
  - Success Criteria: Checkout page loads without Stripe Elements errors
- [ ] **Database Queries**
  - Add provider checks in payment-related database operations
  - Success Criteria: No runtime errors when Stripe fields are null

### Phase 3: Database Schema Updates (3-4 hours)

- [ ] **Add Netopia Fields to Prisma Schema**
  - Update `schema.prisma`:
    ```prisma
    model Order {
      netopiaTransactionId String?
      netopiaInvoiceId     String?
      // ... existing fields
    }
    ```
  - Success Criteria: Schema validates
- [ ] **Create Migration Script**
  - Run `npx prisma migrate dev --name add-netopia-fields`
  - Success Criteria: Migration applies without data loss
- [ ] **Data Migration Script**
  - Create `scripts/migrate-payment-data.ts` to populate Netopia fields from
    Stripe data
  - Handle edge cases (failed payments, refunds)
  - Success Criteria: All existing orders have corresponding Netopia
    placeholders

### Phase 4: Backend API Integration (8-10 hours)

- [ ] **Netopia Provider Implementation**
  - Create `lib/payments/NetopiaProvider.ts` implementing `IPaymentProvider`
  - Use Netopia SDK for payment creation:
    ```js
    const netopia = new Netopia({
      apiKey: process.env.NETOPIA_API_KEY,
      signature: process.env.NETOPIA_SIGNATURE,
      sandbox: true,
    });
    ```
  - Success Criteria: Can create test payments
- [ ] **New API Routes**
  - `/api/payments/netopia/create`: Handle payment initiation
  - `/api/payments/netopia/notify`: Webhook handler
  - `/api/payments/netopia/refund`: Refund processing
  - Success Criteria: Routes return proper responses
- [ ] **Webhook Validation**
  - Implement signature verification for Netopia notifications
  - Update order status based on notification type
  - Success Criteria: Webhook accepts valid payloads, rejects invalid ones
- [ ] **Error Handling & Logging**
  - Add Netopia-specific error codes to error handler
  - Integrate with existing Sentry logging
  - Success Criteria: Payment failures logged correctly

### Phase 5: Frontend Implementation (6-8 hours)

- [ ] **Payment Method Selection**
  - Update `PaymentMethodSelector.tsx` to show Netopia options for Romanian
    users
  - Add Romanian payment method icons (card, SMS, wallet)
  - Success Criteria: Users see appropriate payment options
- [ ] **Checkout Form Updates**
  - Create `NetopiaPaymentForm.tsx` component
  - Handle redirect to Netopia hosted payment page
  - Success Criteria: Form submits and redirects correctly
- [ ] **Callback Handling**
  - Implement success/failure page redirects from Netopia
  - Update order status on return
  - Success Criteria: Users redirected to appropriate pages
- [ ] **Romanian Localization**
  - Add Romanian translations for payment methods
  - Display ANPC trust badges
  - Success Criteria: Romanian users see localized payment flow

### Phase 6: Testing & Validation (4-6 hours)

- [ ] **Unit Tests**
  - Test Netopia provider methods with mocks
  - Verify webhook signature validation
  - Success Criteria: All tests pass
- [ ] **Integration Tests**
  - Use Netopia sandbox environment for end-to-end testing
  - Test payment creation, confirmation, refunds
  - Success Criteria: Full payment flow works in sandbox
- [ ] **Edge Case Testing**
  - Test failed payments, timeouts, network errors
  - Verify multi-currency support (RON conversion)
  - Success Criteria: Error states handled gracefully
- [ ] **Performance Testing**
  - Load test payment endpoints
  - Monitor response times vs Stripe baseline
  - Success Criteria: Performance meets or exceeds current levels

### Phase 7: Deployment & Monitoring (2-3 hours)

- [ ] **Environment Setup**
  - Deploy Netopia credentials to staging/production
  - Update deployment scripts to include Netopia SDK
  - Success Criteria: App deploys successfully
- [ ] **Gradual Rollout**
  - Use feature flags to enable Netopia for 10% of users initially
  - Monitor error rates and conversion metrics
  - Success Criteria: No critical issues in initial rollout
- [ ] **Monitoring & Alerts**
  - Set up alerts for payment failures in Sentry
  - Add Netopia-specific metrics to monitoring dashboard
  - Success Criteria: Real-time visibility into payment system health

## Step-by-Step Webpage Implementation Guide

### User Flow Integration

1. **Payment Method Selection**

   ```tsx
   // In PaymentMethodSelector.tsx
   const paymentMethods = usePaymentMethods(userLocation);

   return (
     <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
       {paymentMethods.map(method => (
         <div key={method.id}>
           <RadioGroupItem value={method.id} />
           <Label>
             {method.name}
             {method.provider === "NETOPIA" && <RomanianBadge />}
           </Label>
         </div>
       ))}
     </RadioGroup>
   );
   ```

2. **Checkout Form Submission**

   ```tsx
   // In CheckoutFlow.tsx
   const handlePaymentSubmit = async paymentData => {
     if (paymentMethod === "NETOPIA") {
       const response = await fetch("/api/payments/netopia/create", {
         method: "POST",
         body: JSON.stringify({
           amount: orderTotal,
           currency: "RON",
           orderId: order.id,
           customerData: billingInfo,
         }),
       });

       const { paymentUrl } = await response.json();
       window.location.href = paymentUrl; // Redirect to Netopia
     }
   };
   ```

3. **Payment Processing Page**

   ```tsx
   // Create /checkout/netopia-processing.tsx
   "use client";

   export default function NetopiaProcessing() {
     useEffect(() => {
       // Handle return from Netopia
       const urlParams = new URLSearchParams(window.location.search);
       const status = urlParams.get("status");

       if (status === "success") {
         router.push("/checkout/success");
       } else {
         router.push("/checkout/failure");
       }
     }, []);

     return <LoadingSpinner message="Processing payment with Netopia..." />;
   }
   ```

4. **Error Handling**

   ```tsx
   // In NetopiaPaymentForm.tsx
   const [error, setError] = useState(null);

   const handleNetopiaError = errorCode => {
     switch (errorCode) {
       case "NETOPIA_DECLINED":
         setError("Payment was declined. Please try another method.");
         break;
       case "NETOPIA_TIMEOUT":
         setError("Payment timed out. Please try again.");
         break;
       default:
         setError("Payment failed. Please contact support.");
     }
   };
   ```

5. **Romanian Payment Methods UI**
   ```tsx
   // Add to PaymentMethodSelector.tsx for Romanian users
   const romanianMethods = [
     { id: "netopia_card", name: "Card bancar", icon: "💳" },
     { id: "netopia_sms", name: "Plată prin SMS", icon: "📱" },
     { id: "netopia_wallet", name: "Portofel mobilPay", icon: "👛" },
   ];
   ```

## Rollback Plan & Resources

### Rollback Strategy

1. **Immediate Rollback:** Uncomment Stripe environment variables, set
   `PAYMENT_PROVIDER=stripe`
2. **Gradual Rollback:** Use feature flags to revert 50% of users to Stripe
3. **Data Recovery:** Restore from Stripe backup if Netopia data corrupted
4. **Communication:** Notify users of temporary payment system switch

### Resources

- **Netopia Official Docs:**
  [apidoc.netopia-payments.com](https://apidoc.netopia-payments.com)
- **SDK Documentation:**
  [github.com/netopiapayments/javascript-sdk](https://github.com/netopiapayments/javascript-sdk)
- **Sandbox Testing:**
  [support.netopia-payments.com](https://support.netopia-payments.com)
- **Community SDK:**
  [github.com/chesscoders/netopia-card](https://github.com/chesscoders/netopia-card)

### Potential Gotchas

- Netopia requires HTTPS for production
- Webhook signatures use different algorithm than Stripe
- Romanian timezone handling for payment timestamps
- VAT calculations for RON transactions

## Completion Checklist

- [ ] All TODO phases completed
- [ ] Sandbox testing passed for all payment flows
- [ ] Production credentials configured
- [ ] Rollback plan documented and tested
- [ ] Team notified of go-live date
- [ ] Monitoring alerts configured
- [ ] User communication plan ready

**Congratulations!** Your e-commerce platform now supports native Romanian
payments with Netopia. Monitor metrics closely in the first week and optimize
based on user feedback. 🚀🇷🇴
