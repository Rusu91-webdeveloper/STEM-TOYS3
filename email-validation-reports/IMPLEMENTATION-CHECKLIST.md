# Email Template Fix Implementation Checklist

Use this checklist to track progress while fixing email template issues.

---

## 📋 Pre-Implementation

- [ ] Read `EXECUTIVE-SUMMARY.md` (5 minutes)
- [ ] Read `fix-implementation-guide.md` (15 minutes)
- [ ] Backup production database
- [ ] Create feature branch: `git checkout -b fix/email-template-variables`
- [ ] Set `TEST_EMAIL` in `.env` to your email address
- [ ] Verify development environment is working

---

## 🔧 Fix #1: Standardize Variable Naming (1 hour)

**Goal**: Replace `{{user.name}}` with `{{userName}}` in 19 templates

### Steps

- [ ] Review the update script: `scripts/update-email-template-variables.ts`
- [ ] Understand what it will change
- [ ] Run the script:
  ```bash
  npx tsx scripts/update-email-template-variables.ts
  ```
- [ ] Review the output (should update 19 templates)
- [ ] Verify no errors in script output

### Testing

- [ ] Check a few updated templates in database:
  ```sql
  SELECT name, slug, subject, variables
  FROM "EmailTemplate"
  WHERE slug IN ('welcome-new-user', 'password-reset', 'vip-monthly-perks')
  LIMIT 5;
  ```
- [ ] Verify `user.name` is replaced with `userName`
- [ ] Verify `variables` array is updated

### Commit

- [ ] `git add scripts/update-email-template-variables.ts`
- [ ] `git commit -m "feat: standardize email template variables (user.name → userName)"`

**Time Spent**: **\_** hours

---

## 🔧 Fix #2: Admin Notification Service (2 hours)

**Goal**: Add proper admin notifications with all required variables

### Step 1: Verify Service File Exists (5 min)

- [ ] Check file exists: `lib/email/admin-notification-service.ts`
- [ ] Review the code
- [ ] Understand the new functions:
  - `sendNewOrderNotification()`
  - `sendPaymentFailedNotification()`
  - `sendOrderIssueNotification()`
  - `sendLowStockAlert()`
  - `sendReturnRequestNotification()`

### Step 2: Update Order Creation Flow (45 min)

File: `app/api/checkout/order/route.ts`

- [ ] Open the file
- [ ] Find the line after order is created successfully (around line 870)
- [ ] Add import at top:
  ```typescript
  import { AdminNotificationService } from "@/lib/email/admin-notification-service";
  ```
- [ ] Add notification call after order creation:
  ```typescript
  // Send admin notification
  try {
    await AdminNotificationService.sendNewOrderNotification(
      dbOrder.id,
      process.env.ADMIN_EMAIL
    );
    console.log(`✅ Admin notification sent for order ${dbOrder.orderNumber}`);
  } catch (adminEmailError) {
    console.error("Failed to send admin notification:", adminEmailError);
    // Don't fail the order if admin email fails
  }
  ```
- [ ] Save file

### Step 3: Update Payment Failure Handler (30 min)

Find payment failure handling code (likely in webhook or payment processor)

- [ ] Search for payment failure code:
  ```bash
  grep -r "payment.*fail" app/api/
  grep -r "FAILED" app/api/stripe/
  ```
- [ ] Add admin notification in payment failure handler
- [ ] Import `AdminNotificationService`
- [ ] Call `sendPaymentFailedNotification()` with error details

### Step 4: Add Environment Variable (5 min)

- [ ] Add to `.env`:
  ```bash
  ADMIN_EMAIL=your-admin@techtots.ro
  ```
- [ ] Add to `.env.example`:
  ```bash
  ADMIN_EMAIL=admin@example.com
  ```

### Testing

- [ ] Create a test order in development
- [ ] Verify admin email is sent
- [ ] Check admin email includes:
  - [ ] Customer name ✅
  - [ ] Customer email ✅
  - [ ] Order number ✅
  - [ ] Order total ✅
  - [ ] Order status ✅
  - [ ] Admin URL link ✅
- [ ] Click admin URL link and verify it works

### Commit

- [ ] `git add lib/email/admin-notification-service.ts`
- [ ] `git add app/api/checkout/order/route.ts`
- [ ] `git add .env.example`
- [ ] `git commit -m "feat: add admin notification service with complete order details"`

**Time Spent**: **\_** hours

---

## 🔧 Fix #3: Verify Email Change Flow (2 hours)

**Goal**: Ensure email change confirmation works correctly

### Investigation (1 hour)

- [ ] Search for email change implementation:

  ```bash
  grep -r "change.*email" app/api/
  grep -r "email-change" app/
  find app -name "*email*" -type f
  ```

- [ ] Check if implementation exists:
  - [ ] YES → Found at: **********\_\_\_**********
  - [ ] NO → Need to implement

### If Implementation Exists (30 min)

