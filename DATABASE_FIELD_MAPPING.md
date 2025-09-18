# Database Field Mapping Guide

## Product Fields Overview

### 🔍 **attributes** Field (JSON)
**Purpose:** Stores SEO and product-specific metadata that can be displayed to users.

**Common contents:**
- `metaTitle` - SEO-optimized page title (60-70 characters)
- `metaDescription` - SEO-optimized page description (150-160 characters)
- `metaKeywords` - Array of SEO keywords
- Product-specific attributes (color, size, features, etc.)

**Example:**
```json
{
  "metaTitle": "LEGO Mindstorms Robot Inventor - Kit avansat de robotică pentru copii",
  "metaDescription": "Descoperă LEGO Mindstorms Robot Inventor, kitul perfect pentru construirea și programarea roboților. Stimulează creativitatea și gândirea critică!",
  "metaKeywords": ["LEGO", "robotica", "educație", "programare"],
  "color": "Multiple",
  "difficulty": "Advanced"
}
```

### 🔧 **metadata** Field (JSON)
**Purpose:** Stores operational/tracking data for internal use only.

**Common contents:**
- `createdViaBulkUpload` - Boolean flag for bulk upload tracking
- `bulkUploadTimestamp` - When the product was created via bulk upload
- `enhancementMethod` - AI enhancement method used ("standard", "fallback", "dual-provider")
- `supplierId` - For supplier-uploaded products
- `ministryApproved` - Romanian ministry approval status
- `isActive` - Product active status (for tracking)
- `fixedByScript` - When product was fixed by maintenance scripts

**Example:**
```json
{
  "createdViaBulkUpload": true,
  "bulkUploadTimestamp": "2025-09-18T12:34:56.789Z",
  "enhancementMethod": "dual-provider",
  "ministryApproved": true,
  "isActive": true,
  "fixedByScript": true,
  "fixTimestamp": "2025-09-18T14:20:00.000Z"
}
```

## 🚫 **Important Distinctions**

### What Goes Where:
- **SEO data** → `attributes` (user-facing)
- **Tracking data** → `metadata` (internal-only)
- **Product status** → Individual fields (`isActive`, `romanianMinistryApproval`)
- **Categorization** → Individual fields (`ageGroup`, `stemDiscipline`, `productType`)

### AI Enhancement Rules:
1. **metaTitle, metaDescription, metaKeywords** → Save to `attributes` field
2. **ageGroup, stemDiscipline, productType** → Save to individual fields (enums)
3. **learningOutcomes** → Save to individual field (array)
4. **Operational data** → Handled by system, don't include in AI response

## ✅ **Current Field Status**

### Always Set to True:
- `isActive: true` (schema default)
- `romanianMinistryApproval: true` (bulk upload default)

### Properly Mapped:
- SEO metadata → `attributes` field
- Operational tracking → `metadata` field
- Product enums → Individual fields
- Learning outcomes → Individual array field

## 🔒 **Data Integrity Rules**

1. **No hallucinations allowed** - AI must use exact enum values
2. **Field separation maintained** - SEO vs operational data clearly separated
3. **Default values enforced** - isActive and ministry approval always true
4. **Schema compliance** - All fields match Prisma schema exactly

This separation ensures clean data structure, proper SEO optimization, and reliable operational tracking.
