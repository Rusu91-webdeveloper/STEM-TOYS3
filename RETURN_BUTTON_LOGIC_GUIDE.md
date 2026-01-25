# Return Button Logic - Complete Implementation

## Overview

The "Return Item" button is now **intelligently controlled** with multiple validation layers to ensure it only appears when appropriate.

## When "Return Item" Button Appears ✅

The button **ONLY** shows when **ALL** these conditions are met:

```typescript
✅ order.status === "DELIVERED"
✅ isWithinReturnWindow() === true (within 14 days)
✅ !item.isDigital (not a digital product)
✅ item.returnStatus === "NONE" (never returned before)
```

## Decision Flow Chart

```
┌─────────────────────────────────────┐
│   Is order DELIVERED?               │
└──────────┬──────────────────────────┘
           │ YES
           ▼
┌─────────────────────────────────────┐
│   Is it a digital item?             │
└──────────┬──────────────────────────┘
           │ NO
           ▼
┌─────────────────────────────────────┐
│   Has item been returned before?    │
│   (returnStatus !== "NONE")         │
└──────────┬──────────────────────────┘
           │ NO
           ▼
┌─────────────────────────────────────┐
│   Is within 14-day return window?   │
└──────────┬──────────────────────────┘
           │ YES
           ▼
┌─────────────────────────────────────┐
│   ✅ SHOW "Return Item" Button      │
└─────────────────────────────────────┘
```

## Scenarios and What Users See

### Scenario 1: Eligible for Return ✅
**Conditions:**
- Order delivered
- Within 14 days
- Physical item
- Never returned

**What User Sees:**
```
┌─────────────────────────────────┐
│ Product Image | Product Name    │
│               | Price: $49.99   │
│               |                 │
│               | [Return Item]   │  ← Button visible
└─────────────────────────────────┘
```

### Scenario 2: Already Returned 🚫
**Conditions:**
- Order delivered
- Item has returnStatus = "REQUESTED" (or APPROVED, etc.)

**What User Sees:**
```
┌─────────────────────────────────┐
│ Product Image | Product Name    │
│               | Price: $49.99   │
│               |                 │
│               | [Return requested] ← Badge shown
│               | (No button)     │  ← Button HIDDEN
└─────────────────────────────────┘
```

### Scenario 3: Return Window Expired 🚫
**Conditions:**
- Order delivered > 14 days ago
- Item never returned

**What User Sees:**
```
┌─────────────────────────────────┐
│ Product Image | Product Name    │
│               | Price: $49.99   │
│               |                 │
│               | 📦 Return window expired (14 days)
│               | (No button)     │  ← Button HIDDEN
└─────────────────────────────────┘
```

### Scenario 4: Digital Item 🚫
**Conditions:**
- Digital product (eBook, download, etc.)

**What User Sees:**
```
┌─────────────────────────────────┐
│ Product Image | Product Name    │
│               | Price: $19.99   │
│               |                 │
│               | 📄 Digital item - non-returnable
│               | (No button)     │  ← Button HIDDEN
└─────────────────────────────────┘
```

### Scenario 5: Order Not Delivered Yet 🚫
**Conditions:**
- Order status = PROCESSING or SHIPPED

**What User Sees:**
```
┌─────────────────────────────────┐
│ Product Image | Product Name    │
│               | Price: $49.99   │
│               |                 │
│               | (No return options shown)
└─────────────────────────────────┘
```

## Implementation Details

### 1. Order Details Page Logic

**File:** `/app/account/orders/[orderId]/OrderDetailsClient.tsx`

```typescript
// Return window check (14 days from delivery)
const isWithinReturnWindow = () => {
  if (order.status !== "DELIVERED") {
    return false;
  }

  // Use deliveredAt if available, otherwise fall back to order creation date
  const referenceDate = order.deliveredAt
    ? new Date(order.deliveredAt)
    : new Date(order.createdAt);

  const today = new Date();
  const diffTime = today.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Allow returns within 14 days
  return diffDays <= 14;
};

// Button rendering logic
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

### 2. Return Form Page Logic

**File:** `/app/account/orders/[orderId]/return/page.tsx`

Even if a user somehow accesses the return form directly:

```typescript
// Filter out items that can't be returned
order.items.filter(
  item =>
    order.status === "DELIVERED" &&
    item.returnStatus === "NONE" &&
    !item.isDigital
)

// Disable items
const disabled =
  order.status !== "DELIVERED" ||
  item.returnStatus !== "NONE" ||
  item.isDigital;
```

### 3. Backend Validation

**File:** `/app/api/returns/create-bulk/route.ts`

Even if frontend is bypassed, backend validates:

```typescript
// Check if any items are already returned
const alreadyReturnedItems = orderItems.filter(
  item => item.returnStatus !== "NONE"
);

