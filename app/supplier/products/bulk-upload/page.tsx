import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SupplierBulkUploadRedesigned } from "@/features/supplier/components/products/SupplierBulkUploadRedesigned";

export const metadata: Metadata = {
  title: "Bulk Upload Products | Supplier Dashboard",
  description:
    "Upload up to 5 products at once using CSV format. Products require admin approval before going live.",
};

export default function BulkUploadPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">
          Bulk Upload Products
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload up to 5 products at once using our CSV template
        </p>
      </div>

      {/* Redesigned Bulk Upload */}
      <SupplierBulkUploadRedesigned />
    </div>
  );
}
