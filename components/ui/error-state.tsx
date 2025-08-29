"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertTriangle,
  RefreshCcw,
  Wifi,
  WifiOff,
  FileX,
  SearchX,
  UserX,
  Lock,
  Clock,
  AlertCircle,
  Bug,
  Server,
  Database,
  Mail,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const errorStateVariants = cva(
  "flex flex-col items-center justify-center text-center space-y-4 p-8",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        destructive: "text-destructive",
        warning: "text-warning",
        info: "text-info",
      },
      size: {
        sm: "py-4 space-y-2",
        default: "py-8 space-y-4",
        lg: "py-12 space-y-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ErrorStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorStateVariants> {
  title?: string;
  description?: string;
  icon?: React.ComponentType<any>;
  action?: React.ReactNode;
  retry?: () => void;
  retryText?: string;
  showRetry?: boolean;
}

function ErrorState({
  className,
  variant,
  size,
  title = "Something went wrong",
  description,
  icon: Icon = AlertTriangle,
  action,
  retry,
  retryText = "Try again",
  showRetry = true,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(errorStateVariants({ variant, size, className }))}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="flex flex-col items-center space-y-4">
        <Icon
          className="w-12 h-12 text-muted-foreground/60"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-md">
              {description}
            </p>
          )}
        </div>
        {(action || (retry && showRetry)) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {retry && showRetry && (
              <Button
                onClick={retry}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                {retryText}
              </Button>
            )}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized error components for common scenarios
interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorState
      className={className}
      title="Connection Problem"
      description="Please check your internet connection and try again."
      icon={WifiOff}
      retry={onRetry}
      retryText="Reconnect"
      variant="warning"
    />
  );
}

interface NotFoundErrorProps {
  resource?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
}

function NotFoundError({
  resource = "page",
  onGoBack,
  onGoHome,
  className,
}: NotFoundErrorProps) {
  return (
    <ErrorState
      className={className}
      title={`${resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found`}
      description={`The ${resource} you're looking for doesn't exist or has been moved.`}
      icon={SearchX}
      showRetry={false}
      action={
        <div className="flex gap-2">
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline" size="sm">
              Go Back
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} size="sm">
              Go Home
            </Button>
          )}
        </div>
      }
    />
  );
}

interface PermissionErrorProps {
  onLogin?: () => void;
  onGoBack?: () => void;
  className?: string;
}

function PermissionError({
  onLogin,
  onGoBack,
  className,
}: PermissionErrorProps) {
  return (
    <ErrorState
      className={className}
      title="Access Denied"
      description="You don't have permission to view this content. Please sign in or contact support."
      icon={Lock}
      showRetry={false}
      variant="warning"
      action={
        <div className="flex gap-2">
          {onLogin && (
            <Button onClick={onLogin} size="sm">
              Sign In
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline" size="sm">
              Go Back
            </Button>
          )}
        </div>
      }
    />
  );
}

interface ServerErrorProps {
  onRetry?: () => void;
  onContact?: () => void;
  className?: string;
}

function ServerError({ onRetry, onContact, className }: ServerErrorProps) {
  return (
    <ErrorState
      className={className}
      title="Server Error"
      description="We're experiencing technical difficulties. Our team has been notified."
      icon={Server}
      retry={onRetry}
      variant="destructive"
      action={
        onContact && (
          <Button
            onClick={onContact}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </Button>
        )
      }
    />
  );
}

interface TimeoutErrorProps {
  onRetry?: () => void;
  className?: string;
}

function TimeoutError({ onRetry, className }: TimeoutErrorProps) {
  return (
    <ErrorState
      className={className}
      title="Request Timeout"
      description="The request took too long to complete. Please try again."
      icon={Clock}
      retry={onRetry}
      variant="warning"
    />
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<any>;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  title = "No data found",
  description = "There's nothing to show here yet.",
  icon: Icon = FileX,
  action,
  className,
}: EmptyStateProps) {
  return (
    <ErrorState
      className={className}
      title={title}
      description={description}
      icon={Icon}
      showRetry={false}
      action={action}
      variant="info"
    />
  );
}

interface LoadFailedErrorProps {
  resource?: string;
  onRetry?: () => void;
  onRefresh?: () => void;
  className?: string;
}

function LoadFailedError({
  resource = "content",
  onRetry,
  onRefresh,
  className,
}: LoadFailedErrorProps) {
  return (
    <ErrorState
      className={className}
      title={`Failed to Load ${resource.charAt(0).toUpperCase() + resource.slice(1)}`}
      description={`We couldn't load the ${resource}. This might be a temporary issue.`}
      icon={AlertCircle}
      retry={onRetry || onRefresh}
      variant="destructive"
    />
  );
}

interface DatabaseErrorProps {
  onRetry?: () => void;
  onReport?: () => void;
  className?: string;
}

function DatabaseError({ onRetry, onReport, className }: DatabaseErrorProps) {
  return (
    <ErrorState
      className={className}
      title="Database Connection Error"
      description="We're having trouble connecting to our database. Please try again in a moment."
      icon={Database}
      retry={onRetry}
      variant="destructive"
      action={
        onReport && (
          <Button
            onClick={onReport}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Bug className="w-4 h-4" />
            Report Issue
          </Button>
        )
      }
    />
  );
}

// Error boundary component
interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
  className?: string;
}

function ErrorBoundaryFallback({
  error,
  resetError,
  className,
}: ErrorBoundaryFallbackProps) {
  React.useEffect(() => {
    // Log error to monitoring service
    console.error("Error Boundary caught an error:", error);
  }, [error]);

  return (
    <ErrorState
      className={className}
      title="Something Went Wrong"
      description="The application encountered an unexpected error. Please try refreshing the page."
      icon={Bug}
      retry={resetError}
      retryText="Refresh Page"
      variant="destructive"
      action={
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          Reload Application
        </Button>
      }
    />
  );
}

export {
  ErrorState,
  NetworkError,
  NotFoundError,
  PermissionError,
  ServerError,
  TimeoutError,
  EmptyState,
  LoadFailedError,
  DatabaseError,
  ErrorBoundaryFallback,
  errorStateVariants,
  type ErrorStateProps,
  type NetworkErrorProps,
  type NotFoundErrorProps,
  type PermissionErrorProps,
  type ServerErrorProps,
  type TimeoutErrorProps,
  type EmptyStateProps,
  type LoadFailedErrorProps,
  type DatabaseErrorProps,
  type ErrorBoundaryFallbackProps,
};
