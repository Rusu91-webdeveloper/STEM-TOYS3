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
  RefreshCw
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
  category?: string;
  tags?: string;
  ageGroup?: string;
  stemDiscipline?: string;
  productType?: string;
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

export function SupplierBulkUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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

    // Parse the file
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      const data = await readFile(file);
      const parsedProducts = parseProducts(data);
      setProducts(parsedProducts);
      
      // Validate the parsed data
      const errors = validateProducts(parsedProducts);
      setValidationErrors(errors);

      if (errors.length > 0) {
        toast({
          title: "Validation errors found",
          description: `${errors.length} validation errors found. Please review and fix them before uploading.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File parsed successfully",
          description: `${parsedProducts.length} products found and validated.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: "Failed to parse the uploaded file. Please check the format.",
        variant: "destructive",
      });
      console.error("Error parsing file:", error);
    }
  };

  const readFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("No data read from file"));
            return;
          }

          if (file.type === 'text/csv') {
            // Handle CSV
            const csv = data as string;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const rows = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });
            resolve(rows);
          } else {
            // Handle Excel
            const workbook = XLSX.read(data, { type: 'binary' });
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

      if (file.type === 'text/csv') {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const parseProducts = (data: any[]): ProductRow[] => {
    return data.map((row, index) => ({
      name: row.name || row.Name || row.NAME || '',
      description: row.description || row.Description || row.DESCRIPTION || '',
      price: parseFloat(row.price || row.Price || row.PRICE || '0'),
      compareAtPrice: row.compareAtPrice || row['Compare At Price'] || row['compare_at_price'] ? parseFloat(row.compareAtPrice || row['Compare At Price'] || row['compare_at_price'] || '0') : undefined,
      sku: row.sku || row.SKU || row.Sku || '',
      stockQuantity: parseInt(row.stockQuantity || row['Stock Quantity'] || row['stock_quantity'] || row.quantity || '0'),
      reorderPoint: row.reorderPoint || row['Reorder Point'] || row['reorder_point'] ? parseInt(row.reorderPoint || row['Reorder Point'] || row['reorder_point'] || '0') : undefined,
      weight: row.weight || row.Weight || row.WEIGHT ? parseFloat(row.weight || row.Weight || row.WEIGHT || '0') : undefined,
      category: row.category || row.Category || row.CATEGORY || '',
      tags: row.tags || row.Tags || row.TAGS || '',
      ageGroup: row.ageGroup || row['Age Group'] || row['age_group'] || '',
      stemDiscipline: row.stemDiscipline || row['STEM Discipline'] || row['stem_discipline'] || '',
      productType: row.productType || row['Product Type'] || row['product_type'] || '',
      learningOutcomes: row.learningOutcomes || row['Learning Outcomes'] || row['learning_outcomes'] || '',
      specialCategories: row.specialCategories || row['Special Categories'] || row['special_categories'] || '',
      images: row.images || row.Images || row.IMAGES || '',
    }));
  };

  const validateProducts = (products: ProductRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    products.forEach((product, index) => {
      const rowNumber = index + 2; // +2 because of 0-based index and header row

      // Required fields
      if (!product.name.trim()) {
        errors.push({ row: rowNumber, field: 'name', message: 'Product name is required' });
      }

      if (!product.description.trim()) {
        errors.push({ row: rowNumber, field: 'description', message: 'Description is required' });
      }

      if (product.description.length < 10) {
        errors.push({ row: rowNumber, field: 'description', message: 'Description must be at least 10 characters' });
      }

      if (product.price <= 0) {
        errors.push({ row: rowNumber, field: 'price', message: 'Price must be greater than 0' });
      }

      if (product.stockQuantity < 0) {
        errors.push({ row: rowNumber, field: 'stockQuantity', message: 'Stock quantity cannot be negative' });
      }

      // Optional field validations
      if (product.compareAtPrice && product.compareAtPrice <= 0) {
        errors.push({ row: rowNumber, field: 'compareAtPrice', message: 'Compare at price must be greater than 0' });
      }

      if (product.reorderPoint && product.reorderPoint < 0) {
        errors.push({ row: rowNumber, field: 'reorderPoint', message: 'Reorder point cannot be negative' });
      }

      if (product.weight && product.weight < 0) {
        errors.push({ row: rowNumber, field: 'weight', message: 'Weight cannot be negative' });
      }

      // Validate enums
      const validAgeGroups = ['TODDLER', 'PRESCHOOL', 'SCHOOL_AGE', 'TEEN', 'ALL_AGES'];
      if (product.ageGroup && !validAgeGroups.includes(product.ageGroup.toUpperCase())) {
        errors.push({ row: rowNumber, field: 'ageGroup', message: `Invalid age group. Must be one of: ${validAgeGroups.join(', ')}` });
      }

      const validStemDisciplines = ['SCIENCE', 'TECHNOLOGY', 'ENGINEERING', 'MATH', 'GENERAL'];
      if (product.stemDiscipline && !validStemDisciplines.includes(product.stemDiscipline.toUpperCase())) {
        errors.push({ row: rowNumber, field: 'stemDiscipline', message: `Invalid STEM discipline. Must be one of: ${validStemDisciplines.join(', ')}` });
      }

      const validProductTypes = ['ROBOTICS', 'PUZZLES', 'CONSTRUCTION_SETS', 'EXPERIMENT_KITS', 'BOARD_GAMES'];
      if (product.productType && !validProductTypes.includes(product.productType.toUpperCase())) {
        errors.push({ row: rowNumber, field: 'productType', message: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}` });
      }
    });

    return errors;
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Sample STEM Toy',
        description: 'An educational toy that teaches children about robotics and programming',
        price: 29.99,
        compareAtPrice: 39.99,
        sku: 'STEM-001',
        stockQuantity: 100,
        reorderPoint: 10,
        weight: 0.5,
        category: 'Robotics',
        tags: 'educational,robotics,programming',
        ageGroup: 'SCHOOL_AGE',
        stemDiscipline: 'TECHNOLOGY',
        productType: 'ROBOTICS',
        learningOutcomes: 'Problem solving,Logical thinking,Programming basics',
        specialCategories: 'NEW_ARRIVALS,BEST_SELLERS',
        images: 'https://example.com/image1.jpg,https://example.com/image2.jpg'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    
    // Add a second sheet with field descriptions
    const fieldDescriptions = [
      { Field: 'name', Required: 'Yes', Description: 'Product name (max 100 characters)' },
      { Field: 'description', Required: 'Yes', Description: 'Product description (min 10 characters, max 1000)' },
      { Field: 'price', Required: 'Yes', Description: 'Product price in EUR (must be > 0)' },
      { Field: 'compareAtPrice', Required: 'No', Description: 'Original price for comparison' },
      { Field: 'sku', Required: 'No', Description: 'Stock keeping unit' },
      { Field: 'stockQuantity', Required: 'Yes', Description: 'Available stock quantity' },
      { Field: 'reorderPoint', Required: 'No', Description: 'Reorder point for inventory management' },
      { Field: 'weight', Required: 'No', Description: 'Product weight in kg' },
      { Field: 'category', Required: 'No', Description: 'Product category name' },
      { Field: 'tags', Required: 'No', Description: 'Comma-separated tags' },
      { Field: 'ageGroup', Required: 'No', Description: 'TODDLER, PRESCHOOL, SCHOOL_AGE, TEEN, ALL_AGES' },
      { Field: 'stemDiscipline', Required: 'No', Description: 'SCIENCE, TECHNOLOGY, ENGINEERING, MATH, GENERAL' },
      { Field: 'productType', Required: 'No', Description: 'ROBOTICS, PUZZLES, CONSTRUCTION_SETS, EXPERIMENT_KITS, BOARD_GAMES' },
      { Field: 'learningOutcomes', Required: 'No', Description: 'Comma-separated learning outcomes' },
      { Field: 'specialCategories', Required: 'No', Description: 'NEW_ARRIVALS, BEST_SELLERS, GIFT_IDEAS, SALE_ITEMS' },
      { Field: 'images', Required: 'No', Description: 'Comma-separated image URLs' }
    ];

    const ws2 = XLSX.utils.json_to_sheet(fieldDescriptions);
    XLSX.utils.book_append_sheet(wb, ws2, 'Field Descriptions');

    XLSX.writeFile(wb, 'product-upload-template.xlsx');
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
      const response = await fetch('/api/supplier/products/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
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
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/supplier/products")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">Bulk Upload Products</h2>
            <p className="text-muted-foreground">
              Upload multiple products using CSV or Excel files
            </p>
          </div>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload your product file</h3>
              <p className="text-muted-foreground mb-4">
                Supported formats: CSV, Excel (.xls, .xlsx)
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {products.length} products found
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetUpload}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Validation Summary */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {validationErrors.length} validation errors found. Please review and fix them before uploading.
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading products...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <Alert variant={uploadResult.failed === 0 ? "default" : "destructive"}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Upload completed: {uploadResult.success} successful, {uploadResult.failed} failed
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || validationErrors.length > 0}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Products
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Table */}
      {showPreview && products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Preview ({products.length} products)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">Stock</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 10).map((product, index) => {
                    const hasErrors = validationErrors.some(error => error.row === index + 2);
                    return (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{product.name}</td>
                        <td className="p-2">€{product.price}</td>
                        <td className="p-2">{product.stockQuantity}</td>
                        <td className="p-2">{product.category}</td>
                        <td className="p-2">
                          {hasErrors ? (
                            <Badge variant="destructive">Has Errors</Badge>
                          ) : (
                            <Badge variant="default">Valid</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {products.length > 10 && (
                    <tr>
                      <td colSpan={5} className="p-2 text-center text-muted-foreground">
                        ... and {products.length - 10} more products
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Errors ({validationErrors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      Row {error.row}, Field: {error.field}
                    </p>
                    <p className="text-sm text-red-600">{error.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
