const XLSX = require("xlsx");

// Sample data for the template
const template = [
  {
    name: "Sample STEM Toy",
    description:
      "An educational toy that teaches children about robotics and programming",
    price: 29.99,
    compareAtPrice: 39.99,
    sku: "STEM-001",
    stockQuantity: 100,
    reorderPoint: 10,
    weight: 0.5,
    category: "Robotics",
    tags: "educational,robotics,programming",
    ageGroup: "ELEMENTARY_6_8",
    stemDiscipline: "TECHNOLOGY",
    productType: "ROBOTICS",
    learningOutcomes: "Problem solving,Logical thinking,Programming basics",
    specialCategories: "NEW_ARRIVALS,BEST_SELLERS",
    images: "https://example.com/image1.jpg,https://example.com/image2.jpg",
  },
  {
    name: "Science Experiment Kit",
    description:
      "Complete science kit with 25 experiments covering chemistry and physics",
    price: 24.99,
    compareAtPrice: 34.99,
    sku: "SCI-002",
    stockQuantity: 75,
    reorderPoint: 15,
    weight: 1.2,
    category: "Science Kits",
    tags: "experiments,chemistry,physics",
    ageGroup: "PRESCHOOL_3_5",
    stemDiscipline: "SCIENCE",
    productType: "EXPERIMENT_KITS",
    learningOutcomes: "Critical thinking,Creativity,Problem solving",
    specialCategories: "BEST_SELLERS",
    images: "https://example.com/science1.jpg,https://example.com/science2.jpg",
  },
];

// Field descriptions
const fieldDescriptions = [
  {
    Field: "name",
    Required: "Yes",
    Description: "Product name (max 100 characters)",
  },
  {
    Field: "description",
    Required: "Yes",
    Description: "Product description (min 10 characters, max 1000)",
  },
  {
    Field: "price",
    Required: "Yes",
    Description: "Product price in EUR (must be > 0)",
  },
  {
    Field: "compareAtPrice",
    Required: "No",
    Description: "Original price for comparison",
  },
  {
    Field: "sku",
    Required: "No",
    Description: "Stock keeping unit",
  },
  {
    Field: "stockQuantity",
    Required: "Yes",
    Description: "Available stock quantity",
  },
  {
    Field: "reorderPoint",
    Required: "No",
    Description: "Reorder point for inventory management",
  },
  {
    Field: "weight",
    Required: "No",
    Description: "Product weight in kg",
  },
  {
    Field: "category",
    Required: "No",
    Description: "Product category name",
  },
  {
    Field: "tags",
    Required: "No",
    Description: "Comma-separated tags",
  },
  {
    Field: "ageGroup",
    Required: "No",
    Description:
      "TODDLERS_1_3, PRESCHOOL_3_5, ELEMENTARY_6_8, MIDDLE_SCHOOL_9_12, TEENS_13_PLUS",
  },
  {
    Field: "stemDiscipline",
    Required: "No",
    Description: "SCIENCE, TECHNOLOGY, ENGINEERING, MATH, GENERAL",
  },
  {
    Field: "productType",
    Required: "No",
    Description:
      "ROBOTICS, PUZZLES, CONSTRUCTION_SETS, EXPERIMENT_KITS, BOARD_GAMES",
  },
  {
    Field: "learningOutcomes",
    Required: "No",
    Description: "Comma-separated learning outcomes",
  },
  {
    Field: "specialCategories",
    Required: "No",
    Description: "NEW_ARRIVALS, BEST_SELLERS, GIFT_IDEAS, SALE_ITEMS",
  },
  {
    Field: "images",
    Required: "No",
    Description: "Comma-separated image URLs",
  },
];

// Create workbook
const wb = XLSX.utils.book_new();

// Add products sheet
const ws = XLSX.utils.json_to_sheet(template);
XLSX.utils.book_append_sheet(wb, ws, "Products");

// Add field descriptions sheet
const ws2 = XLSX.utils.json_to_sheet(fieldDescriptions);
XLSX.utils.book_append_sheet(wb, ws2, "Field Descriptions");

// Write the file
XLSX.writeFile(wb, "product-upload-template.xlsx");

console.log("Excel template created: product-upload-template.xlsx");
