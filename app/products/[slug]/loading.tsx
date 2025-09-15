import { LoadingSkeletonCard } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Product Gallery */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg sm:rounded-xl border">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-md border"
              >
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <Skeleton className="h-6 sm:h-8 w-2/3 mb-2" />
            <div className="flex items-center mt-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-3 sm:h-4 sm:w-4" />
                ))}
              </div>
              <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 ml-2" />
            </div>
          </div>

          <div className="flex items-center">
            <Skeleton className="h-6 sm:h-8 w-20 sm:w-24" />
          </div>

          <Skeleton className="h-16 sm:h-20 w-full" />

          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
            <Skeleton className="h-4 sm:h-5 w-32 sm:w-48" />
            <Skeleton className="h-4 sm:h-5 w-28 sm:w-40" />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 sm:pt-4 flex flex-col gap-2 sm:gap-3">
            <Skeleton className="h-10 sm:h-12 w-full" />
            <Skeleton className="h-8 sm:h-10 w-full" />
          </div>

          {/* Shipping Info */}
          <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6">
            <Skeleton className="h-0.5 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-3 sm:p-4"
                >
                  <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 mb-1 sm:mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-24 mb-1" />
                  <Skeleton className="h-2 sm:h-3 w-20 sm:w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-8 sm:mt-12 lg:mt-16">
        <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 mb-3 sm:mb-4" />
        <Skeleton className="h-0.5 w-full mb-4 sm:mb-6" />
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-3 sm:h-4 w-full" />
          <Skeleton className="h-3 sm:h-4 w-5/6" />
          <Skeleton className="h-3 sm:h-4 w-full" />
          <Skeleton className="h-4 sm:h-6 w-48 sm:w-64 mt-4 sm:mt-6" />
          <div className="pl-4 sm:pl-6 space-y-1.5 sm:space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 sm:h-4 w-5/6" />
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8 sm:mt-12 lg:mt-16">
        <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 mb-3 sm:mb-4" />
        <Skeleton className="h-0.5 w-full mb-4 sm:mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeletonCard key={i} lines={2} />
          ))}
        </div>
      </div>
    </div>
  );
}
