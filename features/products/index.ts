// Re-export context
export {
  ProductVariantProvider,
  useProductVariant,
} from "./context/ProductVariantContext";

// Re-export components
export { ProductVariantSelector } from "./components/ProductVariantSelector";
export { ProductAddToCartButton } from "./components/ProductAddToCartButton";
export { ProductCard } from "./components/ProductCard";
export { ProductGrid } from "./components/ProductGrid";
export {
  ProductFilters,
  type FilterOption,
  type FilterGroup,
  type PriceRange,
} from "./components/ProductFilters";
export { ProductImageGallery } from "./components/ProductImageGallery";
export { ProductReviews, type Review } from "./components/ProductReviews";
export { RelatedProducts } from "./components/RelatedProducts";

// Create and export the new client products page component when it's created
// export { ClientProductsPage } from "./components/ClientProductsPage";

// Reexport types
export type { FilterGroup, FilterOption } from "./components/ProductFilters";
export type { PriceRange } from "./components/PriceRangeFilter";
