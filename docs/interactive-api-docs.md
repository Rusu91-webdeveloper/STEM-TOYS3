# Interactive API Documentation Setup

This document explains how to set up and use the interactive API documentation
for the STEM Toys User Management API.

## Overview

The interactive API documentation provides:

- **Swagger UI** for browsing and testing API endpoints
- **Real-time API testing** with authentication
- **Request/response examples** in multiple formats
- **Interactive parameter input** and validation
- **Authentication integration** with JWT tokens
- **Environment switching** between development and production

## Setup Instructions

### 1. Install Dependencies

Add the following dependencies to your Next.js project:

```bash
npm install swagger-ui-react swagger-ui-dist
# or
yarn add swagger-ui-react swagger-ui-dist
```

### 2. Create API Documentation Page

Create `app/docs/api/page.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamically import Swagger UI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

export default function APIDocumentationPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [environment, setEnvironment] = useState("development");

  useEffect(() => {
    // Load OpenAPI specification
    fetch("/api/docs/openapi")
      .then(response => response.json())
      .then(data => {
        setSpec(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load API specification:", error);
        setLoading(false);
      });
  }, []);

  const environments = {
    development: {
      name: "Development",
      url: "http://localhost:3000/api",
      description: "Local development environment",
    },
    staging: {
      name: "Staging",
      url: "https://staging.stemtoys.ro/api",
      description: "Staging environment for testing",
    },
    production: {
      name: "Production",
      url: "https://stemtoys.ro/api",
      description: "Live production environment",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                STEM Toys API Documentation
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Interactive API documentation with testing capabilities
              </p>
            </div>

            {/* Environment Selector */}
            <div className="flex items-center space-x-4">
              <label
                htmlFor="environment"
                className="text-sm font-medium text-gray-700"
              >
                Environment:
              </label>
              <select
                id="environment"
                value={environment}
                onChange={e => setEnvironment(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                {Object.entries(environments).map(([key, env]) => (
                  <option key={key} value={key}>
                    {env.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Environment Info */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Current Environment:</strong>{" "}
                {environments[environment].name}
                <span className="ml-2">•</span>
                <span className="ml-2">
                  {environments[environment].description}
                </span>
                <span className="ml-2">•</span>
                <span className="ml-2 font-mono text-xs">
                  {environments[environment].url}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {spec && (
          <SwaggerUI
            spec={spec}
            url={undefined}
            docExpansion="list"
            defaultModelRendering="schema"
            requestInterceptor={req => {
              // Add environment-specific URL
              req.url = req.url.replace(
                "https://stemtoys.ro/api",
                environments[environment].url
              );
              return req;
            }}
            responseInterceptor={res => {
              // Log responses for debugging
              console.log("API Response:", res);
              return res;
            }}
            presets={[SwaggerUI.presets.apis]}
            plugins={[SwaggerUI.plugins.DownloadUrl]}
            layout="StandaloneLayout"
            tryItOutEnabled={true}
            requestInterceptor={req => {
              // Add any custom headers or authentication here
              return req;
            }}
          />
        )}
      </main>
    </div>
  );
}
```

### 3. Create OpenAPI Specification Endpoint

Create `app/api/docs/openapi/route.ts`:

```typescript
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Read the OpenAPI specification file
    const specPath = path.join(process.cwd(), "docs", "openapi-user-api.yaml");
    const specContent = fs.readFileSync(specPath, "utf-8");

    // Parse YAML to JSON (you might want to use a YAML parser)
    // For now, return as YAML with appropriate content type
    return new NextResponse(specContent, {
      headers: {
        "Content-Type": "application/yaml",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("Failed to load OpenAPI specification:", error);
    return NextResponse.json(
      { error: "Failed to load API documentation" },
      { status: 500 }
    );
  }
}
```

### 4. Authentication Integration

Create a component for managing authentication tokens in the API documentation:

