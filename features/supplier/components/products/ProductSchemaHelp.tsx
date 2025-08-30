"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Copy, Check, BookOpen, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ProductTemplateGenerator } from "./ProductTemplateGenerator";

interface FieldDefinition {
  name: string;
  required: boolean;
  type: string;
  description: string;
  example: string;
  validation: string;
  enumValues?: string[];
}

const productFields: FieldDefinition[] = [
  {
    name: "name",
    required: true,
    type: "string",
    description: "Product name (displayed to customers)",
    example: "RoboBot Coding Kit",
    validation: "1-100 characters, unique per supplier",
  },
  {
    name: "description",
    required: true,
    type: "string",
    description: "Detailed product description",
    example: "An interactive robot that teaches children programming basics through fun games and challenges.",
    validation: "10-1000 characters",
  },
  {
    name: "price",
    required: true,
    type: "number",
    description: "Product price in EUR",
    example: "89.99",
    validation: "Must be greater than 0",
  },
  {
    name: "compareAtPrice",
    required: false,
    type: "number",
    description: "Original price for comparison (shows as 'was' price)",
    example: "119.99",
    validation: "Optional, must be greater than price if provided",
  },
  {
    name: "sku",
    required: false,
    type: "string",
    description: "Stock Keeping Unit (unique product identifier)",
    example: "ROBO-001",
    validation: "Optional, must be unique if provided",
  },
  {
    name: "stockQuantity",
    required: true,
    type: "number",
    description: "Available stock quantity",
    example: "45",
    validation: "Must be 0 or greater",
  },
  {
    name: "reorderPoint",
    required: false,
    type: "number",
    description: "Stock level that triggers reorder notification",
    example: "10",
    validation: "Optional, must be 0 or greater",
  },
  {
    name: "weight",
    required: false,
    type: "number",
    description: "Product weight in kilograms",
    example: "1.2",
    validation: "Optional, must be 0 or greater",
  },
  {
    name: "category",
    required: false,
    type: "string",
    description: "Product category name (will be created if doesn't exist)",
    example: "Robotics",
    validation: "Optional, will create category if new",
  },
  {
    name: "tags",
    required: false,
    type: "string",
    description: "Comma-separated tags for product classification",
    example: "educational,programming,interactive,app",
    validation: "Optional, comma-separated values",
  },
  {
    name: "ageGroup",
    required: false,
    type: "enum",
    description: "Target age group for the product",
    example: "ELEMENTARY_6_8",
    validation: "Must be one of the predefined values",
    enumValues: [
      "TODDLERS_1_3",
      "PRESCHOOL_3_5", 
      "ELEMENTARY_6_8",
      "MIDDLE_SCHOOL_9_12",
      "TEENS_13_PLUS"
    ],
  },
  {
    name: "stemDiscipline",
    required: false,
    type: "enum",
    description: "Primary STEM discipline",
    example: "TECHNOLOGY",
    validation: "Must be one of the predefined values",
    enumValues: [
      "SCIENCE",
      "TECHNOLOGY",
      "ENGINEERING", 
      "MATHEMATICS",
      "GENERAL"
    ],
  },
  {
    name: "productType",
    required: false,
    type: "enum",
    description: "Type of STEM product",
    example: "ROBOTICS",
    validation: "Must be one of the predefined values",
    enumValues: [
      "ROBOTICS",
      "PUZZLES",
      "CONSTRUCTION_SETS",
      "EXPERIMENT_KITS",
      "BOARD_GAMES"
    ],
  },
  {
    name: "learningOutcomes",
    required: false,
    type: "string",
    description: "Comma-separated learning outcomes",
    example: "PROBLEM_SOLVING,LOGIC,CRITICAL_THINKING",
    validation: "Optional, comma-separated values from predefined list",
  },
  {
    name: "specialCategories",
    required: false,
    type: "string",
    description: "Comma-separated special categories",
    example: "NEW_ARRIVALS",
    validation: "Optional, comma-separated values from predefined list",
  },
  {
    name: "images",
    required: false,
    type: "string",
    description: "Comma-separated image URLs",
    example: "https://example.com/image1.jpg,https://example.com/image2.jpg",
    validation: "Optional, comma-separated URLs",
  },
];

const learningOutcomesOptions = [
  "PROBLEM_SOLVING",
  "CREATIVITY", 
  "CRITICAL_THINKING",
  "MOTOR_SKILLS",
  "LOGIC"
];

const specialCategoriesOptions = [
  "NEW_ARRIVALS",
  "BEST_SELLERS",
  "GIFT_IDEAS", 
  "SALE_ITEMS"
];

