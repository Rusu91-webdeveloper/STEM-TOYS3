"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
  FileSpreadsheet,
  FileX,
  Eye,
  EyeOff,
  RefreshCw,
  Users,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ProductRow {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stockQuantity: number;
  reorderPoint?: number;
  weight?: number;
  category: string;
  tags?: string;
  ageGroup?: string;
  stemDiscipline?: string;
  productType?: string;
  learningOutcomes?: string;
  specialCategories?: string;
  images?: string;
  isActive?: boolean;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  romanianCompetencies?: string;
  romanianCurriculumAlignment?: string;
  romanianEducationalLevel?: string;
  romanianSubjectAreas?: string;
  romanianMinistryApproval?: boolean;
  romanianEducationalCertification?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: ValidationError[];
  warnings: Array<{ row: number; field: string; message: string }>;
  processingTime: number;
  summary: {
    total: number;
    success: number;
    failed: number;
    successRate: string;
    processingTime: string;
  };
}

export function AdminBulkUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV or Excel file (.csv, .xls, .xlsx)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadProgress(0);

    // Parse file
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Convert to ProductRow format
        const parsedProducts: ProductRow[] = jsonData.map(
          (row: any, index: number) => {
            const sku = String(row.sku ?? "").trim();
            const priceRaw = row.price_b2c ?? row.price ?? "";
            const priceParsed = parseFloat(String(priceRaw).trim());

            return {
              name: row.name || "",
              description: row.description || "",
              price: Number.isFinite(priceParsed) ? priceParsed : 0,
              compareAtPrice: row.compareAtPrice
                ? parseFloat(row.compareAtPrice)
                : undefined,
              sku,
              stockQuantity: parseInt(row.stockQuantity) || 0,
            reorderPoint: row.reorderPoint
              ? parseInt(row.reorderPoint)
              : undefined,
            weight: row.weight ? parseFloat(row.weight) : undefined,
            category: row.category || "",
            tags: row.tags || "",
            ageGroup: row.ageGroup || "",
            stemDiscipline: row.stemDiscipline || "GENERAL",
            productType: row.productType || "",
            learningOutcomes: row.learningOutcomes || "",
            specialCategories: row.specialCategories || "",
            images: row.images || "",
            isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
            featured:
              row.featured !== undefined ? Boolean(row.featured) : false,
            metaTitle: row.metaTitle || "",
            metaDescription: row.metaDescription || "",
            metaKeywords: row.metaKeywords || "",
            romanianCompetencies: row.romanianCompetencies || "",
            romanianCurriculumAlignment: row.romanianCurriculumAlignment || "",
            romanianEducationalLevel: row.romanianEducationalLevel || "",
            romanianSubjectAreas: row.romanianSubjectAreas || "",
            romanianMinistryApproval:
              row.romanianMinistryApproval !== undefined
                ? Boolean(row.romanianMinistryApproval)
                : false,
            romanianEducationalCertification:
              row.romanianEducationalCertification || "",
            };
          }
        );

        setProducts(parsedProducts);
        validateProducts(parsedProducts);
      } catch (error) {
        toast({
          title: "File parsing error",
          description:
            "Failed to parse the uploaded file. Please check the format.",
          variant: "destructive",
        });
        console.error("File parsing error:", error);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const validateProducts = (products: ProductRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    products.forEach((product, index) => {
      const row = index + 1;
      const rowSku = String(product.sku ?? "").trim();
      const rowErrors: ValidationError[] = [];

      // Required fields
      if (!product.name || product.name.trim().length === 0) {
        const error = {
          row,
          field: "name",
          message: "Product name is required",
        };
        errors.push(error);
        rowErrors.push(error);
      }

      if (!product.description || product.description.trim().length < 10) {
        const error = {
          row,
          field: "description",
          message: "Description must be at least 10 characters",
        };
        errors.push(error);
        rowErrors.push(error);
      }

      if (!product.price || product.price <= 0) {
        const error = {
          row,
          field: "price",
          message: "Price must be greater than 0",
        };
        errors.push(error);
        rowErrors.push(error);
      }

      if (!product.category || product.category.trim().length === 0) {
        const error = {
          row,
          field: "category",
          message: "Category is required",
        };
        errors.push(error);
        rowErrors.push(error);
      }

      if (product.stockQuantity < 0) {
        const error = {
          row,
          field: "stockQuantity",
          message: "Stock quantity cannot be negative",
        };
        errors.push(error);
        rowErrors.push(error);
      }

      // Validate categorization fields
      if (product.ageGroup) {
        const validAgeGroups = [
          "TODDLERS_1_3",
          "PRESCHOOL_3_5",
          "ELEMENTARY_6_8",
          "MIDDLE_SCHOOL_9_12",
          "TEENS_13_PLUS",
        ];
        if (!validAgeGroups.includes(product.ageGroup)) {
          const error = {
            row,
            field: "ageGroup",
            message: "Invalid age group",
            value: product.ageGroup,
          };
          errors.push(error);
          rowErrors.push(error);
        }
      }

      if (product.stemDiscipline) {
        const validDisciplines = [
          "SCIENCE",
          "TECHNOLOGY",
          "ENGINEERING",
          "MATHEMATICS",
          "GENERAL",
        ];
        if (!validDisciplines.includes(product.stemDiscipline)) {
          const error = {
            row,
            field: "stemDiscipline",
            message: "Invalid STEM discipline",
            value: product.stemDiscipline,
          };
          errors.push(error);
          rowErrors.push(error);
        }
      }

      if (product.productType) {
        const validTypes = [
          "ROBOTICS",
          "PUZZLES",
          "CONSTRUCTION_SETS",
          "EXPERIMENT_KITS",
          "BOARD_GAMES",
        ];
        if (!validTypes.includes(product.productType)) {
          const error = {
            row,
            field: "productType",
            message: "Invalid product type",
            value: product.productType,
          };
          errors.push(error);
          rowErrors.push(error);
        }
      }

      if (product.romanianEducationalLevel) {
        const validLevels = [
          "PRESCOLAR",
          "PRIMAR",
          "GIMNAZIAL",
          "LICEAL",
          "UNIVERSITAR",
        ];
        if (!validLevels.includes(product.romanianEducationalLevel)) {
          const error = {
            row,
            field: "romanianEducationalLevel",
            message: "Invalid Romanian educational level",
            value: product.romanianEducationalLevel,
          };
          errors.push(error);
          rowErrors.push(error);
        }
      }

      if (rowErrors.length > 0) {
        const reasons = rowErrors
          .map(error => `${error.field}: ${error.message}`)
          .join("; ");
        console.warn(
          `Skipping row ${row} (SKU: ${rowSku || "N/A"}): ${reasons}`
        );
      }
    });

    setValidationErrors(errors);
    return errors;
  };

  const downloadTemplate = () => {
    // Create sample data for the template
    const sampleData = [
      {
        name: "RoboBot Coding Kit",
        description:
          "An interactive robotics kit that teaches children programming fundamentals through hands-on building and coding activities.",
        price: 299.99,
        compareAtPrice: 349.99,
        sku: "ROBOT-001",
        stockQuantity: 50,
        reorderPoint: 10,
        weight: 2.5,
        category: "Robotics",
        tags: "programming,robotics,STEM,educational",
        ageGroup: "ELEMENTARY_6_8",
        stemDiscipline: "TECHNOLOGY",
        productType: "ROBOTICS",
        learningOutcomes: "PROBLEM_SOLVING,LOGIC,CRITICAL_THINKING",
        specialCategories: "NEW_ARRIVALS,BEST_SELLERS",
        images: "https://example.com/robot1.jpg,https://example.com/robot2.jpg",
        isActive: true,
        featured: false,
        metaTitle: "RoboBot Coding Kit - Learn Programming with Robotics",
        metaDescription:
          "Interactive robotics kit for children to learn programming through hands-on activities. Perfect for STEM education.",
        metaKeywords: "robotics,programming,STEM,educational toys,coding",
        romanianCompetencies: "Programare,Logica,Rezolvare probleme",
        romanianCurriculumAlignment: "Matematica,Informatica",
        romanianEducationalLevel: "PRIMAR",
        romanianSubjectAreas: "Matematica,Informatica,Tehnologie",
        romanianMinistryApproval: true,
        romanianEducationalCertification: "Certificat MECTS",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, "Products");

    // Add a second sheet with field descriptions
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
        Description: "Product price in RON (must be > 0)",
      },
      {
        Field: "compareAtPrice",
        Required: "No",
        Description: "Original price for comparison (must be > price)",
      },
      {
        Field: "sku",
        Required: "No",
        Description: "Stock Keeping Unit (unique identifier)",
      },
      {
        Field: "stockQuantity",
        Required: "Yes",
        Description: "Available stock quantity (integer, >= 0)",
      },
      {
        Field: "reorderPoint",
        Required: "No",
        Description: "Minimum stock level for reordering",
      },
      {
        Field: "weight",
        Required: "No",
        Description: "Product weight in kg",
      },
      {
        Field: "category",
        Required: "Yes",
        Description: "Product category (will be created if doesn't exist)",
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
        Description: "SCIENCE, TECHNOLOGY, ENGINEERING, MATHEMATICS, GENERAL",
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
        Description:
          "Comma-separated: PROBLEM_SOLVING, CREATIVITY, CRITICAL_THINKING, MOTOR_SKILLS, LOGIC, ANALYTICAL_THINKING, COLLABORATION, COMMUNICATION",
      },
      {
        Field: "specialCategories",
        Required: "No",
        Description:
          "Comma-separated: NEW_ARRIVALS, BEST_SELLERS, GIFT_IDEAS, SALE_ITEMS",
      },
      {
        Field: "images",
        Required: "No",
        Description: "Comma-separated image URLs",
      },
      {
        Field: "isActive",
        Required: "No",
        Description: "true/false (default: true)",
      },
      {
        Field: "featured",
        Required: "No",
        Description: "true/false (default: false)",
      },
      {
        Field: "metaTitle",
        Required: "No",
        Description: "SEO title (defaults to product name)",
      },
      {
        Field: "metaDescription",
        Required: "No",
        Description: "SEO description (defaults to truncated description)",
      },
      {
        Field: "metaKeywords",
        Required: "No",
        Description: "Comma-separated SEO keywords",
      },
      {
        Field: "romanianCompetencies",
        Required: "No",
        Description: "Comma-separated Romanian competencies",
      },
      {
        Field: "romanianCurriculumAlignment",
        Required: "No",
        Description: "Comma-separated curriculum alignments",
      },
      {
        Field: "romanianEducationalLevel",
        Required: "No",
        Description: "PRESCOLAR, PRIMAR, GIMNAZIAL, LICEAL, UNIVERSITAR",
      },
      {
        Field: "romanianSubjectAreas",
        Required: "No",
        Description: "Comma-separated subject areas",
      },
      {
        Field: "romanianMinistryApproval",
        Required: "No",
        Description: "true/false (default: false)",
      },
      {
        Field: "romanianEducationalCertification",
        Required: "No",
        Description: "Educational certification details",
      },
    ];

    const ws2 = XLSX.utils.json_to_sheet(fieldDescriptions);
    XLSX.utils.book_append_sheet(wb, ws2, "Field Descriptions");

    XLSX.writeFile(wb, "admin-product-upload-template.xlsx");
  };

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Validation errors",
        description: "Please fix all validation errors before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success > 0) {
        toast({
          title: "Upload successful",
          description: `Successfully uploaded ${result.success} products. ${result.failed} failed.`,
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

  const resetUpload = () => {
    setFile(null);
    setFileName("");
    setProducts([]);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bulk Upload Products
          </h2>
          <p className="text-muted-foreground">
            Upload multiple products at once using CSV or Excel files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Admin Access
          </Badge>
        </div>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download the Excel template to see the required format and field
              descriptions.
            </p>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Upload your file</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your CSV or Excel file here, or click to
                    browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
            </div>

            {fileName && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{fileName}</span>
                  <Badge variant="secondary">{products.length} products</Badge>
                </div>
                <Button onClick={resetUpload} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Validation Errors ({validationErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Row {error.row}</strong> - {error.field}:{" "}
                    {error.message}
                    {error.value && (
                      <span className="block text-xs mt-1">
                        Value: {error.value}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Product Preview
              </div>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </CardTitle>
          </CardHeader>
          {showPreview && (
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {products.slice(0, 5).map((product, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{product.category}</Badge>
                          <span className="font-medium">
                            RON {product.price}
                          </span>
                          <span className="text-muted-foreground">
                            Stock: {product.stockQuantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {products.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {products.length - 5} more products
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Upload Actions */}
      {products.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Ready to upload {products.length} products
                </p>
                <p className="text-xs text-muted-foreground">
                  {validationErrors.length > 0
                    ? `${validationErrors.length} validation errors need to be fixed`
                    : "All products are valid and ready for upload"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={resetUpload} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || validationErrors.length > 0}
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
              <div className="mt-4">
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResult.summary.success}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Successful
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {uploadResult.summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {uploadResult.summary.successRate}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Success Rate
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {uploadResult.summary.processingTime}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Processing Time
                  </div>
                </div>
              </div>

              {/* Errors */}
              {uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Row {error.row}</strong> - {error.field}:{" "}
                          {error.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {uploadResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-yellow-600">Warnings:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResult.warnings.map((warning, index) => (
                      <Alert key={index} variant="default">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Row {warning.row}</strong> - {warning.field}:{" "}
                          {warning.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => router.push("/admin/products")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