```tsx
// components/docs/ApiAuthManager.tsx
"use client";

import { useState, useEffect } from "react";

interface ApiAuthManagerProps {
  onTokenChange: (token: string | null) => void;
}

export default function ApiAuthManager({ onTokenChange }: ApiAuthManagerProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("api_docs_token");
    if (savedToken) {
      setToken(savedToken);
      onTokenChange(savedToken);
    }
  }, [onTokenChange]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      const newToken = data.token || data.accessToken;

      if (newToken) {
        setToken(newToken);
        localStorage.setItem("api_docs_token", newToken);
        onTokenChange(newToken);
        setError("");
      } else {
        throw new Error("No token received from login response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("api_docs_token");
    onTokenChange(null);
    setEmail("");
    setPassword("");
  };

  if (token) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-800 font-medium">Authenticated</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-green-700 hover:text-green-900 text-sm font-medium"
          >
            Logout
          </button>
        </div>
        <div className="mt-2 text-sm text-green-700">
          Token: {token.substring(0, 20)}...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
      <div className="flex items-center mb-3">
        <svg
          className="h-5 w-5 text-yellow-400 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-yellow-800 font-medium">
          Authentication Required
        </span>
      </div>

      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-yellow-800"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-yellow-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
            placeholder="user@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-yellow-800"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-yellow-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
            placeholder="Enter your password"
            required
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? "Logging in..." : "Login to API"}
        </button>
      </form>

      <div className="mt-3 text-xs text-yellow-700">
        Use this form to authenticate with the API. The token will be
        automatically included in API requests.
      </div>
    </div>
  );
}
```

### 5. Enhanced API Documentation Page

Update the API documentation page to include authentication:

```tsx
// app/docs/api/page.tsx (updated)
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamically import Swagger UI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";
import ApiAuthManager from "@/components/docs/ApiAuthManager";

export default function APIDocumentationPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [environment, setEnvironment] = useState("development");
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Load OpenAPI specification
    fetch("/api/docs/openapi")
      .then(response => response.json())
      .then(data => {
        setSpec(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load API specification:", error);
        setLoading(false);
      });
  }, []);

  const environments = {
    development: {
      name: "Development",
      url: "http://localhost:3000/api",
      description: "Local development environment",
    },
    staging: {
      name: "Staging",
      url: "https://staging.stemtoys.ro/api",
      description: "Staging environment for testing",
    },
    production: {
      name: "Production",
      url: "https://stemtoys.ro/api",
      description: "Live production environment",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                STEM Toys API Documentation
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Interactive API documentation with testing capabilities
              </p>
            </div>

            {/* Environment Selector */}
            <div className="flex items-center space-x-4">
              <label
                htmlFor="environment"
                className="text-sm font-medium text-gray-700"
              >
                Environment:
              </label>
              <select
                id="environment"
                value={environment}
                onChange={e => setEnvironment(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                {Object.entries(environments).map(([key, env]) => (
                  <option key={key} value={key}>
                    {env.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Environment Info */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Current Environment:</strong>{" "}
                {environments[environment].name}
                <span className="ml-2">•</span>
                <span className="ml-2">
                  {environments[environment].description}
                </span>
                <span className="ml-2">•</span>
                <span className="ml-2 font-mono text-xs">
                  {environments[environment].url}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Manager */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ApiAuthManager onTokenChange={setAuthToken} />
      </div>

      {/* API Documentation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {spec && (
          <SwaggerUI
            spec={spec}
            url={undefined}
            docExpansion="list"
            defaultModelRendering="schema"
            requestInterceptor={req => {
              // Add environment-specific URL
              req.url = req.url.replace(
                "https://stemtoys.ro/api",
                environments[environment].url
              );

              // Add authentication token if available
              if (authToken) {
                req.headers.Authorization = `Bearer ${authToken}`;
              }

              return req;
            }}
            responseInterceptor={res => {
              // Log responses for debugging
              console.log("API Response:", res);
              return res;
            }}
            presets={[SwaggerUI.presets.apis]}
            plugins={[SwaggerUI.plugins.DownloadUrl]}
            layout="StandaloneLayout"
            tryItOutEnabled={true}
            supportedSubmitMethods={["get", "post", "put", "delete", "patch"]}
            showExtensions={true}
            showCommonExtensions={true}
            defaultModelExpandDepth={3}
            defaultModelsExpandDepth={3}
            displayRequestDuration={true}
            filter={true}
            showMutatedRequest={true}
          />
        )}
      </main>
    </div>
  );
}
```

### 6. Navigation Integration

Add the API documentation to your navigation. Update your navigation component:

```tsx
// Example navigation update
const navigation = [
  // ... existing navigation items
  {
    name: "API Documentation",
    href: "/docs/api",
    icon: DocumentTextIcon,
    current: pathname === "/docs/api",
  },
];
```

## Features

### Interactive Testing

The interactive documentation provides:

- **Try it out** buttons for all endpoints
- **Parameter input** with validation
- **Request/response display** in real-time
- **Authentication integration** with automatic token inclusion
- **Environment switching** between dev/staging/production

