# Supplier Bulk Upload - Step-by-Step Testing Guide

## What Was Fixed

✅ **Frontend normalization**: Added normalization step right before sending to
API  
✅ **Backend validation**: Fixed Zod schema to properly accept optional enums  
✅ **SKU trimming**: Auto-trim SKUs to 50 characters max  
✅ **Empty enum handling**: Convert empty strings to `undefined`

## Step-by-Step Testing Instructions

### Step 1: Stop and Restart Your Dev Server

**Important**: The frontend code has changed, so you need to reload it.

```bash
# Stop your Next.js server (Ctrl+C if running)
# Then restart it:
npm run dev
```

### Step 2: Start Inngest Dev Server

In a separate terminal:

```bash
npx inngest-cli@latest dev
```

You should see:

```
✓ Inngest dev server running at http://localhost:8288
```

### Step 3: Clear Browser Cache

**Very Important**: Your browser may have cached the old JavaScript.

**Option A - Hard Refresh**:

- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

**Option B - Clear Cache**:

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 4: Reload the CSV File

Even if you already have a CSV loaded, reload it to ensure it's parsed with the
new code:

1. Go to: `http://localhost:3000/supplier/products/bulk-upload`
2. Click "Choose File"
3. Select your CSV again
4. Wait for "File parsed successfully" message

### Step 5: Verify Parsed Data

Check the browser console (F12) to see what data is being prepared:

1. Open DevTools → Console tab
2. The parsed products should be visible
3. Look for empty enum fields - they should show as empty strings in the UI
   (that's OK, we normalize them before sending)

### Step 6: Enable AI Enhancement

1. Toggle "AI Enhancement" to ON
2. Verify the enhancement options are checked:
   - ✅ Romanian Optimization
   - ✅ SEO Metadata
   - ✅ Learning Outcomes
   - ✅ Age Group Classification
   - ✅ STEM Discipline
   - ✅ Product Type

### Step 7: Click "Enhance & Save Products"

1. Click the "Enhance & Save Products" button
2. Watch the browser console for the API call

**Expected Console Output**:

```
POST http://localhost:3000/api/supplier/products/bulk-upload
Status: 200 OK
```

**If you see 400 Bad Request**:

- Check the Response tab in Network panel
- Copy the full error and share it
- Check that you did Step 3 (clear browser cache)

### Step 8: Monitor Inngest

1. Go to: `http://localhost:8288`
2. You should see:
   - **Event**: `products/supplier-bulk-upload.requested`
   - **Function**: `supplier-bulk-upload-products`
   - **Status**: Running → Completed

### Step 9: Check Progress in UI

The UI should show:

1. Progress bar
2. "Enhancing & Saving..." message
3. Estimated time remaining
4. After 30-60 seconds: "Success!" message

### Step 10: Verify Products in Database

1. Go to: `http://localhost:3000/supplier/products`
2. You should see your products with status "Pending Approval"
3. Check that AI-enhanced fields are filled:
   - Age Group
   - STEM Discipline
   - Product Type
   - Enhanced descriptions

## Sample CSV Format

Here's a minimal CSV that should work:

```csv
name,description,price,stockQuantity,sku,ageGroup,stemDiscipline,productType
Robot Kit Alpha,Educational robot for learning programming,49.99,100,ROBOT-KIT-001,,,
Science Lab Pro,Chemistry experiment kit for kids,39.99,50,SCI-LAB-PRO-2024-LONG-SKU-THAT-EXCEEDS-FIFTY,ELEMENTARY_6_8,SCIENCE,EXPERIMENT_KITS
Puzzle Master,3D wooden puzzle for spatial reasoning,19.99,200,PUZZLE-001,,,
```

**Notes**:

- Empty `ageGroup`, `stemDiscipline`, `productType` are OK (AI will fill them)
- Long SKUs will be auto-trimmed to 50 chars
- `stemDiscipline` defaults to "GENERAL" if not provided

## Troubleshooting

### Issue: Still Getting 400 Bad Request

**Solution**:

1. Clear browser cache (Step 3)
2. Restart dev server (Step 1)
3. Reload the CSV file (Step 4)
4. Check browser console for the actual request payload
5. Share the full error details

### Issue: Inngest Not Triggering

**Solution**:

1. Check that Inngest dev server is running (`http://localhost:8288`)
2. Verify in API logs that job was created
3. Check browser console for jobId in response

### Issue: Validation Errors in Browser

**Solution**:

- Fix required fields: name, description, price, stockQuantity
- SKU: Will auto-trim, no action needed
- Enums: Can be empty, no action needed

## Debug Commands

If you need to debug, add this to the browser console before clicking upload:

```javascript
// Log what's being sent
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log("FETCH REQUEST:", args[0], JSON.parse(args[1].body));
  return originalFetch.apply(this, args);
};
```

This will show you exactly what data is being sent to the API.

## Expected Results

✅ **Status 200**: API accepts the request  
✅ **Job ID returned**: e.g., `{ jobId: "cm3...", status: "PENDING" }`  
✅ **Inngest triggered**: Event visible at `http://localhost:8288`  
✅ **Products saved**: Visible at `/supplier/products` with "Pending Approval"
status  
✅ **AI enhancement**: Fields auto-filled (age group, STEM, product type, etc.)

## Next Steps After Success

Once working:

1. Test with different CSV formats
2. Test with all enum fields empty
3. Test with all enum fields filled
4. Test with mixed (some empty, some filled)
5. Test with maximum 5 products
6. Test with long SKUs (>50 chars)

---

**If you're still getting errors after following all steps, please share**:

1. The full error message from browser console
2. The Network tab request/response
3. What step you're on
