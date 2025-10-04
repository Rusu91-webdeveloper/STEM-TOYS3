"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calculator,
  DollarSign,
  Package,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CostBreakdownSchema,
  MarketingCostSchema,
} from "@/lib/validations/unit-economics";

const ProductCostFormSchema = z.object({
  // Product Acquisition Costs
  costPrice: z.number().min(0, "Cost price must be positive").optional(),
  importDuties: z.number().min(0, "Import duties must be positive").default(0),
  shippingCost: z.number().min(0, "Shipping cost must be positive").default(0),
  storageCost: z.number().min(0, "Storage cost must be positive").default(0),
  qualityControlCost: z
    .number()
    .min(0, "Quality control cost must be positive")
    .default(0),

  // Fulfillment Costs
  packagingCost: z
    .number()
    .min(0, "Packaging cost must be positive")
    .default(0),
  laborCost: z.number().min(0, "Labor cost must be positive").default(0),

  // Operational Costs
  paymentProcessingFee: z
    .number()
    .min(0, "Payment processing fee must be positive")
    .max(100, "Fee cannot exceed 100%")
    .default(2.9),
  customerServiceCost: z
    .number()
    .min(0, "Customer service cost must be positive")
    .default(0),
  operationalOverhead: z
    .number()
    .min(0, "Operational overhead must be positive")
    .default(0),

  // Marketing Costs
  googleAdsCost: z
    .number()
    .min(0, "Google Ads cost must be positive")
    .default(0),
  facebookAdsCost: z
    .number()
    .min(0, "Facebook Ads cost must be positive")
    .default(0),
  seoCost: z.number().min(0, "SEO cost must be positive").default(0),
  influencerCost: z
    .number()
    .min(0, "Influencer cost must be positive")
    .default(0),
  marketingNotes: z.string().optional(),
});

type ProductCostFormData = z.infer<typeof ProductCostFormSchema>;

interface ProductCostEditorProps {
  productId: string;
  productName: string;
  sellingPrice: number;
  onSave?: (data: ProductCostFormData) => void;
  onCancel?: () => void;
}

export default function ProductCostEditor({
  productId,
  productName,
  sellingPrice,
  onSave,
  onCancel,
}: ProductCostEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ProductCostFormData>({
    resolver: zodResolver(ProductCostFormSchema),
    defaultValues: {
      costPrice: undefined,
      importDuties: 0,
      shippingCost: 0,
      storageCost: 0,
      qualityControlCost: 0,
      packagingCost: 0,
      laborCost: 0,
      paymentProcessingFee: 2.9,
      customerServiceCost: 0,
      operationalOverhead: 0,
      googleAdsCost: 0,
      facebookAdsCost: 0,
      seoCost: 0,
      influencerCost: 0,
      marketingNotes: "",
    },
  });

  // Load existing cost data
  useEffect(() => {
    const loadCostData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/admin/products/costs?productId=${productId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load cost data");
        }

        const result = await response.json();
        if (result.success && result.data) {
          const costData = result.data;
          form.reset({
            costPrice: costData.costPrice || undefined,
            importDuties: costData.importDuties || 0,
            shippingCost: costData.shippingCost || 0,
            storageCost: costData.storageCost || 0,
            qualityControlCost: costData.qualityControlCost || 0,
            packagingCost: costData.packagingCost || 0,
            laborCost: costData.laborCost || 0,
            paymentProcessingFee: costData.paymentProcessingFee || 2.9,
            customerServiceCost: costData.customerServiceCost || 0,
            operationalOverhead: costData.operationalOverhead || 0,
            googleAdsCost: 0, // Will be loaded from marketing costs
            facebookAdsCost: 0,
            seoCost: 0,
            influencerCost: 0,
            marketingNotes: "",
          });
        }
      } catch (err: any) {
        console.error("Error loading cost data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCostData();
  }, [productId, form]);

  // Calculate total costs and profit margin
  const watchedValues = form.watch();
  const totalCosts =
    (watchedValues.costPrice || 0) +
    watchedValues.importDuties +
    watchedValues.shippingCost +
    watchedValues.storageCost +
    watchedValues.qualityControlCost +
    watchedValues.packagingCost +
    watchedValues.laborCost +
    sellingPrice * (watchedValues.paymentProcessingFee / 100) +
    watchedValues.customerServiceCost +
    watchedValues.operationalOverhead +
    watchedValues.googleAdsCost +
    watchedValues.facebookAdsCost +
    watchedValues.seoCost +
    watchedValues.influencerCost;

  const netProfit = sellingPrice - totalCosts;
  const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  const onSubmit = async (data: ProductCostFormData) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/admin/products/costs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          costs: {
            costPrice: data.costPrice,
            importDuties: data.importDuties,
            shippingCost: data.shippingCost,
            storageCost: data.storageCost,
            qualityControlCost: data.qualityControlCost,
            packagingCost: data.packagingCost,
            laborCost: data.laborCost,
            paymentProcessingFee: data.paymentProcessingFee,
            customerServiceCost: data.customerServiceCost,
            operationalOverhead: data.operationalOverhead,
          },
          marketingCosts: {
            googleAdsCost: data.googleAdsCost,
            facebookAdsCost: data.facebookAdsCost,
            seoCost: data.seoCost,
            influencerCost: data.influencerCost,
            notes: data.marketingNotes,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save cost data");
      }

      setSuccess(true);
      onSave?.(data);

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving cost data:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);

  const formatPercentage = (num: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num / 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calculator className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading cost data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Edit Product Costs</h3>
          <p className="text-sm text-muted-foreground">{productName}</p>
        </div>
        <Badge variant="outline">
          Selling Price: {formatCurrency(sellingPrice)}
        </Badge>
      </div>

      {/* Profitability Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Profitability Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Costs
              </p>
              <p className="text-lg font-bold">{formatCurrency(totalCosts)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Net Profit
              </p>
              <p
                className={`text-lg font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Profit Margin
              </p>
              <p
                className={`text-lg font-bold ${profitMargin >= 15 ? "text-green-600" : profitMargin >= 5 ? "text-yellow-600" : "text-red-600"}`}
              >
                {formatPercentage(profitMargin)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Cost data saved successfully!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cost Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Acquisition Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Acquisition Costs
              </CardTitle>
              <CardDescription>
                Costs related to acquiring and preparing the product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Cost per Unit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={e =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      The cost you pay to the supplier for each unit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="importDuties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Import Duties</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shippingCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping to Warehouse</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qualityControlCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Control</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment Costs */}
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment Costs</CardTitle>
              <CardDescription>
                Costs related to packaging and shipping to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="packagingCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packaging Materials</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labor Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Operational Costs */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Costs</CardTitle>
              <CardDescription>
                Ongoing operational expenses per sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="paymentProcessingFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Processing Fee (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerServiceCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Service</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operationalOverhead"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operational Overhead</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Marketing Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Marketing & Customer Acquisition Costs
              </CardTitle>
              <CardDescription>
                Marketing spend allocated per sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="googleAdsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Ads Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebookAdsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook/Instagram Ads</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seoCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Content Costs</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="influencerCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Influencer Marketing</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="marketingNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marketing Notes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Additional notes about marketing spend..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Costs
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
