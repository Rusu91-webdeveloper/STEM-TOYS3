# Functionality Issues Analysis

## Overview

This document outlines potential functionality issues that could cause bugs, errors, or incorrect behavior in the STEM-TOYS2 e-commerce platform.

## Critical Issues

### 1. **Build Configuration Ignores Errors**

**File:** `next.config.js`
**Issue:** ESLint and TypeScript errors are ignored during builds

```javascript
eslint: {
  ignoreDuringBuilds: true,
},
typescript: {
  ignoreBuildErrors: true,
}
```

**Impact:** Critical errors may be deployed to production, causing runtime failures
**Recommendation:** Remove these flags and fix all TypeScript/ESLint errors before deployment

### 2. **Hardcoded Fallback Credentials**

**File:** `lib/auth.ts`
**Issue:** Hardcoded placeholder credentials for Google OAuth

```javascript
clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-client-id",
clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-client-secret",
```

**Impact:** OAuth will fail silently if environment variables are missing
**Recommendation:** Throw errors if required environment variables are missing

### 3. **Hardcoded NextAuth Secret**

**File:** `lib/auth.ts`, `middleware.ts`
**Issue:** Fallback secret is hardcoded in multiple places

```javascript
secret: process.env.NEXTAUTH_SECRET ||
  "935925a21cc9c5f18fbec20510b9655211e16f4f06ba63c23e7b45862bd6cc9e";
```

**Impact:** Security vulnerability - the secret is exposed in the code
**Recommendation:** Always require NEXTAUTH_SECRET environment variable

### 4. **Inconsistent Password Handling**

**File:** `lib/auth.ts`
**Issue:** Multiple password hashing methods are used inconsistently

- bcrypt for regular users
- Custom admin password hashing
- Direct comparison for pre-hashed passwords
  **Impact:** Authentication vulnerabilities and maintenance complexity
  **Recommendation:** Standardize on one secure password hashing method

### 5. **Unsafe Database Operations**

**File:** `lib/auth.ts`
**Issue:** Database operations without proper error handling

```javascript
const existingUser = await withRetry(
  () => db.user.findUnique({ where: { email: profile.email! } }),
  // ... retry logic
);
```

**Impact:** Potential database connection issues causing authentication failures
**Recommendation:** Add proper error handling and fallback mechanisms

### 6. **Race Conditions in Authentication**

**File:** `lib/auth.ts`
**Issue:** Google sign-in flow has artificial delays to prevent race conditions

```javascript
// Force a delay to ensure database operations complete
await new Promise((resolve) => setTimeout(resolve, 1500));
```

**Impact:** This indicates underlying race condition issues
**Recommendation:** Fix the root cause instead of using delays

### 7. **Middleware Cache Issues**

**File:** `middleware.ts`
**Issue:** Session validation caching may cause stale data

```javascript
const validationCacheKey = `validation_${token.id}_${Math.floor(Date.now() / 60000)}`;
```

**Impact:** Users may access areas they shouldn't or be blocked incorrectly
**Recommendation:** Implement proper cache invalidation

### 8. **Missing Input Validation**

**File:** `app/api/products/route.ts`
**Issue:** Query parameters are not validated before use

```javascript
const minPrice = searchParams.get("minPrice");
const maxPrice = searchParams.get("maxPrice");
// Used directly without validation
where.price.gte = parseFloat(minPrice);
```

**Impact:** Potential injection attacks or application errors
**Recommendation:** Add Zod validation for all API inputs

### 9. **Insecure Admin Creation**

**File:** `lib/auth.ts`
**Issue:** Admin users can be created from environment variables

```javascript
const createMockAdminFromEnv = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  // ... creates admin user
};
```

**Impact:** Potential security vulnerability if environment is compromised
**Recommendation:** Use proper admin user management through database

### 10. **Missing Error Boundaries**

**File:** `app/layout.tsx`
**Issue:** No error boundaries to catch and handle runtime errors
**Impact:** Unhandled errors will crash the entire application
**Recommendation:** Add error boundaries at appropriate levels

## Moderate Issues

### 11. **Inconsistent Database Schema**

**File:** `prisma/schema.prisma`
**Issue:** Some fields are nullable when they should be required

- `User.name` is nullable but displayed in UI
- `Product.compareAtPrice` is nullable but used in calculations
  **Impact:** Potential null reference errors in UI
  **Recommendation:** Review and fix nullable fields

### 12. **Missing Foreign Key Constraints**

**File:** `prisma/schema.prisma`
**Issue:** Some relationships lack proper cascade deletes
**Impact:** Orphaned records may remain in database
**Recommendation:** Add proper onDelete cascades

### 13. **Inconsistent Enum Usage**

**File:** `prisma/schema.prisma`
**Issue:** Some string fields should be enums

- Payment methods stored as strings
- Order statuses have enums but some are stored as strings
  **Impact:** Data inconsistency and potential bugs
  **Recommendation:** Standardize on enums for controlled values

### 14. **Missing Unique Constraints**

**File:** `prisma/schema.prisma`
**Issue:** Some fields that should be unique aren't constrained

- `Product.sku` should be unique
- `Coupon.code` is unique but others aren't
  **Impact:** Duplicate data may cause issues
  **Recommendation:** Add unique constraints where appropriate

### 15. **Insecure File Upload Handling**

**File:** Multiple files use UploadThing
**Issue:** No validation of file types or sizes
**Impact:** Potential security vulnerabilities
**Recommendation:** Add proper file validation

## Minor Issues

### 16. **Hardcoded Locales**

**File:** `middleware.ts`
**Issue:** Supported locales are hardcoded

```javascript
const locales = ["en", "ro"];
```

**Impact:** Difficulty adding new languages
**Recommendation:** Move to configuration file

### 17. **Inconsistent Error Handling**

**File:** Various API routes
**Issue:** Different error response formats across endpoints
**Impact:** Inconsistent client-side error handling
**Recommendation:** Standardize error response format

### 18. **Missing Request Rate Limiting**

**File:** All API routes
**Issue:** No rate limiting implemented
**Impact:** Potential DoS attacks
**Recommendation:** Implement rate limiting middleware

### 19. **Insecure Direct Object References**

**File:** Various API routes
**Issue:** User IDs and object IDs are not validated
**Impact:** Users may access unauthorized data
**Recommendation:** Add authorization checks

### 20. **Missing CSRF Protection**

**File:** Various form submissions
**Issue:** No CSRF token validation
**Impact:** Potential CSRF attacks
**Recommendation:** Implement CSRF protection

## Recommendations Summary

1. **Fix build configuration** - Remove error ignoring flags
2. **Implement proper error handling** - Add try-catch blocks and error boundaries
3. **Add input validation** - Use Zod schemas for all API inputs
4. **Standardize authentication** - Use consistent password hashing
5. **Add security measures** - Implement rate limiting, CSRF protection
6. **Fix database schema** - Add proper constraints and relationships
7. **Implement proper logging** - Add structured logging for debugging
8. **Add monitoring** - Implement health checks and error tracking
