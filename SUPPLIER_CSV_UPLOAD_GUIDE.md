# Supplier CSV Upload - Quick Reference Guide

## What Suppliers See on `/supplier/products/bulk-upload`

### 1. Page Header

```
Bulk Upload Products
Upload maximum 5 products at once using CSV format
```

---

### 2. Important Warning (Orange Banner)

⚠️ **Important:** Maximum 5 products per upload. Files with more than 5 products
will be rejected.

---

### 3. Required CSV Format Table

#### All 7 Columns Are Required

| Column Name       | Description                                 | Example Value                                      |
| ----------------- | ------------------------------------------- | -------------------------------------------------- |
| **name**          | Product name (1-100 characters)             | LEGO Mindstorms Robot Inventor                     |
| **price**         | Product price in RON (positive number)      | 359.99                                             |
| **category**      | Product category name                       | Robotics                                           |
| **images**        | Image URL (must start with http/https)      | https://example.com/image.jpg                      |
| **description**   | Product description (minimum 10 characters) | Build and program robots with this advanced kit... |
| **stockQuantity** | Available stock (non-negative integer)      | 25                                                 |
| **sku**           | Stock keeping unit / Product code           | LEGO-51515                                         |

---

### 4. Example CSV Format

```csv
name,price,category,images,description,stockQuantity,sku
"LEGO Mindstorms",359.99,"Robotics","https://example.com/img.jpg","Build robots...",25,"LEGO-001"
```

---

### 5. Common Mistakes to Avoid

• Missing required columns - all 7 columns must be present  
• More than 5 products in CSV file  
• Empty values in required fields  
• Invalid image URLs (not starting with http/https)  
• Negative price or stock quantity  
• Description less than 10 characters

---

### 6. Download Template Button

[Download Template (5 Sample Products)]

---

### 7. Upload Area

```
┌─────────────────────────────────────┐
│     📄 Upload your product file     │
│                                     │
│  Supported formats: CSV, Excel      │
│     (.csv, .xls, .xlsx)             │
│                                     │
│      [Choose File] button           │
└─────────────────────────────────────┘
```

---

### 8. After File Selected

Shows:

- File name
- Number of products found
- Validation errors (if any)
- Product preview table
- [Upload Products] button
- [Show/Hide Preview] button

---

### 9. Success Message

✅ **Upload successful**  
Successfully uploaded 5 products. Products are pending admin approval and will
be reviewed shortly.

---

## Step-by-Step Process

### Step 1: Download Template

Click "Download Template (5 Sample Products)" to get an Excel file with:

- Sample products showing the format
- Field descriptions on a second sheet

### Step 2: Fill In Your Products

- Open the template in Excel or Google Sheets
- Replace sample data with your products
- Maximum 5 products
- Ensure all 7 columns are filled

### Step 3: Save As CSV or Excel

- Save as .csv, .xls, or .xlsx
- Keep the column order the same
- Don't add extra columns

### Step 4: Upload File

- Click "Choose File" on the upload page
- Select your file
- System validates immediately

### Step 5: Review Validation

- Check for any validation errors
- Fix errors in your file if needed
- Re-upload corrected file

### Step 6: Preview Products

- Click "Show Preview" to see your products
- Verify data looks correct
- Check prices, names, stock quantities

### Step 7: Submit

- Click "Upload Products" button
- Wait for confirmation message
- Products submitted for admin review

### Step 8: Wait for Approval

- Admin reviews your products
- Admin may enhance with AI
- Admin approves products
- Products go live on website

---

## CSV Template Content

Your template download includes these 5 sample products:

1. **LEGO Mindstorms Robot Inventor**
   - Price: 359.99 RON
   - Category: Robotics
   - Stock: 25 units
   - SKU: LEGO-51515

2. **Arduino Starter Kit**
   - Price: 89.99 RON
   - Category: Electronics
   - Stock: 50 units
   - SKU: ARD-START-001

3. **Snap Circuits Jr. SC-100**
   - Price: 24.99 RON
   - Category: Electronics
   - Stock: 75 units
   - SKU: SNAP-SC100

4. **Thames & Kosmos Chemistry Set**
   - Price: 129.99 RON
   - Category: Science Kits
   - Stock: 30 units
   - SKU: TK-CHEM-125

5. **K'NEX Education Set**
   - Price: 199.99 RON
   - Category: Construction Sets
   - Stock: 40 units
   - SKU: KNEX-EDU-500

---

## Field Requirements in Detail

### name

- **Required:** Yes
- **Min length:** 1 character
- **Max length:** 100 characters
- **Example:** "LEGO Mindstorms Robot Inventor"
- **Note:** Must not be empty, will be used to generate product URL

### price

- **Required:** Yes
- **Type:** Decimal number
- **Min value:** 0.01 RON
- **Max value:** 999,999.99 RON
- **Format:** Use decimal point, not comma (e.g., 359.99 not 359,99)
- **Example:** 359.99

### category

