# Error Codes and Troubleshooting Guide

This comprehensive guide covers all error codes returned by the STEM Toys User
Management API, along with detailed troubleshooting steps and resolution
strategies.

## Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific_field_name",
    "reason": "detailed explanation"
  },
  "timestamp": "2025-01-01T12:00:00.000Z",
  "requestId": "unique-request-identifier"
}
```

## HTTP Status Codes

### 2xx Success Codes

| Status Code | Description | When Used                                                         |
| ----------- | ----------- | ----------------------------------------------------------------- |
| 200         | OK          | Successful GET/PUT/DELETE operations                              |
| 201         | Created     | Successful resource creation (registration, address creation)     |
| 202         | Accepted    | Asynchronous operations accepted (data export, deletion requests) |
| 204         | No Content  | Successful operation with no response body                        |

### 4xx Client Error Codes

| Status Code | Error Code           | Description                        | Troubleshooting                                                 |
| ----------- | -------------------- | ---------------------------------- | --------------------------------------------------------------- |
| 400         | VALIDATION_ERROR     | Invalid request data or parameters | Check request format and required fields                        |
| 400         | INVALID_EMAIL        | Email format is invalid            | Use proper email format (user@domain.com)                       |
| 400         | WEAK_PASSWORD        | Password doesn't meet requirements | Password must be 8+ chars with uppercase, lowercase, and number |
| 400         | INVALID_CNP          | Romanian CNP format invalid        | Check CNP format: 13 digits starting with valid prefix          |
| 400         | INVALID_CUI          | Romanian CUI format invalid        | Check CUI format: RO followed by 2-10 digits                    |
| 401         | UNAUTHORIZED         | Authentication required or invalid | Provide valid JWT token in Authorization header                 |
| 401         | TOKEN_EXPIRED        | JWT token has expired              | Refresh token or re-authenticate                                |
| 401         | INVALID_TOKEN        | JWT token is malformed             | Check token format and obtain new token                         |
| 403         | FORBIDDEN            | Insufficient permissions           | Check user role and endpoint access rights                      |
| 403         | TENANT_ACCESS_DENIED | Cross-tenant access attempted      | Users can only access their tenant's data                       |
| 404         | NOT_FOUND            | Resource not found                 | Verify resource ID and endpoint URL                             |
| 404         | USER_NOT_FOUND       | User account doesn't exist         | Check email address spelling                                    |
| 404         | ADDRESS_NOT_FOUND    | Address doesn't exist              | Verify address ID belongs to user                               |
| 409         | CONFLICT             | Resource already exists            | Use different email or check for duplicates                     |
| 409         | EMAIL_EXISTS         | Email already registered           | Use different email or try login                                |
| 422         | UNPROCESSABLE_ENTITY | Business logic validation failed   | Check business rules and constraints                            |
| 429         | RATE_LIMIT_EXCEEDED  | Too many requests                  | Wait before retrying (see Retry-After header)                   |

### 5xx Server Error Codes

| Status Code | Error Code            | Description                     | Troubleshooting                                      |
| ----------- | --------------------- | ------------------------------- | ---------------------------------------------------- |
| 500         | INTERNAL_SERVER_ERROR | Unexpected server error         | Contact support with request ID                      |
| 502         | BAD_GATEWAY           | Upstream service error          | Temporary issue, retry later                         |
| 503         | SERVICE_UNAVAILABLE   | Service temporarily unavailable | Check service status, retry later                    |
| 504         | GATEWAY_TIMEOUT       | Request timeout                 | Check network connection, retry with smaller payload |

## Detailed Error Codes

### Authentication Errors (AUTH\_\*)

#### AUTH_INVALID_CREDENTIALS

```json
{
  "error": "Invalid email or password",
  "code": "AUTH_INVALID_CREDENTIALS",
  "details": {
    "reason": "email_not_found_or_password_incorrect"
  }
}
```

**Troubleshooting:**

1. Verify email address is spelled correctly
2. Check password is entered correctly (case-sensitive)
3. Ensure account is active (check email verification)
4. Try password reset if forgotten

#### AUTH_ACCOUNT_LOCKED

```json
{
  "error": "Account is temporarily locked due to security policy",
  "code": "AUTH_ACCOUNT_LOCKED",
  "details": {
    "lockoutUntil": "2025-01-01T12:30:00.000Z",
    "remainingAttempts": 0
  }
}
```

**Troubleshooting:**

1. Wait until lockout period expires
2. Contact support if account is locked incorrectly
3. Use "Forgot Password" to reset if legitimate access needed

#### AUTH_TOO_MANY_ATTEMPTS

```json
{
  "error": "Too many failed login attempts",
  "code": "AUTH_TOO_MANY_ATTEMPTS",
  "details": {
    "retryAfter": 300,
    "remainingLockoutTime": 1800
  }
}
```

**Troubleshooting:**

1. Wait for the retry-after period (5 minutes)
2. Use "Forgot Password" if you can't remember credentials
3. Contact support for account unlock if needed

### Validation Errors (VALIDATION\_\*)

#### VALIDATION_MISSING_REQUIRED_FIELD

```json
{
  "error": "Required field is missing",
  "code": "VALIDATION_MISSING_REQUIRED_FIELD",
  "details": {
    "field": "email",
    "required": true
  }
}
```

**Troubleshooting:**

1. Check API documentation for required fields
2. Ensure all mandatory fields are included in request
3. Verify field names match exactly (case-sensitive)

#### VALIDATION_INVALID_FORMAT

```json
{
  "error": "Field format is invalid",
  "code": "VALIDATION_INVALID_FORMAT",
  "details": {
    "field": "phone",
    "expected": "Romanian phone format (+407xxxxxxxx)",
    "provided": "+123456789"
  }
}
```

**Troubleshooting:**

1. Check field format requirements in API documentation
2. Use proper formatting for phone numbers, dates, etc.
3. For Romanian fields, ensure proper format (CNP, CUI, postal codes)

#### VALIDATION_FIELD_TOO_LONG

```json
{
  "error": "Field exceeds maximum length",
  "code": "VALIDATION_FIELD_TOO_LONG",
  "details": {
    "field": "name",
    "maxLength": 100,
    "providedLength": 150
  }
}
```

**Troubleshooting:**

1. Check field length limits in API documentation
2. Truncate or shorten field content
3. Consider using abbreviations if appropriate

### GDPR Compliance Errors (GDPR\_\*)

#### GDPR_CONSENT_REQUIRED

```json
{
  "error": "GDPR consent is required for this operation",
  "code": "GDPR_CONSENT_REQUIRED",
  "details": {
    "consentType": "marketing",
    "requiredFor": "email_communications"
  }
}
```

**Troubleshooting:**

1. User must provide explicit consent for data processing
2. Check consent status via `/consent` endpoint
3. Provide clear consent language to user

#### GDPR_DATA_EXPORT_IN_PROGRESS

```json
{
  "error": "Data export already in progress",
  "code": "GDPR_DATA_EXPORT_IN_PROGRESS",
  "details": {
    "requestId": "gdpr-export-12345",
    "estimatedCompletion": "2025-01-01T14:00:00.000Z"
  }
}
```

**Troubleshooting:**

1. Wait for current export to complete
2. Check email for completion notification
3. Contact support if export takes too long

### Romanian Compliance Errors (RO\_\*)

#### RO_INVALID_CNP

```json
{
  "error": "Invalid Romanian CNP format or checksum",
  "code": "RO_INVALID_CNP",
  "details": {
    "field": "cnp",
    "reason": "invalid_checksum",
    "expectedFormat": "13 digits with valid checksum"
  }
}
```

**Troubleshooting:**

1. Verify CNP has exactly 13 digits
2. Check CNP checksum calculation
3. Ensure CNP follows Romanian format rules
4. Use official CNP validation tools

#### RO_INVALID_POSTAL_CODE

```json
{
  "error": "Invalid Romanian postal code",
  "code": "RO_INVALID_POSTAL_CODE",
  "details": {
    "field": "codPostal",
    "expectedFormat": "6 digits",
    "provided": "0123"
  }
}
```

**Troubleshooting:**

1. Romanian postal codes are exactly 6 digits
2. Check official Romanian postal code database
3. Remove any spaces or special characters

### Database Errors (DB\_\*)

#### DB_CONNECTION_ERROR

```json
{
  "error": "Database connection failed",
  "code": "DB_CONNECTION_ERROR",
  "details": {
    "retryable": true,
    "retryAfter": 5000
  }
}
```

**Troubleshooting:**

1. Check database connectivity
2. Verify database server is running
3. Check network connectivity
4. Retry operation after delay

#### DB_CONSTRAINT_VIOLATION

```json
{
  "error": "Database constraint violation",
  "code": "DB_CONSTRAINT_VIOLATION",
  "details": {
    "constraint": "unique_email",
    "table": "User",
    "field": "email"
  }
}
```

**Troubleshooting:**

1. Check for duplicate values in unique fields
2. Verify foreign key relationships
3. Ensure data integrity constraints are met

### Security Errors (SEC\_\*)

#### SEC_INVALID_JWT

```json
{
  "error": "Invalid JWT token",
  "code": "SEC_INVALID_JWT",
  "details": {
    "reason": "malformed_token",
    "algorithm": "RS256"
  }
}
```

**Troubleshooting:**

1. Obtain new JWT token through login
2. Check token hasn't been tampered with
3. Verify token signing algorithm

#### SEC_2FA_REQUIRED

```json
{
  "error": "Two-factor authentication required",
  "code": "SEC_2FA_REQUIRED",
  "details": {
    "setupRequired": false,
    "backupCodesAvailable": true
  }
}
```

**Troubleshooting:**

1. Complete 2FA setup if not done
2. Provide valid TOTP code from authenticator app
3. Use backup codes if authenticator unavailable

## Troubleshooting Scenarios

### Common Issues and Solutions

#### 1. Registration Problems

**Issue:** "Email already exists" error

```json
{
  "error": "An account with this email already exists",
  "code": "EMAIL_EXISTS"
}
```

**Solutions:**

- Try logging in instead of registering
- Use password reset if you forgot your password
- Contact support if you believe this is an error

**Issue:** Email verification not received

- Check spam/junk folder
- Verify email address is spelled correctly
- Wait a few minutes and check again
- Contact support with your registration details

#### 2. Login Problems

**Issue:** Account locked after failed attempts

- Wait for lockout period to expire (typically 30 minutes)
- Use "Forgot Password" to reset password
- Contact support for account unlock

**Issue:** "Invalid credentials" repeatedly

- Verify email and password are correct
- Check if caps lock is on
- Try password reset
- Clear browser cache and cookies

#### 3. Profile Update Issues

**Issue:** Email change rejected

- Email must be unique across all users
- Check if email is already in use
- Verify email format is correct

**Issue:** Password change fails

- New password must meet complexity requirements
- Cannot reuse recent passwords
- Must provide current password for verification

#### 4. Address Management Problems

**Issue:** Romanian address validation fails

- Verify postal code is exactly 6 digits
- Check county name matches official Romanian list
- Ensure locality is valid for the selected county

**Issue:** Cannot delete default address

- Set another address as default first
- At least one address must exist per user

#### 5. GDPR Compliance Issues

**Issue:** Consent required for operations

- User must explicitly consent to data processing
- Check current consent status
- Provide clear consent language

**Issue:** Data export takes too long

- Exports can take up to 30 days for large datasets
- Check email for completion notifications
- Contact support with request ID

### Network and Connectivity Issues

#### Timeout Errors

```
Error: Request timeout after 30000ms
```

**Solutions:**

- Check internet connection
- Try again with smaller request payload
- Contact support if issue persists

#### CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

- Verify correct API endpoint URL
- Check if request includes proper Origin header
- Use correct HTTP method for the endpoint

### Performance Issues

#### Slow API Responses

- Check internet connection speed
- Try during off-peak hours
- Contact support if consistently slow

#### Rate Limiting

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 60,
    "limit": "100 requests per minute"
  }
}
```

