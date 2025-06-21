"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";
import type { CartItem } from "@/features/cart/context/CartContext";
import { useProductVariant } from "../context/ProductVariantContext";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { BookLanguageSelector } from "./BookLanguageSelector";
import type { Variant } from "@/components/products/VariantSelector";
import { cn } from "@/lib/utils";

interface ProductAddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    variants?: Variant[];
    slug?: string; // Add slug for language fetching
  };
  className?: string;
  showQuantity?: boolean;
  isBook?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProductAddToCartButton({
  product,
  className = "",
  showQuantity = false,
  isBook = false,
  size = "md",
}: ProductAddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<
    string | undefined
  >();
  const [hasAvailableLanguages, setHasAvailableLanguages] = useState(false);
  const [languagesLoading, setLanguagesLoading] = useState(isBook);
  const { addItem } = useShoppingCart();
  const { selectedVariants, getSelectedVariant } = useProductVariant();

  const hasVariants = product.variants && product.variants.length > 0;
  const selectedVariantId = hasVariants
    ? selectedVariants[product.id]
    : undefined;
  const selectedVariant = hasVariants
    ? getSelectedVariant(product.id, product.variants || [])
    : undefined;

  // Check if this book has digital files available
  useEffect(() => {
    if (isBook && product.slug) {
      setLanguagesLoading(true);
      fetch(`/api/books/${product.slug}/languages`)
        .then((response) => response.json())
        .then((data) => {
          const languages = data.availableLanguages || [];
          setHasAvailableLanguages(languages.length > 0);
          setLanguagesLoading(false);
        })
        .catch(() => {
          setHasAvailableLanguages(false);
          setLanguagesLoading(false);
        });
    }
  }, [isBook, product.slug]);

  const isDisabled =
    isAdded ||
    isLoading ||
    languagesLoading ||
    (hasVariants && product.variants!.length > 1 && !selectedVariantId) ||
    (isBook && hasAvailableLanguages && !selectedLanguage); // Only require language if languages are available

  const handleAddToCart = async () => {
    // Prevent double-clicking
    if (isLoading || isAdded) return;

    setIsLoading(true);

    try {
      const item: Omit<CartItem, "id"> = {
        productId: product.id,
        variantId: selectedVariantId,
        name:
          product.name + (selectedVariant ? ` - ${selectedVariant.name}` : ""),
        price: selectedVariant?.price ?? product.price,
        quantity,
        image: product.image,
        isBook,
        selectedLanguage:
          isBook && hasAvailableLanguages ? selectedLanguage : undefined,
      };

      console.log(`Adding item to cart:`, item);
      addItem(item, quantity);

      // Show success state briefly
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding item to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      button: "px-3 py-2 text-sm",
      icon: "h-4 w-4",
      quantityControls: "text-sm",
    },
    md: {
      button: "px-5 py-2.5",
      icon: "h-5 w-5",
      quantityControls: "",
    },
    lg: {
      button: "px-6 py-3 text-lg",
      icon: "h-6 w-6",
      quantityControls: "text-lg",
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Language selector for books - positioned before variants and cart button */}
      {isBook &&
        product.slug &&
        (languagesLoading || hasAvailableLanguages) && (
          <div className="border-t border-gray-100 pt-3">
            <BookLanguageSelector
              productSlug={product.slug}
              selectedLanguage={selectedLanguage}
              onLanguageSelect={handleLanguageSelect}
              compact={true}
            />
          </div>
        )}

      {/* Show variant selector if product has multiple variants */}
      {hasVariants && product.variants!.length > 1 && (
        <div className={isBook ? "border-t border-gray-100 pt-3" : ""}>
          <ProductVariantSelector
            productId={product.id}
            variants={product.variants!}
          />
        </div>
      )}

      <div className={cn("flex", showQuantity ? "items-center space-x-4" : "")}>
        {/* Quantity selector */}
        {showQuantity && (
          <div
            className={cn(
              "flex items-center border rounded-md bg-white",
              config.quantityControls
            )}>
            <button
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="p-2 hover:bg-gray-50 transition-colors rounded-l-md"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}>
              <span className="text-gray-600 font-medium">−</span>
            </button>
            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((prev) => prev + 1)}
              className="p-2 hover:bg-gray-50 transition-colors rounded-r-md"
              aria-label="Increase quantity">
              <span className="text-gray-600 font-medium">+</span>
            </button>
          </div>
        )}

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={isDisabled}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed",
            config.button,
            isAdded
              ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
              : isDisabled
                ? "bg-gray-100 text-gray-400 border border-gray-200"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-95",
            showQuantity ? "flex-1" : "w-full"
          )}>
          {isAdded ? (
            <>
              <Check className={config.icon} />
              {size === "sm" ? "Added!" : "Added to Cart"}
            </>
          ) : isLoading ? (
            <>
              <div
                className={cn(
                  config.icon,
                  "animate-spin border-2 border-current border-t-transparent rounded-full"
                )}
              />
              {size === "sm" ? "Adding..." : "Adding to Cart..."}
            </>
          ) : (
            <>
              <ShoppingCart className={config.icon} />
              {hasVariants && !selectedVariantId
                ? size === "sm"
                  ? "Select"
                  : "Select Options"
                : isBook && !selectedLanguage
                  ? size === "sm"
                    ? "Choose Language"
                    : "Select Language"
                  : size === "sm"
                    ? "Add"
                    : "Add to Cart"}
            </>
          )}
        </button>
      </div>

      {/* Helper text for disabled states */}
      {isDisabled && !isAdded && !isLoading && (
        <div className="text-xs text-muted-foreground text-center">
          {languagesLoading
            ? "Loading book information..."
            : hasVariants && !selectedVariantId
              ? "Please select product options above"
              : isBook && hasAvailableLanguages && !selectedLanguage
                ? "Please choose your preferred language"
                : ""}
        </div>
      )}
    </div>
  );
}
