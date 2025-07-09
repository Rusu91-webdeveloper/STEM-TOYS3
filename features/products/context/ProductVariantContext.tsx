"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

import type { Variant } from "@/components/products/VariantSelector";

interface ProductVariantContextType {
  selectedVariants: Record<string, string>; // productId -> variantId
  selectVariant: (productId: string, variantId: string | undefined) => void;
  getSelectedVariant: (
    productId: string,
    variants: Variant[]
  ) => Variant | undefined;
  getVariantPrice: (
    productId: string,
    variants: Variant[],
    basePrice: number
  ) => number;
  clearVariantSelection: (productId: string) => void;
}

const ProductVariantContext = createContext<
  ProductVariantContextType | undefined
>(undefined);

export const useProductVariant = () => {
  const context = useContext(ProductVariantContext);
  if (!context) {
    throw new Error(
      "useProductVariant must be used within a ProductVariantProvider"
    );
  }
  return context;
};

interface ProductVariantProviderProps {
  children: ReactNode;
}

export const ProductVariantProvider = ({
  children,
}: ProductVariantProviderProps) => {
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});

  const selectVariant = useCallback(
    (productId: string, variantId: string | undefined) => {
      setSelectedVariants((prev) => {
        if (!variantId) {
          // If no variant is selected, remove the entry
          const { [productId]: removed, ...rest } = prev;
          return rest;
        }
        return {
          ...prev,
          [productId]: variantId,
        };
      });
    },
    []
  );

  const clearVariantSelection = useCallback((productId: string) => {
    setSelectedVariants((prev) => {
      const { [productId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const getSelectedVariant = useCallback(
    (productId: string, variants: Variant[]) => {
      const selectedVariantId = selectedVariants[productId];
      if (!selectedVariantId) return undefined;

      return variants.find((v) => v.id === selectedVariantId);
    },
    [selectedVariants]
  );

  const getVariantPrice = useCallback(
    (productId: string, variants: Variant[], basePrice: number) => {
      const selectedVariant = getSelectedVariant(productId, variants);
      return selectedVariant?.price ?? basePrice;
    },
    [getSelectedVariant]
  );

  return (
    <ProductVariantContext.Provider
      value={{
        selectedVariants,
        selectVariant,
        getSelectedVariant,
        getVariantPrice,
        clearVariantSelection,
      }}>
      {children}
    </ProductVariantContext.Provider>
  );
};
