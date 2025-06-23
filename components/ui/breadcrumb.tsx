"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
  homeLabel?: string;
  maxItems?: number;
}

export function Breadcrumb({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />,
  showHome = true,
  homeLabel = "Home",
  maxItems = 5,
}: BreadcrumbProps) {
  // Add home item if requested
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: homeLabel, href: "/" }, ...items]
    : items;

  // Truncate if too many items
  const displayItems =
    allItems.length > maxItems
      ? [allItems[0], { label: "...", current: false }, ...allItems.slice(-2)]
      : allItems;

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems
      .filter(item => item.href) // Only items with links
      .map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: item.href?.startsWith("http")
          ? item.href
          : `https://techtots.com${item.href}`,
      })),
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Visual Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={cn("flex items-center space-x-1 text-sm", className)}
      >
        <ol className="flex items-center space-x-1">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const isEllipsis = item.label === "...";

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 flex-shrink-0" aria-hidden="true">
                    {separator}
                  </span>
                )}

                {isEllipsis ? (
                  <span className="text-muted-foreground">...</span>
                ) : isLast || item.current || !item.href ? (
                  <span
                    className={cn(
                      "font-medium",
                      isLast || item.current
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                    aria-current={isLast || item.current ? "page" : undefined}
                  >
                    {index === 0 && showHome ? (
                      <span className="flex items-center">
                        <Home className="h-4 w-4 mr-1" />
                        <span className="sr-only">{item.label}</span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "text-muted-foreground hover:text-foreground transition-colors",
                      "underline-offset-4 hover:underline"
                    )}
                  >
                    {index === 0 && showHome ? (
                      <span className="flex items-center">
                        <Home className="h-4 w-4 mr-1" />
                        <span className="sr-only">{item.label}</span>
                      </span>
                    ) : (
                      item.label
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

// Hook for building breadcrumb items from pathname
export function useBreadcrumbs() {
  const buildBreadcrumbs = (
    pathname: string,
    customItems?: BreadcrumbItem[]
  ): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Build breadcrumbs from URL segments
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Capitalize and clean up segment names
      const label = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase());

      items.push({
        label,
        href: isLast ? undefined : currentPath,
        current: isLast,
      });
    });

    return items;
  };

  return { buildBreadcrumbs };
}

// Component variants
export const BreadcrumbVariants = {
  default: (props: Omit<BreadcrumbProps, "separator">) => (
    <Breadcrumb {...props} />
  ),

  arrow: (props: Omit<BreadcrumbProps, "separator">) => (
    <Breadcrumb
      {...props}
      separator={<span className="text-muted-foreground">→</span>}
    />
  ),

  slash: (props: Omit<BreadcrumbProps, "separator">) => (
    <Breadcrumb
      {...props}
      separator={<span className="text-muted-foreground">/</span>}
    />
  ),

  minimal: (props: Omit<BreadcrumbProps, "showHome" | "separator">) => (
    <Breadcrumb
      {...props}
      showHome={false}
      separator={<span className="text-muted-foreground px-1">·</span>}
    />
  ),
};
