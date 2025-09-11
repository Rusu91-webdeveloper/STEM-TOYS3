# AI Bulk Upload Deployment Guide

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [AI Provider Configuration](#ai-provider-configuration)
- [Database Configuration](#database-configuration)
- [Redis Configuration](#redis-configuration)
- [Deployment Steps](#deployment-steps)
- [Production Configuration](#production-configuration)
- [Monitoring Setup](#monitoring-setup)
- [Security Considerations](#security-considerations)
- [Performance Tuning](#performance-tuning)
- [Backup and Recovery](#backup-and-recovery)
- [Maintenance](#maintenance)

## Overview

This guide provides comprehensive instructions for deploying the AI Bulk Upload
system in production environments. The system is designed to be scalable,
reliable, and secure for handling large volumes of product data with AI
enhancement.

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (OpenAI/etc)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Interface│    │   Redis Cache   │    │   Monitoring    │
│   Components    │    │   (Upstash)     │    │   Dashboard     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Database      │
                       └─────────────────┘
```

## Prerequisites

### System Requirements

#### Minimum Requirements

- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 100 Mbps

#### Recommended Requirements

- **CPU**: 4+ cores, 3.0+ GHz
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: 1 Gbps

#### Production Requirements

- **CPU**: 8+ cores, 3.5+ GHz
- **RAM**: 16+ GB
- **Storage**: 100+ GB SSD
- **Network**: 10 Gbps

### Software Requirements

- **Node.js**: 18.x or higher
- **npm/pnpm**: Latest version
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher (or Upstash Redis)
- **Docker**: 20.x or higher (optional)

### External Services

- **AI Provider**: OpenAI, Anthropic, or Google Gemini API access
- **Redis Provider**: Upstash Redis or self-hosted Redis
- **Database Provider**: Neon, Supabase, or self-hosted PostgreSQL
- **Hosting Provider**: Vercel, AWS, Google Cloud, or Azure

## Environment Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd STEM-TOYS3

# Install dependencies
npm install
# or
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL="postgresql://username:password@localhost:5432/stem_toys"
DIRECT_URL="postgresql://username:password@localhost:5432/stem_toys"

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_URL="redis://localhost:6379"
REDIS_TOKEN="your-redis-token"

# =============================================================================
# AI ENHANCEMENT CONFIGURATION
# =============================================================================
OPENAI_API_KEY="sk-your-openai-api-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
AI_PROVIDER="openai"
AI_MODEL="gpt-4"
AI_MAX_TOKENS="2000"
AI_TEMPERATURE="0.7"
AI_ENHANCEMENT_ENABLED="true"

# =============================================================================
# AUTHENTICATION
# =============================================================================
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 3. Environment Validation

The system includes automatic environment validation. Check the configuration:

```bash
npm run check:env
```

## AI Provider Configuration

### OpenAI Configuration

1. **Get API Key**: Sign up at [OpenAI Platform](https://platform.openai.com/)
2. **Set Environment Variables**:

   ```bash
   AI_PROVIDER="openai"
   OPENAI_API_KEY="sk-your-openai-api-key"
   AI_MODEL="gpt-4"  # or "gpt-3.5-turbo" for cost optimization
   ```

3. **Configure Rate Limits**:
   ```bash
   AI_MAX_TOKENS="2000"
   AI_TEMPERATURE="0.7"
   ```

### Anthropic Configuration

1. **Get API Key**: Sign up at
   [Anthropic Console](https://console.anthropic.com/)
2. **Set Environment Variables**:
   ```bash
   AI_PROVIDER="anthropic"
   ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
   AI_MODEL="claude-3-sonnet-20240229"
   ```

### Google Gemini Configuration

1. **Get API Key**: Sign up at
   [Google AI Studio](https://makersuite.google.com/)
2. **Set Environment Variables**:
   ```bash
   AI_PROVIDER="gemini"
   GEMINI_API_KEY="your-gemini-api-key"
   AI_MODEL="gemini-pro"
   ```

### AI Provider Selection

The system automatically selects the configured provider. You can switch
providers by changing the `AI_PROVIDER` environment variable.

## Database Configuration

### PostgreSQL Setup

#### Using Neon (Recommended)

1. **Create Account**: Sign up at [Neon](https://neon.tech/)
2. **Create Database**: Create a new PostgreSQL database
3. **Get Connection String**: Copy the connection string
4. **Set Environment Variables**:
   ```bash
   DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb"
   DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb"
   ```

#### Using Supabase

1. **Create Project**: Sign up at [Supabase](https://supabase.com/)
2. **Get Connection String**: From project settings
3. **Set Environment Variables**:
   ```bash
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   ```

#### Self-Hosted PostgreSQL

1. **Install PostgreSQL**: Follow your OS installation guide
2. **Create Database**: Create a new database
3. **Set Environment Variables**:
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/stem_toys"
   DIRECT_URL="postgresql://username:password@localhost:5432/stem_toys"
   ```

### Database Migration

Run database migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed database (optional)
npm run seed
```

## Redis Configuration

### Using Upstash Redis (Recommended)

1. **Create Account**: Sign up at [Upstash](https://upstash.com/)
2. **Create Database**: Create a new Redis database
3. **Get Credentials**: Copy URL and token
4. **Set Environment Variables**:
   ```bash
   REDIS_URL="redis://default:password@redis-xxx.upstash.io:6379"
   REDIS_TOKEN="your-redis-token"
   ```

### Self-Hosted Redis

1. **Install Redis**: Follow your OS installation guide
2. **Configure Redis**: Set up authentication and persistence
3. **Set Environment Variables**:
   ```bash
   REDIS_URL="redis://localhost:6379"
   REDIS_TOKEN=""
   ```

### Redis Configuration

For production, configure Redis with:

```bash
# Redis configuration
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Deployment Steps

### 1. Vercel Deployment (Recommended)

#### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add REDIS_URL
vercel env add OPENAI_API_KEY
# ... add all required environment variables
```

#### Using Vercel Dashboard

1. **Connect Repository**: Connect your GitHub repository
2. **Configure Project**: Set build and output settings
3. **Add Environment Variables**: Add all required environment variables
4. **Deploy**: Trigger deployment

### 2. Docker Deployment

#### Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
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

#### Build and Run

```bash
# Build Docker image
docker build -t stem-toys-ai .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e REDIS_URL="your-redis-url" \
  -e OPENAI_API_KEY="your-openai-key" \
  stem-toys-ai
```

### 3. AWS Deployment

#### Using AWS Amplify

1. **Connect Repository**: Connect your GitHub repository
2. **Configure Build**: Set build settings
3. **Add Environment Variables**: Add all required variables
4. **Deploy**: Trigger deployment

#### Using AWS ECS

1. **Create ECS Cluster**: Set up ECS cluster
2. **Create Task Definition**: Define container configuration
3. **Create Service**: Deploy service with load balancer
4. **Configure Environment**: Set environment variables

### 4. Google Cloud Deployment

#### Using Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT-ID/stem-toys-ai

# Deploy to Cloud Run
gcloud run deploy stem-toys-ai \
  --image gcr.io/PROJECT-ID/stem-toys-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Production Configuration

### 1. Environment Variables

#### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."
REDIS_TOKEN="..."

# AI Configuration
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
AI_MODEL="gpt-4"
AI_MAX_TOKENS="2000"
AI_TEMPERATURE="0.7"
AI_ENHANCEMENT_ENABLED="true"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

#### Optional Variables

```bash
# Monitoring
SENTRY_DSN="your-sentry-dsn"

# Analytics
GOOGLE_ANALYTICS_ID="GA-..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 2. Security Configuration

#### HTTPS Configuration

Ensure HTTPS is enabled:

```bash
# Vercel automatically provides HTTPS
# For other platforms, configure SSL certificates
```

#### CORS Configuration

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://your-domain.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};
```

#### Rate Limiting

The system includes built-in rate limiting. Configure additional limits if
needed:

```typescript
// Custom rate limiting middleware
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});
```

### 3. Performance Configuration

#### Next.js Configuration

```typescript
// next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  images: {
    domains: ["your-image-domain.com"],
  },
  compress: true,
  poweredByHeader: false,
};
```

#### Database Connection Pooling

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

## Monitoring Setup

### 1. Health Monitoring

#### Built-in Monitoring

The system includes a built-in monitoring dashboard:

- **Access**: `/admin/ai-monitoring`
- **Features**: Real-time health status, performance metrics, alerts
- **Refresh**: Auto-refresh every 30 seconds

#### Health Check Endpoint

```bash
# Check system health
curl "https://your-domain.com/api/admin/ai/health"
```

### 2. External Monitoring

#### Sentry Integration

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
SENTRY_DSN="your-sentry-dsn"
```

#### Uptime Monitoring

Set up uptime monitoring with services like:

- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring
- **StatusCake**: Comprehensive monitoring

### 3. Logging

#### Application Logs

```typescript
// lib/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
```

## Security Considerations

### 1. API Security

#### Authentication

- **Admin-only Access**: All AI endpoints require admin authentication
- **Session Management**: Secure session handling with NextAuth
- **Token Validation**: Validate all API tokens

#### Input Validation

```typescript
// Validate all inputs
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category: z.string().min(1),
  // ... other fields
});
```

### 2. Data Security

#### Encryption

- **Data in Transit**: HTTPS for all communications
- **Data at Rest**: Database encryption
- **API Keys**: Secure storage of API keys

#### Access Control

- **Role-based Access**: Admin-only access to AI features
- **Audit Logging**: Log all admin actions
- **Rate Limiting**: Prevent abuse

### 3. AI Security

#### API Key Management

- **Secure Storage**: Store API keys in environment variables
- **Key Rotation**: Regularly rotate API keys
- **Access Monitoring**: Monitor API key usage

#### Data Privacy

- **No Data Storage**: AI providers don't store your data
- **Data Minimization**: Send only necessary data to AI services
- **Audit Trail**: Log all AI interactions

## Performance Tuning

### 1. Database Optimization

#### Connection Pooling

```typescript
// Configure connection pool
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["query", "info", "warn", "error"],
});
```

#### Query Optimization

- **Indexes**: Add indexes for frequently queried fields
- **Query Analysis**: Monitor slow queries
- **Connection Limits**: Set appropriate connection limits

### 2. Caching Strategy

#### Redis Configuration

```bash
# Redis configuration for production
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Cache TTL

- **AI Responses**: 24 hours
- **Product Enhancements**: 7 days
- **Health Checks**: 5 minutes
- **Rate Limits**: 1 minute

### 3. AI Optimization

#### Batch Processing

- **Optimal Batch Size**: 10-50 products
- **Streaming Mode**: For large batches (>100 products)
- **Memory Management**: Monitor memory usage

#### Rate Limiting

- **Provider Limits**: Respect AI provider rate limits
- **User Limits**: Implement per-user rate limits
- **Burst Protection**: Handle burst requests

## Backup and Recovery

### 1. Database Backup

#### Automated Backups

```bash
# PostgreSQL backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Cloud Provider Backups

- **Neon**: Automatic backups with point-in-time recovery
- **Supabase**: Daily backups with retention policies
- **AWS RDS**: Automated backups with configurable retention

### 2. Redis Backup

#### Upstash Backups

- **Automatic Backups**: Daily backups with 7-day retention
- **Manual Backups**: On-demand backup creation
- **Restore**: Point-in-time recovery

### 3. Application Backup

#### Code Backup

- **Git Repository**: Version control with remote backup
- **Deployment History**: Keep deployment history
- **Configuration Backup**: Backup environment configurations

## Maintenance

### 1. Regular Maintenance

#### Daily Tasks

- **Health Checks**: Monitor system health
- **Error Review**: Review error logs
- **Performance Monitoring**: Check performance metrics

#### Weekly Tasks

- **Log Rotation**: Rotate application logs
- **Cache Cleanup**: Clean expired cache entries
- **Security Updates**: Check for security updates

#### Monthly Tasks

- **Database Maintenance**: Optimize database
- **Dependency Updates**: Update dependencies
- **Performance Review**: Review performance metrics

### 2. Monitoring and Alerts

#### Key Metrics

- **Response Time**: < 5 seconds average
- **Success Rate**: > 95%
- **Error Rate**: < 5%
- **Memory Usage**: < 80%
- **Cache Hit Rate**: > 70%

#### Alert Thresholds

- **Critical**: Error rate > 10%, Response time > 10s
- **Warning**: Error rate > 5%, Response time > 5s
- **Info**: Memory usage > 80%, Cache hit rate < 50%

### 3. Troubleshooting

#### Common Issues

1. **High Memory Usage**: Reduce batch size, enable streaming
2. **Slow Response Times**: Check AI service status, optimize queries
3. **Rate Limit Errors**: Implement backoff, reduce request frequency
4. **Database Errors**: Check connection pool, optimize queries

#### Recovery Procedures

1. **Service Restart**: Restart application services
2. **Cache Clear**: Clear Redis cache if corrupted
3. **Database Recovery**: Restore from backup if needed
4. **Rollback**: Rollback to previous version if necessary

---

_This deployment guide is regularly updated. Check for the latest version and
updates._
