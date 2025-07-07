import { LoadingSkeletonCard } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        {/* Sidebar */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-10 w-full"
              />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-8">
          <div>
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-5 w-64 mb-6" />
            <div className="grid gap-6 md:grid-cols-2">
              <LoadingSkeletonCard lines={4} />
              <LoadingSkeletonCard lines={4} />
            </div>
          </div>

          <div>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              <LoadingSkeletonCard lines={3} />
              <LoadingSkeletonCard lines={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