**Solutions:**

- Wait for the retry-after period
- Implement exponential backoff in your client
- Upgrade API plan for higher limits

## Error Monitoring and Reporting

### Client-Side Error Handling

```javascript
class APIErrorHandler {
  static handleError(error) {
    // Log error for debugging
    console.error("API Error:", error);

    // Extract error details
    const { code, details, timestamp } = error;

    // Handle specific error types
    switch (code) {
      case "AUTH_INVALID_CREDENTIALS":
        return this.handleAuthError(error);

      case "VALIDATION_ERROR":
        return this.handleValidationError(error);

      case "RATE_LIMIT_EXCEEDED":
        return this.handleRateLimitError(error);

      default:
        return this.handleGenericError(error);
    }
  }

  static handleAuthError(error) {
    // Redirect to login or show auth form
    window.location.href = "/auth/login";
    return {
      type: "auth",
      message: "Please log in to continue",
      action: "redirect",
    };
  }

  static handleValidationError(error) {
    // Highlight invalid fields
    const { field } = error.details;
    return {
      type: "validation",
      field,
      message: error.error,
      action: "highlight_field",
    };
  }

  static handleRateLimitError(error) {
    const { retryAfter } = error.details;
    return {
      type: "rate_limit",
      retryAfter,
      message: `Too many requests. Try again in ${retryAfter} seconds`,
      action: "retry",
    };
  }

  static handleGenericError(error) {
    return {
      type: "generic",
      message: "An unexpected error occurred. Please try again.",
      action: "retry",
    };
  }
}
```

