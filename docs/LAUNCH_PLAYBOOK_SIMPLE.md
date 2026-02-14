# STEM-TOYS Launch Playbook (Very Simple Version)

This guide is written for you as founder + junior developer.
It uses simple words.
It tells you exactly what to do before launch, at launch, and after launch.

Use this if your setup is:
- Suppliers: `Boribon`, `Kidstory`
- Courier: `FanCourier`
- Payments: `Stripe`, `Netopia`, `Cash on Delivery (COD)`
- Checkout policy: users must be logged in before placing an order

---

## 1. What "ready for launch" means

You are ready only if all these are true:

1. People can open your site and place orders.
2. Card payments are confirmed by Stripe and Netopia.
3. COD orders are created correctly.
4. FanCourier AWB is created for normal orders.
5. Mixed supplier orders (Boribon + Kidstory in same cart) are marked for manual review.
6. Tracking number is real, never fake.
7. If user is not logged in, checkout is blocked.

If one of these fails, launch is **NO-GO**.

---

## 2. Important words (simple explanation)

- `Environment variable`: a secret setting (key/value) your app needs.
- `Webhook`: a "doorbell" from payment company to your app saying "payment happened".
- `AWB`: shipping label number from courier.
- `Manual review`: order needs human attention, not automatic shipping.
- `Production`: your real live website used by customers.

---

## 3. Hard blockers you must fix first

These are blockers found in your current setup.

1. `NEXTAUTH_URL` is localhost.
2. `NEXT_PUBLIC_SITE_URL` is localhost.
3. Stripe keys are test keys (`sk_test`, `pk_test`), not live keys.
4. `NETOPIA_SANDBOX` is `true` (must be `false` for real launch).
5. `NETOPIA_WEBHOOK_SECRET` looks incomplete.

If any one stays wrong, do not launch.

---

## 4. Exact environment settings you need in production

Set these in your hosting panel production environment (for example Vercel Project Settings -> Environment Variables).

## 4.1 Core site/auth

```env
NEXTAUTH_URL=https://your-real-domain.ro
NEXT_PUBLIC_SITE_URL=https://your-real-domain.ro
```

Rules:
1. Must start with `https://`
2. Must be your real public domain
3. Must not be `localhost`

## 4.2 Stripe (live mode)

```env
NEXT_PUBLIC_STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_DEFAULT_CURRENCY=ron
NEXT_PUBLIC_STRIPE_CURRENCY=ron
```

Rules:
1. Secret key must start with `sk_live_`
2. Publishable keys must start with `pk_live_`
3. Keep keys private, never commit to git

## 4.3 Netopia (production mode)

```env
NEXT_PUBLIC_NETOPIA_ENABLED=true
NETOPIA_API_KEY=...
NETOPIA_SIGNATURE=...
NETOPIA_MERCHANT_ID=...
NETOPIA_SANDBOX=false
NETOPIA_WEBHOOK_SECRET=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
```

Rules:
1. `NETOPIA_SANDBOX` must be `false`
2. Webhook secret/public key must have full begin and end lines
3. No broken key formatting

## 4.4 FanCourier

```env
FANCOURIER_BASE_URL=https://api.fancourier.ro
FANCOURIER_CLIENT_ID=...
FANCOURIER_USERNAME=...
FANCOURIER_PASSWORD=...
FANCOURIER_SENDER_NAME=...
FANCOURIER_SENDER_PHONE=...
FANCOURIER_SENDER_EMAIL=...
FANCOURIER_SENDER_COUNTY=...
FANCOURIER_SENDER_LOCALITY=...
FANCOURIER_SENDER_STREET=...
FANCOURIER_SENDER_NUMBER=...
FANCOURIER_SENDER_POSTAL_CODE=...
```

Rules:
1. All sender fields must match your real pickup address
2. Password must be correct
3. Keep credentials private

---

## 5. Webhook URLs you must set in payment dashboards

Your real domain example: `https://your-real-domain.ro`

## 5.1 Stripe webhook URL

