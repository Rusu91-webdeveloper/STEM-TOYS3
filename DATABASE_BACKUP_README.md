# Complete Database Backup & Restore System

## Overview

This comprehensive system provides **COMPLETE** backup and restore functionality
for your TechTots STEM Store database, covering **ALL 56 tables** and ensuring
total data recovery in case of any database disaster.

## Database Status Summary

**Total Tables:** 56

- **Tables with Data:** 5 (User, Category, Language, EmailTemplate,
  ConversionLog)
- **Empty Tables:** 51 (ready for future data)
- **Total Records:** 44 across all tables

## Available Backup Systems

### 🚀 **Option 1: Full Database Backup (RECOMMENDED)**

**For complete database recovery including schema and all data.**

#### Creating Full Backup:

```bash
npx tsx scripts/full-database-backup.ts
```

#### Restoring Full Database:

```bash
npx tsx scripts/full-database-restore.ts
```

**What it backs up:**

- ✅ **ALL 56 tables** (even empty ones)
- ✅ **Complete schema** (via Prisma schema backup)
- ✅ **All data** with proper dependency ordering
- ✅ **Foreign key relationships** respected
- ✅ **Automatic verification** after restore

---

### 🔧 **Option 2: Critical Data Backup (LIGHTWEIGHT)**

**For backing up only tables with existing data.**

#### Creating Critical Data Backup:

```bash
npx tsx scripts/backup-current-data.ts
```

#### Restoring Critical Data:

```bash
npx tsx scripts/restore-database-backup.ts
```

**What it backs up:**

- ✅ Only tables with actual data (currently 5 tables)
- ✅ Optimized for speed and size
- ✅ Perfect for regular maintenance

## Detailed Table Coverage

### 📊 **Tables with Current Data (44 records total):**

- **User**: 1 record (Admin user)
- **Category**: 5 records (STEM categories)
- **Language**: 2 records (Romanian, English)
- **EmailTemplate**: 22 records (Email system)
- **ConversionLog**: 14 records (Analytics)

### 🗂️ **All 56 Tables (Ready for Future Data):**

**Core System:**

- User, PasswordResetToken, Session, Address, PaymentCard

**Content Management:**

- Category, Product, MarketingCost, ProductCost, Review, Blog, ContentVersion

**Digital Products:**

- Book, DigitalFile, Language, DigitalDownload

**E-commerce:**

- Order, OrderItem, OrderStatusHistory, Return, StoreSettings

**Marketing:**

- Newsletter, Coupon, CouponUsage, EmailTemplate, EmailLog, EmailCampaign,
  EmailEvent, EmailSequence, EmailSequenceStep, EmailSequenceUser

**Analytics:**

- ConversionLog, FacebookPixelEvent, RomanianViralContent, FacebookPixelConfig,
  InstagramPixelConfig, TikTokPixelConfig, SEOAnalytics, PerformanceMetric

**Supplier Management:**

- Supplier, SupplierOrder, SupplierOrderTracking, SupplierInvoice,
  SupplierMessage, SupplierNotification, SupplierSupportTicket,
  SupplierTicketResponse, SupplierAnnouncement, SupplierPerformanceMetrics

**Support & Automation:**

- Ticket, AutomationWorkflow, Campaign, CampaignApplication, ImageMetadata,
  ImageProcessingLog

## Recovery Scenarios

### 🔴 **Complete Database Loss**

```bash
# 1. Reset database connection/environment
# 2. Run full restore (includes schema setup)
npx tsx scripts/full-database-restore.ts
```

### 🟡 **Partial Data Loss**

```bash
# 1. Run critical data restore (preserves existing data)
npx tsx scripts/restore-database-backup.ts
```

### 🟢 **Regular Maintenance Backup**

```bash
# Weekly backup of current state
npx tsx scripts/backup-current-data.ts
```

## Safety Features

### 🛡️ **Full Database Restore:**

- **Dependency Ordering**: Tables restored in correct FK sequence
- **Upsert Operations**: Prevents conflicts with existing data
- **Schema Verification**: Ensures database structure is correct
- **Progress Tracking**: Detailed logs for each table
- **Error Recovery**: Continues with other tables if one fails
- **Verification**: Automatic count verification after restore

### 🛡️ **Critical Data Restore:**

- **Smart Upsert**: Uses unique constraints to avoid duplicates
- **Foreign Key Safe**: Respects all database relationships
- **Incremental**: Can run on existing databases safely
- **Fast Recovery**: Optimized for speed

## File Structure

```
scripts/
├── full-database-backup.ts      # Complete backup (ALL tables)
├── full-database-restore.ts     # Complete restore (auto-generated)
├── backup-current-data.ts       # Critical data backup
├── restore-database-backup.ts   # Critical data restore (auto-generated)
├── schema-backup.prisma         # Schema backup
└── seed-*.ts                    # Individual seeding scripts
```

## Backup Strategy Recommendations

### 📅 **When to Run Backups:**

- **Daily**: Critical data backup for active development
- **Weekly**: Full database backup for comprehensive safety
- **Before Deployments**: Always backup before production changes
- **After Major Changes**: New features, data imports, schema changes
- **Before Migrations**: Database schema modifications

### 📏 **Backup Size Monitoring:**

- **Current**: ~125KB (44 records)
- **Expected Growth**: Monitor as products/content increases
- **Storage**: Keep in version control for history

### 🔄 **Testing:**

- **Monthly**: Test restore process in development environment
- **After Schema Changes**: Verify backup/restore still works
- **Before Major Releases**: Full end-to-end test

## Integration with Seeding System

Works seamlessly with your seeding infrastructure:

- `prisma/seed.ts` - General data seeding
- `scripts/seed-basic-categories.ts` - Category seeding
- `scripts/seed-languages.ts` - Language seeding
- `scripts/seed-admin-user.ts` - Admin user seeding
- `prisma/seed-admin.ts` - Alternative admin seeding

## Disaster Recovery Process

### 🚨 **Emergency Database Loss:**

1. **Assess Situation**: Confirm database is truly lost/unrecoverable
2. **Environment Setup**: Ensure DB connection and credentials are ready
3. **Schema Creation**: Run `npx prisma db push --accept-data-loss` (included in
   full restore)
4. **Full Restore**: `npx tsx scripts/full-database-restore.ts`
5. **Verification**: Check admin access, data integrity, basic functionality
6. **Additional Seeding**: Run any needed seed scripts for missing data

### ⚠️ **Partial Data Recovery:**

1. **Identify Missing Data**: Determine which tables/data are affected
2. **Critical Restore**: `npx tsx scripts/restore-database-backup.ts`
3. **Manual Fixes**: Address any specific data issues
4. **Verification**: Ensure system functionality

## Support & Troubleshooting

### 🔍 **Common Issues:**

- **Connection Errors**: Check DATABASE_URL environment variable
- **Permission Errors**: Ensure database user has proper permissions
- **Schema Mismatches**: Run `npx prisma db push` before restore
- **Large Datasets**: Monitor memory usage for very large databases

### 📞 **Getting Help:**

1. Check generated restore script for specific error messages
2. Verify environment variables are correct
3. Test in development environment first
4. Check Prisma client version compatibility
5. Review database server logs

### 🎯 **Best Practices:**

- **Version Control**: Keep backup scripts in Git
- **Documentation**: Update this README with any customizations
- **Testing**: Regular restore testing in staging environment
- **Monitoring**: Track backup success and file sizes
- **Security**: Never commit sensitive data in backup files

---

**Your complete database is now fully protected with multiple recovery options!
🛡️✨**