- [ ] Review the code
- [ ] Verify it sends email using template `email-change-confirmation`
- [ ] Verify variables passed:
  ```typescript
  {
    userName: string,
    oldEmail: string,  // ✅ Check this
    newEmail: string,   // ✅ Check this
    confirmationUrl: string,
    siteUrl: string
  }
  ```

### Testing (30 min)

- [ ] Test email change flow:
  - [ ] Go to account settings
  - [ ] Change email address
  - [ ] Check email received
  - [ ] Verify old and new email shown correctly
  - [ ] Test confirmation link works

### If Implementation Doesn't Exist

- [ ] Create issue/ticket for future implementation
- [ ] Deprioritize template if feature not used
- [ ] Document in project backlog

### Commit

- [ ] `git add` (if any changes made)
- [ ] `git commit -m "test: verify email change confirmation flow"`

**Time Spent**: **\_** hours

---

## 🧪 Final Testing (1 hour)

### Run Automated Tests

- [ ] Run variable replacement tests:
  ```bash
  npx tsx scripts/test-email-templates.ts
  ```
- [ ] Verify all 3 variable tests pass

### Manual Email Testing

- [ ] Send test account verification email
  - [ ] Verify all fields populated
  - [ ] Verify link works
- [ ] Send test order confirmation email
  - [ ] Verify order details correct
  - [ ] Verify items list displays
  - [ ] Verify formatting looks good
- [ ] Send test admin notification
  - [ ] Verify customer email shows
  - [ ] Verify order status shows
  - [ ] Verify admin URL works

### Check Email Logs

- [ ] Query EmailLog table:
  ```sql
  SELECT * FROM "EmailLog"
  WHERE "createdAt" > NOW() - INTERVAL '1 hour'
  ORDER BY "createdAt" DESC
  LIMIT 10;
  ```
- [ ] Verify no failures
- [ ] Check sentAt timestamps
- [ ] Verify deliveredAt if available

---

## 📤 Deployment

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Code reviewed (if team process)
- [ ] Changes committed to git
- [ ] Ready to merge to main

### Staging Deployment

- [ ] Merge to staging branch
- [ ] Deploy to staging environment
- [ ] Run smoke tests in staging
- [ ] Send test emails in staging
- [ ] Verify admin notifications work

### Production Deployment

- [ ] Backup production database (mandatory!)
- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Monitor logs for first hour
- [ ] Send test order (if possible)
- [ ] Verify admin email received

### Post-Deployment

- [ ] Monitor email logs for 24 hours
- [ ] Check for any failures
- [ ] Verify admin receives order notifications
- [ ] Customer feedback (if any)

---

## ✅ Completion Criteria

**Fix #1 - Variable Standardization**

- [x] Script created
- [ ] Script executed successfully
- [ ] 19 templates updated
- [ ] No errors in database
- [ ] Variables array updated

**Fix #2 - Admin Notifications**

- [x] Service created
- [ ] Integrated in order flow
- [ ] Integrated in payment failure flow
- [ ] Environment variable set
- [ ] Tested with real order
- [ ] Admin receives complete info

**Fix #3 - Email Change**

- [ ] Implementation found OR
- [ ] Determined not implemented
- [ ] If implemented: tested and verified
- [ ] If not implemented: documented

**Overall**

- [ ] All HIGH priority fixes complete
- [ ] All MEDIUM priority fixes complete/planned
- [ ] Tests passing
- [ ] Deployed to production
- [ ] Monitoring set up

---

## 📊 Progress Tracking

### Timeline

| Task                       | Estimated | Actual      | Status |
| -------------------------- | --------- | ----------- | ------ |
| Variable Standardization   | 1h        | \_\_\_h     | ⏳     |
| Admin Notification Service | 2h        | \_\_\_h     | ⏳     |
| Email Change Verification  | 2h        | \_\_\_h     | ⏳     |
| Testing                    | 1h        | \_\_\_h     | ⏳     |
| **TOTAL**                  | **6h**    | **\_\_\_h** | ⏳     |

### Issues Resolved

- [ ] Issue #1: order.customerEmail (HIGH)
- [ ] Issue #2: order.status (HIGH)
- [ ] Issue #3: Variable naming consistency (HIGH)
- [ ] Issue #4: newEmail variable (MEDIUM)
- [ ] Issue #5: oldEmail variable (MEDIUM)

---

## 🎉 Done!

When all checkboxes are checked:

- [ ] Update TASKS.md with completion date
- [ ] Document any issues encountered
- [ ] Share results with team
- [ ] Archive this checklist for reference

---

**Implementation Started**: ******\_******  
**Implementation Completed**: ******\_******  
**Total Time**: ******\_******  
**Issues Encountered**: ******\_******

**Notes**:

---

---

---

---

**Implemented By**: ******\_******  
**Reviewed By**: ******\_******  
**Deployed By**: ******\_******

✅ **CHECKLIST COMPLETE**
