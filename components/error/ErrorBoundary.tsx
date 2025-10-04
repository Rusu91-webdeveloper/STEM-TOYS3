"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
  enableRetry?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error monitoring service (Sentry, etc.)
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    this.setState({
      errorInfo,
    });
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      // Reset error state after max retries to show fallback UI
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
      });
      return;
    }

    // Implement exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const {
      fallback,
      showErrorDetails = false,
      enableRetry = true,
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Details (only in development or when explicitly enabled) */}
              {showErrorDetails && error && (
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">Error Details:</div>
                      <div className="text-sm font-mono bg-red-50 p-2 rounded">
                        {error.name}: {error.message}
                      </div>
                      {errorInfo && (
                        <details className="text-sm">
                          <summary className="cursor-pointer font-semibold">
                            Component Stack
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap bg-red-50 p-2 rounded text-xs">
                            {errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Retry Information */}
              {enableRetry && retryCount > 0 && (
                <Alert>
                  <RefreshCw className="h-4 w-4" />
                  <AlertDescription>
                    Retry attempt {retryCount} of 3. If this continues, the page
                    will show an alternative view.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {enableRetry && retryCount < 3 && (
                  <Button onClick={this.handleRetry} variant="default">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}

                <Button onClick={this.handleReload} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>

                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Support Information */}
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>
                  If this problem persists, please contact our support team at{" "}
                  <a
                    href="mailto:support@techtots.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@techtots.com
                  </a>
                </p>
                <p className="mt-1">
                  Error ID: {Date.now().toString(36).toUpperCase()}
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
