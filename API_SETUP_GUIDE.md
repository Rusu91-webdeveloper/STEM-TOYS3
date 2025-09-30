# 🚀 VIRAL METRICS SYSTEM API CONFIGURATION GUIDE

## Romanian STEM Market Domination - API Setup Instructions

This guide walks you through setting up all required API keys for the viral
metrics system that will dominate the Romanian STEM education market.

---

## 📋 REQUIRED API CONFIGURATIONS

### 1. 🔍 Google Search Console API Setup

**Purpose**: Track Romanian keyword rankings and search performance for SEO
domination.

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: `stem-toys-viral-analytics`
3. Enable billing (required for Search Console API)

#### Step 2: Enable Search Console API

1. Go to "APIs & Services" > "Library"
2. Search for "Google Search Console API"
3. Click "Enable"

#### Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name: `stem-gsc-service`
4. Role: `Project > Editor` (or more restrictive permissions)
5. Create and download JSON key file

#### Step 4: Grant Search Console Access

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://techtots.ro`
3. Go to Settings > Users and permissions
4. Add the service account email with "Full" access

#### Step 5: Configure Environment Variables

```bash
# Add to your .env file
GSC_SERVICE_ACCOUNT_EMAIL=your-service-account@stem-toys-viral-analytics.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GSC_SITE_URL=https://techtots.ro
```

---

### 2. 📱 Facebook Pixel & Conversions API Setup

**Purpose**: Track viral content spread and Romanian user engagement.

#### Step 1: Create Facebook Business Account

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Create business account for "TechTots STEM Toys"

#### Step 2: Create Facebook Pixel

1. Go to "Events Manager" in Business Manager
2. Click "Connect Data Sources" > "Web"
3. Name: "TechTots Viral Tracking"
4. Copy the Pixel ID

#### Step 3: Set Up Conversions API

1. In Events Manager, go to "Settings" > "Conversions API"
2. Generate access token with these permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`

#### Step 4: Create Facebook App (Optional but Recommended)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app: "TechTots Analytics"
3. Add Conversions API product
4. Get App ID and App Secret

#### Step 5: Configure Environment Variables

```bash
# Add to your .env file
FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAADevAccessTokenForRomanianViralTracking
FACEBOOK_APP_ID=123456789
FACEBOOK_APP_SECRET=your_app_secret_here
```

---

### 3. 📧 Email Service Configuration

**Required for email notifications and newsletters**

#### Using Resend (Recommended)

```bash
EMAIL_PROVIDER=resend
EMAIL_FROM=noreply@techtots.ro
RESEND_API_KEY=re_your_resend_api_key
```

#### Alternative: Brevo (Sendinblue)

```bash
EMAIL_PROVIDER=brevo
EMAIL_FROM=noreply@techtots.ro
BREVO_API_KEY=your_brevo_api_key
```

---

### 4. 🗄️ Database Configuration

**For production deployment**

```bash
# PostgreSQL connection (recommended for production)
DATABASE_URL="postgresql://username:password@host:port/stem_toys_prod"

# Alternative: Neon PostgreSQL (managed)
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb"
```

---

## 🔧 TESTING API CONFIGURATIONS

### Create Test Environment File

```bash
# Copy env.example to .env.local for testing
cp env.example .env.local

# Edit .env.local with your API keys
nano .env.local
```

### Test API Connections

Run the API validation script:

```bash
npm run test:apis
# or
node scripts/test-api-connections.js
```

### Expected Test Results

✅ **Google Search Console**: API connection successful ✅ **Facebook Pixel**:
Conversions API accessible ✅ **Database**: Schema migration applied ✅ **Email
Service**: Test email sent successfully

---

## 🚨 TROUBLESHOOTING

### Google Search Console Issues

**Error**: "The caller does not have permission"

- Check service account has Search Console access
- Verify property ownership in GSC
- Wait 24-48 hours after granting permissions

**Error**: "Invalid credentials"

- Verify JSON key file format
- Check service account email in .env matches key file

### Facebook Pixel Issues

**Error**: "Invalid access token"

- Regenerate access token in Business Manager
- Ensure all required permissions are granted
- Check token hasn't expired

**Error**: "Pixel not found"

- Verify Pixel ID is correct
- Check pixel is properly installed on website

### Database Issues

**Error**: "Migration failed"

- Ensure database user has CREATE/ALTER permissions
- Check database connection string format
- Verify PostgreSQL version compatibility

---

## 📊 VALIDATION CHECKLIST

- [ ] Google Search Console property verified
- [ ] Facebook Pixel installed on website
- [ ] Database migration completed successfully
- [ ] Email service test successful
- [ ] API validation script passes all tests
- [ ] Admin dashboards load without errors
- [ ] Romanian keyword tracking active

---

## 🎯 NEXT STEPS AFTER API SETUP

1. **Launch Competitor Analysis**
   - Run initial competitor intelligence scan
   - Identify Romanian market gaps
   - Generate strategic recommendations

2. **Generate Content Calendar**
   - Create first month's publishing schedule
   - Optimize for Romanian audience timing
   - Set up automated publishing workflow

3. **Start A/B Testing**
   - Launch title optimization tests
   - Test CTA variations
   - Monitor Romanian user engagement

4. **Activate Viral Tracking**
   - Monitor social shares and engagement
   - Track conversion from blog to sales
   - Optimize based on Romanian user behavior

---

## 📞 SUPPORT

If you encounter issues during API setup:

1. Check this guide for common solutions
2. Review error messages for specific guidance
3. Test individual APIs before full integration
4. Contact technical support with error logs

**The viral metrics system is ready to dominate the Romanian STEM market! 🎉**
