"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DebugInfo {
  timestamp: string;
  environment: {
    NODE_ENV: string;
    VERCEL_URL?: string;
    isVercel: boolean;
  };
  environmentVariables: {
    hasNEXTAUTH_URL: boolean;
    NEXTAUTH_URL?: string;
    hasNEXTAUTH_SECRET: boolean;
    NEXTAUTH_SECRET_LENGTH: number;
    hasDATABASE_URL: boolean;
    DATABASE_URL_START: string;
    hasGOOGLE_CLIENT_ID: boolean;
    hasGOOGLE_CLIENT_SECRET: boolean;
  };
  nextAuthConfig: {
    expectedCallbackUrl: string;
    authApiRoute: string;
  };
  googleOAuthUrls: {
    expectedRedirectUri: string;
    testAuthUrl: string;
  };
  recommendations: string[];
  database?: {
    status: string;
    error?: string;
  };
}

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/debug");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch debug info");
      }

      // Ensure recommendations array exists
      if (!data.recommendations) {
        data.recommendations = [];
      }

      setDebugInfo(data);
    } catch (err) {
      console.error("Debug fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const getStatusIcon = (hasValue: boolean) => (
    <span
      className={`inline-block w-3 h-3 rounded-full ${hasValue ? "bg-green-500" : "bg-red-500"} mr-2`}
    />
  );

  const getRecommendationColor = (rec: string) => {
    if (rec.includes("🔴 CRITICAL"))
      return "text-red-600 bg-red-50 border-red-200";
    if (rec.includes("⚠️ WARNING"))
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (rec.includes("🔧 ACTION"))
      return "text-blue-600 bg-blue-50 border-blue-200";
    if (rec.includes("✅"))
      return "text-green-600 bg-green-50 border-green-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading authentication debug info...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Debug Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={fetchDebugInfo}>Retry</Button>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Show Technical Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  Error: {error}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardContent>
            <p>No debug information available.</p>
            <Button onClick={fetchDebugInfo} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safely access properties with fallbacks
  const recommendations = debugInfo.recommendations || [];
  const environmentVariables = debugInfo.environmentVariables || {};
  const environment = debugInfo.environment || {};
  const googleOAuthUrls = debugInfo.googleOAuthUrls || {};
  const database = debugInfo.database;

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Authentication Debug Information
        </h1>
        <p className="text-muted-foreground">
          Diagnose authentication configuration issues
        </p>
        <p className="text-sm text-gray-500">
          Generated:{" "}
          {debugInfo.timestamp
            ? new Date(debugInfo.timestamp).toLocaleString()
            : "Unknown"}
        </p>
      </div>

      {/* Critical Recommendations */}
      {recommendations.length > 0 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>🚨 Recommendations & Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getRecommendationColor(rec)}`}
                >
                  {rec}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Variables */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">NextAuth Configuration</h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  {getStatusIcon(environmentVariables.hasNEXTAUTH_URL)}
                  <span>
                    NEXTAUTH_URL:{" "}
                    {environmentVariables.NEXTAUTH_URL || "NOT SET"}
                  </span>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(environmentVariables.hasNEXTAUTH_SECRET)}
                  <span>
                    NEXTAUTH_SECRET:{" "}
                    {environmentVariables.hasNEXTAUTH_SECRET
                      ? `Present (${environmentVariables.NEXTAUTH_SECRET_LENGTH || 0} chars)`
                      : "NOT SET"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Google OAuth</h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  {getStatusIcon(environmentVariables.hasGOOGLE_CLIENT_ID)}
                  <span>
                    GOOGLE_CLIENT_ID:{" "}
                    {environmentVariables.hasGOOGLE_CLIENT_ID
                      ? "Present"
                      : "NOT SET"}
                  </span>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(environmentVariables.hasGOOGLE_CLIENT_SECRET)}
                  <span>
                    GOOGLE_CLIENT_SECRET:{" "}
                    {environmentVariables.hasGOOGLE_CLIENT_SECRET
                      ? "Present"
                      : "NOT SET"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Database</h3>
            <div className="flex items-center">
              {getStatusIcon(environmentVariables.hasDATABASE_URL)}
              <span>
                DATABASE_URL:{" "}
                {environmentVariables.hasDATABASE_URL
                  ? environmentVariables.DATABASE_URL_START || "Present"
                  : "NOT SET"}
              </span>
            </div>
            {database && (
              <div className="flex items-center">
                {getStatusIcon(database.status === "connected")}
                <span>Database Connection: {database.status}</span>
                {database.error && (
                  <span className="text-red-600 ml-2">({database.error})</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Environment:</strong>{" "}
                {environment.NODE_ENV || "Unknown"}
              </p>
              <p>
                <strong>Platform:</strong>{" "}
                {environment.isVercel ? "Vercel" : "Other"}
              </p>
              {environment.VERCEL_URL && (
                <p>
                  <strong>Vercel URL:</strong> {environment.VERCEL_URL}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google OAuth URLs */}
      {googleOAuthUrls.expectedRedirectUri && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Google OAuth Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Required Redirect URI</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Add this URL to your Google Cloud Console OAuth configuration:
                </p>
                <code className="block p-2 bg-gray-100 rounded text-sm break-all">
                  {googleOAuthUrls.expectedRedirectUri}
                </code>
              </div>

              {googleOAuthUrls.testAuthUrl && (
                <div>
                  <h3 className="font-semibold mb-2">
                    Test Authentication URL
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Use this URL to test authentication:
                  </p>
                  <code className="block p-2 bg-gray-100 rounded text-sm break-all">
                    {googleOAuthUrls.testAuthUrl}
                  </code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={fetchDebugInfo}>Refresh Debug Info</Button>
            <Button asChild variant="outline">
              <a
                href="/api/auth/debug"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Raw JSON
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/auth/login" target="_blank" rel="noopener noreferrer">
                Test Login
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
