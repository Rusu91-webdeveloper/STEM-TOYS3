import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateBlogJob } from "@/inngest/functions/generate-blog";
import { enhanceProductsJob } from "@/inngest/functions/enhance-products";
import { bulkUploadProductsJob } from "@/inngest/functions/bulk-upload-products";
import { supplierBulkUploadProductsJob } from "@/inngest/functions/supplier-bulk-upload-products";

// Log registration status in non-production environments
if (process.env.NODE_ENV !== "production") {
  console.log("[Inngest API] Registering 4 Inngest functions:");
  console.log("  - generate-blog: Generate Blog with AI");
  console.log("  - enhance-products: Enhance Products with AI");
  console.log("  - bulk-upload-products: Bulk Upload Products (Admin)");
  console.log(
    "  - supplier-bulk-upload-products: Bulk Upload Products (Supplier)"
  );
}

// Create the Inngest serve handler
const handler = serve({
  client: inngest,
  functions: [
    generateBlogJob,
    enhanceProductsJob,
    bulkUploadProductsJob,
    supplierBulkUploadProductsJob,
  ],
  // Signing key is automatically read from INNGEST_SIGNING_KEY env var
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

// Export the handlers
export const { GET, POST, PUT } = handler;
