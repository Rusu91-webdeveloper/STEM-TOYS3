# Authentication Flows Documentation

## Overview

This document outlines the authentication flows for the STEM Toys E-Commerce
platform, including sequence diagrams for key authentication processes. The
system supports multiple authentication methods including traditional
email/password, social authentication, and two-factor authentication.

## Authentication Architecture

The authentication system is built on NextAuth.js with custom extensions for
Romanian market compliance and advanced security features. It includes:

- **Multi-tenant architecture** with tenant isolation
- **GDPR compliance** with consent management
- **Social authentication** (Google, Facebook, Apple, Romanian providers)
- **Two-factor authentication** (TOTP)
- **Advanced security** with rate limiting and account lockouts
- **Romanian market compliance** with local identity providers

## Sequence Diagrams

### 1. User Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API (/auth/register)
    participant V as Validation Service
    participant DB as Database
    participant E as Email Service
    participant W as Welcome Email
    participant VE as Verification Email

    U->>F: Fill registration form
    F->>A: POST /auth/register
    A->>V: Validate request data
    V-->>A: Validation result

    alt Validation fails
        A-->>F: 400 Bad Request
        F-->>U: Display validation errors
    end

    A->>DB: Check if email exists
    DB-->>A: Email availability

    alt Email exists
        A-->>F: 409 Conflict
        F-->>U: Display email conflict message
    end

    A->>A: Hash password
    A->>DB: Create user record
    DB-->>A: User created

    A->>E: Trigger welcome email
    E-->>A: Welcome email queued
    A->>E: Send verification email
    E-->>A: Verification email sent

    A-->>F: 201 Created
    F-->>U: Show success message

    Note over W,VE: Emails sent asynchronously
```

### 2. Email Verification Flow

```mermaid
sequenceDiagram
    participant U as User
    participant E as Email Client
    participant F as Frontend
    participant A as API (/auth/verify)
    participant DB as Database

    E->>U: User receives verification email
    U->>E: Click verification link
    E->>F: Navigate to verification page
    F->>A: POST /auth/verify?token=X&email=Y
    A->>DB: Find user by email
    DB-->>A: User record

    alt User not found
        A-->>F: 404 Not Found
        F-->>U: Show error message
    end

    A->>A: Validate token matches
    alt Token invalid
        A-->>F: 400 Bad Request
        F-->>U: Show invalid token error
    end

    A->>DB: Update user: isActive=true, emailVerified=now
    DB-->>A: User updated
    A-->>F: 200 OK
    F-->>U: Show success, redirect to login
```

### 3. Login Flow (Traditional)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant N as NextAuth
    participant DB as Database
    participant S as Session Store
    participant L as Lockout Check
    participant R as Rate Limiter

    U->>F: Enter credentials
    F->>N: POST /api/auth/callback/credentials
    N->>R: Check rate limit

    alt Rate limit exceeded
        R-->>N: Rate limit error
        N-->>F: 429 Too Many Requests
        F-->>U: Show rate limit message
    end

    N->>DB: Find user by email
    DB-->>N: User record

    alt User not found
        N-->>F: Invalid credentials
        F-->>U: Show login error
    end

    N->>L: Check account lockout status
    alt Account locked
        L-->>N: Account locked
        N-->>F: Account locked error
        F-->>U: Show lockout message
    end

    N->>N: Verify password hash

    alt Password invalid
        N->>DB: Increment failed login attempts
        DB-->>N: Attempts updated
        N-->>F: Invalid credentials
        F-->>U: Show login error
    end

    N->>DB: Reset failed attempts, update lastLoginAt
    DB-->>N: User updated

    alt 2FA enabled
        N-->>F: Require 2FA challenge
        F-->>U: Show 2FA input
        Note right: Continue to 2FA flow
    end

    N->>S: Create session
    S-->>N: Session created
    N-->>F: Authentication successful
    F-->>U: Redirect to dashboard
```

