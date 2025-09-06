"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Mail,
  User,
  Package,
  Calendar,
  Globe,
} from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface EmailTemplatePreviewProps {
  template: {
    id: string;
    name: string;
    subject: string;
    content: string;
    category: string;
    variables: string[];
  };
  className?: string;
}

interface PreviewData {
  user: {
    name: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  order: {
    number: string;
    total: string;
    date: string;
    items: string;
  };
  product: {
    name: string;
    price: string;
    description: string;
  };
  site: {
    name: string;
    url: string;
    logo: string;
  };
  current: {
    date: string;
    year: string;
  };
  unsubscribe: {
    link: string;
    text: string;
  };
}

export function EmailTemplatePreview({
  template,
  className = "",
}: EmailTemplatePreviewProps) {
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [previewData, setPreviewData] = useState<PreviewData>({
    user: {
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    },
    order: {
      number: "ORD-2024-001234",
      total: "€89.99",
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      items: "Solar System Explorer Kit, Robotics Coding Starter Kit",
    },
    product: {
      name: "STEM Learning Kit",
      price: "€149.99",
      description: "Educational STEM kit for kids ages 8-12",
    },
    site: {
      name: "TechTots",
      url: "https://techtots.com",
      logo: "https://techtots.com/logo.png",
    },
    current: {
      date: new Date().toLocaleDateString(),
      year: new Date().getFullYear().toString(),
    },
    unsubscribe: {
      link: "https://techtots.com/unsubscribe?token=xyz",
      text: "Unsubscribe",
    },
  });

  // Process template content with real data
  const processedContent = template.content.replace(
    /\{\{([^}]+)\}\}/g,
    (match, variable) => {
      const keys = variable.trim().split(".");
      let value = previewData as any;

      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) break;
      }

      return value !== undefined ? String(value) : match;
    }
  );

  // Process subject line with real data
  const processedSubject = template.subject.replace(
    /\{\{([^}]+)\}\}/g,
    (match, variable) => {
      const keys = variable.trim().split(".");
      let value = previewData as any;

      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) break;
      }

      return value !== undefined ? String(value) : match;
    }
  );

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile":
        return "w-80";
      case "tablet":
        return "w-96";
      case "desktop":
      default:
        return "w-full max-w-2xl";
    }
  };

  const getPreviewHeight = () => {
    switch (previewMode) {
      case "mobile":
        return "h-[600px]";
      case "tablet":
        return "h-[700px]";
      case "desktop":
      default:
        return "h-[800px]";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Email Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Device Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Preview Mode:</span>
              <div className="flex gap-1">
                <Button
                  variant={previewMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === "tablet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Template Info */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{template.category}</Badge>
              <span className="text-sm text-gray-500">
                {template.variables.length} variables
              </span>
            </div>
          </div>

          {/* Sample Data Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Sample User
              </label>
              <Select
                value="john-doe"
                onValueChange={value => {
                  // In a real implementation, you'd load different sample data
                  console.log("Selected user:", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john-doe">John Doe (Customer)</SelectItem>
                  <SelectItem value="jane-smith">Jane Smith (VIP)</SelectItem>
                  <SelectItem value="mike-wilson">
                    Mike Wilson (New User)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Sample Order
              </label>
              <Select
                value="order-1"
                onValueChange={value => {
                  console.log("Selected order:", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order-1">
                    ORD-2024-001234 (€89.99)
                  </SelectItem>
                  <SelectItem value="order-2">
                    ORD-2024-001235 (€149.99)
                  </SelectItem>
                  <SelectItem value="order-3">
                    ORD-2024-001236 (€79.99)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Sample Product
              </label>
              <Select
                value="product-1"
                onValueChange={value => {
                  console.log("Selected product:", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product-1">
                    STEM Learning Kit (€149.99)
                  </SelectItem>
                  <SelectItem value="product-2">
                    Robotics Starter Kit (€199.99)
                  </SelectItem>
                  <SelectItem value="product-3">
                    Science Explorer Set (€99.99)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="preview" className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email Preview
                </TabsTrigger>
                <TabsTrigger value="source" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Source Code
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="p-6">
              <div className="flex justify-center">
                <div
                  className={`${getPreviewWidth()} ${getPreviewHeight()} border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg`}
                >
                  {/* Email Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>To: {previewData.user.email}</span>
                      </div>
                      <div className="text-xs">{previewData.current.date}</div>
                    </div>
                    <div className="mt-1 font-medium text-gray-900">
                      {processedSubject}
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: processedContent }}
                    />
                  </div>

                  {/* Email Footer */}
                  <div className="bg-gray-50 px-4 py-3 border-t text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        <span>{previewData.site.name}</span>
                      </div>
                      <a
                        href={previewData.unsubscribe.link}
                        className="text-blue-600 hover:underline"
                      >
                        {previewData.unsubscribe.text}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="source" className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Subject Line:</h4>
                  <div className="bg-gray-100 p-3 rounded-md text-sm font-mono">
                    {processedSubject}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">HTML Content:</h4>
                  <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto max-h-96">
                    <code>{processedContent}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Variable Usage Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Variable Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-green-600">
                Variables Used:
              </h4>
              <div className="space-y-1">
                {template.variables.map(variable => {
                  const isUsed = processedContent.includes(variable);
                  return (
                    <div
                      key={variable}
                      className={`flex items-center gap-2 text-sm p-2 rounded ${
                        isUsed
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isUsed ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <code className="text-xs">{variable}</code>
                      {isUsed && (
                        <Badge variant="secondary" className="text-xs">
                          Used
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Sample Data:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">User:</span>
                  <span>{previewData.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Order:</span>
                  <span>{previewData.order.number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Date:</span>
                  <span>{previewData.current.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Site:</span>
                  <span>{previewData.site.name}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
