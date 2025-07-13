# 🚨 Authentication Fix Checklist - Google OAuth Not Working in Production

## **IMMEDIATE ACTIONS NEEDED**

### Step 1: Fix Vercel Environment Variables (CRITICAL)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `stem-toys-3`
3. **Navigate to**: Settings → Environment Variables
4. **Add this variable** (if missing):

   ```
   Name: NEXTAUTH_URL
   Value: https://stem-toys-3.vercel.app
   Environment: Production
   ```

5. **Verify these variables exist**:
   ```
   NEXTAUTH_SECRET (should be 32+ characters)
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   DATABASE_URL
   ```

### Step 2: Update Google Cloud Console (CRITICAL)

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Navigate to**: APIs & Services → Credentials
3. **Click on your OAuth 2.0 Client ID**
4. **In "Authorized redirect URIs", add**:
   ```
   https://stem-toys-3.vercel.app/api/auth/callback/google
   ```
5. **Keep your existing localhost URI**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. **Save changes**

### Step 3: Redeploy on Vercel

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on latest deployment
3. Wait for deployment to complete

## **DEBUGGING TOOLS**

### Debug Page (Use This First!)

Visit this URL to diagnose issues:

```
https://stem-toys-3.vercel.app/debug-auth
```

This page will show you:

- ✅ Which environment variables are set
- ❌ Which ones are missing
- 🔧 Specific actions to take
- 📋 Exact URLs for Google OAuth setup

### Debug API Endpoint

For raw JSON data:

```
https://stem-toys-3.vercel.app/api/auth/debug
```

## **COMMON ISSUES & SOLUTIONS**

### Issue 1: "Verificare esuată" (Verification Failed)

**Cause**: Missing NEXTAUTH_URL environment variable **Solution**: Add
`NEXTAUTH_URL=https://stem-toys-3.vercel.app` to Vercel

### Issue 2: Redirect to localhost in production

**Cause**: NEXTAUTH_URL pointing to localhost **Solution**: Set correct
production URL in Vercel environment variables

### Issue 3: "invalid_request" from Google OAuth

**Cause**: Wrong redirect URI in Google Cloud Console **Solution**: Add
production callback URL to Google OAuth settings

### Issue 4: "Configuration Error"

**Cause**: Missing Google OAuth credentials or NEXTAUTH_SECRET **Solution**:
Verify all credentials are set in Vercel environment variables

## **VERIFICATION STEPS**

After making changes:

1. **Visit debug page**: https://stem-toys-3.vercel.app/debug-auth
2. **Check all items are green ✅**
3. **Test Google sign-in**: https://stem-toys-3.vercel.app/auth/login
4. **Verify no localhost redirects occur**

## **ENVIRONMENT VARIABLES CHECKLIST**

Copy this checklist and verify each variable in Vercel:

```bash
# Required for NextAuth
□ NEXTAUTH_URL=https://stem-toys-3.vercel.app
□ NEXTAUTH_SECRET=[32+ character secret]

# Required for Google OAuth
□ GOOGLE_CLIENT_ID=[your-google-client-id]
□ GOOGLE_CLIENT_SECRET=[your-google-client-secret]

# Required for Database
□ DATABASE_URL=[your-database-url]

# Optional but recommended
□ STRIPE_SECRET_KEY=[if using payments]
□ RESEND_API_KEY=[if using emails]
```

## **GOOGLE OAUTH REDIRECT URIs CHECKLIST**

In Google Cloud Console, verify these URIs:

```bash
# Development
□ http://localhost:3000/api/auth/callback/google

# Production
□ https://stem-toys-3.vercel.app/api/auth/callback/google
```

## **TROUBLESHOOTING COMMANDS**

If you need to debug locally:

```bash
# Check your local environment variables
npm run check-env

# Test authentication locally
npm run dev
# Then visit: http://localhost:3000/debug-auth
```

## **QUICK TEST AFTER FIXES**

1. Open incognito window
2. Go to: https://stem-toys-3.vercel.app/auth/login
3. Click "Sign in with Google"
4. Should redirect to Google (not localhost)
5. After Google auth, should return to your site (not localhost)

## **STILL HAVING ISSUES?**

If authentication still fails after following this checklist:

1. **Check the debug page**: https://stem-toys-3.vercel.app/debug-auth
2. **Look for red ❌ indicators**
3. **Follow the specific recommendations shown**
4. **Redeploy after each change**

## **SECURITY NOTES**

- Never commit your `.env` file to Git
- Use different Google OAuth credentials for development vs production
- Regularly rotate your NEXTAUTH_SECRET
- Monitor authentication logs in Vercel dashboard

---

**Expected Fix Time**: 5-15 minutes after following this checklist **Most Common
Issue**: Missing NEXTAUTH_URL environment variable (95% of cases)
