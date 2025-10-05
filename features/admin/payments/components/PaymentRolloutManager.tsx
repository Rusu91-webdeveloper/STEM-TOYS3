"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  Users,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface RolloutConfig {
  netopiaEnabled: boolean;
  stripeEnabled: boolean;
  gradualRolloutPercentage: number;
  rolloutStrategy: "percentage" | "user_id" | "country" | "locale";
  targetCountries: string[];
  targetLocales: string[];
}

interface RolloutStats {
  config: RolloutConfig;
  timestamp: string;
  note: string;
}

export function PaymentRolloutManager() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<RolloutConfig | null>(null);
  const [stats, setStats] = useState<RolloutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [netopiaEnabled, setNetopiaEnabled] = useState(true); // Netopia enabled by default
  const [stripeEnabled, setStripeEnabled] = useState(false); // Stripe disabled by default
  const [rolloutPercentage, setRolloutPercentage] = useState(0);
  const [rolloutStrategy, setRolloutStrategy] = useState<
    "percentage" | "user_id" | "country" | "locale"
  >("percentage");

  useEffect(() => {
    fetchRolloutData();
  }, []);

  const fetchRolloutData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/payment-rollout");

      if (!response.ok) {
        throw new Error("Failed to fetch rollout data");
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setConfig(data.data.config);

        // Update form state
        setNetopiaEnabled(data.data.config.netopiaEnabled);
        setStripeEnabled(data.data.config.stripeEnabled);
        setRolloutPercentage(data.data.config.gradualRolloutPercentage);
        setRolloutStrategy(data.data.config.rolloutStrategy);
      } else {
        throw new Error(data.error || "Failed to load data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/payment-rollout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          netopiaEnabled,
          stripeEnabled,
          gradualRolloutPercentage: rolloutPercentage,
          rolloutStrategy,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update configuration");
      }

      const data = await response.json();

      if (data.success) {
        setSuccess("Payment rollout configuration updated successfully");
        await fetchRolloutData(); // Refresh data
      } else {
        throw new Error(data.error || "Failed to update configuration");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save configuration"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Payment Rollout Management</h1>
          <p className="text-gray-600">
            Manage Netopia vs Stripe payment provider rollout
          </p>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Rollout Configuration
            </CardTitle>
            <CardDescription>
              Configure how Netopia payments are rolled out to users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="netopia-enabled"
                    className="text-sm font-medium"
                  >
                    Netopia Payments Enabled
                  </Label>
                  <p className="text-xs text-gray-500">
                    Enable Netopia for Romanian users
                  </p>
                </div>
                <Switch
                  id="netopia-enabled"
                  checked={netopiaEnabled}
                  onCheckedChange={setNetopiaEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="stripe-enabled"
                    className="text-sm font-medium"
                  >
                    Stripe Payments Enabled
                  </Label>
                  <p className="text-xs text-gray-500">
                    Keep Stripe as fallback option
                  </p>
                </div>
                <Switch
                  id="stripe-enabled"
                  checked={stripeEnabled}
                  onCheckedChange={setStripeEnabled}
                />
              </div>
            </div>

            {/* Rollout Strategy */}
            <div className="space-y-2">
              <Label htmlFor="rollout-strategy">Rollout Strategy</Label>
              <Select
                value={rolloutStrategy}
                onValueChange={(value: any) => setRolloutStrategy(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage-based</SelectItem>
                  <SelectItem value="user_id">User ID-based</SelectItem>
                  <SelectItem value="country">Country-based</SelectItem>
                  <SelectItem value="locale">Locale-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rollout Percentage */}
            <div className="space-y-2">
              <Label htmlFor="rollout-percentage">
                Gradual Rollout Percentage: {rolloutPercentage}%
              </Label>
              <Input
                id="rollout-percentage"
                type="range"
                min="0"
                max="100"
                value={rolloutPercentage}
                onChange={e => setRolloutPercentage(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Rollout Statistics
            </CardTitle>
            <CardDescription>
              Current rollout status and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.config.gradualRolloutPercentage}%
                    </div>
                    <div className="text-sm text-blue-600">Target Rollout</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">🇷🇴</div>
                    <div className="text-sm text-green-600">
                      Romanian Priority
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Netopia Enabled:</span>
                    <Badge
                      variant={
                        stats.config.netopiaEnabled ? "default" : "secondary"
                      }
                    >
                      {stats.config.netopiaEnabled ? "Yes" : "No"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Stripe Enabled:</span>
                    <Badge
                      variant={
                        stats.config.stripeEnabled ? "default" : "secondary"
                      }
                    >
                      {stats.config.stripeEnabled ? "Yes" : "No"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Strategy:</span>
                    <Badge variant="outline">
                      {stats.config.rolloutStrategy}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Last updated: {new Date(stats.timestamp).toLocaleString()}
                  </p>
                  {stats.note && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      {stats.note}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common rollout configurations for different scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => {
                setNetopiaEnabled(true);
                setStripeEnabled(false); // Netopia only
                setRolloutPercentage(0);
                setRolloutStrategy("percentage");
              }}
            >
              Netopia Only
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setNetopiaEnabled(true);
                setStripeEnabled(true); // Enable both for gradual rollout
                setRolloutPercentage(25);
                setRolloutStrategy("percentage");
              }}
            >
              Gradual Rollout (25%)
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setNetopiaEnabled(true);
                setStripeEnabled(true);
                setRolloutPercentage(100);
                setRolloutStrategy("percentage");
              }}
            >
              Full Rollout (Both)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