### 4. Two-Factor Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant N as NextAuth
    participant T as TOTP Validator
    participant DB as Database
    participant S as Session Store

    Note over U,F: User has completed primary authentication

    F->>U: Show 2FA input form
    U->>F: Enter TOTP code
    F->>T: Validate TOTP token
    T->>DB: Get user's TOTP secret
    DB-->>T: TOTP secret

    alt Invalid token
        T-->>F: Invalid token
        F-->>U: Show 2FA error, allow retry
    end

    T-->>N: 2FA validation successful
    N->>DB: Update lastLoginAt
    DB-->>N: Updated
    N->>S: Create authenticated session
    S-->>N: Session created
    N-->>F: Authentication complete
    F-->>U: Redirect to application
```

### 5. Social Authentication Flow (OAuth)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant N as NextAuth
    participant P as OAuth Provider (Google/Facebook)
    participant DB as Database
    participant S as Session Store

    U->>F: Click "Login with Google"
    F->>N: Redirect to OAuth provider
    N->>P: OAuth authorization request
    P->>U: Provider login/consent page
    U->>P: Grant permission
    P->>N: Authorization code
    N->>P: Exchange code for tokens
    P-->>N: Access token + ID token

    N->>P: Request user profile
    P-->>N: User profile data

    N->>DB: Find or create user account
    alt Existing user
        DB-->>N: Existing user record
        N->>DB: Update social auth data
    else New user
        DB-->>N: New user created
    end

    N->>S: Create session
    S-->>N: Session created
    N-->>F: Redirect with session
    F-->>U: Authentication successful
```

