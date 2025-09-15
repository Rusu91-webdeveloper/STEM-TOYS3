import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesSkeleton() {
  return (
    <div className="container mx-auto px-0 sm:px-4 py-8 sm:py-12">
      <Skeleton className="h-8 sm:h-10 md:h-12 w-64 sm:w-80 mx-auto mb-3 sm:mb-6" />
      <Skeleton className="h-4 sm:h-5 w-full max-w-3xl mx-auto mb-8 sm:mb-16" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700"
          >
            {/* Image skeleton */}
            <div className="relative w-full h-48 sm:h-56 md:h-64">
              <Skeleton className="h-full w-full" />
            </div>

            {/* Content skeleton */}
            <div className="p-4 sm:p-6 space-y-3">
              {/* Title skeleton */}
              <Skeleton className="h-6 sm:h-7 w-3/4" />

              {/* Description skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>

              {/* Benefits section skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <div className="flex flex-wrap gap-1.5">
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-md" />
                  <Skeleton className="h-6 w-18 rounded-md" />
                </div>
              </div>

              {/* CTA skeleton */}
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
