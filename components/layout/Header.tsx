"use client";

import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Heart,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "@/components/ui/currency-switcher";
import { CartButton } from "@/features/cart";
import { useCart } from "@/features/cart/context/CartContext";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useTranslation, TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navigation: { name: TranslationKey; href: string }[] = [
  { name: "home", href: "/" },
  { name: "products", href: "/products" },
  { name: "categories", href: "/categories" },
  { name: "blog", href: "/blog" },
  { name: "about", href: "/about" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: session, status } = useOptimizedSession();
  const { cartCount, setIsCartOpen } = useCart();

  // FIXED: Simplified and consistent authentication state logic
  const isAuthenticated =
    status === "authenticated" && !!session?.user && !session.user.error;
  const isAdmin = isAuthenticated && session?.user?.role === "ADMIN";
  const isLoading = status === "loading";

  // FIXED: Only show authenticated UI if truly authenticated
  const shouldShowAuthenticatedUI = isAuthenticated && !isLoading;

  // Fetch wishlist count for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlistCount();
    }
  }, [isAuthenticated]);

  const fetchWishlistCount = async () => {
    try {
      const response = await fetch("/api/account/wishlist");
      if (response.ok) {
        const wishlistItems = await response.json();
        setWishlistCount(wishlistItems.length);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      window.location.href = "/account/wishlist";
    } else {
      window.location.href = "/auth/login";
    }
  };

  return (
    <header className="bg-white sticky top-0 z-40 w-full border-b shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <div className="flex h-14 sm:h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="relative h-10 w-32 sm:h-12 sm:w-36 md:h-16 md:w-40">
                <Image
                  className="object-contain"
                  src="/TechTots_LOGO.png"
                  alt="TechTots Logo"
                  priority
                  fill
                  sizes="(max-width: 640px) 8rem, (max-width: 768px) 9rem, 10rem"
                />
              </div>
            </Link>
          </div>

          {/* Navigation - Left Side (Categories) */}
          <div className="hidden md:flex md:items-center md:space-x-2 flex-1 max-w-xl mx-6 lg:mx-12">
            {navigation.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative group px-3 py-1.5 lg:px-4 lg:py-2 mx-0.5 lg:mx-1 text-xs lg:text-sm font-medium transition-all duration-200 rounded-md cursor-pointer",
                  pathname === item.href
                    ? "text-indigo-700 bg-indigo-50 shadow-sm"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50"
                )}
              >
                <span className="relative">
                  {t(item.name)}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full",
                      pathname === item.href ? "w-full" : ""
                    )}
                  ></span>
                </span>
              </Link>
            ))}
          </div>

          {/* Mobile navigation icons */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Wishlist Icon */}
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-1.5 sm:p-2 text-gray-700 hover:bg-gray-100 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 cursor-pointer transition-colors"
              onClick={handleWishlistClick}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-1.5 sm:p-2 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer transition-colors"
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping cart"
            >
              <ShoppingCart
                className="h-5 w-5 sm:h-6 sm:w-6"
                aria-hidden="true"
              />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-1.5 sm:p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Right side utilities */}
          <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Currency Switcher */}
              <div className="utility-item">
                <CurrencySwitcher />
              </div>

              {/* Language Switcher */}
              <div className="utility-item ml-0.5 lg:ml-1">
                <LanguageSwitcher />
              </div>

              {/* Cart Button */}
              <div className="utility-item ml-0.5 lg:ml-1">
                <CartButton />
              </div>
            </div>

            {/* Account and Admin */}
            {shouldShowAuthenticatedUI ? (
              <div className="flex items-center space-x-1.5 lg:space-x-3 ml-3 lg:ml-6 border-l pl-3 lg:pl-6 border-gray-200">
                <Link
                  href="/account"
                  className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-4 py-1.5 lg:py-2 rounded-md text-xs lg:text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors cursor-pointer shadow-sm hover:shadow"
                >
                  <User className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span>{t("account")}</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-4 py-1.5 lg:py-2 rounded-md text-xs lg:text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer shadow-sm hover:shadow"
                  >
                    <Settings className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    <span>{t("admin")}</span>
                  </Link>
                )}

                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-4 py-1.5 lg:py-2 rounded-md text-xs lg:text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer shadow-sm hover:shadow h-auto"
                >
                  <LogOut className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span>{t("logout")}</span>
                </Button>
              </div>
            ) : (
              // Not authenticated or loading - show login
              <div className="flex items-center space-x-1.5 lg:space-x-3 ml-3 lg:ml-6 border-l pl-3 lg:pl-6 border-gray-200">
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-md bg-indigo-600 text-white text-xs lg:text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow cursor-pointer"
                >
                  {t("login")}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-white shadow-xl">
            <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 px-3 sm:px-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                type="button"
                className="rounded-md p-1.5 sm:p-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col h-full">
              <div className="flex-1 px-3 sm:px-4 py-3 sm:py-4 space-y-1 sm:space-y-2 overflow-y-auto">
                {navigation.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "block rounded-md px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors cursor-pointer",
                      pathname === item.href
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-900 hover:bg-gray-50 hover:text-indigo-600"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t(item.name)}
                  </Link>
                ))}

                <div className="py-3 sm:py-4">
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 mt-2">
                    <CurrencySwitcher />
                    <LanguageSwitcher />
                    <CartButton />
                  </div>

                  <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-1 sm:mt-2">
                    {shouldShowAuthenticatedUI ? (
                      <>
                        <Link
                          href="/account"
                          className="block rounded-md px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-gray-900 hover:bg-gray-50 hover:text-indigo-600 mb-1.5 sm:mb-2 cursor-pointer"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                            <span>{t("account")}</span>
                          </div>
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block rounded-md px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer mb-1.5 sm:mb-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                              <span>{t("admin")}</span>
                            </div>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full block rounded-md px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                            <span>{t("logout")}</span>
                          </div>
                        </button>
                      </>
                    ) : (
                      // Not authenticated or loading - show login for mobile
                      <Link
                        href="/auth/login"
                        className="flex items-center w-full justify-center gap-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md bg-indigo-600 text-white text-sm sm:text-base font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow cursor-pointer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t("login")}
                        <span aria-hidden="true" className="ml-1">
                          &rarr;
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