export function ProductSchemaHelp() {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const templateGenerator = ProductTemplateGenerator({});

  const downloadCSVTemplate = () => {
    templateGenerator.generateCSVTemplate();
  };

  const downloadExcelTemplate = () => {
    templateGenerator.generateEnhancedExcelTemplate();
  };

  const copyFieldName = (fieldName: string) => {
    navigator.clipboard.writeText(fieldName);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    
    toast({
      title: "Field name copied",
      description: `${fieldName} has been copied to clipboard.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Schema Documentation</h2>
          <p className="text-muted-foreground">
            Complete guide for creating products via single form or bulk upload
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={downloadCSVTemplate} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>
          <Button onClick={downloadExcelTemplate} variant="outline" size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Excel Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fields">Field Definitions</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="validation">Validation Rules</TabsTrigger>
          <TabsTrigger value="api">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Required fields:</strong> name, description, price, stockQuantity
              <br />
              <strong>Optional fields:</strong> All other fields are optional but recommended for better product visibility
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {productFields.map((field) => (
              <Card key={field.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{field.name}</CardTitle>
                      {field.required && <Badge variant="destructive">Required</Badge>}
                      {!field.required && <Badge variant="secondary">Optional</Badge>}
                      <Badge variant="outline">{field.type}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyFieldName(field.name)}
                    >
                      {copiedField === field.name ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Example:</h4>
                      <code className="text-xs bg-muted p-2 rounded block">
                        {field.example}
                      </code>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Validation:</h4>
                      <p className="text-xs text-muted-foreground">{field.validation}</p>
                    </div>
                  </div>

                  {field.enumValues && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Valid Values:</h4>
                      <div className="flex flex-wrap gap-1">
                        {field.enumValues.map((value) => (
                          <Badge key={value} variant="outline" className="text-xs">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSV Format Example</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`name,description,price,compareAtPrice,sku,stockQuantity,reorderPoint,weight,category,tags,ageGroup,stemDiscipline,productType,learningOutcomes,specialCategories,images
"RoboBot Coding Kit","An interactive robot that teaches children programming basics through fun games and challenges. Includes 50+ coding activities and a companion app.",89.99,119.99,ROBO-001,45,10,1.2,"Robotics","educational,programming,interactive,app",ELEMENTARY_6_8,TECHNOLOGY,ROBOTICS,"PROBLEM_SOLVING,LOGIC,CRITICAL_THINKING",NEW_ARRIVALS,"https://example.com/image1.jpg,https://example.com/image2.jpg"
"Science Lab Explorer","Complete chemistry and physics experiment kit with 100+ safe experiments. Includes lab equipment and safety goggles.",129.99,159.99,SCI-002,32,8,2.1,"Science Kits","chemistry,physics,experiments,safe",MIDDLE_SCHOOL_9_12,SCIENCE,EXPERIMENT_KITS,"CRITICAL_THINKING,PROBLEM_SOLVING,CREATIVITY",BEST_SELLERS,"https://example.com/science1.jpg,https://example.com/science2.jpg"`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JSON Format Example (Single Product)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`{
  "name": "RoboBot Coding Kit",
  "description": "An interactive robot that teaches children programming basics through fun games and challenges.",
  "price": 89.99,
  "compareAtPrice": 119.99,
  "sku": "ROBO-001",
  "stockQuantity": 45,
  "reorderPoint": 10,
  "weight": 1.2,
  "categoryId": "category-id-here",
  "tags": ["educational", "programming", "interactive"],
  "ageGroup": "ELEMENTARY_6_8",
  "stemDiscipline": "TECHNOLOGY",
  "productType": "ROBOTICS",
  "learningOutcomes": ["PROBLEM_SOLVING", "LOGIC", "CRITICAL_THINKING"],
  "specialCategories": ["NEW_ARRIVALS"],
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> All validation errors will prevent product creation. 
              Fix all errors before uploading.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Required Field Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">name</span>
                  <Badge variant="destructive">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">description</span>
                  <Badge variant="destructive">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">price</span>
                  <Badge variant="destructive">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">stockQuantity</span>
                  <Badge variant="destructive">Required</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field Constraints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">String Fields</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• name: 1-100 characters</li>
                      <li>• description: 10-1000 characters</li>
                      <li>• sku: Must be unique if provided</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Numeric Fields</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• price: &gt; 0</li>
                      <li>• stockQuantity: &ge; 0</li>
                      <li>• reorderPoint: &ge; 0</li>
                      <li>• weight: &ge; 0</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enum Validations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">ageGroup</h4>
                    <div className="flex flex-wrap gap-1">
                      {["TODDLERS_1_3", "PRESCHOOL_3_5", "ELEMENTARY_6_8", "MIDDLE_SCHOOL_9_12", "TEENS_13_PLUS"].map(value => (
                        <Badge key={value} variant="outline" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">stemDiscipline</h4>
                    <div className="flex flex-wrap gap-1">
                      {["SCIENCE", "TECHNOLOGY", "ENGINEERING", "MATHEMATICS", "GENERAL"].map(value => (
                        <Badge key={value} variant="outline" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">productType</h4>
                    <div className="flex flex-wrap gap-1">
                      {["ROBOTICS", "PUZZLES", "CONSTRUCTION_SETS", "EXPERIMENT_KITS", "BOARD_GAMES"].map(value => (
                        <Badge key={value} variant="outline" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
                     </div>
         </TabsContent>

         <TabsContent value="api" className="space-y-4">
           <Alert>
             <AlertDescription>
               <strong>API Endpoints:</strong> Use these endpoints to programmatically manage your products
             </AlertDescription>
           </Alert>

           <div className="grid gap-4">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <BookOpen className="w-5 h-5" />
                   Product Validation API
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div>
                   <h4 className="font-medium text-sm mb-2">Endpoint</h4>
                   <code className="text-sm bg-muted p-2 rounded block">POST /api/supplier/products/validate</code>
                 </div>
                 
                 <div>
                   <h4 className="font-medium text-sm mb-2">Purpose</h4>
                   <p className="text-sm text-muted-foreground">
                     Validate product data before submission to catch errors early and get detailed feedback.
                   </p>
                 </div>

                 <div>
                   <h4 className="font-medium text-sm mb-2">Request Body</h4>
                   <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                     <pre className="text-sm">
{`{
  "type": "single" | "bulk",
  "data": {
    // Single product data or array of products
  }
}`}
                     </pre>
                   </div>
                 </div>

                 <div>
                   <h4 className="font-medium text-sm mb-2">Response</h4>
                   <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                     <pre className="text-sm">
{`{
  "valid": boolean,
  "errors": Array<{field: string, message: string, code: string}>,
  "warnings": Array<{field: string, message: string, code: string}>,
  "summary": {
    "totalErrors": number,
    "totalWarnings": number,
    "isValid": boolean
  }
}`}
                     </pre>
                   </div>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <BookOpen className="w-5 h-5" />
                   Single Product API
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div>
                   <h4 className="font-medium text-sm mb-2">Endpoints</h4>
                   <div className="space-y-2">
                     <code className="text-sm bg-muted p-2 rounded block">GET /api/supplier/products</code>
                     <code className="text-sm bg-muted p-2 rounded block">POST /api/supplier/products</code>
                     <code className="text-sm bg-muted p-2 rounded block">PUT /api/supplier/products/[id]</code>
                     <code className="text-sm bg-muted p-2 rounded block">DELETE /api/supplier/products/[id]</code>
                   </div>
                 </div>
                 
                 <div>
                   <h4 className="font-medium text-sm mb-2">Features</h4>
                   <ul className="text-sm space-y-1 text-muted-foreground">
                     <li>• CRUD operations for individual products</li>
                     <li>• Advanced filtering and search</li>
                     <li>• Pagination support</li>
                     <li>• Real-time validation</li>
                     <li>• Image upload support</li>
                   </ul>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <BookOpen className="w-5 h-5" />
                   Bulk Upload API
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div>
                   <h4 className="font-medium text-sm mb-2">Endpoint</h4>
                   <code className="text-sm bg-muted p-2 rounded block">POST /api/supplier/products/bulk-upload</code>
                 </div>
                 
                 <div>
                   <h4 className="font-medium text-sm mb-2">Features</h4>
                   <ul className="text-sm space-y-1 text-muted-foreground">
                     <li>• Upload up to 1000 products at once</li>
                     <li>• Batch processing for performance</li>
                     <li>• Detailed error reporting by row</li>
                     <li>• Progress tracking</li>
                     <li>• Automatic category creation</li>
                     <li>• Duplicate detection</li>
                   </ul>
                 </div>

                 <div>
                   <h4 className="font-medium text-sm mb-2">Response</h4>
                   <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                     <pre className="text-sm">
{`{
  "success": number,
  "failed": number,
  "errors": Array<{row: number, field: string, message: string}>,
  "warnings": Array<{row: number, field: string, message: string}>,
  "processingTime": number,
  "summary": {
    "total": number,
    "success": number,
    "failed": number,
    "successRate": string,
    "processingTime": string
  }
}`}
                     </pre>
                   </div>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <HelpCircle className="w-5 h-5" />
                   Best Practices
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div>
                   <h4 className="font-medium text-sm mb-2">API Usage Tips</h4>
                   <ul className="text-sm space-y-2 text-muted-foreground">
                     <li>• <strong>Always validate first:</strong> Use the validation API before submitting products</li>
                     <li>• <strong>Handle errors gracefully:</strong> Check response status and error messages</li>
                     <li>• <strong>Use appropriate batch sizes:</strong> 50-100 products per batch for optimal performance</li>
                     <li>• <strong>Implement retry logic:</strong> For network failures and temporary errors</li>
                     <li>• <strong>Monitor rate limits:</strong> Don't exceed reasonable request frequencies</li>
                     <li>• <strong>Cache responses:</strong> Cache product lists and categories when possible</li>
                   </ul>
                 </div>

                 <div>
                   <h4 className="font-medium text-sm mb-2">Error Handling</h4>
                   <ul className="text-sm space-y-1 text-muted-foreground">
                     <li>• <strong>400 Bad Request:</strong> Validation errors - check the error details</li>
                     <li>• <strong>403 Forbidden:</strong> Authentication or authorization issues</li>
                     <li>• <strong>404 Not Found:</strong> Resource doesn't exist</li>
                     <li>• <strong>429 Too Many Requests:</strong> Rate limit exceeded</li>
                     <li>• <strong>500 Internal Server Error:</strong> Server error - try again later</li>
                   </ul>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
       </Tabs>
     </div>
   );
 }
