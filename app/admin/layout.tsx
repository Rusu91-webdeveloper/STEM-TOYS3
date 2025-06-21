"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import SidebarNav, { adminNavItems } from "./components/sidebar-nav";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

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
      <div className="min-h-screen flex items-center justify-center">
        Loading admin dashboard...
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
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 w-full z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center">
            <div className="relative h-10 w-20 mr-2">
              <Image
                className="object-contain"
                src="/TechTots_LOGO.png"
                alt="TechTots Logo"
                fill
              />
            </div>
            <span className="text-xl font-bold text-primary">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userName}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-primary flex items-center gap-1 cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 fixed h-full bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <SidebarNav items={adminNavItems} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-6">{children}</main>
      </div>
    </div>
  );
}
