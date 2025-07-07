"use client";

import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { useEffect } from "react";

/**
 * Global error page for Next.js App Router
 * This catches errors that occur outside of React Error Boundaries
 * including errors in the root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error("🚨 GLOBAL ERROR:", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "Unknown",
      url: typeof window !== "undefined" ? window.location.href : "Unknown",
    });

    // Send to error tracking service
    if (typeof window !== "undefined") {
      fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          level: "critical",
          timestamp: new Date().toISOString(),
          userAgent: window.navigator.userAgent,
          url: window.location.href,
          errorId: `global_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          digest: error.digest,
        }),
      }).catch(console.error);
    }
  }, [error]);

  const handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const copyErrorDetails = () => {
    const errorText = `
Global Error Report
==================
Error: ${error.message}
Digest: ${error.digest || "N/A"}
Timestamp: ${new Date().toISOString()}
URL: ${typeof window !== "undefined" ? window.location.href : "Unknown"}
User Agent: ${typeof window !== "undefined" ? window.navigator.userAgent : "Unknown"}

Stack Trace:
${error.stack || "No stack trace available"}
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(errorText)
        .then(() => {
          alert("Error details copied to clipboard");
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = errorText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          alert("Error details copied to clipboard");
        });
    }
  };

  return (
    <div className="container">
      <div className="error-card">
        <div className="icon">
          <AlertTriangle />
        </div>

        <h1 className="title">Application Error</h1>

        <p className="message">
          The application encountered a critical error and needs to be
          restarted. We apologize for the inconvenience.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="details">
            <strong>Error Details (Development):</strong>
            <br />
            <code>{error.message}</code>
            {error.digest && (
              <>
                <br />
                <strong>Digest:</strong> <code>{error.digest}</code>
              </>
            )}
          </div>
        )}

        <div className="button-group">
          <button
            onClick={reset}
            className="button button-primary">
            <RefreshCw style={{ width: "16px", height: "16px" }} />
            Try Again
          </button>

          <button
            onClick={handleRefresh}
            className="button button-secondary">
            <RefreshCw style={{ width: "16px", height: "16px" }} />
            Restart App
          </button>

          <button
            onClick={handleGoHome}
            className="button button-secondary">
            <Home style={{ width: "16px", height: "16px" }} />
            Go Home
          </button>

          <button
            onClick={copyErrorDetails}
            className="button button-secondary">
            <Bug style={{ width: "16px", height: "16px" }} />
            Copy Error
          </button>
        </div>

        <p className="error-id">Error ID: global_error_{Date.now()}</p>
      </div>
    </div>
  );
}
