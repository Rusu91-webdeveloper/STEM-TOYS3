# TechTots Supplier Product Management API Documentation

## Overview

The TechTots Supplier Product Management API provides comprehensive endpoints for managing STEM educational products. This API enables suppliers to create, update, validate, and bulk upload products programmatically.

## Authentication

All API endpoints require authentication using NextAuth.js session cookies. Suppliers must be logged in and have an approved account status.

### Headers Required
```
Content-Type: application/json
Cookie: next-auth.session-token=<your-session-token>
```

## Base URL
```
https://your-domain.com/api/supplier/products
```

---

## Endpoints

### 1. Product Validation API

#### `POST /api/supplier/products/validate`

Validates product data before submission to catch errors early and get detailed feedback.

**Request Body:**
```json
{
  "type": "single" | "bulk",
  "data": {
    // Single product object or array of products
  }
}
```

**Single Product Example:**
```json
{
  "type": "single",
  "data": {
    "name": "RoboBot Coding Kit",
    "description": "An interactive robot that teaches children programming basics...",
    "price": 89.99,
    "stockQuantity": 45,
    "sku": "ROBO-001",
    "ageGroup": "ELEMENTARY_6_8",
    "stemDiscipline": "TECHNOLOGY",
    "productType": "ROBOTICS"
  }
}
```

**Bulk Products Example:**
```json
{
  "type": "bulk",
  "data": {
    "products": [
      {
        "name": "Product 1",
        "description": "Description 1",
        "price": 29.99,
        "stockQuantity": 10
      },
      {
        "name": "Product 2", 
        "description": "Description 2",
        "price": 39.99,
        "stockQuantity": 15
      }
    ]
  }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [
    {
      "field": "name",
      "message": "Product name is required",
      "code": "REQUIRED_FIELD"
    }
  ],
  "warnings": [
    {
      "field": "price",
      "message": "Price seems low for a STEM product",
      "code": "LOW_PRICE"
    }
  ],
  "summary": {
    "totalErrors": 1,
    "totalWarnings": 1,
    "isValid": false
  }
}
```

**Error Codes:**
- `REQUIRED_FIELD` - Required field is missing
- `INVALID_FORMAT` - Field format is invalid
- `DUPLICATE_NAME` - Product name already exists
- `DUPLICATE_SKU` - SKU already exists
- `INVALID_CATEGORY` - Category doesn't exist
- `LOW_STOCK` - Stock quantity is at or below reorder point
- `LOW_PRICE` - Price seems unusually low

---

### 2. Single Product Management API

#### `GET /api/supplier/products`

Retrieves a paginated list of supplier's products with filtering and search capabilities.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `search` (string) - Search in name, description, or SKU
- `status` (string) - Filter by status: "active", "inactive", "all"
- `category` (string) - Filter by category ID
- `sortBy` (string) - Sort field and direction: "name-asc", "price-desc", "createdAt-desc"
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `lowStock` (boolean) - Filter products with low stock
- `lowStockThreshold` (number, default: 5) - Low stock threshold

