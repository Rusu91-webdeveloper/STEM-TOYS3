# Developer Onboarding Guide

Welcome to the STEM Toys E-Commerce API! This comprehensive onboarding guide
will help you get started with integrating our User Management API into your
applications. Whether you're building a mobile app, web application, or
integrating with our e-commerce platform, this guide covers everything you need
to know.

## 🚀 Quick Start (5 minutes)

### Prerequisites

- **API Key**: Sign up at
  [developers.stemtoys.ro](https://developers.stemtoys.ro) to get your API key
- **Development Environment**: Node.js 18+, or any HTTP client
- **Basic Understanding**: REST APIs and JSON

### Your First API Call

```bash
# Get API status
curl -X GET "https://stemtoys.ro/api/health" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production"
}
```

Congratulations! 🎉 You've just made your first API call. Let's dive deeper.

## 📋 Account Setup

### 1. Create Developer Account

1. Visit [developers.stemtoys.ro](https://developers.stemtoys.ro)
2. Sign up with your email address
3. Verify your email
4. Complete your profile with:
   - Company/Organization name
   - Application description
   - Intended use case

### 2. Get API Credentials

After account creation, you'll receive:

- **API Key**: For application identification
- **Client Secret**: For server-side authentication (keep secure!)
- **Developer Dashboard**: Access to usage analytics and documentation

### 3. Choose Your Plan

| Plan             | Requests/Month | Support      | Cost   |
| ---------------- | -------------- | ------------ | ------ |
| **Sandbox**      | 1,000          | Community    | Free   |
| **Starter**      | 10,000         | Email        | $29/mo |
| **Professional** | 100,000        | Chat + Phone | $99/mo |
| **Enterprise**   | Unlimited      | Dedicated    | Custom |

## 🔐 Authentication Setup

### Understanding Authentication

Our API uses a two-step authentication process:

1. **API Key Authentication**: Identifies your application
2. **JWT Bearer Tokens**: Authenticates individual users

### Step 1: Register a Test User

```bash
curl -X POST "https://stemtoys.ro/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "clh8k9x7q0000abcdefghijk",
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

### Step 2: Verify Email

Check your email and click the verification link, or use the development
shortcut:

```bash
# In development, the verification link will be logged to console
# Extract the token from the logs and verify:
curl -X POST "https://stemtoys.ro/api/auth/verify?token=YOUR_TOKEN&email=test@example.com"
```

### Step 3: Login and Get JWT Token

```bash
curl -X POST "https://stemtoys.ro/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clh8k9x7q0000abcdefghijk",
    "name": "Test User",
    "email": "test@example.com",
    "role": "CUSTOMER"
  }
}
```

### Step 4: Use JWT Token

Store the token securely and include it in subsequent requests:

```bash
export JWT_TOKEN="your-jwt-token-here"

curl -X GET "https://stemtoys.ro/api/account/profile" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-API-Key: your-api-key-here"
```

## 🛠️ Development Environment Setup

### Choose Your Development Approach

#### Option 1: API Client Libraries (Recommended)

We provide official client libraries for popular languages:

```bash
# JavaScript/TypeScript
npm install @stemtoys/api-client

# Python
pip install stemtoys-api

# PHP
composer require stemtoys/api-client
```

#### Option 2: HTTP Client + Manual Implementation

Use any HTTP client (curl, Postman, Insomnia) and implement authentication
manually.

#### Option 3: Code Generation

Generate client code from our OpenAPI specification:

```bash
# Generate TypeScript client
npx openapi-typescript https://stemtoys.ro/api/docs/openapi --output client.ts

# Generate Python client
openapi-python-client generate --url https://stemtoys.ro/api/docs/openapi
```

### Environment Configuration

Create a `.env` file for your project:

```bash
# API Configuration
STEMTOYS_API_BASE_URL=https://stemtoys.ro/api
STEMTOYS_API_KEY=your-api-key-here
STEMTOYS_CLIENT_SECRET=your-client-secret-here

# Development Settings
STEMTOYS_ENVIRONMENT=development
STEMTOYS_DEBUG=true
STEMTOYS_TIMEOUT=30000
```

## 📚 Core API Concepts

### Multi-Tenant Architecture

Our API supports multiple business tenants. Each request is scoped to a specific
tenant:

```javascript
// Tenant-scoped request
const client = new StemToysAPI({
  apiKey: "your-key",
  tenantId: "your-tenant-id", // Provided by STEM Toys team
});
```

### GDPR Compliance

All user data handling follows GDPR requirements:

```javascript
// Update consent preferences
await api.updateConsent("marketing", true);

