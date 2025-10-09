"use client";

import Link from "next/link";
import { Plus, Upload, Download, BookOpen, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProductQuickActions() {
  const actions = [
    {
      title: "Add Product",
      description: "Create a new product listing",
      icon: Plus,
      href: "/supplier/products/new",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      isPrimary: true,
    },
    {
      title: "Bulk Upload",
      description: "Upload multiple products at once",
      icon: Upload,
      href: "/supplier/products/bulk-upload",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      badge: "AI Enhanced",
      badgeIcon: Sparkles,
    },
    {
      title: "Export Products",
      description: "Download your product list",
      icon: Download,
      href: "#",
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = "/api/supplier/products/export";
      },
    },
    {
      title: "Quick Start Guide",
      description: "Learn how to add products",
      icon: BookOpen,
      href: "/supplier/products/bulk-upload",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      badge: "New Wizard",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const BadgeIcon = action.badgeIcon;

        return (
          <Link
            key={index}
            href={action.href}
            onClick={action.onClick}
            className="block group"
          >
            <Card
              className={`h-full transition-all hover:shadow-lg hover:scale-105 ${action.isPrimary ? "border-blue-500 border-2" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-3 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-6 w-6 ${action.iconColor}`} />
                  </div>
                  {action.badge && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
