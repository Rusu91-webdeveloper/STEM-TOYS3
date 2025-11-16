# Stripe Setup Checklist

Use this checklist to track your Stripe integration setup progress.

## Initial Setup

- [ ] **Create Stripe Account**
  - [ ] Sign up at https://stripe.com
  - [ ] Select Romania as business country
  - [ ] Complete business verification
  - [ ] Activate account

## API Keys - Test Mode

- [ ] **Get Test Mode Keys**
  - [ ] Navigate to Developers → API keys (Test mode ON)
  - [ ] Copy Publishable key (`pk_test_...`)
  - [ ] Copy Secret key (`sk_test_...`)
  - [ ] Store securely (never commit to git!)

## API Keys - Live Mode (Production)

- [ ] **Get Live Mode Keys** (Do this after testing)
  - [ ] Toggle to Live mode
  - [ ] Navigate to Developers → API keys
  - [ ] Copy Publishable key (`pk_live_...`)
  - [ ] Copy Secret key (`sk_live_...`)
  - [ ] Store securely in password manager

## Webhook Setup - Development

- [ ] **Set up Local Webhooks**
  - [ ] Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
  - [ ] Login: `stripe login`
  - [ ] Start forwarding: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  - [ ] Copy webhook secret (`whsec_...`) from terminal output

## Webhook Setup - Production

- [ ] **Set up Production Webhooks**
  - [ ] Go to Developers → Webhooks
  - [ ] Click "Add endpoint"
  - [ ] Enter URL: `https://yourdomain.com/api/stripe/webhook`
  - [ ] Select events:
    - [ ] `payment_intent.succeeded`
    - [ ] `payment_intent.payment_failed`
    - [ ] `payment_intent.requires_action`
    - [ ] `payment_intent.canceled`
    - [ ] `charge.refunded`
    - [ ] `charge.dispute.created`
  - [ ] Save endpoint
  - [ ] Copy webhook signing secret (`whsec_...`)

## Environment Variables - Development

Create or update `.env.local`:

- [ ] `STRIPE_SECRET_KEY=sk_test_...` (Test mode key)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` (Test mode key)
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (From Stripe CLI)
- [ ] `STRIPE_DEFAULT_CURRENCY=ron`
- [ ] `NEXT_PUBLIC_STRIPE_CURRENCY=ron`
- [ ] `NEXT_PUBLIC_STRIPE_ENABLED=true`
- [ ] `NEXT_PUBLIC_NETOPIA_ENABLED=true`
- [ ] `GRADUAL_ROLLOUT_PERCENTAGE=50` (or desired percentage)

## Environment Variables - Production

Add to your hosting platform (Vercel/Railway/etc.):

- [ ] `STRIPE_SECRET_KEY=sk_live_...` (Live mode key)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` (Live mode key)
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (From Stripe Dashboard)
- [ ] `STRIPE_DEFAULT_CURRENCY=ron`
- [ ] `NEXT_PUBLIC_STRIPE_CURRENCY=ron`
- [ ] `NEXT_PUBLIC_STRIPE_ENABLED=true`
- [ ] `NEXT_PUBLIC_NETOPIA_ENABLED=true`
- [ ] `GRADUAL_ROLLOUT_PERCENTAGE=100` (or desired percentage)

## Verification

- [ ] **Run Verification Script**
  ```bash
  pnpm check:stripe
  ```
  - [ ] All checks pass (no errors)
  - [ ] Warnings reviewed (if any)

- [ ] **Test Payment Flow**
  - [ ] Start dev server: `pnpm dev`
  - [ ] Navigate to checkout
  - [ ] Select Stripe payment method
  - [ ] Test with card: `4242 4242 4242 4242`
  - [ ] Complete test payment
  - [ ] Verify order created in database
  - [ ] Check Stripe Dashboard for payment

- [ ] **Test Webhook (Local)**
  - [ ] Start Stripe CLI forwarding
  - [ ] Make test payment
  - [ ] Verify webhook received in CLI output
  - [ ] Check server logs for webhook processing
  - [ ] Verify order status updated

- [ ] **Test Webhook (Production)**
  - [ ] Make test payment in production
  - [ ] Check Stripe Dashboard → Webhooks → Endpoint logs
  - [ ] Verify webhook succeeded (200 response)
  - [ ] Check order status in database
  - [ ] Verify email notifications sent

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Never committed API keys to git
- [ ] Using test keys (`sk_test_*`) in development only
- [ ] Using live keys (`sk_live_*`) in production only
- [ ] Webhook signature verification enabled
- [ ] Two-factor authentication enabled on Stripe account
- [ ] API keys stored securely (password manager)
- [ ] Webhook secrets stored securely

## Go Live Checklist

- [ ] All tests pass in development
- [ ] Test payments working correctly
- [ ] Webhooks receiving and processing correctly
- [ ] Order creation/update working
- [ ] Email notifications working
- [ ] Business verification completed in Stripe
- [ ] Bank account added in Stripe
- [ ] Production environment variables set
- [ ] Production webhook endpoint configured
- [ ] Tested with small real transaction
- [ ] Monitoring/alerts set up
- [ ] Refund process tested
- [ ] Customer support team briefed

## Monitoring Setup

- [ ] **Stripe Dashboard**
  - [ ] Check Developers → Logs regularly
  - [ ] Monitor Payments for failed transactions
  - [ ] Review Webhooks for delivery issues
  - [ ] Set up email alerts for disputes

- [ ] **Application Monitoring**
  - [ ] Log payment intent creation
  - [ ] Log webhook processing
  - [ ] Monitor payment success rates
  - [ ] Alert on webhook failures

## Documentation

- [ ] Read `STRIPE_SETUP_GUIDE.md` for detailed instructions
- [ ] Team members have access to Stripe Dashboard
- [ ] Support team knows how to check payment status
- [ ] Refund/chargeback process documented

---

## Quick Commands Reference

```bash
# Verify Stripe configuration
pnpm check:stripe

# Start development server
pnpm dev

# Start Stripe CLI webhook forwarding (separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook manually (requires Stripe CLI)
stripe trigger payment_intent.succeeded
```

## Test Card Numbers

- **Success**: `4242 4242 4242 4242`
- **3D Secure**: `4000 0027 6000 3184`
- **Declined**: `4000 0000 0000 0002`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Blocked

