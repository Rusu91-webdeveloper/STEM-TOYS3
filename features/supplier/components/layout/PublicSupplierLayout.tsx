"use client";

import { usePathname } from "next/navigation";

import { SupplierMarketingShell } from "@/components/supplier/SupplierMarketingShell";

import { SupplierLayout } from "./SupplierLayout";

interface PublicSupplierLayoutProps {
  children: React.ReactNode;
}

export function PublicSupplierLayout({ children }: PublicSupplierLayoutProps) {
  const pathname = usePathname();

  // List of public pages that don't require authentication
  const publicPages = [
    "/supplier",
    "/supplier/apply",
    "/supplier/benefits",
    "/supplier/register",
    "/supplier/registration-success",
    "/supplier/requirements",
  ];

  // Check if current page is public
  const isPublicPage = publicPages.includes(pathname);

  if (isPublicPage) {
    return <SupplierMarketingShell>{children}</SupplierMarketingShell>;
  }

  // For authenticated pages, use the SupplierLayout
  return <SupplierLayout>{children}</SupplierLayout>;
}
