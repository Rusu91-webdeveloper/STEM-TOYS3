"use client";

import { ShoppingCart, Check } from "lucide-react";
import React, { useState } from "react";

import {
  VariantSelector,
  type Variant,
} from "@/components/products/VariantSelector";

import type { CartItem } from "../context/CartContext";
import { useShoppingCart } from "../hooks/useShoppingCart";


interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    variants?: Variant[];
  };
  className?: string;
  showQuantity?: boolean;
  showVariantSelector?: boolean;
}

export function AddToCartButton({
  product,
  className = "",
  showQuantity = false,
  showVariantSelector = false,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<
    string | undefined
  >(
    product.variants && product.variants.length === 1
      ? product.variants[0].id
      : undefined
  );
  const { addItem } = useShoppingCart();

  const handleAddToCart = () => {
    // Find the selected variant if any
    const selectedVariant = selectedVariantId
      ? product.variants?.find((v) => v.id === selectedVariantId)
      : undefined;

    const item: Omit<CartItem, "id"> = {
      productId: product.id,
      variantId: selectedVariantId,
      name:
        product.name + (selectedVariant ? ` - ${selectedVariant.name}` : ""),
      price: selectedVariant?.price ?? product.price,
      quantity,
      image: product.image,
    };

    addItem(item, quantity);

    // Show success state briefly
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  // Determine if Add to Cart should be disabled
  const hasVariants = product.variants && product.variants.length > 0;
  const isAddDisabled =
    isAdded || (hasVariants && showVariantSelector && !selectedVariantId);

  return (
    <div
      className={`flex ${
        showQuantity || showVariantSelector ? "flex-col space-y-4" : ""
      } ${className}`}>
      {/* Variant Selector */}
      {showVariantSelector &&
        product.variants &&
        product.variants.length > 0 && (
          <VariantSelector
            variants={product.variants}
            selectedVariantId={selectedVariantId}
            onVariantChange={setSelectedVariantId}
          />
        )}

      <div
        className={`flex ${
          showQuantity
            ? "flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2"
            : ""
        }`}>
        {/* Quantity Selector */}
        {showQuantity && (
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="p-2 hover:bg-muted"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}>
              -
            </button>
            <span className="px-4 py-2">{quantity}</span>
            <button
              onClick={() => setQuantity((prev) => prev + 1)}
              className="p-2 hover:bg-muted"
              aria-label="Increase quantity">
              +
            </button>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAddDisabled}
          className={`flex items-center justify-center gap-2 rounded-md px-5 py-2.5 font-medium transition-colors ${
            isAdded
              ? "bg-green-600 text-white hover:bg-green-700"
              : isAddDisabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          } ${showQuantity ? "flex-1" : "w-full"}`}>
          {isAdded ? (
            <>
              <Check className="h-5 w-5" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              {hasVariants && showVariantSelector && !selectedVariantId
                ? "Select Options"
                : "Add to Cart"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
