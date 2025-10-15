# Fix Recommendations

## Summary

- **CRITICAL**: 0 issues
- **HIGH**: 3 issues
- **MEDIUM**: 2 issues
- **LOW**: 0 issues

## Prioritized Fix List

### HIGH: Admin - Comandă Nouă

**Issues:**
- [HIGH] order.customerEmail: Verify order object includes customerEmail when template is called
- [HIGH] order.status: Verify order object includes status when template is called

### HIGH: Admin - Plată Eșuată

**Issues:**
- [HIGH] order.customerEmail: Verify order object includes customerEmail when template is called

### MEDIUM: Confirmare Schimbare Email

**Issues:**
- [MEDIUM] newEmail: Document this variable or use standard naming convention
- [MEDIUM] oldEmail: Document this variable or use standard naming convention

## Code Changes Required

### 1. Email Service Updates

**File**: `lib/email/template-service.ts`
- Add StoreSettings loading and pass as variables
- Standardize variable structure for order, user, payment objects

### 2. Template Content Fixes

**Action**: Update templates in database to use correct variable names
- Replace `{{settings.X}}` with `{{storeX}}` or pass settings object
- Replace `{{user.name}}` with `{{userName}}` for consistency

### 3. Trigger Configuration

**Action**: Update EmailTrigger actionData to include required variables
