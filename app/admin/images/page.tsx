import { Suspense } from "react";
import { Metadata } from "next";
import { ImageManagementDashboard } from "@/components/admin/images/ImageManagementDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Image Management | Admin Dashboard",
  description: "Manage and optimize all images across the platform",
};

export default function AdminImagesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Image Management
          </h1>
          <p className="text-muted-foreground">
            Manage, optimize, and monitor all images across the platform
          </p>
        </div>
      </div>

      <Suspense fallback={<ImageManagementSkeleton />}>
        <ImageManagementDashboard />
      </Suspense>
    </div>
  );
}

function ImageManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
