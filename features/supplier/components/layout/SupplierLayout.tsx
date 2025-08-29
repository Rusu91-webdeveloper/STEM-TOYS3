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
  Plus,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Award,
  Globe,
  Zap,
  Home,
  ExternalLink,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { type Supplier } from "@/features/supplier/types/supplier";
import { SupplierBreadcrumbs } from "./SupplierBreadcrumbs";

// Enhanced navigation with categories and quick actions
const navigation = [
  {
    category: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/supplier/dashboard",
        icon: Home,
        description: "Overview of your business",
        badge: null,
      },
    ],
  },
  {
    category: "Business Management",
    items: [
      {
        name: "Products",
        href: "/supplier/products",
        icon: Package,
        description: "Manage your product catalog",
        badge: null,
        quickActions: [
          { name: "Add Product", href: "/supplier/products/new", icon: Plus },
          {
            name: "Bulk Upload",
            href: "/supplier/products/bulk-upload",
            icon: Upload,
          },
        ],
      },
      {
        name: "Orders",
        href: "/supplier/orders",
        icon: ShoppingCart,
        description: "Track and manage orders",
        badge: null,
      },
      {
        name: "Invoices",
        href: "/supplier/invoices",
        icon: FileText,
        description: "View and manage invoices",
        badge: null,
      },
    ],
  },
  {
    category: "Analytics & Insights",
    items: [
      {
        name: "Analytics",
        href: "/supplier/analytics",
        icon: BarChart3,
        description: "Business performance insights",
        badge: null,
      },
      {
        name: "Revenue",
        href: "/supplier/revenue",
        icon: DollarSign,
        description: "Track your earnings",
        badge: null,
      },
    ],
  },
  {
    category: "Communication",
    items: [
      {
        name: "Messages",
        href: "/supplier/messages",
        icon: MessageSquare,
        description: "Communicate with TechTots",
        badge: null,
      },
      {
        name: "Support",
        href: "/supplier/support",
        icon: HelpCircle,
        description: "Get help and support",
        badge: null,
      },
    ],
  },
  {
    category: "Account",
    items: [
      {
        name: "Settings",
        href: "/supplier/settings",
        icon: Settings,
        description: "Manage your account",
        badge: null,
      },
    ],
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
  const [notifications, setNotifications] = useState<{
    unreadMessages: number;
    pendingOrders: number;
    overdueInvoices: number;
    newAnnouncements: number;
  }>({
    unreadMessages: 0,
    pendingOrders: 0,
    overdueInvoices: 0,
    newAnnouncements: 0,
  });
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Only fetch supplier data for protected routes
    if (!isPublicRoute) {
      fetchSupplierData();
      fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      // Fetch various notification counts
      const [statsRes, messagesRes] = await Promise.all([
        fetch("/api/supplier/stats"),
        fetch("/api/supplier/messages?unread=true"),
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setNotifications(prev => ({
          ...prev,
          pendingOrders: stats.pendingOrders || 0,
        }));
      }

      if (messagesRes.ok) {
        const messages = await messagesRes.json();
        setNotifications(prev => ({
          ...prev,
          unreadMessages: messages.length || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "SUSPENDED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return CheckCircle;
      case "PENDING":
        return Clock;
      case "REJECTED":
        return AlertCircle;
      case "SUSPENDED":
        return AlertCircle;
      default:
        return Clock;
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
          {/* Mobile Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            {navigation.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className={`px-4 mb-6 ${categoryIndex === 0 ? "mt-4" : ""}`}
              >
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map(item => {
                    const isActive = pathname === item.href;
                    const StatusIcon = getStatusIcon(supplier.status);

                    return (
                      <div key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span>{item.name}</span>
                              {item.badge && (
                                <Badge className="ml-2 text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p
                              className={`text-xs mt-0.5 ${
                                isActive ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {item.description}
                            </p>
                          </div>
                        </Link>

                        {/* Quick Actions */}
                        {item.quickActions && isActive && (
                          <div className="ml-8 mt-2 space-y-1">
                            {item.quickActions.map(action => (
                              <Link
                                key={action.name}
                                href={action.href}
                                className="flex items-center px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                                onClick={() => setSidebarOpen(false)}
                              >
                                <action.icon className="w-3 h-3 mr-2" />
                                {action.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

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
          {/* Desktop Navigation */}
          <div className="flex-1 overflow-y-auto py-6">
            {navigation.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className={`px-6 mb-8 ${categoryIndex === 0 ? "mt-4" : ""}`}
              >
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map(item => {
                    const isActive = pathname === item.href;
                    const StatusIcon = getStatusIcon(supplier.status);

                    return (
                      <div key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <item.icon
                            className={`mr-3 h-5 w-5 ${
                              isActive
                                ? "text-white"
                                : "text-gray-500 group-hover:text-gray-700"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span>{item.name}</span>
                              {item.badge && (
                                <Badge className="ml-2 text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p
                              className={`text-xs mt-0.5 ${
                                isActive ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {item.description}
                            </p>
                          </div>
                        </Link>

                        {/* Quick Actions */}
                        {item.quickActions && isActive && (
                          <div className="ml-8 mt-2 space-y-1">
                            {item.quickActions.map(action => (
                              <Link
                                key={action.name}
                                href={action.href}
                                className="flex items-center px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                              >
                                <action.icon className="w-3 h-3 mr-2" />
                                {action.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

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
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`text-xs ${getStatusColor(supplier.status)}`}
                  >
                    {(() => {
                      const StatusIcon = getStatusIcon(supplier.status);
                      return <StatusIcon className="w-3 h-3 mr-1" />;
                    })()}
                    {supplier.status}
                  </Badge>
                </div>
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
              {/* Quick Actions */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hover:bg-green-50 text-green-700"
                >
                  <Link href="/supplier/products/new">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Product
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hover:bg-blue-50 text-blue-700"
                >
                  <Link href="/supplier/orders">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Orders
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hover:bg-purple-50 text-purple-700"
                >
                  <Link href="/supplier/analytics">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Link>
                </Button>
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-gray-100 rounded-full"
              >
                <Bell className="w-5 h-5" />
                {(notifications.unreadMessages > 0 ||
                  notifications.pendingOrders > 0) && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs bg-red-500 border-2 border-white">
                    {notifications.unreadMessages + notifications.pendingOrders}
                  </Badge>
                )}
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
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {supplier.companyName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {supplier.contactPersonEmail}
                    </p>
                  </div>
                  <DropdownMenuItem asChild className="hover:bg-gray-50">
                    <Link href="/supplier/dashboard">
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-gray-50">
                    <Link href="/supplier/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
            <SupplierBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
