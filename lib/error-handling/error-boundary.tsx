"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

import { performanceMonitor } from "../monitoring/performance-monitor";

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?:
    | ReactNode
    | ((error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  errorReporting?: boolean;
  showErrorDetails?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, errorReporting = true } = this.props;
    const { errorId } = this.state;

    // Log error for monitoring
    if (errorReporting) {
      this.reportError(error, errorInfo, errorId);
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  private reportError(error: Error, errorInfo: ErrorInfo, errorId?: string) {
    try {
      // Record error in performance monitor
      performanceMonitor.recordApiRequest(
        "ERROR",
        "error-boundary",
        Date.now(),
        500,
        false,
        undefined,
        error.message,
        {
          errorId,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
          errorName: error.name,
        }
      );

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("Error Boundary caught an error:", {
          error,
          errorInfo,
          errorId,
        });
      }

      // Send to external error reporting service (if configured)
      this.sendToErrorReporting(error, errorInfo, errorId);
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError);
    }
  }

  private sendToErrorReporting(
    error: Error,
    errorInfo: ErrorInfo,
    errorId?: string
  ) {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just log to console
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: error.message,
        fatal: false,
        custom_map: {
          error_id: errorId,
          component_stack: errorInfo.componentStack,
        },
      });
    }
  }

  private retry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.error("Max retries exceeded");
      return;
    }

    // Clear any existing timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Set retry timeout
    this.retryTimeout = setTimeout(
      () => {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          errorId: undefined,
          retryCount: retryCount + 1,
        });
      },
      retryDelay * (retryCount + 1)
    ); // Exponential backoff
  };

  private reset = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      retryCount: 0,
    });
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const {
      children,
      fallback,
      maxRetries = 3,
      showErrorDetails = false,
    } = this.props;

    if (!hasError) {
      return children;
    }

    // Custom fallback component
    if (fallback) {
      if (typeof fallback === "function") {
        return fallback(error!, errorInfo!, this.retry);
      }
      return fallback;
    }

    // Default error UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-500">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We&apos;re sorry, but something went wrong. Our team has been
              notified and is working to fix this issue.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {retryCount < maxRetries && (
              <button
                onClick={this.retry}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again ({retryCount + 1}/{maxRetries})
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Reload Page
            </button>

            {showErrorDetails && error && (
              <details className="mt-4 p-4 bg-gray-100 rounded-md">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Error Details
                </summary>
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    <strong>Error:</strong> {error.message}
                  </p>
                  <p>
                    <strong>Type:</strong> {error.name}
                  </p>
                  {error.stack && (
                    <pre className="mt-2 text-xs overflow-auto">
                      {error.stack}
                    </pre>
                  )}
                  {errorInfo?.componentStack && (
                    <div className="mt-2">
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs overflow-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);

    // Report error
    performanceMonitor.recordApiRequest(
      "ERROR",
      "use-error-handler",
      Date.now(),
      500,
      false,
      undefined,
      error.message,
      {
        errorStack: error.stack,
        errorName: error.name,
      }
    );
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

export default ErrorBoundary;
