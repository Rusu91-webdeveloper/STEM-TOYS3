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
      {/* Mobile & Tablet Header - Visible on small, medium, and large screens (up to xl) */}
      <div className="block xl:hidden">
        <div className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-28 md:h-12 md:w-32 lg:h-14 lg:w-36">
              <Image
                className="object-contain"
                src="/TechTots_LOGO.png"
                alt="TechTots Logo"
                priority
                fill
                sizes="(max-width: 768px) 7rem, (max-width: 1024px) 8rem, 9rem"
              />
            </div>
          </Link>

          {/* Mobile/Tablet Right Side */}
          <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
            {/* Wishlist Icon */}
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-1.5 md:p-2 lg:p-2.5 text-gray-700 hover:bg-gray-100 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 cursor-pointer transition-colors"
              onClick={handleWishlistClick}
              aria-label="Wishlist"
            >
              <Heart
                className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6"
                aria-hidden="true"
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 flex items-center justify-center font-bold">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-1.5 md:p-2 lg:p-2.5 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer transition-colors"
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping cart"
            >
              <ShoppingCart
                className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6"
                aria-hidden="true"
              />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Mobile/Tablet menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-1.5 md:p-2 lg:p-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu
                className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header - Only visible on extra large screens and up */}
      <div className="hidden xl:block">
        <div className="w-full px-8 2xl:px-12">
          <div className="flex items-center justify-between h-20 2xl:h-24">
            {/* Left Section: Logo + Navigation */}
            <div className="flex items-center space-x-8 2xl:space-x-12">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center">
                  <div className="relative h-12 w-32 2xl:h-14 2xl:w-36">
                    <Image
                      className="object-contain"
                      src="/TechTots_LOGO.png"
                      alt="TechTots Logo"
                      priority
                      fill
                      sizes="(max-width: 1536px) 8rem, 9rem"
                    />
                  </div>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center space-x-2 2xl:space-x-3">
                {navigation.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "relative group px-3 2xl:px-4 py-2 text-sm 2xl:text-base font-medium transition-all duration-200 rounded-md cursor-pointer whitespace-nowrap",
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
              </nav>
            </div>

            {/* Right Section: Utilities + User Actions */}
            <div className="flex items-center space-x-4 2xl:space-x-6">
              {/* Currency and Language Switchers */}
              <div className="flex items-center space-x-2 2xl:space-x-3">
                <CurrencySwitcher />
                <LanguageSwitcher />
              </div>

              {/* Cart Button */}
              <div className="flex items-center">
                <CartButton />
              </div>

              {/* User Actions */}
              {shouldShowAuthenticatedUI ? (
                <div className="flex items-center space-x-2 2xl:space-x-3 border-l pl-4 2xl:pl-6 border-gray-200">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-3 2xl:px-4 py-2 rounded-md text-sm 2xl:text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors cursor-pointer shadow-sm hover:shadow border border-transparent hover:border-gray-200"
                  >
                    <User className="h-4 w-4 2xl:h-5 2xl:w-5" />
                    <span>{t("account")}</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 2xl:px-4 py-2 rounded-md text-sm 2xl:text-base font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer shadow-sm hover:shadow border border-indigo-200"
                    >
                      <Settings className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      <span>{t("admin")}</span>
                    </Link>
                  )}

                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="flex items-center gap-2 px-3 2xl:px-4 py-2 rounded-md text-sm 2xl:text-base font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer shadow-sm hover:shadow h-auto border border-transparent hover:border-red-200"
                  >
                    <LogOut className="h-4 w-4 2xl:h-5 2xl:w-5" />
                    <span>{t("logout")}</span>
                  </Button>
                </div>
              ) : (
                // Not authenticated - show login
                <div className="flex items-center border-l pl-4 2xl:pl-6 border-gray-200">
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 px-4 2xl:px-5 py-2 rounded-md bg-indigo-600 text-white text-sm 2xl:text-base font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow cursor-pointer border border-indigo-600 hover:border-indigo-700"
                  >
                    <span>{t("login")}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet menu - Enhanced for better UX on medium and large screens */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm md:max-w-md lg:max-w-lg bg-white shadow-xl">
            <div className="flex items-center justify-between h-14 px-4 md:px-6 lg:px-8 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                type="button"
                className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X
                  className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="flex flex-col h-full">
              <div className="flex-1 px-4 md:px-6 lg:px-8 py-4 space-y-2 overflow-y-auto">
                {/* Navigation Links */}
                <div className="space-y-1">
                  {navigation.map(item => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "block rounded-md px-4 py-3 text-base md:text-lg lg:text-xl font-medium transition-colors cursor-pointer",
                        pathname === item.href
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-gray-900 hover:bg-gray-50 hover:text-indigo-600"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t(item.name)}
                    </Link>
                  ))}
                </div>

                {/* Utilities Section */}
                <div className="py-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-3 mb-6 mt-2">
                    <CurrencySwitcher />
                    <LanguageSwitcher />
                    <CartButton />
                  </div>

                  {/* User Actions Section */}
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    {shouldShowAuthenticatedUI ? (
                      <div className="space-y-2">
                        <Link
                          href="/account"
                          className="block rounded-md px-4 py-3 text-base md:text-lg lg:text-xl font-medium text-gray-900 hover:bg-gray-50 hover:text-indigo-600 cursor-pointer"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <User className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6 mr-3" />
                            <span>{t("account")}</span>
                          </div>
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block rounded-md px-4 py-3 text-base md:text-lg lg:text-xl font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="flex items-center">
                              <Settings className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6 mr-3" />
                              <span>{t("admin")}</span>
                            </div>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full block rounded-md px-4 py-3 text-base md:text-lg lg:text-xl font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <LogOut className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6 mr-3" />
                            <span>{t("logout")}</span>
                          </div>
                        </button>
                      </div>
                    ) : (
                      // Not authenticated - show login for mobile/tablet
                      <Link
                        href="/auth/login"
                        className="flex items-center w-full justify-center gap-2 px-4 py-3 rounded-md bg-indigo-600 text-white text-base md:text-lg lg:text-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow cursor-pointer"
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
