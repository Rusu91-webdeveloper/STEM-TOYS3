# Netopia Payment Integration - Testing Guide

This guide will help you test the Netopia payment integration in your application.

## Prerequisites

Before testing, ensure you have:

1. **Netopia Merchant Account** - You need sandbox credentials from Netopia
2. **Environment Variables** - Configured in `.env.local`
3. **Development Server** - Running on `http://localhost:3000`

## Step 1: Verify Configuration

Run the diagnostic script to check your configuration:

```bash
node scripts/check-netopia-config.js
```

This will verify:
- ✅ Environment variables are set
- ✅ Netopia SDK is installed
- ✅ All required files are present
- ✅ SDK can initialize successfully

## Step 2: Set Up Environment Variables

Create or update your `.env.local` file with Netopia credentials:

```bash
# Netopia Payment Gateway Configuration

# Get these from your Netopia merchant account (Sandbox)
NETOPIA_API_KEY=your-sandbox-api-key-here
NETOPIA_SIGNATURE=your-sandbox-pos-signature-here

# Set to true for sandbox/testing environment
NETOPIA_SANDBOX=true

# Optional: Public key certificate for webhook verification
NETOPIA_WEBHOOK_SECRET=your-public-key-certificate-here

# Your site's base URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### How to Get Netopia Credentials

1. **Register** at [Netopia Payments](https://www.mobilpay.ro/)
2. **Create a Sandbox Account** in your merchant dashboard
3. **Generate API Credentials**:
   - API Key
   - POS Signature
   - Public Key Certificate (for webhooks)

## Step 3: Start the Development Server

```bash
pnpm run dev
```

The server should start on `http://localhost:3000`.

Check the console logs for Netopia initialization:

```
🔧 [NETOPIA] Initializing Netopia Provider...
   Environment: SANDBOX
   Base URL: http://localhost:3000
   API Key: xxxxx...
   Signature: xxxxx...
✅ [NETOPIA] Netopia SDK instance created successfully
```

## Step 4: Test the Payment Flow

### 4.1 Add Products to Cart

1. Navigate to the products page
2. Add one or more products to your cart
3. Verify the cart total is calculated correctly

### 4.2 Go to Checkout

1. Click on the cart icon
2. Click "Proceed to Checkout"
3. Fill in the shipping address form
4. Select a shipping method

### 4.3 Select Netopia Payment

1. On the payment step, select one of the Netopia options:
   - **Card bancar (Netopia)** - Credit/debit card payment
   - **Plată prin SMS (Netopia)** - SMS payment
   - **Portofel mobilPay (Netopia)** - Netopia wallet

2. Fill in the billing address (if different from shipping)
3. Click "Continue to Review"

### 4.4 Review and Place Order

1. Review your order details
2. Click "Place Order"
3. The system will:
   - Create an order in the database
   - Call the Netopia API to create a payment
   - Redirect you to the Netopia payment page

### 4.5 Complete Payment on Netopia

On the Netopia payment page:

1. **Sandbox Test Cards** (provided by Netopia):
   - Card Number: `4111 1111 1111 1111` (Visa)
   - Card Number: `5431 1111 1111 1111` (Mastercard)
   - Expiry: Any future date (e.g., `12/25`)
   - CVV: Any 3 digits (e.g., `123`)
   - Name: Any name

2. Enter the test card details
3. Complete the 3D Secure verification (if prompted)
4. Submit the payment

### 4.6 Verify Callback

After payment, you should be redirected back to:
- Success: `/checkout/netopia/callback`
- Failure: `/checkout/cancelled`

## Step 5: Monitor Console Logs

During testing, monitor the console for detailed logs:

### Successful Flow Logs:

```
═══════════════════════════════════════════════════════════
🚀 [API] Netopia Payment Creation Request Received
═══════════════════════════════════════════════════════════
📋 [API] Request Parameters:
   Order ID: ord_xxxxxxxxx
   Amount: 150 RON
   Payment Method: netopia_card
✅ [API] Request validation passed
🔧 [API] Initializing Netopia provider...
✅ [API] Netopia provider initialized successfully
🗄️  [API] Loading order data from database...
✅ [API] Order found in database
💱 [API] Preparing amount for Netopia...
✅ [API] Amount already in RON, no conversion needed
💳 [API] Creating Netopia payment...
✅ [API] Payment created successfully
📝 [API] Payment result:
   Payment URL: https://sandboxsecure.mobilpay.ro/...
   Transaction ID: xxxxx
✅ [API] Payment creation completed successfully
═══════════════════════════════════════════════════════════
```

