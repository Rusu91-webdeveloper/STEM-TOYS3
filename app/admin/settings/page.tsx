"use client";

import React, { useState, useEffect } from "react";

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
import BusinessHoursSettings from "@/components/admin/BusinessHoursSettings";
import CustomerServiceSettings from "@/components/admin/CustomerServiceSettings";
import OrderProcessingSettings from "@/components/admin/OrderProcessingSettings";
import InventoryManagementSettings from "@/components/admin/InventoryManagementSettings";
import MarketingSettings from "@/components/admin/MarketingSettings";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import ConversionDashboard from "@/components/conversion-tracking/ConversionDashboard";

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
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  } | null;
  customerService: {
    supportEmail: string;
    supportPhone: string;
    liveChatEnabled: boolean;
    liveChatHours: string;
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
      reorderPointAlert: boolean;
      emailNotifications: boolean;
      adminNotifications: boolean;
      supplierNotifications: boolean;
    };
    reorderManagement: {
      enabled: boolean;
      reorderPoint: number;
      reorderQuantity: number;
      autoReorder: boolean;
      requireApproval: boolean;
      supplierEmail: string;
      reorderFrequency: "daily" | "weekly" | "monthly";
    };
    inventoryTracking: {
      enabled: boolean;
      trackExpiryDates: boolean;
      trackBatchNumbers: boolean;
      trackSerialNumbers: boolean;
      barcodeScanning: boolean;
      qrCodeSupport: boolean;
      locationTracking: boolean;
      warehouseZones: string[];
    };
    stockAdjustments: {
      allowNegativeStock: boolean;
      backorderEnabled: boolean;
      reserveStockForOrders: boolean;
      reserveThreshold: number;
      autoAdjustStock: boolean;
      adjustmentReasonRequired: boolean;
    };
    inventoryReports: {
      dailyStockReport: boolean;
      weeklyInventoryReport: boolean;
      monthlyValueReport: boolean;
      lowStockReport: boolean;
      slowMovingItemsReport: boolean;
      expiryDateReport: boolean;
      reportRecipients: string[];
    };
    supplierManagement: {
      enabled: boolean;
      supplierDirectory: boolean;
      supplierPerformance: boolean;
      leadTimeTracking: boolean;
      costTracking: boolean;
      supplierNotifications: boolean;
    };
    automatedInventory: {
      enabled: boolean;
      autoUpdateStock: boolean;
      syncWithPOS: boolean;
      syncWithEcommerce: boolean;
      realTimeUpdates: boolean;
      inventoryAPI: boolean;
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
      emailTemplates: {
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
  customerService: {
    supportEmail: "support@techtots.com",
    supportPhone: "+1 (555) 234-5678",
    liveChatEnabled: true,
    liveChatHours: "24/7",
  },
  orderProcessing: {
    autoFulfillment: {
      enabled: true,
      threshold: 100,
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
        threshold: 500,
        keywords: ["fraud", "risky"],
      },
    },
    fulfillment: {
      warehouseLocation: "Main Warehouse",
      packagingNotes: "Pack carefully",
      qualityCheckRequired: true,
      signatureRequired: {
        enabled: true,
        threshold: 100,
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
      lowStockThreshold: 10,
      outOfStockAlert: true,
      reorderPointAlert: true,
      emailNotifications: true,
      adminNotifications: true,
      supplierNotifications: true,
    },
    reorderManagement: {
      enabled: true,
      reorderPoint: 50,
      reorderQuantity: 100,
      autoReorder: true,
      requireApproval: false,
      supplierEmail: "suppliers@techtots.com",
      reorderFrequency: "daily",
    },
    inventoryTracking: {
      enabled: true,
      trackExpiryDates: true,
      trackBatchNumbers: true,
      trackSerialNumbers: true,
      barcodeScanning: true,
      qrCodeSupport: true,
      locationTracking: true,
      warehouseZones: ["Zone A", "Zone B", "Zone C"],
    },
    stockAdjustments: {
      allowNegativeStock: false,
      backorderEnabled: true,
      reserveStockForOrders: true,
      reserveThreshold: 50,
      autoAdjustStock: true,
      adjustmentReasonRequired: true,
    },
    inventoryReports: {
      dailyStockReport: true,
      weeklyInventoryReport: true,
      monthlyValueReport: true,
      lowStockReport: true,
      slowMovingItemsReport: true,
      expiryDateReport: true,
      reportRecipients: ["admin@techtots.com", "finance@techtots.com"],
    },
    supplierManagement: {
      enabled: true,
      supplierDirectory: true,
      supplierPerformance: true,
      leadTimeTracking: true,
      costTracking: true,
      supplierNotifications: true,
    },
    automatedInventory: {
      enabled: true,
      autoUpdateStock: true,
      syncWithPOS: true,
      syncWithEcommerce: true,
      realTimeUpdates: true,
      inventoryAPI: true,
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
      emailTemplates: {
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
  const [isSaving, setIsSaving] = useState({
    general: false,
    regional: false,
    seo: false,
    shipping: false,
    payments: false,
    tax: false,
    businessHours: false,
    customerService: false,
    orderProcessing: false,
    inventoryManagement: false,
    marketing: false,
    analytics: false,
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

        // Only set defaults for missing fields, don't override existing data
        const mergedData = {
          ...defaultSettings,
          ...data,
          // Only set shippingSettings defaults if it's completely missing
          shippingSettings:
            data.shippingSettings || defaultSettings.shippingSettings,
          // Only set taxSettings defaults if it's completely missing
          taxSettings: data.taxSettings || defaultSettings.taxSettings,
          // Only set businessHours defaults if it's completely missing
          businessHours: data.businessHours || defaultSettings.businessHours,
          // Only set customerService defaults if it's completely missing
          customerService:
            data.customerService || defaultSettings.customerService,
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
        case "customerService":
          sectionData = {
            customerService: settings.customerService,
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
  };

  // Handle select change
  const handleSelectChange = (id: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle shipping input change
  const handleShippingPriceChange = (
    id: "standard" | "express" | "freeThreshold",
    value: string
  ) => {
    setSettings(prev => {
      // Initialize shippingSettings if it doesn't exist
      const currentSettings = prev.shippingSettings || {
        standard: { price: "5.99", active: true },
        express: { price: "12.99", active: true },
        freeThreshold: { price: "250.00", active: true },
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
    setSettings(prev => {
      // Initialize shippingSettings if it doesn't exist
      const currentSettings = prev.shippingSettings || {
        standard: { price: "5.99", active: true },
        express: { price: "12.99", active: true },
        freeThreshold: { price: "250.00", active: true },
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
                    : "250.00",
            }),
            active: checked,
          },
        },
      };
    });
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

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="businessHours">Business Hours</TabsTrigger>
          <TabsTrigger value="customerService">Customer Service</TabsTrigger>
          <TabsTrigger value="orderProcessing">Order Processing</TabsTrigger>
          <TabsTrigger value="inventoryManagement">
            Inventory Management
          </TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

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
                  <Label htmlFor="currency">Currency</Label>
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
                  <Label htmlFor="timezone">Timezone</Label>
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
                  <Label htmlFor="dateFormat">Date Format</Label>
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
                  <Label htmlFor="weightUnit">Weight Unit</Label>
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
                        onChange={e =>
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
                      onCheckedChange={checked =>
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
                        onChange={e =>
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
                      onCheckedChange={checked =>
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

        {/* Tax Settings */}
        <TabsContent value="tax" className="space-y-4">
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
                        value={settings.taxSettings?.rate || "21"}
                        onChange={e => handleTaxRateChange(e.target.value)}
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

        {/* Customer Service Settings */}
        <TabsContent value="customerService" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Service</CardTitle>
              <CardDescription>
                Configure customer support and live chat settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CustomerServiceSettings
                customerService={
                  settings.customerService || {
                    supportEmail: "support@techtots.com",
                    supportPhone: "+1 (555) 234-5678",
                    liveChatEnabled: true,
                    liveChatHours: "24/7",
                  }
                }
                onSave={customerService => {
                  setSettings(prev => ({ ...prev, customerService }));
                  handleSave("customerService");
                }}
                isSaving={isSaving.customerService}
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
                      threshold: 100,
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
                        threshold: 500,
                        keywords: ["fraud", "risky"],
                      },
                    },
                    fulfillment: {
                      warehouseLocation: "Main Warehouse",
                      packagingNotes: "Pack carefully",
                      qualityCheckRequired: true,
                      signatureRequired: {
                        enabled: true,
                        threshold: 100,
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
                      lowStockThreshold: 10,
                      outOfStockAlert: true,
                      reorderPointAlert: true,
                      emailNotifications: true,
                      adminNotifications: true,
                      supplierNotifications: true,
                    },
                    reorderManagement: {
                      enabled: true,
                      reorderPoint: 50,
                      reorderQuantity: 100,
                      autoReorder: true,
                      requireApproval: false,
                      supplierEmail: "suppliers@techtots.com",
                      reorderFrequency: "daily",
                    },
                    inventoryTracking: {
                      enabled: true,
                      trackExpiryDates: true,
                      trackBatchNumbers: true,
                      trackSerialNumbers: true,
                      barcodeScanning: true,
                      qrCodeSupport: true,
                      locationTracking: true,
                      warehouseZones: ["Zone A", "Zone B", "Zone C"],
                    },
                    stockAdjustments: {
                      allowNegativeStock: false,
                      backorderEnabled: true,
                      reserveStockForOrders: true,
                      reserveThreshold: 50,
                      autoAdjustStock: true,
                      adjustmentReasonRequired: true,
                    },
                    inventoryReports: {
                      dailyStockReport: true,
                      weeklyInventoryReport: true,
                      monthlyValueReport: true,
                      lowStockReport: true,
                      slowMovingItemsReport: true,
                      expiryDateReport: true,
                      reportRecipients: [
                        "admin@techtots.com",
                        "finance@techtots.com",
                      ],
                    },
                    supplierManagement: {
                      enabled: true,
                      supplierDirectory: true,
                      supplierPerformance: true,
                      leadTimeTracking: true,
                      costTracking: true,
                      supplierNotifications: true,
                    },
                    automatedInventory: {
                      enabled: true,
                      autoUpdateStock: true,
                      syncWithPOS: true,
                      syncWithEcommerce: true,
                      realTimeUpdates: true,
                      inventoryAPI: true,
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
                      emailTemplates: {
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

        {/* Analytics Dashboard */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive insights into your e-commerce performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnalyticsDashboard />
              <Separator />
              <ConversionDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
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

        <TabsContent value="users" className="space-y-4">
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
