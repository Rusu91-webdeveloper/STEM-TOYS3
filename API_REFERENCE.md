# API Reference

Complete API documentation for the TechTots STEM e-commerce platform. All
endpoints use REST principles with JSON request/response format.

## Table of Contents

- [Authentication](#authentication)
- [Base URLs & Request Format](#base-urls--request-format)
- [Public APIs](#public-apis)
- [Auth APIs](#auth-apis)
- [User APIs](#user-apis)
- [Supplier APIs](#supplier-apis)
- [Admin APIs](#admin-apis)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All protected API endpoints require authentication using NextAuth.js session
cookies.

### Session-Based Authentication

**Required Headers:**

```http
Content-Type: application/json
Cookie: next-auth.session-token=<your-session-token>
```

**Getting a Session:**

1. User logs in via `/api/auth/signin`
2. Session cookie is automatically set
3. All subsequent requests include the cookie

### Permission Levels

- **PUBLIC**: No authentication required
- **USER**: Requires authenticated user
- **SUPPLIER**: Requires SUPPLIER or ADMIN role
- **ADMIN**: Requires ADMIN role only

---

## Base URLs & Request Format

### Base URLs

```
Development: http://localhost:3000
Production:  https://your-domain.com
```

### Standard Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `SERVER_ERROR` - Internal server error

---

## Public APIs

### Products

#### GET `/api/products`

Get paginated list of products with filtering.

**Query Parameters:**

- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `search` (string) - Search in name/description
- `category` (string) - Filter by category slug
- `ageGroup` (string) - Filter by age group
- `stemDiscipline` (string) - Filter by STEM discipline
- `minPrice` (number) - Minimum price
- `maxPrice` (number) - Maximum price
- `sortBy` (string) - Sort: "price-asc", "price-desc", "newest", "popular"
- `featured` (boolean) - Show only featured products

**Example Request:**

```http
GET /api/products?category=robotics&ageGroup=ELEMENTARY_6_8&page=1&limit=12
```

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "name": "RoboBot Coding Kit",
        "slug": "robobot-coding-kit",
        "description": "Interactive robot for learning programming",
        "price": 89.99,
        "compareAtPrice": 119.99,
        "images": ["https://cdn.example.com/image1.jpg"],
        "category": {
          "id": "cat_456",
          "name": "Robotics",
          "slug": "robotics"
        },
        "ageGroup": "ELEMENTARY_6_8",
        "stemDiscipline": "TECHNOLOGY",
        "rating": 4.5,
        "reviewCount": 28,
        "inStock": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 150,
      "pages": 13
    }
  }
}
```

#### GET `/api/products/[slug]`

Get single product by slug.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "RoboBot Coding Kit",
    "slug": "robobot-coding-kit",
    "description": "Detailed description...",
    "price": 89.99,
    "compareAtPrice": 119.99,
    "images": ["url1.jpg", "url2.jpg"],
    "specifications": {
      "weight": "1.2kg",
      "dimensions": "30x20x15cm",
      "batteryType": "AA"
    },
    "category": {...},
    "reviews": [...],
    "relatedProducts": [...]
  }
}
```

#### GET `/api/products/featured`

Get featured products.

**Query Parameters:**

- `limit` (number, default: 8) - Number of products

**Response:** Same format as GET `/api/products`

### Categories

#### GET `/api/categories`

Get all categories with product counts.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cat_123",
      "name": "Robotics",
      "slug": "robotics",
      "description": "Robots and coding kits",
      "image": "https://cdn.example.com/robotics.jpg",
      "productCount": 45
    }
  ]
}
```

### Blog

#### GET `/api/blog`

Get paginated blog posts.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)
- `category` (string) - Filter by category slug

**Response:**

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_123",
        "title": "Top 10 STEM Toys for 2024",
        "slug": "top-10-stem-toys-2024",
        "excerpt": "Discover the best STEM toys...",
        "coverImage": "https://cdn.example.com/blog/cover.jpg",
        "author": {
          "name": "TechTots Editorial",
          "avatar": "..."
        },
        "publishedAt": "2024-01-15T10:00:00Z",
        "readTime": "5 min"
      }
    ],
    "pagination": {...}
  }
}
```

---

## Auth APIs

### POST `/api/auth/register`

Register new user account.

**Permission:** PUBLIC

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+40123456789",
  "acceptTerms": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "userId": "user_123"
  }
}
```

### POST `/api/auth/signin`

Login user.

**Permission:** PUBLIC

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER"
  }
}
```

