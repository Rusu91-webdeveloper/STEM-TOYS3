# Email Verification System - Testing Guide

## 🧪 Quick Testing Steps

### Prerequisites

- Development server should be running (`pnpm run dev`)
- Database should have templates and triggers seeded
- Brevo API credentials configured in `.env`

---

## Test 1: New User Registration

### Steps:

1. **Navigate to Registration Page**

   ```
   http://localhost:3000/auth/register
   ```

2. **Fill Registration Form**
   - Name: `Test User`
   - Email: `test@example.com` (use your real email for testing)
   - Password: `TestPassword123!`

3. **Submit Form**

4. **Check Console Output** (Terminal where dev server is running)

   You should see:

   ```
   ✅ User created: <user-id> (test@example.com)
   🎯 Email triggers processed for segment: NEW
   🎉 Welcome email sent directly (fallback) to test@example.com
   📧 Verification email sent directly (fallback) to test@example.com

   ✨ Registration completed for test@example.com
      - User ID: <user-id>
      - Segment: NEW
      - Email triggers: Processed
      - Direct emails: Sent as fallback
   ```

5. **Check Development Console**

   In development mode, you'll see:

   ```
   ------- VERIFICATION DETAILS -------
   Email: test@example.com
   Name: Test User
   Token: <verification-token>

   🔗 Verification Link (click or copy/paste):
   http://localhost:3000/auth/verify?token=<token>&email=test%40example.com
   ---------------------------------------
   ```

6. **Check Email Inbox**

   You should receive **TWO emails**:

   **Email 1: Welcome Email**
   - Subject: "Bun venit la STEM Toys! 🚀 Aventura ta de învățare începe"
   - Contains: 10% discount coupon
   - Template: "welcome-new-user"

   **Email 2: Verification Email**
   - Subject: "Confirmă-ți contul TechTots - Link de verificare"
   - Contains: Verification link
   - Template: "account-verification"

---

## Test 2: Verify Database Logs

### Check User Creation

```sql
SELECT
  id,
  name,
  email,
  segment,
  "emailVerified",
  "verificationToken",
  "isActive",
  "createdAt"
FROM "User"
WHERE email = 'test@example.com';
```

**Expected**:

- segment = 'NEW'
- emailVerified = null
- verificationToken = <token>
- isActive = false

### Check Trigger Executions

```sql
SELECT
  ete.id,
  et.name as trigger_name,
  et.priority,
  ete.status,
  ete."executionData",
  ete."actionResult",
  ete."executedAt"
FROM "EmailTriggerExecution" ete
JOIN "EmailTrigger" et ON et.id = ete."triggerId"
WHERE ete."userId" = '<user-id-from-above>'
ORDER BY ete."executedAt" DESC;
```

**Expected**: 2 executions

1. "Welcome Email - New User Registration" (Priority: 100, status: 'success')
2. "Email Verification - New User Registration" (Priority: 99, status:
   'success')

### Check Email Logs

```sql
SELECT
  id,
  "templateId",
  "to",
  subject,
  status,
  "sentAt",
  "deliveredAt",
  error
FROM "EmailLog"
WHERE "to" = 'test@example.com'
ORDER BY "createdAt" DESC
LIMIT 5;
```

**Expected**: At least 2 emails logged

---

## Test 3: Verify Email Delivery in Brevo

1. **Login to Brevo Dashboard**

   ```
   https://app.brevo.com/
   ```

2. **Navigate to Campaigns → Transactional Emails**

3. **Search for** `test@example.com`

4. **Verify Delivery Status**
   - Email 1: Welcome email - Delivered ✅
   - Email 2: Verification email - Delivered ✅

5. **Check Email Content**
   - Open each email
   - Verify template variables replaced correctly
   - Test verification link

---

## Test 4: Click Verification Link

1. **Copy Verification Link** from console or email

2. **Open in Browser**

   ```
   http://localhost:3000/auth/verify?token=<token>&email=test%40example.com
   ```

3. **Expected Result**
   - User redirected to success page
   - User's `emailVerified` field updated with timestamp
   - User's `isActive` field set to `true`

4. **Verify in Database**

   ```sql
   SELECT
     email,
     "emailVerified",
     "isActive"
   FROM "User"
   WHERE email = 'test@example.com';
   ```

   **Expected**:
   - emailVerified = <timestamp>
   - isActive = true

---

