"use client";

import { X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Notice component that appears when database is not configured
 * Only shows in development environment
 */
export function DatabaseConfigNotice() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== "development") return;

    // Check if already dismissed
    if (localStorage.getItem("database-notice-dismissed") === "true") {
      setIsDismissed(true);
      return;
    }

    // Check if database is configured by making a simple request
    const checkDatabase = async () => {
      try {
        const response = await fetch("/api/health/database", {
          cache: "no-store",
        });

        if (!response.ok) {
          setShowNotice(true);
        }
      } catch {
        setShowNotice(true);
      }
    };

    checkDatabase();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowNotice(false);
    localStorage.setItem("database-notice-dismissed", "true");
  };

  if (isDismissed || !showNotice || process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">
          Database Not Configured
        </AlertTitle>
        <AlertDescription className="text-yellow-700">
          <p className="mb-2">
            The database connection is not configured. Authentication features
            may not work properly.
          </p>
          <p className="text-sm mb-3">
            To fix this, create a{" "}
            <code className="bg-yellow-100 px-1 rounded">.env</code> file with
            your{" "}
            <code className="bg-yellow-100 px-1 rounded">DATABASE_URL</code>.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
