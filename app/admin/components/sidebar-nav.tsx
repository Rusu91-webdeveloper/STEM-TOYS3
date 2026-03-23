"use client";

import {
  LayoutDashboard,
  Package,
  Star,
  ShoppingCart,
  Users,
  Settings,
  BarChart,
  LucideIcon,
  FileText,
  BookOpen,
  Tag,
  Mail,
  Building2,
  MessageSquare,
  Image,
  TrendingUp,
  Search,
  Share2,
  Calendar,
  TestTube,
  Receipt,
  Calculator,
  Target,
  Truck,
  Cog,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: LucideIcon;
  }[];
}

export default function SidebarNav({
  className,
  items,
  ...props
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-1", className)} {...props}>
      {items.map(item => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Featured Products",
    href: "/admin/featured-products",
    icon: Star,
  },
  {
    title: "Books",
    href: "/admin/books",
    icon: BookOpen,
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: FileText,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "My Ops Queue",
    href: "/admin/ops-queue",
    icon: Cog,
  },
  {
    title: "Order Management",
    href: "/admin/order-management",
    icon: Truck,
  },
  {
    title: "Fulfillment Issues",
    href: "/admin/fulfillment-issues",
    icon: AlertCircle,
  },
  {
    title: "Returns",
    href: "/admin/returns",
    icon: FileText,
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    icon: Tag,
  },
  {
    title: "Suppliers",
    href: "/admin/suppliers",
    icon: Building2,
  },
  {
    title: "Supplier Invoices",
    href: "/admin/supplier-invoices",
    icon: Receipt,
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: Mail,
  },
  {
    title: "Communication Hub",
    href: "/admin/communication",
    icon: MessageSquare,
  },
  {
    title: "Support Tickets",
    href: "/admin/tickets",
    icon: MessageSquare,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart,
  },
  {
    title: "User Analytics Dashboard",
    href: "/admin/analytics/dashboard",
    icon: Users,
  },
  {
    title: "Advanced Analytics",
    href: "/admin/advanced-analytics",
    icon: TrendingUp,
  },
  {
    title: "Unit Economics",
    href: "/admin/analytics/unit-economics",
    icon: Calculator,
  },
  {
    title: "Pixel Config",
    href: "/admin/analytics/pixel-config",
    icon: TestTube,
  },
  {
    title: "Cost Management",
    href: "/admin/cost-management",
    icon: Target,
  },
  {
    title: "SEO Dashboard",
    href: "/admin/seo-dashboard",
    icon: BarChart,
  },
  {
    title: "Google Search Console",
    href: "/admin/seo/google-search-console",
    icon: Search,
  },
  {
    title: "Facebook Pixel Analytics",
    href: "/admin/analytics/facebook-pixel",
    icon: Share2,
  },
  {
    title: "Competitor Analysis",
    href: "/admin/competitor-analysis",
    icon: TrendingUp,
  },
  {
    title: "A/B Testing",
    href: "/admin/ab-testing",
    icon: TestTube,
  },
  {
    title: "Content Calendar",
    href: "/admin/content-calendar",
    icon: Calendar,
  },
  {
    title: "Email Templates",
    href: "/admin/email-templates",
    icon: Mail,
  },
  {
    title: "Email Sequences",
    href: "/admin/email-sequences",
    icon: Mail,
  },
  {
    title: "Email Automation",
    href: "/admin/email-automation",
    icon: Mail,
  },
  {
    title: "Payment Rollout",
    href: "/admin/payment-rollout",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Images",
    href: "/admin/images",
    icon: Image,
  },
];
