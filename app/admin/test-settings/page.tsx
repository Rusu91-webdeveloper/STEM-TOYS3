"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestResult {
  success: boolean;
  data: any;
  message: string;
}

export default function TestSettingsPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const testEndpoints = {
    businessHours: "/api/admin/business-hours-test",
    customerService: "/api/admin/customer-service-test",
    orderProcessing: "/api/admin/order-processing-test",
    inventoryManagement: "/api/admin/inventory-management-test",
    marketingSettings: "/api/admin/marketing-settings-test",
  };

  const runTest = async (endpoint: string, testName: string) => {
    setIsLoading(prev => ({ ...prev, [testName]: true }));

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Sample test data
          currentStock: 5,
          orderTotal: 500,
          orderItems: [
            { product: { category: { id: "test-category" } }, quantity: 2 },
          ],
          shippingMethod: "express",
          orderNotes: "Test order",
          originalPrice: 100,
          discountPercent: 15,
          categoryId: "test-category",
          platform: "facebook",
          contentType: "newProducts",
          campaignType: "flashSales",
          segment: "newCustomers",
          workflow: "welcomeSeries",
          trigger: "newCustomer",
          tracking: "googleAnalytics",
          templateType: "welcome",
        }),
      });

      const result = await response.json();
      setResults(prev => ({ ...prev, [testName]: result }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          data: null,
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-500">✓ Working</Badge>
    ) : (
      <Badge variant="destructive">✗ Failed</Badge>
    );
  };

  const renderTestSection = (
    testName: string,
    title: string,
    description: string
  ) => {
    const result = results[testName];
    const loading = isLoading[testName];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {result && getStatusBadge(result.success)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={() =>
                runTest(
                  testEndpoints[testName as keyof typeof testEndpoints],
                  testName
                )
              }
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing..." : `Test ${title}`}
            </Button>

            {result && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Result:</div>
                <div className="text-sm text-muted-foreground">
                  {result.message}
                </div>
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      View Details
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Settings Test Page</h1>
        <p className="text-muted-foreground">
          Test all the new admin settings functionality to ensure everything is
          working correctly.
        </p>
      </div>

      <Tabs defaultValue="business-hours" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business-hours">Business Hours</TabsTrigger>
          <TabsTrigger value="customer-service">Customer Service</TabsTrigger>
          <TabsTrigger value="order-processing">Order Processing</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="business-hours" className="space-y-6">
          {renderTestSection(
            "businessHours",
            "Business Hours Settings",
            "Test business hours configuration, operating hours, and availability checks"
          )}
        </TabsContent>

        <TabsContent value="customer-service" className="space-y-6">
          {renderTestSection(
            "customerService",
            "Customer Service Settings",
            "Test customer service contact details, live chat configuration, and support channels"
          )}
        </TabsContent>

        <TabsContent value="order-processing" className="space-y-6">
          {renderTestSection(
            "orderProcessing",
            "Order Processing Settings",
            "Test order processing workflows, auto-fulfillment rules, and fulfillment settings"
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {renderTestSection(
            "inventoryManagement",
            "Inventory Management Settings",
            "Test inventory tracking, stock alerts, reorder management, and supplier integration"
          )}
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          {renderTestSection(
            "marketingSettings",
            "Marketing Settings",
            "Test email marketing, social media integration, promotional campaigns, and analytics"
          )}
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
          <CardDescription>
            Overview of all test results and system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(testEndpoints).map(([key, endpoint]) => {
              const result = results[key];
              const testNames = {
                businessHours: "Business Hours",
                customerService: "Customer Service",
                orderProcessing: "Order Processing",
                inventoryManagement: "Inventory Management",
                marketingSettings: "Marketing Settings",
              };

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <span className="text-sm font-medium">
                    {testNames[key as keyof typeof testNames]}
                  </span>
                  {result ? (
                    getStatusBadge(result.success)
                  ) : (
                    <Badge variant="outline">Not Tested</Badge>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <Button
              onClick={() => {
                Object.entries(testEndpoints).forEach(([key, endpoint]) => {
                  runTest(endpoint, key);
                });
              }}
              disabled={Object.values(isLoading).some(Boolean)}
              className="w-full"
            >
              {Object.values(isLoading).some(Boolean)
                ? "Running All Tests..."
                : "Run All Tests"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