### POST `/api/auth/forgot-password`

Request password reset.

**Permission:** PUBLIC

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset email sent if account exists"
}
```

### POST `/api/auth/reset-password`

Reset password with token.

**Permission:** PUBLIC

**Request Body:**

```json
{
  "token": "reset_token_here",
  "password": "NewSecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## User APIs

### GET `/api/user/profile`

Get current user profile.

**Permission:** USER

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+40123456789",
    "role": "CUSTOMER",
    "addresses": [...],
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

### PUT `/api/user/profile`

Update user profile.

**Permission:** USER

**Request Body:**

```json
{
  "name": "John Smith",
  "phone": "+40987654321"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {...}
}
```

### GET `/api/user/orders`

Get user's orders.

**Permission:** USER

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string) - Filter by order status

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "orderNumber": "ORD-2024-0123",
        "status": "DELIVERED",
        "total": 299.99,
        "items": [...],
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### POST `/api/user/addresses`

Add new address.

**Permission:** USER

**Request Body:**

```json
{
  "type": "SHIPPING",
  "street": "Str. Exemplu, Nr. 123",
  "city": "București",
  "county": "București",
  "postalCode": "010101",
  "country": "România",
  "isDefault": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "id": "addr_123",
    ...
  }
}
```

---

## Supplier APIs

### Products Management

#### GET `/api/supplier/products`

Get supplier's products.

**Permission:** SUPPLIER

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string) - Search in name/description/SKU
- `status` (string) - Filter: "active", "inactive", "pending", "all"
- `sortBy` (string) - Sort: "name-asc", "price-desc", "stock-asc"
- `lowStock` (boolean) - Show only low stock items

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "name": "RoboBot Coding Kit",
        "sku": "ROBO-001",
        "price": 89.99,
        "stockQuantity": 45,
        "reorderPoint": 10,
        "status": "ACTIVE",
        "sales": 128,
        "revenue": 11519.72,
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {...},
    "summary": {
      "totalProducts": 156,
      "activeProducts": 145,
      "lowStockProducts": 8,
      "outOfStockProducts": 3
    }
  }
}
```

#### POST `/api/supplier/products`

Create new product.

**Permission:** SUPPLIER

**Request Body:**

```json
{
  "name": "RoboBot Coding Kit",
  "description": "Interactive robot...",
  "price": 89.99,
  "compareAtPrice": 119.99,
  "sku": "ROBO-001",
  "stockQuantity": 45,
  "reorderPoint": 10,
  "weight": 1.2,
  "categoryId": "cat_456",
  "tags": ["educational", "programming"],
  "ageGroup": "ELEMENTARY_6_8",
  "stemDiscipline": "TECHNOLOGY",
  "productType": "ROBOTICS",
  "learningOutcomes": ["PROBLEM_SOLVING", "LOGIC"],
  "images": ["https://example.com/image1.jpg"],
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product created successfully. Pending admin approval.",
  "data": {
    "id": "prod_123",
    "status": "PENDING_APPROVAL",
    ...
  }
}
```

#### PUT `/api/supplier/products/[id]`

Update product.

**Permission:** SUPPLIER

**Request Body:** Same as POST, all fields optional

**Response:**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {...}
}
```

#### DELETE `/api/supplier/products/[id]`

Delete product.

**Permission:** SUPPLIER

**Response:**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Bulk Upload

