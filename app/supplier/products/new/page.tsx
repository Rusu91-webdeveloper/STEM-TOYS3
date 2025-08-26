import { Metadata } from "next";
import { SupplierProductForm } from "@/features/supplier/components/products/SupplierProductForm";

export const metadata: Metadata = {
  title: "Add New Product | Supplier Dashboard",
  description: "Add a new product to your catalog",
};

export default function NewProductPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground">
          Create a new product for your catalog
        </p>
      </div>
      
      <SupplierProductForm />
    </div>
  );
}
