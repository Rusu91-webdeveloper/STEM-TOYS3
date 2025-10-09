"use client";

import { useState, useEffect } from "react";
import { Sparkles, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldTooltip } from "../FieldTooltip";
import { ImageUploader } from "@/components/ui/ImageUploader";

interface WizardStep1BasicProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
  errors: Record<string, string>;
}

export function WizardStep1Basic({
  formData,
  updateFormData,
  errors,
}: WizardStep1BasicProps) {
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [charCount, setCharCount] = useState(formData.description?.length || 0);
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.price && formData.priceCurrency) {
      const price = parseFloat(formData.price);
      if (!isNaN(price)) {
        if (formData.priceCurrency === "EUR") {
          setConvertedPrice(price * 5);
        } else {
          setConvertedPrice(price);
        }
      }
    }
  }, [formData.price, formData.priceCurrency]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const generateSKU = () => {
    const prefix = "SKU";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    updateFormData({ sku: `${prefix}-${timestamp}-${random}` });
  };

  const handleDescriptionChange = (value: string) => {
    setCharCount(value.length);
    updateFormData({ description: value });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
      {/* Header */}
      <div className="text-center space-y-2 pb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-muted-foreground">
          Let's start with the essential details about your product
        </p>
      </div>

      <Alert className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20">
        <AlertDescription className="text-sm">
          <strong>Required fields:</strong> All fields on this page are required
          to create your product listing.
        </AlertDescription>
      </Alert>

      {/* Product Name */}
      <div className="space-y-2">
        <FieldTooltip
          label="Product Name"
          description="The name customers will see. Make it clear and descriptive."
          example="LEGO Mindstorms Robot Inventor"
          validation="1-100 characters, must be unique"
          required
          status={errors.name ? "error" : formData.name ? "valid" : "default"}
        />
        <Input
          value={formData.name || ""}
          onChange={e => updateFormData({ name: e.target.value })}
          placeholder="Enter a clear, descriptive product name"
          className={errors.name ? "border-red-500" : ""}
          maxLength={100}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        <p className="text-xs text-muted-foreground">
          {formData.name?.length || 0}/100 characters
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <FieldTooltip
          label="Description"
          description="Detailed description of your product. Include features, benefits, and what makes it special."
          example="An interactive robot that teaches children programming basics through fun games and challenges. Includes 50+ coding activities."
          validation="10-1000 characters"
          required
          status={
            errors.description
              ? "error"
              : formData.description?.length >= 10
                ? "valid"
                : "default"
          }
        />
        <Textarea
          value={formData.description || ""}
          onChange={e => handleDescriptionChange(e.target.value)}
          placeholder="Describe your product in detail..."
          className={errors.description ? "border-red-500" : ""}
          rows={5}
          maxLength={1000}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {charCount < 10 ? (
              <span className="text-amber-600">
                Minimum 10 characters ({10 - charCount} more needed)
              </span>
            ) : (
              <span className="text-green-600">✓ Good length</span>
            )}
          </span>
          <span>{charCount}/1000 characters</span>
        </div>
      </div>

      {/* Price and Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <FieldTooltip
            label="Price"
            description="The selling price for your product."
            example="89.99"
            validation="Must be greater than 0"
            required
            status={
              errors.price ? "error" : formData.price > 0 ? "valid" : "default"
            }
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.price || ""}
            onChange={e =>
              updateFormData({ price: parseFloat(e.target.value) })
            }
            placeholder="0.00"
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && (
            <p className="text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        <div className="space-y-2">
          <FieldTooltip
            label="Currency"
            description="Select the currency for your price. EUR will be converted to RON for storage."
            required
          />
          <Select
            value={formData.priceCurrency || "RON"}
            onValueChange={value =>
              updateFormData({ priceCurrency: value as "EUR" | "RON" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RON">RON (Lei)</SelectItem>
              <SelectItem value="EUR">EUR (Euro)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Currency Conversion Info */}
      {formData.priceCurrency === "EUR" && convertedPrice && (
        <Alert className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20">
          <AlertDescription className="text-sm">
            💡 <strong>Price will be stored as:</strong>{" "}
            {convertedPrice.toFixed(2)} RON (1 EUR = 5 RON)
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Quantity */}
      <div className="space-y-2">
        <FieldTooltip
          label="Stock Quantity"
          description="How many units do you have available?"
          example="45"
          validation="Must be 0 or greater"
          required
          status={
            errors.stockQuantity
              ? "error"
              : formData.stockQuantity >= 0
                ? "valid"
                : "default"
          }
        />
        <Input
          type="number"
          min="0"
          value={formData.stockQuantity ?? ""}
          onChange={e =>
            updateFormData({ stockQuantity: parseInt(e.target.value) || 0 })
          }
          placeholder="0"
          className={errors.stockQuantity ? "border-red-500" : ""}
        />
        {errors.stockQuantity && (
          <p className="text-sm text-red-600">{errors.stockQuantity}</p>
        )}
      </div>

      {/* SKU */}
      <div className="space-y-2">
        <FieldTooltip
          label="SKU (Stock Keeping Unit)"
          description="Unique identifier for this product in your inventory system."
          example="ROBO-001"
          validation="Optional, must be unique if provided"
          detailedHelp="The SKU helps you track this product in your inventory. It should be unique across all your products. You can auto-generate one or use your own system."
        />
        <div className="flex gap-2">
          <Input
            value={formData.sku || ""}
            onChange={e => updateFormData({ sku: e.target.value })}
            placeholder="Leave empty to auto-generate"
            className={errors.sku ? "border-red-500" : ""}
            maxLength={50}
          />
          <Button
            type="button"
            variant="outline"
            onClick={generateSKU}
            className="whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>
        {errors.sku && <p className="text-sm text-red-600">{errors.sku}</p>}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <FieldTooltip
          label="Category"
          description="Select the category that best fits your product."
          example="Robotics, Science Kits, Puzzles"
          validation="Optional but recommended for better visibility"
        />
        <Select
          value={formData.categoryId || ""}
          onValueChange={value => updateFormData({ categoryId: value })}
          disabled={loadingCategories}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                loadingCategories
                  ? "Loading categories..."
                  : "Select a category"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {categories.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                No categories available
              </div>
            ) : (
              categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-sm text-red-600">{errors.categoryId}</p>
        )}
      </div>

      {/* Main Image */}
      <div className="space-y-2">
        <FieldTooltip
          label="Product Image"
          description="Upload at least one high-quality image of your product."
          validation="At least 1 image required, up to 10 images total"
          required
          status={formData.images?.length > 0 ? "valid" : "default"}
        />
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <ImageUploader
              maxImages={10}
              onImagesUploaded={newImages =>
                updateFormData({ images: newImages })
              }
              initialImages={formData.images || []}
              endpoint="productImage"
            />
          </CardContent>
        </Card>
        {errors.images && (
          <p className="text-sm text-red-600">{errors.images}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.images?.length || 0}/10 images uploaded
        </p>
      </div>
    </div>
  );
}
