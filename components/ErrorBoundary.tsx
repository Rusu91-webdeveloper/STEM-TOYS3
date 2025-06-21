"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: "page" | "component" | "critical";
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console and external service
    this.logError(error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const { level = "component" } = this.props;

    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      errorInfo: errorInfo.componentStack,
      level,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "Unknown",
      url: typeof window !== "undefined" ? window.location.href : "Unknown",
      errorId: this.state.errorId,
    };

    // Log to console with appropriate level
    if (level === "critical") {
      console.error("🚨 CRITICAL ERROR:", errorDetails);
    } else {
      console.error("❌ Component Error:", errorDetails);
    }

    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === "production") {
      this.sendToErrorTracking(errorDetails);
    }
  };

  private sendToErrorTracking = (errorDetails: any) => {
    // Placeholder for error tracking service integration
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    try {
      // Example: Send to your error tracking API
      fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorDetails),
      }).catch(console.error);
    } catch (err) {
      console.error("Failed to send error to tracking service:", err);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: "",
      });
    }
  };

  private handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  private copyErrorDetails = () => {
    const errorText = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${typeof window !== "undefined" ? window.location.href : "Unknown"}
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = "component" } = this.props;
      const canRetry = this.retryCount < this.maxRetries;

      // Critical error - show minimal UI
      if (level === "critical") {
        return (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
            <div className="max-w-md w-full text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-700 mb-2">
                Critical Error
              </h1>
              <p className="text-red-600 mb-6">
                The application encountered a critical error and needs to be
                restarted.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={this.handleRefresh}
                  className="w-full bg-red-600 hover:bg-red-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart Application
                </Button>
                <Button
                  variant="outline"
                  onClick={this.copyErrorDetails}
                  className="w-full text-red-600 border-red-300 hover:bg-red-50">
                  <Bug className="h-4 w-4 mr-2" />
                  Copy Error Details
                </Button>
              </div>
              <p className="text-sm text-red-500 mt-4">
                Error ID: {this.state.errorId}
              </p>
            </div>
          </div>
        );
      }

      // Page-level error
      if (level === "page") {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-lg w-full">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <AlertTitle className="text-orange-700">Page Error</AlertTitle>
                <AlertDescription className="text-orange-600 mt-2">
                  This page encountered an error and couldn't load properly.
                  {process.env.NODE_ENV === "development" && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-medium">
                        Error Details (Development)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto bg-orange-100 p-2 rounded">
                        {this.state.error?.message}
                        {"\n\n"}
                        {this.state.error?.stack}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="default"
                    className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Component-level error (default)
      return (
        <Alert className="border-red-200 bg-red-50 my-4">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700">Component Error</AlertTitle>
          <AlertDescription className="text-red-600">
            This component encountered an error and couldn't render properly.
            {canRetry && (
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="mt-2 text-red-600 border-red-300 hover:bg-red-50">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry ({this.maxRetries - this.retryCount} left)
              </Button>
            )}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs overflow-auto bg-red-100 p-2 rounded max-h-32">
                  {this.state.error?.message}
                  {"\n\n"}
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for easy error boundary wrapping
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manual error reporting
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: Partial<ErrorInfo>) => {
    // This will trigger the nearest error boundary
    throw error;
  };
}
