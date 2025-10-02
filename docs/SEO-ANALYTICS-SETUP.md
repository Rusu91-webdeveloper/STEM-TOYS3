# SEO Analytics Data Collection Setup

This document explains how to set up automatic daily SEO analytics data
collection for historical trend analysis and reporting.

## Overview

The SEO Analytics system automatically collects and stores daily SEO data
including:

- Keyword rankings and position changes
- Click and impression data
- CTR trends over time
- Competitor analysis data

## Database Schema

The system uses a dedicated `SEOAnalytics` table with the following structure:

```prisma
model SEOAnalytics {
  id              String   @id @default(cuid())
  keyword         String
  position        Float
  previousPosition Float?
  clicks          Int
  impressions     Int
  ctr             Float
  url             String?
  searchVolume    Int?
  difficulty      Int?
  intent          String?
  competitorGap   Boolean  @default(false)
  targetPage      String?
  dateRecorded    DateTime @default(now())
  dataSource      String   @default("GSC") // GSC, SEMrush, Ahrefs, etc.
  country         String   @default("ROU") // Romania by default
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([keyword, dateRecorded])
  @@index([dateRecorded])
  @@index([dataSource])
  @@index([country])
}
```

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# SEO Analytics Cron Job Secret Token
CRON_SECRET_TOKEN=your-secure-random-token-here
NEXT_PUBLIC_CRON_SECRET_TOKEN=your-secure-random-token-here
```

Generate a secure token:

```bash
openssl rand -base64 32
```

## Manual Data Collection

### Via Dashboard Button

1. Go to `/admin/seo-dashboard`
2. Click the "💾 Save Analytics" button in the top-right corner
3. Monitor the success/error message

### Via API Endpoint

```bash
curl -X POST http://localhost:3000/api/cron/daily-seo-analytics \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

### Via NPM Script

```bash
npm run seo-analytics:manual
```

### Via Direct Script

```bash
npx tsx scripts/save-daily-seo-analytics.ts
```

## Automated Daily Collection (Cron Job)

### Option 1: Server Cron Job (Recommended for Production)

Add this to your server's crontab (`crontab -e`):

```bash
# Run SEO analytics collection daily at 2 AM
0 2 * * * curl -X GET "https://yourdomain.com/api/cron/daily-seo-analytics" -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN" >> /var/log/seo-analytics.log 2>&1
```

### Option 2: PM2 Cron Job

If using PM2, create a cron job:

```bash
# Install pm2-cron if not already installed
npm install -g pm2-cron

# Add cron job
pm2cron add "seo-analytics-daily" "0 2 * * *" "cd /path/to/your/app && npm run seo-analytics:daily"
```

### Option 3: GitHub Actions (for Vercel/Netlify)

Create `.github/workflows/seo-analytics.yml`:

```yaml
name: Daily SEO Analytics Collection

on:
  schedule:
    - cron: "0 2 * * *" # 2 AM daily
  workflow_dispatch: # Manual trigger

jobs:
  collect-analytics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect SEO Analytics
        run: |
          curl -X GET "${{ secrets.SEO_ANALYTICS_URL }}/api/cron/daily-seo-analytics" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}"
```

Add these secrets to your GitHub repository:

- `SEO_ANALYTICS_URL`: Your production domain URL
- `CRON_SECRET_TOKEN`: Your secure token

### Option 4: Vercel Cron Jobs (for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-seo-analytics",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Monitoring & Maintenance

### Check Data Collection

```sql
-- Check recent data collection
SELECT
  DATE(dateRecorded) as date,
  COUNT(*) as records_saved,
  COUNT(DISTINCT keyword) as unique_keywords
FROM SEOAnalytics
WHERE dateRecorded >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(dateRecorded)
ORDER BY date DESC;
```

### Monitor Cron Job Logs

```bash
# Check system logs
tail -f /var/log/seo-analytics.log

# Check PM2 logs
pm2 logs seo-analytics-daily

# Check application logs for cron endpoint
grep "daily SEO analytics" /path/to/your/app/logs/*.log
```

### Data Retention

The system automatically retains all historical data. Consider implementing data
archiving for older records:

```sql
-- Archive data older than 1 year
INSERT INTO SEOAnalyticsArchive
SELECT * FROM SEOAnalytics
WHERE dateRecorded < DATE_SUB(NOW(), INTERVAL 1 YEAR);

DELETE FROM SEOAnalytics
WHERE dateRecorded < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

## Troubleshooting

### Common Issues

1. **Cron job not running**
   - Check system cron logs: `grep CRON /var/log/syslog`
   - Verify token is correct in environment variables
   - Test API endpoint manually

2. **No data being saved**
   - Check database connection
   - Verify GSC service is returning data
   - Check application logs for errors

3. **Duplicate data**
   - The system prevents duplicates by checking existing records for the same
     day
   - If duplicates appear, check the deduplication logic

### Debug Commands

```bash
# Test API endpoint
curl -v -X GET "http://localhost:3000/api/cron/daily-seo-analytics" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Run script with debug output
DEBUG=* npm run seo-analytics:daily

# Check database records
npx prisma studio
```

## API Endpoints

### GET `/api/cron/daily-seo-analytics`

- **Purpose**: Trigger daily analytics collection (cron endpoint)
- **Auth**: Bearer token required
- **Response**: Status of data collection

### POST `/api/cron/daily-seo-analytics`

- **Purpose**: Manually trigger analytics collection
- **Auth**: Bearer token required
- **Response**: Detailed collection results

## Data Analysis Queries

### Keyword Performance Trends

```sql
SELECT
  keyword,
  DATE(dateRecorded) as date,
  position,
  clicks,
  impressions,
  ctr,
  previousPosition - position as position_change
FROM SEOAnalytics
WHERE keyword = 'jucării STEM România'
ORDER BY dateRecorded DESC
LIMIT 30;
```

### Overall SEO Health

```sql
SELECT
  DATE(dateRecorded) as date,
  AVG(position) as avg_position,
  SUM(clicks) as total_clicks,
  SUM(impressions) as total_impressions,
  AVG(ctr) as avg_ctr,
  COUNT(DISTINCT keyword) as keywords_tracked
FROM SEOAnalytics
WHERE dateRecorded >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(dateRecorded)
ORDER BY date DESC;
```

### Competitor Gap Analysis

```sql
SELECT
  keyword,
  position,
  competitorGap,
  searchVolume,
  difficulty
FROM SEOAnalytics
WHERE competitorGap = true
  AND dateRecorded >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY searchVolume DESC;
```

## Future Enhancements

- [ ] Add more data sources (SEMrush, Ahrefs API integration)
- [ ] Implement data visualization dashboards
- [ ] Add automated alerts for ranking drops
- [ ] Create competitor monitoring alerts
- [ ] Add seasonal trend analysis
- [ ] Implement data export functionality