### Error Flow Logs:

If there's an error, you'll see detailed information:

```
❌ [NETOPIA] Currency validation failed
   Expected: RON, Got: EUR
```

Or:

```
❌ [API] Failed to initialize Netopia provider:
   Missing required credentials
```

## Step 6: Test Webhook (IPN)

Webhooks require a public URL accessible from the internet. For local testing:

### Option 1: Using ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 3000`
3. Copy the public URL (e.g., `https://abc123.ngrok.io`)
4. Update `.env.local`:
   ```
   NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
   ```
5. Restart your development server
6. Complete a test payment
7. Netopia will send webhook notifications to:
   `https://abc123.ngrok.io/api/payments/netopia/webhook`

### Option 2: Deploy to Staging

Deploy your application to a staging environment (Vercel, etc.) and test with real webhook notifications.

## Step 7: Verify Database Updates

After a successful payment, check that the order was updated:

```sql
SELECT 
  id,
  orderNumber,
  paymentStatus,
  netopiaTransactionId,
  netopiaInvoiceId,
  netopiaPaymentUrl
FROM "Order"
WHERE id = 'your-order-id';
```

Expected results:
- `paymentStatus`: Should be `PAID` (after webhook)
- `netopiaTransactionId`: Should have a value
- `netopiaPaymentUrl`: Should contain the Netopia payment URL

## Troubleshooting

### Issue: "Missing required credentials"

**Solution**: Verify environment variables are set correctly:
```bash
node scripts/check-netopia-config.js
```

### Issue: "Currency validation failed"

**Solution**: Ensure your cart total is in RON, or the currency converter will handle it automatically.

### Issue: "No payment URL returned"

**Possible causes**:
1. Invalid API credentials
2. Incorrect sandbox/production environment setting
3. Account not activated in Netopia dashboard

**Solution**: 
- Double-check your credentials in the Netopia dashboard
- Verify `NETOPIA_SANDBOX=true` for testing
- Contact Netopia support if credentials are correct

### Issue: Webhook not working

**Possible causes**:
1. Using localhost (webhooks need public URL)
2. Missing `NETOPIA_WEBHOOK_SECRET`
3. Webhook endpoint not accessible

**Solution**:
- Use ngrok or deploy to a public URL
- Verify webhook endpoint is accessible: `curl https://your-url.com/api/payments/netopia/webhook`

## Test Scenarios

Test these scenarios to ensure complete functionality:

### ✅ Successful Payment
- [ ] Payment with RON currency
- [ ] Payment with EUR (auto-converts to RON)
- [ ] Order status updates to PAID
- [ ] Webhook received and processed

### ✅ Failed Payment
- [ ] User cancels payment on Netopia page
- [ ] Invalid card details
- [ ] Order status remains PENDING

### ✅ Edge Cases
- [ ] Empty cart (should prevent checkout)
- [ ] Missing customer information
- [ ] Network timeout during payment creation
- [ ] Duplicate payment attempts

## Production Checklist

Before going live with Netopia:

- [ ] Switch `NETOPIA_SANDBOX=false`
- [ ] Update to production API credentials
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain
- [ ] Test webhook endpoint is accessible from internet
- [ ] Set up SSL certificate (HTTPS required)
- [ ] Test with real card (small amount)
- [ ] Monitor logs for first few transactions
- [ ] Set up error alerting

## Support

If you encounter issues:

1. **Check Logs**: Review console logs for detailed error messages
2. **Run Diagnostic**: `node scripts/check-netopia-config.js`
3. **Netopia Support**: Contact Netopia technical support
4. **Documentation**: [Netopia Node.js SDK](https://github.com/mobilpay/Node.js)

## Currency Conversion

The integration automatically handles currency conversion to RON:

- **Supported Currencies**: RON, EUR, USD, GBP
- **Exchange Rates**: Approximate, updated periodically
- **Display**: Shows both original and converted amounts

Example:
```
Original: €30.00 EUR
Charged: 149.10 RON
Rate: 1 EUR = 4.97 RON
```

## Success Criteria

Your integration is working correctly when:

1. ✅ Diagnostic script passes all checks
2. ✅ Payment URL is generated successfully
3. ✅ User can complete payment on Netopia
4. ✅ Webhook updates order status to PAID
5. ✅ No errors in console logs
6. ✅ Customer receives confirmation email

---

**Last Updated**: 2025-01-17
**Netopia SDK Version**: 0.1.7

