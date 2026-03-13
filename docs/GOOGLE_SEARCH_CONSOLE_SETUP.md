# Google Search Console (GSC) Setup Guide

This guide will walk you through setting up Google Search Console API access to
enable live SEO data in your dashboard.

For the post-setup indexing sequence, see
[docs/SEARCH_CONSOLE_INDEXING_ROLLOUT.md](/Users/emanuelrusu/Desktop/MVPs/STEM-TOYS3/docs/SEARCH_CONSOLE_INDEXING_ROLLOUT.md).

## Prerequisites

- A Google account with access to Google Cloud Console
- Your website verified in Google Search Console
- Access to your project's environment variables

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "TechTots SEO")
5. Click **"Create"**
6. Wait for the project to be created and select it

### Step 2: Enable Google Search Console API

1. In your Google Cloud project, go to **"APIs & Services" > "Library"**
2. Search for **"Google Search Console API"**
3. Click on it and click **"Enable"**
4. Wait for the API to be enabled (usually takes a few seconds)

### Step 3: Create a Service Account

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials"** > **"Service Account"**
3. Fill in the details:
   - **Service account name**: `gsc-seo-service` (or any name you prefer)
   - **Service account ID**: Will auto-generate
   - **Description**: "Service account for SEO dashboard data access"
4. Click **"Create and Continue"**
5. Skip the optional steps (Grant access, Grant users access) and click
   **"Done"**

### Step 4: Create and Download Service Account Key

1. In the **"Credentials"** page, find your newly created service account
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. **IMPORTANT**: The JSON file will download automatically. Save it securely -
   you won't be able to download it again!

### Step 5: Add Property in Google Search Console

**Important**: Based on your Vercel configuration:

- `techtots.ro` redirects (308) to `www.techtots.ro`
- `www.techtots.ro` is your production domain

**Use `https://www.techtots.ro` as your primary property in Google Search
Console.**

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Add Property"** (if you haven't added it yet)
3. Select **"URL prefix"** property type
4. Enter: `https://www.techtots.ro`
5. Follow the verification steps (HTML file upload, DNS record, or HTML tag)
6. Once verified, proceed to grant access

### Step 6: Grant Access in Google Search Console

1. In Google Search Console, select your property (`https://www.techtots.ro`)
2. Click on **"Settings"** (gear icon) in the left sidebar
3. Click on **"Users and permissions"**
4. Click **"Add user"**
5. Enter the **service account email** (from the JSON file you downloaded, it
   looks like: `gsc-seo-service@your-project.iam.gserviceaccount.com`)
6. Select permission level: **"Full"** (or "Restricted" if you prefer, but
   "Full" is recommended for complete data access)
7. Click **"Add"**

### Step 7: Extract Credentials from JSON

Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "gsc-seo-service@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

You need two values:

- **`client_email`** → This is your `GSC_SERVICE_ACCOUNT_EMAIL`
- **`private_key`** → This is your `GSC_PRIVATE_KEY`

### Step 8: Configure Environment Variables

Add these to your `.env` file (or `.env.local` for local development):

```bash
# Google Search Console Configuration
GSC_SERVICE_ACCOUNT_EMAIL=gsc-seo-service@your-project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GSC_SITE_URL=https://www.techtots.ro
```

**Important Notes:**

1. **Private Key Formatting**:
   - The private key must include the `-----BEGIN PRIVATE KEY-----` and
     `-----END PRIVATE KEY-----` lines
   - Keep the `\n` characters in the key (they represent newlines)
   - The entire key should be wrapped in quotes
   - If your key has actual newlines, you can format it like this:
     ```bash
     GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
     MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
     -----END PRIVATE KEY-----"
     ```

2. **Site URL - CRITICAL**:
   - **Use `https://www.techtots.ro`** (with www) as this is your production
     domain
   - This matches your Vercel configuration where `techtots.ro` redirects to
     `www.techtots.ro`
   - The URL must match exactly what you verified in Google Search Console
   - Format: `https://www.techtots.ro` (no trailing slash needed)

### Step 9: Verify Configuration

1. Restart your development server:

   ```bash
   pnpm run dev
   ```