Set this endpoint in Stripe Dashboard:

`https://your-real-domain.ro/api/stripe/webhook`

Select at least these Stripe events:
1. `payment_intent.succeeded`
2. `payment_intent.payment_failed`
3. `payment_intent.requires_action`
4. `payment_intent.canceled`
5. `charge.refunded`
6. `charge.dispute.created`

## 5.2 Netopia notify/callback URLs

Set these in Netopia:

1. Notify URL:
`https://your-real-domain.ro/api/payments/netopia/webhook`

2. Redirect URL:
`https://your-real-domain.ro/checkout/netopia/callback`

3. Cancel URL:
`https://your-real-domain.ro/checkout/cancelled`

Important:
1. These must be public internet URLs
2. They cannot be localhost

---

## 6. Copy-paste commands before launch

Run inside project root:

```bash
pnpm check:env
pnpm check:auth-config
pnpm check:stripe
node scripts/check-netopia-config.js
pnpm test:e2e:list
pnpm test:e2e:smoke
```

How to read results:
1. Any red error means stop and fix.
2. Warnings can still be important. Read them.
3. Smoke test must pass before launch.

---

## 7. Production verification sequence (the exact order)

Do these steps in this exact order.
Use small real test orders.
Use low price products for testing.

## Step 1: Check login-only checkout

Goal: make sure guest users cannot checkout.

1. Open private/incognito browser.
2. Go to `https://your-real-domain.ro/checkout`.
3. Expected result: redirected to login page (`/auth/login`).

If not redirected:
1. Stop launch.
2. Fix auth protection first.

## Step 2: COD order with Boribon only

Goal: make sure normal COD flow works.

1. Log in with test customer account.
2. Add one Boribon physical product.
3. Pay with COD.
4. Open admin orders page.
5. Find this order and open details.

Expected:
1. Order exists.
2. Payment method is COD.
3. Status is processing flow (not failed).
4. Supplier order exists.
5. AWB creation is attempted.
6. If AWB fails, order is marked for shipping review with a reason.

## Step 3: COD order with Kidstory only

Goal: same as Step 2, but with second supplier.

Expected:
1. Same pass conditions as Step 2.
2. No hidden errors in admin.

## Step 4: Stripe real payment

Goal: check Stripe live flow and webhook.

1. Log in as test customer.
2. Add one physical product.
3. Pay with Stripe card.
4. In Stripe Dashboard, confirm event delivery success.
5. Open admin order.

Expected:
1. Payment status becomes paid.
2. No duplicate supplier orders.
3. No duplicate AWB creation.

## Step 5: Stripe webhook retry check

Goal: make sure retry does not duplicate work.

1. In Stripe Dashboard, replay same webhook event.
2. Check same order again.

Expected:
1. No new duplicate supplier orders.
2. No second AWB for same order.

## Step 6: Netopia real payment

Goal: check Netopia live flow and notify URL.

1. Log in as test customer.
2. Add one physical product.
3. Pay with Netopia.
4. Confirm Netopia callback/notify succeeds.
5. Open admin order.

Expected:
1. Payment status updates correctly.
2. Supplier order created once.
3. AWB creation logic runs once.

## Step 7: Netopia webhook retry check

Goal: same idempotency check as Stripe.

1. Replay/resend same Netopia notification (if dashboard allows).
2. Re-check order.

Expected:
1. No duplicate supplier orders.
2. No duplicate AWB.

## Step 8: Mixed supplier order (Boribon + Kidstory in one cart)

Goal: verify manual review rule.

1. Log in as test customer.
2. Add one Boribon product and one Kidstory product.
3. Place order (COD is easiest for this check).
4. Go to admin orders page.
5. Filter status: `Needs Shipping Review`.

Expected:
1. Order appears in shipping review queue.
2. `Shipping Review` warning is visible.
3. Review reason is visible.
4. No invalid auto shipping action for mixed supplier order.

## Step 9: Tracking without AWB

Goal: ensure no fake tracking shown.

1. Pick an order without AWB yet.
2. Open customer tracking flow.

