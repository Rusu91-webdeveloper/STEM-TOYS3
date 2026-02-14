import { Metadata } from "next";

import { SupplierProductForm } from "@/features/supplier/components/products/SupplierProductForm";

export const metadata: Metadata = {
  title: "Edit Product | Supplier Dashboard",
  description: "Edit your product details",
};

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">
          Update your product information
        </p>
      </div>

      <SupplierProductForm productId={id} />
    </div>
  );
}
