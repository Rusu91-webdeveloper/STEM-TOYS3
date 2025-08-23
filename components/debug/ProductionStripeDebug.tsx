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

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm z-50 max-w-xs">
      <h3 className="font-bold mb-2 text-yellow-800">Stripe Configuration</h3>
      <div className="space-y-1 text-xs">
        <p><strong>Environment:</strong> {config.environment}</p>
        <p><strong>Publishable Key:</strong> {config.hasPublishableKey ? "SET" : "NOT SET"}</p>
        <p><strong>Secret Key:</strong> {config.secretKey}</p>
        <p><strong>Webhook Secret:</strong> {config.webhookSecret}</p>
        {config.publishableKeyStartsWithPk === false && (
          <p className="text-red-600"><strong>⚠️ Invalid key format</strong></p>
        )}
      </div>
      {!config.hasPublishableKey && (
        <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-xs">
          <strong>Issue:</strong> NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in production environment variables.
        </div>
      )}
    </div>
  );
}
