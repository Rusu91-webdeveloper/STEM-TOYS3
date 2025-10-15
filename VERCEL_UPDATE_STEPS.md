# Update Production Verification Email Template (Vercel)

## Step-by-Step Guide

### Step 1: Access Your Production Database

Since you're on Vercel, you need to access your database directly. Based on your setup, you're likely using **Neon** or **Supabase**.

#### **For Neon Database**:

1. Go to https://console.neon.tech
2. Select your production project
3. Click on "SQL Editor" in the sidebar
4. You're ready to run the SQL!

#### **For Supabase**:

1. Go to https://supabase.com/dashboard
2. Select your production project
3. Click on "SQL Editor" in the sidebar
4. You're ready to run the SQL!

#### **For Other PostgreSQL Databases**:

Use any PostgreSQL client (pgAdmin, DBeaver, TablePlus, etc.) and connect to your production database.

---

### Step 2: Run the Update SQL

Copy the entire contents of `VERCEL_PRODUCTION_UPDATE.sql` and paste it into your database SQL editor.

**Important**: The SQL file contains:
1. The UPDATE query (updates the template)
2. A verification query (checks it worked)
3. Instructions for rollback (if needed)

---

### Step 3: Verify the Update

After running the UPDATE, you should see output like:

```
slug                 | name            | subject                                  | variables                                          | content_length | updatedAt           | isActive
---------------------|-----------------|------------------------------------------|---------------------------------------------------|----------------|---------------------|----------
account-verification | Confirmare Cont | Verifică-ți adresa de email - TechTots  | {userName,verificationLink,expiresIn,siteUrl}    | 2947           | 2025-10-15 XX:XX:XX | true
```

**Check**:
- ✅ `content_length` is ~2900 characters (was ~600 before)
- ✅ `variables` includes all 4: userName, verificationLink, expiresIn, siteUrl
- ✅ `subject` is "Verifică-ți adresa de email - TechTots"
- ✅ `updatedAt` is recent (just now)

---

### Step 4: Test in Production

1. **Register a new test user** in production
   - Go to https://your-production-domain.com/auth/register
   - Use a real email address you can check

2. **Check your email inbox**
   - You should receive the new professional verification email
   - ✅ Orange gradient header
   - ✅ Clickable "Verifică email-ul" button
   - ✅ Professional styling
   - ✅ Warning box with expiration info

3. **Click the verification button**
   - Should redirect to verification page
   - Should verify your account

---

### Step 5: Monitor

After the update, monitor for a few hours:

```sql
-- Check how many verification emails sent in last hour
SELECT 
  COUNT(*) as verification_emails_sent
FROM "EmailTriggerExecution" ete
JOIN "EmailTrigger" et ON et.id = ete."triggerId"
WHERE et.name = 'Email Verification - New User Registration'
  AND ete."executedAt" > NOW() - INTERVAL '1 hour';

-- Check for any failures
SELECT 
  ete."userId",
  ete.status,
  ete."errorMessage",
  ete."executedAt"
FROM "EmailTriggerExecution" ete
JOIN "EmailTrigger" et ON et.id = ete."triggerId"
WHERE et.name = 'Email Verification - New User Registration'
  AND ete.status = 'failed'
  AND ete."executedAt" > NOW() - INTERVAL '24 hours';
```

---

## Alternative: Use Vercel CLI (Advanced)

If you want to run the TypeScript script instead:

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link to your project
vercel link

# 4. Set production DATABASE_URL locally
vercel env pull .env.production

# 5. Run the update script with production DATABASE_URL
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) pnpm tsx scripts/update-verification-template.ts

# 6. Clean up
rm .env.production
```

**Note**: This is more complex. SQL method is recommended.

---

## Troubleshooting

### Issue: "Permission denied" when running UPDATE

**Solution**: Make sure you're connected with a user that has UPDATE permissions.

### Issue: "Table EmailTemplate does not exist"

**Solution**: You're connected to the wrong database. Double-check your connection string.

### Issue: Template updated but still seeing old emails

**Solution**: 
1. Check if you have multiple environments (staging vs production)
2. Verify you updated the correct database
3. Check Brevo/email service cache (may need to wait a few minutes)

### Issue: Want to rollback

**Solution**: Run this query with the old content you saved:

```sql
UPDATE "EmailTemplate"
SET 
  content = 'YOUR_OLD_CONTENT_HERE',
  variables = ARRAY['user.name', 'verificationUrl']::text[],
  subject = 'Confirmă-ți contul TechTots - Link de verificare',
  "updatedAt" = NOW()
WHERE slug = 'account-verification';
```

---

## Summary

✅ **Easiest**: Copy SQL from `VERCEL_PRODUCTION_UPDATE.sql` → Paste in database SQL editor → Run  
✅ **Time**: ~2 minutes  
✅ **Safe**: No code changes, only data update  
✅ **Reversible**: Can rollback with saved old content  

**After this update, all new users in production will receive the professional verification email!**
