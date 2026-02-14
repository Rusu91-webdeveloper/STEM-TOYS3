"use client";

import React, { useState, useEffect } from "react";

import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import BusinessHoursSettings from "@/components/admin/BusinessHoursSettings";
import InventoryManagementSettings from "@/components/admin/InventoryManagementSettings";
import MarketingSettings from "@/components/admin/MarketingSettings";
import OrderProcessingSettings from "@/components/admin/OrderProcessingSettings";
import UserManagementSettings from "@/components/admin/UserManagementSettings";
import ConversionDashboard from "@/components/conversion-tracking/ConversionDashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { HelpTooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  Database,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  RotateCw,
  DollarSign,
  Clock,
  Save,
  Truck,
} from "lucide-react";
import { DEFAULT_COURIERS } from "@/lib/shipping/couriers";

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
    deliveryPrice: {
      price: string;
      active: boolean;
    };
    freeThreshold: {
      price: string;
      active: boolean;
    };
    /** Online payment shipping price (card, bank transfer) */
    onlinePaymentPrice?: string;
    /** Ramburs (COD) shipping price - higher to cover handling */
    rambursPrice?: string;
    /** Insurance threshold - orders above this value get declared value */
    insuranceThreshold?: string;
    fanCourierPickup?: {
      enabled: boolean;
      windowStart: string;
      windowEnd: string;
      offsetDays?: number;
      observations?: string;
    };
    couriers?: Array<{
      id: string;
      name: string;
      enabled: boolean;
      isDefault?: boolean;
      services: Array<{
        id: string;
        name: string;
        description: string;
        estimatedDelivery: string;
        methodType: "home" | "easybox";
        enabled?: boolean;
        priceOverride?: string;
      }>;
    }>;
  } | null;
  codSettings: {
    percentage: string;
    fixedFee: string;
    active: boolean;
  } | null;
  taxSettings: {
    rate: string;
    active: boolean;
    includeInPrice: boolean;
  } | null;
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  } | null;
  orderProcessing: {
    autoFulfillment: {
      enabled: boolean;
      threshold: number;
      excludeCategories: string[];
      requireInventoryCheck: boolean;
    };
    processingTimes: {
      standard: number;
      express: number;
      rush: number;
      weekendProcessing: boolean;
      holidayProcessing: boolean;
    };
    statusWorkflow: {
      autoConfirm: boolean;
      requirePaymentConfirmation: boolean;
      holdForReview: {
        enabled: boolean;
        threshold: number;
        keywords: string[];
      };
    };
    fulfillment: {
      warehouseLocation: string;
      packagingNotes: string;
      qualityCheckRequired: boolean;
      signatureRequired: {
        enabled: boolean;
        threshold: number;
      };
    };
    notifications: {
      orderConfirmation: boolean;
      processingUpdate: boolean;
      shippingNotification: boolean;
      deliveryConfirmation: boolean;
      adminAlerts: {
        highValueOrders: boolean;
        outOfStockItems: boolean;
        failedPayments: boolean;
      };
    };
  } | null;
  inventoryManagement: {
    stockAlerts: {
      enabled: boolean;
      lowStockThreshold: number;
      outOfStockAlert: boolean;
      emailNotifications: boolean;
      adminNotifications: boolean;
      supplierNotifications: boolean;
      priceChangeAlerts: boolean;
    };
    supplierStockSync: {
      enabled: boolean;
      syncFrequency: "realtime" | "hourly" | "daily";
      autoUpdateProductAvailability: boolean;
      syncPriceChanges: boolean;
      fallbackSuppliers: boolean;
      stockBuffer: number;
    };
    leadTimeManagement: {
      enabled: boolean;
      defaultLeadTime: number;
      dynamicLeadTimes: boolean;
      weekendProcessing: boolean;
      holidayProcessing: boolean;
      expressShippingAvailable: boolean;
      leadTimeBuffer: number;
    };
    supplierPerformance: {
      enabled: boolean;
      trackDeliveryTimes: boolean;
      trackStockAccuracy: boolean;
      trackPriceStability: boolean;
      performanceThreshold: number;
      autoDisablePoorPerformers: boolean;
      performanceReportFrequency: "weekly" | "monthly";
    };
    inventoryReports: {
      lowStockReport: boolean;
      supplierPerformanceReport: boolean;
      priceChangeReport: boolean;
      leadTimeReport: boolean;
      reportRecipients: string[];
    };
    automatedInventory: {
      enabled: boolean;
      realTimeUpdates: boolean;
      inventoryAPI: boolean;
      webhookSupport: boolean;
      autoHideOutOfStock: boolean;
      stockSyncRetryAttempts: number;
    };
  } | null;
  marketingSettings: {
    emailMarketing: {
      enabled: boolean;
      provider: "sendgrid" | "mailchimp" | "brevo" | "custom";
      apiKey: string;
      fromEmail: string;
      fromName: string;
      replyToEmail: string;
      doubleOptIn: boolean;
      unsubscribeRequired: boolean;
      sendEmailViaUnifiedSystem: {
        welcome: string;
        abandonedCart: string;
        orderConfirmation: string;
        shippingUpdate: string;
        reviewRequest: string;
        birthday: string;
        reEngagement: string;
      };
    };
    socialMedia: {
      enabled: boolean;
      platforms: {
        facebook: { enabled: boolean; pageId: string; accessToken: string };
        instagram: { enabled: boolean; accountId: string; accessToken: string };
        twitter: { enabled: boolean; handle: string; apiKey: string };
        linkedin: { enabled: boolean; companyId: string; accessToken: string };
        youtube: { enabled: boolean; channelId: string; apiKey: string };
        tiktok: { enabled: boolean; username: string; accessToken: string };
      };
      autoSharing: {
        newProducts: boolean;
        blogPosts: boolean;
        promotions: boolean;
        customerReviews: boolean;
      };
      socialProof: {
        showReviews: boolean;
        showFollowers: boolean;
        showRecentActivity: boolean;
      };
    };
    promotionalCampaigns: {
      enabled: boolean;
      campaignTypes: {
        flashSales: { enabled: boolean; duration: number; maxDiscount: number };
        seasonalSales: { enabled: boolean; autoSchedule: boolean };
        loyaltyProgram: {
          enabled: boolean;
          pointsPerDollar: number;
          redemptionRate: number;
        };
        referralProgram: {
          enabled: boolean;
          rewardAmount: number;
          expiryDays: number;
        };
        birthdayOffers: {
          enabled: boolean;
          discountPercent: number;
          validDays: number;
        };
        firstTimeBuyer: {
          enabled: boolean;
          discountPercent: number;
          minimumOrder: number;
        };
      };
      discountRules: {
        maxDiscountPercent: number;
        minimumOrderAmount: number;
        excludeCategories: string[];
        stackableDiscounts: boolean;
        oneTimeUse: boolean;
      };
    };
    customerSegmentation: {
      enabled: boolean;
      segments: {
        newCustomers: { enabled: boolean; daysSinceFirstOrder: number };
        returningCustomers: { enabled: boolean; minimumOrders: number };
        highValueCustomers: { enabled: boolean; minimumSpend: number };
        inactiveCustomers: { enabled: boolean; daysSinceLastOrder: number };
        cartAbandoners: { enabled: boolean; abandonedThreshold: number };
        productCategoryLovers: { enabled: boolean; categories: string[] };
      };
      targetingRules: {
        locationBased: boolean;
        purchaseHistory: boolean;
        browsingBehavior: boolean;
        emailEngagement: boolean;
        socialMediaActivity: boolean;
      };
    };
    marketingAutomation: {
      enabled: boolean;
      workflows: {
        welcomeSeries: { enabled: boolean; emails: number; interval: number };
        abandonedCart: { enabled: boolean; emails: number; interval: number };
        postPurchase: { enabled: boolean; emails: number; interval: number };
        reEngagement: { enabled: boolean; emails: number; interval: number };
        birthdayCampaign: {
          enabled: boolean;
          emails: number;
          interval: number;
        };
        seasonalPromotions: {
          enabled: boolean;
          emails: number;
          interval: number;
        };
      };
      triggers: {
        newCustomer: boolean;
        cartAbandonment: boolean;
        orderCompletion: boolean;
        productView: boolean;
        categoryView: boolean;
        searchQuery: boolean;
      };
    };
    analytics: {
      enabled: boolean;
      tracking: {
        googleAnalytics: { enabled: boolean; trackingId: string };
        facebookPixel: { enabled: boolean; pixelId: string };
        googleAds: { enabled: boolean; conversionId: string };
        tiktokPixel: { enabled: boolean; pixelId: string };
        customTracking: { enabled: boolean; script: string };
      };
      goals: {
        revenueTarget: number;
        conversionRate: number;
        emailOpenRate: number;
        clickThroughRate: number;
        socialEngagement: number;
      };
    };
    contentMarketing: {
      enabled: boolean;
      blog: {
        enabled: boolean;
        autoPublish: boolean;
        seoOptimization: boolean;
        socialSharing: boolean;
        emailNewsletter: boolean;
      };
      seo: {
        enabled: boolean;
        metaTags: boolean;
        structuredData: boolean;
        sitemapGeneration: boolean;
        robotsTxt: boolean;
      };
      influencerMarketing: {
        enabled: boolean;
        collaborationPlatform: string;
        commissionRate: number;
        minimumFollowers: number;
      };
    };
  } | null;
  paymentSettings?: any;
  metadata?: any;
  securitySettings?: {
    twoFactorEnabled?: boolean;
    sessionTimeout?: string;
  };
}

