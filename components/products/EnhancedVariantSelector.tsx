"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Info,
  Ruler,
  Palette,
  Zap,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";

export interface EnhancedVariant {
  id: string;
  name: string;
  price?: number;
  originalPrice?: number;
  stock?: number;
  attributes?: {
    [key: string]: string;
  };
  isAvailable?: boolean;
  isOnSale?: boolean;
  images?: string[];
  sku?: string;
}

export interface VariantGroup {
  name: string;
  displayName: string;
  type: "color" | "size" | "material" | "edition" | "other";
  required: boolean;
  options: {
    value: string;
    label: string;
    displayValue?: string;
    hexColor?: string;
    isAvailable?: boolean;
    isPopular?: boolean;
    additionalInfo?: string;
    image?: string;
    stockCount?: number;
  }[];
  sizeGuide?: {
    title: string;
    description: string;
    measurements: Array<{
      size: string;
      measurement: string;
      description?: string;
    }>;
  };
}

interface EnhancedVariantSelectorProps {
  variants: EnhancedVariant[];
  selectedVariantId?: string;
  onVariantChange: (variant: EnhancedVariant | undefined) => void;
  onPriceChange?: (price: number) => void;
  className?: string;
  showPriceChange?: boolean;
  showStockInfo?: boolean;
  showAvailabilityBadges?: boolean;
  compactMode?: boolean;
}

