"use client";

import React, { useEffect, useState } from "react";

export function ProductionStripeDebug() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStripeConfig = async () => {
      try {
        const response = await fetch("/api/debug/stripe-config");
        if (response.ok) {
          const data = await response.json();
          setConfig(data.stripeConfig);
        } else {
          setError("Failed to fetch Stripe configuration");
        }
      } catch (err) {
        setError("Network error checking Stripe configuration");
      } finally {
        setLoading(false);
      }
    };

    checkStripeConfig();
  }, []);

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm z-50 max-w-xs">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-blue-600 mt-2 text-center">Checking Stripe config...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm z-50 max-w-xs">
        <h3 className="font-bold mb-2 text-red-600">Stripe Config Error</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  const hasIssues = !config.publishableKeyValid || !config.secretKeyValid || !config.webhookSecretValid;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm z-50 max-w-xs">
      <h3 className="font-bold mb-2 text-yellow-800">Stripe Configuration</h3>
      <div className="space-y-1 text-xs">
        <p><strong>Environment:</strong> {config.environment}</p>
        <p><strong>Publishable Key:</strong> {config.hasPublishableKey ? "SET" : "NOT SET"}</p>
        <p><strong>Secret Key:</strong> {config.hasSecretKey ? "SET" : "NOT SET"}</p>
        <p><strong>Webhook Secret:</strong> {config.hasWebhookSecret ? "SET" : "NOT SET"}</p>
        
        {/* Key validation details */}
        <div className="mt-2 space-y-1">
          <p><strong>Key Validation:</strong></p>
          <p className={config.publishableKeyValid ? "text-green-600" : "text-red-600"}>
            • Publishable: {config.publishableKeyValid ? "✓ Valid" : "✗ Invalid"}
          </p>
          <p className={config.secretKeyValid ? "text-green-600" : "text-red-600"}>
            • Secret: {config.secretKeyValid ? "✓ Valid" : "✗ Invalid"}
          </p>
          <p className={config.webhookSecretValid ? "text-green-600" : "text-red-600"}>
            • Webhook: {config.webhookSecretValid ? "✓ Valid" : "✗ Invalid"}
          </p>
        </div>

        {/* Key format details */}
        <div className="mt-2 space-y-1">
          <p><strong>Key Format:</strong></p>
          <p>• Publishable: {config.publishableKeyStartsWithPk ? "pk_ ✓" : "✗ Wrong prefix"}</p>
          <p>• Secret: {config.secretKeyStartsWithSk ? "sk_ ✓" : "✗ Wrong prefix"}</p>
          <p>• Webhook: {config.webhookSecretStartsWithWhsec ? "whsec_ ✓" : "✗ Wrong prefix"}</p>
        </div>

        {/* Key lengths */}
        <div className="mt-2 space-y-1">
          <p><strong>Key Lengths:</strong></p>
          <p>• Publishable: {config.publishableKeyLength || 0} chars</p>
          <p>• Secret: {config.secretKeyLength || 0} chars</p>
          <p>• Webhook: {config.webhookSecretLength || 0} chars</p>
        </div>
      </div>
      
      {hasIssues && (
        <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-xs">
          <strong>Issue Found:</strong> One or more Stripe keys appear to be invalid. Check the key format and length.
        </div>
      )}
    </div>
  );
}
