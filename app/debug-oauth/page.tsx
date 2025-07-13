"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function OAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGoogleOAuth = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      console.log("Starting Google OAuth test...");

      // Capture the current URL and environment
      const currentUrl = window.location.href;
      const debugData = {
        currentUrl,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        environment: {
          origin: window.location.origin,
          host: window.location.host,
          protocol: window.location.protocol,
        },
      };

      console.log("Debug data:", debugData);
      setDebugInfo(debugData);

      // Test the Google OAuth flow
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/debug-oauth",
      });

      console.log("Google OAuth result:", result);
      setDebugInfo(prev => ({
        ...prev,
        oauthResult: result,
      }));
    } catch (error) {
      console.error("Google OAuth error:", error);
      setDebugInfo(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      setLoading(false);
    }
  };

  const manualGoogleTest = () => {
    // Direct Google OAuth URL for testing
    const clientId = "YOUR_GOOGLE_CLIENT_ID"; // We'll need to replace this
    const redirectUri = encodeURIComponent(
      "https://stem-toys-3.vercel.app/api/auth/callback/google"
    );
    const scope = encodeURIComponent("openid email profile");
    const responseType = "code";
    const state = "test-state";

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}`;

    console.log("Manual Google OAuth URL:", googleAuthUrl);
    setDebugInfo(prev => ({
      ...prev,
      manualOAuthUrl: googleAuthUrl,
    }));

    // Open in new tab to test
    window.open(googleAuthUrl, "_blank");
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Google OAuth Debug</h1>

      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Debug Mode</h2>
          <p className="text-yellow-700 text-sm">
            This page is for debugging Google OAuth issues. Check the browser
            console for detailed logs.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={testGoogleOAuth}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Testing..." : "Test Google OAuth (NextAuth)"}
          </Button>

          <Button
            onClick={manualGoogleTest}
            variant="outline"
            className="w-full"
          >
            Generate Manual Google OAuth URL
          </Button>
        </div>

        {debugInfo && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto bg-white p-3 rounded border">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            Expected Configuration
          </h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p>
              <strong>Redirect URI should be exactly:</strong>
            </p>
            <code className="block bg-white p-2 rounded text-xs">
              https://stem-toys-3.vercel.app/api/auth/callback/google
            </code>

            <p>
              <strong>Google OAuth Client must have:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Correct Client ID and Secret in Vercel environment</li>
              <li>Redirect URI added to Google Cloud Console</li>
              <li>OAuth consent screen published (not in testing mode)</li>
              <li>Correct authorized domains configured</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
