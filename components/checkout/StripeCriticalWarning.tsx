"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Shield } from "lucide-react";

interface StripeCriticalWarningProps {
  onRetry: () => void;
}

export function StripeCriticalWarning({ onRetry }: StripeCriticalWarningProps) {
  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>🚨 CRITICAL: Stripe Payment System Unavailable</strong>
        </AlertDescription>
      </Alert>

      <div className="bg-white rounded-lg border border-red-200 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-red-800">
              Real Payments Cannot Be Processed
            </h3>
            <div className="text-sm text-red-700 space-y-1">
              <p>
                <strong>Why this is critical:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Real credit card payments will be blocked by Stripe</li>
                <li>Your customers will not be able to complete purchases</li>
                <li>You will not receive any payments</li>
                <li>This violates PCI compliance requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          What you need to do:
        </h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p>
            <strong>1. Contact your hosting provider</strong> - Ask them to allow access to:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code>https://js.stripe.com</code></li>
            <li><code>https://api.stripe.com</code></li>
            <li><code>https://cdn.jsdelivr.net</code></li>
          </ul>
          
          <p>
            <strong>2. Check your firewall settings</strong> - Ensure these domains are not blocked
          </p>
          
          <p>
            <strong>3. Disable service worker temporarily</strong> - If you have control over it
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Loading Stripe
        </Button>

        <Button
          onClick={() => window.location.reload()}
          variant="default"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Page
        </Button>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <p>
          <strong>Note:</strong> This is a critical issue that must be resolved before accepting real payments. 
          The current system only works for testing with Stripe test cards.
        </p>
      </div>
    </div>
  );
}
