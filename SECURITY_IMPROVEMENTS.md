# Security Improvements

This document outlines recent security improvements implemented in the STEM Toys platform.

## 1. Secure Admin Authentication

### Issue Addressed

- **Plaintext Admin Passwords in Environment Variables**: Previously, admin passwords were stored in plaintext in environment variables, creating a risk if environment variables were exposed.

### Solution Implemented

- **One-way Password Hashing**: Admin passwords are now stored as secure one-way hashes in environment variables.
- **Added ADMIN_PASSWORD_HASH**: New environment variable that stores a secure hash instead of plaintext.
- **Password Derivation**: Implemented PBKDF2 with high iteration count for secure password hashing.
- **Fallback Support**: Maintained backward compatibility with plaintext passwords but with deprecation warnings.

### How to Use

1. Generate a secure password hash using the provided utility:
   ```bash
   node scripts/generate-admin-hash.js
   ```
2. Add the generated hash to your `.env` file as `ADMIN_PASSWORD_HASH`
3. Remove any plaintext `ADMIN_PASSWORD` entries from your environment variables

### Security Benefits

- Eliminates risk of password exposure through environment variable leaks
- Uses industry-standard secure hashing algorithms
- Combines password with application secret for added security

## 2. Redis Timeout Protection

### Issue Addressed

- **Missing Timeouts for Redis Operations**: Redis operations had no timeouts, potentially causing application hangs if Redis became unresponsive.

### Solution Implemented

- **Timeout Mechanism**: All Redis operations now have a configurable timeout.
- **Graceful Fallbacks**: When a Redis operation times out, the system falls back to an in-memory cache.
- **Configuration Option**: Added `REDIS_TIMEOUT` environment variable to control timeout duration.

### How to Use

Add the following to your `.env` file to configure Redis timeouts:

```
REDIS_TIMEOUT=5000  # Timeout in milliseconds
```

### Security Benefits

- Prevents potential DoS conditions from Redis latency issues
- Improves application resilience and availability
- Provides visibility into Redis performance problems through logging

## 3. Standardized Authorization Checks

### Issue Addressed

- **Inconsistent Authorization Checks**: API endpoints had inconsistent patterns for verifying admin roles and user permissions.

### Solution Implemented

- **Centralized Authorization Library**: Created standardized utility functions in `lib/authorization.ts`
- **Role-Based Middleware**: Implemented `withAdminAuth` and `withAuth` middleware for consistent authorization
- **Standardized Error Responses**: Unified error format for authorization failures
- **Improved Logging**: Added structured logging for authorization attempts and failures

### How to Use

For admin-only endpoints:

```typescript
import { withAdminAuth } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (request, session) => {
    // Your endpoint logic here - only runs if user is an admin
    return NextResponse.json({ data: "Admin-only data" });
  });
}
```

For any authenticated user:

```typescript
import { withAuth } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, session) => {
    // Your endpoint logic here - only runs if user is authenticated
    return NextResponse.json({ data: "User data" });
  });
}
```

For specific role requirements:

```typescript
import { withAuth } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  return withAuth(
    request,
    async (request, session) => {
      // Your endpoint logic here
      return NextResponse.json({ data: "Premium content" });
    },
    "PREMIUM" // Required role
  );
}
```

### Security Benefits

- Eliminates inconsistent authorization implementations
- Reduces likelihood of privilege escalation vulnerabilities
- Provides centralized place to update authorization logic
- Improves auditability through consistent logging

## Implementation Details

These security improvements were implemented with minimal disruption to existing functionality:

1. **Backward Compatibility**: All changes maintain compatibility with existing code
2. **Progressive Enhancement**: Systems will use new security features when available
3. **Clear Deprecation Paths**: Documentation and warnings guide developers to new approaches
4. **Improved Error Handling**: Better error messages and fallbacks for failed operations

## Next Steps

Future security improvements to consider:

1. **API Rate Limiting**: Implement comprehensive rate limiting for all public endpoints
2. **Security Headers**: Add additional security headers including CSP, HSTS, etc.
3. **Regular Dependency Scanning**: Implement automated scanning for vulnerable dependencies
4. **Session Management Improvements**: Enhance session security with more granular controls
5. **Remove Legacy Password Support**: Eventually remove support for plaintext admin passwords