#### POST `/api/supplier/products/bulk-upload`

Upload multiple products at once.

**Permission:** SUPPLIER

**Request Body:**

```json
{
  "products": [
    {
      "name": "Product 1",
      "description": "Description 1",
      "price": 29.99,
      "stockQuantity": 10,
      "sku": "PROD-001",
      ...
    },
    {
      "name": "Product 2",
      ...
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 50,
    "successful": 48,
    "failed": 2,
    "errors": [
      {
        "row": 5,
        "sku": "PROD-005",
        "errors": ["Duplicate SKU"]
      }
    ]
  },
  "message": "Bulk upload completed. 48 products created, 2 failed."
}
```

### Analytics

#### GET `/api/supplier/analytics`

Get supplier analytics dashboard data.

**Permission:** SUPPLIER

**Query Parameters:**

- `period` (string) - "7d", "30d", "90d", "1y", "all"

**Response:**

```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 125000.00,
      "period": 45000.00,
      "change": 12.5
    },
    "orders": {
      "total": 450,
      "period": 156,
      "change": 8.2
    },
    "products": {
      "total": 145,
      "active": 132,
      "lowStock": 8
    },
    "topProducts": [...],
    "recentOrders": [...],
    "salesChart": [...]
  }
}
```

### Invoices

#### GET `/api/supplier/invoices`

Get supplier invoices.

**Permission:** SUPPLIER

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string) - Filter: "pending", "paid", "overdue", "all"

**Response:**

```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "inv_123",
        "invoiceNumber": "INV-2024-0123",
        "amount": 5000.00,
        "status": "PAID",
        "dueDate": "2024-02-01T00:00:00Z",
        "paidAt": "2024-01-28T10:00:00Z",
        "period": "January 2024"
      }
    ],
    "pagination": {...}
  }
}
```

---

## Admin APIs

### Product Management

#### GET `/api/admin/products`

Get all products with admin filters.

**Permission:** ADMIN

**Query Parameters:**

- `page` (number)
- `limit` (number)
- `search` (string)
- `status` (string) - "active", "inactive", "pending", "all"
- `supplier` (string) - Filter by supplier ID
- `featured` (boolean)

**Response:** Similar to supplier products with additional admin fields

#### POST `/api/admin/products/[id]/approve`

Approve pending product.

**Permission:** ADMIN

**Response:**

```json
{
  "success": true,
  "message": "Product approved and published"
}
```

#### POST `/api/admin/products/[id]/enhance`

AI enhance product descriptions.

**Permission:** ADMIN

**Request Body:**

```json
{
  "enhanceDescription": true,
  "enhanceSEO": true,
  "enhanceImages": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Product enhancement started",
  "data": {
    "jobId": "job_123",
    "estimatedTime": 30
  }
}
```

### Order Management

#### GET `/api/admin/orders`

Get all orders.

**Permission:** ADMIN

**Query Parameters:**

