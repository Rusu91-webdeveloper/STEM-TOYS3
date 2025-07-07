"use client";

import {
  Home,
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronRight,
  Heart,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

import { useTouchGestures } from "@/lib/touch-interactions";
import { cn } from "@/lib/utils";

// Mobile navigation types
interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiresAuth?: boolean;
}

interface MobileNavProps {
  isAuthenticated?: boolean;
  onSignOut?: () => void;
}

// Main navigation items for tab bar
const mainNavItems: MobileNavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    id: "search",
    label: "Search",
    href: "/products",
    icon: Search,
  },
  {
    id: "cart",
    label: "Cart",
    href: "/cart",
    icon: ShoppingBag,
    badge: 0, // This would be populated from cart context
  },
  {
    id: "account",
    label: "Account",
    href: "/account",
    icon: User,
    requiresAuth: true,
  },
];

// Extended navigation items for slide-out menu
const extendedNavItems = [
  { label: "Categories", href: "/categories", icon: Menu },
  { label: "Blog", href: "/blog", icon: Search },
  { label: "About", href: "/about", icon: Home },
  { label: "Contact", href: "/contact", icon: User },
  {
    label: "Wishlist",
    href: "/account/wishlist",
    icon: Heart,
    requiresAuth: true,
  },
  {
    label: "Settings",
    href: "/account/settings",
    icon: Settings,
    requiresAuth: true,
  },
];

// Mobile Tab Bar Navigation Component
export function MobileTabBar({
  isAuthenticated = false,
  onSignOut,
}: MobileNavProps) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  // Filter items based on authentication
  const visibleItems = mainNavItems.filter(
    item => !item.requiresAuth || isAuthenticated
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="grid grid-cols-4 h-16">
        {visibleItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center relative transition-all duration-200",
                "min-h-[44px] active:scale-95",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-gray-600 hover:text-primary active:bg-gray-100"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive ? "scale-110" : "hover:scale-105"
                  )}
                />

                {/* Badge for cart */}
                {item.id === "cart" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs mt-1 font-medium",
                  isActive ? "text-primary" : "text-inherit"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile Slide-out Menu Component
export function MobileSlideMenu({
  isOpen,
  onClose,
  isAuthenticated = false,
  onSignOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  onSignOut?: () => void;
}) {
  const pathname = usePathname();

  // Handle swipe-to-close gesture
  const menuRef = useTouchGestures({
    onSwipe: direction => {
      if (direction === "left") {
        onClose();
      }
    },
  }) as React.RefObject<HTMLDivElement>;

  // Close menu when clicking outside
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-out menu */}
      <div
        ref={menuRef}
        className={cn(
          "fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white z-50 transform transition-transform duration-300 ease-out md:hidden",
          "shadow-2xl overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-4">
          {extendedNavItems
            .filter(item => !item.requiresAuth || isAuthenticated)
            .map((item, index) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center px-6 py-4 text-base font-medium transition-colors",
                    "min-h-[56px] active:bg-gray-100",
                    isActive
                      ? "text-primary bg-primary/5 border-r-2 border-primary"
                      : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              );
            })}
        </div>

        {/* User Section */}
        {isAuthenticated && (
          <div className="border-t border-gray-200 mt-4">
            <div className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Account</p>
              <button
                onClick={() => {
                  onSignOut?.();
                  onClose();
                }}
                className="flex items-center w-full px-2 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[44px]"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Mobile Header with hamburger menu
export function MobileHeader({
  title = "TechTots",
  showBack = false,
  onBack,
  showMenu = true,
  onMenuToggle,
}: {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenuToggle?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          ) : (
            <div className="w-10" /> // Spacer
          )}
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-gray-900 truncate px-2">
          {title}
        </h1>

        {/* Right side */}
        <div className="flex items-center">
          {showMenu && (
            <button
              onClick={onMenuToggle}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// Complete Mobile Navigation Component
export function MobileNavigation({
  isAuthenticated = false,
  onSignOut,
  headerTitle,
  showBackButton = false,
  onBack,
}: {
  isAuthenticated?: boolean;
  onSignOut?: () => void;
  headerTitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader
        title={headerTitle}
        showBack={showBackButton}
        onBack={onBack}
        onMenuToggle={() => setIsMenuOpen(true)}
      />

      {/* Mobile Tab Bar */}
      <MobileTabBar isAuthenticated={isAuthenticated} onSignOut={onSignOut} />

      {/* Mobile Slide Menu */}
      <MobileSlideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        onSignOut={onSignOut}
      />
    </>
  );
}

// Pull-to-refresh component
export function MobilePullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const pullToRefreshRef = useTouchGestures({
    onPan: (deltaX, deltaY) => {
      if (deltaY > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(deltaY, 100));
      }
    },
  }) as React.RefObject<HTMLDivElement>;

  const handleRefresh = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div ref={pullToRefreshRef} className="relative">
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gray-50 transition-all duration-200"
          style={{ height: pullDistance }}
        >
          <div
            className={cn(
              "text-sm text-gray-600 transition-all duration-200",
              pullDistance > 60 ? "text-primary" : "text-gray-400"
            )}
          >
            {isRefreshing
              ? "Refreshing..."
              : pullDistance > 60
                ? "Release to refresh"
                : "Pull to refresh"}
          </div>
        </div>
      )}

      <div onTouchEnd={handleRefresh}>{children}</div>
    </div>
  );
}

export default MobileNavigation;
