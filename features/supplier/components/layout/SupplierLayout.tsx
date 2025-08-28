"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Building2,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Supplier } from "@/features/supplier/types/supplier";

const navigation = [
  {
    name: "Dashboard",
    href: "/supplier/dashboard",
    icon: BarChart3,
    current: true,
  },
  {
    name: "Products",
    href: "/supplier/products",
    icon: Package,
    current: false,
  },
  {
    name: "Orders",
    href: "/supplier/orders",
    icon: ShoppingCart,
    current: false,
  },
  {
    name: "Invoices",
    href: "/supplier/invoices",
    icon: FileText,
    current: false,
  },
  {
    name: "Analytics",
    href: "/supplier/analytics",
    icon: BarChart3,
    current: false,
  },
  {
    name: "Settings",
    href: "/supplier/settings",
    icon: Settings,
    current: false,
  },
];

// Define public routes that don't require supplier authentication
const publicRoutes = [
  "/supplier",
  "/supplier/register",
  "/supplier/registration-success",
];

export function SupplierLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Only fetch supplier data for protected routes
    if (!isPublicRoute) {
      fetchSupplierData();
    } else {
      setLoading(false);
    }
  }, [isPublicRoute]);

  const fetchSupplierData = async () => {
    try {
      const response = await fetch("/api/supplier/auth/me");
      if (response.ok) {
        const data = await response.json();
        setSupplier(data);
      }
    } catch (error) {
      console.error("Error fetching supplier data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/supplier";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // For public routes, just render the children without authentication checks
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading supplier portal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You need to be logged in as a supplier to access this portal.
            </p>
            <Button asChild>
              <Link href="/supplier">Go to Supplier Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                Supplier Portal
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">
              Supplier Portal
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Supplier Info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {supplier.companyName}
                </p>
                <Badge
                  variant={
                    supplier.status === "APPROVED" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {supplier.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-xs">
                  3
                </Badge>
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-x-2">
                    <User className="w-5 h-5" />
                    <span className="hidden lg:block text-sm font-medium text-gray-900">
                      {supplier.contactPersonName}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/supplier/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/supplier/profile">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
