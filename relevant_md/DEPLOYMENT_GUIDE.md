# Deployment Guide

## Overview

This guide covers deployment procedures for the STEM Toys e-commerce platform
across different environments. The platform supports deployment to various
hosting providers including Vercel, AWS, and self-hosted solutions.

## Deployment Environments

### 1. Development

- **Purpose**: Local development and testing
- **URL**: `http://localhost:3000`
- **Database**: Local PostgreSQL
- **Branch**: Any feature branch

### 2. Staging

- **Purpose**: Pre-production testing and client review
- **URL**: `https://staging.techtots.com`
- **Database**: Staging PostgreSQL (separate from production)
- **Branch**: `develop` or `staging`

### 3. Production

- **Purpose**: Live website serving customers
- **URL**: `https://techtots.com`
- **Database**: Production PostgreSQL with backups
- **Branch**: `main`

## Pre-Deployment Checklist

### Before Every Deployment

- [ ] All tests pass locally (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] ESLint passes without errors (`npm run lint`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Database migrations are ready
- [ ] Environment variables are configured
- [ ] Security scan passes (`npm audit`)

### Before Production Deployment

- [ ] Feature tested in staging environment
- [ ] Performance testing completed
- [ ] Security review completed
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured
- [ ] CDN cache invalidation plan ready

## Vercel Deployment (Recommended)

### Initial Setup

1. **Connect Repository**:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and connect project
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**:

   **In Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add all required environment variables for each environment

   **Required Variables**:

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
   SMTP_HOST=smtp.your-provider.com
   SMTP_PORT=587
   SMTP_USER=your-email
   SMTP_PASS=your-password

   # File Upload
   UPLOADTHING_SECRET=sk_live_...
   UPLOADTHING_APP_ID=your-app-id

   # Analytics
   SENTRY_DSN=https://your-sentry-dsn

   # AI Services (optional)
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   ```

3. **Configure Build Settings**:
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm ci",
     "devCommand": "npm run dev",
     "framework": "nextjs",
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     },
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "no-cache, no-store, must-revalidate"
           }
         ]
       }
     ],
     "redirects": [
       {
         "source": "/admin",
         "destination": "/admin/dashboard",
         "permanent": false
       }
     ]
   }
   ```

### Deployment Process

#### Automatic Deployment (Git-based)

1. **Staging Deployment**:

   ```bash
   # Push to staging branch
   git checkout develop
   git push origin develop
   ```

   - Automatically deploys to staging environment
   - URL: `https://staging-techtots.vercel.app`

2. **Production Deployment**:

   ```bash
   # Merge to main branch
   git checkout main
   git merge develop
   git push origin main
   ```

   - Automatically deploys to production
   - URL: `https://techtots.com`

#### Manual Deployment

```bash
# Deploy to staging
vercel --target preview

# Deploy to production
vercel --target production
```

### Database Migration on Vercel

1. **Setup Database Migration Script**:

   ```json
   // package.json
   {
     "scripts": {
       "vercel-build": "npm run build && npm run db:migrate:deploy"
     }
   }
   ```

2. **Migration Command**:
   ```bash
   # In your build script or manually
   npx prisma migrate deploy
   ```

## AWS Deployment

### Using AWS Amplify

1. **Connect Repository**:
   - Go to AWS Amplify Console
   - Connect your GitHub repository
   - Choose the appropriate branch for each environment

2. **Build Settings**:

   ```yaml
   # amplify.yml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - "**/*"
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

3. **Environment Variables**:
   - Configure in Amplify Console → Environment Variables
   - Use same variables as Vercel deployment

### Using AWS ECS (Docker)

1. **Create Dockerfile**:

   ```dockerfile
   # Dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app

   ENV NODE_ENV production

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs

   EXPOSE 3000

   ENV PORT 3000

   CMD ["node", "server.js"]
   ```

2. **Build and Push to ECR**:

   ```bash
   # Build image
   docker build -t stem-toys .

   # Tag for ECR
   docker tag stem-toys:latest your-account.dkr.ecr.region.amazonaws.com/stem-toys:latest

   # Push to ECR
   docker push your-account.dkr.ecr.region.amazonaws.com/stem-toys:latest
   ```

## Self-Hosted Deployment

### Using Docker Compose

1. **Create docker-compose.yml**:

   ```yaml
   version: "3.8"

   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=postgresql://postgres:password@db:5432/stemtoys
       depends_on:
         - db
         - redis

     db:
       image: postgres:14
       environment:
         - POSTGRES_DB=stemtoys
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./init.sql:/docker-entrypoint-initdb.d/init.sql

     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"

     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - app

   volumes:
     postgres_data:
   ```

2. **Deploy**:

   ```bash
   # Start services
   docker-compose up -d

   # Check status
   docker-compose ps

   # View logs
   docker-compose logs app
   ```

### Using PM2 (Node.js Process Manager)

1. **Install PM2**:

   ```bash
   npm install -g pm2
   ```

2. **Create PM2 Configuration**:

   ```json
   // ecosystem.config.js
   module.exports = {
     apps: [
       {
         name: 'stem-toys',
         script: 'npm',
         args: 'start',
         cwd: '/path/to/your/app',
         instances: 'max',
         exec_mode: 'cluster',
         env: {
           NODE_ENV: 'production',
           PORT: 3000
         },
         error_file: './logs/err.log',
         out_file: './logs/out.log',
         log_file: './logs/combined.log',
         time: true
       }
     ]
   };
   ```

3. **Deploy with PM2**:

   ```bash
   # Start application
   pm2 start ecosystem.config.js

   # Save PM2 configuration
   pm2 save

   # Setup startup script
   pm2 startup

   # Monitor application
   pm2 monit
   ```

## Database Deployment

### Migration Strategy

1. **Staging Migration**:

   ```bash
   # Deploy migrations to staging
   npm run db:migrate:deploy

   # Verify data integrity
   npm run db:validate
   ```

2. **Production Migration**:

   ```bash
   # Create backup before migration
   npm run db:backup

   # Apply migrations
   npm run db:migrate:deploy

   # Verify migration success
   npm run db:validate
   ```

### Backup and Restore

1. **Create Backup**:

   ```bash
   # PostgreSQL backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

   # Automated backup script
   npm run db:backup
   ```

2. **Restore from Backup**:

   ```bash
   # Restore PostgreSQL backup
   psql $DATABASE_URL < backup_file.sql

   # Restore using npm script
   npm run db:restore backup_file.sql
   ```

## Environment-Specific Configurations

### Staging Environment

```env
# .env.staging
NODE_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/stemtoys_staging
NEXTAUTH_URL=https://staging.techtots.com
STRIPE_SECRET_KEY=sk_test_...
LOG_LEVEL=debug
```

### Production Environment

```env
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/stemtoys_prod
NEXTAUTH_URL=https://techtots.com
STRIPE_SECRET_KEY=sk_live_...
LOG_LEVEL=error
SENTRY_DSN=https://your-sentry-dsn
```

## CDN and Static Assets

### Vercel Automatic CDN

- Static assets automatically distributed
- Images optimized through Next.js Image Optimization
- Automatic cache headers

### Custom CDN Setup (AWS CloudFront)

1. **Configure CloudFront Distribution**:
   ```json
   {
     "Origins": [
       {
         "DomainName": "your-app.vercel.app",
         "Id": "nextjs-app",
         "CustomOriginConfig": {
           "HTTPPort": 443,
           "OriginProtocolPolicy": "https-only"
         }
       }
     ],
     "DefaultCacheBehavior": {
       "TargetOriginId": "nextjs-app",
       "ViewerProtocolPolicy": "redirect-to-https",
       "CachePolicyId": "managed-caching-optimized"
     }
   }
   ```

## SSL/TLS Configuration

### Automatic SSL (Vercel/Netlify)

- SSL certificates automatically managed
- Automatic renewal
- HTTPS redirect enabled

### Manual SSL Setup

1. **Obtain SSL Certificate**:

   ```bash
   # Using Let's Encrypt
   certbot certonly --standalone -d techtots.com -d www.techtots.com
   ```

2. **Configure Nginx**:

   ```nginx
   server {
     listen 443 ssl http2;
     server_name techtots.com www.techtots.com;

     ssl_certificate /etc/letsencrypt/live/techtots.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/techtots.com/privkey.pem;

     location / {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

## Monitoring and Health Checks

### Application Health Endpoints

The application includes built-in health check endpoints:

- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system health
- `/api/health/ready` - Readiness probe
- `/api/health/live` - Liveness probe

### Monitoring Setup

1. **Configure Monitoring**:

   ```bash
   # Set up monitoring environment variables
   SENTRY_DSN=https://your-sentry-dsn
   DATADOG_API_KEY=your-datadog-key
   ```

2. **Health Check Monitoring**:
   ```bash
   # Example health check script
   curl -f https://techtots.com/api/health || exit 1
   ```

## Rollback Procedures

### Vercel Rollback

1. **Using Vercel CLI**:

   ```bash
   # List recent deployments
   vercel ls

   # Promote previous deployment
   vercel promote <deployment-url> --target production
   ```

2. **Using Vercel Dashboard**:
   - Go to Deployments tab
   - Click "Promote to Production" on previous deployment

### Database Rollback

1. **Restore from Backup**:

   ```bash
   # Stop application
   pm2 stop stem-toys

   # Restore database
   npm run db:restore backup_before_migration.sql

   # Restart application
   pm2 start stem-toys
   ```

## Security Considerations

### Production Security Checklist

- [ ] All environment variables secured
- [ ] SSL/TLS certificates configured
- [ ] Database connections encrypted
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Access logs configured
- [ ] Vulnerability scanning enabled

### Environment Variable Security

```bash
# Use secure environment variable management
# Never commit .env files to version control
echo ".env*" >> .gitignore

# Use encrypted environment variables in CI/CD
# Rotate secrets regularly
```

## Performance Optimization

### Build Optimization

```json
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'lucide-react']
  },
  images: {
    domains: ['cdn.techtots.com'],
    formats: ['image/webp', 'image/avif']
  },
  compress: true,
  poweredByHeader: false
}
```

### Database Performance

```sql
-- Add indexes for better query performance
CREATE INDEX CONCURRENTLY idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_order_items_product_id ON order_items(product_id);
```

## Troubleshooting Deployment Issues

### Common Deployment Problems

1. **Build Failures**:

   ```bash
   # Check build logs
   npm run build 2>&1 | tee build.log

   # Check TypeScript errors
   npm run type-check
   ```

2. **Database Connection Issues**:

   ```bash
   # Test database connection
   npx prisma db pull

   # Check database URL format
   echo $DATABASE_URL
   ```

3. **Environment Variable Issues**:

   ```bash
   # Verify environment variables
   node -e "console.log(process.env.DATABASE_URL ? 'DB URL set' : 'DB URL missing')"
   ```

4. **Memory Issues**:
   ```json
   // package.json - Increase Node.js memory
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
     }
   }
   ```

### Deployment Logs

```bash
# View Vercel deployment logs
vercel logs <deployment-url>

# View Docker container logs
docker logs <container-id>

# View PM2 logs
pm2 logs stem-toys
```

## Post-Deployment Checklist

### Immediate Verification

- [ ] Application loads successfully
- [ ] Database connection works
- [ ] Authentication functions properly
- [ ] Payment processing works (staging)
- [ ] Email notifications work
- [ ] Search functionality works
- [ ] Admin dashboard accessible

### Performance Verification

- [ ] Page load times < 3 seconds
- [ ] Core Web Vitals scores acceptable
- [ ] Database query performance normal
- [ ] CDN cache hit rate > 80%
- [ ] Memory usage within limits

### Security Verification

- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] No sensitive data exposed
- [ ] Rate limiting functional
- [ ] Authentication working

## Maintenance Schedule

### Regular Maintenance Tasks

- **Daily**: Monitor application health and performance
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and update deployment procedures

### Update Procedures

```bash
# Update dependencies
npm update
npm audit fix

# Update Next.js
npm install next@latest

# Update database schema
npx prisma migrate deploy
```

## Emergency Procedures

### Critical Issue Response

1. **Immediate Response**:
   - Assess impact and severity
   - Implement rollback if necessary
   - Communicate with stakeholders

2. **Investigation**:
   - Check logs and monitoring
   - Identify root cause
   - Document findings

3. **Resolution**:
   - Apply fix and test thoroughly
   - Deploy fix to staging first
   - Monitor post-deployment

### Contact Information

- **DevOps Team**: devops@techtots.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX
- **Monitoring Dashboard**: https://monitoring.techtots.com

---

## Additional Resources

- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
