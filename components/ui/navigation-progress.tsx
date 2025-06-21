/**
 * A global navigation progress indicator that appears at the top of the page
 * during page transitions. This provides visual feedback to the user when
 * navigating between pages.
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Internal component that uses useSearchParams and usePathname
function NavigationProgressContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When the route changes, trigger the navigation indicator
    setIsNavigating(true);
    setProgress(30); // Start at 30%

    const timer1 = setTimeout(() => setProgress(75), 200); // Progress to 75% quickly
    const timer2 = setTimeout(() => setProgress(90), 500); // Then slow down to 90%

    // Reset when complete (after the transition animation)
    const timer3 = setTimeout(() => {
      setProgress(100); // Complete the progress

      // Reset after animation completes
      const timer4 = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200); // Match the transition duration

      return () => clearTimeout(timer4);
    }, 800);

    // Clean up timers
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 z-50 transition-opacity duration-200",
        isNavigating ? "opacity-100" : "opacity-0"
      )}>
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Loading fallback - simpler version of the progress bar
function NavigationProgressFallback() {
  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 opacity-0">
      <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
    </div>
  );
}

// Export the main component with Suspense boundary
export function NavigationProgress() {
  return (
    <Suspense fallback={<NavigationProgressFallback />}>
      <NavigationProgressContent />
    </Suspense>
  );
}
