# Stripe Setup Guide for Romanian E-Commerce

Complete step-by-step guide to set up Stripe as a secondary payment provider alongside Netopia.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your project's environment variables
- Basic understanding of Stripe Dashboard

---

## Step 1: Create/Verify Stripe Account

1. **Sign up or log in** at https://stripe.com
2. **Select Romania** as your business country
3. **Complete business verification** (required for live payments):
   - Business information
   - Bank account details
   - Identity verification
4. **Activate your account** (can start with test mode immediately)

---

## Step 2: Get Your API Keys

### 2.1 Test Mode Keys (for development)

1. Navigate to **Developers** → **API keys** in Stripe Dashboard
2. Ensure **Test mode toggle** is ON (switch in top-right)
3. Copy these keys:

   ```
   Publishable key: pk_test_...
   Secret key: sk_test_...
   ```

4. **Important**: Keep secret keys secure - never commit them to git!

### 2.2 Live Mode Keys (for production)

1. Toggle to **Live mode** in Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. Copy these keys:

   ```
   Publishable key: pk_live_...
   Secret key: sk_live_...
   ```

4. **Security**: Live keys process real payments - handle with extreme care!

---

## Step 3: Set Up Webhook Endpoints

### 3.1 For Local Development (using Stripe CLI)

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`) displayed in terminal
   - Use this for `STRIPE_WEBHOOK_SECRET` in your `.env.local`

### 3.2 For Production

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/stripe/webhook
   ```
4. **Select events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.requires_action`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `charge.dispute.created`
5. Click **Add endpoint**
6. **Copy the webhook signing secret**:
   - Click on your endpoint
   - Under "Signing secret", click **Reveal**
   - Copy the secret (starts with `whsec_`)
   - Use this for `STRIPE_WEBHOOK_SECRET` in production

---

## Step 4: Configure Environment Variables

### 4.1 Development (.env.local)

Create or update `.env.local` in your project root:

```env
# =============================================================================
# STRIPE CONFIGURATION - TEST MODE
# =============================================================================

# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Currency Configuration (RON for Romania)
STRIPE_DEFAULT_CURRENCY=ron
NEXT_PUBLIC_STRIPE_CURRENCY=ron

# Enable Stripe as Second Payment Provider
NEXT_PUBLIC_STRIPE_ENABLED=true

# Payment Provider Rollout Configuration
NEXT_PUBLIC_NETOPIA_ENABLED=true
GRADUAL_ROLLOUT_PERCENTAGE=50  # 50% of users see Stripe option
ROLLOUT_STRATEGY=percentage
TARGET_COUNTRIES=RO
TARGET_LOCALES=ro,ro-RO
```

### 4.2 Production (Vercel/Railway/etc.)

Add these environment variables in your hosting platform:

```env
# =============================================================================
# STRIPE CONFIGURATION - LIVE MODE
# =============================================================================

# Stripe API Keys (Live Mode - REAL PAYMENTS!)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret_here

# Currency Configuration
STRIPE_DEFAULT_CURRENCY=ron
NEXT_PUBLIC_STRIPE_CURRENCY=ron

# Enable Stripe
NEXT_PUBLIC_STRIPE_ENABLED=true

