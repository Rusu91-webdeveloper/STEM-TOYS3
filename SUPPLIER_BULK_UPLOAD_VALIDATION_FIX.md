# Supplier Bulk Upload Validation Fix

## Problem Summary

When suppliers tried to upload products via the bulk upload feature with AI
enhancement, the API was returning a **400 Bad Request** error with validation
failures:

- **Empty enum fields**: `ageGroup`, `stemDiscipline`, and `productType` were
  being sent as empty strings (`""`), but Zod validation expected either valid
  enum values or `undefined`
- **SKU too long**: Some SKUs exceeded the 50-character limit
- **Inngest not triggered**: Because validation failed, the Inngest job was
  never created or triggered

## Root Cause

1. **Frontend parsing issue**: The CSV parser in `SupplierBulkUpload.tsx` was
   converting empty enum fields to empty strings instead of `undefined`
2. **Backend validation issue**: The Zod schema had problematic `.refine()`
   calls trying to call `.trim()` on enum values (which don't have that method)
3. **SKU not trimmed**: Long SKUs weren't being truncated to the maximum length

## Changes Made

### 1. Frontend: `SupplierBulkUpload.tsx`

#### Added helper functions for normalization:

```typescript
// Helper to normalize enum values (convert empty strings to undefined)
const normalizeEnum = (value: any): string | undefined => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  return normalized === "" ? undefined : normalized;
};

// Helper to normalize SKU (trim to 50 characters max)
const normalizeSKU = (value: any): string | undefined => {
  const sku = String(value || "").trim();
  return sku === "" ? undefined : sku.substring(0, 50);
};
```

#### Updated product parsing:

- Enum fields (`ageGroup`, `stemDiscipline`, `productType`) now use
  `normalizeEnum()` to convert empty strings to `undefined`
- SKU field now uses `normalizeSKU()` to trim to 50 characters maximum
- Updated TypeScript interface to explicitly allow `undefined` for enum fields

#### Updated validation logic:

- Changed enum validation to check `!== undefined` instead of `.trim()` checks
- Simplified validation to skip undefined optional fields

### 2. Backend: `app/api/supplier/products/bulk-upload/route.ts`

#### Fixed Zod schema:

```typescript
ageGroup: z
  .enum([...])
  .optional(),  // Removed problematic .refine() call

stemDiscipline: z
  .enum([...])
  .optional()
  .default("GENERAL"),

productType: z
  .enum([...])
  .optional(),  // Removed problematic .refine() call
```

## How It Works Now

1. **CSV Upload**: Supplier uploads CSV with products
2. **Parsing**: Frontend parses CSV and normalizes data:
   - Empty enum fields → `undefined`
   - Long SKUs → trimmed to 50 chars
   - Valid enum values → uppercase normalized
3. **Validation**: Both frontend and backend validate:
   - Required fields: name, description, price, stockQuantity
   - Optional fields: enums can be `undefined` or valid values
   - SKU: max 50 characters
4. **AI Enhancement** (if enabled):
   - Request passes validation
   - Job created in database
   - Inngest event triggered: `products/supplier-bulk-upload.requested`
   - AI enhances products (fills in missing enums, descriptions, SEO, etc.)
   - Products saved with `PENDING_APPROVAL` status
5. **Direct Upload** (if AI disabled):
   - Products saved directly with `PENDING_APPROVAL` status
   - Empty enums saved as `NULL` (will use defaults)

## Testing Instructions

1. **Start Inngest Dev Server**:

   ```bash
   npx inngest-cli@latest dev
   ```

2. **Start Next.js Dev Server**:

   ```bash
   npm run dev
   ```

3. **Test Upload**:
   - Go to `/supplier/products/bulk-upload`
   - Upload a CSV with products (max 5)
   - Optional enum fields can be empty
   - SKUs can be long (will auto-trim)
   - Enable AI enhancement
   - Click "Enhance & Save Products"

4. **Monitor Progress**:
   - Check Inngest dev dashboard at `http://localhost:8288`
   - Should see event: `products/supplier-bulk-upload.requested`
   - Should see function: `supplier-bulk-upload-products` running
   - Check browser console for status updates

## Expected Results

- ✅ CSV parses successfully
- ✅ Validation passes (no 400 errors)
- ✅ Inngest job created and triggered
- ✅ AI enhancement runs (if enabled)
- ✅ Products saved with `PENDING_APPROVAL` status
- ✅ Success message shown to user

## CSV Template Format

Suppliers can now upload with optional enum fields:

| Field             | Required | Notes                           |
| ----------------- | -------- | ------------------------------- |
| name              | Yes      | Max 100 chars                   |
| description       | Yes      | 10-1000 chars                   |
| price             | Yes      | Must be > 0                     |
| stockQuantity     | Yes      | Must be >= 0                    |
| sku               | No       | Auto-trimmed to 50 chars        |
| ageGroup          | No       | Empty = undefined, AI will fill |
| stemDiscipline    | No       | Empty = "GENERAL" default       |
| productType       | No       | Empty = undefined, AI will fill |
| category          | No       | Will create if doesn't exist    |
| tags              | No       | Comma-separated                 |
| learningOutcomes  | No       | Comma-separated                 |
| specialCategories | No       | Comma-separated                 |
| images            | No       | Comma-separated URLs            |

## Files Changed

- ✅ `features/supplier/components/products/SupplierBulkUpload.tsx`
- ✅ `app/api/supplier/products/bulk-upload/route.ts`

## Status

**✅ FIXED** - All validation issues resolved. Suppliers can now upload products
with or without AI enhancement. Empty optional fields are properly handled.
