import {
  CheckCircle,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

import { ImageManagementDashboard } from "@/components/admin/images/ImageManagementDashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      {/* New Image Processing System Status */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            New Image Processing System Active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-700">
            The new image processing system is now active and automatically
            generates multiple image sizes for optimal performance across all
            devices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Smartphone className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <div className="text-sm font-medium text-green-800">
                Thumbnail
              </div>
              <div className="text-xs text-green-600">150×150</div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Tablet className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <div className="text-sm font-medium text-green-800">Small</div>
              <div className="text-xs text-green-600">300×300</div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Monitor className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <div className="text-sm font-medium text-green-800">Medium</div>
              <div className="text-xs text-green-600">600×600</div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <Monitor className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <div className="text-sm font-medium text-green-800">Large</div>
              <div className="text-xs text-green-600">1200×1200</div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <ImageIcon className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <div className="text-sm font-medium text-green-800">Original</div>
              <div className="text-xs text-green-600">Full Size</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>
              All new supplier product images are automatically processed
            </span>
          </div>
        </CardContent>
      </Card>

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
