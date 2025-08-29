"use client";

import { usePathname } from "next/navigation";
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
    "/supplier/requirements",
    "/supplier/registration-success"
  ];
  
  // Check if current page is public
  const isPublicPage = publicPages.includes(pathname);
  
  // For public pages, render without authentication
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }
  
  // For authenticated pages, use the SupplierLayout
  return <SupplierLayout>{children}</SupplierLayout>;
}
