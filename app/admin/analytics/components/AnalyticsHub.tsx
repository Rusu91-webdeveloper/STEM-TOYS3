"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Zap,
  Activity,
  ShoppingCart,
  DollarSign,
  PieChart,
  LineChart,
  Search,
  Facebook,
  Settings,
  CreditCard,
  Globe,
  Brain,
  Shield,
  ArrowRight,
} from "lucide-react";

interface AnalyticsSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  href: string;
  features: string[];
}

const analyticsSections: AnalyticsSection[] = [
  // Business Analytics
  {
    title: "Sales Analytics",
    description: "Revenue, orders, and business performance metrics",
    icon: ShoppingCart,
    badge: "Business",
    badgeVariant: "default",
    href: "/admin/analytics/sales",
    features: [
      "Revenue tracking",
      "Order analysis",
      "Sales trends",
      "Product performance",
    ],
  },
  {
    title: "Unit Economics",
    description: "Cost analysis and profitability insights",
    icon: DollarSign,
    badge: "Business",
    badgeVariant: "default",
    href: "/admin/analytics/unit-economics",
    features: [
      "Profit margins",
      "Cost analysis",
      "Break-even points",
      "Unit profitability",
    ],
  },
  {
    title: "Advanced Analytics",
    description: "AI-powered predictions and automated intelligence",
    icon: Brain,
    badge: "AI",
    badgeVariant: "secondary",
    href: "/admin/advanced-analytics",
    features: [
      "Trend predictions",
      "Automated alerts",
      "Business intelligence",
      "Advanced KPIs",
    ],
  },

  // User Analytics
  {
    title: "User Analytics",
    description: "Real-time user behavior and engagement metrics",
    icon: Users,
    badge: "Users",
    badgeVariant: "outline",
    href: "/admin/analytics/dashboard",
    features: [
      "User activity",
      "Session analytics",
      "Engagement metrics",
      "Real-time data",
    ],
  },
  {
    title: "User Segmentation",
    description: "Automated user classification and behavioral analysis",
    icon: Target,
    badge: "Users",
    badgeVariant: "outline",
    href: "/admin/analytics/segmentation",
    features: [
      "User segments",
      "Lifecycle stages",
      "Behavioral clustering",
      "Segmentation rules",
    ],
  },

  // Marketing Analytics
  {
    title: "Social Media Analytics",
    description: "Facebook, Instagram, and viral content tracking",
    icon: Facebook,
    badge: "Marketing",
    badgeVariant: "secondary",
    href: "/admin/analytics/facebook-pixel",
    features: [
      "Viral tracking",
      "Social engagement",
      "Content performance",
      "Platform analytics",
    ],
  },
  {
    title: "Pixel Configuration",
    description: "Manage Facebook, Instagram, and TikTok pixel settings",
    icon: Settings,
    badge: "Marketing",
    badgeVariant: "secondary",
    href: "/admin/analytics/pixel-config",
    features: [
      "Pixel setup",
      "Event tracking",
      "Conversion tracking",
      "Multi-platform config",
    ],
  },

  // Technical Analytics
  {
    title: "SEO Dashboard",
    description: "Search engine optimization and website performance",
    icon: Search,
    badge: "Technical",
    badgeVariant: "destructive",
    href: "/admin/seo-dashboard",
    features: [
      "SEO metrics",
      "Search rankings",
      "Technical audits",
      "Performance tracking",
    ],
  },
  {
    title: "Cost Management",
    description: "Product cost analysis and optimization strategies",
    icon: CreditCard,
    badge: "Technical",
    badgeVariant: "destructive",
    href: "/admin/cost-management",
    features: [
      "Cost tracking",
      "Supplier analysis",
      "Price optimization",
      "Profit margins",
    ],
  },
];

export function AnalyticsHub() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Analytics Hub</h1>
            <p className="text-xl text-muted-foreground mt-1">
              Comprehensive business intelligence and data insights
            </p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Access all your analytics tools in one centralized location. Choose
          from business metrics, user insights, marketing analytics, and
          technical performance monitoring.
        </p>
      </div>

      {/* Business Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold">Business Analytics</h2>
          <Badge variant="default">Revenue & Performance</Badge>
        </div>
        <p className="text-muted-foreground">
          Track your business performance, revenue trends, and financial
          metrics.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyticsSections
            .filter(
              section => section.badge === "Business" || section.badge === "AI"
            )
            .map(section => (
              <AnalyticsCard key={section.href} section={section} />
            ))}
        </div>
      </div>

      {/* User Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold">User Analytics</h2>
          <Badge variant="outline">Customer Insights</Badge>
        </div>
        <p className="text-muted-foreground">
          Understand your customers, their behavior, and segmentation patterns.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {analyticsSections
            .filter(section => section.badge === "Users")
            .map(section => (
              <AnalyticsCard key={section.href} section={section} />
            ))}
        </div>
      </div>

      {/* Marketing Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-2xl font-semibold">Marketing Analytics</h2>
          <Badge variant="secondary">Growth & Engagement</Badge>
        </div>
        <p className="text-muted-foreground">
          Monitor your marketing campaigns, social media performance, and
          conversion tracking.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {analyticsSections
            .filter(section => section.badge === "Marketing")
            .map(section => (
              <AnalyticsCard key={section.href} section={section} />
            ))}
        </div>
      </div>

      {/* Technical Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Shield className="h-5 w-5 text-orange-600" />
          </div>
          <h2 className="text-2xl font-semibold">Technical Analytics</h2>
          <Badge variant="destructive">Performance & SEO</Badge>
        </div>
        <p className="text-muted-foreground">
          Technical performance monitoring, SEO metrics, and cost optimization
          tools.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {analyticsSections
            .filter(section => section.badge === "Technical")
            .map(section => (
              <AnalyticsCard key={section.href} section={section} />
            ))}
        </div>
      </div>

      {/* Quick Access */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Not sure where to start? Here's our recommended analytics journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-medium">Business Overview</h3>
              <p className="text-sm text-muted-foreground">
                Start with Sales Analytics to understand your revenue
                performance
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-medium">Customer Insights</h3>
              <p className="text-sm text-muted-foreground">
                Explore User Analytics to understand customer behavior
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-medium">Advanced Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Use Advanced Analytics for AI-powered predictions and alerts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsCard({ section }: { section: AnalyticsSection }) {
  const IconComponent = section.icon;

  return (
    <Link href={section.href}>
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <Badge variant={section.badgeVariant} className="text-xs">
              {section.badge}
            </Badge>
          </div>
          <CardTitle className="text-lg">{section.title}</CardTitle>
          <CardDescription className="text-sm">
            {section.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {section.features.slice(0, 3).map((feature, index) => (
              <li
                key={index}
                className="text-sm text-muted-foreground flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                {feature}
              </li>
            ))}
            {section.features.length > 3 && (
              <li className="text-sm text-primary font-medium flex items-center gap-2">
                +{section.features.length - 3} more features
                <ArrowRight className="h-3 w-3" />
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </Link>
  );
}
