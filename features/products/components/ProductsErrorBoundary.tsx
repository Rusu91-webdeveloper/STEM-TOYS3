"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import React, { Component, ErrorInfo, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class ProductsErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate a unique error ID for tracking
    const errorId = `products-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error("Products Error Boundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: error.message,
        fatal: false,
        custom_map: {
          error_boundary: "ProductsErrorBoundary",
          component_stack: errorInfo.componentStack,
        },
      });
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorId: "" });
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  handleResetError = () => {
    this.retryCount = 0;
    this.setState({ hasError: false, error: undefined, errorId: "" });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                We encountered an error while loading the products. This might
                be a temporary issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error details for development */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">
                    Error Details (Development Only):
                  </h4>
                  <code className="text-xs text-red-600 break-all">
                    {this.state.error.message}
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {this.state.errorId}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                  disabled={this.retryCount >= this.maxRetries}
                >
                  <RefreshCw className="h-4 w-4" />
                  {this.retryCount >= this.maxRetries
                    ? "Max retries reached"
                    : "Try again"}
                </Button>

                <Link href="/">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Home className="h-4 w-4" />
                    Go to homepage
                  </Button>
                </Link>
              </div>

              {/* Help text */}
              <div className="text-center text-sm text-gray-500">
                <p>
                  If this problem persists, please contact our support team.
                </p>
                <p className="mt-1">
                  Reference ID:{" "}
                  <span className="font-mono">{this.state.errorId}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specific error boundary for product filters
export function ProductFiltersErrorBoundary({
  children,
  onError,
}: {
  children: ReactNode;
  onError?: () => void;
}) {
  return (
    <ProductsErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Product filters error:", error, errorInfo);
        onError?.();
      }}
      fallback={
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Filter Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            Unable to load product filters. Please refresh the page.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 text-red-700 border-red-300"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </Button>
        </div>
      }
    >
      {children}
    </ProductsErrorBoundary>
  );
}

// Specific error boundary for product grid
export function ProductGridErrorBoundary({
  children,
  onRetry,
}: {
  children: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <ProductsErrorBoundary
      fallback={
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Unable to load products
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            There was an error loading the product list. This might be a
            temporary issue.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              size="sm"
              onClick={onRetry || (() => window.location.reload())}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Link href="/">
              <Button size="sm" variant="outline">
                Go to homepage
              </Button>
            </Link>
          </div>
        </div>
      }
    >
      {children}
    </ProductsErrorBoundary>
  );
}
