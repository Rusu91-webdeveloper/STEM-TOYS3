# Bulk Upload Testing Guide

## Overview

This guide demonstrates how to test the bulk upload functionality for supplier
products in the TechTots platform.

## Files Created for Testing

### 1. Sample CSV File: `sample-products-bulk-upload.csv`

This file contains 10 sample STEM toy products with all required and optional
fields properly formatted.

### 2. Excel Template: `product-upload-template.xlsx`

Generated using the `create-excel-template.js` script, this file contains:

- **Products Sheet**: Sample data with 2 products
- **Field Descriptions Sheet**: Complete documentation of all fields

## How to Test the Bulk Upload Functionality

### Step 1: Access the Bulk Upload Page

Navigate to: `http://localhost:3000/supplier/products/bulk-upload`

### Step 2: Download Template

1. Click the "Download Template" button
2. This will download `product-upload-template.xlsx` with proper formatting

### Step 3: Test with Sample Data

1. Use the provided `sample-products-bulk-upload.csv` file
2. Click "Choose File" and select the CSV file
3. The system will parse and validate the data
4. Review any validation errors if present
5. Click "Upload Products" to submit

### Step 4: Verify Results

1. Check the upload results
2. Navigate to `/supplier/products` to see the uploaded products
3. Verify that products appear in the supplier dashboard

## File Format Requirements

### Required Fields

- **name**: Product name (max 100 characters)
- **description**: Product description (min 10 characters, max 1000)
- **price**: Product price in EUR (must be > 0)
- **stockQuantity**: Available stock quantity (must be >= 0)

### Optional Fields

- **compareAtPrice**: Original price for comparison
- **sku**: Stock keeping unit
- **reorderPoint**: Reorder point for inventory management
- **weight**: Product weight in kg
- **category**: Product category name
- **tags**: Comma-separated tags
- **ageGroup**: One of: TODDLERS_1_3, PRESCHOOL_3_5, ELEMENTARY_6_8,
  MIDDLE_SCHOOL_9_12, TEENS_13_PLUS
- **stemDiscipline**: One of: SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS,
  GENERAL
- **productType**: One of: ROBOTICS, PUZZLES, CONSTRUCTION_SETS,
  EXPERIMENT_KITS, BOARD_GAMES
- **learningOutcomes**: Comma-separated learning outcomes
- **specialCategories**: Comma-separated special categories (NEW_ARRIVALS,
  BEST_SELLERS, GIFT_IDEAS, SALE_ITEMS)
- **images**: Comma-separated image URLs

## Sample Data Structure

### CSV Format

```csv
name,description,price,compareAtPrice,sku,stockQuantity,reorderPoint,weight,category,tags,ageGroup,stemDiscipline,productType,learningOutcomes,specialCategories,images
"RoboBot Coding Kit","An interactive robot that teaches children programming basics through fun games and challenges. Includes 50+ coding activities and a companion app.",29.99,39.99,ROBO-001,100,10,0.8,"Robotics","educational,programming,interactive",ELEMENTARY_6_8,TECHNOLOGY,ROBOTICS,"PROBLEM_SOLVING,LOGIC,CRITICAL_THINKING",NEW_ARRIVALS,"https://example.com/robobot1.jpg,https://example.com/robobot2.jpg"
```

### Excel Format

The Excel template includes:

1. **Products Sheet**: Sample data with proper column headers
2. **Field Descriptions Sheet**: Complete field documentation

## Validation Rules

### Name Validation

- Required field
- Maximum 100 characters
- Cannot be empty

### Description Validation

- Required field
- Minimum 10 characters
- Maximum 1000 characters
- Cannot be empty

### Price Validation

- Required field
- Must be greater than 0
- Numeric value

### Stock Quantity Validation

- Required field
- Must be non-negative
- Integer value

### Age Group Validation

Must be one of:

- TODDLERS_1_3
- PRESCHOOL_3_5
- ELEMENTARY_6_8
- MIDDLE_SCHOOL_9_12
- TEENS_13_PLUS

### STEM Discipline Validation

Must be one of:

- SCIENCE
- TECHNOLOGY
- ENGINEERING
- MATHEMATICS
- GENERAL

### Product Type Validation

Must be one of:

- ROBOTICS
- PUZZLES
- CONSTRUCTION_SETS
- EXPERIMENT_KITS
- BOARD_GAMES

## Error Handling

### Validation Errors

- Row-specific error messages
- Field-specific validation
- Clear error descriptions

### Upload Errors

- Network error handling
- Server error responses
- Progress tracking

## Testing Scenarios

### 1. Valid Data Upload

- Upload the sample CSV file
- Verify all products are created successfully
- Check product details in the supplier dashboard

### 2. Invalid Data Testing

- Modify the CSV to include invalid data
- Test validation error messages
- Verify error handling

### 3. Empty File Testing

- Try uploading an empty file
- Verify appropriate error message

### 4. Wrong Format Testing

- Try uploading non-CSV/Excel files
- Verify file type validation

## API Endpoint

### Bulk Upload API

- **URL**: `/api/supplier/products/bulk-upload`
- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: Required (Supplier role)

### Request Body

```json
{
  "products": [
    {
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "stockQuantity": 100
      // ... other fields
    }
  ]
}
```

### Response

```json
{
  "success": 10,
  "failed": 0,
  "errors": []
}
```

## Integration with Single Product Creation

### Single Product Form

- **URL**: `/supplier/products/new`
- **Component**: `SupplierProductForm`
- **Features**:
  - Real-time validation
  - Image upload
  - Category selection
  - Tag management

### Comparison

| Feature         | Bulk Upload              | Single Product         |
| --------------- | ------------------------ | ---------------------- |
| Speed           | Fast (multiple products) | Slower (one at a time) |
| Validation      | Batch validation         | Real-time validation   |
| Error Handling  | Row-specific errors      | Field-specific errors  |
| User Experience | Template download        | Interactive form       |
| Use Case        | Large catalogs           | Individual products    |

## File Management

### Generated Files

- `sample-products-bulk-upload.csv`: Test data
- `product-upload-template.xlsx`: Template file
- `create-excel-template.js`: Template generator script

### Cleanup

After testing, you can remove these files:

```bash
rm sample-products-bulk-upload.csv
rm product-upload-template.xlsx
rm create-excel-template.js
```

## Next Steps

1. **Test with Real Data**: Replace sample URLs with actual product images
2. **Category Integration**: Ensure categories exist in the database
3. **Image Upload**: Test with actual image files
4. **Performance Testing**: Test with large datasets
5. **Error Recovery**: Test partial upload scenarios

## Troubleshooting

### Common Issues

1. **Validation Errors**: Check field formats and required values
2. **File Format**: Ensure CSV/Excel format is correct
3. **Authentication**: Verify supplier login status
4. **Network Issues**: Check server connectivity

### Debug Steps

1. Check browser console for errors
2. Verify API endpoint responses
3. Check database for created products
4. Review validation error messages