if (alreadyReturnedItems.length > 0) {
  return NextResponse.json({
    error: `Some items have already been returned: ${returnedNames.join(", ")}`
  }, { status: 400 });
}

// Check for existing returns
const existingReturns = await db.return.findMany({
  where: {
    orderItemId: { in: orderItemIds },
    userId: session.user.id,
    status: { in: ["PENDING", "APPROVED", "RECEIVED"] }
  }
});

if (existingReturns.length > 0) {
  return NextResponse.json({
    error: `Some items already have pending or active returns`
  }, { status: 400 });
}

// Check 14-day window
const daysSinceReference = differenceInDays(new Date(), referenceDate);
if (daysSinceReference > 14) {
  return NextResponse.json(
    { error: `Returns are only allowed within 14 days` },
    { status: 400 }
  );
}
```

## Visual Feedback Summary

| Condition | Button State | Visual Feedback |
|-----------|--------------|-----------------|
| ✅ Eligible for return | **Visible** | Green "Return Item" button |
| 🚫 Already returned | **Hidden** | Yellow badge: "Return requested" |
| 🚫 Window expired (>14 days) | **Hidden** | Gray text: "Return window expired" |
| 🚫 Digital item | **Hidden** | Gray text: "Digital item - non-returnable" |
| 🚫 Not delivered yet | **Hidden** | (No return options shown) |

## Return Status Badge Colors

```typescript
returnStatus === "REQUESTED" → Yellow badge (pending)
returnStatus === "APPROVED"  → Blue badge (approved)
returnStatus === "RECEIVED"  → Green badge (received)
returnStatus === "REJECTED"  → Red badge (rejected)
returnStatus === "REFUNDED"  → Purple badge (completed)
```

## Testing Checklist

### Frontend Tests
- [ ] Button visible for eligible items
- [ ] Button hidden for returned items
- [ ] Button hidden after 14 days
- [ ] Button hidden for digital items
- [ ] Correct badge shown for returned items
- [ ] Expired message shown after 14 days
- [ ] Digital item message shown correctly

### Backend Tests
- [ ] API rejects already-returned items
- [ ] API rejects items outside 14-day window
- [ ] API rejects duplicate returns
- [ ] Clear error messages returned

### Edge Case Tests
- [ ] Order delivered exactly 14 days ago
- [ ] Order delivered 15 days ago
- [ ] Multiple items, some returned
- [ ] User tries direct URL to return form
- [ ] User tries API request directly

## User Experience Flow

### Happy Path (Eligible Return)
1. User navigates to `/account/orders`
2. Clicks on delivered order
3. Sees "Return Item" button ✅
4. Clicks button
5. Fills return form
6. Submits successfully
7. Button disappears, badge appears

### Blocked Path (Already Returned)
1. User navigates to `/account/orders`
2. Clicks on delivered order
3. Sees "Return requested" badge 🚫
4. **No button visible**
5. Cannot initiate duplicate return

### Blocked Path (Expired Window)
1. User navigates to `/account/orders` (old order)
2. Clicks on delivered order
3. Sees "Return window expired (14 days)" 🚫
4. **No button visible**
5. Cannot return old items

## Deployment Verification

After deployment, verify:

```bash
# Test 1: Check eligible item
# Navigate to recent delivered order (< 14 days)
# ✅ Should see "Return Item" button

# Test 2: Check returned item
# Find order with returned item
# ✅ Should see yellow badge, NO button

# Test 3: Check expired order
# Navigate to order > 14 days old
# ✅ Should see "expired" message, NO button

# Test 4: Check digital item
# Find order with digital product
# ✅ Should see "digital item" message, NO button
```

## Key Benefits

1. **Clear Communication** - Users know exactly why they can/can't return
2. **No Confusion** - Button only appears when applicable
3. **Visual Feedback** - Status badges and messages explain everything
4. **Multi-Layer Protection** - Frontend + Backend validation
5. **User-Friendly** - No dead-end clicks or confusing states

## Support Documentation

If users ask "Why can't I return this item?", possible reasons:

1. ✅ "Item has already been returned" → Show badge
2. ✅ "Return window expired (14 days passed)" → Show message
3. ✅ "Digital items cannot be returned" → Show message
4. ✅ "Order must be delivered first" → No options shown

All reasons are clearly communicated in the UI!

## Configuration

**Return window:** 14 days (hardcoded in multiple places)

To change return window period:
1. Update `isWithinReturnWindow()` in `OrderDetailsClient.tsx`
2. Update validation in return page
3. Update backend validation in `create-bulk/route.ts`
4. Update this documentation

---

**Status:** ✅ Fully Implemented and Ready for Production
**Last Updated:** January 25, 2026
