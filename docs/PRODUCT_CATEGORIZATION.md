# Product Categorization System

## Overview

This document describes the enhanced product categorization system for STEM
toys, which provides comprehensive filtering and organization capabilities for
both administrators and customers.

## Enhanced Categorization Types

The system now supports the following categorization fields:

### 1. Age Group

- **TODDLERS_1_3**: Toddlers (1-3 years)
- **PRESCHOOL_3_5**: Preschool (3-5 years)
- **ELEMENTARY_6_8**: Elementary (6-8 years)
- **MIDDLE_SCHOOL_9_12**: Middle School (9-12 years)
- **TEENS_13_PLUS**: Teens (13+ years)

### 2. STEM Discipline

- **SCIENCE**: Science-focused toys
- **TECHNOLOGY**: Technology-focused toys
- **ENGINEERING**: Engineering-focused toys
- **MATHEMATICS**: Mathematics-focused toys
- **GENERAL**: General STEM toys

### 3. Learning Outcomes

- **PROBLEM_SOLVING**: Develops problem-solving skills
- **CREATIVITY**: Fosters creativity and imagination
- **CRITICAL_THINKING**: Enhances critical thinking abilities
- **MOTOR_SKILLS**: Improves fine and gross motor skills
- **LOGIC**: Develops logical reasoning

### 4. Product Type

- **ROBOTICS**: Robotics kits and components
- **PUZZLES**: Educational puzzles and brain teasers
- **CONSTRUCTION_SETS**: Building and construction sets
- **EXPERIMENT_KITS**: Science experiment kits
- **BOARD_GAMES**: Educational board games

### 5. Special Categories

- **NEW_ARRIVALS**: Recently added products
- **BEST_SELLERS**: Popular and well-selling products
- **GIFT_IDEAS**: Perfect for gifting
- **SALE_ITEMS**: Products currently on sale

## Database Schema

The `Product` model in `prisma/schema.prisma` includes the following new fields:

```prisma
model Product {
  // ... existing fields

  // Enhanced categorization fields
  ageGroup         AgeGroup?
  stemDiscipline   StemCategory @default(GENERAL)
  learningOutcomes LearningOutcome[]
  productType      ProductType?
  specialCategories SpecialCategory[]

  // ... existing fields

  @@index([ageGroup])
  @@index([stemDiscipline])
  @@index([productType])
  @@index([learningOutcomes])
  @@index([specialCategories])
}
```

## API Integration

### Products API (`/api/products`)

The products API now supports filtering by the new categorization fields:

```typescript
// Example API calls with new filters
GET /api/products?ageGroup=TODDLERS_1_3
GET /api/products?stemDiscipline=SCIENCE
GET /api/products?learningOutcomes=PROBLEM_SOLVING,CREATIVITY
GET /api/products?productType=ROBOTICS
GET /api/products?specialCategories=NEW_ARRIVALS,BEST_SELLERS
```

### Filter API (`/api/products/filter`)

A dedicated filter endpoint is available for advanced filtering:

```typescript
GET /api/products/filter?ageGroup=TODDLERS_1_3&stemDiscipline=SCIENCE&learningOutcomes=PROBLEM_SOLVING,CREATIVITY&productType=ROBOTICS&specialCategories=NEW_ARRIVALS
```

## Frontend Implementation

### Enhanced Product Filters

The product listing pages now include comprehensive filtering capabilities:

1. **Age Group Filter**: Dropdown selection for age groups
2. **STEM Discipline Filter**: Dropdown selection for STEM disciplines
3. **Learning Outcomes Filter**: Multi-select checkboxes for learning outcomes
4. **Product Type Filter**: Dropdown selection for product types
5. **Special Categories Filter**: Multi-select checkboxes for special categories

### Product Display

Products now display categorization badges:

- **Age Group**: Blue badges showing the target age range
- **STEM Discipline**: Green badges showing the STEM focus
- **Product Type**: Purple badges showing the product category
- **Learning Outcomes**: Yellow badges showing the first 2 learning outcomes
  (with "+X more" for additional ones)
