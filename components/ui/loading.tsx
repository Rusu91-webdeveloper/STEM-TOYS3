import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2, RefreshCcw, Download, Upload, Search, ShoppingCart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        success: "text-success",
        warning: "text-warning",
        destructive: "text-destructive",
      },
      size: {
        sm: "w-4 h-4",
        default: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-8 h-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      speed: {
        slow: "animate-spin-slow",
        default: "animate-spin",
        fast: "animate-spin duration-500",
      },
    },
    defaultVariants: {
      speed: "default",
    },
  }
)

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants>,
    VariantProps<typeof spinnerVariants> {
  icon?: React.ComponentType<any>
  label?: string
}

function LoadingSpinner({ 
  className, 
  variant, 
  size, 
  speed = "default",
  icon: Icon = Loader2,
  label,
  ...props 
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(loadingVariants({ variant, size, className }))}
      role="status"
      aria-label={label || "Loading"}
      {...props}
    >
      <Icon className={cn(spinnerVariants({ speed }))} />
      {label && <span className="sr-only">{label}</span>}
    </div>
  )
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

interface LoadingButtonProps {
  isLoading?: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
  disabled?: boolean
  variant?: VariantProps<typeof loadingVariants>['variant']
  icon?: React.ComponentType<any>
}

function LoadingButton({ 
  isLoading = false, 
  children, 
  loadingText, 
  className,
  disabled,
  variant = "primary",
  icon: Icon = Loader2,
  ...props 
}: LoadingButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Icon className="w-4 h-4 animate-spin" />}
      {isLoading ? loadingText || "Loading..." : children}
    </button>
  )
}

interface LoadingOverlayProps {
  isVisible: boolean
  children?: React.ReactNode
  className?: string
  variant?: VariantProps<typeof loadingVariants>['variant']
  size?: VariantProps<typeof loadingVariants>['size']
  label?: string
  backdrop?: boolean
}

function LoadingOverlay({ 
  isVisible, 
  children, 
  className,
  variant = "primary",
  size = "lg",
  label = "Loading",
  backdrop = true,
  ...props 
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center",
        backdrop && "bg-background/80 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-label={label}
      {...props}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner variant={variant} size={size} label={label} />
        {children && (
          <div className="text-sm text-muted-foreground text-center">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

interface ProgressLoadingProps {
  progress: number
  label?: string
  showPercentage?: boolean
  className?: string
  variant?: VariantProps<typeof loadingVariants>['variant']
}

function ProgressLoading({ 
  progress, 
  label, 
  showPercentage = true,
  className,
  variant = "primary",
  ...props 
}: ProgressLoadingProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          {showPercentage && <span>{clampedProgress}%</span>}
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            variant === "primary" && "bg-primary",
            variant === "secondary" && "bg-secondary",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "destructive" && "bg-destructive"
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  )
}

interface LoadingDotsProps {
  className?: string
  variant?: VariantProps<typeof loadingVariants>['variant']
  size?: VariantProps<typeof loadingVariants>['size']
  label?: string
}

function LoadingDots({ 
  className, 
  variant = "default",
  size = "default",
  label = "Loading"
}: LoadingDotsProps) {
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : size === "lg" ? "w-3 h-3" : "w-2 h-2"
  
  return (
    <div
      className={cn("flex items-center space-x-1", className)}
      role="status"
      aria-label={label}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full animate-pulse",
            dotSize,
            variant === "primary" && "bg-primary",
            variant === "secondary" && "bg-secondary",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "destructive" && "bg-destructive",
            variant === "default" && "bg-muted-foreground"
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1.4s",
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

// Specialized loading components for common operations
interface LoadingOperationProps {
  operation: 'search' | 'upload' | 'download' | 'refresh' | 'cart' | 'processing'
  isVisible: boolean
  message?: string
  className?: string
}

function LoadingOperation({ 
  operation, 
  isVisible, 
  message,
  className 
}: LoadingOperationProps) {
  if (!isVisible) return null

  const icons = {
    search: Search,
    upload: Upload,
    download: Download,
    refresh: RefreshCcw,
    cart: ShoppingCart,
    processing: Loader2,
  }

  const messages = {
    search: "Searching...",
    upload: "Uploading...",
    download: "Downloading...",
    refresh: "Refreshing...",
    cart: "Adding to cart...",
    processing: "Processing...",
  }

  const Icon = icons[operation]
  const defaultMessage = messages[operation]

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Icon className="w-4 h-4 animate-spin" />
      <span>{message || defaultMessage}</span>
    </div>
  )
}

interface InlineLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

function InlineLoading({ 
  isLoading, 
  children, 
  fallback,
  className 
}: InlineLoadingProps) {
  return (
    <div className={cn("min-h-[1.5rem] flex items-center", className)}>
      {isLoading ? (
        fallback || <LoadingDots size="sm" />
      ) : (
        children
      )}
    </div>
  )
}

export {
  LoadingSpinner,
  LoadingButton,
  LoadingOverlay,
  ProgressLoading,
  LoadingDots,
  LoadingOperation,
  InlineLoading,
  loadingVariants,
  spinnerVariants,
  type LoadingSpinnerProps,
  type LoadingButtonProps,
  type LoadingOverlayProps,
  type ProgressLoadingProps,
  type LoadingDotsProps,
  type LoadingOperationProps,
  type InlineLoadingProps,
}
