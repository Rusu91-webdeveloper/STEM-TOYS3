import React from "react";
import { Metadata } from "next";
import ProductForm from "@/components/admin/ProductForm";
import { CategoryCheck } from "@/components/admin/CategoryCheck";

export const metadata: Metadata = {
  title: "Create Product | Admin Dashboard",
  description: "Create a new product in your store.",
};

export default function CreateProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
        <p className="text-muted-foreground">
          Add a new product to your store with detailed information and SEO
          settings.
        </p>
      </div>

      <CategoryCheck />

      <ProductForm />
    </div>
  );
}