Expected:
1. Tracking says not available.
2. Tracking number is empty/null.
3. Carrier is empty/null.
4. No random fake tracking number.

## Step 10: Tracking with AWB

Goal: ensure real tracking is shown after AWB exists.

1. Pick an order with real AWB.
2. Open customer tracking.

Expected:
1. Tracking available is true.
2. Tracking number is real AWB.
3. Carrier shows correct courier.

---

## 8. How to use admin during launch

Use this page:

`/admin/orders`

What to watch:
1. New orders appear quickly.
2. Filter `Needs Shipping Review` shows flagged orders.
3. Orders stuck too long in processing are investigated.
4. Never delete real customer orders during launch window.

For each flagged order:
1. Read review reason.
2. Decide manual action (manual AWB, customer call, supplier split plan).
3. Update status only when real progress happened.

---

## 9. Go/No-Go checklist (print this)

Mark each line with YES/NO.

1. `NEXTAUTH_URL` is real HTTPS domain, not localhost: [ ]
2. `NEXT_PUBLIC_SITE_URL` is real HTTPS domain, not localhost: [ ]
3. Stripe keys are live (`sk_live`, `pk_live`): [ ]
4. Stripe webhook endpoint is configured and receiving events: [ ]
5. Netopia sandbox is OFF (`NETOPIA_SANDBOX=false`): [ ]
6. Netopia notify/callback URLs are public and correct: [ ]
7. Netopia key/cert is complete and valid: [ ]
8. FanCourier credentials and sender address are correct: [ ]
9. Guest checkout is blocked and redirects to login: [ ]
10. COD single-supplier order test passed: [ ]
11. Stripe payment + retry test passed: [ ]
12. Netopia payment + retry test passed: [ ]
13. Mixed supplier order goes to manual review: [ ]
14. Tracking without AWB shows unavailable (not fake): [ ]
15. Tracking with AWB shows real values: [ ]

Decision rule:
1. If any line is NO, launch is NO-GO.
2. Launch only when all are YES.

---

## 10. Launch day timeline

## T-24 hours

1. Freeze risky code changes.
2. Confirm all env values in production panel.
3. Run command checks again.
4. Prepare 2 people on standby:
   1. one for technical monitoring
   2. one for customer/operations

## T-3 hours

1. Run smoke tests.
2. Place one final small test order in production.
3. Verify payment + supplier + AWB + tracking.

## T-30 minutes

1. Open dashboards (hosting logs, Stripe, Netopia, admin orders).
2. Keep incident notes document open.
3. Make sure phone contact for suppliers and courier is ready.

## Launch moment

1. Open store to customers.
2. Watch first orders live.
3. Check every payment webhook delivery.

## First 48 hours (hypercare)

1. Review each new order quickly.
2. Review first 100 orders manually.
3. Check `Needs Shipping Review` queue every hour.
4. Respond fast to failed payment, missing AWB, stock mismatch.

---

## 11. Problem -> what to do fast

## Stripe payment paid but order not updated

1. Check Stripe event delivery status.
2. Check webhook endpoint URL.
3. Replay event from Stripe dashboard.
4. Re-open order in admin and verify no duplicates.

## Netopia paid but order still pending

1. Check Netopia notify URL and response.
2. Check `NETOPIA_SANDBOX` is false in production.
3. Check Netopia key/cert formatting.
4. Resend notification if possible.

## FanCourier AWB failed

1. Open order in admin.
2. Read shipping review reason.
3. Create AWB manually in FanCourier portal if needed.
4. Save real AWB back in system.

## Mixed supplier order confusion

1. Keep order in manual review.
2. Split fulfillment plan manually (Boribon part, Kidstory part).
3. Communicate clear ETA to customer.

---

## 12. Final advice (simple)

1. Do not rush launch with red blockers.
2. Small real tests are better than assumptions.
3. First 100 orders are your truth.
4. If something is unclear, pause, verify, then continue.

You are very close. A clean and careful launch beats a fast and risky launch.

