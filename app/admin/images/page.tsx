import { Metadata } from "next";

import { ImageProcessingManager } from "@/features/admin/images/components/ImageProcessingManager";

export const metadata: Metadata = {
  title: "Image Processing | Admin Dashboard",
  description: "Manage image uploads, processing, optimization, and metadata",
};

export default function ImagesPage() {
  return <ImageProcessingManager />;
}