- **Required:** Yes
- **Type:** Text
- **Max length:** 100 characters
- **Example:** "Robotics", "Science Kits", "Electronics"
- **Note:** If category doesn't exist, it will be created

### images

- **Required:** Yes
- **Type:** URL
- **Format:** Must start with http:// or https://
- **Example:** "https://images.unsplash.com/photo-123.jpg"
- **Note:** Use image hosting service or direct product image URL

### description

- **Required:** Yes
- **Min length:** 10 characters
- **Max length:** 1000 characters
- **Example:** "Build and program robots with this advanced LEGO robotics kit
  featuring sensors, motors and programmable hub"
- **Note:** Be descriptive, admin may enhance with AI

### stockQuantity

- **Required:** Yes
- **Type:** Whole number (integer)
- **Min value:** 0
- **Max value:** 999,999
- **Example:** 25
- **Note:** Cannot be negative

### sku

- **Required:** Yes
- **Type:** Text
- **Max length:** 50 characters
- **Example:** "LEGO-51515"
- **Note:** Must be unique across all products, use your internal product code

---

## Validation Rules

### File Level

✓ Must be CSV, XLS, or XLSX format  
✓ Maximum 5 products per file  
✓ All 7 columns must be present

### Product Level

✓ All required fields must have values  
✓ Price must be positive number  
✓ Stock quantity must be non-negative  
✓ Image URL must be valid (http/https)  
✓ Description must be at least 10 characters  
✓ SKU must be unique (not already in system)  
✓ Product name must be unique in your catalog

---

## What Happens After Upload?

1. **Validation**
   - System checks all fields
   - Shows errors if any problems found
   - You can fix and re-upload

2. **Submission**
   - Products saved with "Pending Approval" status
   - You receive confirmation message
   - Products not yet visible on website

3. **Admin Review**
   - Admin sees your products in admin dashboard
   - Admin may enhance descriptions with AI
   - Admin may improve SEO metadata
   - Admin reviews product quality

4. **Approval**
   - Admin approves products
   - Products automatically go live
   - Products appear on website for customers

5. **You Can See Status**
   - Go to `/supplier/products`
   - See all your products
   - Filter by status: Pending, Approved, Rejected

---

## Tips for Success

### Product Names

✓ Use clear, descriptive names  
✓ Include brand name if applicable  
✓ Include key features or model numbers  
✗ Don't use ALL CAPS  
✗ Don't use special characters excessively

### Descriptions

✓ Describe what the product does  
✓ Mention key features and benefits  
✓ Include age recommendations if relevant  
✓ At least 10 characters, ideally 50-200  
✗ Don't copy-paste from other websites

### Pricing

✓ Use decimal point (359.99 not 359,99)  
✓ Price in RON (Romanian Lei)  
✓ Check your prices are competitive  
✗ Don't use currency symbols (€, $, RON)

### Images

✓ Use high-quality product images  
✓ Use images you have rights to  
✓ Image should show the actual product  
✓ Use stable image hosting (not temporary links)  
✗ Don't use images with watermarks

### Stock Quantity

✓ Be accurate with stock levels  
✓ Update regularly to avoid overselling  
✓ Set reorder point if you track inventory

### SKU (Product Code)

✓ Use your internal product code  
✓ Keep it consistent with your system  
✓ Make it easy to identify product  
✗ Don't use duplicate SKUs

---

## Troubleshooting

### Error: "Too many products"

**Problem:** File contains more than 5 products  
**Solution:** Split into multiple files, upload separately (max 5 per file)

### Error: "Invalid file type"

**Problem:** File is not CSV, XLS, or XLSX  
**Solution:** Save as .csv or .xlsx format from Excel/Google Sheets

### Error: "Product name is required"

**Problem:** Name column is empty  
**Solution:** Fill in product name for all rows

### Error: "Price must be greater than 0"

**Problem:** Price is 0, negative, or not a number  
**Solution:** Enter valid price (e.g., 99.99)

### Error: "Invalid image URL"

**Problem:** Image URL doesn't start with http/https  
**Solution:** Use complete URL: https://example.com/image.jpg

### Error: "Description too short"

**Problem:** Description is less than 10 characters  
**Solution:** Write longer, more descriptive text

### Error: "SKU already exists"

**Problem:** Another product already uses this SKU  
**Solution:** Use different, unique SKU code

---

## Support

If you encounter issues:

1. Check this guide for common problems
2. Verify your CSV matches the template format
3. Ensure all 7 columns are present and filled
4. Contact admin if problems persist

---

## Quick Checklist Before Upload

- [ ] File has maximum 5 products
- [ ] All 7 columns are present
- [ ] All product names filled in (1-100 chars)
- [ ] All prices are positive numbers
- [ ] All categories specified
- [ ] All image URLs start with http/https
- [ ] All descriptions at least 10 characters
- [ ] All stock quantities are 0 or positive
- [ ] All SKUs are filled in and unique
- [ ] File saved as .csv, .xls, or .xlsx

Ready to upload! 🚀
