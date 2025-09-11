# AI Bulk Upload API Documentation

## Overview

The AI Bulk Upload API provides intelligent product enhancement capabilities for
STEM toys, automatically generating SEO-optimized descriptions, metadata, tags,
and Romanian market-specific content. This system reduces admin product creation
time by 80-90% through AI-powered automation.

## Table of Contents

- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)
- [Monitoring](#monitoring)

## Authentication

All API endpoints require admin authentication. Include the session cookie in
your requests.

```bash
# Example with curl
curl -X POST "https://your-domain.com/api/admin/products/ai-enhance" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=your-session-token" \
  -d '{"products": [...]}'
```

## API Endpoints

### 1. AI Enhancement API

**Endpoint:** `POST /api/admin/products/ai-enhance`

Enhances a batch of products with AI-generated content.

#### Request Body

```typescript
{
  products: BasicProduct[];
  options?: {
    includeRomanianOptimization?: boolean;
    includeSEOMetadata?: boolean;
    includeLearningOutcomes?: boolean;
    includeAgeGroup?: boolean;
    includeStemDiscipline?: boolean;
    includeProductType?: boolean;
  };
}
```

#### Response

```typescript
{
  success: boolean;
  enhancedProducts: EnhancedProduct[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
    totalProcessingTime: number;
    averageProcessingTime: number;
  };
  errors: Array<{
    product: string;
    error: string;
  }>;
}
```

#### Example Request

```bash
curl -X POST "https://your-domain.com/api/admin/products/ai-enhance" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "name": "Robot Building Kit",
        "price": 299.99,
        "category": "Robotics",
        "description": "A basic robotics kit for learning programming",
        "stockQuantity": 50,
        "tags": ["robotics", "programming"],
        "isActive": true,
        "featured": false
      }
    ],
    "options": {
      "includeRomanianOptimization": true,
      "includeSEOMetadata": true,
      "includeLearningOutcomes": true
    }
  }'
```

#### Example Response

```json
{
  "success": true,
  "enhancedProducts": [
    {
      "name": "Robot Building Kit",
      "price": 299.99,
      "category": "Robotics",
      "description": "A basic robotics kit for learning programming",
      "enhancedDescription": "An advanced robotics kit designed to teach children programming fundamentals through hands-on building and coding activities. Perfect for STEM education and developing problem-solving skills.",
      "metaTitle": "Robot Building Kit - Learn Programming with Robotics",
      "metaDescription": "Advanced robotics kit for children to learn programming through hands-on activities. Perfect for STEM education.",
      "metaKeywords": [
        "robotics",
        "programming",
        "STEM",
        "educational",
        "coding"
      ],
      "tags": [
        "robotics",
        "programming",
        "STEM",
        "educational",
        "elementary-6-8",
        "technology",
        "problem-solving"
      ],
      "ageGroup": "ELEMENTARY_6_8",
      "stemDiscipline": "TECHNOLOGY",
      "productType": "ROBOTICS",
      "learningOutcomes": ["PROBLEM_SOLVING", "LOGIC", "CRITICAL_THINKING"],
      "romanianCompetencies": ["Programare", "Logica", "Rezolvare probleme"],
      "romanianCurriculumAlignment": ["Matematica", "Informatica"],
      "romanianEducationalLevel": "PRIMAR",
      "romanianSubjectAreas": ["Matematica", "Informatica", "Tehnologie"],
      "romanianMinistryApproval": true,
      "romanianEducationalCertification": "Certificat MECTS"
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "successRate": "100.0%",
    "totalProcessingTime": 2500,
    "averageProcessingTime": 2500
  },
  "errors": []
}
```

### 2. Enhanced Bulk Upload API

**Endpoint:** `POST /api/admin/products/bulk-upload`

Uploads products with optional AI enhancement.

#### Request Body

```typescript
{
  products: BasicProduct[];
  aiEnhancement?: {
    enabled: boolean;
    options?: {
      includeRomanianOptimization?: boolean;
      includeSEOMetadata?: boolean;
      includeLearningOutcomes?: boolean;
      includeAgeGroup?: boolean;
      includeStemDiscipline?: boolean;
      includeProductType?: boolean;
    };
  };
}
```

#### Response

```typescript
{
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  aiEnhancement?: {
    enabled: boolean;
    summary?: {
      total: number;
      successful: number;
      failed: number;
      successRate: string;
    };
    reason?: string;
  };
}
```

### 3. AI Health Check API

**Endpoint:** `GET /api/admin/ai/health`

Provides comprehensive health status and monitoring information.

#### Query Parameters

- `provider` (optional): Specific AI provider to check
- `includeMetrics` (optional): Include performance metrics (default: true)
- `includeAlerts` (optional): Include active alerts (default: true)
- `includePerformance` (optional): Include performance summary (default: true)

#### Response

```typescript
{
  status: "success";
  timestamp: string;
  overallHealth: {
    score: number;
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
  };
  config: {
    isConfigured: boolean;
    isEnhancementEnabled: boolean;
    provider: string;
    model: string;
  };
  health: Record<string, AIHealthStatus>;
  rateLimits: Record<string, any>;
  circuitBreakers: Record<string, any>;
  memory: {
    stats: MemoryStats;
    recommendations: string[];
  };
  cache: CacheStats;
  performance?: PerformanceSummary;
  alerts?: PerformanceAlert[];
}
```

#### Example Request

```bash
curl "https://your-domain.com/api/admin/ai/health?includeMetrics=true&includeAlerts=true"
```

## Data Models

### BasicProduct

```typescript
interface BasicProduct {
  name: string;
  price: number;
  category: string;
  images?: string[];
  description?: string;
  sku?: string;
  stockQuantity?: number;
  weight?: number;
  tags?: string[];
  isActive?: boolean;
  featured?: boolean;
}
```

### EnhancedProduct

```typescript
interface EnhancedProduct extends BasicProduct {
  enhancedDescription: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  tags: string[];
  ageGroup?: AgeGroup;
  stemDiscipline?: StemDiscipline;
  productType?: ProductType;
  learningOutcomes: LearningOutcome[];
  romanianCompetencies: string[];
  romanianCurriculumAlignment: string[];
  romanianEducationalLevel?: RomanianEducationalLevel;
  romanianSubjectAreas: string[];
  romanianMinistryApproval: boolean;
  romanianEducationalCertification?: string;
}
```

### Enhancement Options

```typescript
interface EnhancementOptions {
  includeRomanianOptimization?: boolean;
  includeSEOMetadata?: boolean;
  includeLearningOutcomes?: boolean;
  includeAgeGroup?: boolean;
  includeStemDiscipline?: boolean;
  includeProductType?: boolean;
}
```

### Enums

```typescript
enum AgeGroup {
  PRESCHOOL_3_5 = "PRESCHOOL_3_5",
  ELEMENTARY_6_8 = "ELEMENTARY_6_8",
  ELEMENTARY_9_11 = "ELEMENTARY_9_11",
  MIDDLE_SCHOOL_12_14 = "MIDDLE_SCHOOL_12_14",
  HIGH_SCHOOL_15_17 = "HIGH_SCHOOL_15_17",
  ADULT_18_PLUS = "ADULT_18_PLUS",
}

enum StemDiscipline {
  SCIENCE = "SCIENCE",
  TECHNOLOGY = "TECHNOLOGY",
  ENGINEERING = "ENGINEERING",
  MATHEMATICS = "MATHEMATICS",
  ROBOTICS = "ROBOTICS",
  PROGRAMMING = "PROGRAMMING",
  ELECTRONICS = "ELECTRONICS",
}

enum ProductType {
  ROBOTICS = "ROBOTICS",
  PROGRAMMING = "PROGRAMMING",
  ELECTRONICS = "ELECTRONICS",
  CONSTRUCTION = "CONSTRUCTION",
  EXPERIMENT = "EXPERIMENT",
  PUZZLE = "PUZZLE",
  GAME = "GAME",
}

enum LearningOutcome {
  PROBLEM_SOLVING = "PROBLEM_SOLVING",
  CREATIVITY = "CREATIVITY",
  CRITICAL_THINKING = "CRITICAL_THINKING",
  MOTOR_SKILLS = "MOTOR_SKILLS",
  LOGIC = "LOGIC",
  ANALYTICAL_THINKING = "ANALYTICAL_THINKING",
  COLLABORATION = "COLLABORATION",
  COMMUNICATION = "COMMUNICATION",
}

enum RomanianEducationalLevel {
  PRESCOLAR = "PRESCOLAR",
  PRIMAR = "PRIMAR",
  GIMNAZIAL = "GIMNAZIAL",
  LICEAL = "LICEAL",
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not admin)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format

```typescript
{
  error: string;
  details?: string;
  code?: string;
  timestamp?: string;
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `AI_SERVICE_UNAVAILABLE` - AI service is down
- `CACHE_ERROR` - Redis cache error
- `MEMORY_LIMIT_EXCEEDED` - Memory usage too high

## Rate Limiting

The API implements multi-tier rate limiting:

### Global Limits (per provider)

- **OpenAI**: 60 requests/minute, 3600/hour, 10000/day
- **Anthropic**: 50 requests/minute, 3000/hour, 8000/day
- **Gemini**: 100 requests/minute, 6000/hour, 15000/day

### User Limits (per authenticated user)

- **OpenAI**: 30 requests/minute, 1800/hour, 5000/day
- **Anthropic**: 25 requests/minute, 1500/hour, 4000/day
- **Gemini**: 50 requests/minute, 3000/hour, 7500/day

### Batch Limits

- **Max batch size**: 50 products (OpenAI), 40 (Anthropic), 60 (Gemini)
- **Max concurrent batches**: 3 (OpenAI), 2 (Anthropic), 4 (Gemini)

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 15
```

## Examples

### Basic Product Enhancement

```javascript
const response = await fetch("/api/admin/products/ai-enhance", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    products: [
      {
        name: "Arduino Starter Kit",
        price: 89.99,
        category: "Electronics",
        description: "Complete Arduino kit for beginners",
      },
    ],
  }),
});

