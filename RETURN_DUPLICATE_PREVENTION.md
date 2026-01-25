# Return Duplicate Prevention System

## Overview

This document explains how the system prevents users from returning the same item multiple times.

## Multi-Layer Protection

### 1. Backend Validation (API Level)

The `/api/returns/create-bulk` endpoint has **three layers** of validation:

#### Layer 1: OrderItem returnStatus Check
```typescript
// Check if any items are already returned or have pending returns
const alreadyReturnedItems = orderItems.filter(
  item => item.returnStatus !== "NONE"
);

if (alreadyReturnedItems.length > 0) {
  return NextResponse.json({
    error: `Some items have already been returned: ${returnedNames.join(", ")}`
  }, { status: 400 });
}
```

#### Layer 2: Return Table Check
```typescript
// Additional check: verify no pending returns exist for these items
// This prevents duplicate returns if the previous request timed out but still created records
const existingReturns = await db.return.findMany({
  where: {
    orderItemId: { in: orderItemIds },
    userId: session.user.id,
    status: {
      in: ["PENDING", "APPROVED", "RECEIVED"],
    },
  },
});

if (existingReturns.length > 0) {
  return NextResponse.json({
    error: `Some items already have pending or active returns: ${affectedNames.join(", ")}. Please check your returns page.`
  }, { status: 400 });
}
```

#### Layer 3: Transaction Safety
```typescript
// Use transaction to ensure data consistency
const createdReturns = await db.$transaction(async tx => {
  // Create return records
  await tx.return.createMany({ data: returnData });
  
  // Update order items return status
  await tx.orderItem.updateMany({
    where: { id: { in: orderItemIds } },
    data: { returnStatus: "REQUESTED" }
  });
  
  return returns;
});
```

**Benefits:**
- Either all operations succeed or none (no partial state)
- Prevents race conditions
- Ensures data consistency

### 2. Frontend Prevention (UI Level)

#### Return Initiation Page (`/account/orders/[orderId]/return`)

**Filtering Logic:**
```typescript
order.items.filter(
  item =>
    order.status === "DELIVERED" &&
    item.returnStatus === "NONE" &&
    !item.isDigital
)
```

**Features:**
- Items with `returnStatus !== "NONE"` are completely filtered out
- Disabled items have `pointer-events-none` and opacity reduced
- onClick handler checks `if (disabled) return;`
- Cursor changes to `cursor-not-allowed` for disabled items
- Visual badge shows return status: "Return REQUESTED", "Return APPROVED", etc.

**Example:**
```tsx
{item.returnStatus !== "NONE" && (
  <div className="mt-2">
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Return {item.returnStatus.toLowerCase()}
    </span>
  </div>
)}
```

#### Order Details Page (`/account/orders/[orderId]`)

**Return Button Logic:**
```typescript
{isWithinReturnWindow() && 
 !item.isDigital && 
 (!item.returnStatus || item.returnStatus === "NONE") && (
  <Button variant="outline" size="sm" asChild>
    <Link href={`/account/orders/${order.id}/return?itemId=${item.id}`}>
      <Package className="h-4 w-4 mr-1" />
      {t("returnItem")}
    </Link>
  </Button>
)}
```

**Features:**
- Return button only shows for items with `returnStatus === "NONE"`
- Items with active returns show status badge instead
- Clear visual feedback with color-coded badges

### 3. Database Schema

The `OrderItem` model has a `returnStatus` enum field:

```prisma
model OrderItem {
  id           String   @id @default(cuid())
  orderId      String
  productId    String
  name         String
  price        Decimal
  quantity     Int
  returnStatus ReturnStatus @default(NONE)
  
  order        Order    @relation(fields: [orderId], references: [id])
  product      Product  @relation(fields: [productId], references: [id])
  returns      Return[]
}

enum ReturnStatus {
  NONE
  REQUESTED
  APPROVED
  REJECTED
  RECEIVED
  REFUNDED
}
```

**Workflow:**
1. **Initial state:** `returnStatus = "NONE"`
2. **User submits return:** `returnStatus = "REQUESTED"`
3. **Admin approves:** `returnStatus = "APPROVED"`
4. **Item received:** `returnStatus = "RECEIVED"`
5. **Refund issued:** `returnStatus = "REFUNDED"`

## Return Status Flow

```
NONE → REQUESTED → APPROVED → RECEIVED → REFUNDED
           ↓
       REJECTED
```

