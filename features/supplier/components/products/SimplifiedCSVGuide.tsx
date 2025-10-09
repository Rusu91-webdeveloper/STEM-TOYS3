"use client";

import { useState } from "react";
import {
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SimplifiedCSVGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const downloadTemplate = () => {
    // Create CSV content with required fields first
    const headers = [
      "name",
      "description",
      "price",
      "stockQuantity",
      "sku",
      "category",
      "images",
      // Optional fields after
      "ageGroup",
      "stemDiscipline",
      "productType",
      "weight",
      "compareAtPrice",
    ];

    const examples = [
      [
        "LEGO Mindstorms Robot Inventor",
        "Build and program robots with this advanced LEGO robotics kit featuring sensors, motors and programmable hub",
        "359.99",
        "25",
        "LEGO-51515",
        "Robotics",
        "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600",
        "MIDDLE_SCHOOL_9_12",
        "TECHNOLOGY",
        "ROBOTICS",
        "1.2",
        "399.99",
      ],
      [
        "Arduino Starter Kit",
        "Complete electronics kit for learning Arduino programming and building electronic projects",
        "89.99",
        "50",
        "ARD-START-001",
        "Electronics",
        "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600",
        "TEENS_13_PLUS",
        "ENGINEERING",
        "EXPERIMENT_KITS",
        "0.8",
        "",
      ],
      [
        "Snap Circuits Jr. SC-100",
        "Hands-on introduction to electronics with 100+ projects using snap-together components",
        "24.99",
        "75",
        "SNAP-SC100",
        "Electronics",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
        "ELEMENTARY_6_8",
        "SCIENCE",
        "EXPERIMENT_KITS",
        "0.5",
        "",
      ],
    ];

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV
    const csvLines = [headers.join(",")];
    examples.forEach(row => {
      const escapedRow = row.map(escapeCSV);
      csvLines.push(escapedRow.join(","));
    });

    const csvContent = csvLines.join("\n");

    // Download
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

  const requiredFields = [
    {
      name: "name",
      description: "Product name (clear and descriptive)",
      example: "LEGO Mindstorms Robot Inventor",
      validation: "1-100 characters",
    },
    {
      name: "description",
      description: "Detailed product description",
      example:
        "Build and program robots with this advanced LEGO robotics kit...",
      validation: "10-1000 characters",
    },
    {
      name: "price",
      description: "Price in RON (numbers only)",
      example: "359.99",
      validation: "Must be > 0",
    },
    {
      name: "stockQuantity",
      description: "Available stock count",
      example: "25",
      validation: "Must be ≥ 0",
    },
    {
      name: "sku",
      description: "Unique product code",
      example: "LEGO-51515",
      validation: "Optional, must be unique",
    },
    {
      name: "category",
      description: "Product category",
      example: "Robotics",
      validation: "Optional",
    },
    {
      name: "images",
      description: "Image URL (starting with http://)",
      example: "https://example.com/image.jpg",
      validation: "Valid URL required",
    },
  ];

  const optionalFields = [
    {
      name: "ageGroup",
      values: [
        "TODDLERS_1_3",
        "PRESCHOOL_3_5",
        "ELEMENTARY_6_8",
        "MIDDLE_SCHOOL_9_12",
        "TEENS_13_PLUS",
      ],
    },
    {
      name: "stemDiscipline",
      values: [
        "SCIENCE",
        "TECHNOLOGY",
        "ENGINEERING",
        "MATHEMATICS",
        "GENERAL",
      ],
    },
    {
      name: "productType",
      values: [
        "ROBOTICS",
        "PUZZLES",
        "CONSTRUCTION_SETS",
        "EXPERIMENT_KITS",
        "BOARD_GAMES",
      ],
    },
    { name: "weight", description: "Weight in kg (e.g., 1.2)" },
    {
      name: "compareAtPrice",
      description: "Original price for discount display",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between hover:bg-transparent p-0"
            >
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Quick Start Guide
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Download CTA */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">
                  📥 Download Ready-to-Use Template
                </h4>
                <p className="text-xs text-muted-foreground">
                  Pre-filled with 3 example products - just replace with your
                  data!
                </p>
              </div>
              <Button onClick={downloadTemplate} size="sm" className="ml-4">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>

            {/* Key Rules */}
            <Alert className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> Maximum 5 products per upload. First
                7 columns are required, others are optional.
              </AlertDescription>
            </Alert>

            {/* Required Fields Table */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
                Essential Fields (7)
              </h4>
              <div className="space-y-2">
                {requiredFields.map(field => (
                  <div
                    key={field.name}
                    className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-lg border border-red-100 dark:border-red-900/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <code className="text-xs font-bold bg-background px-2 py-1 rounded">
                        {field.name}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {field.validation}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {field.description}
                    </p>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded block mt-1">
                      {field.example}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Fields */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Optional
                </Badge>
                Additional Fields (5)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {optionalFields.map(field => (
                  <div
                    key={field.name}
                    className="p-2 bg-muted/30 rounded border text-xs"
                  >
                    <code className="font-semibold">{field.name}</code>
                    {field.values && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {field.values.slice(0, 2).map(val => (
                          <Badge
                            key={val}
                            variant="outline"
                            className="text-[10px] px-1"
                          >
                            {val}
                          </Badge>
                        ))}
                        {field.values.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1">
                            +{field.values.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    {field.description && (
                      <p className="text-muted-foreground mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Common Mistakes */}
            <div className="p-3 bg-red-50/30 dark:bg-red-950/10 rounded-lg border border-red-100 dark:border-red-900/30">
              <h4 className="font-semibold text-sm mb-2 text-red-900 dark:text-red-100">
                ❌ Common Mistakes to Avoid
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• More than 5 products in the file</li>
                <li>• Empty required fields</li>
                <li>
                  • Invalid image URLs (must start with http:// or https://)
                </li>
                <li>• Description less than 10 characters</li>
                <li>
                  • Wrong enum values (check the template for valid options)
                </li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
