# A/B Testing System Guide

This guide explains how to use the A/B testing system in the Romanian STEM
e-commerce platform.

## Overview

The A/B testing system allows you to test different variations of content
(titles, CTAs, images, etc.) to optimize conversion rates and user engagement.
The system is specifically designed for Romanian STEM content optimization.

## Features

- ✅ Complete database schema with proper relationships
- ✅ RESTful API endpoints for CRUD operations
- ✅ Real-time metrics tracking and statistical analysis
- ✅ Winner determination with confidence levels
- ✅ Admin dashboard with full test management
- ✅ Frontend integration hooks and components
- ✅ Automatic user assignment and consistent experience

## Database Schema

### Tables

1. **ABTest** - Main test configuration
2. **ABTestVariant** - Individual test variations
3. **ABTestMetrics** - Performance metrics per variant
4. **ABTestResult** - Final test results and analysis

### Key Fields

- `type`: TITLE, CONTENT, CALL_TO_ACTION, IMAGE, STRUCTURE, LAYOUT, PRICING,
  CUSTOM
- `status`: DRAFT, RUNNING, COMPLETED, PAUSED, CANCELLED
- `targetAudience`: ALL, ROMANIAN, NEW_USERS, RETURNING_USERS, MOBILE_USERS,
  DESKTOP_USERS

## API Endpoints

### Admin Endpoints (Require ADMIN role)

- `GET /api/admin/ab-testing` - List all tests
- `POST /api/admin/ab-testing` - Create new test
- `PUT /api/admin/ab-testing?testId={id}` - Update test status
- `GET /api/admin/ab-testing/[testId]` - Get specific test
- `DELETE /api/admin/ab-testing/[testId]` - Delete test

### Public Endpoints

- `GET /api/ab-testing/track?testId={id}&userId={id}` - Get variant for user
- `POST /api/ab-testing/track` - Track metrics

## Admin Dashboard

Access the A/B testing dashboard at `/admin/ab-testing` to:

1. **Create Tests** - Use the form to set up new A/B tests
2. **Monitor Progress** - View running tests and their metrics
3. **Analyze Results** - See completed tests with statistical analysis
4. **Manage Tests** - Start, pause, stop, or delete tests

### Creating a Test

1. Click "Create New A/B Test"
2. Fill in test details:
   - Name and description
   - Test type (Title, CTA, etc.)
   - Target audience
3. Add variants:
   - At least 2 variants required
   - Exactly 1 control variant
   - Weights must sum to 100%
4. Save and start the test

## Frontend Integration

### Using the Hook

```tsx
import { useABTest } from "@/hooks/useABTest";

function MyComponent() {
  const { variant, isLoading, trackClick, trackImpression } = useABTest(
    "test-id",
    userId
  );

  useEffect(() => {
    if (variant) {
      trackImpression();
    }
  }, [variant, trackImpression]);

  const handleClick = () => {
    trackClick();
    // Your action here
  };

  return (
    <div>
      {variant?.content || "Default content"}
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
```

### Using Pre-built Components

```tsx
import { ABTestHeroSection } from "@/components/examples/ABTestHeroSection";
import { ABTestCTA } from "@/components/examples/ABTestCTA";

function HomePage() {
  return (
    <div>
      <ABTestHeroSection
        testId="title_test_2025"
        userId={userId}
        fallbackContent={{
          title: "Welcome to STEM Store",
          subtitle: "Educational toys for Romanian children",
          ctaText: "Shop Now",
          ctaAction: () => router.push("/products"),
        }}
      />

      <ABTestCTA
        testId="cta_test_2025"
        userId={userId}
        fallbackText="Buy Now"
        fallbackAction={() => router.push("/checkout")}
      />
    </div>
  );
}
```

## Test Types and Romanian Optimization

### Title Tests

Test different headline variations for maximum click-through rates:

```json
{
  "name": "Control Title",
  "content": "De ce Copiii Au Nevoie de Jucării STEM?",
  "weight": 50,
  "isControl": true
}
```

### CTA Tests

Test different call-to-action buttons:

```json
{
  "name": "Urgency CTA",
  "content": "🚨 Doar azi: Reducere 30% la jucăriile STEM! Descoperă acum →",
  "weight": 25
}
```

## Metrics Tracking

The system automatically tracks:

- **Impressions** - How many users see each variant
- **Clicks** - User interactions with test elements
- **Conversions** - Desired actions (purchases, signups, etc.)
- **Social Shares** - Content sharing on social media
- **Time on Page** - How long users spend on pages
- **Bounce Rate** - Percentage of users who leave immediately

## Statistical Analysis

### Winner Determination

Tests are automatically analyzed for:

1. **Statistical Significance** - Confidence level > 95%
2. **Improvement Calculation** - Percentage improvement over control
3. **Recommendations** - Actionable insights for implementation

### Sample Results

```json
{
  "winnerVariantId": "variant_123",
  "confidence": 98.5,
  "improvement": 35.2,
  "statisticalSignificance": true,
  "recommendations": [
    "Implement winning title across all STEM content",
    "Expected 35.2% improvement in click-through rates",
    "Continue testing other viral elements"
  ]
}
```

## Best Practices

### Test Design

1. **Clear Hypothesis** - Know what you're testing and why
2. **Significant Differences** - Make variants meaningfully different
3. **Control Variant** - Always have a baseline to compare against
4. **Sufficient Sample Size** - Run tests long enough for statistical
   significance

### Romanian Market Considerations

1. **Cultural Context** - Use Romanian-specific references and language
2. **Educational Focus** - Emphasize learning outcomes and curriculum alignment
3. **Parent Concerns** - Address safety, quality, and educational value
4. **Local Examples** - Use Romanian cities, schools, and cultural references

### Technical Implementation

1. **Consistent Assignment** - Users see the same variant across sessions
2. **Proper Tracking** - Implement all relevant metrics
3. **Fallback Content** - Always provide default content for errors
4. **Performance** - Minimize impact on page load times

## Troubleshooting

### Common Issues

1. **No Variant Assigned**
   - Check if test is active and running
   - Verify user targeting criteria
   - Ensure proper test ID

2. **Metrics Not Tracking**
   - Check API endpoint accessibility
   - Verify tracking function calls
   - Review browser console for errors

3. **Statistical Significance Not Reached**
   - Increase test duration
   - Ensure sufficient traffic
   - Check for data collection issues

### Debug Mode

Enable debug mode in development to see variant assignments:

```tsx
// Debug info appears in development mode
{
  process.env.NODE_ENV === "development" && variant && (
    <div className="text-sm opacity-60">
      A/B Test: {variant.name} {variant.isControl ? "(Control)" : ""}
    </div>
  );
}
```

## Support

For technical support or questions about the A/B testing system:

1. Check the admin dashboard for test status
2. Review API logs for errors
3. Verify database connectivity
4. Test with the provided example components

The system is designed to be robust and handle edge cases gracefully, always
falling back to default content when issues occur.
