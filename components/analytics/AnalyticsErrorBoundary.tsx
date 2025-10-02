"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "Analytics Error Boundary caught an error:",
      error,
      errorInfo
    );

    // Log to monitoring service if available
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          component: "AnalyticsErrorBoundary",
        },
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-700">Analytics Error</CardTitle>
            </div>
            <CardDescription>
              Something went wrong while loading the analytics dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Error Details:
              </h4>
              <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                {this.state.error?.message || "Unknown error occurred"}
              </pre>
              {process.env.NODE_ENV === "development" &&
                this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Component Stack (Development Only)
                    </summary>
                    <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap break-words">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
            </div>

            <div className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              If this error persists, please contact support with the error
              details above.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook for error reporting within analytics components
export function useAnalyticsError() {
  return {
    reportError: (error: Error, context?: Record<string, any>) => {
      console.error("Analytics Error:", error, context);

      // Report to monitoring service
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            analytics: context || {},
          },
          tags: {
            component: "analytics",
          },
        });
      }
    },
  };
}
