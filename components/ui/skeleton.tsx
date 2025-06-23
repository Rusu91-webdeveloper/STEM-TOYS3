import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "relative overflow-hidden rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "animate-shimmer bg-gradient-to-r from-muted via-muted/80 to-muted",
        pulse: "animate-pulse",
        wave: "bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer",
      },
      size: {
        sm: "h-4",
        default: "h-6",
        lg: "h-8",
        xl: "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, size, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// Specialized skeleton components for common use cases
interface SkeletonTextProps {
  lines?: number
  className?: string
  variant?: VariantProps<typeof skeletonVariants>['variant']
}

function SkeletonText({ lines = 3, className, variant = "default" }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full" // Last line is shorter
          )}
        />
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  className?: string
  variant?: VariantProps<typeof skeletonVariants>['variant']
  showImage?: boolean
  showActions?: boolean
}

function SkeletonCard({ 
  className, 
  variant = "default", 
  showImage = true, 
  showActions = false 
}: SkeletonCardProps) {
  return (
    <div className={cn("space-y-4 rounded-lg border p-4", className)}>
      {showImage && (
        <Skeleton variant={variant} className="aspect-video w-full rounded-md" />
      )}
      <div className="space-y-2">
        <Skeleton variant={variant} className="h-6 w-3/4" />
        <SkeletonText lines={2} variant={variant} />
      </div>
      {showActions && (
        <div className="flex space-x-2">
          <Skeleton variant={variant} className="h-9 w-20" />
          <Skeleton variant={variant} className="h-9 w-16" />
        </div>
      )}
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
  variant?: VariantProps<typeof skeletonVariants>['variant']
}

function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  className, 
  variant = "default" 
}: SkeletonTableProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant={variant} className="h-5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              variant={variant} 
              className="h-4 flex-1" 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface SkeletonProductProps {
  className?: string
  variant?: VariantProps<typeof skeletonVariants>['variant']
  layout?: 'grid' | 'list'
}

function SkeletonProduct({ 
  className, 
  variant = "default", 
  layout = 'grid' 
}: SkeletonProductProps) {
  if (layout === 'list') {
    return (
      <div className={cn("flex space-x-4 rounded-lg border p-4", className)}>
        <Skeleton variant={variant} className="h-24 w-24 rounded-md flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant={variant} className="h-5 w-3/4" />
          <Skeleton variant={variant} className="h-4 w-1/2" />
          <Skeleton variant={variant} className="h-6 w-1/4" />
          <div className="flex space-x-2">
            <Skeleton variant={variant} className="h-8 w-20" />
            <Skeleton variant={variant} className="h-8 w-8" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3 rounded-lg border p-4", className)}>
      <Skeleton variant={variant} className="aspect-square w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton variant={variant} className="h-5 w-full" />
        <Skeleton variant={variant} className="h-4 w-3/4" />
        <Skeleton variant={variant} className="h-6 w-1/3" />
      </div>
      <div className="flex space-x-2">
        <Skeleton variant={variant} className="h-9 flex-1" />
        <Skeleton variant={variant} className="h-9 w-9" />
      </div>
    </div>
  )
}

interface SkeletonPageProps {
  className?: string
  variant?: VariantProps<typeof skeletonVariants>['variant']
}

function SkeletonPage({ className, variant = "default" }: SkeletonPageProps) {
  return (
    <div className={cn("container mx-auto space-y-8 py-8", className)}>
      {/* Header */}
      <div className="space-y-4">
        <Skeleton variant={variant} className="h-12 w-1/2" />
        <SkeletonText lines={2} variant={variant} className="max-w-2xl" />
      </div>
      
      {/* Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} variant={variant} />
        ))}
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonProduct,
  SkeletonPage,
  skeletonVariants,
  type SkeletonProps,
  type SkeletonTextProps,
  type SkeletonCardProps,
  type SkeletonTableProps,
  type SkeletonProductProps,
  type SkeletonPageProps,
}