# Payment Provider Configuration
NEXT_PUBLIC_NETOPIA_ENABLED=true
GRADUAL_ROLLOUT_PERCENTAGE=100  # All users can choose Stripe
ROLLOUT_STRATEGY=percentage
TARGET_COUNTRIES=RO
TARGET_LOCALES=ro,ro-RO
```

### 4.3 Vercel Setup (if using Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - Click **Add New**
   - Enter variable name (e.g., `STRIPE_SECRET_KEY`)
   - Enter variable value (e.g., `sk_live_...`)
   - Select environment (Production, Preview, Development)
   - Click **Save**
4. **Important**: Set Production variables to use `sk_live_*` keys only!

---

## Step 5: Verify Configuration

### Build-time behavior and gating

- Stripe webhook initialization happens at request time, not at build time.
- If `NEXT_PUBLIC_STRIPE_ENABLED` is not set to `true`, the webhook endpoint will acknowledge events without processing.
- In production, when enabled, the server requires live keys (`sk_live_*`) and a valid `STRIPE_WEBHOOK_SECRET`.

### 5.1 Check Environment Variables are Loaded

```bash
# In your project directory
node -e "console.log('Stripe Enabled:', process.env.NEXT_PUBLIC_STRIPE_ENABLED)"
```

### 5.2 Test Payment Intent Creation

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to checkout page
3. Select Stripe payment method
4. Check browser console for any errors
5. Check server logs for payment intent creation

### 5.3 Test Webhook (Local)

1. Start Stripe CLI webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. Trigger a test payment in your app
3. Check Stripe CLI output for webhook events
4. Verify your server logs show webhook processing

### 5.4 Test Payment with Test Cards

Stripe provides test card numbers for testing:

**Successful Payment**:
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**3D Secure Authentication**:
```
Card: 4000 0027 6000 3184
```

**Declined Payment**:
```
Card: 4000 0000 0000 0002
```

---

## Step 6: Monitor Stripe Dashboard

### 6.1 Payment Activity

- **Developers** → **Logs**: View API requests and responses
- **Payments**: See all payment attempts (test and live)
- **Events**: Monitor webhook events

### 6.2 Webhook Monitoring

- **Developers** → **Webhooks**: Check endpoint status
- Click on your endpoint to see:
  - Success/failure rates
  - Recent events
  - Response codes

---

## Step 7: Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use test keys (`sk_test_*`) in development
- [ ] Use live keys (`sk_live_*`) only in production
- [ ] Verify webhook signatures in production
- [ ] Enable two-factor authentication on Stripe account
- [ ] Restrict API key permissions if possible
- [ ] Monitor for suspicious activity in Stripe Dashboard
- [ ] Keep Stripe SDK updated

---

## Step 8: Common Issues & Solutions

### Issue: "Stripe publishable key is not configured"

**Solution**: Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in `.env.local` and restart dev server.

### Issue: "Webhook signature verification failed"

**Solution**: 
- Check `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint secret
- For local dev, use the secret from Stripe CLI output
- Ensure webhook endpoint URL matches exactly

### Issue: "Invalid Stripe secret key format"

**Solution**: 
- Ensure key starts with `sk_test_` (test) or `sk_live_` (production)
- Check for extra spaces or newlines in environment variable
- Verify you're using the correct key for your environment

### Issue: Payment Intent creation fails

**Solution**:
- Check Stripe Dashboard → Developers → Logs for error details
- Verify amount is in minor units (e.g., 100 = 1.00 RON)
- Ensure user is authenticated
- Check API key has correct permissions

### Issue: Webhooks not received in production

**Solution**:
- Verify webhook URL is publicly accessible (no localhost)
- Check webhook endpoint exists at `/api/stripe/webhook`
- Verify SSL certificate is valid (required for webhooks)
- Check firewall/security groups allow Stripe IPs

---

## Step 9: Romania-Specific Configuration

### 9.1 Currency Settings

Your setup uses **RON (Romanian Leu)** by default:
- All amounts are in RON
- Stripe handles currency conversion if needed
- Customers see prices in RON

### 9.2 3D Secure (PSD2 Compliance)

Stripe automatically handles 3D Secure for Romanian cards:
- Enabled via `automatic_payment_methods.allow_redirects: "always"`
- Customers are redirected to bank authentication when required
- Webhook handles `payment_intent.requires_action` event

### 9.3 Payment Methods Available

With Stripe in Romania, customers can use:
- Visa/Mastercard cards
- Apple Pay / Google Pay (if supported)
- Bank redirects (via Payment Element)
- SEPA Direct Debit (if enabled)

---

## Step 10: Go Live Checklist

Before enabling live payments:

- [ ] Complete Stripe business verification
- [ ] Test all payment flows with test cards
- [ ] Verify webhook endpoint in production
- [ ] Test webhook event handling
- [ ] Set up monitoring/alerts
- [ ] Configure refund/dispute handling
- [ ] Test with small real transaction first
- [ ] Enable live mode keys in production environment
- [ ] Set `NEXT_PUBLIC_STRIPE_ENABLED=true` in production
- [ ] Monitor first few live payments closely

---

## Additional Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Romania Guide**: https://stripe.com/global#romania
- **Stripe Support**: https://support.stripe.com
- **Stripe API Reference**: https://stripe.com/docs/api
- **Webhook Testing**: https://stripe.com/docs/webhooks/test

---

## Quick Reference

### Environment Variables Summary

| Variable | Purpose | Test Value | Live Value |
|----------|---------|------------|------------|
| `STRIPE_SECRET_KEY` | Server-side API access | `sk_test_...` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side payment UI | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | `whsec_...` (CLI) | `whsec_...` (Dashboard) |
| `STRIPE_DEFAULT_CURRENCY` | Default currency | `ron` | `ron` |
| `NEXT_PUBLIC_STRIPE_ENABLED` | Enable Stripe in UI | `true` | `true` |

### Key URLs

- **Dashboard**: https://dashboard.stripe.com
- **API Keys**: https://dashboard.stripe.com/apikeys
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Test Cards**: https://stripe.com/docs/testing

---

**Need Help?** Check Stripe Dashboard → Help or contact Stripe Support.

