import { Skeleton } from "@/components/ui/skeleton";
import {
  glassPanelClass,
  glassCardClass,
  homeBackgroundClass,
  homeContentWrapperClass,
  homeOverlayBottomClass,
  homeOverlayTopClass,
} from "@/features/home/components/homeTheme";

export function CategoriesSkeleton() {
  return (
    <div className={homeBackgroundClass}>
      <div className={homeOverlayTopClass} aria-hidden />
      <div className={homeOverlayBottomClass} aria-hidden />
      <div className={homeContentWrapperClass}>
        <div className="container mx-auto px-4 pt-16 sm:px-6">
          <div
            className={`${glassPanelClass} mx-auto max-w-4xl px-6 py-8 sm:px-10 sm:py-10 text-center`}
          >
            <Skeleton className="mx-auto h-8 w-40 rounded-full sm:h-9" />
            <Skeleton className="mx-auto mt-4 h-10 w-3/4 sm:h-12" />
            <Skeleton className="mx-auto mt-3 h-4 w-full max-w-2xl sm:h-5" />
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`${glassCardClass} overflow-hidden`}>
                <div className="relative h-48 sm:h-56 md:h-64 bg-slate-900/60">
                  <Skeleton className="absolute inset-0 h-full w-full rounded-none opacity-60" />
                </div>
                <div className="p-5 sm:p-7 space-y-4">
                  <Skeleton className="h-7 w-3/4 sm:h-8" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-7 w-20 rounded-xl" />
                      <Skeleton className="h-7 w-24 rounded-xl" />
                      <Skeleton className="h-7 w-20 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-9 w-36 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
