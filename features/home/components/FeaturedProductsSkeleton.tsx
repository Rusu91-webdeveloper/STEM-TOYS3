import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedProductsSkeletonProps {
  count?: number;
}

export const FeaturedProductsSkeleton = ({
  count = 3,
}: FeaturedProductsSkeletonProps) => (
  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-none">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="bg-background rounded-xl overflow-hidden shadow-md border border-gray-200 h-full flex flex-col w-full"
      >
        {/* Image skeleton with exact dimensions */}
        <div className="relative h-40 xs:h-52 w-full overflow-hidden">
          <Skeleton variant="wave" className="w-full h-full rounded-t-xl" />
        </div>

        {/* Content skeleton matching the product card layout */}
        <div className="p-4 xs:p-5 flex flex-col flex-grow">
          {/* Product name skeleton */}
          <Skeleton variant="wave" className="h-4 xs:h-5 md:h-6 w-3/4 mb-2" />

          {/* Description skeleton - 2 lines */}
          <div className="space-y-2 mb-4 flex-grow">
            <Skeleton variant="wave" className="h-3 xs:h-4 w-full" />
            <Skeleton variant="wave" className="h-3 xs:h-4 w-2/3" />
          </div>

          {/* Price and button skeleton */}
          <div className="flex items-center justify-between mt-auto">
            <Skeleton variant="wave" className="h-4 xs:h-5 md:h-6 w-20" />
            <Skeleton variant="wave" className="h-8 xs:h-9 w-20 rounded ml-2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
