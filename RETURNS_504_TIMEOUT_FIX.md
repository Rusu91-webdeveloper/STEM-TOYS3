# Returns 504 Gateway Timeout Fix

## Problem Summary

When users tried to return items from `/account/orders/[orderId]/return`, the API endpoint `/api/returns/create-bulk` was hitting a **504 Gateway Timeout** error after 30 seconds.

### Symptoms
- Request URL: `POST https://www.techtots.ro/api/returns/create-bulk`
- Status Code: `504 Gateway Timeout`
- Vercel Error: `FUNCTION_INVOCATION_TIMEOUT`
- Console Error: `SyntaxError: Unexpected token 'A', "An error o"... is not valid JSON`
- On retry: "Error Some items have already been returned"
- Returns were being created in database despite timeout

## Root Causes

1. **30-second timeout limit** - Vercel default timeout for API routes was 30 seconds
2. **Blocking email operations** - The endpoint was waiting for 2 emails to be sent synchronously (admin notification + customer confirmation)
3. **No duplicate prevention** - Previous timeout requests created database records, causing "already returned" errors on retry
4. **No transaction safety** - Database operations weren't atomic

## Solutions Implemented

### 1. Increased Timeout Limit (vercel.json)
```json
"functions": {
  "app/api/returns/create-bulk/route.ts": {
    "maxDuration": 60
  }
}
```
- Doubled the timeout from 30 to 60 seconds for this specific endpoint
- Provides more time for database operations and email sending

### 2. Async Email Sending (route.ts)
- Changed email sending from **blocking** to **fire-and-forget**
- API response returns immediately after database operations complete
- Emails send asynchronously in the background
- If emails fail, the return request is still successful

**Before:**
```typescript
// Blocked the response until emails sent
await sendBulkReturnNotificationEmail(...);
await sendBulkReturnConfirmationEmail(...);
return NextResponse.json({ success: true });
```

**After:**
```typescript
// Fire and forget - don't wait for emails
const sendEmailsAsync = async () => {
  await sendBulkReturnNotificationEmail(...);
  await sendBulkReturnConfirmationEmail(...);
};
sendEmailsAsync().catch(err => console.error(...));

// Return immediately
return NextResponse.json({ success: true });
```

### 3. Duplicate Return Prevention
Added validation to check for existing returns before creating new ones:

```typescript
const existingReturns = await db.return.findMany({
  where: {
    orderItemId: { in: orderItemIds },
    userId: session.user.id,
    status: { in: ["PENDING", "APPROVED", "RECEIVED"] }
  }
});

if (existingReturns.length > 0) {
  return NextResponse.json({
    error: `Some items already have pending or active returns...`
  }, { status: 400 });
}
```

This prevents:
- Duplicate returns from retry attempts
- Users from creating multiple returns for the same item
- Database inconsistencies

### 4. Transaction Safety
Wrapped database operations in a transaction to ensure atomicity:

```typescript
const createdReturns = await db.$transaction(async tx => {
  // Create return records
  await tx.return.createMany({ data: returnData });
  
  // Update order items return status
  await tx.orderItem.updateMany({
    where: { id: { in: orderItemIds } },
    data: { returnStatus: "REQUESTED" }
  });
  
  // Get created returns
  const returns = await tx.return.findMany(...);
  return returns;
});
```

Benefits:
- Either all operations succeed or none (no partial state)
- Prevents orphaned records
- Ensures data consistency

## Expected Behavior After Fix

1. **Fast response** - API responds within 5-10 seconds (no waiting for emails)
2. **No timeouts** - 60-second limit provides plenty of buffer
3. **No duplicates** - Validation prevents duplicate returns on retry
4. **Reliable emails** - Emails send in background without affecting user experience
5. **Data consistency** - Transaction ensures all-or-nothing database changes

## Testing Checklist

- [ ] Return request completes successfully (no 504 error)
- [ ] Returns appear in database (Return table)
- [ ] OrderItem returnStatus updated to "REQUESTED"
- [ ] Admin notification email received
- [ ] Customer confirmation email received
- [ ] Retry attempt shows proper "already returned" error
- [ ] No duplicate returns created in database

## Deployment Notes

**Before deploying:**
1. Commit changes to git
2. Push to GitHub
3. Vercel will auto-deploy

**After deploying:**
1. Test return flow on production
2. Monitor Vercel logs for any errors
3. Check email delivery (both admin and customer)
4. Verify database records are created correctly

## Files Changed

1. `/vercel.json` - Added 60-second timeout for create-bulk endpoint
2. `/app/api/returns/create-bulk/route.ts` - Async emails, duplicate prevention, transactions

## Monitoring

After deployment, monitor:
- Vercel function logs for the `/api/returns/create-bulk` endpoint
- Email delivery success rate (check Brevo dashboard)
- Database consistency (no orphaned returns)
- User feedback (ensure returns work smoothly)

## Rollback Plan

If issues occur after deployment:
1. Revert changes in git: `git revert HEAD`
2. Push to GitHub
3. Vercel will auto-deploy previous version
4. Investigate logs and debug locally

## Additional Improvements (Future)

1. **Queue-based email system** - Use Inngest or Redis queue for guaranteed email delivery
2. **Better error messages** - More specific error handling for different failure scenarios
3. **Retry logic** - Automatic retry for failed email sends
4. **Progress indicators** - Show email status to admin ("Email pending", "Email sent", etc.)
5. **Timeout monitoring** - Alert when endpoints approach timeout limits
