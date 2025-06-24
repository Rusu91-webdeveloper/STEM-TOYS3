"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: "vertical" | "horizontal" | "both";
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", ...props }, ref) => {
    const getScrollClass = () => {
      switch (orientation) {
        case "horizontal":
          return "overflow-x-auto overflow-y-hidden";
        case "both":
          return "overflow-auto";
        default:
          return "overflow-y-auto overflow-x-hidden";
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative",
          getScrollClass(),
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
          "hover:scrollbar-thumb-gray-400",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
export type { ScrollAreaProps };
