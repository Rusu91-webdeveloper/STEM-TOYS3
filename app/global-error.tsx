"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

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
    <html lang="en">
      <head>
        <title>Application Error - TechTots</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <style>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background-color: #fef2f2;
            color: #374151;
            line-height: 1.6;
          }
          
          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          
          .error-card {
            max-width: 500px;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            text-align: center;
            border: 2px solid #fecaca;
          }
          
          .icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 1.5rem;
            color: #dc2626;
          }
          
          .title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #b91c1c;
            margin-bottom: 0.75rem;
          }
          
          .message {
            color: #dc2626;
            margin-bottom: 2rem;
            font-size: 1.125rem;
          }
          
          .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
            margin: 0.25rem;
          }
          
          .button-primary {
            background-color: #dc2626;
            color: white;
          }
          
          .button-primary:hover {
            background-color: #b91c1c;
          }
          
          .button-secondary {
            background-color: white;
            color: #dc2626;
            border: 1px solid #dc2626;
          }
          
          .button-secondary:hover {
            background-color: #fef2f2;
          }
          
          .button-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1.5rem;
          }
          
          .error-id {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 1.5rem;
            font-family: monospace;
          }
          
          .details {
            margin-top: 1rem;
            padding: 1rem;
            background-color: #fef2f2;
            border-radius: 8px;
            border: 1px solid #fecaca;
            font-size: 0.875rem;
            text-align: left;
            max-height: 200px;
            overflow-y: auto;
          }
          
          @media (min-width: 640px) {
            .button-group {
              flex-direction: row;
              justify-content: center;
            }
          }
        `}</style>
      </head>
      <body>
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
      </body>
    </html>
  );
}
