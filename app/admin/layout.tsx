"use client";

import { Home, LogOut, Menu, Package, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useOptimizedSession } from "@/lib/auth/SessionContext";

import AdminOrderNotificationsBell from "./components/admin-order-notifications-bell";
import SidebarNav, { adminNavItems } from "./components/sidebar-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useOptimizedSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Check if user is authenticated and has admin or visitor role
  const isAuthenticated = status === "authenticated";
  const isAdmin =
    isAuthenticated &&
    (session?.user?.role === "ADMIN" || session?.user?.role === "VISITOR");

  // Handle unauthorized access
  useEffect(() => {
    if (status === "loading") return;

    if (!isAuthenticated || !isAdmin) {
      router.replace("/auth/login?callbackUrl=/admin");
    }
  }, [isAuthenticated, isAdmin, router, status]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  // User name to display in the header
  const userName = session.user.name ?? session.user.email;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Admin Header - Enhanced with better styling */}
      <header className="fixed top-0 z-30 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-4">
          {/* Left side - Logo and Menu */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close admin menu" : "Open admin menu"}
              className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Logo and Title */}
            <Link href="/admin" className="group flex min-w-0 items-center">
              <div className="relative mr-2 h-8 w-16 shrink-0 sm:mr-3 sm:h-10 sm:w-20">
                <Image
                  className="object-contain"
                  src="/TechTots_LOGO.png"
                  alt="TechTots Logo"
                  fill
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-base font-bold text-transparent sm:text-xl">
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Admin</span>
                </span>
                <span className="hidden truncate text-xs text-gray-500 sm:block">
                  TechTots Management
                </span>
              </div>
            </Link>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-4">
            <AdminOrderNotificationsBell />

            {/* Back to main site */}
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 md:flex"
            >
              <Home className="h-4 w-4" />
              <span>Back to Site</span>
            </Link>

            {/* User info */}
            <div className="hidden items-center gap-3 rounded-md bg-gray-50 px-3 py-2 xl:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {userName}
                </span>
                <span className="text-xs text-gray-500">
                  {session?.user?.role === "VISITOR"
                    ? "Visitor"
                    : "Administrator"}
                </span>
              </div>
            </div>

            {/* Sign out button */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 sm:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="flex pt-[64px] sm:pt-[72px]">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Enhanced with responsive design */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-20 w-[85vw] max-w-[320px] border-r border-gray-200 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Sidebar content */}
          <div className="flex h-full flex-col pt-[64px] sm:pt-[72px] lg:pt-0">
            {/* Sidebar header for mobile */}
            <div className="border-b border-gray-200 p-4 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold text-gray-900">
                  Admin Menu
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close admin menu"
                  className="rounded-md p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <Home className="h-4 w-4" />
                  Back to Site
                </Link>
                <Link
                  href="/admin/products"
                  className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                  <Package className="h-4 w-4" />
                  Products
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <SidebarNav items={adminNavItems} />
            </div>

            {/* Sidebar footer */}
            <div className="border-t border-gray-200 p-4">
              <div className="text-xs text-gray-500 text-center">
                TechTots Admin Panel
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Enhanced with better spacing and responsive design */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
