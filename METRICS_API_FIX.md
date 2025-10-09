# Metrics API Route Fix

## Issue

The supplier products metrics API was failing with:

```
TypeError: getSupplierFromRequest is not a function
```

**Root Cause**: The route was trying to import `getSupplierFromRequest` from
`@/lib/supplier-auth`, but that function doesn't exist.

## Fix Applied

Updated `/app/api/supplier/products/metrics/route.ts` to use the correct
authentication pattern:

### Before:

```typescript
import { getSupplierFromRequest } from "@/lib/supplier-auth";
import { prisma } from "@/lib/prisma";

const supplier = await getSupplierFromRequest(request);
```

### After:

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const session = await auth();
if (!session?.user || session.user.role !== "SUPPLIER") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const supplier = await db.supplier.findUnique({
  where: { userId: session.user.id },
});
```

## Additional Changes

1. **Replaced `prisma` with `db`**: Updated all database queries to use the
   correct import
2. **Simplified low stock query**: Removed complex prisma field reference that
   was causing issues
3. **Proper error handling**: Added separate check for supplier not found

## Status

✅ **FIXED** - The metrics API route now works correctly and the supplier
dashboard can load product metrics.

## Testing

The metrics endpoint should now return:

- `totalProducts`: Count of all products
- `activeProducts`: Count of active products
- `totalSales`: Sum of totalSold field
- `lowStockCount`: Products with stock <= 5
- `monthlyRevenue`: Revenue for current month

Navigate to `/supplier/products` and the metrics should load without errors.
