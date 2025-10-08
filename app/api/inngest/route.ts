import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateBlogJob } from "@/inngest/functions/generate-blog";
import { enhanceProductsJob } from "@/inngest/functions/enhance-products";
import { bulkUploadProductsJob } from "@/inngest/functions/bulk-upload-products";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateBlogJob, enhanceProductsJob, bulkUploadProductsJob],
});
