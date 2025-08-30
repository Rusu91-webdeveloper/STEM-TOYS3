"use client";

import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

interface TemplateGeneratorProps {
  onDownload?: () => void;
}

export function ProductTemplateGenerator({ onDownload }: TemplateGeneratorProps) {
  const { toast } = useToast();

  const generateEnhancedExcelTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // Create products sheet with comprehensive sample data
    const sampleProducts = [
      {
        name: "RoboBot Coding Kit",
        description: "An interactive robot that teaches children programming basics through fun games and challenges. Includes 50+ coding activities, a companion app, and 3 difficulty levels. Perfect for introducing kids to computational thinking and problem-solving skills.",
        price: 89.99,
        compareAtPrice: 119.99,
        sku: "ROBO-001",
        stockQuantity: 45,
        reorderPoint: 10,
        weight: 1.2,
        category: "Robotics",
        tags: "educational,programming,interactive,app,coding",
        ageGroup: "ELEMENTARY_6_8",
        stemDiscipline: "TECHNOLOGY",
        productType: "ROBOTICS",
        learningOutcomes: "PROBLEM_SOLVING,LOGIC,CRITICAL_THINKING",
        specialCategories: "NEW_ARRIVALS",
        images: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop"
      },
      {
        name: "Science Lab Explorer",
        description: "Complete chemistry and physics experiment kit with 100+ safe experiments. Includes lab equipment, safety goggles, detailed instruction manual, and educational videos. Covers topics like chemical reactions, electricity, magnetism, and more.",
        price: 129.99,
        compareAtPrice: 159.99,
        sku: "SCI-002",
        stockQuantity: 32,
        reorderPoint: 8,
        weight: 2.1,
        category: "Science Kits",
        tags: "chemistry,physics,experiments,safe,laboratory",
        ageGroup: "MIDDLE_SCHOOL_9_12",
        stemDiscipline: "SCIENCE",
        productType: "EXPERIMENT_KITS",
        learningOutcomes: "CRITICAL_THINKING,PROBLEM_SOLVING,CREATIVITY",
        specialCategories: "BEST_SELLERS",
        images: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop"
      },
      {
        name: "Math Puzzle Master",
        description: "Advanced mathematical puzzle set with 200+ brain-teasing challenges. Includes geometric puzzles, number games, logic problems, and spatial reasoning activities. Perfect for developing mathematical thinking and analytical skills.",
        price: 59.99,
        compareAtPrice: 79.99,
        sku: "MATH-003",
        stockQuantity: 78,
        reorderPoint: 15,
        weight: 0.8,
        category: "Mathematics",
        tags: "puzzles,brain games,logic,numbers,mathematics",
        ageGroup: "ELEMENTARY_6_8",
        stemDiscipline: "MATHEMATICS",
        productType: "PUZZLES",
        learningOutcomes: "LOGIC,CRITICAL_THINKING,PROBLEM_SOLVING",
        specialCategories: "GIFT_IDEAS",
        images: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"
      },
      {
        name: "Engineering Bridge Builder",
        description: "Construction kit for building various types of bridges and structures. Includes 500+ building pieces, engineering challenges, and educational materials about structural engineering principles. Teaches physics concepts through hands-on building.",
        price: 149.99,
        compareAtPrice: 189.99,
        sku: "ENG-004",
        stockQuantity: 28,
        reorderPoint: 5,
        weight: 3.2,
        category: "Engineering",
        tags: "construction,building,structures,physics,engineering",
        ageGroup: "MIDDLE_SCHOOL_9_12",
        stemDiscipline: "ENGINEERING",
        productType: "CONSTRUCTION_SETS",
        learningOutcomes: "CREATIVITY,MOTOR_SKILLS,CRITICAL_THINKING",
        specialCategories: "NEW_ARRIVALS",
        images: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop"
      },
      {
        name: "Tech Circuit Board",
        description: "Electronics learning kit with breadboard, components, and 50+ circuit projects. Teaches basic electronics, circuit design, and programming with Arduino compatibility. Includes LED displays, sensors, and motors for interactive projects.",
        price: 199.99,
        compareAtPrice: 249.99,
        sku: "TECH-005",
        stockQuantity: 22,
        reorderPoint: 5,
        weight: 1.8,
        category: "Electronics",
        tags: "circuits,electronics,arduino,programming,technology",
        ageGroup: "TEENS_13_PLUS",
        stemDiscipline: "TECHNOLOGY",
        productType: "EXPERIMENT_KITS",
        learningOutcomes: "LOGIC,PROBLEM_SOLVING,CRITICAL_THINKING",
        specialCategories: "BEST_SELLERS",
        images: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleProducts);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 25 }, // name
      { wch: 60 }, // description
      { wch: 12 }, // price
      { wch: 15 }, // compareAtPrice
      { wch: 15 }, // sku
      { wch: 15 }, // stockQuantity
      { wch: 15 }, // reorderPoint
      { wch: 10 }, // weight
      { wch: 20 }, // category
      { wch: 40 }, // tags
      { wch: 20 }, // ageGroup
      { wch: 20 }, // stemDiscipline
      { wch: 20 }, // productType
      { wch: 40 }, // learningOutcomes
      { wch: 20 }, // specialCategories
      { wch: 80 }, // images
    ];
    ws['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Products");

    // Create comprehensive field descriptions sheet
    const fieldDescriptions = [
      {
        Field: "name",
        Required: "Yes",
        Type: "String",
        MaxLength: "100 characters",
        Description: "Product name displayed to customers",
        Example: "RoboBot Coding Kit",
        Validation: "Must be unique per supplier, cannot be empty",
        Notes: "Will be used to generate the product URL slug"
      },
      {
        Field: "description",
        Required: "Yes",
        Type: "String",
        MaxLength: "1000 characters",
        Description: "Detailed product description",
        Example: "An interactive robot that teaches children programming basics...",
        Validation: "Must be at least 10 characters, cannot be empty",
        Notes: "This is what customers will read about your product"
      },
      {
        Field: "price",
        Required: "Yes",
        Type: "Number",
        MaxLength: "Decimal (max 999,999.99)",
        Description: "Product price in EUR",
        Example: "89.99",
        Validation: "Must be greater than 0, cannot exceed 999,999.99",
        Notes: "This is the main selling price"
      },
      {
        Field: "compareAtPrice",
        Required: "No",
        Type: "Number",
        MaxLength: "Decimal (max 999,999.99)",
        Description: "Original price for comparison (shows as 'was' price)",
        Example: "119.99",
        Validation: "Must be greater than regular price if provided",
        Notes: "Used to show discounts and original pricing"
      },
      {
        Field: "sku",
        Required: "No",
        Type: "String",
        MaxLength: "50 characters",
        Description: "Stock Keeping Unit (unique product identifier)",
        Example: "ROBO-001",
        Validation: "Must be unique across all products if provided",
        Notes: "Useful for inventory management and tracking"
      },
      {
        Field: "stockQuantity",
        Required: "Yes",
        Type: "Integer",
        MaxLength: "0 to 999,999",
        Description: "Available stock quantity",
        Example: "45",
        Validation: "Must be 0 or greater, whole number only",
        Notes: "This affects product availability on the website"
      },
      {
        Field: "reorderPoint",
        Required: "No",
        Type: "Integer",
        MaxLength: "0 to 999,999",
        Description: "Stock level that triggers reorder notification",
        Example: "10",
        Validation: "Must be 0 or greater if provided",
        Notes: "You'll get notified when stock reaches this level"
      },
      {
        Field: "weight",
        Required: "No",
        Type: "Number",
        MaxLength: "0 to 999.99 kg",
        Description: "Product weight in kilograms",
        Example: "1.2",
        Validation: "Must be 0 or greater if provided",
        Notes: "Used for shipping calculations"
      },
      {
        Field: "category",
        Required: "No",
        Type: "String",
        MaxLength: "100 characters",
        Description: "Product category name",
        Example: "Robotics",
        Validation: "Will be created if doesn't exist",
        Notes: "Helps organize products on the website"
      },
      {
        Field: "tags",
        Required: "No",
        Type: "String (comma-separated)",
        MaxLength: "500 characters",
        Description: "Comma-separated tags for product classification",
        Example: "educational,programming,interactive,app,coding",
        Validation: "Maximum 20 tags, comma-separated",
        Notes: "Helps customers find your products through search"
      },
      {
        Field: "ageGroup",
        Required: "No",
        Type: "Enum",
        MaxLength: "One of predefined values",
        Description: "Target age group for the product",
        Example: "ELEMENTARY_6_8",
        Validation: "Must be one of the predefined age groups",
        Notes: "Helps customers find age-appropriate products"
      },
      {
        Field: "stemDiscipline",
        Required: "No",
        Type: "Enum",
        MaxLength: "One of predefined values",
        Description: "Primary STEM discipline",
        Example: "TECHNOLOGY",
        Validation: "Must be one of: SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL",
        Notes: "Defaults to GENERAL if not specified"
      },
      {
        Field: "productType",
        Required: "No",
        Type: "Enum",
        MaxLength: "One of predefined values",
        Description: "Type of STEM product",
        Example: "ROBOTICS",
        Validation: "Must be one of: ROBOTICS, PUZZLES, CONSTRUCTION_SETS, EXPERIMENT_KITS, BOARD_GAMES",
        Notes: "Helps categorize the type of learning activity"
      },
      {
        Field: "learningOutcomes",
        Required: "No",
        Type: "String (comma-separated)",
        MaxLength: "500 characters",
        Description: "Comma-separated learning outcomes",
        Example: "PROBLEM_SOLVING,LOGIC,CRITICAL_THINKING",
        Validation: "Must be from predefined list, maximum 5 outcomes",
        Notes: "Describes what skills children will develop"
      },
      {
        Field: "specialCategories",
        Required: "No",
        Type: "String (comma-separated)",
        MaxLength: "500 characters",
        Description: "Comma-separated special categories",
        Example: "NEW_ARRIVALS",
        Validation: "Must be from predefined list, maximum 4 categories",
        Notes: "Used for promotional features and special sections"
      },
      {
        Field: "images",
        Required: "No",
        Type: "String (comma-separated URLs)",
        MaxLength: "2000 characters",
        Description: "Comma-separated image URLs",
        Example: "https://example.com/image1.jpg,https://example.com/image2.jpg",
        Validation: "Must be valid URLs, maximum 10 images",
        Notes: "High-quality images improve product visibility and sales"
      }
    ];

    const ws2 = XLSX.utils.json_to_sheet(fieldDescriptions);
    ws2['!cols'] = [
      { wch: 20 }, // Field
      { wch: 10 }, // Required
      { wch: 15 }, // Type
      { wch: 20 }, // MaxLength
      { wch: 40 }, // Description
      { wch: 30 }, // Example
      { wch: 40 }, // Validation
      { wch: 50 }, // Notes
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "Field Descriptions");

    // Create enum values reference sheet
    const enumValues = [
      {
        Category: "Age Groups",
        ValidValues: "TODDLERS_1_3, PRESCHOOL_3_5, ELEMENTARY_6_8, MIDDLE_SCHOOL_9_12, TEENS_13_PLUS",
        Description: "Target age ranges for products"
      },
      {
        Category: "STEM Disciplines",
        ValidValues: "SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL",
        Description: "Primary STEM learning areas"
      },
      {
        Category: "Product Types",
        ValidValues: "ROBOTICS, PUZZLES, CONSTRUCTION_SETS, EXPERIMENT_KITS, BOARD_GAMES",
        Description: "Types of STEM learning activities"
      },
      {
        Category: "Learning Outcomes",
        ValidValues: "PROBLEM_SOLVING, CREATIVITY, CRITICAL_THINKING, MOTOR_SKILLS, LOGIC",
        Description: "Skills that children will develop"
      },
      {
        Category: "Special Categories",
        ValidValues: "NEW_ARRIVALS, BEST_SELLERS, GIFT_IDEAS, SALE_ITEMS",
        Description: "Promotional and special product categories"
      }
    ];

    const ws3 = XLSX.utils.json_to_sheet(enumValues);
    ws3['!cols'] = [
      { wch: 25 }, // Category
      { wch: 60 }, // ValidValues
      { wch: 50 }, // Description
    ];
    XLSX.utils.book_append_sheet(wb, ws3, "Enum Values");

    // Create validation rules sheet
    const validationRules = [
      {
        Rule: "Required Fields",
        Fields: "name, description, price, stockQuantity",
        Description: "These fields must be provided for all products"
      },
      {
        Rule: "String Length Limits",
        Fields: "name (100), description (1000), sku (50), category (100), tags (500), learningOutcomes (500), specialCategories (500), images (2000)",
        Description: "Maximum character limits for text fields"
      },
      {
        Rule: "Numeric Limits",
        Fields: "price (0.01-999,999.99), stockQuantity (0-999,999), reorderPoint (0-999,999), weight (0-999.99)",
        Description: "Valid ranges for numeric fields"
      },
      {
        Rule: "Array Limits",
        Fields: "tags (max 20), learningOutcomes (max 5), specialCategories (max 4), images (max 10)",
        Description: "Maximum number of items in comma-separated lists"
      },
      {
        Rule: "URL Validation",
        Fields: "images",
        Description: "All image URLs must start with 'http' or 'https'"
      },
      {
        Rule: "Price Logic",
        Fields: "compareAtPrice",
        Description: "Compare at price must be greater than regular price"
      },
      {
        Rule: "Uniqueness",
        Fields: "name (per supplier), sku (global)",
        Description: "Product names must be unique per supplier, SKUs must be unique globally"
      }
    ];

    const ws4 = XLSX.utils.json_to_sheet(validationRules);
    ws4['!cols'] = [
      { wch: 25 }, // Rule
      { wch: 50 }, // Fields
      { wch: 60 }, // Description
    ];
    XLSX.utils.book_append_sheet(wb, ws4, "Validation Rules");

    // Create tips and best practices sheet
    const tipsAndBestPractices = [
      {
        Category: "Product Names",
        Tip: "Use descriptive, keyword-rich names",
        Example: "Good: 'RoboBot Coding Kit' | Bad: 'Robot'",
        Reason: "Better for search and customer understanding"
      },
      {
        Category: "Descriptions",
        Tip: "Include key features, benefits, and learning outcomes",
        Example: "Mention age appropriateness, safety features, included components",
        Reason: "Helps customers make informed decisions"
      },
      {
        Category: "Pricing",
        Tip: "Research competitor pricing and set competitive prices",
        Example: "Consider your costs, target market, and value proposition",
        Reason: "Affects conversion rates and profitability"
      },
      {
        Category: "Images",
        Tip: "Use high-quality, well-lit product photos",
        Example: "Include multiple angles, close-ups, and in-use shots",
        Reason: "Images significantly impact purchase decisions"
      },
      {
        Category: "Tags",
        Tip: "Use relevant, specific tags that customers might search for",
        Example: "Include age groups, skills, themes, and product types",
        Reason: "Improves product discoverability"
      },
      {
        Category: "Categories",
        Tip: "Choose the most specific category that fits your product",
        Example: "Use 'Robotics' instead of 'Technology' for robot kits",
        Reason: "Helps customers find products in the right section"
      },
      {
        Category: "Stock Management",
        Tip: "Set realistic reorder points based on your sales velocity",
        Example: "If you sell 10 units/week, set reorder point at 20-30",
        Reason: "Prevents stockouts and lost sales"
      }
    ];

    const ws5 = XLSX.utils.json_to_sheet(tipsAndBestPractices);
    ws5['!cols'] = [
      { wch: 20 }, // Category
      { wch: 40 }, // Tip
      { wch: 50 }, // Example
      { wch: 50 }, // Reason
    ];
    XLSX.utils.book_append_sheet(wb, ws5, "Tips & Best Practices");

    XLSX.writeFile(wb, "product-upload-template-enhanced.xlsx");

    toast({
      title: "Enhanced template downloaded",
      description: "Excel template with comprehensive examples and documentation has been downloaded successfully.",
    });

    onDownload?.();
  };

  const generateCSVTemplate = () => {
    const headers = [
      "name",
      "description", 
      "price",
      "compareAtPrice",
      "sku",
      "stockQuantity",
      "reorderPoint",
      "weight",
      "category",
      "tags",
      "ageGroup",
      "stemDiscipline",
      "productType",
      "learningOutcomes",
      "specialCategories",
      "images"
    ];

    const sampleData = [
      "RoboBot Coding Kit",
      "An interactive robot that teaches children programming basics through fun games and challenges. Includes 50+ coding activities and a companion app.",
      "89.99",
      "119.99",
      "ROBO-001",
      "45",
      "10",
      "1.2",
      "Robotics",
      "educational,programming,interactive,app,coding",
      "ELEMENTARY_6_8",
      "TECHNOLOGY",
      "ROBOTICS",
      "PROBLEM_SOLVING,LOGIC,CRITICAL_THINKING",
      "NEW_ARRIVALS",
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop"
    ];

    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "CSV template downloaded",
      description: "CSV template has been downloaded successfully.",
    });

    onDownload?.();
  };

  return {
    generateEnhancedExcelTemplate,
    generateCSVTemplate
  };
}