2. Check the console logs - you should see:
   - ✅ No warnings about missing GSC credentials
   - ✅ If there are errors, they'll indicate what's wrong

3. Visit the SEO Dashboard at `/admin/seo-dashboard`
   - Look for the data source indicator in the header
   - It should show **"🟢 Live Data (GSC)"** instead of **"⚠️ Mock Data"**

### Step 10: Test the Connection

1. Go to `/admin/seo-dashboard`
2. Check if data is loading (it may take a few seconds on first load)
3. The dashboard should show:
   - Real keyword rankings
   - Actual clicks and impressions
   - Real CTR data
   - Live position data

## Troubleshooting

### Issue: "Google Search Console not configured" warning

**Solution:**

- Check that both `GSC_SERVICE_ACCOUNT_EMAIL` and `GSC_PRIVATE_KEY` are set
- Verify the private key includes the BEGIN/END markers
- Make sure there are no extra spaces or quotes around the values
- Restart your server after adding the variables

### Issue: "Failed to query Google Search Console data"

**Possible causes:**

1. **Service account not granted access in Search Console**
   - Go back to Step 5 and verify the service account email is added
   - Make sure it has at least "Restricted" permissions

2. **Wrong site URL format**
   - Check Google Search Console for the exact property URL
   - **Use `https://www.techtots.ro`** (with www) as this is your production
     domain
   - Make sure it matches exactly what you verified in Search Console

3. **API not enabled**
   - Go back to Step 2 and verify the Search Console API is enabled

4. **Insufficient permissions**
   - The service account needs at least "Restricted" access
   - "Full" access is recommended for complete functionality

### Issue: "Invalid credentials" error

**Solution:**

- Verify the private key is copied correctly (including all newlines)
- Make sure the service account email matches exactly
- Check that the JSON file wasn't corrupted during download
- Try creating a new service account key if the issue persists

### Issue: No data showing in dashboard

**Possible causes:**

1. **No data in Search Console yet**
   - It can take 24-48 hours for data to appear after verification
   - Make sure your site has been verified and indexed

2. **Date range issues**
   - The dashboard queries the last 30 days by default
   - If your site is new, there may not be enough historical data

3. **Country filter**
   - The service filters for Romanian (ROU) data
   - If you're testing from another country, you may see empty results

## Security Best Practices

1. **Never commit credentials to Git**
   - Add `.env` to `.gitignore` (should already be there)
   - Use environment variables in production

2. **Rotate keys periodically**
   - Create new service account keys every 6-12 months
   - Delete old keys from Google Cloud Console

3. **Use least privilege**
   - Start with "Restricted" access if "Full" isn't needed
   - Only grant access to the specific property you need

4. **Store keys securely**
   - Use a secrets manager in production (e.g., Vercel Environment Variables,
     AWS Secrets Manager)
   - Never share service account keys publicly

## Production Deployment

For production (e.g., Vercel, Railway, etc.):

1. Add the environment variables in your hosting platform's dashboard:
   - `GSC_SERVICE_ACCOUNT_EMAIL`
   - `GSC_PRIVATE_KEY`
   - `GSC_SITE_URL`

2. Make sure to:
   - Use the production site URL
   - Keep the private key in the exact format (with newlines)
   - Test the connection after deployment

## Verifying It's Working

Once configured, you should see:

1. **Dashboard Header**: Shows "🟢 Live Data (GSC)" badge
2. **Real Metrics**: Actual clicks, impressions, CTR from your site
3. **Keyword Rankings**: Real positions for your keywords
4. **Historical Data**: Once daily analytics run, you'll see trends

## Next Steps

After setting up GSC:

1. **Set up daily analytics collection**:
   - Configure a cron job to call `/api/cron/daily-seo-analytics` daily
   - This will populate the `SEOAnalytics` table with historical data

2. **Monitor the dashboard**:
   - Check regularly for ranking changes
   - Use the health score to identify improvement opportunities
   - Track keyword performance over time

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check server logs for API errors
3. Verify all steps were completed correctly
4. Test with a fresh service account if needed

---

**Last Updated**: January 2025 **Maintained by**: TechTots Development Team