- `page` (number)
- `limit` (number)
- `status` (string)
- `search` (string) - Search by order number or customer email
- `startDate` (string) - Filter from date
- `endDate` (string) - Filter to date

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "orderNumber": "ORD-2024-0123",
        "customer": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "total": 299.99,
        "status": "PROCESSING",
        "items": [...],
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {...},
    "summary": {
      "totalOrders": 1234,
      "totalRevenue": 125000.00,
      "pendingOrders": 45
    }
  }
}
```

#### PUT `/api/admin/orders/[id]/status`

Update order status.

**Permission:** ADMIN

**Request Body:**

```json
{
  "status": "SHIPPED",
  "trackingNumber": "TRACK123456",
  "carrier": "FAN Courier",
  "notes": "Shipped via express delivery"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order status updated",
  "data": {...}
}
```

### User Management

#### GET `/api/admin/customers`

Get all customers.

**Permission:** ADMIN

**Query Parameters:**

- `page` (number)
- `limit` (number)
- `search` (string)
- `segment` (string) - "NEW", "ACTIVE", "AT_RISK", "CHURNED"
- `role` (string) - "CUSTOMER", "SUPPLIER"

**Response:**

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "CUSTOMER",
        "segment": "ACTIVE",
        "lifetimeValue": 1250.00,
        "totalOrders": 8,
        "lastOrderAt": "2024-01-10T10:00:00Z",
        "createdAt": "2023-06-15T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### Analytics

#### GET `/api/admin/analytics/dashboard`

Get admin dashboard analytics.

**Permission:** ADMIN

**Query Parameters:**

- `period` (string) - "7d", "30d", "90d", "1y"

**Response:**

```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 125000.00,
      "period": 45000.00,
      "change": 12.5
    },
    "orders": {
      "total": 1234,
      "period": 456,
      "change": 8.2
    },
    "customers": {
      "total": 2345,
      "new": 123,
      "active": 1234
    },
    "products": {
      "total": 456,
      "active": 423,
      "lowStock": 23
    },
    "topProducts": [...],
    "topCategories": [...],
    "salesChart": [...],
    "recentOrders": [...]
  }
}
```

---

## Error Handling

### Error Response Structure

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email is already registered"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Error Codes

**Authentication Errors:**

- `UNAUTHORIZED` - No valid session
- `INVALID_CREDENTIALS` - Wrong email/password
- `EMAIL_NOT_VERIFIED` - Email verification required
- `ACCOUNT_LOCKED` - Too many failed login attempts

**Validation Errors:**

- `VALIDATION_ERROR` - Input validation failed
- `REQUIRED_FIELD` - Required field missing
- `INVALID_FORMAT` - Field format invalid
- `DUPLICATE_ENTRY` - Resource already exists

**Permission Errors:**

- `FORBIDDEN` - Insufficient permissions
- `ADMIN_ONLY` - Admin access required
- `SUPPLIER_ONLY` - Supplier access required

**Resource Errors:**

- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `OUT_OF_STOCK` - Product out of stock

---

## Rate Limiting

### Limits

- **Public APIs**: 100 requests per minute per IP
- **Authenticated APIs**: 1000 requests per minute per user
- **Admin APIs**: 5000 requests per minute
- **File Upload**: 10 requests per minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705334400
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Best Practices

1. **Always Check Response Status**: Verify `success` field before processing
   data
2. **Handle Errors Gracefully**: Display user-friendly messages
3. **Use Pagination**: Don't request all items at once
4. **Cache Responses**: Cache public data to reduce API calls
5. **Respect Rate Limits**: Implement exponential backoff
6. **Validate Input**: Validate data on client before sending
7. **Use HTTPS**: Always use HTTPS in production
8. **Keep Tokens Secure**: Never expose session tokens

---

## Examples

### Example: Get Products with Filters

```javascript
const response = await fetch(
  "/api/products?category=robotics&ageGroup=ELEMENTARY_6_8&page=1&limit=12"
);
const data = await response.json();

if (data.success) {
  console.log(data.data.products);
} else {
  console.error(data.error);
}
```

### Example: Create Product (Supplier)

```javascript
const product = {
  name: "RoboBot Coding Kit",
  description: "Interactive robot...",
  price: 89.99,
  stockQuantity: 45,
  sku: "ROBO-001",
  categoryId: "cat_456",
  ageGroup: "ELEMENTARY_6_8",
};

const response = await fetch("/api/supplier/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(product),
});

const data = await response.json();
```

### Example: Update Order Status (Admin)

```javascript
const response = await fetch("/api/admin/orders/order_123/status", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    status: "SHIPPED",
    trackingNumber: "TRACK123456",
    carrier: "FAN Courier",
  }),
});

const data = await response.json();
```

---

## Support

For API support and questions:

- Email: dev@techtots.ro
- Documentation: See PROJECT_ARCHITECTURE.md
- Environment Setup: See ENVIRONMENT_SETUP.md
