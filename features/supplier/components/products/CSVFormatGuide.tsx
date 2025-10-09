"use client";

import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Info,
  X,
  Table2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

export function CSVFormatGuide() {
  const downloadTemplate = () => {
    // Define the exact column order
    const columns = [
      "name",
      "price",
      "description",
      "stockQuantity",
      "sku",
      "category",
      "images",
      "ageGroup",
      "stemDiscipline",
      "productType",
      "learningOutcomes",
      "specialCategories",
      "tags",
      "weight",
      "compareAtPrice",
    ];

    // Create sample data rows (3 examples)
    const rows = [
      [
        "LEGO Mindstorms Robot Inventor",
        "359.99",
        "Build and program robots with this advanced LEGO robotics kit featuring sensors, motors and programmable hub",
        "25",
        "LEGO-51515",
        "Robotics",
        "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&h=600&fit=crop",
        "MIDDLE_SCHOOL_9_12",
        "TECHNOLOGY",
        "ROBOTICS",
        "PROBLEM_SOLVING,CREATIVITY",
        "BEST_SELLERS",
        "robotics,programming,lego",
        "1.2",
        "399.99",
      ],
      [
        "Arduino Starter Kit",
        "89.99",
        "Complete electronics kit for learning Arduino programming and building electronic projects",
        "50",
        "ARD-START-001",
        "Electronics",
        "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&h=600&fit=crop",
        "TEENS_13_PLUS",
        "ENGINEERING",
        "EXPERIMENT_KITS",
        "PROBLEM_SOLVING,LOGIC",
        "NEW_ARRIVALS",
        "electronics,arduino,coding",
        "0.8",
        "",
      ],
      [
        "Snap Circuits Jr. SC-100",
        "24.99",
        "Hands-on introduction to electronics with 100+ projects using snap-together components",
        "75",
        "SNAP-SC100",
        "Electronics",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=600&fit=crop",
        "ELEMENTARY_6_8",
        "SCIENCE",
        "EXPERIMENT_KITS",
        "CREATIVITY,MOTOR_SKILLS",
        "GIFT_IDEAS",
        "circuits,electronics,hands-on",
        "0.5",
        "",
      ],
    ];

    // Helper function to escape CSV values
    const escapeCSV = (value: string) => {
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvLines = [];

    // Add header row
    csvLines.push(columns.join(","));

    // Add data rows
    rows.forEach(row => {
      const escapedRow = row.map(escapeCSV);
      csvLines.push(escapedRow.join(","));
    });

    // Create CSV string
    const csvContent = csvLines.join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "supplier-product-template.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Complete list of ALL columns
  const allColumns = [
    {
      name: "name",
      description: "Product name",
      example: "LEGO Mindstorms Robot",
      required: true,
      format: "Text (1-100 chars)",
    },
    {
      name: "price",
      description: "Price in RON",
      example: "359.99",
      required: true,
      format: "Number > 0",
    },
    {
      name: "description",
      description: "Full product description",
      example: "Build and program robots...",
      required: true,
      format: "Text (10-1000 chars)",
    },
    {
      name: "stockQuantity",
      description: "Available stock",
      example: "25",
      required: true,
      format: "Integer ≥ 0",
    },
    {
      name: "sku",
      description: "Product code/SKU",
      example: "LEGO-51515",
      required: true,
      format: "Text (max 50 chars)",
    },
    {
      name: "category",
      description: "Product category",
      example: "Robotics",
      required: true,
      format: "Text",
    },
    {
      name: "images",
      description: "Image URL",
      example: "https://example.com/img.jpg",
      required: true,
      format: "Valid URL",
    },
    {
      name: "ageGroup",
      description: "Target age group",
      example: "ELEMENTARY_6_8",
      required: false,
      format:
        "TODDLERS_1_3, PRESCHOOL_3_5, ELEMENTARY_6_8, MIDDLE_SCHOOL_9_12, TEENS_13_PLUS",
    },
    {
      name: "stemDiscipline",
      description: "STEM category",
      example: "TECHNOLOGY",
      required: false,
      format: "SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL",
    },
    {
      name: "productType",
      description: "Type of product",
      example: "ROBOTICS",
      required: false,
      format:
        "ROBOTICS, PUZZLES, CONSTRUCTION_SETS, EXPERIMENT_KITS, BOARD_GAMES",
    },
    {
      name: "learningOutcomes",
      description: "Learning benefits",
      example: "PROBLEM_SOLVING,CREATIVITY",
      required: false,
      format:
        "Comma-separated: PROBLEM_SOLVING, CREATIVITY, CRITICAL_THINKING, MOTOR_SKILLS, LOGIC",
    },
    {
      name: "tags",
      description: "Product tags",
      example: "robotics,educational,lego",
      required: false,
      format: "Comma-separated text",
    },
    {
      name: "weight",
      description: "Weight in kg",
      example: "1.2",
      required: false,
      format: "Number ≥ 0",
    },
    {
      name: "compareAtPrice",
      description: "Original price",
      example: "399.99",
      required: false,
      format: "Number > price",
    },
  ];

  const commonMistakes = [
    "Missing required columns (first 7 are mandatory)",
    "More than 5 products in CSV file",
    "Empty values in required fields (name, price, description, stockQuantity, sku, category, images)",
    "Invalid image URLs (must start with http:// or https://)",
    "Negative price or stock quantity",
    "Description less than 10 characters",
    "Wrong values for ageGroup, stemDiscipline, or productType (must match exact values)",
  ];

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-900 dark:text-orange-100">
          <strong>Important:</strong> Maximum 5 products per upload. Files with
          more than 5 products will be rejected.
        </AlertDescription>
      </Alert>

      {/* Download Template CTA */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-lg">
                  Download Ready-to-Use CSV Template
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get a proper CSV file with 3 example products - just replace
                  with your own data and upload!
                </p>
              </div>
            </div>
            <Button
              onClick={downloadTemplate}
              size="lg"
              className="w-full md:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visual Table Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table2 className="h-5 w-5" />
            Your CSV Must Look Like This
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            This is exactly how your CSV file should be structured. First row =
            column headers, following rows = your products.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-semibold border-r">
                    <div className="flex items-center gap-2">
                      name
                      <Badge variant="destructive" className="text-[10px]">
                        Required
                      </Badge>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold border-r">
                    <div className="flex items-center gap-2">
                      price
                      <Badge variant="destructive" className="text-[10px]">
                        Required
                      </Badge>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold border-r">
                    <div className="flex items-center gap-2">
                      description
                      <Badge variant="destructive" className="text-[10px]">
                        Required
                      </Badge>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold border-r">
                    <div className="flex items-center gap-2">
                      stockQuantity
                      <Badge variant="destructive" className="text-[10px]">
                        Required
                      </Badge>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold border-r">
                    <div className="flex items-center gap-2">
                      sku
                      <Badge variant="destructive" className="text-[10px]">
                        Required
                      </Badge>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold border-r">
                    <div className="flex items-center gap-2">
                      category
                      <Badge variant="destructive" className="text-[10px]">
                        Required
                      </Badge>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold border-r">
                    <div className="flex items-center gap-2">
                      images
                      <Badge variant="destructive" className="text-[10px]">
                        Required
                      </Badge>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold border-r">
                    <div className="flex items-center gap-2">
                      ageGroup
                      <Badge variant="secondary" className="text-[10px]">
                        Optional
                      </Badge>
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold">
                    <div className="flex items-center gap-2">
                      learningOutcomes
                      <Badge variant="secondary" className="text-[10px]">
                        Optional
                      </Badge>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t bg-blue-50/50 dark:bg-blue-950/20">
                  <td className="p-3 border-r font-mono text-xs">
                    LEGO Mindstorms Robot
                  </td>
                  <td className="p-3 border-r font-mono text-xs">359.99</td>
                  <td className="p-3 border-r font-mono text-xs max-w-[200px] truncate">
                    Build and program robots...
                  </td>
                  <td className="p-3 border-r font-mono text-xs">25</td>
                  <td className="p-3 border-r font-mono text-xs">LEGO-51515</td>
                  <td className="p-3 border-r font-mono text-xs">Robotics</td>
                  <td className="p-3 border-r font-mono text-xs max-w-[150px] truncate">
                    https://example.com/...
                  </td>
                  <td className="p-3 border-r font-mono text-xs">
                    MIDDLE_SCHOOL_9_12
                  </td>
                  <td className="p-3 font-mono text-xs max-w-[150px] truncate">
                    PROBLEM_SOLVING,CREATIVITY
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 border-r font-mono text-xs">
                    Arduino Starter Kit
                  </td>
                  <td className="p-3 border-r font-mono text-xs">89.99</td>
                  <td className="p-3 border-r font-mono text-xs max-w-[200px] truncate">
                    Complete electronics kit...
                  </td>
                  <td className="p-3 border-r font-mono text-xs">50</td>
                  <td className="p-3 border-r font-mono text-xs">
                    ARD-START-001
                  </td>
                  <td className="p-3 border-r font-mono text-xs">
                    Electronics
                  </td>
                  <td className="p-3 border-r font-mono text-xs max-w-[150px] truncate">
                    https://example.com/...
                  </td>
                  <td className="p-3 border-r font-mono text-xs">
                    TEENS_13_PLUS
                  </td>
                  <td className="p-3 font-mono text-xs">
                    PROBLEM_SOLVING,LOGIC
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> Open the downloaded CSV template in
              Excel, Google Sheets, or any text editor. Replace the 3 example
              products with your own (max 5 total), save as CSV, and upload!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Complete Column Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Complete Column Reference
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            All available columns and their requirements. Required columns are
            marked in red.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allColumns.map(column => (
              <div
                key={column.name}
                className={`p-3 rounded-lg border ${
                  column.required
                    ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                    : "bg-muted/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <code className="text-sm font-bold px-2 py-1 bg-background rounded">
                    {column.name}
                  </code>
                  {column.required ? (
                    <Badge variant="destructive" className="text-xs w-fit">
                      Required
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs w-fit">
                      Optional
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {column.description}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Format: </span>
                    <span className="font-mono">{column.format}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Example: </span>
                    <code className="bg-muted px-1 rounded">
                      {column.example}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <X className="h-5 w-5" />
            Common Mistakes to Avoid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {commonMistakes.map((mistake, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-2 bg-red-50/50 dark:bg-red-950/20 rounded"
              >
                <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{mistake}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
