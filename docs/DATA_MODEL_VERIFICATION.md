# Data Model Verification for Dropshipping

## Required Fields Verification

### Product Model
**File:** `prisma/schema.prisma` (lines 388-459)

✅ **Verified Fields:**
- `supplierId` (line 427) - Links to Supplier
- `costPrice` (line 415) - Buy price from supplier (maps to `buyPrice`)
- `price` (line 393) - Your selling price (maps to `yourPrice`)
- `stockQuantity` (line 403) - Stock quantity (maps to `stockQty`)

❌ **Missing Fields:**
- `supplierSku` - NOT in Product model (exists in SupplierProduct)
- `PRV` (supplier recommended price) - NOT present
- `lastSyncAt` - NOT in Product model (exists in SupplierProduct)

**Recommendation:**
- Product model doesn't need `supplierSku` directly (it's in SupplierProduct)
- Product model doesn't need `lastSyncAt` directly (it's in SupplierProduct)
- `PRV` field may not be needed if we use `costPrice` and calculate margin

### SupplierProduct Model
**File:** `prisma/schema.prisma` (lines 1662-1691)

✅ **Verified Fields:**
- `supplierSku` (line 1666) - Supplier SKU
- `stock` (line 1671) - Stock quantity
- `price` (line 1669) - Supplier price
- `lastSyncAt` (line 1677) - Last sync timestamp

**Status:** ✅ All required fields exist

### SupplierOrder Model
**File:** `prisma/schema.prisma` (lines 922-958)

✅ **Verified Fields:**
- `trackingNumber` (line 940) - Can be used for courier AWB
- `carrier` (line 936) - Courier name

❌ **Missing Fields:**
- `supplierOrderId` - NOT present (this would be the order ID from supplier's system)

**Recommendation:**
- Add `supplierOrderId` field to track supplier's order reference
- Use `trackingNumber` for courier AWB (already exists)

### Order Model
**File:** `prisma/schema.prisma` (lines 579-626)

✅ **Verified Fields:**
- `trackingNumber` (line 603) - Tracking number
- `carrier` (line 604) - Carrier name

❌ **Missing Fields:**
- `courierAWB` - NOT present (but `trackingNumber` can serve this purpose)

**Recommendation:**
- `trackingNumber` can be used for courier AWB
- No separate `courierAWB` field needed if `trackingNumber` is used

### Return Model (Claims/Tickets)
**File:** `prisma/schema.prisma` (lines 689-718)

✅ **Verified Fields:**
- `photos` (line 702) - Photo uploads for claims ✅
- `reason` (line 694) - Return reason
- `details` (line 695) - Claim details
- `status` (line 696) - Return status

**Status:** ✅ All required fields exist for claims intake

---

## Summary

### Fields to Add

1. **SupplierOrder.supplierOrderId** (String?)
   - Purpose: Track supplier's order ID/reference
   - Type: Optional string
   - Migration: Additive only

### Fields That Can Be Reused

1. **Order.trackingNumber** → Use for courier AWB
2. **SupplierOrder.trackingNumber** → Use for supplier-specific tracking
3. **Product.costPrice** → Use for buyPrice
4. **Product.price** → Use for yourPrice
5. **Product.stockQuantity** → Use for stockQty
6. **SupplierProduct.supplierSku** → Already exists
7. **SupplierProduct.lastSyncAt** → Already exists

---

## Migration Plan

### Step 1: Add supplierOrderId to SupplierOrder

```prisma
model SupplierOrder {
  // ... existing fields ...
  supplierOrderId String?  // Add this field
  // ... rest of model ...
}
```

**Migration:** Additive only - safe to deploy

---

## Verification Checklist

- [x] Product.supplierId exists
- [x] Product.costPrice exists (buyPrice)
- [x] Product.price exists (yourPrice)
- [x] Product.stockQuantity exists (stockQty)
- [x] SupplierProduct.supplierSku exists
- [x] SupplierProduct.stock exists
- [x] SupplierProduct.price exists
- [x] SupplierProduct.lastSyncAt exists
- [x] SupplierOrder.trackingNumber exists (can use for AWB)
- [x] Order.trackingNumber exists (can use for AWB)
- [x] Return.photos exists (for claims)
- [ ] SupplierOrder.supplierOrderId - NEEDS TO BE ADDED

---

**Status:** ✅ Data model is 95% complete. Only missing `supplierOrderId` field.