// Request data export
const exportRequest = await api.requestDataExport();

// Withdraw consent
await api.updateConsent("analytics", false);
```

### Romanian Market Compliance

Special handling for Romanian users and businesses:

```javascript
// Romanian address with validation
const address = {
  name: "Home",
  fullName: "Ion Popescu",
  addressLine1: "Strada Victoriei 10",
  city: "București",
  state: "București",
  postalCode: "010101", // 6 digits
  country: "RO",
  phone: "+40712345678",
  judet: "București", // County
  localitate: "Sector 1", // Locality
  codPostal: "010101", // Postal code
};

await api.createAddress(address);
```

## 🏗️ Building Your First Integration

### Step-by-Step User Management System

#### 1. User Registration Flow

```javascript
class UserManagementSystem {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async registerUser(userData) {
    try {
      // Validate input
      this.validateRegistrationData(userData);

      // Register user
      const registration = await this.api.register(userData);

      // Store user ID for email verification
      this.pendingVerifications.set(userData.email, registration.user.id);

      return {
        success: true,
        userId: registration.user.id,
        message: "Registration successful. Please check your email.",
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleRegistrationError(error),
      };
    }
  }

  validateRegistrationData(data) {
    if (!data.name || data.name.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }
    if (!data.email || !data.email.includes("@")) {
      throw new Error("Valid email required");
    }
    if (!data.password || data.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
  }

  handleRegistrationError(error) {
    switch (error.code) {
      case "EMAIL_EXISTS":
        return "This email is already registered. Try logging in instead.";
      case "VALIDATION_ERROR":
        return error.details?.message || "Invalid registration data";
      default:
        return "Registration failed. Please try again.";
    }
  }
}
```

#### 2. Authentication Flow

```javascript
class AuthenticationManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.currentUser = null;
    this.token = null;
  }

  async login(email, password) {
    try {
      const response = await this.api.login(email, password);

      this.token = response.token;
      this.currentUser = response.user;

      // Store token securely
      this.storeToken(this.token);

      return { success: true, user: this.currentUser };
    } catch (error) {
      return {
        success: false,
        error: this.handleLoginError(error),
      };
    }
  }

  async logout() {
    try {
      // Call logout endpoint if available
      await this.api.logout();

      // Clear local state
      this.currentUser = null;
      this.token = null;
      this.clearToken();

      return { success: true };
    } catch (error) {
      // Always clear local state even if API call fails
      this.currentUser = null;
      this.token = null;
      this.clearToken();

      return { success: false, error: error.message };
    }
  }

  handleLoginError(error) {
    switch (error.code) {
      case "AUTH_INVALID_CREDENTIALS":
        return "Invalid email or password";
      case "AUTH_ACCOUNT_LOCKED":
        return `Account locked. Try again after ${error.details.lockoutUntil}`;
      case "AUTH_TOO_MANY_ATTEMPTS":
        return "Too many failed attempts. Please wait before trying again.";
      default:
        return "Login failed. Please try again.";
    }
  }

  storeToken(token) {
    // Use secure storage in production
    if (typeof window !== "undefined") {
      localStorage.setItem("stemtoys_token", token);
    }
  }

  clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stemtoys_token");
    }
  }

  isAuthenticated() {
    return !!(this.token && this.currentUser);
  }
}
```

#### 3. Profile Management

```javascript
class ProfileManager {
  constructor(apiClient, authManager) {
    this.api = apiClient;
    this.auth = authManager;
  }

  async getProfile() {
    if (!this.auth.isAuthenticated()) {
      throw new Error("Authentication required");
    }

    try {
      const profile = await this.api.getProfile();
      return { success: true, profile };
    } catch (error) {
      return {
        success: false,
        error: this.handleProfileError(error),
      };
    }
  }

  async updateProfile(updates) {
    try {
      // Validate updates
      this.validateProfileUpdates(updates);

      const updatedProfile = await this.api.updateProfile(updates);

      // Update local user data
      this.auth.currentUser = { ...this.auth.currentUser, ...updates };

      return { success: true, profile: updatedProfile.user };
    } catch (error) {
      return {
        success: false,
        error: this.handleProfileError(error),
      };
    }
  }

  validateProfileUpdates(updates) {
    if (updates.name && updates.name.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }
    if (updates.email && !updates.email.includes("@")) {
      throw new Error("Valid email required");
    }
  }