export function EnhancedVariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
  onPriceChange,
  className,
  showPriceChange = true,
  showStockInfo = true,
  showAvailabilityBadges = true,
  compactMode = false,
}: EnhancedVariantSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);

  // Parse variants into attribute groups
  const variantGroups = useMemo(() => {
    if (!variants || variants.length === 0) return [];

    const attributeMap = new Map<string, Set<string>>();

    variants.forEach(variant => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!attributeMap.has(key)) {
            attributeMap.set(key, new Set());
          }
          attributeMap.get(key)?.add(value);
        });
      }
    });

    return Array.from(attributeMap.entries()).map(([name, values]) => ({
      name,
      displayName: formatDisplayName(name),
      type: getGroupType(name),
      options: Array.from(values).map(value => ({
        value,
        label: value,
        displayValue: formatDisplayValue(name, value),
        hexColor: getColorFromValue(name, value),
        isAvailable: variants.some(
          v => v.attributes?.[name] === value && (v.isAvailable ?? true)
        ),
      })),
    }));
  }, [variants]);

  // Get current selected variant
  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return undefined;
    return variants.find(v => v.id === selectedVariantId);
  }, [selectedVariantId, variants]);

  // Find matching variant based on selected attributes
  const findMatchingVariant = useMemo(() => {
    if (!variantGroups.every(group => selectedAttributes[group.name])) {
      return undefined;
    }

    return variants.find(variant => {
      if (!variant.attributes) return false;
      return Object.entries(selectedAttributes).every(
        ([key, value]) => variant.attributes?.[key] === value
      );
    });
  }, [selectedAttributes, variants, variantGroups]);

  // Initialize selected attributes
  useEffect(() => {
    if (selectedVariantId && selectedVariant?.attributes) {
      setSelectedAttributes(selectedVariant.attributes);
    }
  }, [selectedVariantId, selectedVariant]);

  // Handle attribute selection
  const handleAttributeChange = (attributeName: string, value: string) => {
    const newAttributes = {
      ...selectedAttributes,
      [attributeName]: value,
    };

    setSelectedAttributes(newAttributes);

    // Find matching variant
    const matchingVariant = variants.find(variant => {
      if (!variant.attributes) return false;
      return Object.entries(newAttributes).every(
        ([key, val]) => variant.attributes?.[key] === val
      );
    });

    onVariantChange(matchingVariant);

    if (matchingVariant && onPriceChange) {
      onPriceChange(matchingVariant.price || 0);
    }
  };

  // Check if an option combination is valid
  const isValidCombination = (groupName: string, value: string) => {
    const testAttributes = { ...selectedAttributes, [groupName]: value };

    return variants.some(variant => {
      if (!variant.attributes) return false;
      return Object.entries(testAttributes).every(
        ([key, val]) => variant.attributes?.[key] === val
      );
    });
  };

  if (!variants || variants.length <= 1) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Selected Variant Summary */}
      {selectedVariant && showPriceChange && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium">
                Selected: {selectedVariant.name}
              </span>
              {selectedVariant.sku && (
                <Badge variant="outline" className="text-xs">
                  SKU: {selectedVariant.sku}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedVariant.originalPrice &&
                selectedVariant.originalPrice >
                  (selectedVariant.price || 0) && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${selectedVariant.originalPrice}
                  </span>
                )}
              <span className="font-bold text-lg">
                ${selectedVariant.price || 0}
              </span>
              {selectedVariant.isOnSale && (
                <Badge variant="destructive" className="text-xs">
                  Sale
                </Badge>
              )}
            </div>
          </div>
          {showStockInfo && selectedVariant.stock !== undefined && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              {selectedVariant.stock > 5 ? (
                <span className="text-green-600">
                  ✓ In Stock ({selectedVariant.stock} available)
                </span>
              ) : selectedVariant.stock > 0 ? (
                <span className="text-orange-600">
                  ⚠ Only {selectedVariant.stock} left
                </span>
              ) : (
                <span className="text-red-600">✗ Out of Stock</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Variant Groups */}
      {variantGroups.map(group => (
        <div key={group.name} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">
              {group.displayName}
              <span className="text-red-500 ml-1">*</span>
            </h3>
            {group.type === "color" && (
              <Palette className="w-4 h-4 text-muted-foreground" />
            )}
            {group.type === "size" && (
              <Ruler className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <RadioGroup
            value={selectedAttributes[group.name] || ""}
            onValueChange={value => handleAttributeChange(group.name, value)}
            className={cn(
              "grid gap-2",
              group.type === "color" && !compactMode && "grid-cols-6",
              group.type === "size" && !compactMode && "grid-cols-4",
              compactMode && "grid-cols-3"
            )}
          >
            {group.options.map(option => {
              const isSelected =
                selectedAttributes[group.name] === option.value;
              const isDisabled =
                !option.isAvailable ||
                !isValidCombination(group.name, option.value);

              return (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={`${group.name}-${option.value}`}
                    disabled={isDisabled}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`${group.name}-${option.value}`}
                    className={cn(
                      "flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all",
                      "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                      "hover:bg-muted peer-disabled:hover:bg-transparent",
                      "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground",
                      "peer-data-[state=checked]:border-primary",
                      isSelected && "ring-2 ring-primary",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      group.type === "color" && "min-h-[3rem]",
                      compactMode && "p-2 text-sm"
                    )}
                    title={option.displayValue || option.label}
                  >
                    {/* Color Swatch */}
                    {group.type === "color" && option.hexColor && (
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: option.hexColor }}
                        />
                        <span className="text-xs font-medium">
                          {option.displayValue || option.label}
                        </span>
                      </div>
                    )}

                    {/* Size or Text Options */}
                    {group.type !== "color" && (
                      <span className="font-medium">
                        {option.displayValue || option.label}
                      </span>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                    )}

                    {/* Unavailable Indicator */}
                    {isDisabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {/* Validation Message */}
          {selectedAttributes[group.name] &&
            !isValidCombination(group.name, selectedAttributes[group.name]) && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>
                  This combination is not available. Please select a different
                  option.
                </span>
              </div>
            )}
        </div>
      ))}

      {/* Stock Alert */}
      {selectedVariant &&
        showStockInfo &&
        selectedVariant.stock !== undefined &&
        selectedVariant.stock <= 3 &&
        selectedVariant.stock > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Hurry! Only {selectedVariant.stock} left in stock
              </span>
            </div>
          </div>
        )}
    </div>
  );
}

// Helper functions
function getGroupType(attributeName: string): "color" | "size" | "other" {
  const name = attributeName.toLowerCase();
  if (name.includes("color") || name.includes("colour")) return "color";
  if (name.includes("size")) return "size";
  return "other";
}

function formatDisplayName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDisplayValue(attributeName: string, value: string): string {
  return value
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getColorFromValue(
  attributeName: string,
  value: string
): string | undefined {
  const colorMap: Record<string, string> = {
    red: "#EF4444",
    blue: "#3B82F6",
    green: "#10B981",
    yellow: "#F59E0B",
    purple: "#8B5CF6",
    pink: "#EC4899",
    black: "#1F2937",
    white: "#F9FAFB",
    gray: "#6B7280",
    orange: "#F97316",
  };

  const name = attributeName.toLowerCase();
  if (name.includes("color") || name.includes("colour")) {
    return colorMap[value.toLowerCase()];
  }
  return undefined;
}
