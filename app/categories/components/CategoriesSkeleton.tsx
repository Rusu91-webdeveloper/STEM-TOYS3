import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesSkeleton() {
  return (
    <div className="container mx-auto px-0 sm:px-4 py-8 sm:py-12">
      <Skeleton className="h-8 sm:h-10 md:h-12 w-64 sm:w-80 mx-auto mb-3 sm:mb-6" />
      <Skeleton className="h-4 sm:h-5 w-full max-w-3xl mx-auto mb-8 sm:mb-16" />

      <div className="space-y-12 sm:space-y-16 md:space-y-24">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`relative flex flex-col sm:flex-row ${
              index % 2 !== 0 ? "sm:flex-row-reverse" : ""
            } gap-0 sm:gap-8 md:gap-12 items-stretch shadow-lg rounded-xl sm:rounded-2xl overflow-hidden
              w-full mx-2 sm:mx-0 md:w-full
              bg-background
              p-0 sm:px-8 sm:py-10 md:px-12 md:py-14
            `}
            style={{ maxWidth: "100vw", minHeight: "min(340px, 60vw)" }}
          >
            {/* Image skeleton */}
            <div className="relative w-full sm:w-2/5 h-[160px] sm:h-auto flex-shrink-0 flex-grow-0">
              <Skeleton className="h-full w-full min-h-[120px] sm:min-h-0 rounded-t-xl sm:rounded-t-none sm:rounded-l-2xl" />
            </div>

            {/* Content skeleton */}
            <div className="w-full sm:w-3/5 flex flex-col justify-center space-y-3 sm:space-y-4 md:space-y-6 p-4 sm:p-8 md:p-10">
              <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 rounded-full" />
              <Skeleton className="h-8 sm:h-12 w-48 sm:w-64" />
              <Skeleton className="h-16 sm:h-24 w-full" />
              <Skeleton className="h-8 sm:h-10 w-32 sm:w-40 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
