"use client";

import { useState, useEffect } from "react";
import {
  Facebook,
  Instagram,
  Music,
  Save,
  TestTube,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PixelConfig {
  id: string;
  pixelId: string;
  accessToken?: string;
  isActive: boolean;
  lastSyncAt?: string;
  metadata?: any;
}

interface PixelConfigs {
  facebook: PixelConfig | null;
  instagram: PixelConfig | null;
  tiktok: PixelConfig | null;
}

export function PixelConfigurationManager() {
  const [configs, setConfigs] = useState<PixelConfigs>({
    facebook: null,
    instagram: null,
    tiktok: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const [facebookRes, instagramRes, tiktokRes] = await Promise.all([
        fetch("/api/admin/analytics/facebook-pixel"),
        fetch("/api/admin/analytics/instagram-pixel"),
        fetch("/api/admin/analytics/tiktok-pixel"),
      ]);

      const facebook = facebookRes.ok ? await facebookRes.json() : null;
      const instagram = instagramRes.ok ? await instagramRes.json() : null;
      const tiktok = tiktokRes.ok ? await tiktokRes.json() : null;

      setConfigs({ facebook, instagram, tiktok });
    } catch (err) {
      console.error("Error fetching pixel configs:", err);
      setError("Failed to load pixel configurations");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (
    platform: keyof PixelConfigs,
    config: Partial<PixelConfig>
  ) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/analytics/${platform}-pixel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${platform} configuration`);
      }

      await fetchConfigs();
      setSuccess(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} configuration saved successfully`
      );
    } catch (err) {
      console.error(`Error saving ${platform} config:`, err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to save ${platform} configuration`
      );
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (platform: keyof PixelConfigs) => {
    try {
      setTesting(platform);
      setError(null);

      const response = await fetch(
        `/api/admin/analytics/${platform}-pixel/test`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to test ${platform} connection`);
      }

      const result = await response.json();
      if (result.success) {
        setSuccess(
          `${platform.charAt(0).toUpperCase() + platform.slice(1)} connection test successful`
        );
      } else {
        setError(`Connection test failed: ${result.error}`);
      }
    } catch (err) {
      console.error(`Error testing ${platform} connection:`, err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to test ${platform} connection`
      );
    } finally {
      setTesting(null);
    }
  };

  const getPlatformInfo = (platform: keyof PixelConfigs) => {
    switch (platform) {
      case "facebook":
        return {
          name: "Facebook Pixel",
          icon: Facebook,
          color: "bg-blue-600",
          description: "Track conversions and audience insights",
        };
      case "instagram":
        return {
          name: "Instagram Pixel",
          icon: Instagram,
          color: "bg-pink-600",
          description: "Measure campaign performance and conversions",
        };
      case "tiktok":
        return {
          name: "TikTok Pixel",
          icon: Music,
          color: "bg-black",
          description: "Track viral content and engagement metrics",
        };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pixel configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Pixel Configuration
        </h1>
        <p className="text-gray-600 mt-2">
          Configure and manage your Facebook Pixel, Instagram Pixel, and TikTok
          Pixel for advanced analytics tracking.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(Object.keys(configs) as Array<keyof PixelConfigs>).map(platform => {
          const config = configs[platform];
          const platformInfo = getPlatformInfo(platform);
          const Icon = platformInfo.icon;

          return (
            <Card key={platform} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${platformInfo.color} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {platformInfo.name}
                      </CardTitle>
                      <CardDescription>
                        {platformInfo.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={config?.isActive ? "default" : "secondary"}>
                    {config?.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pixel ID */}
                <div className="space-y-2">
                  <Label htmlFor={`${platform}-pixelId`}>Pixel ID</Label>
                  <Input
                    id={`${platform}-pixelId`}
                    placeholder={`Enter ${platformInfo.name} Pixel ID`}
                    value={config?.pixelId || ""}
                    onChange={e => {
                      setConfigs(prev => ({
                        ...prev,
                        [platform]: {
                          ...prev[platform],
                          pixelId: e.target.value,
                          id: prev[platform]?.id || "",
                          isActive: prev[platform]?.isActive || false,
                        },
                      }));
                    }}
                  />
                </div>

                {/* Access Token (optional for some platforms) */}
                {(platform === "facebook" || platform === "instagram") && (
                  <div className="space-y-2">
                    <Label htmlFor={`${platform}-accessToken`}>
                      Access Token (Optional)
                    </Label>
                    <Input
                      id={`${platform}-accessToken`}
                      type="password"
                      placeholder="Enter access token for conversions API"
                      value={config?.accessToken || ""}
                      onChange={e => {
                        setConfigs(prev => ({
                          ...prev,
                          [platform]: {
                            ...prev[platform],
                            accessToken: e.target.value,
                            id: prev[platform]?.id || "",
                            isActive: prev[platform]?.isActive || false,
                          },
                        }));
                      }}
                    />
                  </div>
                )}

                {/* Active Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${platform}-active`}>Enable Tracking</Label>
                  <Switch
                    id={`${platform}-active`}
                    checked={config?.isActive || false}
                    onCheckedChange={checked => {
                      setConfigs(prev => ({
                        ...prev,
                        [platform]: {
                          ...prev[platform],
                          isActive: checked,
                          id: prev[platform]?.id || "",
                          pixelId: prev[platform]?.pixelId || "",
                        },
                      }));
                    }}
                  />
                </div>

                {/* Last Sync */}
                {config?.lastSyncAt && (
                  <div className="text-sm text-gray-500">
                    Last sync: {new Date(config.lastSyncAt).toLocaleString()}
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      saveConfig(platform, configs[platform] || {})
                    }
                    disabled={saving}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testConnection(platform)}
                    disabled={
                      testing === platform || !configs[platform]?.pixelId
                    }
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testing === platform ? "Testing..." : "Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to get your pixel IDs and access tokens for each platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-blue-600 mb-2">Facebook Pixel</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Go to Facebook Events Manager</li>
              <li>Create a new pixel or select existing one</li>
              <li>Copy the Pixel ID from the settings</li>
              <li>
                For Conversions API, generate an access token in Business
                Settings
              </li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-pink-600 mb-2">
              Instagram Pixel
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Go to Facebook Events Manager</li>
              <li>Create or select your Instagram pixel</li>
              <li>Copy the Pixel ID</li>
              <li>Use the same access token as Facebook for Conversions API</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">TikTok Pixel</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Go to TikTok Ads Manager → Assets → Events</li>
              <li>Create a new pixel or select existing one</li>
              <li>Copy the Pixel Code ID</li>
              <li>Configure events for viral content tracking</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