**Example Request:**
```
GET /api/supplier/products?page=1&limit=20&search=robot&status=active&sortBy=name-asc
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "RoboBot Coding Kit",
      "description": "An interactive robot...",
      "price": 89.99,
      "stockQuantity": 45,
      "sku": "ROBO-001",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "category": {
        "id": "cat_456",
        "name": "Robotics"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### `POST /api/supplier/products`

Creates a new product.

**Request Body:**
```json
{
  "name": "RoboBot Coding Kit",
  "description": "An interactive robot that teaches children programming basics...",
  "price": 89.99,
  "compareAtPrice": 119.99,
  "sku": "ROBO-001",
  "stockQuantity": 45,
  "reorderPoint": 10,
  "weight": 1.2,
  "categoryId": "cat_456",
  "tags": ["educational", "programming", "interactive"],
  "ageGroup": "ELEMENTARY_6_8",
  "stemDiscipline": "TECHNOLOGY",
  "productType": "ROBOTICS",
  "learningOutcomes": ["PROBLEM_SOLVING", "LOGIC", "CRITICAL_THINKING"],
  "specialCategories": ["NEW_ARRIVALS"],
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "isActive": true,
  "featured": false
}
```

**Response:**
```json
{
  "product": {
    "id": "prod_123",
    "name": "RoboBot Coding Kit",
    "slug": "robobot-coding-kit",
    "description": "An interactive robot...",
    "price": 89.99,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Product created successfully",
  "success": true
}
```

#### `PUT /api/supplier/products/[id]`

Updates an existing product.

**Request Body:** Same as POST, but all fields are optional.

**Response:**
```json
{
  "product": {
    "id": "prod_123",
    "name": "Updated RoboBot Coding Kit",
    "updatedAt": "2024-01-15T11:30:00Z"
  },
  "message": "Product updated successfully",
  "success": true
}
```

#### `DELETE /api/supplier/products/[id]`

Deletes a product.

**Response:**
```json
{
  "message": "Product deleted successfully",
  "success": true
}
```

---

### 3. Bulk Upload API

#### `POST /api/supplier/products/bulk-upload`

Uploads multiple products at once with batch processing and detailed error reporting.

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
      "category": "Robotics",
      "tags": "educational,programming",
      "ageGroup": "ELEMENTARY_6_8",
      "stemDiscipline": "TECHNOLOGY",
      "productType": "ROBOTICS",
      "learningOutcomes": "PROBLEM_SOLVING,LOGIC",
      "specialCategories": "NEW_ARRIVALS",
      "images": "https://example.com/image1.jpg,https://example.com/image2.jpg"
    },
    {
      "name": "Product 2",
      "description": "Description 2", 
      "price": 39.99,
      "stockQuantity": 15,
      "sku": "PROD-002",
      "category": "Science Kits",
      "tags": "chemistry,experiments",
      "ageGroup": "MIDDLE_SCHOOL_9_12",
      "stemDiscipline": "SCIENCE",
      "productType": "EXPERIMENT_KITS",
      "learningOutcomes": "CRITICAL_THINKING,CREATIVITY",
      "specialCategories": "BEST_SELLERS",
      "images": "https://example.com/image3.jpg"
    }
  ]
}
```

**Response:**
```json
{
  "success": 1,
  "failed": 1,
  "errors": [
    {
      "row": 2,
      "field": "name",
      "message": "A product with this name already exists in your catalog",
      "value": "Product 2"
    }
  ],
  "warnings": [
    {
      "row": 1,
      "field": "price",
      "message": "Price seems low for a STEM product"
    }
  ],
  "processingTime": 1250,
  "summary": {
    "total": 2,
    "success": 1,
    "failed": 1,
    "successRate": "50.0%",
    "processingTime": "1.25s"
  }
}
```

**Features:**
- Upload up to 1000 products at once
- Batch processing (10 products per batch)
- Automatic category creation
- Duplicate detection (name and SKU)
- Detailed error reporting by row
- Progress tracking and performance metrics
- Image URL validation

---

## Data Models

### Product Object

```typescript
interface Product {
  id: string;
  name: string;                    // Required, 1-100 chars
  slug: string;                    // Auto-generated from name
  description: string;             // Required, 10-1000 chars
  price: number;                   // Required, 0.01-999,999.99
  compareAtPrice?: number;         // Optional, must be > price
  sku?: string;                    // Optional, 1-50 chars, unique
  stockQuantity: number;           // Required, 0-999,999
  reorderPoint?: number;           // Optional, 0-999,999
  weight?: number;                 // Optional, 0-999.99 kg
  categoryId?: string;             // Optional, category reference
  tags: string[];                  // Optional, max 20 items
  ageGroup?: AgeGroup;             // Optional enum
  stemDiscipline: StemDiscipline;  // Default: GENERAL
  productType?: ProductType;       // Optional enum
  learningOutcomes: string[];      // Optional, max 5 items
  specialCategories: string[];     // Optional, max 4 items
  images: string[];                // Optional, max 10 URLs
  isActive: boolean;               // Default: true
  featured: boolean;               // Default: false
  supplierId: string;              // Auto-assigned
  createdAt: string;               // Auto-generated
  updatedAt: string;               // Auto-updated
}
```

### Enums

```typescript
enum AgeGroup {
  TODDLERS_1_3 = "TODDLERS_1_3",
  PRESCHOOL_3_5 = "PRESCHOOL_3_5", 
  ELEMENTARY_6_8 = "ELEMENTARY_6_8",
  MIDDLE_SCHOOL_9_12 = "MIDDLE_SCHOOL_9_12",
  TEENS_13_PLUS = "TEENS_13_PLUS"
}

enum StemDiscipline {
  SCIENCE = "SCIENCE",
  TECHNOLOGY = "TECHNOLOGY",
  ENGINEERING = "ENGINEERING",
  MATHEMATICS = "MATHEMATICS",
  GENERAL = "GENERAL"
}

enum ProductType {
  ROBOTICS = "ROBOTICS",
  PUZZLES = "PUZZLES",
  CONSTRUCTION_SETS = "CONSTRUCTION_SETS",
  EXPERIMENT_KITS = "EXPERIMENT_KITS",
  BOARD_GAMES = "BOARD_GAMES"
}

enum LearningOutcome {
  PROBLEM_SOLVING = "PROBLEM_SOLVING",
  CREATIVITY = "CREATIVITY",
  CRITICAL_THINKING = "CRITICAL_THINKING",
  MOTOR_SKILLS = "MOTOR_SKILLS",
  LOGIC = "LOGIC"
}

enum SpecialCategory {
  NEW_ARRIVALS = "NEW_ARRIVALS",
  BEST_SELLERS = "BEST_SELLERS",
  GIFT_IDEAS = "GIFT_IDEAS",
  SALE_ITEMS = "SALE_ITEMS"
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation errors or invalid data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions or account not approved
- `404 Not Found` - Resource doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": "Validation error",
  "message": "Please check your data and try again",
  "details": [
    {
      "field": "name",
      "message": "Product name is required",
      "code": "REQUIRED_FIELD"
    }
  ],
  "totalErrors": 1
}
```

---

## Rate Limiting

- **Single Product API:** 100 requests per minute
- **Bulk Upload API:** 10 requests per minute
- **Validation API:** 200 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

---

## Best Practices

### 1. Validation First
Always use the validation API before submitting products to catch errors early.

### 2. Batch Processing
For bulk uploads, use appropriate batch sizes (50-100 products) for optimal performance.

### 3. Error Handling
Implement proper error handling and retry logic for network failures.

### 4. Caching
Cache product lists and categories when possible to reduce API calls.

### 5. Rate Limiting
Monitor rate limits and implement exponential backoff for retries.

### 6. Data Quality
- Use descriptive, keyword-rich product names
- Include high-quality images (minimum 800x600px)
- Write detailed descriptions with key features and benefits
- Use relevant tags for better discoverability
- Set realistic reorder points based on sales velocity

---

## Examples

### JavaScript/Node.js Example

```javascript
const validateProduct = async (productData) => {
  const response = await fetch('/api/supplier/products/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'single',
      data: productData
    })
  });
  
  const result = await response.json();
  
  if (!result.valid) {
    console.log('Validation errors:', result.errors);
    return false;
  }
  
  return true;
};

const createProduct = async (productData) => {
  const response = await fetch('/api/supplier/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// Usage
const productData = {
  name: "RoboBot Coding Kit",
  description: "An interactive robot that teaches children programming...",
  price: 89.99,
  stockQuantity: 45,
  ageGroup: "ELEMENTARY_6_8",
  stemDiscipline: "TECHNOLOGY"
};

try {
  const isValid = await validateProduct(productData);
  if (isValid) {
    const result = await createProduct(productData);
    console.log('Product created:', result.product);
  }
} catch (error) {
  console.error('Error:', error.message);
}
```

### Python Example

```python
import requests
import json

def validate_product(product_data):
    response = requests.post(
        'https://your-domain.com/api/supplier/products/validate',
        headers={'Content-Type': 'application/json'},
        cookies={'next-auth.session-token': 'your-session-token'},
        json={
            'type': 'single',
            'data': product_data
        }
    )
    
    result = response.json()
    return result['valid'], result.get('errors', [])

def create_product(product_data):
    response = requests.post(
        'https://your-domain.com/api/supplier/products',
        headers={'Content-Type': 'application/json'},
        cookies={'next-auth.session-token': 'your-session-token'},
        json=product_data
    )
    
    if not response.ok:
        error = response.json()
        raise Exception(error['message'])
    
    return response.json()

# Usage
product_data = {
    'name': 'RoboBot Coding Kit',
    'description': 'An interactive robot that teaches children programming...',
    'price': 89.99,
    'stockQuantity': 45,
    'ageGroup': 'ELEMENTARY_6_8',
    'stemDiscipline': 'TECHNOLOGY'
}

try:
    is_valid, errors = validate_product(product_data)
    if is_valid:
        result = create_product(product_data)
        print('Product created:', result['product'])
    else:
        print('Validation errors:', errors)
except Exception as e:
    print('Error:', str(e))
```

---

## Support

For API support and questions:
- Email: api-support@techtots.com
- Documentation: https://docs.techtots.com/api
- Status Page: https://status.techtots.com

---

*Last updated: January 2024*
*API Version: v1.0*