## Test 5: Test Fallback System

### Temporarily Disable Triggers

1. **Disable verification trigger**:

   ```sql
   UPDATE "EmailTrigger"
   SET "isActive" = false
   WHERE name = 'Email Verification - New User Registration';
   ```

2. **Register another user**
   - Email: `test2@example.com`

3. **Expected Result**:
   - Trigger execution fails or skips
   - Fallback direct email call succeeds
   - User still receives verification email

4. **Re-enable trigger**:
   ```sql
   UPDATE "EmailTrigger"
   SET "isActive" = true
   WHERE name = 'Email Verification - New User Registration';
   ```

---

## Test 6: Production Deployment Checklist

Before deploying to production:

### 1. Environment Variables

```bash
# Check all required vars are set
echo $DATABASE_URL
echo $BREVO_API_KEY
echo $BREVO_FROM_EMAIL
echo $NEXT_PUBLIC_SITE_URL
```

### 2. Database Migration

```bash
# Run migrations
pnpm prisma migrate deploy

# Seed templates (if not already seeded in production)
pnpm tsx scripts/seed-email-templates.ts

# Seed triggers (if not already seeded in production)
pnpm tsx scripts/seed-email-triggers.ts

# Verify verification trigger exists
pnpm tsx scripts/add-verification-email-trigger.ts
```

### 3. Test in Production

- Register with real email
- Verify both emails received
- Check Brevo logs
- Test verification link
- Monitor error logs

### 4. Monitor Metrics

```sql
-- Daily verification rate
SELECT
  DATE("createdAt") as date,
  COUNT(*) as total_registrations,
  COUNT(*) FILTER (WHERE "emailVerified" IS NOT NULL) as verified,
  COUNT(*) FILTER (WHERE "emailVerified" IS NOT NULL) * 100.0 / COUNT(*) as verification_rate
FROM "User"
WHERE segment = 'NEW'
  AND "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

---

## 🐛 Troubleshooting

### Problem: No Emails Received

**Checks**:

1. ✅ Brevo API key valid?
2. ✅ Email templates exist in database?
3. ✅ Email triggers active?
4. ✅ User segment = 'NEW'?
5. ✅ Trigger executions logged?
6. ✅ Brevo dashboard shows sent?

**Solutions**:

```bash
# Re-seed templates
pnpm tsx scripts/seed-email-templates.ts

# Re-create verification trigger
pnpm tsx scripts/add-verification-email-trigger.ts

# Check console logs
tail -f .next/server.log
```

### Problem: Only Welcome Email Received

**Likely Cause**: Verification template slug mismatch

**Fix**:

```typescript
// Verify in lib/email/database-template-service.ts
templateSlug: "account-verification"; // Must match database
```

**Verify Template**:

```sql
SELECT slug FROM "EmailTemplate" WHERE name LIKE '%verification%';
```

### Problem: Duplicate Emails

**Expected**: This is normal! Both trigger AND fallback send emails for
redundancy.

**To Remove Fallback** (not recommended):

```typescript
// In app/api/auth/register/route.ts
// Comment out lines 113-158 (fallback email calls)
```

---

## ✅ Success Criteria

- [ ] User registration creates user with segment 'NEW'
- [ ] Console shows trigger processing success
- [ ] Two EmailTriggerExecution records created
- [ ] Welcome email received in inbox
- [ ] Verification email received in inbox
- [ ] Both templates render correctly
- [ ] Verification link works
- [ ] User emailVerified updated after verification
- [ ] Brevo dashboard shows both emails delivered
- [ ] No errors in console or logs

---

## 📊 Monitoring Queries

### Check Recent Registrations

```sql
SELECT
  email,
  name,
  segment,
  "emailVerified",
  "isActive",
  "createdAt"
FROM "User"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;
```

### Check Failed Trigger Executions

```sql
SELECT
  u.email,
  et.name,
  ete.status,
  ete."errorMessage",
  ete."executedAt"
FROM "EmailTriggerExecution" ete
JOIN "EmailTrigger" et ON et.id = ete."triggerId"
JOIN "User" u ON u.id = ete."userId"
WHERE ete.status = 'failed'
  AND ete."executedAt" > NOW() - INTERVAL '24 hours'
ORDER BY ete."executedAt" DESC;
```

### Check Email Delivery Rate

```sql
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM "EmailLog"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

---

**Happy Testing! 🚀**
