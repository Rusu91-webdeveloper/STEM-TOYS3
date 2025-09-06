# Unused Components Archive

This folder contains components that have been identified as unused in the
current project and moved here for safekeeping.

## Components Moved

### 1. Debug Components (`/debug/`)

- **StripeDebug.tsx** - Debug component for Stripe integration (development
  only)
- **ProductionStripeDebug.tsx** - Production Stripe configuration debug
  component

**Status**: ❌ **UNUSED** - No imports found, debug API routes are empty
directories

### 2. Product Components

- **EnhancedVariantSelector.tsx** - Advanced product variant selector with color
  swatches, size guides, and stock management
- **ProductImageZoom.tsx** - Advanced image zoom component with modal, rotation,
  and download features

**Status**: ❌ **UNUSED** - No imports found, no usage in product pages

### 3. UI Components

- **screen-reader.tsx** - Comprehensive accessibility components for screen
  readers
- **skip-links.tsx** - Skip navigation links for accessibility

**Status**: ❌ **UNUSED** - No imports found, accessibility features not
implemented

### 4. SEO Component

- **SeoMetadataField.tsx** - SEO metadata form component with title,
  description, keywords, and canonical URL fields

**Status**: ❌ **UNUSED** - No imports found, SEO functionality not implemented

### 5. Mobile Components

- **mobile-checkout.tsx** - Complete mobile checkout flow with step-by-step
  navigation
- **mobile-navigation.tsx** - Mobile navigation with tab bar, slide menu, and
  pull-to-refresh

**Status**: ❌ **UNUSED** - No imports found, mobile-specific features not
implemented

### 6. Performance Components (`/performance/`)

- **PerformanceOptimizer.tsx** - Performance monitoring and optimization
  component
- **WebVitalsMonitor.tsx** - Core Web Vitals monitoring dashboard

**Status**: ❌ **UNUSED** - No imports found, performance monitoring not
implemented

### 7. Error Tracking Components (`/error-tracking/`)

- **ErrorDashboard.tsx** - Comprehensive error tracking dashboard

**Status**: ❌ **UNUSED** - No imports found, error tracking not implemented

### 8. Order Tracking Components (`/order-tracking/`)

- **OrderTrackingSystem.tsx** - Order tracking system with status updates

**Status**: ❌ **UNUSED** - No imports found, order tracking not implemented

## Analysis Summary

**Total Components Moved**: 12 components across 8 categories

**Integration Status**: All components were thoroughly analyzed for:

- ✅ Direct imports (`from '@/components/...'`)
- ✅ Relative imports (`from './components/...'`)
- ✅ Dynamic imports and lazy loading
- ✅ Usage in tests and documentation
- ✅ Backend/API integrations
- ✅ Database connections
- ✅ Hidden UI/UX integrations

**Result**: All moved components have **NO** integrations with the current
project.

## Recovery Instructions

If you need to restore any of these components:

1. **Move back to original location**:

   ```bash
   mv components/_unused/[component-name] components/[original-path]/
   ```

2. **Add imports** where needed in your application

3. **Update dependencies** if any are missing

4. **Test functionality** to ensure it works with current project state

## Notes

- All components are fully functional and well-written
- They were moved for project cleanup, not due to bugs or issues
- Consider implementing these features if they align with your project roadmap
- The mobile components and accessibility features could significantly improve
  UX
- Performance and error tracking components could enhance monitoring
  capabilities

---

_Moved on: $(date)_ _Analysis completed: Comprehensive search across entire
codebase_