  handleProfileError(error) {
    switch (error.code) {
      case "VALIDATION_ERROR":
        return error.details?.message || "Invalid profile data";
      case "EMAIL_EXISTS":
        return "This email is already in use";
      default:
        return "Profile update failed. Please try again.";
    }
  }
}
```

#### 4. Address Management

```javascript
class AddressManager {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async getAddresses() {
    try {
      const response = await this.api.getAddresses();
      return { success: true, addresses: response.addresses };
    } catch (error) {
      return {
        success: false,
        error: this.handleAddressError(error),
      };
    }
  }

  async createAddress(addressData) {
    try {
      // Validate Romanian address if applicable
      if (addressData.country === "RO") {
        this.validateRomanianAddress(addressData);
      }

      this.validateAddress(addressData);

      const result = await this.api.createAddress(addressData);
      return { success: true, address: result.address };
    } catch (error) {
      return {
        success: false,
        error: this.handleAddressError(error),
      };
    }
  }

  validateAddress(address) {
    const required = [
      "name",
      "fullName",
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
      "phone",
    ];
    const missing = required.filter(field => !address[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
  }

  validateRomanianAddress(address) {
    // Romanian postal code validation (6 digits)
    if (!/^\d{6}$/.test(address.postalCode)) {
      throw new Error("Romanian postal code must be exactly 6 digits");
    }

    // Romanian county validation
    const romanianCounties = [
      "Alba",
      "Arad",
      "Argeș",
      "Bacău",
      "Bihor",
      "Bistrița-Năsăud",
      "Botoșani",
      "Brașov",
      "Brăila",
      "București",
      "Buzău",
      "Caraș-Severin",
      "Călărași",
      "Cluj",
      "Constanța",
      "Covasna",
      "Dâmbovița",
      "Dolj",
      "Galați",
      "Giurgiu",
      "Gorj",
      "Harghita",
      "Hunedoara",
      "Ialomița",
      "Iași",
      "Ilfov",
      "Maramureș",
      "Mehedinți",
      "Mureș",
      "Neamț",
      "Olt",
      "Prahova",
      "Satu Mare",
      "Sălaj",
      "Sibiu",
      "Suceava",
      "Teleorman",
      "Timiș",
      "Tulcea",
      "Vaslui",
      "Vâlcea",
      "Vrancea",
    ];

    if (!romanianCounties.includes(address.judet)) {
      throw new Error("Invalid Romanian county");
    }
  }

  handleAddressError(error) {
    switch (error.code) {
      case "VALIDATION_ERROR":
        return error.details?.message || "Invalid address data";
      case "RO_INVALID_POSTAL_CODE":
        return "Invalid Romanian postal code format";
      default:
        return "Address operation failed. Please try again.";
    }
  }
}
```

#### 5. Complete Integration Example

```javascript
// Complete integration example
class StemToysApp {
  constructor() {
    this.api = new StemToysAPI({
      apiKey: process.env.STEMTOYS_API_KEY,
      baseURL: process.env.STEMTOYS_API_BASE_URL,
    });

    this.auth = new AuthenticationManager(this.api);
    this.users = new UserManagementSystem(this.api);
    this.profiles = new ProfileManager(this.api, this.auth);
    this.addresses = new AddressManager(this.api);
  }

  async initialize() {
    // Check for stored authentication
    const storedToken = localStorage.getItem("stemtoys_token");
    if (storedToken) {
      this.api.setToken(storedToken);
      try {
        await this.auth.refreshUser();
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem("stemtoys_token");
      }
    }
  }

  // Public API
  async register(userData) {
    return this.users.registerUser(userData);
  }

  async login(email, password) {
    return this.auth.login(email, password);
  }

  async logout() {
    return this.auth.logout();
  }

  async getProfile() {
    return this.profiles.getProfile();
  }

  async updateProfile(updates) {
    return this.profiles.updateProfile(updates);
  }

  async getAddresses() {
    return this.addresses.getAddresses();
  }

  async createAddress(addressData) {
    return this.addresses.createAddress(addressData);
  }
}

// Usage
const app = new StemToysApp();
await app.initialize();

// Register new user
const registration = await app.register({
  name: "Maria Popescu",
  email: "maria@example.com",
  password: "SecurePass123!",
});

// Login
const login = await app.login("maria@example.com", "SecurePass123!");

// Get profile
const profile = await app.getProfile();

// Update profile
const update = await app.updateProfile({
  name: "Maria Popescu Updated",
});

// Manage addresses
const userAddresses = await app.getAddresses();
const newAddress = await app.createAddress({
  name: "Home",
  fullName: "Maria Popescu Updated",
  addressLine1: "Strada Victoriei 15",
  city: "București",
  state: "București",
  postalCode: "010096",
  country: "RO",
  phone: "+40723456789",
  judet: "București",
  localitate: "Sector 1",
  codPostal: "010096",
});
```

## 🧪 Testing Your Integration

### Unit Testing

```javascript
// Example test suite
describe("UserManagementSystem", () => {
  let apiMock;
  let userSystem;

  beforeEach(() => {
    apiMock = {
      register: jest.fn(),
      verifyEmail: jest.fn(),
    };
    userSystem = new UserManagementSystem(apiMock);
  });

  test("successful registration", async () => {
    apiMock.register.mockResolvedValue({
      user: { id: "123", name: "Test User", email: "test@example.com" },
    });

    const result = await userSystem.registerUser({
      name: "Test User",
      email: "test@example.com",
      password: "SecurePass123!",
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBe("123");
  });

  test("registration validation", async () => {
    await expect(
      userSystem.registerUser({
        name: "A", // Too short
        email: "invalid-email",
        password: "123", // Too short
      })
    ).rejects.toThrow("Name must be at least 2 characters");
  });
});
```

### Integration Testing

```javascript
// Integration test example
describe("End-to-End User Flow", () => {
  let testUser = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "SecurePass123!",
  };

  test("complete user lifecycle", async () => {
    // 1. Register
    const registration = await api.register(testUser);
    expect(registration.user.email).toBe(testUser.email);

    // 2. Verify email (skip in test environment)
    // await api.verifyEmail(registration.verificationToken);

    // 3. Login
    const login = await api.login(testUser.email, testUser.password);
    expect(login.token).toBeDefined();
    expect(login.user.email).toBe(testUser.email);

    // 4. Get profile
    api.setToken(login.token);
    const profile = await api.getProfile();
    expect(profile.user.name).toBe(testUser.name);

    // 5. Update profile
    const updates = { name: "Updated Name" };
    const updated = await api.updateProfile(updates);
    expect(updated.user.name).toBe("Updated Name");

    // 6. Create address
    const address = {
      name: "Home",
      fullName: "Updated Name",
      addressLine1: "123 Test St",
      city: "Test City",
      state: "Test State",
      postalCode: "12345",
      country: "US",
      phone: "+1234567890",
    };
    const createdAddress = await api.createAddress(address);
    expect(createdAddress.address.name).toBe("Home");
  });
});
```

## 🚀 Going Live

### Pre-Launch Checklist

- [ ] **API Key**: Upgraded to production plan
- [ ] **Environment**: All endpoints tested against production
- [ ] **Rate Limits**: Application handles rate limiting gracefully
- [ ] **Error Handling**: Comprehensive error handling implemented
- [ ] **Security**: Tokens stored securely, no credentials in client-side code
- [ ] **GDPR**: Consent management implemented for EU users
- [ ] **Romanian Compliance**: Romanian user data handled correctly
- [ ] **Monitoring**: Error tracking and analytics implemented
- [ ] **Documentation**: Internal documentation for maintenance

### Production Best Practices

1. **Environment Variables**: Never hardcode API keys
2. **Token Management**: Implement secure token storage and refresh
3. **Error Monitoring**: Use services like Sentry for error tracking
4. **Rate Limiting**: Implement client-side rate limiting
5. **Caching**: Cache user data appropriately
6. **Offline Support**: Handle network failures gracefully
7. **Analytics**: Track API usage and user behavior

### Support and Resources

- **Documentation**: [docs.stemtoys.ro](https://docs.stemtoys.ro)
- **Developer Portal**: [developers.stemtoys.ro](https://developers.stemtoys.ro)
- **Community Forum**: [community.stemtoys.ro](https://community.stemtoys.ro)
- **Support Email**: developers@stemtoys.ro
- **Status Page**: [status.stemtoys.ro](https://status.stemtoys.ro)

### Common Pitfalls to Avoid

1. **Don't store tokens in localStorage in production** - use httpOnly cookies
2. **Don't hardcode API keys** - use environment variables
3. **Don't ignore rate limits** - implement proper backoff strategies
4. **Don't forget GDPR consent** - always check consent status
5. **Don't assume Romanian compliance** - validate Romanian-specific fields
6. **Don't ignore error responses** - handle all error codes appropriately

## 🎯 Next Steps

Now that you're onboarded, here are some advanced topics to explore:

1. **Webhooks**: Real-time notifications for user events
2. **Bulk Operations**: Efficient handling of multiple users
3. **Advanced Analytics**: User behavior and segmentation
4. **Multi-Tenant Setup**: Managing multiple organizations
5. **Custom Integrations**: Building specialized workflows

Welcome to the STEM Toys developer community! We're excited to see what you
build. 🚀
