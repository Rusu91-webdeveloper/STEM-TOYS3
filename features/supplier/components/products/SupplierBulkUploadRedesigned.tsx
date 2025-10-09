"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { DragDropUploadZone } from "./DragDropUploadZone";
import { InlineTableEditor } from "./InlineTableEditor";
import { SimplifiedCSVGuide } from "./SimplifiedCSVGuide";

interface ProductRow {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stockQuantity: number;
  reorderPoint?: number;
  weight?: number;
  category?: string;
  tags?: string;
  ageGroup?: string | undefined;
  stemDiscipline?: string | undefined;
  productType?: string | undefined;
  learningOutcomes?: string;
  specialCategories?: string;
  images?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: ValidationError[];
}

export function SupplierBulkUploadRedesigned() {
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadProgress(0);

    try {
      const data = await readFile(selectedFile);
      const parsedProducts = parseProducts(data);

      // Enforce 5-product limit
      if (parsedProducts.length > 5) {
        toast({
          title: "Too many products",
          description: `Maximum 5 products allowed. Your file has ${parsedProducts.length}. Please reduce to 5 or fewer.`,
          variant: "destructive",
        });
        clearFile();
        return;
      }

      setProducts(parsedProducts);

      // Validate
      const errors = validateProducts(parsedProducts);
      setValidationErrors(errors);

      if (errors.length > 0) {
        toast({
          title: "Validation errors found",
          description: `${errors.length} errors found. Fix them in the table below or re-upload.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File validated ✓",
          description: `${parsedProducts.length} products ready to upload.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: "Failed to read the file. Please check the format.",
        variant: "destructive",
      });
      console.error("Error parsing file:", error);
      clearFile();
    }
  };

  const clearFile = () => {
    setFile(null);
    setProducts([]);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const readFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("No data read from file"));
            return;
          }

          if (file.type === "text/csv") {
            // Handle CSV
            const csv = data as string;
            const lines = csv.split("\n");
            const headers = lines[0]
              .split(",")
              .map(h => h.trim().replace(/"/g, ""));
            const rows = lines
              .slice(1)
              .filter(line => line.trim())
              .map(line => {
                const values = line
                  .split(",")
                  .map(v => v.trim().replace(/"/g, ""));
                const row: any = {};
                headers.forEach((header, index) => {
                  row[header] = values[index] || "";
                });
                return row;
              });
            resolve(rows);
          } else {
            // Handle Excel
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));

      if (file.type === "text/csv") {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const parseProducts = (data: any[]): ProductRow[] => {
    return data.map(row => {
      const safeParseInt = (value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined || value === "")
          return defaultValue;
        const parsed = parseInt(String(value).replace(/[^\d.-]/g, ""));
        return isNaN(parsed) ? defaultValue : parsed;
      };

      const safeParseFloat = (value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined || value === "")
          return defaultValue;
        const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ""));
        return isNaN(parsed) ? defaultValue : parsed;
      };

      const normalizeEnum = (value: any): string | undefined => {
        const normalized = String(value || "")
          .trim()
          .toUpperCase();
        return normalized === "" ? undefined : normalized;
      };

      return {
        name: row.name || row.Name || row.NAME || "",
        description:
          row.description || row.Description || row.DESCRIPTION || "",
        price: safeParseFloat(row.price || row.Price || row.PRICE || "0"),
        compareAtPrice: row.compareAtPrice
          ? safeParseFloat(row.compareAtPrice)
          : undefined,
        sku: row.sku || row.SKU || row.Sku || "",
        stockQuantity: safeParseInt(
          row.stockQuantity || row["Stock Quantity"] || row.quantity || "0"
        ),
        reorderPoint: row.reorderPoint
          ? safeParseInt(row.reorderPoint)
          : undefined,
        weight: row.weight ? safeParseFloat(row.weight) : undefined,
        category: row.category || row.Category || row.CATEGORY || "",
        tags: row.tags || row.Tags || row.TAGS || "",
        ageGroup: normalizeEnum(
          row.ageGroup || row["Age Group"] || row["age_group"] || ""
        ),
        stemDiscipline: normalizeEnum(
          row.stemDiscipline ||
            row["STEM Discipline"] ||
            row["stem_discipline"] ||
            ""
        ),
        productType: normalizeEnum(
          row.productType || row["Product Type"] || row["product_type"] || ""
        ),
        learningOutcomes:
          row.learningOutcomes ||
          row["Learning Outcomes"] ||
          row["learning_outcomes"] ||
          "",
        specialCategories:
          row.specialCategories ||
          row["Special Categories"] ||
          row["special_categories"] ||
          "",
        images: row.images || row.Images || row.IMAGES || "",
      };
    });
  };

  const validateProducts = (products: ProductRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    products.forEach((product, index) => {
      const rowNumber = index + 2;

      // Required fields
      if (!product.name.trim()) {
        errors.push({
          row: rowNumber,
          field: "name",
          message: "Product name is required",
        });
      } else if (product.name.length > 100) {
        errors.push({
          row: rowNumber,
          field: "name",
          message: "Name must be 100 characters or less",
        });
      }

      if (!product.description.trim()) {
        errors.push({
          row: rowNumber,
          field: "description",
          message: "Description is required",
        });
      } else if (product.description.length < 10) {
        errors.push({
          row: rowNumber,
          field: "description",
          message: "Description must be at least 10 characters",
        });
      }

      if (product.price <= 0) {
        errors.push({
          row: rowNumber,
          field: "price",
          message: "Price must be greater than 0",
        });
      }

      if (product.stockQuantity < 0) {
        errors.push({
          row: rowNumber,
          field: "stockQuantity",
          message: "Stock cannot be negative",
        });
      }

      // Enum validations
      const validAgeGroups = [
        "TODDLERS_1_3",
        "PRESCHOOL_3_5",
        "ELEMENTARY_6_8",
        "MIDDLE_SCHOOL_9_12",
        "TEENS_13_PLUS",
      ];
      if (
        product.ageGroup !== undefined &&
        !validAgeGroups.includes(product.ageGroup)
      ) {
        errors.push({
          row: rowNumber,
          field: "ageGroup",
          message: `Invalid age group "${product.ageGroup}"`,
        });
      }

      const validStemDisciplines = [
        "SCIENCE",
        "TECHNOLOGY",
        "ENGINEERING",
        "MATHEMATICS",
        "GENERAL",
      ];
      if (
        product.stemDiscipline !== undefined &&
        !validStemDisciplines.includes(product.stemDiscipline)
      ) {
        errors.push({
          row: rowNumber,
          field: "stemDiscipline",
          message: `Invalid STEM discipline "${product.stemDiscipline}"`,
        });
      }
    });

    return errors;
  };

  const updateProduct = (index: number, field: string, value: any) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Re-validate
    const errors = validateProducts(products);
    setValidationErrors(errors);
  };

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Fix validation errors first",
        description: "Please fix all errors before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const normalizedProducts = products.map(product => ({
        ...product,
        ageGroup: product.ageGroup === "" ? undefined : product.ageGroup,
        stemDiscipline:
          product.stemDiscipline === "" ? undefined : product.stemDiscipline,
        productType:
          product.productType === "" ? undefined : product.productType,
      }));

      const response = await fetch("/api/supplier/products/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products: normalizedProducts }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success > 0) {
        toast({
          title: "Upload successful! 🎉",
          description: `${result.success} products uploaded successfully. Pending admin approval.`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: "No products were uploaded successfully.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload error",
        description: "Failed to upload products. Please try again.",
        variant: "destructive",
      });
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Guide */}
      <SimplifiedCSVGuide />

      {/* Upload Zone */}
      <DragDropUploadZone
        onFileSelect={handleFileSelect}
        onClear={clearFile}
        selectedFile={file}
      />

      {/* Preview and Edit */}
      {products.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Product Preview ({products.length} products)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Click any cell to edit. Fix errors before uploading.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFile}
                  disabled={isUploading}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || validationErrors.length > 0}
                  className="min-w-[140px]"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Products
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-center text-muted-foreground">
                  Uploading products...
                </p>
              </div>
            )}

            <InlineTableEditor
              products={products}
              validationErrors={validationErrors}
              onUpdateProduct={updateProduct}
            />
          </CardContent>
        </Card>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Alert
          variant={uploadResult.failed === 0 ? "default" : "destructive"}
          className="bg-green-50 border-green-200 dark:bg-green-950/20"
        >
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Upload completed:</strong> {uploadResult.success}{" "}
            successful, {uploadResult.failed} failed. Products are pending admin
            approval.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
