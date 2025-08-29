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
  MessageSquare,
  HelpCircle,
  Sparkles,
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
    name: "Messages",
    href: "/supplier/messages",
    icon: MessageSquare,
    current: false,
  },
  {
    name: "Support",
    href: "/supplier/support",
    icon: HelpCircle,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-blue-400 animate-ping"></div>
            </div>
            <p className="text-gray-600 font-medium">
              Loading supplier portal...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Preparing your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              You need to be logged in as a supplier to access this portal.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href="/supplier">Go to Supplier Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 flex w-80 flex-col bg-white shadow-2xl transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold text-gray-900">
                Supplier Portal
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Supplier Info */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {supplier.companyName}
                </p>
                <Badge
                  variant={
                    supplier.status === "APPROVED" ? "default" : "secondary"
                  }
                  className={`text-xs ${
                    supplier.status === "APPROVED"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }`}
                >
                  {supplier.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-sm border-r border-gray-200/50 shadow-xl">
          <div className="flex h-16 items-center px-6 border-b border-gray-100">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-bold text-gray-900">
              Supplier Portal
            </span>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Supplier Info */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {supplier.companyName}
                </p>
                <Badge
                  variant={
                    supplier.status === "APPROVED" ? "default" : "secondary"
                  }
                  className={`text-xs ${
                    supplier.status === "APPROVED"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }`}
                >
                  {supplier.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-gray-100 rounded-full"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-gray-100 rounded-full"
              >
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs bg-red-500 border-2 border-white">
                  3
                </Badge>
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-x-2 hover:bg-gray-100 rounded-full"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-gray-900">
                      {supplier.contactPersonName}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white/95 backdrop-blur-sm border-gray-200/50 shadow-xl"
                >
                  <DropdownMenuItem asChild className="hover:bg-gray-50">
                    <Link href="/supplier/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-gray-50">
                    <Link href="/supplier/profile">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-red-50 text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
