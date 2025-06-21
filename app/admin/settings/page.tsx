"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

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
  shippingSettings: {
    standard: {
      price: string;
      active: boolean;
    };
    express: {
      price: string;
      active: boolean;
    };
    freeThreshold: {
      price: string;
      active: boolean;
    };
  } | null;
  taxSettings: {
    rate: string;
    active: boolean;
    includeInPrice: boolean;
  } | null;
  paymentSettings?: any;
}

const defaultSettings: StoreSettings = {
  storeName: "TechTots",
  storeUrl: "https://techtots.com",
  storeDescription:
    "TechTots is a premier online destination for STEM toys that inspire learning through play.",
  contactEmail: "info@techtots.com",
  contactPhone: "+1 (555) 123-4567",
  currency: "usd",
  timezone: "america-new_york",
  dateFormat: "mm-dd-yyyy",
  weightUnit: "lb",
  metaTitle: "TechTots | STEM Toys for Curious Minds",
  metaDescription:
    "Discover the best STEM toys for curious minds at TechTots. Educational toys that make learning fun for children of all ages.",
  metaKeywords:
    "STEM toys, educational toys, science toys, technology toys, engineering toys, math toys",
  shippingSettings: {
    standard: {
      price: "5.99",
      active: true,
    },
    express: {
      price: "12.99",
      active: true,
    },
    freeThreshold: {
      price: "75.00",
      active: true,
    },
  },
  taxSettings: {
    rate: "19",
    active: true,
    includeInPrice: false,
  },
};

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState({
    general: false,
    regional: false,
    seo: false,
    shipping: false,
    payments: false,
    tax: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  // Fetch current settings on component mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings");

        if (!response.ok) {
          throw new Error(`Error fetching settings: ${response.statusText}`);
        }

        const data = await response.json();

        // Ensure shippingSettings exists
        if (!data.shippingSettings) {
          data.shippingSettings = {
            standard: { price: "5.99", active: true },
            express: { price: "12.99", active: true },
            freeThreshold: { price: "75.00", active: true },
          };
        }

        // Ensure taxSettings exists
        if (!data.taxSettings) {
          data.taxSettings = {
            rate: "19",
            active: true,
            includeInPrice: false,
          };
        }

        setSettings(data);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Failed to load settings. Please refresh the page.");
        toast({
          title: "Error",
          description: "Failed to load settings. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Generic save handler with section parameter
  const handleSave = async (section: keyof typeof isSaving) => {
    setIsSaving((prev) => ({ ...prev, [section]: true }));

    try {
      let sectionData: Record<string, any> = {};

      // Determine which data to send based on the section
      switch (section) {
        case "general":
          sectionData = {
            storeName: settings.storeName,
            storeUrl: settings.storeUrl,
            storeDescription: settings.storeDescription,
            contactEmail: settings.contactEmail,
            contactPhone: settings.contactPhone,
          };
          break;
        case "regional":
          sectionData = {
            currency: settings.currency,
            timezone: settings.timezone,
            dateFormat: settings.dateFormat,
            weightUnit: settings.weightUnit,
          };
          break;
        case "seo":
          sectionData = {
            metaTitle: settings.metaTitle,
            metaDescription: settings.metaDescription,
            metaKeywords: settings.metaKeywords,
          };
          break;
        case "shipping":
          sectionData = {
            shippingSettings: settings.shippingSettings,
          };
          break;
        case "tax":
          sectionData = {
            taxSettings: settings.taxSettings,
          };
          break;
        // Add other sections as needed
      }

      // Send the data to the API
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          ...sectionData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error saving settings: ${response.statusText}`);
      }

      const updatedSettings = await response.json();
      setSettings((prevSettings) => ({
        ...prevSettings,
        ...updatedSettings,
      }));

      toast({
        title: "Settings Saved",
        description: `Your ${section} settings have been saved successfully.`,
      });
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      toast({
        title: "Error",
        description: `Failed to save ${section} settings. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving((prev) => ({ ...prev, [section]: false }));
    }
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle select change
  const handleSelectChange = (id: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle shipping input change
  const handleShippingPriceChange = (
    id: "standard" | "express" | "freeThreshold",
    value: string
  ) => {
    setSettings((prev) => {
      // Initialize shippingSettings if it doesn't exist
      const currentSettings = prev.shippingSettings || {
        standard: { price: "5.99", active: true },
        express: { price: "12.99", active: true },
        freeThreshold: { price: "75.00", active: true },
      };

      return {
        ...prev,
        shippingSettings: {
          ...currentSettings,
          [id]: {
            ...(currentSettings[id] || { active: true }),
            price: value,
          },
        },
      };
    });
  };

  // Handle shipping switch change
  const handleShippingActiveChange = (
    id: "standard" | "express" | "freeThreshold",
    checked: boolean
  ) => {
    setSettings((prev) => {
      // Initialize shippingSettings if it doesn't exist
      const currentSettings = prev.shippingSettings || {
        standard: { price: "5.99", active: true },
        express: { price: "12.99", active: true },
        freeThreshold: { price: "75.00", active: true },
      };

      return {
        ...prev,
        shippingSettings: {
          ...currentSettings,
          [id]: {
            ...(currentSettings[id] || {
              price:
                id === "standard"
                  ? "5.99"
                  : id === "express"
                    ? "12.99"
                    : "75.00",
            }),
            active: checked,
          },
        },
      };
    });
  };

  // Handle tax rate change
  const handleTaxRateChange = (value: string) => {
    setSettings((prev) => {
      // Initialize taxSettings if it doesn't exist
      const currentSettings = prev.taxSettings || {
        rate: "19",
        active: true,
        includeInPrice: false,
      };

      return {
        ...prev,
        taxSettings: {
          ...currentSettings,
          rate: value,
        },
      };
    });
  };

  // Handle tax active change
  const handleTaxActiveChange = (checked: boolean) => {
    setSettings((prev) => {
      // Initialize taxSettings if it doesn't exist
      const currentSettings = prev.taxSettings || {
        rate: "19",
        active: true,
        includeInPrice: false,
      };

      return {
        ...prev,
        taxSettings: {
          ...currentSettings,
          active: checked,
        },
      };
    });
  };

  // Handle tax includeInPrice change
  const handleTaxIncludeInPriceChange = (checked: boolean) => {
    setSettings((prev) => {
      // Initialize taxSettings if it doesn't exist
      const currentSettings = prev.taxSettings || {
        rate: "19",
        active: true,
        includeInPrice: false,
      };

      return {
        ...prev,
        taxSettings: {
          ...currentSettings,
          includeInPrice: checked,
        },
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading settings...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store settings and preferences
        </p>
      </div>

      <Tabs
        defaultValue="general"
        className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent
          value="general"
          className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Basic information about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={settings.storeName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeUrl">Store URL</Label>
                  <Input
                    id="storeUrl"
                    value={settings.storeUrl}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Textarea
                    id="storeDescription"
                    value={settings.storeDescription}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleInputChange}
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={settings.contactPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSave("general")}
                disabled={isSaving.general}>
                {isSaving.general ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Configure regional settings for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) =>
                      handleSelectChange("currency", value)
                    }>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="ron">RON (lei)</SelectItem>
                      <SelectItem value="cad">CAD ($)</SelectItem>
                      <SelectItem value="aud">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) =>
                      handleSelectChange("timezone", value)
                    }>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-new_york">
                        America/New_York (UTC-5)
                      </SelectItem>
                      <SelectItem value="america-los_angeles">
                        America/Los_Angeles (UTC-8)
                      </SelectItem>
                      <SelectItem value="europe-london">
                        Europe/London (UTC+0)
                      </SelectItem>
                      <SelectItem value="europe-paris">
                        Europe/Paris (UTC+1)
                      </SelectItem>
                      <SelectItem value="asia-tokyo">
                        Asia/Tokyo (UTC+9)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) =>
                      handleSelectChange("dateFormat", value)
                    }>
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY/MM/DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weightUnit">Weight Unit</Label>
                  <Select
                    value={settings.weightUnit}
                    onValueChange={(value) =>
                      handleSelectChange("weightUnit", value)
                    }>
                    <SelectTrigger id="weightUnit">
                      <SelectValue placeholder="Select weight unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">Pounds (lb)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="oz">Ounces (oz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSave("regional")}
                disabled={isSaving.regional}>
                {isSaving.regional ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Configure search engine optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={settings.metaTitle}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Appears in browser tabs and search engine results (50-60
                    characters recommended)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={settings.metaDescription}
                    onChange={handleInputChange}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Appears in search engine results (150-160 characters
                    recommended)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={settings.metaKeywords}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSave("seo")}
                disabled={isSaving.seo}>
                {isSaving.seo ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent
          value="shipping"
          className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Methods</CardTitle>
              <CardDescription>
                Configure available shipping methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="standard-shipping">Standard Shipping</Label>
                    <span className="text-sm text-muted-foreground">
                      3-5 business days
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[100px]">
                      <Input
                        id="standard-shipping"
                        value={
                          settings.shippingSettings?.standard?.price || "5.99"
                        }
                        onChange={(e) =>
                          handleShippingPriceChange("standard", e.target.value)
                        }
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Switch
                      checked={
                        settings.shippingSettings?.standard?.active || false
                      }
                      onCheckedChange={(checked) =>
                        handleShippingActiveChange("standard", checked)
                      }
                      id="standard-shipping-active"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="express-shipping">Express Shipping</Label>
                    <span className="text-sm text-muted-foreground">
                      1-2 business days
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[100px]">
                      <Input
                        id="express-shipping"
                        value={
                          settings.shippingSettings?.express?.price || "12.99"
                        }
                        onChange={(e) =>
                          handleShippingPriceChange("express", e.target.value)
                        }
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Switch
                      checked={
                        settings.shippingSettings?.express?.active || false
                      }
                      onCheckedChange={(checked) =>
                        handleShippingActiveChange("express", checked)
                      }
                      id="express-shipping-active"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="free-shipping-threshold">
                      Free Shipping Threshold
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      Orders above this amount qualify for free shipping
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[100px]">
                      <Input
                        id="free-shipping-threshold"
                        value={
                          settings.shippingSettings?.freeThreshold?.price ||
                          "75.00"
                        }
                        onChange={(e) =>
                          handleShippingPriceChange(
                            "freeThreshold",
                            e.target.value
                          )
                        }
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Switch
                      checked={
                        settings.shippingSettings?.freeThreshold?.active ||
                        false
                      }
                      onCheckedChange={(checked) =>
                        handleShippingActiveChange("freeThreshold", checked)
                      }
                      id="free-shipping-active"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSave("shipping")}
                disabled={isSaving.shipping}>
                {isSaving.shipping ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Payments Settings */}
        <TabsContent
          value="payments"
          className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Configure available payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label>Credit Card Payments</Label>
                    <span className="text-sm text-muted-foreground">
                      Accept Visa, Mastercard, American Express
                    </span>
                  </div>
                  <Switch
                    defaultChecked
                    id="credit-card-active"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label>PayPal</Label>
                    <span className="text-sm text-muted-foreground">
                      Allow customers to pay with PayPal
                    </span>
                  </div>
                  <Switch
                    defaultChecked
                    id="paypal-active"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label>Apple Pay</Label>
                    <span className="text-sm text-muted-foreground">
                      Accept Apple Pay for iOS devices
                    </span>
                  </div>
                  <Switch id="apple-pay-active" />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label>Google Pay</Label>
                    <span className="text-sm text-muted-foreground">
                      Accept Google Pay for Android devices
                    </span>
                  </div>
                  <Switch id="google-pay-active" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSave("payments")}
                disabled={isSaving.payments}>
                {isSaving.payments ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent
          value="tax"
          className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>
                Configure tax rates and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <span className="text-sm text-muted-foreground">
                      The percentage tax rate to apply to orders
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[100px]">
                      <Input
                        id="tax-rate"
                        value={settings.taxSettings?.rate || "19"}
                        onChange={(e) => handleTaxRateChange(e.target.value)}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <Switch
                      checked={settings.taxSettings?.active || false}
                      onCheckedChange={handleTaxActiveChange}
                      id="tax-active"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="tax-included">
                      Include Tax in Product Prices
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      If enabled, product prices will be displayed with tax
                      included
                    </span>
                  </div>
                  <Switch
                    checked={settings.taxSettings?.includeInPrice || false}
                    onCheckedChange={handleTaxIncludeInPriceChange}
                    id="tax-included"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSave("tax")}
                disabled={isSaving.tax}>
                {isSaving.tax ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent
          value="notifications"
          className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email and system notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Notification settings content would go here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="users"
          className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage admin users and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  User management content would go here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
