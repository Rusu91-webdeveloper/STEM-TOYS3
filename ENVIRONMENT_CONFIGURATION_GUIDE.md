# ⚙️ Environment Configuration Guide - Complete Reference

**Last Updated:** October 7, 2025  
**Purpose:** Single source of truth for environment configuration in STEM-TOYS3
project

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Files](#environment-files)
3. [Required Variables](#required-variables)
4. [Optional Variables](#optional-variables)
5. [Development vs Production](#development-vs-production)
6. [Service-Specific Configuration](#service-specific-configuration)
7. [Environment Validation](#environment-validation)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

---

## Quick Start

### For Development

1. Copy the template:

```bash
cp env.example .env.local
```

2. Set minimum required variables:

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication (REQUIRED)
NEXTAUTH_SECRET=your-secret-minimum-32-characters-long
NEXTAUTH_URL=http://localhost:3000

# Email (REQUIRED for email features)
EMAIL_PROVIDER=resend
EMAIL_PRIMARY_API_KEY=re_your_resend_key
EMAIL_FROM=noreply@yourdomain.com
```

3. Start development:

```bash
npm run dev
```

### For Production

See [Production Checklist](#production-checklist) section below.

---

## Environment Files

### `.env.local` (Development - Git Ignored)

**Purpose:** Local development configuration  
**Location:** Project root  
**Git:** ❌ Ignored (in `.gitignore`)

Use for:

- Local database connections
- API keys
- Development secrets
- Personal configuration

### `env.example` (Template - Git Tracked)

**Purpose:** Template with all available variables  
**Location:** Project root  
**Git:** ✅ Tracked

Use as:

- Reference for all variables
- Template for new developers
- Documentation of variables

### `.env.production` (Production - Git Ignored)

**Purpose:** Production configuration (Vercel/hosting provider)  
**Location:** Hosting provider dashboard  
**Git:** ❌ Never commit

Configure in:

- Vercel dashboard
- Hosting provider settings
- CI/CD secrets

---

## Required Variables

### Core Application

```bash
# Node environment
NODE_ENV=development
# Options: development | production | test

# Application URLs
NEXTAUTH_URL=http://localhost:3000
# Production: https://yourdomain.com

# Secret for JWT tokens (CRITICAL - minimum 32 characters)
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
```

**Generate secret:**

```bash
openssl rand -base64 32
```

### Database (PostgreSQL)

```bash
# Primary database connection (REQUIRED)
DATABASE_URL=postgresql://user:password@host:port/database

# Direct connection for migrations (optional, same as DATABASE_URL if not using connection pooling)
DIRECT_URL=postgresql://user:password@host:port/database
```

**Format:**

```
postgresql://[username]:[password]@[host]:[port]/[database]?[parameters]
```

**Examples:**

- **Neon (Recommended):**

```bash
DATABASE_URL=postgresql://user:password@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

- **Railway:**

```bash
DATABASE_URL=postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
```

- **Local:**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys
```

---

## Optional Variables

### Email Configuration

```bash
# Email Provider (resend | brevo | gmail | zoho)
EMAIL_PROVIDER=resend

# Primary email service
EMAIL_PRIMARY_API_KEY=re_your_primary_key
EMAIL_FALLBACK_API_KEY=your_fallback_key

# Sender information
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=TechTots STEM Store
EMAIL_REPLY_TO=support@yourdomain.com

# Provider-specific keys
RESEND_API_KEY=re_your_resend_key
BREVO_API_KEY=xkeysib_your_brevo_key
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

**Where to get:**

- Resend: https://resend.com/api-keys
- Brevo: https://account.brevo.com/advanced/api
- Gmail: https://myaccount.google.com/apppasswords

### Redis (Queue System)

```bash
# Redis URL (Upstash recommended)
REDIS_URL=redis://localhost:6379
# or Upstash
REDIS_URL=https://your-redis.upstash.io
REDIS_TOKEN=your-redis-token

# Redis configuration
REDIS_TIMEOUT=1000
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000
```

**Where to get:**

- Upstash: https://console.upstash.com/redis
- Local Redis: `brew install redis` (Mac) or `apt-get install redis` (Linux)

### AI Configuration

```bash
# AI Provider (openai | anthropic | gemini)
AI_PROVIDER=openai
AI_MODEL=gpt-4o
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_ENHANCEMENT_ENABLED=true

# OpenAI (for blogs - RECOMMENDED)
OPENAI_API_KEY=sk-proj-your-openai-key

# Google Gemini (for products - RECOMMENDED)
GEMINI_API_KEY=your-gemini-key

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Dual-Provider Configuration (for blog generation)
AI_PRIMARY_PROVIDER=openai
AI_PRIMARY_MODEL=gpt-4o
AI_SECONDARY_PROVIDER=openai
AI_SECONDARY_MODEL=gpt-4o
AI_FALLBACK_MODEL=gpt-4o
```

**Where to get:**

- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://makersuite.google.com/app/apikey
- Anthropic: https://console.anthropic.com/

### Payment Processing

```bash
# Active Payment Provider
PAYMENT_PROVIDER=netopia
NEXT_PUBLIC_PAYMENT_PROVIDER=netopia

# Netopia (Romanian payment processor)
NETOPIA_API_KEY=your-netopia-api-key
NETOPIA_SIGNATURE=your-signature-key
NETOPIA_MERCHANT_ID=your-merchant-id
NETOPIA_SANDBOX=true
NETOPIA_WEBHOOK_SECRET=your-webhook-secret

# Stripe (optional fallback)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
```

### Authentication (OAuth)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Setup:**

1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 credentials
3. Add authorized redirect: `http://localhost:3000/api/auth/callback/google`

### File Upload

```bash
# UploadThing (recommended)
UPLOADTHING_SECRET=sk_live_your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
```

**Where to get:**

- UploadThing: https://uploadthing.com/dashboard

### Rich Text Editor

```bash
# TinyMCE
NEXT_PUBLIC_TINYMCE_API_KEY=your-tinymce-api-key
```

**Where to get:**

- TinyMCE: https://www.tiny.cloud/my-account/dashboard/

### Analytics & Tracking

```bash
# Google Analytics 4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Facebook Pixel (Romanian market)
FACEBOOK_PIXEL_ID=your-facebook-pixel-id
FACEBOOK_ACCESS_TOKEN=your-access-token
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Google Search Console
GSC_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
GSC_SITE_URL=https://yourdomain.com
```

### Monitoring & Error Tracking

```bash
# Sentry (error tracking)
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=development

# Logging
LOG_LEVEL=info
# Options: error | warn | info | debug

# Enable analytics
ENABLE_ANALYTICS=false
```

---

## Development vs Production

### Development Configuration

```bash
# .env.local
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000

# Development-friendly settings
NEXTAUTH_SECRET=dev-secret-at-least-32-characters-long

# Local database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stemtoys

# Debug logging
LOG_LEVEL=debug
DB_LOGGING=true
PROFILING=true
```

### Production Configuration

```bash
# Vercel/Hosting Dashboard
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com

# Strong secret (32+ characters)
NEXTAUTH_SECRET=<generated-with-openssl-rand-base64-32>

# Production database (with connection pooling)
DATABASE_URL=postgresql://user:password@production-db.com/database?pgbouncer=true

# Production logging
LOG_LEVEL=info
DB_LOGGING=false
PROFILING=false

# Enable monitoring
SENTRY_DSN=https://your-sentry-dsn
ENABLE_ANALYTICS=true
```

---

## Service-Specific Configuration

### Database Configuration

```bash
# Connection pool settings
DATABASE_POOL_SIZE=20
DATABASE_MIN_CONNECTIONS=2
DATABASE_CONNECTION_TIMEOUT=2000
DATABASE_IDLE_TIMEOUT=30000
DATABASE_ACQUIRE_TIMEOUT=60000
DATABASE_CREATE_TIMEOUT=30000
DATABASE_DESTROY_TIMEOUT=5000
DATABASE_REAP_INTERVAL=1000
DATABASE_CREATE_RETRY_INTERVAL=200
```

**Recommendations:**

- Development: Pool size 5-10
- Production: Pool size 20-50
- Serverless: Pool size 1-5 (use connection pooling like PgBouncer)

### Performance Monitoring

```bash
# Performance monitoring
PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1
PERFORMANCE_MAX_METRICS=1000
PERFORMANCE_RETENTION_DAYS=7

# Query thresholds
SLOW_QUERY_THRESHOLD=1000
CRITICAL_QUERY_THRESHOLD=5000
```

### API Caching

```bash
# Cache configuration
API_CACHING=true
API_CACHE_TTL=300
API_CACHE_MAX_TTL=3600
API_CACHE_STALE_WHILE_REVALIDATE=60
API_CACHE_COMPRESSION=true
API_CACHE_COMPRESSION_THRESHOLD=1024

# Specific cache TTLs
CART_CACHE_TTL=600
PRODUCT_CACHE_TTL=1800
SESSION_CACHE_TTL=3600
```

### Security & Rate Limiting

```bash
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_PROVIDER=auto
# Options: auto | redis | memory

# Request limits
MAX_REQUEST_SIZE=10485760

# Security keys
ENCRYPTION_KEY=your-32-byte-encryption-key
CSRF_SECRET_KEY=your-csrf-secret-key
```

### Feature Flags

```bash
# Feature toggles
ENABLE_REAL_TIME_FEATURES=false
ENABLE_AI_RECOMMENDATIONS=false
ENABLE_ADVANCED_ANALYTICS=false
ENABLE_AUTOMATED_TESTING=false
```

### Cron Jobs

```bash
# Cron secret for background jobs
CRON_SECRET=your-cron-secret-key
NEXT_PUBLIC_CRON_SECRET_TOKEN=your-cron-secret-key
```

### Deployment & Scaling

```bash
# Auto-scaling
ENABLE_AUTO_SCALING=false
MIN_INSTANCES=1
MAX_INSTANCES=10

# CDN
CDN_ENABLED=false
CDN_URL=https://cdn.yourdomain.com

# Backup
BACKUP_ENABLED=false
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### Notifications & Alerts

```bash
# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-webhook

# Email alerts
ALERT_EMAIL=alerts@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Alert thresholds
PERFORMANCE_ALERT_THRESHOLD=5000
ERROR_RATE_ALERT_THRESHOLD=0.05
ALERT_COOLDOWN_PERIOD=300000
```

---

## Environment Validation

### Validation Schema

**File:** `lib/config/environment.ts`

The application validates all environment variables on startup using Zod
schemas.

**Validated Categories:**

1. **Database** - Connection string format, required in production
2. **Redis** - URL format, optional but recommended
3. **Email** - Provider configuration, API keys
4. **Performance** - Numeric thresholds
5. **Cache** - TTL values, size limits
6. **Security** - Key lengths, required secrets
7. **Monitoring** - DSN formats
8. **AI** - Provider and model configuration

### Validation on Startup

```typescript
import { getEnvironmentConfig } from "@/lib/config/environment";

// Validates all required variables
const config = getEnvironmentConfig();

// Access validated config
const dbUrl = config.database.url;
const emailProvider = config.email.provider;
```

### Manual Validation

```bash
# Check configuration
npm run check:env

# Expected output:
✅ Database configuration: Valid
✅ Email configuration: Valid
✅ Redis configuration: Valid
⚠️  AI configuration: Missing OPENAI_API_KEY
❌ Payment configuration: Missing NETOPIA_API_KEY
```

---

## Troubleshooting

### Common Issues

#### Problem: "DATABASE_URL is required"

**Solution:**

1. Check `.env.local` exists in project root
2. Verify `DATABASE_URL` is set:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

3. Restart development server

#### Problem: "NEXTAUTH_SECRET must be at least 32 characters"

**Solution:**

Generate a secure secret:

```bash
openssl rand -base64 32
```

Add to `.env.local`:

```bash
NEXTAUTH_SECRET=<generated-secret>
```

#### Problem: "Email service not configured"

**Solution:**

Set email provider and API key:

```bash
EMAIL_PROVIDER=resend
EMAIL_PRIMARY_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

#### Problem: Environment variables not loading

**Solutions:**

1. **File location:** Ensure `.env.local` is in project root
2. **Restart server:** Environment variables load on startup
3. **Syntax:** Check for typos, quotes, spaces
4. **Precedence:** `.env.local` overrides `env.example`

**Check current environment:**

```typescript
console.log("Database URL:", process.env.DATABASE_URL);
console.log("Email Provider:", process.env.EMAIL_PROVIDER);
```

#### Problem: "Redis connection failed"

**Solutions:**

1. **Local Redis:** Ensure Redis is running

```bash
# Mac
brew services start redis

# Linux
sudo systemctl start redis

# Check status
redis-cli ping
# Should return: PONG
```

2. **Upstash:** Verify credentials

```bash
REDIS_URL=https://your-redis.upstash.io
REDIS_TOKEN=your-token
```

3. **Optional:** Redis is optional for basic features

```bash
# Disable Redis
DISABLE_REDIS=true
```

---

## Security Best Practices

### Secret Management

1. **Never commit secrets to Git**
   - Use `.gitignore` for `.env.local`
   - Review commits before pushing
   - Use git-secrets or similar tools

2. **Use strong secrets**

   ```bash
   # Generate strong secrets
   openssl rand -base64 32

   # Minimum 32 characters for NEXTAUTH_SECRET
   # Use cryptographically secure random values
   ```

3. **Rotate secrets regularly**
   - Database passwords: Every 90 days
   - API keys: When team members leave
   - Secrets exposed: Immediately

4. **Use different secrets per environment**

   ```bash
   # Development
   NEXTAUTH_SECRET=dev-secret-32-chars-minimum

   # Production
   NEXTAUTH_SECRET=prod-different-secret-32-chars
   ```

### Environment-Specific Configurations

```bash
# Development - More verbose, more lenient
NODE_ENV=development
LOG_LEVEL=debug
DB_LOGGING=true
PERFORMANCE_MONITORING=false

# Production - Secure, optimized
NODE_ENV=production
LOG_LEVEL=info
DB_LOGGING=false
PERFORMANCE_MONITORING=true
SENTRY_DSN=https://...
```

### API Key Security

1. **Restrict API keys by domain/IP**
   - OpenAI: Restrict by domain in dashboard
   - Google APIs: Set HTTP referrer restrictions
   - Resend: Restrict by domain

2. **Use environment-specific keys**
   - Development keys for local/staging
   - Production keys for live environment
   - Never reuse keys across environments

3. **Monitor API usage**
   - Set up billing alerts
   - Monitor for unusual activity
   - Review access logs regularly

---

## Production Checklist

### Before Deploying

- [ ] ✅ All required variables set in hosting dashboard
- [ ] ✅ `NEXTAUTH_SECRET` is 32+ characters and unique
- [ ] ✅ `NODE_ENV=production`
- [ ] ✅ Database connection string is production URL
- [ ] ✅ Email service configured with production keys
- [ ] ✅ Payment provider configured (Netopia/Stripe)
- [ ] ✅ Sentry DSN set for error tracking
- [ ] ✅ Analytics configured (GA4, Facebook Pixel)
- [ ] ✅ Redis/Upstash configured for queue
- [ ] ✅ `NEXTAUTH_URL` is production domain (https)
- [ ] ✅ API keys restricted by domain
- [ ] ✅ No development secrets in production
- [ ] ✅ Backup configuration enabled
- [ ] ✅ Monitoring and alerts configured

### Minimum Production Variables

```bash
# Core (REQUIRED)
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<strong-32-char-secret>
DATABASE_URL=<production-database-url>

# Email (REQUIRED for emails)
EMAIL_PROVIDER=resend
EMAIL_PRIMARY_API_KEY=<production-key>
EMAIL_FROM=noreply@yourdomain.com

# Payment (REQUIRED for checkout)
PAYMENT_PROVIDER=netopia
NETOPIA_API_KEY=<production-key>
NETOPIA_MERCHANT_ID=<merchant-id>
NETOPIA_SANDBOX=false

# Monitoring (RECOMMENDED)
SENTRY_DSN=<production-sentry-dsn>
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Redis (RECOMMENDED for queue)
REDIS_URL=<upstash-redis-url>
REDIS_TOKEN=<upstash-token>
```

---

## Quick Reference

### Environment Files Priority

1. `.env.local` (highest priority, development)
2. `.env.production` (production only)
3. `.env.development` (development only)
4. `.env` (base, tracked in git - DO NOT USE for secrets)
5. `env.example` (template only, no values)

### Getting Values

```typescript
// In server-side code
const dbUrl = process.env.DATABASE_URL;

// In client-side code (NEXT_PUBLIC_ prefix required)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

// Using validated config
import { getEnvironmentConfig } from "@/lib/config/environment";
const config = getEnvironmentConfig();
const dbUrl = config.database.url;
```

### Common Commands

```bash
# Copy template
cp env.example .env.local

# Validate configuration
npm run check:env

# Generate secret
openssl rand -base64 32

# Check Redis
redis-cli ping

# Test database connection
npm run db:test

# View current environment
npm run env:show
```

---

## File Reference

### Configuration Files

- `env.example` - Template with all variables
- `.env.local` - Local development (git ignored)
- `lib/config/environment.ts` - Environment validation
- `lib/config.ts` - Config schema
- `lib/env.ts` - Environment utilities

### Documentation

- `ENVIRONMENT_CONFIGURATION_GUIDE.md` - This file (complete reference)

---

**End of Environment Configuration Guide**

For questions or issues, check the codebase or create a GitHub issue.
