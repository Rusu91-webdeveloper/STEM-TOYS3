"use client";

import dynamic from "next/dynamic";

export const DynamicNavigationProgress = dynamic(
  () =>
    import("@/components/ui/navigation-progress").then(
      mod => mod.NavigationProgress
    ),
  {
    ssr: false, // This component is client-side only
  }
);
