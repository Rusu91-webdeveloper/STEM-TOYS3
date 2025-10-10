# Environment Setup Guide

Complete guide for configuring environment variables, development setup, and
production deployment for the TechTots STEM e-commerce platform.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Files](#environment-files)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Service Configuration](#service-configuration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Minimum Setup (5 Minutes)

1. **Copy template:**

```bash
cp env.example .env.local
```

2. **Set required variables:**

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys_dev

# Authentication
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# Email
EMAIL_PROVIDER=resend
EMAIL_PRIMARY_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

3. **Initialize database:**

```bash
npx prisma migrate deploy
npm run seed
```

4. **Start development:**

```bash
npm run dev
```

---

## Environment Files

### `.env.local` (Development)

**Purpose:** Local development configuration **Location:** Project root **Git
Status:** ✅ Ignored (never commit)

Used for:

- Local database connections
- Development API keys
- Personal configuration
- Testing credentials

**Example:**

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys_dev
NEXTAUTH_SECRET=your-local-secret-key
```

### `env.example` (Template)

**Purpose:** Template with all available variables **Location:** Project root
**Git Status:** ✅ Tracked

Used as:

- Reference documentation
- Template for new developers
- Complete variable list

### Production Environment (Vercel/Hosting)

**Purpose:** Production configuration **Location:** Hosting provider dashboard
**Git Status:** ✅ Never commit

Configure in:

- Vercel Dashboard > Settings > Environment Variables
- Railway Dashboard > Variables
- AWS/GCP Secrets Manager

---

## Required Variables

### Core Application

```bash
# Node Environment
NODE_ENV=development
# Options: development | production | test

# Application URL
NEXTAUTH_URL=http://localhost:3000
# Production: https://yourdomain.com

# Authentication Secret (CRITICAL - minimum 32 characters)
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
```

**Generate Secret:**

```bash
openssl rand -base64 32
```

**Security:**

- Must be at least 32 characters
- Use cryptographically secure random string
- Different secret for each environment
- Never share or commit to git

### Database Configuration

```bash
# Primary Database URL (REQUIRED)
DATABASE_URL=postgresql://user:password@host:port/database

# Direct URL for migrations (if using connection pooling)
DIRECT_URL=postgresql://user:password@host:port/database

# Connection Pool Settings
DATABASE_POOL_SIZE=20
DATABASE_CONNECTION_TIMEOUT=2000
DATABASE_IDLE_TIMEOUT=30000
```

**Database URL Format:**

```
postgresql://[username]:[password]@[host]:[port]/[database]?[parameters]
```

**Examples:**

**Neon (Recommended for Production):**

```bash
DATABASE_URL=postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Railway:**

```bash
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

**Local PostgreSQL:**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys_dev
```

**Important:** See `DATABASE_SAFETY.md` for separating local and production
databases.

---

## Optional Variables

### Email Service

```bash
# Email Provider Selection
EMAIL_PROVIDER=resend
# Options: resend | brevo | gmail

# API Keys
EMAIL_PRIMARY_API_KEY=re_your_primary_key
EMAIL_FALLBACK_API_KEY=your_fallback_key

# Sender Information
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=TechTots STEM Store
EMAIL_REPLY_TO=support@yourdomain.com

# Provider-Specific Keys
RESEND_API_KEY=re_your_resend_key
BREVO_API_KEY=xkeysib_your_brevo_key
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

**Get API Keys:**

- Resend: https://resend.com/api-keys
- Brevo: https://account.brevo.com/advanced/api
- Gmail: https://myaccount.google.com/apppasswords

### Redis Cache

```bash
# Redis Configuration (Upstash recommended)
REDIS_URL=https://your-redis.upstash.io
REDIS_TOKEN=your-redis-token

# Connection Settings
REDIS_TIMEOUT=5000
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000

# Disable Redis (for development)
DISABLE_REDIS=false
```

**Get Upstash Redis:**

1. Go to https://upstash.com
2. Create new database
3. Copy REST URL and token

### Payment Processing

```bash
# Payment Provider Selection
PAYMENT_PROVIDER=netopia
# Options: netopia | stripe

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Netopia Configuration
NETOPIA_API_KEY=your_netopia_api_key
NETOPIA_SIGNATURE=your_netopia_signature
NETOPIA_MERCHANT_ID=your_merchant_id
NETOPIA_SANDBOX=true
NETOPIA_WEBHOOK_SECRET=your_webhook_secret
```

**Get Stripe Keys:**

1. Go to https://dashboard.stripe.com
2. Developers > API keys
3. Copy secret and publishable keys

### File Upload

```bash
# Uploadthing Configuration
UPLOADTHING_SECRET=sk_live_your_uploadthing_secret
UPLOADTHING_APP_ID=your_app_id

# Maximum file sizes (in MB)
MAX_FILE_SIZE=10
MAX_IMAGE_SIZE=5
```

**Get Uploadthing Keys:**

1. Go to https://uploadthing.com
2. Create new app
3. Copy secret and app ID

### AI Services

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000

# Anthropic (Claude) Configuration
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# AI Features Toggle
AI_ENHANCEMENT_ENABLED=true
AI_FALLBACK_PROVIDER=anthropic
```

**Get API Keys:**

- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

### OAuth Providers

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth (optional)
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

**Setup Google OAuth:**

1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   `https://yourdomain.com/api/auth/callback/google`

### Analytics & Monitoring

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Facebook Pixel
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token

# Sentry Error Tracking
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project
SENTRY_ORG=your_organization
SENTRY_PROJECT=your_project
NEXT_PUBLIC_SENTRY_DSN=https://your_public_dsn@sentry.io/project

# Performance Monitoring
PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1
```

**Setup:**

- Google Analytics: https://analytics.google.com
- Facebook Pixel: https://business.facebook.com/events_manager
- Sentry: https://sentry.io

### Background Jobs

```bash
# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Cron Jobs
CRON_SECRET=your_cron_secret_key
NEXT_PUBLIC_CRON_SECRET_TOKEN=your_cron_secret_key
```

**Get Inngest Keys:**

1. Go to https://www.inngest.com
2. Create new app
3. Copy event and signing keys

### SEO & Search

```bash
# Google Search Console
GSC_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
GSC_SITE_URL=https://yourdomain.com
```

---

## Development Setup

### Prerequisites

**Required Software:**

- Node.js 18.0 or later
- pnpm (recommended) or npm
- PostgreSQL 14 or later (or cloud database)
- Git

**Optional:**

- Redis (or use Upstash)
- Docker (for containerized development)

### Step-by-Step Setup

**1. Clone Repository:**

```bash
git clone <repository-url>
cd STEM-TOYS3
```

**2. Install Dependencies:**

```bash
pnpm install
# or
npm install
```

**3. Setup Environment:**

```bash
# Copy template
cp env.example .env.local

# Edit with your values
nano .env.local
```

**4. Setup Database:**

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL
brew install postgresql@16  # macOS
brew services start postgresql@16

# Create database
createdb stemtoys_dev

# Set DATABASE_URL in .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys_dev
```

**Option B: Neon Cloud Database**

```bash
# Go to https://neon.tech
# Create new project: "stemtoys-dev"
# Copy connection string to .env.local
```

**5. Run Migrations:**

```bash
npx prisma generate
npx prisma migrate deploy
```

**6. Seed Database:**

```bash
npm run seed
```

**7. Start Development Server:**

```bash
npm run dev
```

**8. Open Browser:**

```
http://localhost:3000
```

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Open Prisma Studio (database GUI)
npm run db:studio

# Generate Prisma Client
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npm run db:reset
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Production database created and accessible
- [ ] Database backed up (see DATABASE_SAFETY.md)
- [ ] Email service configured and tested
- [ ] Payment provider configured
- [ ] OAuth providers configured with production URLs
- [ ] Analytics tracking IDs updated
- [ ] Error monitoring (Sentry) configured
- [ ] Production secrets are secure (32+ chars)
- [ ] `.env.local` not committed to git
- [ ] Build succeeds locally (`npm run build`)

### Vercel Deployment

**1. Install Vercel CLI:**

```bash
npm install -g vercel
```

**2. Login:**

```bash
vercel login
```

**3. Deploy:**

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

**4. Configure Environment Variables:**

Via Dashboard:

1. Go to project settings
2. Navigate to Environment Variables
3. Add all production variables
4. Select "Production" environment

Via CLI:

```bash
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
```

**5. Configure Domains:**

```bash
vercel domains add yourdomain.com
```

### Railway Deployment

**1. Install Railway CLI:**

```bash
npm install -g @railway/cli
```

**2. Login:**

```bash
railway login
```

**3. Initialize Project:**

```bash
railway init
```

**4. Add Environment Variables:**

```bash
railway variables set NEXTAUTH_SECRET=your_secret
railway variables set DATABASE_URL=your_database_url
```

**5. Deploy:**

```bash
railway up
```

### Docker Deployment

**1. Build Image:**

```bash
docker build -t stem-toys .
```

**2. Run Container:**

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=your_database_url \
  -e NEXTAUTH_SECRET=your_secret \
  stem-toys
```

### Post-Deployment Steps

**1. Run Migrations:**

```bash
# Via Vercel
vercel env pull
npx prisma migrate deploy

# Or set up automatic migrations in build command
```

**2. Verify Deployment:**

- [ ] Homepage loads correctly
- [ ] Database connection works
- [ ] User login/registration works
- [ ] Email sending works
- [ ] Payment processing works
- [ ] Analytics tracking active
- [ ] Error monitoring active

**3. Monitor:**

```bash
# Vercel logs
vercel logs

# Railway logs
railway logs
```

**4. Setup Monitoring:**

- Configure uptime monitoring (e.g., UptimeRobot)
- Set up error alerts (Sentry)
- Monitor performance (Vercel Analytics)
- Track Core Web Vitals

---

## Service Configuration

### Database (Neon)

**Setup:**

1. Go to https://console.neon.tech
2. Create new project
3. Copy connection string
4. Enable connection pooling (recommended)

**Configuration:**

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

### Email (Resend)

**Setup:**

1. Go to https://resend.com
2. Add domain and verify DNS
3. Create API key
4. Configure sender email

**Configuration:**

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### Redis (Upstash)

**Setup:**

1. Go to https://upstash.com
2. Create new database
3. Copy REST URL and token

**Configuration:**

```bash
REDIS_URL=https://your-db.upstash.io
REDIS_TOKEN=your_token
```

### File Upload (Uploadthing)

**Setup:**

1. Go to https://uploadthing.com
2. Create new app
3. Copy credentials

**Configuration:**

```bash
UPLOADTHING_SECRET=sk_live_your_secret
UPLOADTHING_APP_ID=your_app_id
```

---

## Troubleshooting

### Common Issues

**1. "DATABASE_URL not found"**

**Solution:**

```bash
# Check .env.local exists
ls -la .env.local

# Verify DATABASE_URL is set
grep DATABASE_URL .env.local

# Restart dev server
npm run dev
```

**2. "NEXTAUTH_SECRET must be at least 32 characters"**

**Solution:**

```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
```

**3. "Connection refused" to Database**

**Solution:**

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@16

# Test connection
psql -d stemtoys_dev -c "SELECT 1;"
```

**4. Email Sending Fails**

**Solution:**

```bash
# Verify API key is correct
echo $EMAIL_PRIMARY_API_KEY

# Check provider is set
echo $EMAIL_PROVIDER

# Test email configuration
npm run test:email
```

**5. "Build failed" in Production**

**Solution:**

1. Check all environment variables are set in Vercel/hosting
2. Verify DATABASE_URL is accessible from production
3. Check build logs for specific errors
4. Ensure Prisma Client is generated: `npx prisma generate`

### Environment Validation

**Run validation script:**

```bash
npm run check:env
```

**Manual validation:**

```bash
# Check required variables
node -e "
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
required.forEach(key => {
  if (!process.env[key]) console.error(\`Missing: \${key}\`);
});
"
```

---

## Security Best Practices

### DO:

- ✅ Use strong, random secrets (32+ characters)
- ✅ Use different secrets for each environment
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use environment variables for all secrets
- ✅ Rotate secrets regularly (quarterly)
- ✅ Use HTTPS in production
- ✅ Enable database SSL/TLS
- ✅ Restrict database access by IP

### DON'T:

- ❌ Commit `.env.local` to git
- ❌ Share secrets via email/chat
- ❌ Use weak or predictable secrets
- ❌ Use same secrets across environments
- ❌ Hard-code secrets in source code
- ❌ Expose secrets in client-side code
- ❌ Use production credentials in development

### Secret Management

**For Teams:**

- Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- Share via secure password manager (1Password, LastPass)
- Document secret rotation procedures
- Implement least-privilege access

**For Solo Developers:**

- Keep secrets in password manager
- Backup `.env.local` securely
- Document which services use which keys
- Set reminders for secret rotation

---

## Summary

### Minimum Required Setup

For basic development, you need:

1. `DATABASE_URL` - PostgreSQL connection
2. `NEXTAUTH_SECRET` - Authentication secret
3. `NEXTAUTH_URL` - Application URL

### Production-Ready Setup

For production deployment, additionally configure:

1. Email service (Resend/Brevo)
2. Redis cache (Upstash)
3. File upload (Uploadthing)
4. Payment provider (Stripe/Netopia)
5. Analytics (Google Analytics, Facebook Pixel)
6. Error monitoring (Sentry)

### References

- **DATABASE_SAFETY.md** - Database backup and safety
- **PROJECT_ARCHITECTURE.md** - Technical architecture
- **API_REFERENCE.md** - API endpoints
- **FEATURES_GUIDE.md** - Platform features

### Support

For setup assistance:

- Check troubleshooting section above
- Review error logs
- Verify all environment variables
- See DEPLOYMENT_GUIDE.md for advanced deployment
