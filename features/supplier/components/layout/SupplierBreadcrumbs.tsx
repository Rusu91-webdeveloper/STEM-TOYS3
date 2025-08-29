"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Home,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  MessageSquare,
  HelpCircle,
  Settings,
  DollarSign,
} from "lucide-react";

interface BreadcrumbItem {
  name: string;
  href: string;
  icon?: any;
}

export function SupplierBreadcrumbs() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: "Dashboard", href: "/supplier/dashboard", icon: Home },
    ];

    if (segments.length < 2) return breadcrumbs;

    // Map segments to readable names and icons
    const segmentMap: Record<string, { name: string; icon: any }> = {
      products: { name: "Products", icon: Package },
      orders: { name: "Orders", icon: ShoppingCart },
      invoices: { name: "Invoices", icon: FileText },
      analytics: { name: "Analytics", icon: BarChart3 },
      revenue: { name: "Revenue", icon: DollarSign },
      messages: { name: "Messages", icon: MessageSquare },
      support: { name: "Support", icon: HelpCircle },
      settings: { name: "Settings", icon: Settings },
      new: { name: "Add New", icon: null },
      "bulk-upload": { name: "Bulk Upload", icon: null },
    };

    let currentPath = "/supplier";

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      if (segmentMap[segment]) {
        breadcrumbs.push({
          name: segmentMap[segment].name,
          href: currentPath,
          icon: segmentMap[segment].icon,
        });
      } else if (segment !== "supplier") {
        // Handle dynamic segments (like IDs)
        breadcrumbs.push({
          name: segment.charAt(0).toUpperCase() + segment.slice(1),
          href: currentPath,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={`${breadcrumb.href}-${index}`} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
            )}

            {isLast ? (
              <span className="flex items-center text-gray-900 font-medium">
                {breadcrumb.icon && (
                  <breadcrumb.icon className="w-4 h-4 mr-2" />
                )}
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="flex items-center hover:text-gray-700 hover:underline transition-colors"
              >
                {breadcrumb.icon && (
                  <breadcrumb.icon className="w-4 h-4 mr-2" />
                )}
                {breadcrumb.name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