interface SettingsBackup {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  size: string;
  version: string;
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
    deliveryPrice: {
      price: "15.00",
      active: true,
    },
    freeThreshold: {
      price: "199.00",
      active: true,
    },
    onlinePaymentPrice: "19.99",
    rambursPrice: "24.99",
    insuranceThreshold: "500",
    fanCourierPickup: {
      enabled: false,
      windowStart: "09:00",
      windowEnd: "16:00",
      offsetDays: 0,
      observations: "",
    },
    couriers: DEFAULT_COURIERS,
  },
  codSettings: {
    percentage: "3",
    fixedFee: "5.00",
    active: true,
  },
  taxSettings: {
    rate: "21",
    active: true,
    includeInPrice: false,
  },
  businessHours: {
    monday: { open: "09:00", close: "17:00", closed: false },
    tuesday: { open: "09:00", close: "17:00", closed: false },
    wednesday: { open: "09:00", close: "17:00", closed: false },
    thursday: { open: "09:00", close: "17:00", closed: false },
    friday: { open: "09:00", close: "17:00", closed: false },
    saturday: { open: "10:00", close: "16:00", closed: false },
    sunday: { open: "10:00", close: "16:00", closed: false },
  },
  orderProcessing: {
    autoFulfillment: {
      enabled: true,
      threshold: 500, // 500 RON (equivalent to ~100 EUR)
      excludeCategories: [],
      requireInventoryCheck: true,
    },
    processingTimes: {
      standard: 3,
      express: 1,
      rush: 0,
      weekendProcessing: true,
      holidayProcessing: false,
    },
    statusWorkflow: {
      autoConfirm: true,
      requirePaymentConfirmation: true,
      holdForReview: {
        enabled: true,
        threshold: 2500, // 2500 RON (equivalent to ~500 EUR)
        keywords: ["fraud", "risky", "urgent", "special"],
      },
    },
    fulfillment: {
      warehouseLocation: "Main Warehouse",
      packagingNotes: "Pack carefully",
      qualityCheckRequired: true,
      signatureRequired: {
        enabled: true,
        threshold: 500, // 500 RON (equivalent to ~100 EUR)
      },
    },
    notifications: {
      orderConfirmation: true,
      processingUpdate: true,
      shippingNotification: true,
      deliveryConfirmation: true,
      adminAlerts: {
        highValueOrders: true,
        outOfStockItems: true,
        failedPayments: true,
      },
    },
  },
  inventoryManagement: {
    stockAlerts: {
      enabled: true,
      lowStockThreshold: 5,
      outOfStockAlert: true,
      emailNotifications: true,
      adminNotifications: true,
      supplierNotifications: true,
      priceChangeAlerts: true,
    },
    supplierStockSync: {
      enabled: true,
      syncFrequency: "hourly",
      autoUpdateProductAvailability: true,
      syncPriceChanges: true,
      fallbackSuppliers: true,
      stockBuffer: 2,
    },
    leadTimeManagement: {
      enabled: true,
      defaultLeadTime: 7,
      dynamicLeadTimes: true,
      weekendProcessing: true,
      holidayProcessing: false,
      expressShippingAvailable: true,
      leadTimeBuffer: 2,
    },
    supplierPerformance: {
      enabled: true,
      trackDeliveryTimes: true,
      trackStockAccuracy: true,
      trackPriceStability: true,
      performanceThreshold: 80,
      autoDisablePoorPerformers: false,
      performanceReportFrequency: "monthly",
    },
    inventoryReports: {
      lowStockReport: true,
      supplierPerformanceReport: true,
      priceChangeReport: true,
      leadTimeReport: true,
      reportRecipients: ["admin@techtots.com", "manager@techtots.com"],
    },
    automatedInventory: {
      enabled: true,
      realTimeUpdates: true,
      inventoryAPI: true,
      webhookSupport: true,
      autoHideOutOfStock: true,
      stockSyncRetryAttempts: 3,
    },
  },
  marketingSettings: {
    emailMarketing: {
      enabled: true,
      provider: "sendgrid",
      apiKey: "YOUR_SENDGRID_API_KEY",
      fromEmail: "info@techtots.com",
      fromName: "TechTots",
      replyToEmail: "support@techtots.com",
      doubleOptIn: true,
      unsubscribeRequired: true,
      sendEmailViaUnifiedSystem: {
        welcome: "Welcome to TechTots!",
        abandonedCart: "Your cart is waiting for you at TechTots!",
        orderConfirmation: "Thank you for your order from TechTots!",
        shippingUpdate: "Your order is on its way!",
        reviewRequest: "We'd love your feedback on your TechTots experience!",
        birthday: "Happy birthday from TechTots!",
        reEngagement: "We miss you at TechTots!",
      },
    },
    socialMedia: {
      enabled: true,
      platforms: {
        facebook: {
          enabled: true,
          pageId: "YOUR_FACEBOOK_PAGE_ID",
          accessToken: "YOUR_FACEBOOK_ACCESS_TOKEN",
        },
        instagram: {
          enabled: true,
          accountId: "YOUR_INSTAGRAM_ACCOUNT_ID",
          accessToken: "YOUR_INSTAGRAM_ACCESS_TOKEN",
        },
        twitter: {
          enabled: true,
          handle: "@techtots",
          apiKey: "YOUR_TWITTER_API_KEY",
        },
        linkedin: {
          enabled: true,
          companyId: "YOUR_LINKEDIN_COMPANY_ID",
          accessToken: "YOUR_LINKEDIN_ACCESS_TOKEN",
        },
        youtube: {
          enabled: true,
          channelId: "YOUR_YOUTUBE_CHANNEL_ID",
          apiKey: "YOUR_YOUTUBE_API_KEY",
        },
        tiktok: {
          enabled: true,
          username: "@techtots",
          accessToken: "YOUR_TIKTOK_ACCESS_TOKEN",
        },
      },
      autoSharing: {
        newProducts: true,
        blogPosts: true,
        promotions: true,
        customerReviews: true,
      },
      socialProof: {
        showReviews: true,
        showFollowers: true,
        showRecentActivity: true,
      },
    },
    promotionalCampaigns: {
      enabled: true,
      campaignTypes: {
        flashSales: { enabled: true, duration: 7, maxDiscount: 50 },
        seasonalSales: { enabled: true, autoSchedule: true },
        loyaltyProgram: {
          enabled: true,
          pointsPerDollar: 1,
          redemptionRate: 10,
        },
        referralProgram: { enabled: true, rewardAmount: 20, expiryDays: 30 },
        birthdayOffers: { enabled: true, discountPercent: 10, validDays: 30 },
        firstTimeBuyer: {
          enabled: true,
          discountPercent: 15,
          minimumOrder: 100,
        },
      },
      discountRules: {
        maxDiscountPercent: 50,
        minimumOrderAmount: 50,
        excludeCategories: [],
        stackableDiscounts: true,
        oneTimeUse: false,
      },
    },
    customerSegmentation: {
      enabled: true,
      segments: {
        newCustomers: { enabled: true, daysSinceFirstOrder: 7 },
        returningCustomers: { enabled: true, minimumOrders: 5 },
        highValueCustomers: { enabled: true, minimumSpend: 500 },
        inactiveCustomers: { enabled: true, daysSinceLastOrder: 30 },
        cartAbandoners: { enabled: true, abandonedThreshold: 10 },
        productCategoryLovers: {
          enabled: true,
          categories: ["STEM Toys", "Educational Toys"],
        },
      },
      targetingRules: {
        locationBased: true,
        purchaseHistory: true,
        browsingBehavior: true,
        emailEngagement: true,
        socialMediaActivity: true,
      },
    },
    marketingAutomation: {
      enabled: true,
      workflows: {
        welcomeSeries: { enabled: true, emails: 3, interval: 7 },
        abandonedCart: { enabled: true, emails: 2, interval: 24 },
        postPurchase: { enabled: true, emails: 1, interval: 7 },
        reEngagement: { enabled: true, emails: 1, interval: 30 },
        birthdayCampaign: { enabled: true, emails: 1, interval: 365 },
        seasonalPromotions: { enabled: true, emails: 2, interval: 90 },
      },
      triggers: {
        newCustomer: true,
        cartAbandonment: true,
        orderCompletion: true,
        productView: true,
        categoryView: true,
        searchQuery: true,
      },
    },
    analytics: {
      enabled: true,
      tracking: {
        googleAnalytics: {
          enabled: true,
          trackingId: "YOUR_GA_TRACKING_ID",
        },
        facebookPixel: { enabled: true, pixelId: "YOUR_FB_PIXEL_ID" },
        googleAds: {
          enabled: true,
          conversionId: "YOUR_GA_CONVERSION_ID",
        },
        tiktokPixel: { enabled: true, pixelId: "YOUR_TIKTOK_PIXEL_ID" },
        customTracking: {
          enabled: true,
          script: "YOUR_CUSTOM_TRACKING_SCRIPT",
        },
      },
      goals: {
        revenueTarget: 100000,
        conversionRate: 5,
        emailOpenRate: 20,
        clickThroughRate: 10,
        socialEngagement: 1000,
      },
    },
    contentMarketing: {
      enabled: true,
      blog: {
        enabled: true,
        autoPublish: true,
        seoOptimization: true,
        socialSharing: true,
        emailNewsletter: true,
      },
      seo: {
        enabled: true,
        metaTags: true,
        structuredData: true,
        sitemapGeneration: true,
        robotsTxt: true,
      },
      influencerMarketing: {
        enabled: true,
        collaborationPlatform: "InfluencerHub",
        commissionRate: 10,
        minimumFollowers: 1000,
      },
    },
  },
};

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({
    general: false,
    regional: false,
    seo: false,
    shipping: false,
    payments: false,
    tax: false,
    businessHours: false,
    orderProcessing: false,
    inventoryManagement: false,
    marketing: false,
    security: false,
    analytics: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] =
    useState<StoreSettings>(defaultSettings);
  const defaultShippingSettings = defaultSettings.shippingSettings ?? {
    deliveryPrice: { price: "15.00", active: true },
    freeThreshold: { price: "199.00", active: true },
    onlinePaymentPrice: "19.99",
    rambursPrice: "24.99",
    insuranceThreshold: "500",
    fanCourierPickup: {
      enabled: false,
      windowStart: "09:00",
      windowEnd: "16:00",
      offsetDays: 0,
      observations: "",
    },
    couriers: DEFAULT_COURIERS,
  };

  // Backup states
  const [backups, setBackups] = useState<SettingsBackup[]>([]);
  const [backupDialog, setBackupDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string>("");

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");

      if (!response.ok) {
        throw new Error(`Error fetching settings: ${response.statusText}`);
      }

      const data = await response.json();

      // Only set defaults for missing fields, don't override existing data
      const mergedData = {
        ...defaultSettings,
        ...data,
        // Only set shippingSettings defaults if it's completely missing
        shippingSettings: (() => {
          const existing = data.shippingSettings;
          if (!existing) {
            return defaultShippingSettings;
          }
          // Migrate from old structure (standard/express) to new structure (deliveryPrice)
          if (existing.standard || existing.express) {
            // Use standard price if available, otherwise express, otherwise default
            const migratedPrice = existing.standard?.price || existing.express?.price || "15.00";
            return {
              deliveryPrice: {
                price: migratedPrice,
                active: existing.standard?.active || existing.express?.active || true,
              },
              freeThreshold:
                existing.freeThreshold ||
                defaultShippingSettings.freeThreshold,
              onlinePaymentPrice:
                existing.onlinePaymentPrice ||
                defaultShippingSettings.onlinePaymentPrice,
              rambursPrice:
                existing.rambursPrice ||
                defaultShippingSettings.rambursPrice,
              insuranceThreshold:
                existing.insuranceThreshold ||
                defaultShippingSettings.insuranceThreshold,
              fanCourierPickup: {
                ...defaultShippingSettings.fanCourierPickup,
                ...(existing.fanCourierPickup || {}),
              },
              couriers:
                existing.couriers ||
                defaultShippingSettings.couriers,
            };
          }
          return {
            ...existing,
            deliveryPrice:
              existing.deliveryPrice ||
              defaultShippingSettings.deliveryPrice,
            freeThreshold:
              existing.freeThreshold ||
              defaultShippingSettings.freeThreshold,
            onlinePaymentPrice:
              existing.onlinePaymentPrice ||
              defaultShippingSettings.onlinePaymentPrice,
            rambursPrice:
              existing.rambursPrice ||
              defaultShippingSettings.rambursPrice,
            insuranceThreshold:
              existing.insuranceThreshold ||
              defaultShippingSettings.insuranceThreshold,
            fanCourierPickup: {
              ...defaultShippingSettings.fanCourierPickup,
              ...(existing.fanCourierPickup || {}),
            },
            couriers:
              existing.couriers ||
              defaultShippingSettings.couriers,
          };
        })(),
        // Only set codSettings defaults if it's completely missing
        codSettings: data.codSettings || defaultSettings.codSettings,
        // Only set taxSettings defaults if it's completely missing
        taxSettings: data.taxSettings || defaultSettings.taxSettings,
        // Only set businessHours defaults if it's completely missing
        businessHours: data.businessHours || defaultSettings.businessHours,
        // Only set orderProcessing defaults if it's completely missing
        orderProcessing:
          data.orderProcessing || defaultSettings.orderProcessing,
        // Only set inventoryManagement defaults if it's completely missing
        inventoryManagement:
          data.inventoryManagement || defaultSettings.inventoryManagement,
        // Only set marketingSettings defaults if it's completely missing
        marketingSettings:
          data.marketingSettings || defaultSettings.marketingSettings,
      };

      setSettings(mergedData);
      setOriginalSettings(mergedData);
      setHasUnsavedChanges(false);
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
  };

  // Fetch current settings on component mount
  useEffect(() => {
    fetchSettings();
    fetchBackups();
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
      // Don't break the page if backups fail
      setBackups([]);
    }
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create backup");
      }

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
        description:
          error instanceof Error ? error.message : "Failed to create backup",
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to restore backup");
      }

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
        description:
          error instanceof Error ? error.message : "Failed to restore backup",
        variant: "destructive",
      });
    }
  };

  // Generic save handler with section parameter
  const handleSave = async (section: keyof typeof isSaving) => {
    setIsSaving(prev => ({ ...prev, [section]: true }));

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
        case "cod":
          sectionData = {
            codSettings: settings.codSettings,
          };
          break;
        case "tax":
          sectionData = {
            taxSettings: settings.taxSettings,
          };
          break;
        case "businessHours":
          sectionData = {
            businessHours: settings.businessHours,
          };
          break;
        case "orderProcessing":
          sectionData = {
            orderProcessing: settings.orderProcessing,
          };
          break;
        case "inventoryManagement":
          sectionData = {
            inventoryManagement: settings.inventoryManagement,
          };
          break;
        case "marketing":
          sectionData = {
            marketingSettings: settings.marketingSettings,
          };
          break;
        case "security":
          sectionData = {
            securitySettings: settings.securitySettings,
          };
          break;
        default:
          sectionData = {};
          break;
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
      setSettings(prevSettings => ({
        ...prevSettings,
        ...updatedSettings,
      }));
      setOriginalSettings(updatedSettings);
      setHasUnsavedChanges(false);

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
      setIsSaving(prev => ({ ...prev, [section]: false }));
    }
  };

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [id]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Handle select change
  const handleSelectChange = (id: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [id]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Handle shipping input change
  const handleShippingPriceChange = (
    id: "deliveryPrice" | "freeThreshold",
    value: string
  ) => {
    setSettings(prev => {
      // Initialize shippingSettings if it doesn't exist
      const currentSettings = prev.shippingSettings || defaultShippingSettings;

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
    id: "deliveryPrice" | "freeThreshold",
    checked: boolean
  ) => {
    setSettings(prev => {
      // Initialize shippingSettings if it doesn't exist
      const currentSettings = prev.shippingSettings || defaultShippingSettings;

      return {
        ...prev,
        shippingSettings: {
          ...currentSettings,
          [id]: {
            ...(currentSettings[id] || {
              price:
                id === "deliveryPrice"
                  ? "15.00"
                  : "199.00",
            }),
            active: checked,
          },
        },
      };
    });
  };

  const handleFanCourierPickupChange = (
    value: Partial<{
      enabled: boolean;
      windowStart: string;
      windowEnd: string;
      offsetDays: number;
      observations: string;
    }>
  ) => {
    setSettings(prev => {
      const currentSettings = prev.shippingSettings || defaultShippingSettings;
      const currentPickup = currentSettings.fanCourierPickup || {
        enabled: false,
        windowStart: "09:00",
        windowEnd: "16:00",
        offsetDays: 0,
        observations: "",
      };

      return {
        ...prev,
        shippingSettings: {
          ...currentSettings,
          fanCourierPickup: {
            ...currentPickup,
            ...value,
          },
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const updateCouriers = (
    updater: (couriers: NonNullable<StoreSettings["shippingSettings"]>["couriers"]) => NonNullable<StoreSettings["shippingSettings"]>["couriers"]
  ) => {
    setSettings(prev => {
      const currentSettings = prev.shippingSettings || defaultShippingSettings;

      return {
        ...prev,
        shippingSettings: {
          ...currentSettings,
          couriers: updater(currentSettings.couriers || DEFAULT_COURIERS),
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleCourierChange = (
    index: number,
    value: Partial<{
      id: string;
      name: string;
      enabled: boolean;
      isDefault: boolean;
    }>
  ) => {
    updateCouriers(couriers =>
      couriers?.map((courier, idx) =>
        idx === index ? { ...courier, ...value } : courier
      )
    );
  };

  const setDefaultCourier = (index: number) => {
    updateCouriers(couriers =>
      couriers?.map((courier, idx) => ({
        ...courier,
        isDefault: idx === index,
      }))
    );
  };

  const addCourier = () => {
    updateCouriers(couriers => [
      ...(couriers || []),
      {
        id: `courier-${Date.now()}`,
        name: "New Courier",
        enabled: false,
        services: [
          {
            id: "home",
            name: "Home Delivery",
            description: "Livrare la adresa ta",
            estimatedDelivery: "24-48h",
            methodType: "home",
            enabled: true,
          },
        ],
      },
    ]);
  };

  const removeCourier = (index: number) => {
    updateCouriers(couriers => {
      const next = (couriers || []).filter((_, idx) => idx !== index);
      if (!next.find(courier => courier.isDefault) && next.length > 0) {
        next[0].isDefault = true;
      }
      return next;
    });
  };

  const addCourierService = (courierIndex: number) => {
    updateCouriers(couriers =>
      couriers?.map((courier, idx) => {
        if (idx !== courierIndex) return courier;
        return {
          ...courier,
          services: [
            ...(courier.services || []),
            {
              id: `service-${Date.now()}`,
              name: "New Service",
              description: "Service description",
              estimatedDelivery: "24-48h",
              methodType: "home",
              enabled: true,
            },
          ],
        };
      })
    );
  };

  const removeCourierService = (courierIndex: number, serviceIndex: number) => {
    updateCouriers(couriers =>
      couriers?.map((courier, idx) => {
        if (idx !== courierIndex) return courier;
        return {
          ...courier,
          services: courier.services.filter((_, sIdx) => sIdx !== serviceIndex),
        };
      })
    );
  };

  const updateCourierService = (
    courierIndex: number,
    serviceIndex: number,
    value: Partial<{
      id: string;
      name: string;
      description: string;
      estimatedDelivery: string;
      methodType: "home" | "easybox";
      enabled: boolean;
      priceOverride: string;
    }>
  ) => {
    updateCouriers(couriers =>
      couriers?.map((courier, idx) => {
        if (idx !== courierIndex) return courier;
        return {
          ...courier,
          services: courier.services.map((service, sIdx) =>
            sIdx === serviceIndex ? { ...service, ...value } : service
          ),
        };
      })
    );
  };

  // Handle tax rate change
  const handleTaxRateChange = (value: string) => {
    setSettings(prev => {
      // Initialize taxSettings if it doesn't exist
      const currentSettings = prev.taxSettings || {
        rate: "21",
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
    setSettings(prev => {
      // Initialize taxSettings if it doesn't exist
      const currentSettings = prev.taxSettings || {
        rate: "21",
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

  // Handle COD percentage change
  const handleCODPercentageChange = (value: string) => {
    setSettings(prev => {
      const currentSettings = prev.codSettings || {
        percentage: "3",
        fixedFee: "5.00",
        active: true,
      };

      return {
        ...prev,
        codSettings: {
          ...currentSettings,
          percentage: value,
        },
      };
    });
  };

  // Handle COD fixed fee change
  const handleCODFixedFeeChange = (value: string) => {
    setSettings(prev => {
      const currentSettings = prev.codSettings || {
        percentage: "3",
        fixedFee: "5.00",
        active: true,
      };

      return {
        ...prev,
        codSettings: {
          ...currentSettings,
          fixedFee: value,
        },
      };
    });
  };

  // Handle COD active change
  const handleCODActiveChange = (checked: boolean) => {
    setSettings(prev => {
      const currentSettings = prev.codSettings || {
        percentage: "3",
        fixedFee: "5.00",
        active: true,
      };

      return {
        ...prev,
        codSettings: {
          ...currentSettings,
          active: checked,
        },
      };
    });
  };

  // Handle tax includeInPrice change
  const handleTaxIncludeInPriceChange = (checked: boolean) => {
    setSettings(prev => {
      // Initialize taxSettings if it doesn't exist
      const currentSettings = prev.taxSettings || {
        rate: "21",
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="cod">Taxa Ramburs</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="businessHours">Business Hours</TabsTrigger>
          <TabsTrigger value="orderProcessing">Order Processing</TabsTrigger>
          <TabsTrigger value="inventoryManagement">
            Inventory Management
          </TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="security">Security & Backup</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Store Status
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your store is running
                </p>
                <Badge variant="default" className="mt-2">
                  SUCCESS
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Last Backup
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backups && backups.length > 0
                    ? new Date(backups[0].createdAt).toLocaleDateString()
                    : "Never"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Settings backup status
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currency</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {settings.currency?.toUpperCase() || "USD"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Store currency
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Timezone</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {settings.timezone?.split("/")[1]?.replace("_", " ") ||
                    "New York"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Store timezone
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common settings management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setBackupDialog(true)}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                >
                  <Database className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Create Backup</div>
                    <div className="text-sm text-muted-foreground">
                      Backup current settings
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRestoreDialog(true)}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                >
                  <Upload className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Restore Backup</div>
                    <div className="text-sm text-muted-foreground">
                      Restore from backup
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                >
                  <RotateCw className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Refresh</div>
                    <div className="text-sm text-muted-foreground">
                      Reload settings
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
              <CardDescription>
                Track recent settings modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">
                        Store information updated
                      </div>
                      <div className="text-sm text-muted-foreground">
                        General settings modified
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    2 hours ago
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">
                        Security settings updated
                      </div>
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
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="storeName">Store Name</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Store Name</p>
                          <p>
                            The official name of your store that appears in
                            emails, invoices, and customer communications. This
                            is your brand identity.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> "TechTots" - This name
                            will appear on order confirmations, shipping labels,
                            and customer emails.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    id="storeName"
                    value={settings.storeName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="storeUrl">Store URL</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Store URL</p>
                          <p>
                            The main website URL for your store. This is used in
                            emails, social media links, and customer
                            communications.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> "https://techtots.com" -
                            Customers will see this URL in emails and can click
                            to visit your store.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    id="storeUrl"
                    value={settings.storeUrl}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="storeDescription">Store Description</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Store Description</p>
                          <p>
                            A brief description of your store that explains what
                            you sell and your mission. This appears in search
                            results and social media.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> "TechTots is a premier
                            online destination for STEM toys that inspire
                            learning through play." - This helps customers
                            understand your brand and products.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Textarea
                    id="storeDescription"
                    value={settings.storeDescription}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Contact Email</p>
                          <p>
                            The primary email address customers can use to
                            contact you. This appears on your website and in
                            customer communications.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> "info@techtots.com" -
                            Customers will use this email for general inquiries,
                            support, and business matters.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    id="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleInputChange}
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Contact Phone</p>
                          <p>
                            The primary phone number customers can call for
                            support or inquiries. This appears on your website
                            and in customer communications.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> "+1 (555) 123-4567" -
                            Customers can call this number for urgent support or
                            to speak with your team directly.
                          </p>
                        </div>
                      }
                    />
                  </div>
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
                disabled={isSaving.general}
              >
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="currency">Currency</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Store Currency</p>
                          <p>
                            The primary currency for your store. All prices,
                            orders, and financial reports will be displayed in
                            this currency.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> If set to EUR (€), all
                            product prices will be shown in euros, and customers
                            will pay in euros. This affects pricing, taxes, and
                            payment processing.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Select
                    value={settings.currency}
                    onValueChange={value =>
                      handleSelectChange("currency", value)
                    }
                  >
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="timezone">Timezone</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Store Timezone</p>
                          <p>
                            The timezone for your store operations. This affects
                            order timestamps, business hours, and scheduled
                            operations.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> If set to "Europe/Paris
                            (UTC+1)", all order times, business hours, and
                            automated tasks will be based on Central European
                            Time.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Select
                    value={settings.timezone}
                    onValueChange={value =>
                      handleSelectChange("timezone", value)
                    }
                  >
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Date Display Format</p>
                          <p>
                            How dates are displayed throughout your store,
                            including order dates, delivery dates, and admin
                            reports.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> If set to "DD/MM/YYYY",
                            dates will appear as "25/12/2024" instead of
                            "12/25/2024". This should match your local date
                            format preferences.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={value =>
                      handleSelectChange("dateFormat", value)
                    }
                  >
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="weightUnit">Weight Unit</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Product Weight Unit</p>
                          <p>
                            The unit used to measure and display product
                            weights. This affects shipping calculations and
                            product specifications.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> If set to "kg", product
                            weights will be shown as "2.5 kg" and shipping costs
                            will be calculated based on kilograms.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Select
                    value={settings.weightUnit}
                    onValueChange={value =>
                      handleSelectChange("weightUnit", value)
                    }
                  >
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
                disabled={isSaving.regional}
              >
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Meta Title</p>
                          <p>
                            The title that appears in browser tabs, search
                            engine results, and when your site is shared on
                            social media. This is crucial for SEO.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> "TechTots | STEM Toys for
                            Curious Minds" - This appears in Google search
                            results and browser tabs. Keep it under 60
                            characters for best results.
                          </p>
                        </div>
                      }
                    />
                  </div>
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Meta Description</p>
                          <p>
                            A brief description of your store that appears in
                            search engine results below the title. This helps
                            customers understand what you offer.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> "Discover the best STEM
                            toys for curious minds at TechTots. Educational toys
                            that make learning fun for children of all ages." -
                            This appears in Google search results and should be
                            150-160 characters.
                          </p>
                        </div>
                      }
                    />
                  </div>
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="metaKeywords">Meta Keywords</Label>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Meta Keywords</p>
                          <p>
                            Keywords that describe your store and products.
                            While less important for modern SEO, they can still
                            help search engines understand your content.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> "STEM toys, educational
                            toys, science toys, technology toys, engineering
                            toys, math toys" - Separate keywords with commas and
                            focus on terms customers might search for.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <Input
                    id="metaKeywords"
                    value={settings.metaKeywords}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSave("seo")} disabled={isSaving.seo}>
                {isSaving.seo ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Methods</CardTitle>
              <CardDescription>
                Configure available shipping methods and free shipping threshold
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="delivery-price">
                        Delivery Price (for orders under 199 lei)
                      </Label>
                      <HelpTooltip
                        content={
                          <div className="space-y-2">
                            <p className="font-medium">Delivery Price</p>
                            <p>
                              The delivery price applied to orders under 199 lei.
                              This price applies to both "FanCourier Standard" (Home delivery)
                              and "FanCourier FANbox" options. Orders over 199 lei will have
                              free shipping.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Example:</strong> Set to 15.00 lei. Customers with
                              orders under 199 lei will pay 15.00 lei for delivery, regardless
                              of whether they choose home delivery or FANbox.
                            </p>
                          </div>
                        }
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Applied to both FanCourier Standard and FanCourier FANbox
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[100px]">
                      <Input
                        id="delivery-price"
                        value={
                          settings.shippingSettings?.deliveryPrice?.price || "15.00"
                        }
                        onChange={e =>
                          handleShippingPriceChange("deliveryPrice", e.target.value)
                        }
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Switch
                      checked={
                        settings.shippingSettings?.deliveryPrice?.active || false
                      }
                      onCheckedChange={checked =>
                        handleShippingActiveChange("deliveryPrice", checked)
                      }
                      id="delivery-price-active"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="free-shipping-threshold">
                        Free Shipping Threshold
                      </Label>
                      <HelpTooltip
                        content={
                          <div className="space-y-2">
                            <p className="font-medium">
                              Free Shipping Threshold
                            </p>
                            <p>
                              The minimum order amount required for customers to
                              receive free shipping. This encourages larger
                              orders and can increase average order value.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Example:</strong> Set to €50. When
                              customers add items worth €50 or more to their
                              cart, they'll see "Free shipping!" and won't pay
                              shipping fees. This encourages customers to buy
                              more items.
                            </p>
                          </div>
                        }
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Orders above this amount qualify for free shipping. This
                      setting affects all components that display free shipping
                      information.
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
                        onChange={e =>
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
                      onCheckedChange={checked =>
                        handleShippingActiveChange("freeThreshold", checked)
                      }
                      id="free-shipping-active"
                    />
                  </div>
                </div>
                <Separator />
                {/* Payment-Aware Shipping Prices */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Payment Method Pricing</h4>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">
                            Payment Method Shipping Pricing
                          </p>
                          <p>
                            Different shipping prices based on payment method.
                            Ramburs (COD) orders are priced higher to cover
                            cash handling costs and courier fees.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Set different shipping prices for online payments vs. cash on delivery (ramburs)
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="online-payment-price">
                        Online Payment Price (RON)
                      </Label>
                      <Input
                        id="online-payment-price"
                        value={
                          settings.shippingSettings?.onlinePaymentPrice || "19.99"
                        }
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            shippingSettings: {
                              ...prev.shippingSettings!,
                              onlinePaymentPrice: e.target.value,
                            },
                          }))
                        }
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="19.99"
                      />
                      <p className="text-xs text-muted-foreground">
                        For card, bank transfer payments
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ramburs-price">
                        Ramburs (COD) Price (RON)
                      </Label>
                      <Input
                        id="ramburs-price"
                        value={
                          settings.shippingSettings?.rambursPrice || "24.99"
                        }
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            shippingSettings: {
                              ...prev.shippingSettings!,
                              rambursPrice: e.target.value,
                            },
                          }))
                        }
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="24.99"
                      />
                      <p className="text-xs text-muted-foreground">
                        Cash on delivery - higher to cover handling
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Insurance Threshold */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Insurance Threshold</h4>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">
                            Declared Value Insurance
                          </p>
                          <p>
                            Orders with a total value equal to or above this threshold
                            will have a "declared value" sent to the courier. This provides
                            insurance coverage if the package is lost or damaged.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Also triggers for:</strong> Any bundle in the order,
                            or any single product priced at or above this threshold.
                          </p>
                        </div>
                      }
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Orders above this amount will have declared value (insurance) when creating shipping labels
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-[150px]">
                      <Label htmlFor="insurance-threshold" className="sr-only">
                        Insurance Threshold (RON)
                      </Label>
                      <Input
                        id="insurance-threshold"
                        value={
                          settings.shippingSettings?.insuranceThreshold || "500"
                        }
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            shippingSettings: {
                              ...prev.shippingSettings!,
                              insuranceThreshold: e.target.value,
                            },
                          }))
                        }
                        type="number"
                        min="0"
                        step="1"
                        placeholder="500"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">RON</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Example: If set to 500 RON, an order with 10 × 50 RON items (= 500 RON total) will be insured.
                  </p>
                </div>
                <Separator />
                {/* FanCourier Pickup Scheduling */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">FanCourier Pickup</h4>
                    <HelpTooltip
                      content={
                        <div className="space-y-2">
                          <p className="font-medium">Pickup Scheduling</p>
                          <p>
                            When enabled, the system will create a pickup request
                            automatically after an AWB is created.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Use this if your supplier needs FAN Courier to pick up
                            parcels from their warehouse.
                          </p>
                        </div>
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Label>Auto schedule pickup</Label>
                      <span className="text-sm text-muted-foreground">
                        Creates a pickup request after AWB creation
                      </span>
                    </div>
                    <Switch
                      checked={
                        settings.shippingSettings?.fanCourierPickup?.enabled ||
                        false
                      }
                      onCheckedChange={checked =>
                        handleFanCourierPickupChange({ enabled: checked })
                      }
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="fan-pickup-start">Window Start</Label>
                      <Input
                        id="fan-pickup-start"
                        type="time"
                        value={
                          settings.shippingSettings?.fanCourierPickup
                            ?.windowStart || "09:00"
                        }
                        onChange={e =>
                          handleFanCourierPickupChange({
                            windowStart: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fan-pickup-end">Window End</Label>
                      <Input
                        id="fan-pickup-end"
                        type="time"
                        value={
                          settings.shippingSettings?.fanCourierPickup?.windowEnd ||
                          "16:00"
                        }
                        onChange={e =>
                          handleFanCourierPickupChange({
                            windowEnd: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fan-pickup-offset">
                        Pickup Offset (days)
                      </Label>
                      <Input
                        id="fan-pickup-offset"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          settings.shippingSettings?.fanCourierPickup
                            ?.offsetDays ?? 0
                        }
                        onChange={e =>
                          handleFanCourierPickupChange({
                            offsetDays: Number(e.target.value || 0),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fan-pickup-observations">
                      Pickup Observations (optional)
                    </Label>
                    <Textarea
                      id="fan-pickup-observations"
                      value={
                        settings.shippingSettings?.fanCourierPickup?.observations ||
                        ""
                      }
                      onChange={e =>
                        handleFanCourierPickupChange({
                          observations: e.target.value,
                        })
                      }
                      placeholder="Example: Collect between 09:00-12:00, call before arrival"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                <Separator />
                {/* Courier Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">Couriers</h4>
                    </div>
                    <Button size="sm" onClick={addCourier}>
                      Add Courier
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(settings.shippingSettings?.couriers || DEFAULT_COURIERS).map(
                      (courier, courierIndex) => (
                        <Card key={`${courier.id}-${courierIndex}`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {courier.name || "Courier"}
                              </CardTitle>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`courier-default-${courierIndex}`}>
                                    Default
                                  </Label>
                                  <Switch
                                    checked={courier.isDefault || false}
                                    onCheckedChange={checked => {
                                      if (checked) {
                                        setDefaultCourier(courierIndex);
                                      }
                                    }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`courier-enabled-${courierIndex}`}>
                                    Enabled
                                  </Label>
                                  <Switch
                                    checked={courier.enabled}
                                    onCheckedChange={checked =>
                                      handleCourierChange(courierIndex, {
                                        enabled: checked,
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeCourier(courierIndex)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`courier-id-${courierIndex}`}>
                                  Courier ID
                                </Label>
                                <Input
                                  id={`courier-id-${courierIndex}`}
                                  value={courier.id}
                                  onChange={e =>
                                    handleCourierChange(courierIndex, {
                                      id: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`courier-name-${courierIndex}`}>
                                  Courier Name
                                </Label>
                                <Input
                                  id={`courier-name-${courierIndex}`}
                                  value={courier.name}
                                  onChange={e =>
                                    handleCourierChange(courierIndex, {
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Services</h5>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addCourierService(courierIndex)}
                              >
                                Add Service
                              </Button>
                            </div>

                            <div className="space-y-4">
                              {courier.services.map((service, serviceIndex) => (
                                <div
                                  key={`${service.id}-${serviceIndex}`}
                                  className="rounded-lg border p-4 space-y-4"
                                >
                                  <div className="flex items-center justify-between">
                                    <h6 className="font-medium">
                                      {service.name || "Service"}
                                    </h6>
                                    <div className="flex items-center gap-2">
                                      <Label
                                        htmlFor={`service-enabled-${courierIndex}-${serviceIndex}`}
                                      >
                                        Enabled
                                      </Label>
                                      <Switch
                                        checked={service.enabled !== false}
                                        onCheckedChange={checked =>
                                          updateCourierService(
                                            courierIndex,
                                            serviceIndex,
                                            { enabled: checked }
                                          )
                                        }
                                      />
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                          removeCourierService(
                                            courierIndex,
                                            serviceIndex
                                          )
                                        }
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Service ID</Label>
                                      <Input
                                        value={service.id}
                                        onChange={e =>
                                          updateCourierService(
                                            courierIndex,
                                            serviceIndex,
                                            { id: e.target.value }
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Service Name</Label>
                                      <Input
                                        value={service.name}
                                        onChange={e =>
                                          updateCourierService(
                                            courierIndex,
                                            serviceIndex,
                                            { name: e.target.value }
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Input
                                        value={service.description}
                                        onChange={e =>
                                          updateCourierService(
                                            courierIndex,
                                            serviceIndex,
                                            { description: e.target.value }
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Estimated Delivery</Label>
                                      <Input
                                        value={service.estimatedDelivery}
                                        onChange={e =>
                                          updateCourierService(
                                            courierIndex,
                                            serviceIndex,
                                            { estimatedDelivery: e.target.value }
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Method Type</Label>
                                      <Select
                                        value={service.methodType}
                                        onValueChange={value =>
                                          updateCourierService(
                                            courierIndex,
                                            serviceIndex,
                                            {
                                              methodType: value as
                                                | "home"
                                                | "easybox",
                                            }
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="home">
                                            Home delivery
                                          </SelectItem>
                                          <SelectItem value="easybox">
                                            Locker/Easybox
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Price Override (RON)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={service.priceOverride || ""}
                                        onChange={e =>
                                          updateCourierService(
                                            courierIndex,
                                            serviceIndex,
                                            { priceOverride: e.target.value }
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSave("shipping")}
                disabled={isSaving.shipping}
              >
                {isSaving.shipping ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Payments Settings */}
        <TabsContent value="payments" className="space-y-4">
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
                  <Switch defaultChecked id="credit-card-active" />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label>PayPal</Label>
                    <span className="text-sm text-muted-foreground">
                      Allow customers to pay with PayPal
                    </span>
                  </div>
                  <Switch defaultChecked id="paypal-active" />
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
                disabled={isSaving.payments}
              >
                {isSaving.payments ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* COD Settings */}
        <TabsContent value="cod" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Taxa Ramburs (COD Fee) Settings</CardTitle>
              <CardDescription>
                Configure the Cash on Delivery fee charged by the courier. This fee is added to orders when customers choose "Ramburs" payment method.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="cod-percentage">
                        COD Fee Percentage (%)
                      </Label>
                      <HelpTooltip
                        content={
                          <div className="space-y-2">
                            <p className="font-medium">COD Fee Percentage</p>
                            <p>
                              The percentage of the order total that will be charged as COD fee.
                              This is set by your courier and typically ranges from 2% to 5%.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Example:</strong> If set to 3%, and the order total is 100 lei,
                              the percentage fee will be 3 lei. Combined with the fixed fee, the total
                              COD fee would be 3 lei + fixed fee.
                            </p>
                          </div>
                        }
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Percentage of order total (e.g., 3 for 3%)
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[100px]">
                      <Input
                        id="cod-percentage"
                        value={
                          settings.codSettings?.percentage || "3"
                        }
                        onChange={e =>
                          handleCODPercentageChange(e.target.value)
                        }
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="cod-fixed-fee">
                        COD Fixed Fee (lei)
                      </Label>
                      <HelpTooltip
                        content={
                          <div className="space-y-2">
                            <p className="font-medium">COD Fixed Fee</p>
                            <p>
                              A fixed amount in lei that is added to every COD order, regardless of order value.
                              This is set by your courier and typically ranges from 3 to 10 lei.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Example:</strong> If set to 5 lei, every COD order will have
                              5 lei added as a fixed fee, plus the percentage fee. For a 100 lei order
                              with 3% percentage, the total COD fee would be 3 lei + 5 lei = 8 lei.
                            </p>
                          </div>
                        }
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Fixed amount in lei (e.g., 5.00)
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[100px]">
                      <Input
                        id="cod-fixed-fee"
                        value={
                          settings.codSettings?.fixedFee || "5.00"
                        }
                        onChange={e =>
                          handleCODFixedFeeChange(e.target.value)
                        }
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Switch
                      checked={
                        settings.codSettings?.active || false
                      }
                      onCheckedChange={handleCODActiveChange}
                      id="cod-active"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-2">COD Fee Calculation Example:</p>
                  <p className="text-sm text-muted-foreground">
                    For an order of 100 lei with {settings.codSettings?.percentage || "3"}% + {settings.codSettings?.fixedFee || "5.00"} lei:
                    <br />
                    Percentage fee: {((parseFloat(settings.codSettings?.percentage || "3") / 100) * 100).toFixed(2)} lei
                    <br />
                    Fixed fee: {settings.codSettings?.fixedFee || "5.00"} lei
                    <br />
                    <strong>Total COD fee: {(parseFloat(settings.codSettings?.percentage || "3") / 100 * 100 + parseFloat(settings.codSettings?.fixedFee || "5.00")).toFixed(2)} lei</strong>
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSave("cod")}
                disabled={isSaving.cod}
              >
                {isSaving.cod ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax / VAT Settings</CardTitle>
              <CardDescription>
                Configure tax rates and settings. Enable this when your company becomes VAT registered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Main VAT Enable Toggle */}
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tax-active" className="text-base font-semibold">
                          Enable VAT / Tax Application
                        </Label>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {settings.taxSettings?.active
                          ? "VAT is currently enabled and will be applied to orders based on the tax rate below."
                          : "VAT is currently disabled. No tax will be applied to orders. Enable this when your company becomes VAT registered."}
                      </span>
                    </div>
                    <Switch
                      checked={settings.taxSettings?.active || false}
                      onCheckedChange={handleTaxActiveChange}
                      id="tax-active"
                      className="scale-110"
                    />
                  </div>
                </div>

                <Separator />

                {/* Tax Rate Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1 flex-1">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <span className="text-sm text-muted-foreground">
                        The percentage tax rate to apply to orders when VAT is enabled. Default is 21% (Romanian VAT rate).
                      </span>
                    </div>
                    <div className="w-[120px]">
                      <Input
                        id="tax-rate"
                        value={settings.taxSettings?.rate || "21"}
                        onChange={e => handleTaxRateChange(e.target.value)}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={!settings.taxSettings?.active}
                        className={!settings.taxSettings?.active ? "opacity-50" : ""}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1 flex-1">
                      <Label htmlFor="tax-included">
                        Include Tax in Product Prices
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        If enabled, product prices will be displayed with tax included (EU compliance). If disabled, tax will be added at checkout.
                      </span>
                    </div>
                    <Switch
                      checked={settings.taxSettings?.includeInPrice || false}
                      onCheckedChange={handleTaxIncludeInPriceChange}
                      id="tax-included"
                      disabled={!settings.taxSettings?.active}
                      className={!settings.taxSettings?.active ? "opacity-50" : ""}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSave("tax")} disabled={isSaving.tax}>
                {isSaving.tax ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Business Hours Settings */}
        <TabsContent value="businessHours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Configure the operating hours of your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BusinessHoursSettings
                businessHours={
                  settings.businessHours || {
                    monday: { open: "09:00", close: "17:00", closed: false },
                    tuesday: { open: "09:00", close: "17:00", closed: false },
                    wednesday: { open: "09:00", close: "17:00", closed: false },
                    thursday: { open: "09:00", close: "17:00", closed: false },
                    friday: { open: "09:00", close: "17:00", closed: false },
                    saturday: { open: "10:00", close: "16:00", closed: false },
                    sunday: { open: "10:00", close: "16:00", closed: false },
                  }
                }
                onSave={businessHours => {
                  setSettings(prev => ({ ...prev, businessHours }));
                  handleSave("businessHours");
                }}
                isSaving={isSaving.businessHours}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Processing Settings */}
        <TabsContent value="orderProcessing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Processing</CardTitle>
              <CardDescription>
                Configure how orders are processed and fulfilled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <OrderProcessingSettings
                orderProcessing={
                  settings.orderProcessing || {
                    autoFulfillment: {
                      enabled: true,
                      threshold: 500, // 500 RON
                      excludeCategories: [],
                      requireInventoryCheck: true,
                    },
                    processingTimes: {
                      standard: 3,
                      express: 1,
                      rush: 0,
                      weekendProcessing: true,
                      holidayProcessing: false,
                    },
                    statusWorkflow: {
                      autoConfirm: true,
                      requirePaymentConfirmation: true,
                      holdForReview: {
                        enabled: true,
                        threshold: 2500, // 2500 RON
                        keywords: ["fraud", "risky", "urgent", "special"],
                      },
                    },
                    fulfillment: {
                      warehouseLocation: "Main Warehouse",
                      packagingNotes: "Pack carefully",
                      qualityCheckRequired: true,
                      signatureRequired: {
                        enabled: true,
                        threshold: 500, // 500 RON
                      },
                    },
                    notifications: {
                      orderConfirmation: true,
                      processingUpdate: true,
                      shippingNotification: true,
                      deliveryConfirmation: true,
                      adminAlerts: {
                        highValueOrders: true,
                        outOfStockItems: true,
                        failedPayments: true,
                      },
                    },
                  }
                }
                onSave={orderProcessing => {
                  setSettings(prev => ({ ...prev, orderProcessing }));
                  handleSave("orderProcessing");
                }}
                isSaving={isSaving.orderProcessing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Management Settings */}
        <TabsContent value="inventoryManagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Configure inventory management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InventoryManagementSettings
                inventoryManagement={
                  settings.inventoryManagement || {
                    stockAlerts: {
                      enabled: true,
                      lowStockThreshold: 5,
                      outOfStockAlert: true,
                      emailNotifications: true,
                      adminNotifications: true,
                      supplierNotifications: true,
                      priceChangeAlerts: true,
                    },
                    supplierStockSync: {
                      enabled: true,
                      syncFrequency: "hourly",
                      autoUpdateProductAvailability: true,
                      syncPriceChanges: true,
                      fallbackSuppliers: true,
                      stockBuffer: 2,
                    },
                    leadTimeManagement: {
                      enabled: true,
                      defaultLeadTime: 7,
                      dynamicLeadTimes: true,
                      weekendProcessing: true,
                      holidayProcessing: false,
                      expressShippingAvailable: true,
                      leadTimeBuffer: 2,
                    },
                    supplierPerformance: {
                      enabled: true,
                      trackDeliveryTimes: true,
                      trackStockAccuracy: true,
                      trackPriceStability: true,
                      performanceThreshold: 80,
                      autoDisablePoorPerformers: false,
                      performanceReportFrequency: "monthly",
                    },
                    inventoryReports: {
                      lowStockReport: true,
                      supplierPerformanceReport: true,
                      priceChangeReport: true,
                      leadTimeReport: true,
                      reportRecipients: [
                        "admin@techtots.com",
                        "manager@techtots.com",
                      ],
                    },
                    automatedInventory: {
                      enabled: true,
                      realTimeUpdates: true,
                      inventoryAPI: true,
                      webhookSupport: true,
                      autoHideOutOfStock: true,
                      stockSyncRetryAttempts: 3,
                    },
                  }
                }
                onSave={inventoryManagement => {
                  setSettings(prev => ({ ...prev, inventoryManagement }));
                  handleSave("inventoryManagement");
                }}
                isSaving={isSaving.inventoryManagement}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Settings */}
        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Settings</CardTitle>
              <CardDescription>
                Configure email marketing, social media, and promotional
                campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MarketingSettings
                marketingSettings={
                  settings.marketingSettings || {
                    emailMarketing: {
                      enabled: true,
                      provider: "sendgrid",
                      apiKey: "YOUR_SENDGRID_API_KEY",
                      fromEmail: "info@techtots.com",
                      fromName: "TechTots",
                      replyToEmail: "support@techtots.com",
                      doubleOptIn: true,
                      unsubscribeRequired: true,
                      sendEmailViaUnifiedSystem: {
                        welcome: "Welcome to TechTots!",
                        abandonedCart:
                          "Your cart is waiting for you at TechTots!",
                        orderConfirmation:
                          "Thank you for your order from TechTots!",
                        shippingUpdate: "Your order is on its way!",
                        reviewRequest:
                          "We'd love your feedback on your TechTots experience!",
                        birthday: "Happy birthday from TechTots!",
                        reEngagement: "We miss you at TechTots!",
                      },
                    },
                    socialMedia: {
                      enabled: true,
                      platforms: {
                        facebook: {
                          enabled: true,
                          pageId: "YOUR_FACEBOOK_PAGE_ID",
                          accessToken: "YOUR_FACEBOOK_ACCESS_TOKEN",
                        },
                        instagram: {
                          enabled: true,
                          accountId: "YOUR_INSTAGRAM_ACCOUNT_ID",
                          accessToken: "YOUR_INSTAGRAM_ACCESS_TOKEN",
                        },
                        twitter: {
                          enabled: true,
                          handle: "@techtots",
                          apiKey: "YOUR_TWITTER_API_KEY",
                        },
                        linkedin: {
                          enabled: true,
                          companyId: "YOUR_LINKEDIN_COMPANY_ID",
                          accessToken: "YOUR_LINKEDIN_ACCESS_TOKEN",
                        },
                        youtube: {
                          enabled: true,
                          channelId: "YOUR_YOUTUBE_CHANNEL_ID",
                          apiKey: "YOUR_YOUTUBE_API_KEY",
                        },
                        tiktok: {
                          enabled: true,
                          username: "@techtots",
                          accessToken: "YOUR_TIKTOK_ACCESS_TOKEN",
                        },
                      },
                      autoSharing: {
                        newProducts: true,
                        blogPosts: true,
                        promotions: true,
                        customerReviews: true,
                      },
                      socialProof: {
                        showReviews: true,
                        showFollowers: true,
                        showRecentActivity: true,
                      },
                    },
                    promotionalCampaigns: {
                      enabled: true,
                      campaignTypes: {
                        flashSales: {
                          enabled: true,
                          duration: 7,
                          maxDiscount: 50,
                        },
                        seasonalSales: { enabled: true, autoSchedule: true },
                        loyaltyProgram: {
                          enabled: true,
                          pointsPerDollar: 1,
                          redemptionRate: 10,
                        },
                        referralProgram: {
                          enabled: true,
                          rewardAmount: 20,
                          expiryDays: 30,
                        },
                        birthdayOffers: {
                          enabled: true,
                          discountPercent: 10,
                          validDays: 30,
                        },
                        firstTimeBuyer: {
                          enabled: true,
                          discountPercent: 15,
                          minimumOrder: 100,
                        },
                      },
                      discountRules: {
                        maxDiscountPercent: 50,
                        minimumOrderAmount: 50,
                        excludeCategories: [],
                        stackableDiscounts: true,
                        oneTimeUse: false,
                      },
                    },
                    customerSegmentation: {
                      enabled: true,
                      segments: {
                        newCustomers: { enabled: true, daysSinceFirstOrder: 7 },
                        returningCustomers: { enabled: true, minimumOrders: 5 },
                        highValueCustomers: {
                          enabled: true,
                          minimumSpend: 500,
                        },
                        inactiveCustomers: {
                          enabled: true,
                          daysSinceLastOrder: 30,
                        },
                        cartAbandoners: {
                          enabled: true,
                          abandonedThreshold: 10,
                        },
                        productCategoryLovers: {
                          enabled: true,
                          categories: ["STEM Toys", "Educational Toys"],
                        },
                      },
                      targetingRules: {
                        locationBased: true,
                        purchaseHistory: true,
                        browsingBehavior: true,
                        emailEngagement: true,
                        socialMediaActivity: true,
                      },
                    },
                    marketingAutomation: {
                      enabled: true,
                      workflows: {
                        welcomeSeries: {
                          enabled: true,
                          emails: 3,
                          interval: 7,
                        },
                        abandonedCart: {
                          enabled: true,
                          emails: 2,
                          interval: 24,
                        },
                        postPurchase: { enabled: true, emails: 1, interval: 7 },
                        reEngagement: {
                          enabled: true,
                          emails: 1,
                          interval: 30,
                        },
                        birthdayCampaign: {
                          enabled: true,
                          emails: 1,
                          interval: 365,
                        },
                        seasonalPromotions: {
                          enabled: true,
                          emails: 2,
                          interval: 90,
                        },
                      },
                      triggers: {
                        newCustomer: true,
                        cartAbandonment: true,
                        orderCompletion: true,
                        productView: true,
                        categoryView: true,
                        searchQuery: true,
                      },
                    },
                    analytics: {
                      enabled: true,
                      tracking: {
                        googleAnalytics: {
                          enabled: true,
                          trackingId: "YOUR_GA_TRACKING_ID",
                        },
                        facebookPixel: {
                          enabled: true,
                          pixelId: "YOUR_FB_PIXEL_ID",
                        },
                        googleAds: {
                          enabled: true,
                          conversionId: "YOUR_GA_CONVERSION_ID",
                        },
                        tiktokPixel: {
                          enabled: true,
                          pixelId: "YOUR_TIKTOK_PIXEL_ID",
                        },
                        customTracking: {
                          enabled: true,
                          script: "YOUR_CUSTOM_TRACKING_SCRIPT",
                        },
                      },
                      goals: {
                        revenueTarget: 100000,
                        conversionRate: 5,
                        emailOpenRate: 20,
                        clickThroughRate: 10,
                        socialEngagement: 1000,
                      },
                    },
                    contentMarketing: {
                      enabled: true,
                      blog: {
                        enabled: true,
                        autoPublish: true,
                        seoOptimization: true,
                        socialSharing: true,
                        emailNewsletter: true,
                      },
                      seo: {
                        enabled: true,
                        metaTags: true,
                        structuredData: true,
                        sitemapGeneration: true,
                        robotsTxt: true,
                      },
                      influencerMarketing: {
                        enabled: true,
                        collaborationPlatform: "InfluencerHub",
                        commissionRate: 10,
                        minimumFollowers: 1000,
                      },
                    },
                  }
                }
                onSave={marketingSettings => {
                  setSettings(prev => ({ ...prev, marketingSettings }));
                  handleSave("marketing");
                }}
                isSaving={isSaving.marketing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Backup Tab */}
        <TabsContent value="security" className="space-y-4">
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
                <Button
                  variant="outline"
                  onClick={() => setRestoreDialog(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </Button>
              </div>

              {backups && backups.length > 0 && (
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
                  onCheckedChange={value => {
                    setSettings(prev => ({
                      ...prev,
                      securitySettings: {
                        ...prev.securitySettings,
                        twoFactorEnabled: value,
                      },
                    }));
                    setHasUnsavedChanges(true);
                  }}
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
                  onValueChange={value => {
                    setSettings(prev => ({
                      ...prev,
                      securitySettings: {
                        ...prev.securitySettings,
                        sessionTimeout: value,
                      },
                    }));
                    setHasUnsavedChanges(true);
                  }}
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
                onClick={() => handleSave("security")}
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
        </TabsContent>

        {/* Analytics Dashboard */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
          <Separator />
          <ConversionDashboard
            timeRange="7d"
            autoRefresh={true}
            refreshInterval={60000}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagementSettings />
        </TabsContent>
      </Tabs>

      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Make sure to save your settings before
            leaving this page.
          </AlertDescription>
        </Alert>
      )}

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
                  {backups &&
                    backups.map(backup => (
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