### Server-Side Error Logging

```typescript
// Error logging middleware
export function errorLoggingMiddleware(error: APIError, req: Request) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.headers.get("X-Request-ID"),
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("User-Agent"),
    ip: req.headers.get("X-Forwarded-For"),
    error: {
      code: error.code,
      message: error.error,
      details: error.details,
      stack: error.stack,
    },
  };

  // Log to monitoring service
  console.error("API Error:", JSON.stringify(errorLog, null, 2));

  // Send to error monitoring service (e.g., Sentry)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        error_code: error.code,
        endpoint: req.url,
      },
      extra: errorLog,
    });
  }
}
```

## Support and Escalation

### When to Contact Support

- **Immediate Issues:**
  - Account locked incorrectly
  - Unable to access account after password reset
  - GDPR data export/delete requests

- **Technical Issues:**
  - Persistent API errors (500 status codes)
  - Authentication problems not resolved by troubleshooting
  - Data inconsistency issues

- **Security Concerns:**
  - Suspicious account activity
  - Unauthorized access attempts
  - Security-related error messages

### Support Request Format

When contacting support, please include:

1. **Request ID** (from error response)
2. **Timestamp** of the error
3. **Endpoint URL** that failed
4. **HTTP method** used
5. **Request payload** (sanitized)
6. **Full error response**
7. **Browser/OS information**
8. **Steps to reproduce**

### Emergency Contacts

- **Security Issues:** security@stemtoys.ro
- **GDPR Requests:** gdpr@stemtoys.ro
- **Technical Support:** support@stemtoys.ro
- **Romanian Compliance:** compliance@stemtoys.ro

## Prevention Best Practices

### Client Implementation

1. **Input Validation:** Validate data before sending to API
2. **Error Boundaries:** Implement error boundaries in UI
3. **Retry Logic:** Implement exponential backoff for retries
4. **Caching:** Cache successful responses when appropriate
5. **Offline Support:** Handle network failures gracefully

### API Usage Guidelines

1. **Rate Limiting Awareness:** Respect API rate limits
2. **Request Batching:** Batch multiple operations when possible
3. **Progressive Enhancement:** Degrade gracefully on API failures
4. **Monitoring:** Monitor API usage and error rates
5. **Version Compatibility:** Stay updated with API changes

This comprehensive error handling guide ensures developers can effectively
troubleshoot issues and provide better user experiences when integrating with
the STEM Toys User Management API.
