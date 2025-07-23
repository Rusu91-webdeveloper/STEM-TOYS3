"use client";

import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { useEffect } from "react";

/**
 * Global error page for Next.js App Router
 * This catches errors that occur outside of React Error Boundaries
 * including errors in the root layout
 *
 * [REFAC] Tailwind-only, accessible, responsive, and visually clear
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-2">
          <AlertTriangle size={40} />
        </div>
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
          Application Error
        </h1>
        {/* Message */}
        <p className="text-base sm:text-lg text-gray-700 mb-2 text-center">
          The application encountered a critical error and needs to be
          restarted. We apologize for the inconvenience.
        </p>
        {/* Error details (development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-xs text-left text-gray-800 mb-2">
            <strong>Error Details (Development):</strong>
            <br />
            <code className="break-all">{error.message}</code>
            {error.digest && (
              <>
                <br />
                <strong>Digest:</strong> <code>{error.digest}</code>
              </>
            )}
          </div>
        )}
        {/* Button group */}
        <div className="flex flex-wrap gap-3 w-full justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition"
          >
            <RefreshCw size={18} /> Try Again
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition"
          >
            <RefreshCw size={18} /> Restart App
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition"
          >
            <Home size={18} /> Go Home
          </button>
          <button
            onClick={copyErrorDetails}
            className="flex items-center gap-2 px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition"
          >
            <Bug size={18} /> Copy Error
          </button>
        </div>
        {/* Error ID (for support/debugging) */}
        <p className="text-xs text-gray-400 mt-2 text-center">
          Error ID: global_error_{Date.now()}
        </p>
      </div>
    </div>
  );
}
