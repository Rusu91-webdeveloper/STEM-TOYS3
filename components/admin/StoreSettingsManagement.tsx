"use client";

import {
  Settings,
  Save,
  RotateCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
  Globe,
  CreditCard,
  Truck,
  Users,
  Mail,
  Bell,
  Shield,
  Database,
  Palette,
  Smartphone,
  Monitor,
  Clock,
  DollarSign,
  Package,
  BarChart3,
  Zap,
  Target,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Trash2,
  Plus,
  Minus,
  Edit,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StoreSettings {
  id?: string;
  storeName: string;
  storeUrl: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  weightUnit: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  shippingSettings: any;
  paymentSettings: any;
  taxSettings: any;
  businessHours: any;
  orderProcessing: any;
  inventoryManagement: any;
  marketingSettings: any;
  securitySettings: any;
  integrationSettings: any;
  themeSettings: any;
  notificationSettings: any;
  backupSettings: any;
}

interface SettingsBackup {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  size: string;
  version: string;
}

export default function StoreSettingsManagement() {
  const [settings, setSettings] = useState<StoreSettings>({} as StoreSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<StoreSettings>(
    {} as StoreSettings
  );

  // Dialog states
  const [backupDialog, setBackupDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [validationDialog, setValidationDialog] = useState(false);
  const [backups, setBackups] = useState<SettingsBackup[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>("");

  // Fetch settings data
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");

      const data = await response.json();
      setSettings(data);
      setOriginalSettings(data);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load settings"
      );
      toast({
        title: "Error",
        description: "Failed to load store settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch backups
  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/admin/settings/backups");
      if (!response.ok) throw new Error("Failed to fetch backups");

      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error("Error fetching backups:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, [fetchSettings]);

  // Generic save handler
  const handleSave = async (section: string, sectionData: any) => {
    setIsSaving(prev => ({ ...prev, [section]: true }));

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sectionData),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setOriginalSettings(updatedSettings);
      setHasUnsavedChanges(false);

      toast({
        title: "Success",
        description: `${section} settings saved successfully`,
      });
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      toast({
        title: "Error",
        description: `Failed to save ${section} settings`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(prev => ({ ...prev, [section]: false }));
    }
  };

  // Update settings helper
  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split(".");
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasUnsavedChanges(true);
  };

  // Create backup
  const handleCreateBackup = async () => {
    try {
      const response = await fetch("/api/admin/settings/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Backup ${new Date().toLocaleDateString()}`,
          description: "Manual backup created from settings panel",
        }),
      });

      if (!response.ok) throw new Error("Failed to create backup");

      toast({
        title: "Success",
        description: "Settings backup created successfully",
      });

      setBackupDialog(false);
      fetchBackups();
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    }
  };

  // Restore backup
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      const response = await fetch(
        `/api/admin/settings/backups/${selectedBackup}/restore`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to restore backup");

      toast({
        title: "Success",
        description: "Settings restored successfully",
      });

      setRestoreDialog(false);
      fetchSettings();
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast({
        title: "Error",
        description: "Failed to restore backup",
        variant: "destructive",
      });
    }
  };

  // Validate settings
  const validateSettings = () => {
    const errors: string[] = [];

    if (!settings.storeName?.trim()) errors.push("Store name is required");
    if (!settings.contactEmail?.trim())
      errors.push("Contact email is required");
    if (!settings.storeUrl?.trim()) errors.push("Store URL is required");

    if (errors.length > 0) {
      setValidationDialog(true);
      return false;
    }

    return true;
  };

  // Render metric card
  const renderMetricCard = (
    title: string,
    value: string | number,
    description?: string,
    icon?: React.ReactNode,
    status?: "success" | "warning" | "error" | "info"
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {status && (
          <Badge
            variant={
              status === "success"
                ? "default"
                : status === "warning"
                  ? "secondary"
                  : status === "error"
                    ? "destructive"
                    : "outline"
            }
            className="mt-2"
          >
            {status.toUpperCase()}
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  // General Settings Tab
  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Store Information
          </CardTitle>
          <CardDescription>Basic information about your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={settings.storeName || ""}
                onChange={e => updateSettings("storeName", e.target.value)}
                placeholder="Your Store Name"
              />
            </div>
            <div>
              <Label htmlFor="storeUrl">Store URL</Label>
              <Input
                id="storeUrl"
                value={settings.storeUrl || ""}
                onChange={e => updateSettings("storeUrl", e.target.value)}
                placeholder="https://yourstore.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="storeDescription">Store Description</Label>
            <Textarea
              id="storeDescription"
              value={settings.storeDescription || ""}
              onChange={e => updateSettings("storeDescription", e.target.value)}
              placeholder="Describe your store..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail || ""}
                onChange={e => updateSettings("contactEmail", e.target.value)}
                placeholder="contact@yourstore.com"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone || ""}
                onChange={e => updateSettings("contactPhone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          <Button
            onClick={() =>
              handleSave("general", {
                storeName: settings.storeName,
                storeUrl: settings.storeUrl,
                storeDescription: settings.storeDescription,
                contactEmail: settings.contactEmail,
                contactPhone: settings.contactPhone,
              })
            }
            disabled={isSaving.general}
          >
            {isSaving.general ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save General Settings
          </Button>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>
            Configure currency, timezone, and formatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={settings.currency || "usd"}
                onValueChange={value => updateSettings("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD - US Dollar</SelectItem>
                  <SelectItem value="eur">EUR - Euro</SelectItem>
                  <SelectItem value="gbp">GBP - British Pound</SelectItem>
                  <SelectItem value="ron">RON - Romanian Leu</SelectItem>
                  <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone || "america-new_york"}
                onValueChange={value => updateSettings("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america-new_york">Eastern Time</SelectItem>
                  <SelectItem value="america-chicago">Central Time</SelectItem>
                  <SelectItem value="america-denver">Mountain Time</SelectItem>
                  <SelectItem value="america-los_angeles">
                    Pacific Time
                  </SelectItem>
                  <SelectItem value="europe/bucharest">Bucharest</SelectItem>
                  <SelectItem value="europe/london">London</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={settings.dateFormat || "mm-dd-yyyy"}
                onValueChange={value => updateSettings("dateFormat", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                  <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weightUnit">Weight Unit</Label>
              <Select
                value={settings.weightUnit || "lb"}
                onValueChange={value => updateSettings("weightUnit", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                  <SelectItem value="g">Grams (g)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() =>
              handleSave("regional", {
                currency: settings.currency,
                timezone: settings.timezone,
                dateFormat: settings.dateFormat,
                weightUnit: settings.weightUnit,
              })
            }
            disabled={isSaving.regional}
          >
            {isSaving.regional ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Regional Settings
          </Button>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            SEO Settings
          </CardTitle>
          <CardDescription>
            Configure search engine optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={settings.metaTitle || ""}
              onChange={e => updateSettings("metaTitle", e.target.value)}
              placeholder="Your Store | Best Products Online"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(settings.metaTitle || "").length}/60 characters
            </p>
          </div>
          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={settings.metaDescription || ""}
              onChange={e => updateSettings("metaDescription", e.target.value)}
              placeholder="Shop the best products online..."
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(settings.metaDescription || "").length}/160 characters
            </p>
          </div>
          <div>
            <Label htmlFor="metaKeywords">Meta Keywords</Label>
            <Input
              id="metaKeywords"
              value={settings.metaKeywords || ""}
              onChange={e => updateSettings("metaKeywords", e.target.value)}
              placeholder="products, online, shop, best"
            />
          </div>
          <Button
            onClick={() =>
              handleSave("seo", {
                metaTitle: settings.metaTitle,
                metaDescription: settings.metaDescription,
                metaKeywords: settings.metaKeywords,
              })
            }
            disabled={isSaving.seo}
          >
            {isSaving.seo ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save SEO Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Security & Backup Tab
  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Settings Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Settings Backup & Restore
          </CardTitle>
          <CardDescription>
            Create backups and restore previous configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setBackupDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
            <Button variant="outline" onClick={() => setRestoreDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Restore Backup
            </Button>
          </div>

          {backups.length > 0 && (
            <div className="space-y-2">
              <Label>Available Backups</Label>
              <div className="space-y-2">
                {backups.slice(0, 5).map(backup => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{backup.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {backup.description}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {backup.size} •{" "}
                      {new Date(backup.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for admin access
              </p>
            </div>
            <Switch
              checked={settings.securitySettings?.twoFactorEnabled || false}
              onCheckedChange={value =>
                updateSettings("securitySettings.twoFactorEnabled", value)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Auto-logout after inactivity
              </p>
            </div>
            <Select
              value={settings.securitySettings?.sessionTimeout || "30"}
              onValueChange={value =>
                updateSettings("securitySettings.sessionTimeout", value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => handleSave("security", settings.securitySettings)}
            disabled={isSaving.security}
          >
            {isSaving.security ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Security Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Overview Tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard(
          "Store Status",
          "Active",
          "Your store is running",
          <CheckCircle className="h-4 w-4 text-green-500" />,
          "success"
        )}
        {renderMetricCard(
          "Last Backup",
          backups[0]
            ? new Date(backups[0].createdAt).toLocaleDateString()
            : "Never",
          "Settings backup status",
          <Database className="h-4 w-4 text-muted-foreground" />
        )}
        {renderMetricCard(
          "Currency",
          settings.currency?.toUpperCase() || "USD",
          "Store currency",
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        )}
        {renderMetricCard(
          "Timezone",
          settings.timezone?.split("/")[1]?.replace("_", " ") || "New York",
          "Store timezone",
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common settings management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => setActiveTab("general")}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <Globe className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Store Info</div>
                <div className="text-sm text-muted-foreground">
                  Update basic store information
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("security")}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <Shield className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Security</div>
                <div className="text-sm text-muted-foreground">
                  Configure security settings
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => setBackupDialog(true)}
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <Database className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Backup</div>
                <div className="text-sm text-muted-foreground">
                  Create settings backup
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Changes</CardTitle>
          <CardDescription>Track recent settings modifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Store information updated</div>
                  <div className="text-sm text-muted-foreground">
                    General settings modified
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">2 hours ago</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Security settings updated</div>
                  <div className="text-sm text-muted-foreground">
                    Two-factor authentication enabled
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">1 day ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading store settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading settings</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSettings}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Store Settings Management
          </h2>
          <p className="text-muted-foreground">
            Configure and manage your store settings, security, and backups
          </p>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={fetchSettings}>
            <RotateCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Make sure to save your settings before
            leaving this page.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security & Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          {renderGeneralTab()}
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          {renderSecurityTab()}
        </TabsContent>
      </Tabs>

      {/* Backup Dialog */}
      <Dialog open={backupDialog} onOpenChange={setBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Settings Backup</DialogTitle>
            <DialogDescription>
              Create a backup of your current store settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="backupName">Backup Name</Label>
              <Input
                id="backupName"
                placeholder={`Backup ${new Date().toLocaleDateString()}`}
              />
            </div>
            <div>
              <Label htmlFor="backupDescription">Description</Label>
              <Textarea
                id="backupDescription"
                placeholder="Optional description for this backup"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBackupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup}>Create Backup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Settings Backup</DialogTitle>
            <DialogDescription>
              Restore settings from a previous backup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Backup</Label>
              <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a backup to restore" />
                </SelectTrigger>
                <SelectContent>
                  {backups.map(backup => (
                    <SelectItem key={backup.id} value={backup.id}>
                      {backup.name} -{" "}
                      {new Date(backup.createdAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will overwrite your current settings. Make sure to create a
                backup first.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRestoreBackup}
              disabled={!selectedBackup}
              variant="destructive"
            >
              Restore Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
