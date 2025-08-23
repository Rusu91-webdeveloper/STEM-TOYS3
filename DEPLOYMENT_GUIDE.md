# Deployment Guide

## Overview

This guide covers deployment procedures for the STEM Toys e-commerce platform.
The platform supports deployment to Vercel (recommended), AWS, and self-hosted
solutions.

## Quick Deployment (Vercel)

### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Login and connect project
vercel login
vercel --prod
```

### 2. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
SHADOW_DATABASE_URL=postgresql://user:pass@host:5432/shadow_db

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_or_sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_...

# Email
RESEND_API_KEY=re_...

# File Uploads
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your-app-id

# Optional
REDIS_URL=redis://...
SENTRY_DSN=https://...
```

### 3. Deploy

```bash
vercel --prod
```

## Alternative Deployments

### AWS Amplify

1. Connect repository to AWS Amplify
2. Configure environment variables
3. Deploy automatically on push to main branch

### Docker Deployment

```bash
# Build image
docker build -t stem-toys .

# Run container
docker run -p 3000:3000 stem-toys
```

### Self-Hosted (PM2)

```bash
# Install PM2
npm install -g pm2

# Build application
pnpm build

# Start with PM2
pm2 start npm --name "stem-toys" -- start
```

## Pre-Deployment Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Build completes successfully (`pnpm build`)
- [ ] Database migrations are ready
- [ ] Environment variables are configured
- [ ] Security scan passes (`pnpm audit`)

## Post-Deployment Verification

- [ ] Health checks passing (`/api/health`)
- [ ] Database connectivity verified
- [ ] Payment processing tested
- [ ] Email notifications working
- [ ] Admin dashboard accessible
- [ ] Performance monitoring active

## Monitoring & Maintenance

### Health Checks

```bash
# Application health
curl https://your-domain.com/api/health

# Database health
curl https://your-domain.com/api/health/database

# Live health
curl https://your-domain.com/api/health/live
```

### Performance Monitoring

- Monitor Core Web Vitals (LCP, FID, CLS)
- Track API response times
- Monitor database query performance
- Set up error tracking with Sentry

### Regular Maintenance

- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: Performance review

## Troubleshooting

### Common Issues

**Build Failures**

```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

**Database Issues**

```bash
# Check connectivity
pnpm prisma db push

# Reset if needed (development only)
pnpm prisma db reset
```

**Environment Variables**

```bash
# Verify in Vercel dashboard
# Check for typos and missing variables
```

## Support

For deployment issues:

1. Check the [README.md](./README.md) troubleshooting section
2. Review [API Documentation](./API_DOCUMENTATION.md) for endpoint issues
3. Verify environment variables and configuration
4. Check Vercel/AWS logs for specific error messages

---

**Ready for Production Deployment! 🚀**
