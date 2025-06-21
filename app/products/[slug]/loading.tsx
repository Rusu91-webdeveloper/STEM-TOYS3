import { Skeleton } from "@/components/ui/skeleton";
import { ImageSkeleton, LoadingSkeletonCard } from "@/components/ui/loading";

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            <ImageSkeleton className="w-full h-full" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-md border">
                <ImageSkeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-2/3 mb-2" />
            <div className="flex items-center mt-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-4 w-4"
                  />
                ))}
              </div>
              <Skeleton className="h-4 w-16 ml-2" />
            </div>
          </div>

          <div className="flex items-center">
            <Skeleton className="h-8 w-24" />
          </div>

          <Skeleton className="h-20 w-full" />

          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-40" />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Shipping Info */}
          <div className="space-y-4 pt-6">
            <Skeleton className="h-0.5 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-4">
                  <Skeleton className="h-5 w-5 mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-16">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-0.5 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-64 mt-6" />
          <div className="pl-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-4 w-5/6"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-0.5 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeletonCard
              key={i}
              lines={2}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
