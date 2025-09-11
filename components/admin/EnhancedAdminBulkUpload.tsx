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
  Bot,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { AIEnhancementToggle } from "./AIEnhancementToggle";
import { AIEnhancementProgress } from "./AIEnhancementProgress";
import { AIEnhancementPreview } from "./AIEnhancementPreview";
import {
  type BasicProduct,
  type EnhancedProduct,
  type EnhancementOptions,
  type EnhancementProgress,
} from "@/lib/ai";

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
  aiEnhancement?: {
    enabled: boolean;
    summary?: {
      total: number;
      successful: number;
      failed: number;
      successRate: string;
      processingTime: string;
    };
    errors?: Array<{ product: string; error: string }>;
    reason?: string;
  };
}

type UploadStep =
  | "upload"
  | "ai-enhancement"
  | "preview"
  | "uploading"
  | "complete";

export function EnhancedAdminBulkUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File and product state
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // AI Enhancement state
  const [aiEnhancementEnabled, setAIEnhancementEnabled] = useState(false);
  const [aiEnhancementOptions, setAIEnhancementOptions] =
    useState<EnhancementOptions>({
      includeRomanianOptimization: true,
      includeSEOMetadata: true,
      includeLearningOutcomes: true,
      includeAgeGroup: true,
      includeStemDiscipline: true,
      includeProductType: true,
    });
  const [enhancedProducts, setEnhancedProducts] = useState<EnhancedProduct[]>(
    []
  );
  const [enhancementProgress, setEnhancementProgress] =
    useState<EnhancementProgress | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showEnhancementPreview, setShowEnhancementPreview] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>("upload");

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
    setCurrentStep("upload");

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
          (row: any, index: number) => ({
            name: row.name || "",
            description: row.description || "",
            price: parseFloat(row.price) || 0,
            compareAtPrice: row.compareAtPrice
              ? parseFloat(row.compareAtPrice)
              : undefined,
            sku: row.sku || "",
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
          })
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

      // Required fields
      if (!product.name || product.name.trim().length === 0) {
        errors.push({
          row,
          field: "name",
          message: "Product name is required",
        });
      }

      if (!product.description || product.description.trim().length < 10) {
        errors.push({
          row,
          field: "description",
          message: "Description must be at least 10 characters",
        });
      }

      if (!product.price || product.price <= 0) {
        errors.push({
          row,
          field: "price",
          message: "Price must be greater than 0",
        });
      }

      if (!product.category || product.category.trim().length === 0) {
        errors.push({
          row,
          field: "category",
          message: "Category is required",
        });
      }

      if (product.stockQuantity < 0) {
        errors.push({
          row,
          field: "stockQuantity",
          message: "Stock quantity cannot be negative",
        });
      }
    });

    setValidationErrors(errors);
    return errors;
  };

  const handleAIEnhancement = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Validation errors",
        description:
          "Please fix all validation errors before enhancing with AI.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    setCurrentStep("ai-enhancement");

    // Initialize progress tracking
    const startTime = Date.now();
    setEnhancementProgress({
      total: products.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      startTime,
      estimatedTimeRemaining: undefined,
    });

    try {
      // Convert products to BasicProduct format
      const basicProducts: BasicProduct[] = products.map(product => ({
        name: product.name,
        price: product.price,
        category: product.category,
        images: product.images ? product.images.split(",") : [],
        description: product.description,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        weight: product.weight,
        tags: product.tags ? product.tags.split(",") : [],
      }));

      // Call AI enhancement API
      const response = await fetch("/api/admin/products/ai-enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: basicProducts,
          options: aiEnhancementOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "AI enhancement failed";
        const errorDetails = errorData.details || "";
        const errorHelp = errorData.help
          ? JSON.stringify(errorData.help, null, 2)
          : "";

        throw new Error(
          `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}${errorHelp ? `\n\nHelp:\n${errorHelp}` : ""}`
        );
      }

      const result = await response.json();
      setEnhancedProducts(result.enhancedProducts);

      // Update final progress
      setEnhancementProgress(prev =>
        prev
          ? {
              ...prev,
              processed: result.summary.total,
              successful: result.summary.successful,
              failed: result.summary.failed,
              errors: result.errors || [],
              estimatedTimeRemaining: 0,
            }
          : null
      );

      toast({
        title: "AI Enhancement Complete",
        description: `Successfully enhanced ${result.summary.successful} out of ${result.summary.total} products.`,
      });

      setCurrentStep("preview");
      setShowEnhancementPreview(true);
    } catch (error) {
      // Update progress with error
      setEnhancementProgress(prev =>
        prev
          ? {
              ...prev,
              processed: products.length,
              failed: products.length,
              errors: [
                ...(prev.errors || []),
                {
                  product: "All products",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              ],
              estimatedTimeRemaining: 0,
            }
          : null
      );

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "AI Enhancement Failed",
        description:
          errorMessage.length > 100
            ? `${errorMessage.substring(0, 100)}...`
            : errorMessage,
        variant: "destructive",
      });
      console.error("AI enhancement error:", error);
      setCurrentStep("upload");
    } finally {
      setIsEnhancing(false);
    }
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
    setCurrentStep("uploading");

    try {
      const requestBody: any = {
        products: products,
      };

      // Add AI enhancement data if available
      if (aiEnhancementEnabled && enhancedProducts.length > 0) {
        requestBody.aiEnhancement = {
          enabled: true,
          options: aiEnhancementOptions,
        };
      }

      const response = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

      setCurrentStep("complete");
    } catch (error) {
      toast({
        title: "Upload error",
        description: "Failed to upload products. Please try again.",
        variant: "destructive",
      });
      console.error("Upload error:", error);
      setCurrentStep("upload");
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
    setAIEnhancementEnabled(false);
    setEnhancedProducts([]);
    setEnhancementProgress(null);
    setIsEnhancing(false);
    setShowEnhancementPreview(false);
    setCurrentPreviewIndex(0);
    setCurrentStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    XLSX.writeFile(wb, "admin-product-upload-template.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            AI-Enhanced Bulk Upload Products
          </h2>
          <p className="text-muted-foreground">
            Upload multiple products at once with AI-powered enhancement for
            descriptions, SEO, and Romanian market optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Admin Access
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            AI Enhanced
          </Badge>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {["upload", "ai-enhancement", "preview", "uploading", "complete"].map(
          (step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step
                    ? "bg-blue-600 text-white"
                    : index <
                        [
                          "upload",
                          "ai-enhancement",
                          "preview",
                          "uploading",
                          "complete",
                        ].indexOf(currentStep)
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  currentStep === step ? "font-medium" : "text-muted-foreground"
                }`}
              >
                {step === "upload"
                  ? "Upload File"
                  : step === "ai-enhancement"
                    ? "AI Enhancement"
                    : step === "preview"
                      ? "Preview"
                      : step === "uploading"
                        ? "Uploading"
                        : "Complete"}
              </span>
              {index < 4 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    index <
                    [
                      "upload",
                      "ai-enhancement",
                      "preview",
                      "uploading",
                      "complete",
                    ].indexOf(currentStep)
                      ? "bg-green-600"
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
          )
        )}
      </div>

      {/* Template Download */}
      {currentStep === "upload" && (
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
      )}

      {/* File Upload */}
      {currentStep === "upload" && (
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
                    <Badge variant="secondary">
                      {products.length} products
                    </Badge>
                  </div>
                  <Button onClick={resetUpload} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Enhancement Toggle */}
      {products.length > 0 && currentStep === "upload" && (
        <AIEnhancementToggle
          enabled={aiEnhancementEnabled}
          onToggle={setAIEnhancementEnabled}
          options={aiEnhancementOptions}
          onOptionsChange={setAIEnhancementOptions}
        />
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && currentStep === "upload" && (
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

      {/* AI Enhancement Progress */}
      {isEnhancing && enhancementProgress && (
        <AIEnhancementProgress
          progress={enhancementProgress}
          onCancel={() => {
            setIsEnhancing(false);
            setCurrentStep("upload");
          }}
        />
      )}

      {/* AI Enhancement Preview */}
      {showEnhancementPreview &&
        enhancedProducts.length > 0 &&
        currentStep === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Enhancement Preview</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Product {currentPreviewIndex + 1} of {enhancedProducts.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))
                  }
                  disabled={currentPreviewIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPreviewIndex(
                      Math.min(
                        enhancedProducts.length - 1,
                        currentPreviewIndex + 1
                      )
                    )
                  }
                  disabled={currentPreviewIndex === enhancedProducts.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>

            <AIEnhancementPreview
              originalProduct={products[currentPreviewIndex]}
              enhancedProduct={enhancedProducts[currentPreviewIndex]}
              onAccept={() => {
                // Accept the enhancement
                if (currentPreviewIndex < enhancedProducts.length - 1) {
                  setCurrentPreviewIndex(currentPreviewIndex + 1);
                } else {
                  setShowEnhancementPreview(false);
                  setCurrentStep("upload");
                }
              }}
              onReject={() => {
                // Reject the enhancement
                if (currentPreviewIndex < enhancedProducts.length - 1) {
                  setCurrentPreviewIndex(currentPreviewIndex + 1);
                } else {
                  setShowEnhancementPreview(false);
                  setCurrentStep("upload");
                }
              }}
              onEdit={(field, value) => {
                // Edit the enhancement
                console.log("Edit enhancement:", field, value);
              }}
            />
          </div>
        )}

      {/* Upload Actions */}
      {products.length > 0 && currentStep === "upload" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Ready to upload {products.length} products
                  {aiEnhancementEnabled && " with AI enhancement"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {validationErrors.length > 0
                    ? `${validationErrors.length} validation errors need to be fixed`
                    : aiEnhancementEnabled
                      ? "All products are valid. AI enhancement will be applied before upload."
                      : "All products are valid and ready for upload"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={resetUpload} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                {aiEnhancementEnabled ? (
                  <Button
                    onClick={handleAIEnhancement}
                    disabled={isEnhancing || validationErrors.length > 0}
                  >
                    {isEnhancing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                ) : (
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
                )}
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
      {uploadResult && currentStep === "complete" && (
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

              {/* AI Enhancement Results */}
              {uploadResult.aiEnhancement && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    AI Enhancement Results
                  </h4>
                  {uploadResult.aiEnhancement.enabled ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 dark:text-blue-200">
                          Enhanced:
                        </span>
                        <span className="ml-1 font-medium">
                          {uploadResult.aiEnhancement.summary?.successful}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-200">
                          Failed:
                        </span>
                        <span className="ml-1 font-medium">
                          {uploadResult.aiEnhancement.summary?.failed}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-200">
                          Success Rate:
                        </span>
                        <span className="ml-1 font-medium">
                          {uploadResult.aiEnhancement.summary?.successRate}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-200">
                          Time:
                        </span>
                        <span className="ml-1 font-medium">
                          {uploadResult.aiEnhancement.summary?.processingTime}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-blue-700 dark:text-blue-200 text-sm">
                      {uploadResult.aiEnhancement.reason}
                    </p>
                  )}
                </div>
              )}

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