const result = await response.json();
console.log(result.enhancedProducts[0].enhancedDescription);
```

### Bulk Upload with AI Enhancement

```javascript
const response = await fetch("/api/admin/products/bulk-upload", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    products: productsArray,
    aiEnhancement: {
      enabled: true,
      options: {
        includeRomanianOptimization: true,
        includeSEOMetadata: true,
        includeLearningOutcomes: true,
      },
    },
  }),
});

const result = await response.json();
console.log(`Successfully uploaded ${result.success} products`);
```

### Health Check

```javascript
const response = await fetch("/api/admin/ai/health?includeMetrics=true");
const health = await response.json();

if (health.overallHealth.status === "healthy") {
  console.log("AI services are healthy");
} else {
  console.log("Issues detected:", health.overallHealth.issues);
}
```

## Monitoring

### Health Dashboard

Access the AI monitoring dashboard at `/admin/ai-monitoring` to view:

- Real-time health status
- Performance metrics
- Rate limit usage
- Memory usage
- Cache statistics
- Active alerts

### Key Metrics

- **Response Time**: Average AI response time
- **Success Rate**: Percentage of successful requests
- **Cache Hit Rate**: Percentage of cached responses
- **Error Rate**: Percentage of failed requests
- **Memory Usage**: Current memory consumption
- **Rate Limit Usage**: Current rate limit consumption

### Alerts

The system automatically creates alerts for:

- High error rates (>10%)
- Slow response times (>10 seconds)
- Low cache hit rates (<50%)
- High memory usage (>80%)
- Rate limit violations

### Performance Benchmarks

Expected performance for different batch sizes:

| Batch Size | Processing Time | Memory Usage | Success Rate |
| ---------- | --------------- | ------------ | ------------ |
| 1-10       | 2-5 seconds     | <100 MB      | >99%         |
| 11-50      | 10-30 seconds   | 100-300 MB   | >95%         |
| 51-100     | 30-60 seconds   | 300-500 MB   | >90%         |
| 101-500    | 1-5 minutes     | 500-800 MB   | >85%         |
| 501+       | 5+ minutes      | 800+ MB      | >80%         |

## Best Practices

### 1. Batch Size Optimization

- Use batches of 10-50 products for optimal performance
- For large datasets (>100 products), enable streaming mode
- Monitor memory usage and adjust batch size accordingly

### 2. Error Handling

- Always check the `success` field in responses
- Implement retry logic for failed requests
- Handle rate limit errors gracefully with exponential backoff

### 3. Caching

- Leverage the built-in caching for repeated requests
- Cache results for 24 hours for AI responses
- Cache product enhancements for 7 days

### 4. Monitoring

- Regularly check the health dashboard
- Set up alerts for critical metrics
- Monitor rate limit usage to avoid throttling

### 5. Romanian Market Optimization

- Always enable Romanian optimization for Romanian market
- Review generated Romanian competencies for accuracy
- Verify ministry approval status for educational products

## Support

For technical support or questions:

1. Check the health dashboard for system status
2. Review the troubleshooting guide
3. Check the monitoring logs for detailed error information
4. Contact the development team with specific error details

## Changelog

### Version 1.0.0

- Initial release with OpenAI support
- Basic product enhancement capabilities
- Romanian market optimization
- Rate limiting and caching
- Health monitoring dashboard
