"use client";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart,
  LucideIcon,
  FileText,
  BookOpen,
  Tag,
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
    <nav
      className={cn("space-y-1", className)}
      {...props}>
      {items.map((item) => {
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
            )}>
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
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];