- **Special Categories**: Red badges showing special designations

### Mobile-Friendly Design

The filtering system is fully responsive and includes:

- **Desktop**: Sidebar filters with all options visible
- **Mobile**: Slide-up modal with touch-friendly controls
- **Active Filter Count**: Shows the number of active filters
- **Clear All**: One-click option to reset all filters

## Admin Interface

### Product Form

The admin product creation/editing form includes a dedicated "Categorization"
tab with:

- **Age Group**: Dropdown selection
- **STEM Discipline**: Dropdown selection
- **Learning Outcomes**: Multi-select checkboxes
- **Product Type**: Dropdown selection
- **Special Categories**: Multi-select checkboxes

### Product Listing

The admin product listing page displays categorization information as badges,
making it easy to see at a glance how products are categorized.

## Utility Functions

The system includes utility functions in `lib/utils/product-categorization.ts`:

```typescript
// Display name mappings
export const AGE_GROUP_DISPLAY_NAMES: Record<AgeGroup, string>;
export const STEM_DISCIPLINE_DISPLAY_NAMES: Record<StemCategory, string>;
export const LEARNING_OUTCOME_DISPLAY_NAMES: Record<LearningOutcome, string>;
export const PRODUCT_TYPE_DISPLAY_NAMES: Record<ProductType, string>;
export const SPECIAL_CATEGORY_DISPLAY_NAMES: Record<SpecialCategory, string>;

// Helper functions
export function getAgeGroupDisplayName(ageGroup: AgeGroup): string;
export function getStemDisciplineDisplayName(
  stemDiscipline: StemCategory
): string;
export function getLearningOutcomeDisplayName(
  learningOutcome: LearningOutcome
): string;
export function getProductTypeDisplayName(productType: ProductType): string;
export function getSpecialCategoryDisplayName(
  specialCategory: SpecialCategory
): string;
```

## Usage Examples

### Filtering Products by Age and STEM Discipline

```typescript
// Get all robotics products for elementary school children
const products = await fetch(
  "/api/products?ageGroup=ELEMENTARY_6_8&productType=ROBOTICS"
);

// Get science products that develop problem-solving and creativity
const products = await fetch(
  "/api/products?stemDiscipline=SCIENCE&learningOutcomes=PROBLEM_SOLVING,CREATIVITY"
);
```

### Displaying Product Information

```typescript
import {
  getAgeGroupDisplayName,
  getStemDisciplineDisplayName,
} from "@/lib/utils/product-categorization";

// Display user-friendly names
const ageDisplay = getAgeGroupDisplayName(product.ageGroup);
const stemDisplay = getStemDisciplineDisplayName(product.stemDiscipline);
```

## Migration Notes

### Backward Compatibility

The system maintains backward compatibility with existing products:

- Legacy `ageRange` and `stemCategory` fields are still supported
- Products without new categorization fields will still display properly
- The admin interface shows both new and legacy fields during the transition

### Data Migration

When migrating existing products:

1. **Age Range**: Map existing age ranges to new `ageGroup` values
2. **STEM Category**: Map existing categories to new `stemDiscipline` values
3. **Learning Objectives**: Convert existing learning objectives to new
   `learningOutcomes` arrays
4. **Product Type**: Determine appropriate `productType` based on product
   attributes
5. **Special Categories**: Manually assign `specialCategories` based on business
   rules

## Performance Considerations

- **Database Indexes**: All new categorization fields are indexed for optimal
  query performance
- **Caching**: API responses are cached to improve response times
- **Filter Optimization**: Client-side filtering is used for immediate feedback
- **Lazy Loading**: Product images and details are loaded on demand

## Future Enhancements

Potential future improvements:

1. **Advanced Search**: Full-text search across categorization fields
2. **Filter Combinations**: Save and share filter combinations
3. **Recommendations**: AI-powered product recommendations based on
   categorization
4. **Analytics**: Track which filters are most commonly used
5. **Bulk Operations**: Admin tools for bulk categorization updates