### Authentication Management

- **Login form** integrated into the documentation
- **Token persistence** in localStorage
- **Automatic token inclusion** in API requests
- **Visual authentication status** indicator

### Environment Management

- **Multiple environments** (development, staging, production)
- **URL rewriting** for environment-specific testing
- **Environment indicator** in the header

### Advanced Features

- **Request/response logging** in browser console
- **Download API specification** as YAML/JSON
- **Filter and search** through endpoints
- **Model schema display** with expand/collapse
- **Request duration display** for performance monitoring

## Usage Instructions

### 1. Access the Documentation

Navigate to `/docs/api` in your application.

### 2. Authenticate

Use the authentication form at the top of the page to log in and obtain an API
token.

### 3. Select Environment

Choose the appropriate environment from the dropdown in the header.

### 4. Test Endpoints

1. Find the endpoint you want to test
2. Click the "Try it out" button
3. Fill in the required parameters
4. Click "Execute" to make the API call
5. View the request/response in the interface

### 5. View API Responses

- **Request details**: Shows the exact request made
- **Response status**: HTTP status code and message
- **Response body**: Formatted JSON response
- **Response headers**: All response headers
- **Request duration**: Time taken for the API call

## Security Considerations

### Token Management

- API tokens are stored in localStorage for convenience
- Tokens expire according to your JWT configuration
- Clear tokens by logging out or clearing browser storage

### Environment Separation

- Development tokens don't work in production
- Each environment requires separate authentication
- Test data is isolated between environments

### Request Logging

- All API requests are logged to browser console
- Sensitive data in requests is visible in logs
- Use development environment for testing only

## Customization

### Styling

Customize the Swagger UI appearance by modifying the CSS:

```css
/* Add to your global CSS file */
.swagger-ui .topbar {
  display: none;
}
.swagger-ui .info .title {
  color: #2563eb;
}
.swagger-ui .opblock.opblock-get {
  background: rgba(34, 197, 94, 0.1);
}
.swagger-ui .opblock.opblock-post {
  background: rgba(59, 130, 246, 0.1);
}
.swagger-ui .opblock.opblock-put {
  background: rgba(245, 158, 11, 0.1);
}
.swagger-ui .opblock.opblock-delete {
  background: rgba(239, 68, 68, 0.1);
}
```

### Additional Plugins

Extend functionality with Swagger UI plugins:

```tsx
import SwaggerUI from "swagger-ui-react";
import SwaggerUIStandalonePreset from "swagger-ui-react/swagger-ui-standalone-preset";

// Use standalone preset for more features
<SwaggerUI
  spec={spec}
  presets={[SwaggerUIStandalonePreset]}
  plugins={[SwaggerUI.plugins.DownloadUrl]}
/>;
```

## Troubleshooting

### Common Issues

1. **"Failed to load API specification"**
   - Check that the OpenAPI YAML file exists at `docs/openapi-user-api.yaml`
   - Verify the API endpoint `/api/docs/openapi` is accessible

2. **"Authentication required" errors**
   - Ensure you're logged in using the authentication form
   - Check that the token hasn't expired
   - Verify the token is being included in requests

3. **CORS errors**
   - When testing different environments, ensure CORS is properly configured
   - Use the correct environment URL for your setup

4. **Schema validation errors**
   - Check that your request matches the OpenAPI schema
   - Use the interactive forms to ensure correct parameter types

### Debugging

Enable detailed logging by opening browser developer tools and checking the
console for:

- API request/response details
- Authentication token status
- Environment URL changes
- Error messages and stack traces

## API Testing Best Practices

1. **Start with Development**: Always test in development environment first
2. **Use Test Data**: Create dedicated test users and data
3. **Verify Authentication**: Ensure tokens are valid before testing
4. **Check Rate Limits**: Be aware of API rate limiting
5. **Monitor Performance**: Use the request duration display to identify slow
   endpoints
6. **Test Error Cases**: Verify error handling with invalid inputs
7. **Document Findings**: Note any API issues for the development team

## Integration with CI/CD

Consider integrating API documentation checks into your deployment pipeline:

```yaml
# Example GitHub Actions step
- name: Validate OpenAPI Specification
  run: |
    npm install -g @apidevtools/swagger-cli
    swagger-cli validate docs/openapi-user-api.yaml
```

This setup provides a comprehensive, interactive API documentation experience
that enables developers to explore, understand, and test the STEM Toys User
Management API effectively.
