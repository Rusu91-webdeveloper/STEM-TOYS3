# STEM Toys E-commerce API Documentation

## Overview

The STEM Toys e-commerce platform provides a comprehensive REST API for managing
products, orders, users, and all e-commerce operations. The API supports
multiple versions, comprehensive authentication, and follows RESTful principles.

## Base URL

- **Production**: `https://techtots.com/api`
- **Development**: `http://localhost:3000/api`

## API Versioning

The API supports multiple versions with backward compatibility:

- **Current Version**: v1 (default)
- **Supported Versions**: v1, v2, v3
- **Deprecation**: Automatic warnings for deprecated versions

### Version Headers

```http
Accept: application/vnd.api+json;version=2
X-API-Version: v2
```

### Version Query Parameter

```http
GET /api/products?version=v2
```

### Version URL Path

```http
GET /api/v2/products
```

## Authentication

### JWT Token Authentication

Most endpoints require authentication using JWT tokens.

```http
Authorization: Bearer <jwt_token>
```

### Admin Authentication

Admin endpoints require elevated permissions:

```http
Authorization: Bearer <admin_jwt_token>
X-Admin-Role: ADMIN
```

### Authentication Endpoints

#### POST /api/auth/login

Login with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/register

Register a new user account.

**Request:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Please check your email to verify your account"
}
```

#### POST /api/auth/refresh

Refresh an expired JWT token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Products API

### GET /api/products

Retrieve products with filtering and pagination.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `category` (string): Filter by category slug
- `search` (string): Search in product names and descriptions
- `priceMin` (number): Minimum price filter
- `priceMax` (number): Maximum price filter
- `featured` (boolean): Filter featured products
- `inStock` (boolean): Filter products in stock
- `sort` (string): Sort by `name`, `price`, `createdAt`, `featured`
- `order` (string): Sort order `asc` or `desc`

**Example Request:**

```http
GET /api/products?category=science-kits&priceMin=10&priceMax=100&featured=true&page=1&limit=20
```

**Response:**

```json
{
  "data": [
    {
      "id": "prod_123",
      "name": "Advanced Chemistry Set",
      "slug": "advanced-chemistry-set",
      "description": "Complete chemistry set for budding scientists",
      "price": 49.99,
      "salePrice": 39.99,
      "sku": "CHEM-ADV-001",
      "stockQuantity": 25,
      "featured": true,
      "images": [
        {
          "id": "img_123",
          "url": "https://cdn.techtots.com/products/chemistry-set-1.jpg",
          "alt": "Chemistry Set Main View",
          "order": 1
        }
      ],
      "category": {
        "id": "cat_123",
        "name": "Science Kits",
        "slug": "science-kits"
      },
      "variants": [
        {
          "id": "var_123",
          "name": "Size",
          "options": ["Small", "Medium", "Large"]
        }
      ],
      "averageRating": 4.5,
      "reviewCount": 28,
      "tags": ["chemistry", "science", "educational"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /api/products/{slug}

Retrieve a single product by slug.

**Response:**

```json
{
  "id": "prod_123",
  "name": "Advanced Chemistry Set",
  "slug": "advanced-chemistry-set",
  "description": "Complete chemistry set for budding scientists",
  "longDescription": "This comprehensive chemistry set includes...",
  "price": 49.99,
  "salePrice": 39.99,
  "sku": "CHEM-ADV-001",
  "stockQuantity": 25,
  "featured": true,
  "specifications": {
    "age": "8-14 years",
    "materials": "Safe plastic and glass",
    "weight": "2.5kg",
    "dimensions": "30x20x15cm"
  },
  "images": [...],
  "category": {...},
  "variants": [...],
  "reviews": [...],
  "relatedProducts": [...]
}
```

### POST /api/admin/products

Create a new product (Admin only).

**Request:**

```json
{
  "name": "New Science Kit",
  "description": "Amazing science experiments",
  "price": 29.99,
  "sku": "SCI-NEW-001",
  "categoryId": "cat_123",
  "stockQuantity": 50,
  "featured": false,
  "tags": ["science", "educational"],
  "specifications": {
    "age": "6-12 years",
    "materials": "Plastic"
  }
}
```

## Orders API

### GET /api/orders

Retrieve user orders (authenticated).

**Query Parameters:**

- `status` (string): Filter by order status
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**

```json
{
  "data": [
    {
      "id": "order_123",
      "orderNumber": "ORD-2024-001234",
      "status": "COMPLETED",
      "paymentStatus": "PAID",
      "total": 79.98,
      "subtotal": 69.98,
      "tax": 7.00,
      "shippingCost": 3.00,
      "items": [
        {
          "id": "item_123",
          "productId": "prod_123",
          "name": "Chemistry Set",
          "price": 49.99,
          "quantity": 1,
          "total": 49.99
        }
      ],
      "shippingAddress": {
        "name": "John Doe",
        "addressLine1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postalCode": "94102",
        "country": "US"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "deliveredAt": "2024-01-18T15:45:00Z"
    }
  ],
  "pagination": {...}
}
```

### POST /api/orders

Create a new order.

**Request:**

```json
{
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "variantOptions": {
        "size": "Medium",
        "color": "Blue"
      }
    }
  ],
  "shippingAddressId": "addr_123",
  "paymentMethod": "stripe",
  "couponCode": "SAVE10",
  "notes": "Please handle with care"
}
```

### GET /api/orders/{orderNumber}

Retrieve a specific order by order number.

## Cart API

### GET /api/cart

Retrieve current user's cart.

**Response:**

```json
{
  "id": "cart_123",
  "userId": "user_123",
  "items": [
    {
      "id": "cartitem_123",
      "productId": "prod_123",
      "product": {
        "id": "prod_123",
        "name": "Chemistry Set",
        "price": 49.99,
        "images": [...]
      },
      "quantity": 2,
      "variantOptions": {
        "size": "Medium"
      },
      "price": 49.99,
      "total": 99.98
    }
  ],
  "subtotal": 99.98,
  "tax": 10.00,
  "total": 109.98,
  "itemCount": 2,
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### POST /api/cart/items

Add item to cart.

**Request:**

```json
{
  "productId": "prod_123",
  "quantity": 2,
  "variantOptions": {
    "size": "Medium",
    "color": "Blue"
  }
}
```

### PUT /api/cart/items/{itemId}

Update cart item quantity.

### DELETE /api/cart/items/{itemId}

Remove item from cart.

## Categories API

### GET /api/categories

Retrieve all categories.

**Response:**

```json
{
  "data": [
    {
      "id": "cat_123",
      "name": "Science Kits",
      "slug": "science-kits",
      "description": "Educational science experiment kits",
      "image": "https://cdn.techtots.com/categories/science.jpg",
      "parentId": null,
      "children": [
        {
          "id": "cat_124",
          "name": "Chemistry Sets",
          "slug": "chemistry-sets",
          "parentId": "cat_123"
        }
      ],
      "productCount": 45,
      "isActive": true
    }
  ]
}
```

## User Account API

### GET /api/account/profile

Get user profile information.

**Response:**

```json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "CUSTOMER",
  "emailVerified": true,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "preferences": {
    "language": "en",
    "currency": "USD",
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```

### PUT /api/account/profile

Update user profile.

### GET /api/account/addresses

Get user addresses.

### POST /api/account/addresses

Add new address.

### GET /api/account/wishlist

Get user wishlist.

### POST /api/account/wishlist

Add item to wishlist.

## Analytics API (Admin)

### GET /api/admin/analytics/dashboard

Get dashboard analytics data.

**Query Parameters:**

- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `period` (string): Predefined period (`today`, `week`, `month`, `year`)

**Response:**

```json
{
  "overview": {
    "totalUsers": 1250,
    "totalOrders": 340,
    "totalRevenue": 15750.50,
    "conversionRate": 3.2,
    "averageOrderValue": 46.32
  },
  "chartData": {
    "revenue": [
      {
        "date": "2024-01-15",
        "revenue": 1250.00,
        "orders": 28
      }
    ],
    "userGrowth": [...],
    "topProducts": [...],
    "topCategories": [...]
  }
}
```

### GET /api/admin/analytics/funnel

Get conversion funnel analysis.

**Query Parameters:**

- `steps` (string): Comma-separated funnel steps
- `startDate` (string): Analysis start date
- `endDate` (string): Analysis end date

## Blog API

### GET /api/blog

Get blog posts.

**Query Parameters:**

- `category` (string): Filter by STEM category
- `language` (string): Filter by language
- `published` (boolean): Filter published posts
- `page` (number): Page number
- `limit` (number): Items per page

### GET /api/blog/{slug}

Get single blog post by slug.

### POST /api/admin/blog

Create new blog post (Admin only).

## Reviews API

### GET /api/products/{productId}/reviews

Get product reviews.

### POST /api/products/{productId}/reviews

Create product review (authenticated).

**Request:**

```json
{
  "rating": 5,
  "title": "Excellent product!",
  "content": "My kids love this chemistry set...",
  "recommendToFriend": true
}
```

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

- **General API**: 100 requests per minute per IP
- **Authentication**: 5 login attempts per minute per IP
- **Admin API**: 200 requests per minute per authenticated admin

## Webhooks

### Order Events

Configure webhooks to receive order status updates:

```json
{
  "event": "order.completed",
  "data": {
    "orderId": "order_123",
    "orderNumber": "ORD-2024-001234",
    "status": "COMPLETED",
    "total": 79.98,
    "customer": {
      "id": "user_123",
      "email": "john@example.com"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @techtots/api-client
```

```typescript
import { TechTotsAPI } from "@techtots/api-client";

const api = new TechTotsAPI({
  baseURL: "https://techtots.com/api",
  apiKey: "your_api_key",
});

const products = await api.products.list({
  category: "science-kits",
  limit: 20,
});
```

### Python

```bash
pip install techtots-api
```

```python
from techtots_api import TechTotsClient

client = TechTotsClient(
    base_url='https://techtots.com/api',
    api_key='your_api_key'
)

products = client.products.list(
    category='science-kits',
    limit=20
)
```

## Testing

### Test Credentials

Use these credentials in the development environment:

- **Customer Account**:
  - Email: `test@example.com`
  - Password: `password123`

- **Admin Account**:
  - Email: `admin@techtots.com`
  - Password: `admin123`

### Test Payment Cards

Use Stripe test cards for payment testing:

- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`

## Changelog

### v1.2.0 (Latest)

- Added A/B testing endpoints
- Enhanced analytics dashboard
- Improved search functionality
- Added wishlist sharing

### v1.1.0

- Added blog API endpoints
- Enhanced product filtering
- Added review moderation

### v1.0.0

- Initial API release
- Core e-commerce functionality
- Authentication and authorization

## Support

- **Documentation**: [https://docs.techtots.com](https://docs.techtots.com)
- **Support Email**: [api-support@techtots.com](mailto:api-support@techtots.com)
- **Developer Forum**:
  [https://community.techtots.com](https://community.techtots.com)
- **Status Page**: [https://status.techtots.com](https://status.techtots.com)
