"use client";

import React, { useState, useEffect } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface Variant {
  id: string;
  name: string;
  price?: number;
  attributes?: {
    [key: string]: string;
  };
  isAvailable?: boolean;
}

export interface VariantGroup {
  name: string;
  options: {
    value: string;
    label: string;
    isAvailable?: boolean;
  }[];
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId?: string;
  onVariantChange: (variantId: string | undefined) => void;
  className?: string;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
  className,
}: VariantSelectorProps) {
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  // Parse variants into attribute groups (color, size, etc.)
  useEffect(() => {
    if (!variants || variants.length === 0) return;

    // Extract all possible attribute types and their values
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

    // Convert to variant groups
    const groups: VariantGroup[] = Array.from(attributeMap.entries()).map(
      ([name, values]) => ({
        name,
        options: Array.from(values).map(value => ({
          value,
          label: value,
          isAvailable: variants.some(
            v => v.attributes?.[name] === value && (v.isAvailable ?? true)
          ),
        })),
      })
    );

    setVariantGroups(groups);

    // Initialize selected attributes if a variant is already selected
    if (selectedVariantId) {
      const selectedVariant = variants.find(v => v.id === selectedVariantId);
      if (selectedVariant?.attributes) {
        setSelectedAttributes(selectedVariant.attributes);
      }
    }
  }, [variants]);

  // Update selected attributes when selectedVariantId changes
  useEffect(() => {
    if (selectedVariantId) {
      const selectedVariant = variants.find(v => v.id === selectedVariantId);
      if (selectedVariant?.attributes) {
        setSelectedAttributes(selectedVariant.attributes);
      }
    }
  }, [selectedVariantId, variants]);

  // Find the matching variant based on attributes
  const findMatchingVariant = (attrs: Record<string, string>) => {
    // Check if all groups have a selection
    const allGroupsSelected = variantGroups.every(group => attrs[group.name]);

    if (!allGroupsSelected) {
      return undefined;
    }

    // Find the variant that matches all selected attributes
    return variants.find(variant => {
      if (!variant.attributes) return false;

      return Object.entries(attrs).every(
        ([key, value]) => variant.attributes?.[key] === value
      );
    });
  };

  const handleAttributeChange = (attributeName: string, value: string) => {
    const newAttributes = {
      ...selectedAttributes,
      [attributeName]: value,
    };

    setSelectedAttributes(newAttributes);

    // Find matching variant after attribute change and notify parent
    const matchingVariant = findMatchingVariant(newAttributes);

    // Only call onVariantChange if we found a matching variant or if all attributes are selected
    if (
      matchingVariant ||
      variantGroups.every(group => newAttributes[group.name])
    ) {
      onVariantChange(matchingVariant?.id);
    }
  };

  if (!variants || variants.length <= 1) {
    return null; // No need for variant selector if there's only one variant
  }

  return (
    <div className={cn("space-y-4", className)}>
      {variantGroups.map(group => (
        <div key={group.name} className="space-y-2">
          <h3 className="text-sm font-medium capitalize">{group.name}</h3>
          <RadioGroup
            value={selectedAttributes[group.name] || ""}
            onValueChange={(value: string) =>
              handleAttributeChange(group.name, value)
            }
            className="flex flex-wrap gap-2"
          >
            {group.options.map(option => (
              <div key={option.value} className="flex items-center">
                <RadioGroupItem
                  value={option.value}
                  id={`${group.name}-${option.value}`}
                  disabled={!option.isAvailable}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`${group.name}-${option.value}`}
                  className={cn(
                    "px-3 py-1.5 border rounded-md text-sm cursor-pointer",
                    "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                    "hover:bg-muted peer-disabled:hover:bg-transparent",
                    "peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground",
                    "peer-data-[state=checked]:border-primary"
                  )}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
