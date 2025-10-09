import { Metadata } from "next";
import { ProductMetrics } from "@/features/supplier/components/products/ProductMetrics";
import { ProductQuickActions } from "@/features/supplier/components/products/ProductQuickActions";
import { SupplierProductList } from "@/features/supplier/components/products/SupplierProductList";

export const metadata: Metadata = {
  title: "Products | Supplier Dashboard",
  description: "Manage your products in the TechTots supplier portal",
};

export default function SupplierProductsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product catalog and track performance
        </p>
      </div>

      {/* Summary Metrics */}
      <ProductMetrics />

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <ProductQuickActions />
      </div>

      {/* Product List with Filters */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Products</h2>
        <SupplierProductList />
      </div>
    </div>
  );
}
