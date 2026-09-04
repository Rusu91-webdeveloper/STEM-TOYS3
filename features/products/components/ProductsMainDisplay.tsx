"use client";

import {
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Search,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";

import { Input } from "@/components/ui/input";
import { useShoppingCart } from "@/features/cart/hooks/useShoppingCart";
import { ProductGrid } from "@/features/products";
import type { Product } from "@/types/product";

import { OptimizedProductImage } from "./OptimizedProductImage";

interface CategoryInfo {
  id: string;
  label: string;
}

interface CategoryIconInfo {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  letter: string;
}

const SORT_OPTIONS = [
  { value: "featured", label: "Cele mai populare" },
  { value: "newest", label: "Cele mai noi" },
  { value: "price-low", label: "Preț: Mic → Mare" },
  { value: "price-high", label: "Preț: Mare → Mic" },
  { value: "rating", label: "Cele mai bine cotate" },
];

interface ProductsMainDisplayProps {
  activeCategory: CategoryInfo | null;
  categoryInfo: Record<string, CategoryIconInfo>;
  filteredProducts: any[];
  visibleProductsCount: number;
  displayedProducts: any[];
  viewMode: "grid" | "list";
  sortOption?: string;
  onSortChange?: (value: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onClearSearch?: () => void;
  bundleViewMode: "all" | "bundles" | "products";
  onBundleViewModeChange: (mode: "all" | "bundles" | "products") => void;
  getLearningTitle: () => string;
  getLearningDescription: () => string;
  getProductCardContent: (product: any) => {
    title: string;
    description: string;
  };
  t: (key: string, fallback?: string) => string;
}

export function ProductsMainDisplay({
  activeCategory: _activeCategory,
  categoryInfo: _categoryInfo,
  filteredProducts: _filteredProducts,
  visibleProductsCount: _visibleProductsCount,
  displayedProducts,
  viewMode,
  sortOption,
  onSortChange,
  searchQuery = "",
  onSearchQueryChange,
  onClearSearch,
  bundleViewMode: _bundleViewMode,
  onBundleViewModeChange: _onBundleViewModeChange,
  getLearningTitle: _getLearningTitle,
  getLearningDescription: _getLearningDescription,
  getProductCardContent,
  t,
}: ProductsMainDisplayProps) {
  const [displayProducts, setDisplayProducts] = useState(displayedProducts);
  const [prevProductCount, setPrevProductCount] = useState(
    displayedProducts.length
  );
  const [sortOpen, setSortOpen] = useState(false);

  const { addItem } = useShoppingCart();
  const [cartStates, setCartStates] = useState<
    Record<string, "idle" | "adding" | "added">
  >({});

  const handleAddToCart = useCallback(
    (product: any, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (cartStates[product.id] === "adding") return;
      const isBook = Boolean(
        product.isBook ||
          product.attributes?.author ||
          product.tags?.includes("book")
      );
      setCartStates(s => ({ ...s, [product.id]: "adding" }));
      addItem(
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] ?? "",
          quantity: 1,
          stockQuantity: product.stockQuantity,
          isBook,
          slug: product.slug,
        },
        1
      );
      setTimeout(
        () => setCartStates(s => ({ ...s, [product.id]: "added" })),
        300
      );
      setTimeout(
        () => setCartStates(s => ({ ...s, [product.id]: "idle" })),
        1800
      );
    },
    [addItem, cartStates]
  );

  useEffect(() => {
    const countDifference = Math.abs(
      displayedProducts.length - prevProductCount
    );
    const shouldShowLoading =
      countDifference > Math.max(prevProductCount * 0.5, 5);

    if (shouldShowLoading) {
      setPrevProductCount(displayedProducts.length);
      const timer = setTimeout(() => {
        setDisplayProducts(displayedProducts);
      }, 150);
      return () => clearTimeout(timer);
    }

    setDisplayProducts(displayedProducts);
    setPrevProductCount(displayedProducts.length);
    return undefined;
  }, [displayedProducts, prevProductCount]);

  const currentSortLabel =
    SORT_OPTIONS.find(o => o.value === (sortOption ?? "featured"))?.label ??
    "Sortează după";

  return (
    <div className="flex-1 text-slate-900">
      {/* Toolbar — view toggle + sort (desktop) */}
      <div className="mb-5 hidden items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_16px_40px_-36px_rgba(15,23,42,0.35)] xl:flex">
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => {
              /* view change handled by parent via ProductGrid */
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              viewMode === "grid"
                ? "bg-slate-900 text-white"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              viewMode === "list"
                ? "bg-slate-900 text-white"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="max-w-md flex-1">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={e => onSearchQueryChange?.(e.currentTarget.value)}
              placeholder={t("productsSearchPlaceholder", "Caută produse...")}
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 pr-8 text-sm shadow-none focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="text-slate-500 text-xs">
              {t("sortBy", "Sortează după:")}
            </span>
            <span className="font-medium">{currentSortLabel}</span>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${sortOpen ? "rotate-180" : ""}`}
            />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] rounded-xl border border-slate-200 bg-white shadow-lg py-1 overflow-hidden">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSortChange?.(opt.value);
                    setSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                    sortOption === opt.value
                      ? "font-semibold text-slate-900"
                      : "text-slate-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Close sort dropdown when clicking outside */}
      {sortOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSortOpen(false)}
        />
      )}

      {/* Products grid or list */}
      <div className={viewMode === "list" ? "space-y-2 sm:space-y-2.5" : ""}>
        {viewMode === "grid" ? (
          <ProductGrid
            products={displayProducts.map((product, index) => {
              const modifiedProduct = { ...product };
              if (
                product.name?.includes("Learning") ||
                product.description?.includes("LearningDesc")
              ) {
                const content = getProductCardContent(product);
                modifiedProduct.name = content.title;
                modifiedProduct.description = content.description;
              }
              modifiedProduct.animationDelay = `${Math.min(index * 0.06, 0.4)}s`;
              return modifiedProduct as unknown as Product;
            })}
            sortOption={sortOption}
            onSortChange={onSortChange}
            disableInternalSort
            columns={{ base: 2, sm: 2, md: 3, lg: 3, xl: 3 }}
            showLayoutToggle={false}
            showSortOptions={false}
          />
        ) : (
          <div className="space-y-3">
            {displayProducts.map((product, index) => {
              let displayName = product.name;
              let displayDescription = product.description;

              if (
                product.name?.includes("Learning") ||
                product.description?.includes("LearningDesc")
              ) {
                const content = getProductCardContent(product);
                displayName = content.title;
                displayDescription = content.description;
              }

              const discountPct =
                product.compareAtPrice && product.compareAtPrice > product.price
                  ? Math.round(
                      ((product.compareAtPrice - product.price) /
                        product.compareAtPrice) *
                        100
                    )
                  : null;

              const cartState = cartStates[product.id] ?? "idle";
              const isOutOfStock = (product.stockQuantity ?? 1) <= 0;

              return (
                <div
                  key={product.id}
                  className="flex flex-row overflow-hidden rounded-xl border border-slate-100 bg-white hover:shadow-md transition-shadow duration-200 relative group"
                  style={{ animationDelay: `${Math.min(index * 0.06, 0.4)}s` }}
                >
                  {discountPct && (
                    <div className="absolute top-2 left-2 z-20">
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -{discountPct}%
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/products/${product.slug}`}
                    className="relative z-10 w-24 h-24 sm:h-44 sm:w-40 lg:w-48 flex-shrink-0 overflow-hidden bg-slate-50 block"
                  >
                    {product.images && product.images.length > 0 ? (
                      <OptimizedProductImage
                        src={product.images[0]}
                        alt={displayName}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        priority={false}
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 160px, 192px"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 min-w-0">
                    <div className="min-w-0">
                      {product.category?.name && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5 block">
                          {product.category.name}
                        </span>
                      )}
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-semibold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2 mb-1 hover:text-slate-700 transition-colors block"
                      >
                        {displayName}
                      </Link>
                      <p className="hidden sm:block text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {displayDescription}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-bold text-[#2563EB]">
                          {product.price
                            ? `${product.price} RON`
                            : t("freeDownload", "Gratuit")}
                        </span>
                        {product.compareAtPrice &&
                          product.compareAtPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through">
                              {product.compareAtPrice} RON
                            </span>
                          )}
                      </div>

                      <button
                        type="button"
                        onClick={e => handleAddToCart(product, e)}
                        disabled={cartState === "adding" || isOutOfStock}
                        className={`inline-flex items-center gap-1.5 rounded-lg text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-200 whitespace-nowrap ${
                          cartState === "added"
                            ? "bg-emerald-500 text-white"
                            : cartState === "adding"
                              ? "bg-slate-100 text-slate-400"
                              : isOutOfStock
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-[#2563EB] text-white"
                        }`}
                      >
                        {cartState === "adding" ? (
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : cartState === "added" ? (
                          <>
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Adăugat!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {t("addToCart", "Adaugă în Coș")}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty state */}
      {displayProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            {t("noProductsFound", "Nu am găsit produse")}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs">
            {t(
              "tryAdjustingFilters",
              "Încearcă să ajustezi filtrele sau caută altceva."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
