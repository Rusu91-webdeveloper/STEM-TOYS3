# Supplier Feed Sync Plan

## Overview
Plan for implementing automated supplier feed sync for stock and price updates with logging and error handling.

## Current Implementation Status

### ✅ Already Implemented

1. **Sync Infrastructure**
   - `lib/suppliers/sync.ts` - Main sync logic
   - `app/api/cron/suppliers/route.ts` - Cron endpoint
   - `SupplierSyncJob` model - Sync history/logging
   - `SupplierFeed` model - Feed configuration
   - `SupplierProduct` model - Staged products from suppliers

2. **Sync Features**
   - ✅ Stock updates
   - ✅ Price updates
   - ✅ Sync logs/history (SupplierSyncJob)
   - ✅ Error handling
   - ✅ Multiple feed types (CSV, XML, API, APP)
   - ✅ Field mapping support

3. **Sync Process**
   - Fetches products from supplier feed
   - Maps fields using configuration
   - Upserts into SupplierProduct
   - Updates linked Product records
   - Logs sync results in SupplierSyncJob

### ⚠️ Needs Enhancement

1. **Cron Job Configuration**
   - Current: Manual trigger via API endpoint
   - Needed: Automated scheduled sync (Vercel Cron or Inngest)

2. **Error Alerts**
   - Current: Errors logged in SupplierSyncJob
   - Needed: Email/notification alerts on sync failures

3. **Sync Frequency**
   - Current: Configurable via `pollingIntervalMinutes`
   - Needed: Verify cron job is scheduled

## Implementation Plan

### Step 1: Verify Cron Job Setup

**Current State:**
- Cron endpoint exists: `/api/cron/suppliers`
- Requires `CRON_SECRET` for authentication
- Can be triggered manually or via Vercel Cron

**Action Required:**
1. Check `vercel.json` for cron configuration
2. If missing, add cron job to run every hour (or as configured)
3. Verify `CRON_SECRET` is set in production

### Step 2: Add Error Alerts

**Files to modify:**
- `lib/suppliers/sync.ts` - Add alert on sync failure
- `lib/email/admin-notification-service.ts` - Use existing notification service

**Implementation:**
```typescript
// In sync.ts, after error handling
if (error) {
  await sendAdminAlert({
    subject: `Supplier Sync Failed: ${feed.supplier.name}`,
    message: `Sync failed for feed ${feed.name}: ${error.message}`,
  });
}
```

### Step 3: Verify Sync Updates Product Records

**Current Implementation:**
- `lib/suppliers/sync.ts` line 276-313 - Updates linked Product records
- Updates: stockQuantity, price, images, lastSyncAt

**Status:** ✅ Already implemented

### Step 4: Add Sync History Dashboard

**Files to create/modify:**
- `app/admin/supplier-feeds/[id]/sync-history/page.tsx` - Show sync history
- Display: sync jobs, success/failure rates, last sync time

**Status:** Can be added later (not critical for launch)

## Cron Job Configuration

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/suppliers",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Option 2: Inngest (If using Inngest)

Create Inngest function:
```typescript
// inngest/functions/supplier-sync.ts
export const supplierSync = inngest.createFunction(
  { id: "supplier-sync" },
  { cron: "0 * * * *" }, // Every hour
  async ({ event, step }) => {
    await runSupplierFeedSync();
  }
);
```

## Sync Flow

```
1. Cron triggers → /api/cron/suppliers
2. Authenticate with CRON_SECRET
3. For each active SupplierFeed:
   a. Create SupplierSyncJob (status: RUNNING)
   b. Fetch products from feed (CSV/XML/API)
   c. Parse and map fields
   d. Upsert SupplierProduct records
   e. Update linked Product records (stock, price)
   f. Update SupplierSyncJob (status: SUCCESS/FAILED)
   g. Update SupplierFeed.lastSyncAt
4. Return results
```

## Error Handling

**Current:**
- Errors caught and logged in SupplierSyncJob
- Feed marked with lastError
- Sync continues for other feeds

**Enhancement:**
- Send admin email on failure
- Retry logic for transient failures
- Alert if sync fails 3+ times in a row

## Acceptance Criteria

- [x] Sync infrastructure exists
- [x] Stock updates work
- [x] Price updates work
- [x] Sync history logged
- [ ] Cron job configured (verify)
- [ ] Error alerts implemented
- [ ] Sync runs automatically

---

**Status:** ✅ Sync implementation is 90% complete. Main task is verifying cron configuration and adding error alerts.
