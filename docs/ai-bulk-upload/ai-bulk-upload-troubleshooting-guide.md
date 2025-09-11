# AI Bulk Upload Troubleshooting Guide

## Table of Contents

- [Overview](#overview)
- [Common Issues](#common-issues)
- [Error Codes and Solutions](#error-codes-and-solutions)
- [System Diagnostics](#system-diagnostics)
- [Performance Issues](#performance-issues)
- [AI Service Issues](#ai-service-issues)
- [Database Issues](#database-issues)
- [Cache Issues](#cache-issues)
- [Monitoring and Logging](#monitoring-and-logging)
- [Recovery Procedures](#recovery-procedures)
- [Preventive Maintenance](#preventive-maintenance)
- [Support and Escalation](#support-and-escalation)

## Overview

This troubleshooting guide provides comprehensive solutions for common issues
encountered with the AI Bulk Upload system. It includes diagnostic procedures,
error resolution steps, and preventive maintenance guidelines.

### Quick Reference

| Issue Type                     | Common Symptoms                       | Quick Fix                                 |
| ------------------------------ | ------------------------------------- | ----------------------------------------- |
| **AI Enhancement Not Working** | Toggle disabled, no content generated | Check AI configuration and API keys       |
| **Slow Processing**            | Long response times, timeouts         | Reduce batch size, check system resources |
| **Memory Issues**              | High memory usage, crashes            | Enable streaming mode, reduce batch size  |
| **Rate Limit Errors**          | 429 errors, request rejections        | Wait for reset, reduce request frequency  |
| **Database Errors**            | Connection failures, query timeouts   | Check connection pool, optimize queries   |

## Common Issues

### 1. AI Enhancement Not Working

#### Symptoms

- AI enhancement toggle is disabled
- No AI-generated content appears
- Error messages about AI service
- Products processed without enhancement

#### Diagnostic Steps

1. **Check AI Configuration**

   ```bash
   # Check environment variables
   echo $AI_ENHANCEMENT_ENABLED
   echo $AI_PROVIDER
   echo $OPENAI_API_KEY
   ```

2. **Verify API Keys**

   ```bash
   # Test API key validity
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

3. **Check Health Status**
   ```bash
   # Check AI service health
   curl "https://your-domain.com/api/admin/ai/health"
   ```

#### Solutions

**Issue**: AI enhancement disabled

```bash
# Enable AI enhancement
export AI_ENHANCEMENT_ENABLED=true
```

**Issue**: Invalid API key

```bash
# Update API key
export OPENAI_API_KEY="sk-your-valid-api-key"
```

**Issue**: AI service unavailable

```bash
# Check service status
curl "https://api.openai.com/v1/models"
# Wait for service recovery or switch providers
```

### 2. Slow Processing

#### Symptoms

- Response times > 10 seconds
- Batch processing taking too long
- System becoming unresponsive
- Timeout errors

#### Diagnostic Steps

1. **Check System Resources**

   ```bash
   # Check memory usage
   free -h

   # Check CPU usage
   top

   # Check disk usage
   df -h
   ```

2. **Monitor Performance**

   ```bash
   # Check response times
   curl -w "@curl-format.txt" -o /dev/null -s "https://your-domain.com/api/admin/ai/health"
   ```

3. **Check Batch Size**
   ```bash
   # Check current batch configuration
   curl "https://your-domain.com/api/admin/ai/health" | jq '.memory'
   ```

#### Solutions

**Issue**: Large batch size

```typescript
// Reduce batch size
const batchSize = Math.min(currentBatchSize, 20);
```

**Issue**: High memory usage

```typescript
// Enable streaming mode
const streamingMode = memoryUsage > 80;
```

**Issue**: AI service latency

```typescript
// Implement timeout and retry
const timeout = 30000; // 30 seconds
const maxRetries = 3;
```

### 3. Memory Issues

#### Symptoms

- High memory usage (>80%)
- Out of memory errors
- System crashes
- Slow garbage collection

#### Diagnostic Steps

1. **Check Memory Usage**

   ```bash
   # Check current memory usage
   ps aux --sort=-%mem | head -10

   # Check memory limits
   cat /proc/meminfo
   ```

2. **Monitor Memory Growth**
   ```bash
   # Monitor memory over time
   while true; do
     echo "$(date): $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
     sleep 60
   done
   ```

#### Solutions

**Issue**: Memory leaks

```typescript
// Force garbage collection
if (global.gc) {
  global.gc();
}

// Clear large objects
largeObject = null;
```

**Issue**: Large batches

```typescript
// Reduce batch size
const maxBatchSize = Math.floor(availableMemory / 10);
```

**Issue**: Cache bloat

```typescript
// Clear cache
await redis.flushall();
```

### 4. Rate Limit Errors

#### Symptoms

- HTTP 429 errors
- "Rate limit exceeded" messages
- Requests being rejected
- Slow response times

#### Diagnostic Steps

1. **Check Rate Limit Status**

   ```bash
   # Check current rate limits
   curl "https://your-domain.com/api/admin/ai/health" | jq '.rateLimits'
   ```

2. **Monitor Request Frequency**
   ```bash
   # Check request logs
   tail -f /var/log/application.log | grep "rate limit"
   ```

#### Solutions

**Issue**: OpenAI rate limits

```typescript
// Implement exponential backoff
const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
await sleep(backoffDelay);
```

**Issue**: High request frequency

```typescript
// Reduce request frequency
const delayBetweenRequests = 1000; // 1 second
await sleep(delayBetweenRequests);
```

**Issue**: Multiple users

```typescript
// Implement per-user rate limiting
const userRateLimit = 30; // requests per minute per user
```

## Error Codes and Solutions

### HTTP Error Codes

#### 400 Bad Request

**Cause**: Invalid request data or validation errors **Solution**:

```typescript
// Validate request data
const validationResult = schema.safeParse(requestData);
if (!validationResult.success) {
  return { error: "Validation failed", details: validationResult.error };
}
```

#### 401 Unauthorized

**Cause**: Missing or invalid authentication **Solution**:

```typescript
// Check authentication
const session = await auth();
if (!session?.user) {
  return { error: "Not authenticated" };
}
```

#### 403 Forbidden

**Cause**: Insufficient permissions **Solution**:

```typescript
// Check admin permissions
if (!isAdmin(session.user)) {
  return { error: "Not authorized" };
}
```

#### 429 Too Many Requests

**Cause**: Rate limit exceeded **Solution**:

```typescript
// Implement rate limiting
const rateLimitResult = await checkRateLimit(provider, userId);
if (!rateLimitResult.allowed) {
  return {
    error: "Rate limit exceeded",
    retryAfter: rateLimitResult.retryAfter,
  };
}
```

#### 500 Internal Server Error

**Cause**: Server-side error **Solution**:

```typescript
// Add error handling
try {
  const result = await processRequest();
  return result;
} catch (error) {
  console.error("Server error:", error);
  return { error: "Internal server error" };
}
```

### AI Service Error Codes

#### AI_SERVICE_UNAVAILABLE

**Cause**: AI service is down or unreachable **Solution**:

```typescript
// Implement service health check
const healthCheck = await checkAIServiceHealth();
if (!healthCheck.isHealthy) {
  throw new Error("AI service unavailable");
}
```

#### AI_RATE_LIMIT_EXCEEDED

**Cause**: AI provider rate limit exceeded **Solution**:

```typescript
// Implement backoff and retry
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
};
```

#### AI_INVALID_RESPONSE

**Cause**: AI service returned invalid response **Solution**:

```typescript
// Validate AI response
const response = await aiService.generate(prompt);
if (!response || response.length === 0) {
  throw new Error("Invalid AI response");
}
```

### Database Error Codes

#### DB_CONNECTION_FAILED

**Cause**: Database connection lost **Solution**:

```typescript
// Implement connection retry
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["error"],
});
```

#### DB_QUERY_TIMEOUT

**Cause**: Database query taking too long **Solution**:

```typescript
// Optimize queries and add timeouts
const result = await db.product.findMany({
  where: { category: "Robotics" },
  take: 100,
  timeout: 10000,
});
```

#### DB_CONSTRAINT_VIOLATION

**Cause**: Database constraint violation **Solution**:

```typescript
// Handle constraint violations
try {
  await db.product.create({ data: productData });
} catch (error) {
  if (error.code === "P2002") {
    throw new Error("Product already exists");
  }
  throw error;
}
```

## System Diagnostics

### 1. Health Check Commands

#### System Health

```bash
# Check system resources
echo "=== System Resources ==="
free -h
df -h
uptime

# Check running processes
echo "=== Running Processes ==="
ps aux --sort=-%mem | head -10

# Check network connectivity
echo "=== Network Connectivity ==="
ping -c 3 google.com
```

#### Application Health

```bash
# Check application status
curl -s "https://your-domain.com/api/admin/ai/health" | jq '.'

# Check database connectivity
curl -s "https://your-domain.com/api/health/db"

# Check Redis connectivity
curl -s "https://your-domain.com/api/health/redis"
```

#### AI Service Health

```bash
# Check OpenAI status
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check Anthropic status
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     https://api.anthropic.com/v1/messages

# Check Gemini status
curl "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"
```

### 2. Performance Diagnostics

#### Response Time Analysis

```bash
# Test response times
for i in {1..10}; do
  echo "Test $i:"
  curl -w "Time: %{time_total}s\n" -o /dev/null -s \
       "https://your-domain.com/api/admin/ai/health"
done
```

#### Memory Usage Analysis

```bash
# Monitor memory usage
while true; do
  echo "$(date): Memory usage: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
  sleep 30
done
```

#### Database Performance

```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check connection count
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

### 3. Log Analysis

#### Application Logs

```bash
# Check recent errors
tail -100 /var/log/application.log | grep ERROR

# Check AI service logs
tail -100 /var/log/application.log | grep "AI service"

# Check performance logs
tail -100 /var/log/application.log | grep "response time"
```

#### System Logs

```bash
# Check system errors
journalctl -u your-service --since "1 hour ago" | grep ERROR

# Check memory issues
dmesg | grep -i "out of memory"

# Check network issues
journalctl -u NetworkManager --since "1 hour ago"
```

## Performance Issues

### 1. Slow Response Times

#### Causes and Solutions

**Cause**: Large batch sizes

```typescript
// Solution: Reduce batch size
const optimalBatchSize = Math.min(50, Math.floor(availableMemory / 10));
```

**Cause**: AI service latency

```typescript
// Solution: Implement timeout and retry
const timeout = 30000; // 30 seconds
const maxRetries = 3;
```

**Cause**: Database query performance

```typescript
// Solution: Optimize queries
const products = await db.product.findMany({
  where: { category: "Robotics" },
  select: { id: true, name: true, price: true },
  take: 100,
});
```

**Cause**: Memory pressure

```typescript
// Solution: Enable streaming mode
if (memoryUsage > 80) {
  await enableStreamingMode();
}
```

### 2. High Memory Usage

#### Causes and Solutions

**Cause**: Memory leaks

```typescript
// Solution: Force garbage collection
if (global.gc) {
  global.gc();
}
```

**Cause**: Large objects in memory

```typescript
// Solution: Clear large objects
largeObject = null;
delete largeObject;
```

**Cause**: Cache bloat

```typescript
// Solution: Clear cache
await redis.flushall();
```

**Cause**: Too many concurrent requests

```typescript
// Solution: Limit concurrent requests
const maxConcurrent = 10;
const semaphore = new Semaphore(maxConcurrent);
```

### 3. High CPU Usage

#### Causes and Solutions

**Cause**: Inefficient algorithms

```typescript
// Solution: Optimize algorithms
const optimizedAlgorithm = useOptimizedAlgorithm();
```

**Cause**: Too many concurrent processes

```typescript
// Solution: Limit concurrency
const maxConcurrency = 5;
const pool = new WorkerPool(maxConcurrency);
```

**Cause**: Frequent garbage collection

```typescript
// Solution: Optimize memory usage
const memoryOptimized = optimizeMemoryUsage();
```

## AI Service Issues

### 1. OpenAI Issues

#### Common Problems

**Problem**: API key invalid

```bash
# Solution: Check and update API key
export OPENAI_API_KEY="sk-your-valid-api-key"
```

**Problem**: Rate limit exceeded

```typescript
// Solution: Implement backoff
const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
await sleep(backoffDelay);
```

**Problem**: Model not available

```typescript
// Solution: Check available models
const models = await openai.models.list();
const availableModel = models.data.find(m => m.id === "gpt-4");
```

#### OpenAI Status Check

```bash
# Check OpenAI status
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check usage limits
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/usage
```

### 2. Anthropic Issues

#### Common Problems

**Problem**: API key invalid

```bash
# Solution: Check and update API key
export ANTHROPIC_API_KEY="sk-ant-your-valid-api-key"
```

**Problem**: Rate limit exceeded

```typescript
// Solution: Implement backoff
const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
await sleep(backoffDelay);
```

#### Anthropic Status Check

```bash
# Check Anthropic status
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     https://api.anthropic.com/v1/messages
```

### 3. Google Gemini Issues

#### Common Problems

**Problem**: API key invalid

```bash
# Solution: Check and update API key
export GEMINI_API_KEY="your-valid-gemini-api-key"
```

**Problem**: Quota exceeded

```typescript
// Solution: Check quota and implement backoff
const quotaCheck = await checkGeminiQuota();
if (quotaCheck.exceeded) {
  await sleep(quotaCheck.resetTime);
}
```

#### Gemini Status Check

```bash
# Check Gemini status
curl "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"
```

## Database Issues

### 1. Connection Issues

#### Common Problems

**Problem**: Connection pool exhausted

```typescript
// Solution: Increase connection pool
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Increase connection pool
  connectionLimit: 20,
  maxConnections: 100,
});
```

**Problem**: Connection timeout

```typescript
// Solution: Increase timeout
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Increase timeout
  connectionTimeout: 30000,
  queryTimeout: 10000,
});
```

#### Database Health Check

```sql
-- Check connection count
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. Query Performance Issues

#### Common Problems

**Problem**: Slow queries

```sql
-- Solution: Add indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
```

**Problem**: Missing indexes

```sql
-- Solution: Analyze and add indexes
EXPLAIN ANALYZE SELECT * FROM products WHERE category = 'Robotics';
```

**Problem**: Query timeouts

```typescript
// Solution: Optimize queries
const products = await db.product.findMany({
  where: { category: "Robotics" },
  select: { id: true, name: true, price: true },
  take: 100,
  timeout: 10000,
});
```

## Cache Issues

### 1. Redis Issues

#### Common Problems

**Problem**: Redis connection failed

```bash
# Solution: Check Redis status
redis-cli ping

# Check Redis configuration
redis-cli config get "*"
```

**Problem**: Cache miss rate high

```typescript
// Solution: Optimize cache strategy
const cacheStrategy = {
  ttl: 3600, // 1 hour
  maxSize: 1000,
  evictionPolicy: "lru",
};
```

**Problem**: Memory usage high

```bash
# Solution: Check Redis memory usage
redis-cli info memory

# Clear cache if needed
redis-cli flushall
```

#### Redis Health Check

```bash
# Check Redis status
redis-cli ping

# Check memory usage
redis-cli info memory

# Check key count
redis-cli dbsize
```

### 2. Cache Performance Issues

#### Common Problems

**Problem**: Cache hit rate low

```typescript
// Solution: Optimize cache keys
const cacheKey = `ai:enhancement:${product.category}:${product.name}`;
```

**Problem**: Cache expiration too short

```typescript
// Solution: Increase TTL
const ttl = 86400; // 24 hours
await redis.setex(key, ttl, value);
```

**Problem**: Cache size too small

```typescript
// Solution: Increase cache size
const maxMemory = "2gb";
const maxMemoryPolicy = "allkeys-lru";
```

## Monitoring and Logging

### 1. Application Monitoring

#### Key Metrics

```typescript
// Monitor key metrics
const metrics = {
  responseTime: await getResponseTime(),
  throughput: await getThroughput(),
  errorRate: await getErrorRate(),
  memoryUsage: await getMemoryUsage(),
  cacheHitRate: await getCacheHitRate(),
};
```

#### Alerting

```typescript
// Set up alerts
const alerts = [
  {
    name: "High Response Time",
    condition: "responseTime > 5000",
    severity: "warning",
  },
  {
    name: "High Error Rate",
    condition: "errorRate > 0.05",
    severity: "critical",
  },
  {
    name: "Memory Pressure",
    condition: "memoryUsage > 0.8",
    severity: "warning",
  },
];
```

### 2. Log Management

#### Log Levels

```typescript
// Configure log levels
const logLevels = {
  error: "ERROR",
  warn: "WARN",
  info: "INFO",
  debug: "DEBUG",
};
```

#### Log Rotation

```bash
# Configure log rotation
logrotate -f /etc/logrotate.d/application
```

#### Log Analysis

```bash
# Analyze logs
tail -1000 /var/log/application.log | grep ERROR | wc -l
tail -1000 /var/log/application.log | grep "response time" | awk '{print $NF}' | sort -n
```

## Recovery Procedures

### 1. Service Recovery

#### Application Restart

```bash
# Restart application
systemctl restart your-application

# Check status
systemctl status your-application
```

#### Database Recovery

```bash
# Restart database
systemctl restart postgresql

# Check status
systemctl status postgresql
```

#### Redis Recovery

```bash
# Restart Redis
systemctl restart redis

# Check status
systemctl status redis
```

### 2. Data Recovery

#### Database Backup

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_file.sql
```

#### Redis Backup

```bash
# Create Redis backup
redis-cli bgsave

# Restore Redis backup
redis-cli --rdb /var/lib/redis/dump.rdb
```

### 3. Configuration Recovery

#### Environment Variables

```bash
# Backup environment variables
cp .env.local .env.local.backup

# Restore environment variables
cp .env.local.backup .env.local
```

#### Configuration Files

```bash
# Backup configuration
cp config.json config.json.backup

# Restore configuration
cp config.json.backup config.json
```

## Preventive Maintenance

### 1. Regular Maintenance Tasks

#### Daily Tasks

```bash
# Check system health
curl -s "https://your-domain.com/api/admin/ai/health" | jq '.'

# Check disk space
df -h

# Check memory usage
free -h
```

#### Weekly Tasks

```bash
# Clean up logs
find /var/log -name "*.log" -mtime +7 -delete

# Update dependencies
npm update

# Check security updates
npm audit
```

#### Monthly Tasks

```bash
# Database maintenance
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Redis maintenance
redis-cli flushdb

# System updates
apt update && apt upgrade
```

### 2. Performance Monitoring

#### Regular Monitoring

```typescript
// Set up regular monitoring
const monitoringSchedule = {
  healthCheck: "*/5 * * * *", // Every 5 minutes
  performanceCheck: "*/15 * * * *", // Every 15 minutes
  fullReport: "0 0 * * *", // Daily
};
```

#### Alerting Setup

```typescript
// Set up alerting
const alertingConfig = {
  email: "admin@your-domain.com",
  slack: "https://hooks.slack.com/your-webhook",
  pagerduty: "your-pagerduty-key",
};
```

### 3. Backup Strategy

#### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/db_backup_$DATE.sql
find /backups -name "db_backup_*.sql" -mtime +30 -delete
```

#### Configuration Backups

```bash
# Configuration backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/config_backup_$DATE.tar.gz /etc/your-app/
find /backups -name "config_backup_*.tar.gz" -mtime +30 -delete
```

## Support and Escalation

### 1. Support Levels

#### Level 1: Basic Support

- **Scope**: Common issues, basic troubleshooting
- **Response Time**: 4 hours
- **Escalation**: If not resolved in 24 hours

#### Level 2: Advanced Support

- **Scope**: Complex issues, performance problems
- **Response Time**: 2 hours
- **Escalation**: If not resolved in 12 hours

#### Level 3: Expert Support

- **Scope**: Critical issues, system failures
- **Response Time**: 1 hour
- **Escalation**: If not resolved in 4 hours

### 2. Escalation Procedures

#### Escalation Criteria

- **Critical**: System down, data loss, security breach
- **High**: Performance degradation, service unavailable
- **Medium**: Feature not working, minor issues
- **Low**: Enhancement requests, documentation

#### Escalation Process

1. **Document Issue**: Record symptoms, steps taken, error messages
2. **Check Resources**: Review documentation, knowledge base
3. **Escalate**: Contact appropriate support level
4. **Follow Up**: Monitor progress, provide additional information

### 3. Contact Information

#### Support Channels

- **Email**: support@your-domain.com
- **Slack**: #ai-bulk-upload-support
- **Phone**: +1-555-0123 (Critical issues only)
- **Portal**: https://support.your-domain.com

#### Emergency Contacts

- **On-call Engineer**: +1-555-0124
- **Manager**: +1-555-0125
- **Director**: +1-555-0126

---

_This troubleshooting guide is regularly updated. Check for the latest version
and solutions._
