"use client";

import {
  Building2,
  Users,
  Store,
  Database,
  Mail,
  Shield,
  BarChart3,
  Package,
  Flag,
  Layers,
  Zap,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  tables: string[];
  color: string;
  bgColor: string;
  highlights: string[];
}

const features: Feature[] = [
  {
    icon: <Building2 className="w-8 h-8" />,
    title: "Multi-tenancy & Organizations",
    description:
      "Enterprise-grade multi-tenant architecture with complete data isolation",
    tables: ["Tenant", "Organization", "UserShard"],
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    highlights: [
      "Separate organizations per tenant",
      "User sharding for horizontal scaling",
      "Isolated data per tenant",
      "Custom settings per organization",
    ],
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Advanced CRM",
    description:
      "Sophisticated customer relationship management with AI-powered insights",
    tables: ["User", "SegmentationRule", "ConsentLog", "SecurityEventLog"],
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    highlights: [
      "User segmentation (NEW, VIP, AT_RISK)",
      "Lifecycle stages tracking",
      "Churn prediction scoring",
      "GDPR-compliant consent management",
    ],
  },
  {
    icon: <Store className="w-8 h-8" />,
    title: "Supplier Marketplace",
    description:
      "Complete multi-vendor marketplace system with automated workflows",
    tables: [
      "Supplier",
      "SupplierOrder",
      "SupplierInvoice",
      "SupplierPayment",
      "SupplierPerformanceMetrics",
    ],
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    highlights: [
      "Automated supplier invoicing",
      "Commission tracking",
      "Performance metrics dashboard",
      "Support ticket system",
      "Order tracking per supplier",
    ],
  },
  {
    icon: <Database className="w-8 h-8" />,
    title: "Smart Caching & Sharding",
    description: "Distributed database architecture for maximum performance",
    tables: ["UserShard", "User (cacheKey, cacheVersion)", "Product (status)"],
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    highlights: [
      "Database sharding by region",
      "Read replicas support",
      "Version-based cache invalidation",
      "Health monitoring",
      "Automatic failover",
    ],
  },
  {
    icon: <Mail className="w-8 h-8" />,
    title: "Email Automation",
    description:
      "Advanced email marketing with sequences, triggers, and analytics",
    tables: [
      "EmailSequence",
      "EmailTrigger",
      "EmailTemplate",
      "EmailCampaign",
      "EmailEvent",
    ],
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    highlights: [
      "Behavior-based triggers",
      "Multi-step email sequences",
      "A/B testing support",
      "Segment-based campaigns",
      "Real-time analytics",
    ],
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Security & Compliance",
    description: "Enterprise-grade security with full GDPR compliance",
    tables: [
      "TwoFactor",
      "SecurityEventLog",
      "ConsentLog",
      "PasswordResetToken",
    ],
    color: "text-red-600",
    bgColor: "bg-red-100",
    highlights: [
      "2FA with backup codes",
      "Security event logging",
      "Account lockout protection",
      "GDPR consent tracking",
      "Data retention policies",
    ],
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Analytics & Tracking",
    description:
      "Multi-platform analytics integration for comprehensive insights",
    tables: [
      "FacebookPixelEvent",
      "InstagramPixelConfig",
      "TikTokPixelConfig",
      "SEOAnalytics",
      "ConversionLog",
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    highlights: [
      "Facebook Pixel integration",
      "Instagram & TikTok tracking",
      "SEO performance monitoring",
      "Conversion funnel analysis",
      "Romanian market viral tracking",
    ],
  },
  {
    icon: <Package className="w-8 h-8" />,
    title: "Digital Products",
    description:
      "Complete digital product delivery with DRM and download management",
    tables: ["Book", "DigitalFile", "DigitalDownload", "Language"],
    color: "text-green-600",
    bgColor: "bg-green-100",
    highlights: [
      "Multi-language support",
      "Download limit enforcement",
      "Expiration management",
      "Multiple format support",
      "Secure token-based access",
    ],
  },
  {
    icon: <Flag className="w-8 h-8" />,
    title: "Romanian Market Ready",
    description: "Full compliance with Romanian business regulations",
    tables: ["Supplier (cui, nrRegCom)", "User (cnp, cui)", "Order (netopia*)"],
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    highlights: [
      "CUI (Tax ID) validation",
      "CNP (Personal ID) support",
      "ANPC approval tracking",
      "Netopia payment integration",
      "Romanian banking support",
    ],
  },
  {
    icon: <Layers className="w-8 h-8" />,
    title: "Product Management",
    description: "Advanced product catalog with cost tracking and analytics",
    tables: ["Product", "ProductCost", "MarketingCost", "Category", "Review"],
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    highlights: [
      "Multi-level cost tracking",
      "Marketing expense monitoring",
      "Stock reservation system",
      "Review & rating system",
      "Advanced categorization",
    ],
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Automation Workflows",
    description: "Intelligent automation for routine business processes",
    tables: ["AutomationWorkflow", "AiJob", "EmailTrigger", "Campaign"],
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    highlights: [
      "AI-powered content generation",
      "Automated email sequences",
      "Campaign automation",
      "Workflow scheduling",
      "Event-based triggers",
    ],
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "Order & Returns",
    description: "Complete order lifecycle management with returns processing",
    tables: ["Order", "OrderItem", "OrderStatusHistory", "Return"],
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    highlights: [
      "Order status tracking",
      "Return request handling",
      "Refund automation",
      "Status history audit trail",
      "Multi-item order support",
    ],
  },
];

export function FeatureHighlights() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-4xl font-bold text-gray-900">
          Advanced Platform Features
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          A comprehensive suite of enterprise-grade features designed to power
          modern e-commerce platforms with supplier marketplaces, advanced
          analytics, and intelligent automation.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="hover:shadow-xl transition-all duration-300 border-2 hover:scale-105"
          >
            <CardHeader>
              <div
                className={`w-16 h-16 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 ${feature.color}`}
              >
                {feature.icon}
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <CardDescription className="text-sm">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tables */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Related Tables
                </h4>
                <div className="flex flex-wrap gap-1">
                  {feature.tables.map((table, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                  Key Capabilities
                </h4>
                <ul className="space-y-1.5">
                  {feature.highlights.map((highlight, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${feature.bgColor}`}
                      ></span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 text-center">
        <h3 className="text-3xl font-bold mb-4">
          Everything You Need, Out of the Box
        </h3>
        <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-6">
          This platform combines the power of enterprise e-commerce, supplier
          marketplaces, advanced CRM, and intelligent automation into a single,
          cohesive system.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div>
            <div className="text-4xl font-bold">90+</div>
            <div className="text-sm text-blue-100">Database Tables</div>
          </div>
          <div>
            <div className="text-4xl font-bold">12</div>
            <div className="text-sm text-blue-100">Major Features</div>
          </div>
          <div>
            <div className="text-4xl font-bold">200+</div>
            <div className="text-sm text-blue-100">Relationships</div>
          </div>
          <div>
            <div className="text-4xl font-bold">100%</div>
            <div className="text-sm text-blue-100">Type-Safe</div>
          </div>
        </div>
      </div>
    </div>
  );
}
