import { Metadata } from "next";
import { SupplierProductList } from "@/features/supplier/components/products/SupplierProductList";

export const metadata: Metadata = {
  title: "Products | Supplier Dashboard",
  description: "Manage your products in the TechTots supplier portal",
};

export default function SupplierProductsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product catalog and track performance
        </p>
      </div>
      
      <SupplierProductList />
    </div>
  );
}