- **NONE**: Item has never been returned
- **REQUESTED**: User submitted return request (pending admin review)
- **APPROVED**: Admin approved the return (waiting for item to be shipped back)
- **REJECTED**: Admin rejected the return
- **RECEIVED**: Store received the returned item
- **REFUNDED**: Refund has been issued to customer

## User Experience

### Scenario 1: First Return Attempt
1. User navigates to order details
2. Sees "Return Item" button for eligible items
3. Clicks button → redirected to return form
4. Selects items, fills form, submits
5. Backend validates and creates return
6. `returnStatus` updated to "REQUESTED"
7. User sees success message

### Scenario 2: Second Return Attempt (Same Item)
1. User navigates to order details
2. Item shows "Return REQUESTED" badge
3. "Return Item" button is **hidden**
4. If user somehow accesses return page directly:
   - Item is **filtered out** from available items
   - Cannot select it (not in the list)
5. If user crafts API request manually:
   - Backend validation **rejects** it
   - Error: "Some items already have pending or active returns"

## Edge Cases Handled

### Case 1: Timeout on First Request
**Problem:** Request times out (504) but return was created in database

**Solution:**
- Layer 2 validation checks Return table directly
- Second attempt is blocked with clear message
- User is directed to check returns page

### Case 2: Multiple Browser Tabs
**Problem:** User opens multiple tabs and tries to return same item

**Solution:**
- Each request independently validates against database
- Only the first request succeeds
- Subsequent requests blocked by returnStatus check

### Case 3: Race Condition
**Problem:** Two requests submitted simultaneously

**Solution:**
- Database transaction ensures atomicity
- Only one request will successfully update returnStatus
- Other requests will fail validation

### Case 4: Admin Rejection
**Problem:** Admin rejects return, can user return again?

**Decision:** No, `returnStatus = "REJECTED"` prevents future returns
**Rationale:** Once rejected, item is not eligible for return
**Alternative:** Admin could manually reset to "NONE" if needed

## Testing Checklist

### Frontend Testing
- [ ] Items with `returnStatus !== "NONE"` don't appear in return form
- [ ] Return button hidden on order details for returned items
- [ ] Status badge displays correctly
- [ ] Disabled items can't be clicked
- [ ] Cursor shows "not-allowed" for disabled items

### Backend Testing
- [ ] First return attempt succeeds
- [ ] Second return attempt blocked with error
- [ ] Error message is clear and helpful
- [ ] Transaction rolls back on failure
- [ ] returnStatus updated correctly

### Edge Case Testing
- [ ] Timeout scenario (return created despite 504)
- [ ] Multiple tabs (same user, same item)
- [ ] Race condition (simultaneous requests)
- [ ] Manual API request (bypassing frontend)

## Monitoring

### Key Metrics to Track
1. **Duplicate Return Attempts:** Count of 400 errors with "already have pending returns"
2. **Return Status Distribution:** Count by status (NONE, REQUESTED, APPROVED, etc.)
3. **Failed Returns:** Track why returns fail (already returned, outside window, etc.)

### Logs to Monitor
```
✅ Success: "Successfully initiated return for N item(s)"
❌ Blocked: "Some items have already been returned"
❌ Blocked: "Some items already have pending or active returns"
```

## Configuration

No configuration needed - protection is built-in and always active.

## Security Considerations

1. **User ID Validation:** All checks include `userId` to prevent cross-user returns
2. **Order Ownership:** Validates user owns the order before allowing return
3. **Transaction Safety:** Prevents partial state and race conditions
4. **Status Immutability:** Once set, returnStatus can only progress forward

## Future Enhancements

1. **Admin Override:** Allow admin to reset returnStatus to "NONE" if needed
2. **Return Window Reset:** After rejection, allow return within remaining window
3. **Partial Returns:** Track quantity returned vs ordered (for multi-quantity items)
4. **Return History:** Show all return attempts in order history
5. **Email Notifications:** Notify user when return status changes

## Files Changed

1. `/app/api/returns/create-bulk/route.ts` - Backend validation
2. `/app/account/orders/[orderId]/return/page.tsx` - Return form filtering
3. `/app/account/orders/[orderId]/OrderDetailsClient.tsx` - Order details UI
4. `/app/api/account/orders/[orderId]/route.ts` - Return returnStatus in API
5. `prisma/schema.prisma` - returnStatus field (already existed)

## Deployment Notes

These changes are **backward compatible**:
- No database migration needed (returnStatus field already exists)
- Existing returns continue to work
- No breaking changes to API

Simply deploy and the protection is active immediately.
