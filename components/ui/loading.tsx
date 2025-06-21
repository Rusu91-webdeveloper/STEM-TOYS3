import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  text,
  className,
  ...props
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-4",
        className
      )}
      {...props}>
      <Loader2
        className={cn(sizeMap[size], "animate-spin text-primary mb-2")}
      />
      {text && (
        <p className="text-muted-foreground text-sm font-medium">{text}</p>
      )}
    </div>
  );
}

interface LoadingSkeletonCardProps {
  lines?: number;
  header?: boolean;
  footer?: boolean;
  className?: string;
}

export function LoadingSkeletonCard({
  lines = 3,
  header = true,
  footer = false,
  className,
}: LoadingSkeletonCardProps) {
  return (
    <div className={cn("space-y-3 rounded-lg border p-4", className)}>
      {header && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 w-${i % 2 === 0 ? "full" : "4/5"}`}
          />
        ))}
      </div>

      {footer && (
        <div className="pt-2">
          <Skeleton className="h-9 w-full" />
        </div>
      )}
    </div>
  );
}

interface LoadingGridProps {
  count?: number;
  columns?: number;
  className?: string;
}

export function LoadingGrid({
  count = 6,
  columns = 3,
  className,
}: LoadingGridProps) {
  return (
    <div
      className={cn(
        `grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-${
          columns > 4 ? 4 : columns
        } lg:grid-cols-${columns}`,
        className
      )}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeletonCard
          key={i}
          lines={3}
          footer={true}
        />
      ))}
    </div>
  );
}

interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({
  message = "Loading...",
}: FullPageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
      <h2 className="mt-4 text-xl font-semibold">{message}</h2>
    </div>
  );
}

export function LoadingButton({ className }: { className?: string }) {
  return (
    <div className={cn("h-10 rounded-md bg-muted animate-pulse", className)} />
  );
}

export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "aspect-square rounded-md bg-muted animate-pulse",
        className
      )}
    />
  );
}
