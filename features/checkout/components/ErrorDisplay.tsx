"use client";

import { AlertCircle, RefreshCw, LogIn, X } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

import { ErrorInfo } from "../lib/errorHandling";

interface ErrorDisplayProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  onLogin?: () => void;
  className?: string;
}

export const ErrorDisplay = React.memo(function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  onLogin,
  className = "",
}: ErrorDisplayProps) {
  const { t } = useTranslation();

  const getErrorIcon = () => {
    switch (error.code) {
      case "NETWORK_ERROR":
      case "TIMEOUT_ERROR":
        return <RefreshCw className="h-5 w-5 text-orange-600" />;
      case "AUTH_ERROR":
        return <LogIn className="h-5 w-5 text-red-600" />;
      case "PAYMENT_ERROR":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getErrorColor = () => {
    switch (error.code) {
      case "NETWORK_ERROR":
      case "TIMEOUT_ERROR":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "AUTH_ERROR":
        return "bg-red-50 border-red-200 text-red-800";
      case "PAYMENT_ERROR":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-red-50 border-red-200 text-red-800";
    }
  };

  const handleAction = () => {
    switch (error.action) {
      case "retry":
        onRetry?.();
        break;
      case "login":
        onLogin?.();
        break;
      default:
        onRetry?.();
    }
  };

  return (
    <div className={`rounded-md border p-4 ${getErrorColor()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">{getErrorIcon()}</div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">
            {t(`error.title.${error.code}`, "Error")}
          </h3>
          <p className="text-sm mt-1">{error.userFriendlyMessage}</p>

          {error.retryable && error.action && (
            <div className="mt-3 flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAction}
                className="text-xs"
              >
                {error.action === "retry" && (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {error.action === "login" && <LogIn className="h-3 w-3 mr-1" />}
                {t(
                  `error.action.${error.action}`,
                  error.action === "retry" ? "Try Again" : "Login"
                )}
              </Button>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});
