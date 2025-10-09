import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SupplierProductWizard } from "@/features/supplier/components/products/SupplierProductWizard";

export const metadata: Metadata = {
  title: "Add New Product | Supplier Dashboard",
  description:
    "Add a new product to your catalog with our easy step-by-step wizard",
};

export default function NewProductPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/supplier/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground mt-2">
          Follow the simple steps below to create your product listing
        </p>
      </div>

      {/* Wizard */}
      <SupplierProductWizard />
    </div>
  );
}
