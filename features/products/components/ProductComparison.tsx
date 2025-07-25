"use client";

import {
  X,
  Plus,
  Star,
  Check,
  Minus,
  ArrowRight,
  Scale,
  Heart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ComparisonProduct extends Product {
  specifications?: Record<string, string | number | boolean>;
  features?: string[];
  pros?: string[];
  cons?: string[];
  rating?: number;
  reviewCount?: number;
}

interface ProductComparisonProps {
  initialProducts?: ComparisonProduct[];
  maxProducts?: number;
  className?: string;
  onProductAdd?: (product: ComparisonProduct) => void;
  onProductRemove?: (productId: string) => void;
}

const COMPARISON_STORAGE_KEY = "stem-toys-comparison";
const DEFAULT_MAX_PRODUCTS = 4;

// Common comparison attributes for STEM toys
const COMPARISON_ATTRIBUTES = [
  { key: "age_range", label: "Age Range", type: "text" },
  { key: "difficulty", label: "Difficulty Level", type: "text" },
  { key: "stem_category", label: "STEM Category", type: "text" },
  { key: "learning_goals", label: "Learning Goals", type: "list" },
  { key: "materials", label: "Materials", type: "text" },
  { key: "dimensions", label: "Dimensions", type: "text" },
  { key: "weight", label: "Weight", type: "text" },
  { key: "battery_required", label: "Battery Required", type: "boolean" },
  { key: "assembly_time", label: "Assembly Time", type: "text" },
  {
    key: "safety_certifications",
    label: "Safety Certifications",
    type: "list",
  },
  { key: "educational_value", label: "Educational Value", type: "rating" },
  { key: "durability", label: "Durability", type: "rating" },
  { key: "engagement_factor", label: "Engagement Factor", type: "rating" },
];

export function ProductComparison({
  initialProducts = [],
  maxProducts = DEFAULT_MAX_PRODUCTS,
  className,
  onProductAdd,
  onProductRemove,
}: ProductComparisonProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [products, setProducts] =
    useState<ComparisonProduct[]>(initialProducts);
  const [isOpen, setIsOpen] = useState(false);

  // Load comparison products from localStorage
  useEffect(() => {
    if (initialProducts.length === 0) {
      const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProducts(parsed);
        } catch (error) {
          console.error("Failed to parse comparison products:", error);
        }
      }
    }
  }, [initialProducts]);

  // Save comparison products to localStorage
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(products));
    } else {
      localStorage.removeItem(COMPARISON_STORAGE_KEY);
    }
  }, [products]);

  const addProduct = (product: ComparisonProduct) => {
    if (products.length >= maxProducts) {
      toast({
        title: t("comparisonFull", "Comparison Full"),
        description: t(
          "maxProductsReached",
          `You can compare up to ${maxProducts} products at once.`
        ),
        variant: "destructive",
      });
      return;
    }

    if (products.find(p => p.id === product.id)) {
      toast({
        title: t("productAlreadyAdded", "Product Already Added"),
        description: t(
          "productInComparison",
          "This product is already in your comparison."
        ),
        variant: "destructive",
      });
      return;
    }

    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
    onProductAdd?.(product);

    toast({
      title: t("productAdded", "Product Added"),
      description: t(
        "productAddedToComparison",
        `${product.name} has been added to comparison.`
      ),
    });
  };

  const removeProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    onProductRemove?.(productId);

    const removedProduct = products.find(p => p.id === productId);
    if (removedProduct) {
      toast({
        title: t("productRemoved", "Product Removed"),
        description: t(
          "productRemovedFromComparison",
          `${removedProduct.name} has been removed from comparison.`
        ),
      });
    }
  };

  const clearAllProducts = () => {
    setProducts([]);
    localStorage.removeItem(COMPARISON_STORAGE_KEY);
    toast({
      title: t("comparisonCleared", "Comparison Cleared"),
      description: t(
        "allProductsRemoved",
        "All products have been removed from comparison."
      ),
    });
  };

  const getAttributeValue = (
    product: ComparisonProduct,
    attributeKey: string
  ) => {
    // Check in specifications first
    if (product.specifications?.[attributeKey]) {
      return product.specifications[attributeKey];
    }

    // Check in attributes
    const attrs =
      product.attributes && typeof product.attributes === "object"
        ? (product.attributes as Record<string, any>)
        : null;

    if (attrs?.[attributeKey]) {
      return attrs[attributeKey];
    }

    // Check direct product properties
    switch (attributeKey) {
      case "age_range":
        return (product as any).ageRange;
      case "stem_category":
        return (product as any).stemCategory;
      case "difficulty":
        return attrs?.difficulty;
      default:
        return null;
    }
  };

  const renderAttributeValue = (value: any, type: string) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }

    switch (type) {
      case "boolean":
        return value ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <Minus className="h-5 w-5 text-red-500" />
        );
      case "rating":
        const rating = typeof value === "number" ? value : parseFloat(value);
        return (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
        );
      case "list":
        if (Array.isArray(value)) {
          return (
            <ul className="text-sm space-y-1">
              {value.map((item, index) => (
                <li key={index} className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return String(value);
      default:
        return String(value);
    }
  };

  const ComparisonTable = () => (
    <div className="w-full">
      <ScrollArea className="w-full pb-4">
        <div className="min-w-full">
          {/* Product Headers */}
          <div
            className="grid grid-cols-1 gap-4 mb-6"
            style={{
              gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
            }}
          >
            <div className="font-semibold text-lg">
              {t("product", "Product")}
            </div>
            {products.map(product => (
              <Card key={product.id} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeProduct(product.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardContent className="p-4">
                  <div className="relative h-32 mb-3 rounded-lg overflow-hidden bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(product.price)}
                    </div>
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {product.rating}
                        </span>
                        {product.reviewCount && (
                          <span className="text-xs text-muted-foreground">
                            ({product.reviewCount})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/products/${product.slug}`}>
                          {t("viewDetails", "View Details")}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="mb-6" />

          {/* Comparison Attributes */}
          <div className="space-y-4">
            {COMPARISON_ATTRIBUTES.map(attribute => (
              <div
                key={attribute.key}
                className="grid gap-4 py-3 border-b border-border/50"
                style={{
                  gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
                }}
              >
                <div className="font-medium text-sm text-muted-foreground">
                  {t(attribute.key, attribute.label)}
                </div>
                {products.map(product => {
                  const value = getAttributeValue(product, attribute.key);
                  return (
                    <div
                      key={`${product.id}-${attribute.key}`}
                      className="text-sm"
                    >
                      {renderAttributeValue(value, attribute.type)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          {products.some(p => p.features && p.features.length > 0) && (
            <>
              <Separator className="my-6" />
              <div
                className="grid gap-4 py-3"
                style={{
                  gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
                }}
              >
                <div className="font-medium text-sm text-muted-foreground">
                  {t("features", "Features")}
                </div>
                {products.map(product => (
                  <div key={`${product.id}-features`} className="text-sm">
                    {product.features && product.features.length > 0 ? (
                      <ul className="space-y-1">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pros and Cons */}
          {products.some(
            p => (p.pros && p.pros.length > 0) || (p.cons && p.cons.length > 0)
          ) && (
            <>
              <Separator className="my-6" />
              <div
                className="grid gap-4 py-3"
                style={{
                  gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
                }}
              >
                <div className="font-medium text-sm text-muted-foreground">
                  {t("prosAndCons", "Pros & Cons")}
                </div>
                {products.map(product => (
                  <div
                    key={`${product.id}-pros-cons`}
                    className="text-sm space-y-3"
                  >
                    {product.pros && product.pros.length > 0 && (
                      <div>
                        <div className="text-green-600 font-medium mb-1">
                          {t("pros", "Pros")}
                        </div>
                        <ul className="space-y-1">
                          {product.pros.map((pro, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Plus className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {product.cons && product.cons.length > 0 && (
                      <div>
                        <div className="text-red-600 font-medium mb-1">
                          {t("cons", "Cons")}
                        </div>
                        <ul className="space-y-1">
                          {product.cons.map((con, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Minus className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (products.length === 0) {
    return (
      <Card className={cn("text-center p-8", className)}>
        <CardContent className="space-y-4">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {t("noProductsToCompare", "No Products to Compare")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t(
                "addProductsToCompare",
                "Add products to compare their features, specifications, and pricing side by side."
              )}
            </p>
            <Button onClick={() => window.history.back()}>
              <ArrowRight className="h-4 w-4 mr-2" />
              {t("browseProducts", "Browse Products")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {t("productComparison", "Product Comparison")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "compareProducts",
              `Comparing ${products.length} of ${maxProducts} products`
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearAllProducts}>
            {t("clearAll", "Clear All")}
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t("addProduct", "Add Product")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {t("addProductToComparison", "Add Product to Comparison")}
                </DialogTitle>
              </DialogHeader>
              <div className="p-4 text-center text-muted-foreground">
                {t(
                  "browseProductsToAdd",
                  "Browse our products and click the compare button to add them here."
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardContent className="p-6">
          <ComparisonTable />
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing comparison state
export function useProductComparison() {
  const [products, setProducts] = useState<ComparisonProduct[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProducts(parsed);
      } catch (error) {
        console.error("Failed to parse comparison products:", error);
      }
    }
  }, []);

  const addProduct = (product: ComparisonProduct) => {
    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
    localStorage.setItem(
      COMPARISON_STORAGE_KEY,
      JSON.stringify(updatedProducts)
    );
  };

  const removeProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    if (updatedProducts.length > 0) {
      localStorage.setItem(
        COMPARISON_STORAGE_KEY,
        JSON.stringify(updatedProducts)
      );
    } else {
      localStorage.removeItem(COMPARISON_STORAGE_KEY);
    }
  };

  const clearAll = () => {
    setProducts([]);
    localStorage.removeItem(COMPARISON_STORAGE_KEY);
  };

  const isInComparison = (productId: string) => products.some(p => p.id === productId);

  return {
    products,
    addProduct,
    removeProduct,
    clearAll,
    isInComparison,
    count: products.length,
  };
}