### 6. Password Reset Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API (/auth/forgot-password)
    participant DB as Database
    participant E as Email Service
    participant T as Token Generator
    participant R as Reset API (/auth/reset-password)

    U->>F: Click "Forgot Password"
    F->>U: Show email input form
    U->>F: Enter email address
    F->>A: POST /auth/forgot-password

    A->>DB: Find user by email
    DB-->>A: User record

    alt User not found
        A-->>F: 200 OK (security: don't reveal if email exists)
        F-->>U: Show "check your email" message
    end

    A->>T: Generate reset token
    T-->>A: Reset token
    A->>DB: Store reset token
    DB-->>A: Token stored

    A->>E: Send password reset email
    E-->>A: Email sent
    A-->>F: 200 OK
    F-->>U: Show success message

    Note over E,U: User receives reset email

    U->>E: Click reset link
    E->>F: Navigate to reset page
    F->>U: Show new password form
    U->>F: Enter new password
    F->>R: POST /auth/reset-password

    R->>DB: Find user by reset token
    DB-->>R: User record

    alt Invalid/expired token
        R-->>F: 400 Bad Request
        F-->>U: Show error message
    end

    R->>R: Hash new password
    R->>DB: Update password, clear reset token
    DB-->>R: Password updated
    R-->>F: 200 OK
    F-->>U: Password reset successful
```

### 7. Multi-Tenant Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant M as Middleware
    participant A as API
    participant T as Tenant Service
    participant DB as Database
    participant S as Session Store

    U->>F: Access application
    F->>M: Request with tenant context
    M->>T: Resolve tenant from subdomain/domain

    alt Invalid tenant
        T-->>M: Tenant not found
        M-->>F: 404 Tenant Not Found
        F-->>U: Show tenant error
    end

    T-->>M: Tenant information
    M->>A: API request with tenant context

    A->>DB: Query with tenant isolation
    Note right: All queries include tenantId filter

    DB-->>A: Tenant-scoped data
    A-->>M: Response
    M-->>F: Tenant-aware response
    F-->>U: Display tenant-specific content

    Note over S: Session includes tenant context
```

### 8. GDPR Consent Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant C as Consent API (/consent)
    participant L as Consent Logger
    participant DB as Database
    participant A as Audit Service

    U->>F: Access consent preferences
    F->>C: GET current consent status
    C->>DB: Query user consents
    DB-->>C: Consent history
    C-->>F: Display consent status

    U->>F: Update consent preferences
    F->>C: POST /consent (consent updates)
    C->>C: Validate consent data

    alt Invalid consent
        C-->>F: 400 Validation Error
        F-->>U: Show validation error
    end

    C->>DB: Update user consent status
    DB-->>C: Consent updated
    C->>L: Log consent change
    L->>DB: Store consent log entry
    DB-->>L: Log stored
    L->>A: Audit consent change
    A-->>L: Audit recorded

    C-->>F: 200 Consent Updated
    F-->>U: Show success message

    Note over L,A: All consent changes are logged and auditable
```

## Security Features

### Rate Limiting

- **Registration**: 5 requests per IP per 15 minutes
- **Login attempts**: Progressive delays after failed attempts
- **Password reset**: 3 requests per email per hour
- **API endpoints**: Configurable per endpoint

### Account Security

- **Password hashing**: bcrypt with salt rounds
- **Session management**: Secure HTTP-only cookies
- **CSRF protection**: Token-based validation
- **Account lockout**: After 5 failed login attempts
- **Suspicious activity monitoring**: IP tracking and anomaly detection

### Multi-Tenant Isolation

- **Data segregation**: All queries include tenant context
- **Access control**: Users can only access their tenant's data
- **Audit logging**: All cross-tenant operations logged
- **Resource limits**: Per-tenant resource quotas

## Error Handling

### Authentication Errors

- `400`: Invalid credentials or malformed request
- `401`: Authentication required or invalid session
- `403`: Insufficient permissions or tenant access denied
- `409`: Email already exists (registration)
- `429`: Rate limit exceeded
- `500`: Server error during authentication

### Validation Errors

- **Registration**: Name, email, password validation
- **Profile Update**: Email uniqueness, password strength
- **Address**: Romanian postal code validation
- **Consent**: Required GDPR consent fields

## Romanian Compliance

### Identity Validation

- **CNP validation**: Romanian personal numerical code format
- **CUI validation**: Romanian tax identification number
- **Address validation**: Romanian postal codes and counties
- **Age verification**: For users under 18 (parental consent required)

### Data Localization

- **Romanian data residency**: Data stored in EU-compliant regions
- **ANSPDCP compliance**: Romanian data protection authority requirements
- **Fiscal compliance**: Romanian tax law requirements for B2B

## Monitoring and Logging

### Authentication Events

- Successful logins (with IP, user agent)
- Failed login attempts
- Account lockouts
- Password resets
- Session creation/destruction
- 2FA setup and usage

### Security Alerts

- Multiple failed login attempts
- Suspicious IP addresses
- Unusual login patterns
- Consent withdrawals
- Account deletions

## API Rate Limits

```yaml
# Rate limiting configuration
auth:
  registration: "5 per 15min per IP"
  login: "10 per 5min per IP"
  password_reset: "3 per hour per email"
  api_general: "100 per min per user"
  api_admin: "1000 per min per admin"

# Progressive delays for failed logins
login_delays:
  attempt_1: 0s
  attempt_2: 1s
  attempt_3: 5s
  attempt_4: 15s
  attempt_5: 60s
  lockout: 30min
```

## Testing Scenarios

### Happy Path Tests

1. Successful registration → email verification → login
2. Social authentication flow completion
3. 2FA setup and login verification
4. Password reset flow
5. Profile updates with validation

### Error Path Tests

1. Invalid email formats
2. Weak passwords
3. Expired verification tokens
4. Rate limit violations
5. Account lockout scenarios
6. Cross-tenant access attempts

### Security Tests

1. SQL injection attempts
2. XSS in user inputs
3. CSRF token validation
4. Session fixation attacks
5. Brute force protection

## Performance Considerations

### Caching Strategy

- User sessions cached in Redis
- User profile data cached with TTL
- Tenant configuration cached
- Rate limit counters cached

### Database Optimization

- User table indexed by email, tenantId
- Composite indexes for common queries
- Read replicas for authentication checks
- Connection pooling for high concurrency

### Scalability Features

- Horizontal database sharding by tenant
- Redis cluster for session storage
- CDN for static authentication assets
- Load balancing for API endpoints
