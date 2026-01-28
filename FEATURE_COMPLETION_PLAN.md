# Feature Completion Plan - Remaining Partial Features

**Created:** January 25, 2026  
**Estimated Completion Time:** 2-4 weeks  
**Purpose:** Complete all partially implemented features to maximize project value before sale

---

## Executive Summary

This document identifies **exactly which features** need completion based on the database audit and codebase analysis. The project is **85-95% complete**, with the remaining 5-15% consisting of:

1. **Multi-tenancy features** (infrastructure ready, not activated)
2. **Social media pixel integrations** (schema ready, implementation needed)
3. **Minor TODOs** (email notifications, scheduled jobs)
4. **AI job system** (prepared for future use)

**Priority:** Complete high-value features that increase marketability. Skip features that don't add value for buyers.

---

## 1. Multi-Tenancy Features ⚠️ PARTIALLY IMPLEMENTED

### Status Overview
- **Schema:** ✅ Fully defined (Tenant, Organization tables)
- **Middleware:** ✅ Fully implemented (`lib/middleware/tenant.ts`)
- **API Integration:** ⚠️ Partially integrated (some routes don't use tenant context)
- **UI/Admin:** ❌ Not implemented (no admin UI for tenant management)

### What Needs Completion

#### 1.1 Admin UI for Tenant Management
**Priority:** Medium (only needed if selling as SaaS platform)  
**Estimated Time:** 3-5 days

**Tasks:**
- [ ] Create admin page: `app/admin/tenants/page.tsx`
- [ ] Tenant CRUD operations:
  - [ ] List all tenants
  - [ ] Create new tenant
  - [ ] Edit tenant settings
  - [ ] Activate/deactivate tenants
  - [ ] View tenant usage statistics
- [ ] Organization management UI:
  - [ ] List organizations per tenant
  - [ ] Create/edit organizations
  - [ ] Assign users to organizations
- [ ] Tenant settings management:
  - [ ] Custom domains configuration
  - [ ] Resource limits (users, storage, etc.)
  - [ ] Feature flags per tenant

**Files to Create/Modify:**
- `app/admin/tenants/page.tsx` (new)
- `app/admin/tenants/[id]/page.tsx` (new)
- `app/api/admin/tenants/route.ts` (new)
- `app/api/admin/tenants/[id]/route.ts` (new)
- `components/admin/TenantManagement.tsx` (new)
- `components/admin/OrganizationManagement.tsx` (new)

#### 1.2 API Route Tenant Context Integration
**Priority:** Medium  
**Estimated Time:** 2-3 days

**Tasks:**
- [ ] Review all API routes and ensure tenant context is applied
- [ ] Add tenant filtering to queries:
  - [ ] Product queries (`app/api/products/route.ts`)
  - [ ] Order queries (`app/api/admin/orders/route.ts`)
  - [ ] User queries (`app/api/admin/users/route.ts`)
  - [ ] Analytics queries
- [ ] Ensure tenant isolation in all data access layers
- [ ] Add tenant validation middleware to protected routes

**Files to Modify:**
- `app/api/products/route.ts`
- `app/api/admin/orders/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/analytics/**` (multiple files)
- `lib/db.ts` (add tenant filtering helpers)

#### 1.3 Tenant Selection UI (for multi-tenant deployments)
**Priority:** Low (only if selling as SaaS)  
**Estimated Time:** 1-2 days

**Tasks:**
- [ ] Create tenant selection page: `app/tenant/select/page.tsx`
- [ ] Tenant switching functionality
- [ ] Cookie/session management for tenant context

**Files to Create:**
- `app/tenant/select/page.tsx` (new)
- `app/api/tenant/switch/route.ts` (new)

**Recommendation:** 
- **Skip if:** Selling as single-tenant e-commerce platform
- **Complete if:** Selling as SaaS/multi-tenant platform
- **Current Value:** Adds $2,000-5,000 to sale price if SaaS-ready

---

## 2. Social Media Pixel Integrations ⚠️ SCHEMA ONLY

### Status Overview
- **Schema:** ✅ Fully defined (InstagramPixelConfig, TikTokPixelConfig)
- **Service:** ✅ Partially implemented (`lib/services/social-media-analytics-service.ts`)
- **API Routes:** ⚠️ Partially implemented (some routes exist but incomplete)
- **Admin UI:** ⚠️ Partially implemented (`features/admin/analytics/components/PixelConfigurationManager.tsx`)
- **Frontend Integration:** ❌ Not fully implemented

### What Needs Completion

#### 2.1 Instagram Pixel Integration
**Priority:** Medium (optional feature, but adds value)  
**Estimated Time:** 2-3 days

**Tasks:**
- [ ] Complete Instagram Pixel service implementation
- [ ] Create API routes:
  - [ ] `app/api/admin/pixels/instagram/config/route.ts` (CRUD)
  - [ ] `app/api/admin/pixels/instagram/events/route.ts` (event tracking)
- [ ] Frontend pixel script injection:
  - [ ] Add Instagram Pixel script to `app/layout.tsx`
  - [ ] Create pixel event tracking hooks
  - [ ] Integrate with checkout flow
- [ ] Admin UI completion:
  - [ ] Instagram pixel configuration form
  - [ ] Event testing interface
  - [ ] Analytics dashboard integration

**Files to Create/Modify:**
- `lib/services/instagram-pixel-service.ts` (new or complete existing)
- `app/api/admin/pixels/instagram/config/route.ts` (new)
- `app/api/admin/pixels/instagram/events/route.ts` (new)
- `components/pixels/InstagramPixel.tsx` (new)
- `hooks/useInstagramPixel.ts` (new)
- `app/layout.tsx` (add pixel script)
- `features/admin/analytics/components/PixelConfigurationManager.tsx` (complete)

#### 2.2 TikTok Pixel Integration
**Priority:** Medium (optional feature, but adds value)  
**Estimated Time:** 2-3 days

**Tasks:**
- [ ] Complete TikTok Pixel service implementation
- [ ] Create API routes:
  - [ ] `app/api/admin/pixels/tiktok/config/route.ts` (CRUD)
  - [ ] `app/api/admin/pixels/tiktok/events/route.ts` (event tracking)
- [ ] Frontend pixel script injection:
  - [ ] Add TikTok Pixel script to `app/layout.tsx`
  - [ ] Create pixel event tracking hooks
  - [ ] Integrate with checkout flow
- [ ] Admin UI completion:
  - [ ] TikTok pixel configuration form
  - [ ] Event testing interface
  - [ ] Analytics dashboard integration

**Files to Create/Modify:**
- `lib/services/tiktok-pixel-service.ts` (new or complete existing)
- `app/api/admin/pixels/tiktok/config/route.ts` (new)
- `app/api/admin/pixels/tiktok/events/route.ts` (new)
- `components/pixels/TikTokPixel.tsx` (new)
- `hooks/useTikTokPixel.ts` (new)
- `app/layout.tsx` (add pixel script)
- `features/admin/analytics/components/PixelConfigurationManager.tsx` (complete)

**Recommendation:**
- **Complete:** Adds $1,000-2,000 value, shows platform completeness
- **Time Investment:** 4-6 days total for both pixels
- **ROI:** High - relatively quick to implement, increases feature completeness

---

## 3. Minor TODOs & Missing Features

### 3.1 Email Notifications
**Priority:** High (affects user experience)  
**Estimated Time:** 1-2 days

**Tasks:**
- [ ] **Order Auto-Complete:** Scheduled job to set order status to COMPLETED 30 days after delivery
  - [ ] Create cron job: `app/api/cron/auto-complete-orders/route.ts`
  - [ ] Schedule in Vercel cron or Inngest
  - [ ] Test with sample orders

- [ ] **Admin Alert Emails:** Send alerts for critical events
  - [ ] Low stock alerts (`app/api/checkout/order/route.ts` line 1045)
  - [ ] Payment disputes (`app/api/stripe/webhook/route.ts` line 521)
  - [ ] Supplier invoice alerts (`app/api/admin/supplier-invoices/[id]/send/route.ts` line 57)
  - [ ] Order status change notifications (`app/api/admin/orders/bulk-status/route.ts` line 105)

- [ ] **Account Recovery Email:** Send recovery email with token
  - [ ] Complete: `app/api/security/recovery/route.ts` line 131

**Files to Create/Modify:**
- `app/api/cron/auto-complete-orders/route.ts` (new)
- `lib/email/admin-alerts.ts` (new)
- `app/api/checkout/order/route.ts` (add email sending)
- `app/api/stripe/webhook/route.ts` (add dispute alert)
- `app/api/admin/supplier-invoices/[id]/send/route.ts` (add email)
- `app/api/admin/orders/bulk-status/route.ts` (add notifications)
- `app/api/security/recovery/route.ts` (complete email sending)

**Recommendation:**
- **Complete:** Critical for production readiness
- **Time Investment:** 1-2 days
- **ROI:** Very High - essential features

### 3.2 Netopia Refund Implementation
**Priority:** Medium  
**Estimated Time:** 1 day

**Tasks:**
- [ ] Implement Netopia refund functionality
  - [ ] Complete: `app/api/payments/netopia/refund/route.ts` (currently returns 501)
  - [ ] Test refund flow
  - [ ] Add refund tracking to database

**Files to Modify:**
- `app/api/payments/netopia/refund/route.ts` (implement refund)
- `lib/payments/NetopiaProvider.ts` (add refund method)

**Recommendation:**
- **Complete:** Important for Romanian market (Netopia is primary payment method)
- **Time Investment:** 1 day
- **ROI:** High - critical for Romanian e-commerce

### 3.3 Campaign Filtering Enhancement
**Priority:** Low  
**Estimated Time:** 0.5 days

**Tasks:**
- [ ] Add filtering to campaign listing
  - [ ] Complete: `app/api/marketing/campaigns/route.ts` line 111
  - [ ] Add filters: status, date range, type
  - [ ] Add pagination

**Files to Modify:**
- `app/api/marketing/campaigns/route.ts` (add filtering)

**Recommendation:**
- **Complete:** Quick win, improves admin UX
- **Time Investment:** 0.5 days
- **ROI:** Medium - nice to have

---

## 4. AI Job System ⚠️ PARTIALLY IMPLEMENTED

### Status Overview
- **Schema:** ✅ Fully defined (AiJob table)
- **Usage:** ⚠️ Limited references in codebase
- **Purpose:** Background job tracking for AI features

### What Needs Completion

#### 4.1 AI Job Service Implementation
**Priority:** Low (prepared for future features)  
**Estimated Time:** 2-3 days

**Tasks:**
- [ ] Create AI job service: `lib/services/ai-job-service.ts`
- [ ] Job queue management:
  - [ ] Create jobs
  - [ ] Track job status
  - [ ] Handle job failures
  - [ ] Retry logic
- [ ] API routes:
  - [ ] `app/api/admin/ai-jobs/route.ts` (list jobs)
  - [ ] `app/api/admin/ai-jobs/[id]/route.ts` (job details)
- [ ] Admin UI:
  - [ ] Job monitoring dashboard
  - [ ] Job status visualization
  - [ ] Error logs viewer

**Files to Create:**
- `lib/services/ai-job-service.ts` (new)
- `app/api/admin/ai-jobs/route.ts` (new)
- `app/api/admin/ai-jobs/[id]/route.ts` (new)
- `app/admin/ai-jobs/page.tsx` (new)
- `components/admin/AIJobMonitor.tsx` (new)

**Recommendation:**
- **Skip:** Not critical for sale, prepared for future use
- **Complete Only If:** You have active AI features that need job tracking
- **Current Value:** Low - infrastructure ready but not actively used

---

## 5. Database Sharding ❌ SCHEMA ONLY

### Status Overview
- **Schema:** ✅ Fully defined (UserShard table)
- **Purpose:** Horizontal database scaling for millions of users
- **Current Need:** ❌ Not needed (single database sufficient)

### Recommendation
- **DO NOT COMPLETE:** Only needed at massive scale (500K+ users)
- **Current Status:** Schema ready for future scaling
- **Value:** Already adds value as "prepared for scale" - no implementation needed

---

## Priority Summary & Time Estimates

### High Priority (Complete Before Sale)
1. **Email Notifications** - 1-2 days
2. **Netopia Refund** - 1 day
3. **Campaign Filtering** - 0.5 days
   **Total: 2.5-3.5 days**

### Medium Priority (Adds Value)
4. **Instagram Pixel** - 2-3 days
5. **TikTok Pixel** - 2-3 days
   **Total: 4-6 days**

### Low Priority (Optional)
6. **Multi-Tenancy Admin UI** - 3-5 days (only if selling as SaaS)
7. **AI Job System** - 2-3 days (only if needed)
   **Total: 5-8 days (optional)**

### Skip (Not Needed)
- **Database Sharding** - Schema ready, implementation not needed
- **Multi-Tenancy** - Skip if selling as single-tenant platform

---

## Recommended Completion Plan

### Option 1: Minimal (2-3 weeks) - Recommended
**Focus:** Complete high-priority items only

**Week 1:**
- Email notifications (1-2 days)
- Netopia refund (1 day)
- Campaign filtering (0.5 days)
- Instagram Pixel (2-3 days)

**Week 2:**
- TikTok Pixel (2-3 days)
- Testing & bug fixes (2-3 days)
- Documentation updates (1 day)

**Total Time:** 10-14 days

### Option 2: Complete (3-4 weeks)
**Focus:** Complete all medium+ priority items

**Week 1:**
- Email notifications (1-2 days)
- Netopia refund (1 day)
- Campaign filtering (0.5 days)
- Instagram Pixel (2-3 days)

**Week 2:**
- TikTok Pixel (2-3 days)
- Multi-Tenancy Admin UI (3-5 days)

**Week 3:**
- API route tenant integration (2-3 days)
- Testing & bug fixes (2-3 days)

**Week 4:**
- Documentation updates (1 day)
- Final polish (1-2 days)

**Total Time:** 15-22 days

---

## Value Impact Assessment

### Before Completion
- **Feature Completeness:** 85-90%
- **Market Value:** $25,000 - $35,000
- **Issues:** Some TODOs, missing pixel integrations

### After Minimal Completion (Option 1)
- **Feature Completeness:** 92-95%
- **Market Value:** $28,000 - $38,000
- **Improvement:** +$3,000 value, 2-3 weeks work

### After Complete (Option 2)
- **Feature Completeness:** 95-98%
- **Market Value:** $30,000 - $42,000
- **Improvement:** +$5,000-7,000 value, 3-4 weeks work

---

## Detailed Task Checklist

### Email Notifications
- [ ] Create `lib/email/admin-alerts.ts` service
- [ ] Implement low stock alert email
- [ ] Implement payment dispute alert email
- [ ] Implement supplier invoice sent email
- [ ] Implement order status change notifications
- [ ] Implement account recovery email
- [ ] Create cron job for auto-complete orders
- [ ] Test all email notifications
- [ ] Add email templates for new notifications

### Netopia Refund
- [ ] Research Netopia refund API
- [ ] Implement refund method in `NetopiaProvider.ts`
- [ ] Complete refund route handler
- [ ] Add refund tracking to database
- [ ] Test refund flow end-to-end
- [ ] Handle refund errors gracefully

### Social Media Pixels
- [ ] Research Instagram Pixel API
- [ ] Research TikTok Pixel API
- [ ] Create pixel configuration services
- [ ] Create API routes for pixel config
- [ ] Create frontend pixel components
- [ ] Integrate pixels into layout
- [ ] Add pixel event tracking hooks
- [ ] Complete admin UI for pixel management
- [ ] Test pixel events in production
- [ ] Add pixel analytics to dashboard

### Multi-Tenancy (Optional)
- [ ] Design tenant admin UI
- [ ] Create tenant CRUD pages
- [ ] Create organization management UI
- [ ] Add tenant filtering to all API routes
- [ ] Test tenant isolation
- [ ] Create tenant selection UI
- [ ] Document multi-tenant setup

---

## Testing Requirements

For each completed feature:
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests (for critical flows)
- [ ] Manual testing checklist
- [ ] Production smoke tests

---

## Documentation Updates Needed

After completing features:
- [ ] Update `FEATURES_GUIDE.md`
- [ ] Update `API_REFERENCE.md`
- [ ] Update `README.md` (if new major features)
- [ ] Create deployment guide for new features
- [ ] Update admin user guide

---

## Conclusion

**Recommended Approach:** Complete **Option 1 (Minimal)** - Focus on high-value, quick wins:
1. Email notifications (critical for production)
2. Netopia refund (important for Romanian market)
3. Social media pixels (adds completeness)

**Skip:** Multi-tenancy (unless selling as SaaS), AI jobs (not actively used), Database sharding (not needed).

**Expected Outcome:**
- **Time Investment:** 2-3 weeks
- **Value Increase:** +$3,000-5,000
- **Feature Completeness:** 92-95%
- **ROI:** High - relatively quick work for significant value increase

---

**Next Steps:**
1. Review this plan
2. Prioritize based on buyer needs
3. Create GitHub issues/tasks for selected items
4. Begin implementation
5. Test thoroughly before sale

---

*Last Updated: January 25, 2026*
