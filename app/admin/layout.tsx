"use client";

import { LogOut, Menu, X, Settings, User, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";

import SidebarNav, { adminNavItems } from "./components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is authenticated and has admin role
  const isAuthenticated = status === "authenticated";
  const isAdmin = isAuthenticated && session?.user?.role === "ADMIN";

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
  const userName = session.user.name || session.user.email;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Admin Header - Enhanced with better styling */}
      <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-20 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Logo and Title */}
            <Link href="/admin" className="flex items-center group">
              <div className="relative h-10 w-20 mr-3">
                <Image
                  className="object-contain"
                  src="/TechTots_LOGO.png"
                  alt="TechTots Logo"
                  fill
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </span>
                <span className="text-xs text-gray-500">
                  TechTots Management
                </span>
              </div>
            </Link>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center gap-4">
            {/* Back to main site */}
            <Link
              href="/"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Back to Site</span>
            </Link>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {userName}
                </span>
                <span className="text-xs text-gray-500">Administrator</span>
              </div>
            </div>

            {/* Sign out button */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="flex pt-20">
        {/* Sidebar - Enhanced with responsive design */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar content */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Sidebar header for mobile */}
            <div className="lg:hidden p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Admin Menu
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              <SidebarNav items={adminNavItems} />
            </div>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                TechTots Admin Panel
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Enhanced with better spacing and responsive design */}
        <main className="flex-1 lg:ml-0 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
