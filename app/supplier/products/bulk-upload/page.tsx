import { Metadata } from "next";
import { SupplierBulkUpload } from "@/features/supplier/components/products/SupplierBulkUpload";

export const metadata: Metadata = {
  title: "Bulk Upload Products | Supplier Dashboard",
  description: "Upload multiple products at once using CSV or Excel files",
};

export default function BulkUploadPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Upload Products</h1>
        <p className="text-muted-foreground">
          Upload multiple products at once using CSV or Excel files
        </p>
      </div>
      
      <SupplierBulkUpload />
    </div>
  );
}
