"use client";

import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Heart,
  Boxes,
  LogIn,
  Building2,
  Home,
  Package,
  Grid3X3,
  BookOpen,
  Info,
  Check,
  Filter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "@/components/ui/currency-switcher";
import { MobileCurrencySelector } from "@/components/ui/mobile-currency-selector";
import { MobileLanguageSelector } from "@/components/ui/mobile-language-selector";
import { CartButton } from "@/features/cart";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useTranslation, TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { buildProductsUrl } from "@/lib/utils/product-filters-url";

// Helper function to get category translation
const getCategoryTranslation = (
  categoryId: string,
  t: (key: string, fallback?: string) => string
): string => {
  const categoryTranslationMap: Record<string, string> = {
    science: "scienceCategory",
    technology: "technologyCategory",
    engineering: "engineeringCategory",
    mathematics: "mathematicsCategory",
    "educational-books": "educationalBooksCategory",
  };

  const translationKey = categoryTranslationMap[categoryId];
  if (translationKey) {
    return t(translationKey, categoryId);
  }

  // Fallback for any unmapped categories
  return t(`${categoryId}Category`, categoryId);
};

const navigation: {
  name: TranslationKey | string;
  href: string;
  icon: typeof Home;
}[] = [
  { name: "home", href: "/", icon: Home },
  { name: "products", href: "/products", icon: Package },
  { name: "categories", href: "/categories", icon: Grid3X3 },
  { name: "blog", href: "/blog", icon: BookOpen },
  { name: "about", href: "/about", icon: Info },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Performance optimization for animation (reduce re-renders)
  const [accordionAnimation, setAccordionAnimation] = useState({
    products: false,
    age: false,
    category: false,
  });
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { data: session, status } = useOptimizedSession();

  // Active filter indicators
  const activeFilters = useMemo(() => {
    return {
      ageGroup: searchParams.get("ageGroup") || "",
      category: searchParams.get("category")?.split(",") || [],
      specialCategories:
        searchParams.get("specialCategories")?.split(",") || [],
      hasActiveFilters: !!searchParams.toString(),
    };
  }, [searchParams]);

  // FIXED: Simplified and consistent authentication state logic
  const isAuthenticated =
    status === "authenticated" && !!session?.user && !session.user.error;
  const isAdmin =
    isAuthenticated &&
    (session?.user?.role === "ADMIN" || session?.user?.role === "VISITOR");
  const isSupplier =
    isAuthenticated &&
    (session?.user?.role === "SUPPLIER" || session?.user?.role === "VISITOR");
  const isLoading = status === "loading";

  // FIXED: Only show authenticated UI if truly authenticated
  const shouldShowAuthenticatedUI = isAuthenticated && !isLoading;

  // Debug logging for admin navigation - removed for production

  // Fetch wishlist count for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlistCount();
    }
  }, [isAuthenticated]);

  // Preload categories for performance optimization
  useEffect(() => {
    // Preload categories with a slight delay to not block page rendering
    const preloadTimer = setTimeout(() => {
      loadCategories();
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, []);

  // Initialize animation states when accordions open/close
  useEffect(() => {
    setAccordionAnimation(prev => ({ ...prev, products: productsMenuOpen }));
  }, [productsMenuOpen]);

  useEffect(() => {
    setAccordionAnimation(prev => ({ ...prev, age: ageOpen }));
  }, [ageOpen]);

  useEffect(() => {
    setAccordionAnimation(prev => ({ ...prev, category: categoryOpen }));
  }, [categoryOpen]);

  // Ensure portals render only on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      try {
        const previous = document.body.style.overflow;
        document.body.setAttribute("data-prev-overflow", previous || "");
        document.body.style.overflow = "hidden";
      } catch {}
    } else {
      try {
        const previous = document.body.getAttribute("data-prev-overflow") || "";
        document.body.style.overflow = previous;
        document.body.removeAttribute("data-prev-overflow");
      } catch {}
    }

    return () => {
      try {
        const previous = document.body.getAttribute("data-prev-overflow") || "";
        document.body.style.overflow = previous;
        document.body.removeAttribute("data-prev-overflow");
      } catch {}
    };
  }, [mobileMenuOpen]);

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

  // Load categories with SWR-like cache expiration logic
  const loadCategories = async () => {
    // Return if already loaded and cache is still valid
    if (categoriesLoaded) return;

    // Check localStorage cache first
    const CACHE_KEY = "menu_categories_cache";
    const CACHE_TTL = 1000 * 60 * 60; // 1 hour TTL

    try {
      // Try to get from localStorage first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isValid = Date.now() - timestamp < CACHE_TTL;

        if (isValid && Array.isArray(data) && data.length > 0) {
          setCategories(data);
          setCategoriesLoaded(true);
          return;
        }
      }

      // Fetch fresh data if cache is invalid or missing
      const res = await fetch("/api/categories", {
        headers: { "Cache-Control": "no-store" },
      });

      if (res.ok) {
        const data: Array<{ slug: string; name: string }> = await res.json();
        const mapped = data.map(c => ({ id: c.slug, label: c.name }));

        // Update state
        setCategories(mapped);
        setCategoriesLoaded(true);

        // Update cache
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: mapped,
            timestamp: Date.now(),
          })
        );
      }
    } catch (e) {
      console.error("Error loading categories (silent)", e);
      // Attempt to use any cached data even if expired
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
            setCategoriesLoaded(true);
          }
        }
      } catch (cacheError) {
        // Silent fallback - will show empty categories but not break the UI
      }
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
                sizes="(max-width: 640px) 7rem, (max-width: 768px) 8rem, (max-width: 1024px) 9rem, 9rem"
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

            {/* Products Icon */}
            <Link
              href="/products"
              aria-label={t("products")}
              className="relative inline-flex items-center justify-center rounded-md p-1.5 md:p-2 lg:p-2.5 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer transition-colors"
            >
              <Boxes
                className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6"
                aria-hidden="true"
              />
            </Link>

            {/* Cart Button - Now using the CartButton component for consistency */}
            <CartButton variant="header" />

            {/* Login/Account Icon (mobile/tablet) */}
            {shouldShowAuthenticatedUI ? (
              <Link
                href="/account"
                aria-label={t("account")}
                className="relative inline-flex items-center justify-center rounded-md p-1.5 md:p-2 lg:p-2.5 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer transition-colors"
              >
                <User
                  className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                aria-label={t("login")}
                className="relative inline-flex items-center justify-center rounded-md p-1.5 md:p-2 lg:p-2.5 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 cursor-pointer transition-colors"
              >
                <LogIn
                  className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6"
                  aria-hidden="true"
                />
              </Link>
            )}

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
      <div className="hidden xl:block xl:pointer-events-auto pointer-events-none">
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
                      sizes="(max-width: 1280px) 8rem, (max-width: 1536px) 9rem, 9rem"
                    />
                  </div>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center space-x-2 2xl:space-x-3">
                {navigation.map(item => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "relative group px-3 2xl:px-4 py-2 text-sm 2xl:text-base font-medium transition-all duration-200 rounded-md cursor-pointer whitespace-nowrap flex items-center gap-2",
                        pathname === item.href
                          ? "text-indigo-700 bg-indigo-50 shadow-sm"
                          : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50"
                      )}
                      data-conversion="cta"
                      data-conversion-type="click"
                      data-conversion-category="nav"
                      data-conversion-action="header_link_click"
                      data-conversion-element={`header_${typeof item.name === "string" ? item.name : String(item.name)}`}
                    >
                      {/* Icon - visible on big screens */}
                      <IconComponent
                        className={cn(
                          "w-4 h-4 2xl:w-5 2xl:h-5 transition-colors duration-200 hidden lg:block",
                          pathname === item.href
                            ? "text-indigo-700"
                            : "text-gray-500 group-hover:text-indigo-600"
                        )}
                      />
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
                  );
                })}
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

                  {/* Admin Navigation - Enhanced with better visibility */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 2xl:px-4 py-2 rounded-md text-sm 2xl:text-base font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg border border-transparent transform hover:scale-105"
                    >
                      <Settings className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      <span>{t("admin")}</span>
                    </Link>
                  )}

                  {isSupplier && (
                    <Link
                      href="/supplier/dashboard"
                      className="flex items-center gap-2 px-3 2xl:px-4 py-2 rounded-md text-sm 2xl:text-base font-medium bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg border border-transparent transform hover:scale-105"
                    >
                      <Building2 className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      <span>{t("supplier")}</span>
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

      {/* Mobile & Tablet menu - STUNNING MODERN DESIGN */}
      {isClient &&
        mobileMenuOpen &&
        createPortal(
          <div className="xl:hidden fixed inset-0 z-[9999] animate-fadeIn">
            {/* Enhanced backdrop with smoother blur */}
            <div
              className="fixed inset-0 bg-gradient-to-br from-black/60 via-indigo-900/30 to-black/60 backdrop-blur-md z-[9999] transition-all duration-500 ease-out"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Modern sidebar with glassmorphism - COMPACT WIDTH */}
            <div
              className="fixed top-0 right-0 bottom-0 w-[80vw] xs:w-[75vw] sm:w-[65vw] md:w-[55vw] max-w-[340px] 
              bg-gradient-to-br from-white via-gray-50/95 to-white
              backdrop-blur-xl backdrop-saturate-150
              shadow-[0_0_50px_rgba(0,0,0,0.15),0_20px_40px_rgba(99,102,241,0.1)]
              border-l-[3px]
              flex flex-col z-[10000] pointer-events-auto 
              transform transition-all duration-500 ease-out
              animate-slideInRight
              overflow-hidden"
              style={{
                borderImage:
                  "linear-gradient(to bottom, rgb(129, 140, 248), rgb(192, 132, 252), rgb(99, 102, 241)) 1",
              }}
            >
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/20 pointer-events-none" />

              {/* Modern header with gradient - COMPACT */}
              <div
                className="relative flex items-center justify-between h-12 px-3 
                border-b border-gray-200/60
                bg-gradient-to-r from-white via-indigo-50/40 to-purple-50/30
                shadow-sm
                z-10"
              >
                {/* Animated menu title - Smaller */}
                <h2 className="text-sm font-bold bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2 animate-fadeIn">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full blur-sm opacity-60"></div>
                    <div className="relative w-1 h-4 bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-600 rounded-full shadow-lg"></div>
                  </div>
                  <span className="relative">
                    {t("menu", "Meniu")}
                    <div className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-gradient-to-r from-indigo-400 via-purple-400 to-transparent rounded-full opacity-60"></div>
                  </span>
                </h2>

                {/* Enhanced close button - Compact */}
                <button
                  type="button"
                  className="relative rounded-full p-1.5 
                    bg-white/80 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50
                    text-gray-500 hover:text-red-600 
                    transition-all duration-300 
                    min-h-[36px] min-w-[36px] 
                    flex items-center justify-center group 
                    border border-gray-200/60 hover:border-red-300
                    shadow-sm hover:shadow-md
                    backdrop-blur-sm
                    transform hover:scale-105 active:scale-95"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400/0 to-pink-400/0 group-hover:from-red-400/10 group-hover:to-pink-400/10 rounded-full transition-all duration-300"></div>
                  <X
                    className="relative h-4 w-4 group-hover:rotate-90 transition-transform duration-300"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div className="flex flex-col h-full relative">
                {/* Custom scrollable area - COMPACT */}
                <div className="flex-1 px-3 py-2 pb-4 space-y-1.5 overflow-y-auto mobile-sidebar-scroll relative z-0">
                  {/* Products collapsible section - COMPACT */}
                  <div
                    className="mb-2 animate-fadeIn"
                    aria-label={t("products")}
                    style={{ animationDelay: "0.1s" }}
                  >
                    <button
                      type="button"
                      className={`
                        flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold
                        transition-all duration-300 
                        shadow-sm hover:shadow-md
                        backdrop-blur-sm
                        border
                        transform hover:scale-[1.01] active:scale-[0.99]
                        group
                        ${
                          activeFilters.hasActiveFilters
                            ? "bg-gradient-to-br from-indigo-50 via-purple-50/50 to-indigo-50 border-indigo-200 text-indigo-800 shadow-indigo-100"
                            : "bg-white/90 hover:bg-gradient-to-br hover:from-gray-50 hover:to-indigo-50/30 border-gray-200/60 hover:border-indigo-200 text-gray-800"
                        }
                      `}
                      aria-expanded={productsMenuOpen}
                      aria-controls="mobile-products-section"
                      onClick={() => {
                        // Use optimized animation state
                        const newState = !productsMenuOpen;
                        setProductsMenuOpen(newState);
                        // Delay animation state update slightly for smoother transitions
                        setTimeout(() => {
                          setAccordionAnimation(prev => ({
                            ...prev,
                            products: newState,
                          }));
                        }, 50);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {/* Modern icon container - COMPACT */}
                        <div
                          className={`
                          relative p-1.5 rounded-md 
                          transition-all duration-300
                          ${
                            activeFilters.hasActiveFilters
                              ? "bg-gradient-to-br from-indigo-100 to-purple-100 shadow-sm"
                              : "bg-gradient-to-br from-indigo-50 to-purple-50 group-hover:from-indigo-100 group-hover:to-purple-100"
                          }`}
                        >
                          {/* Glow effect */}
                          <div
                            className={`absolute inset-0 rounded-md blur-sm ${activeFilters.hasActiveFilters ? "bg-indigo-300/40" : "bg-indigo-200/0 group-hover:bg-indigo-200/30"} transition-all duration-300`}
                          ></div>

                          {activeFilters.hasActiveFilters ? (
                            <Filter className="relative w-3 h-3 text-indigo-700" />
                          ) : (
                            <Boxes className="relative w-3 h-3 text-indigo-600 group-hover:text-indigo-700" />
                          )}
                        </div>

                        <span className="font-semibold text-xs">
                          {t("products")}
                        </span>

                        {/* Enhanced filter count badge - COMPACT */}
                        {activeFilters.hasActiveFilters && (
                          <span
                            className="ml-0.5 
                            bg-gradient-to-r from-indigo-600 to-purple-600 
                            text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full 
                            shadow-sm
                            animate-pulse
                            border border-indigo-400/30"
                          >
                            {activeFilters.category.length +
                              (activeFilters.ageGroup ? 1 : 0) +
                              activeFilters.specialCategories.length}
                          </span>
                        )}
                      </span>

                      {/* Modern chevron - COMPACT */}
                      <span
                        className={`
                        ml-auto rounded-md h-6 w-6 
                        flex items-center justify-center 
                        transition-all duration-300 
                        ${
                          activeFilters.hasActiveFilters
                            ? "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700"
                            : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-700"
                        }
                        shadow-sm
                        ${productsMenuOpen ? "rotate-180" : "rotate-0"}
                      `}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </button>

                    {productsMenuOpen && (
                      <div
                        id="mobile-products-section"
                        className="mt-1.5 space-y-0.5 rounded-lg overflow-hidden border border-indigo-100/60 bg-gradient-to-br from-white to-gray-50/30 shadow-sm backdrop-blur-sm"
                      >
                        {/* All products - COMPACT */}
                        <button
                          type="button"
                          className="flex items-center px-3 py-2 text-xs text-gray-700 
                            hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50/50 
                            hover:text-indigo-700 
                            w-full text-left 
                            transition-all duration-200
                            group
                            border-b border-gray-100/60 last:border-0"
                          onClick={() => {
                            router.push(buildProductsUrl({}));
                            setMobileMenuOpen(false);
                          }}
                        >
                          <div className="ml-0.5 mr-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shadow-sm group-hover:scale-125 transition-transform duration-200"></div>
                          <span className="font-medium group-hover:font-semibold transition-all text-xs">
                            {t("allProducts", "Toate produsele")}
                          </span>
                          <span className="ml-auto text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold group-hover:bg-indigo-100 transition-colors">
                            {t("all", "Toate")}
                          </span>
                        </button>

                        {/* Age (Varsta) subsection */}
                        <div className="border-t border-gray-100">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors duration-200"
                            aria-expanded={ageOpen}
                            aria-controls="mobile-age-subsection"
                            onClick={() => {
                              // Use optimized animation state
                              const newState = !ageOpen;
                              setAgeOpen(newState);
                              // Delay animation state update slightly for smoother transitions
                              setTimeout(() => {
                                setAccordionAnimation(prev => ({
                                  ...prev,
                                  age: newState,
                                }));
                              }, 50);
                            }}
                          >
                            <span className="flex items-center">
                              <span className="w-1 h-4 bg-blue-500 rounded-sm mr-3"></span>
                              {t("age", "Vârstă")}
                            </span>
                            <span
                              className="ml-auto text-gray-500 transition-transform duration-300"
                              style={{
                                transform: ageOpen
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </span>
                          </button>
                          {ageOpen && (
                            <div
                              id="mobile-age-subsection"
                              className="bg-gray-50/80 border-t border-b border-gray-100"
                            >
                              {[
                                {
                                  id: "TODDLERS_1_3",
                                  label: t("age0to3", "0–3 ani"),
                                  color: "bg-yellow-400",
                                },
                                {
                                  id: "PRESCHOOL_3_5",
                                  label: t("age3to5", "4–6 ani"),
                                  color: "bg-green-500",
                                },
                                {
                                  id: "ELEMENTARY_6_8",
                                  label: t("age6to8", "7–9 ani"),
                                  color: "bg-blue-500",
                                },
                                {
                                  id: "MIDDLE_SCHOOL_9_12",
                                  label: t("age9to12", "10–12 ani"),
                                  color: "bg-purple-500",
                                },
                                {
                                  id: "TEENS_13_PLUS",
                                  label: t("age13plus", "13+ ani"),
                                  color: "bg-red-500",
                                },
                              ].map(opt => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  className={`flex items-center px-4 py-2.5 text-sm w-full text-left group transition-all duration-200 ${
                                    activeFilters.ageGroup === opt.id
                                      ? "bg-indigo-50 text-indigo-700 font-medium"
                                      : "text-gray-700 hover:bg-white"
                                  }`}
                                  onClick={() => {
                                    router.push(
                                      buildProductsUrl({
                                        ageGroup: opt.id as any,
                                      })
                                    );
                                    setMobileMenuOpen(false);
                                  }}
                                >
                                  <div
                                    className={`ml-4 mr-3 w-1.5 h-1.5 rounded-full ${opt.color}`}
                                  ></div>
                                  <span className="group-hover:text-indigo-700">
                                    {opt.label}
                                  </span>
                                  {activeFilters.ageGroup === opt.id && (
                                    <div className="ml-auto bg-indigo-100 p-0.5 rounded-full">
                                      <Check className="w-3 h-3 text-indigo-600" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Category subsection */}
                        <div className="border-t border-gray-100">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors duration-200"
                            aria-expanded={categoryOpen}
                            aria-controls="mobile-category-subsection"
                            onClick={async () => {
                              const next = !categoryOpen;
                              setCategoryOpen(next);

                              if (next) {
                                // Load categories if opening the accordion
                                await loadCategories();

                                // Delay animation state update for smoother transitions
                                setTimeout(() => {
                                  setAccordionAnimation(prev => ({
                                    ...prev,
                                    category: true,
                                  }));
                                }, 50);
                              } else {
                                // Immediate animation state update for closing
                                setAccordionAnimation(prev => ({
                                  ...prev,
                                  category: false,
                                }));
                              }
                            }}
                          >
                            <span className="flex items-center">
                              <span className="w-1 h-4 bg-indigo-500 rounded-sm mr-3"></span>
                              {t("categories", "Categorii")}
                            </span>
                            <span
                              className="ml-auto text-gray-500 transition-transform duration-300"
                              style={{
                                transform: categoryOpen
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </span>
                          </button>
                          {categoryOpen && (
                            <div
                              id="mobile-category-subsection"
                              className="bg-gray-50/80 border-t border-b border-gray-100"
                            >
                              {categories.map(cat => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  className={`flex items-center px-4 py-2.5 text-sm w-full text-left group transition-all duration-200 ${
                                    activeFilters.category.includes(cat.id)
                                      ? "bg-indigo-50 text-indigo-700 font-medium"
                                      : "text-gray-700 hover:bg-white"
                                  }`}
                                  onClick={() => {
                                    router.push(
                                      buildProductsUrl({ category: cat.id })
                                    );
                                    setMobileMenuOpen(false);
                                  }}
                                >
                                  <div className="ml-4 mr-3 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  <span className="group-hover:text-indigo-700">
                                    {getCategoryTranslation(cat.id, t)}
                                  </span>
                                  {activeFilters.category.includes(cat.id) && (
                                    <div className="ml-auto bg-indigo-100 p-0.5 rounded-full">
                                      <Check className="w-3 h-3 text-indigo-600" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Gift Ideas */}
                        <button
                          type="button"
                          className={`flex items-center px-4 py-2.5 text-sm w-full text-left border-t border-gray-100 transition-all duration-200 ${
                            activeFilters.specialCategories.includes(
                              "GIFT_IDEAS"
                            )
                              ? "bg-pink-50 text-pink-700 font-medium"
                              : "text-gray-700 hover:bg-indigo-50/50 hover:text-indigo-700"
                          }`}
                          onClick={() => {
                            router.push(
                              buildProductsUrl({
                                specialCategories: "GIFT_IDEAS",
                              })
                            );
                            setMobileMenuOpen(false);
                          }}
                        >
                          <div className="ml-1 mr-2 w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                          <span>{t("giftIdeas", "Idei de cadouri")}</span>
                          {activeFilters.specialCategories.includes(
                            "GIFT_IDEAS"
                          ) ? (
                            <div className="ml-auto bg-pink-100 p-0.5 rounded-full">
                              <Check className="w-3 h-3 text-pink-600" />
                            </div>
                          ) : (
                            <span className="ml-auto text-xs text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                              {t("gift", "Cadou")}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Navigation Links - COMPACT */}
                  <div className="space-y-1.5 mt-2">
                    {navigation
                      .filter(item => item.href !== "/products")
                      .map((item, index) => {
                        const IconComponent = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              "flex rounded-lg px-3 py-2.5 text-xs transition-all duration-300 cursor-pointer min-h-[40px] items-center group border relative overflow-hidden animate-fadeIn",
                              isActive
                                ? "bg-gradient-to-br from-indigo-50 via-purple-50/50 to-indigo-50 text-indigo-700 border-indigo-200 shadow-sm shadow-indigo-100/50"
                                : "text-gray-700 hover:text-indigo-700 active:bg-gray-100 bg-white/90 border-gray-200/60 hover:border-indigo-200 shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99]"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                          >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-purple-50/0 to-indigo-50/0 group-hover:from-indigo-50/30 group-hover:via-purple-50/20 group-hover:to-indigo-50/30 transition-all duration-300"></div>

                            {/* Modern icon container - COMPACT */}
                            <div className="relative">
                              <div
                                className={cn(
                                  "p-1.5 rounded-md mr-2 transition-all duration-300 relative",
                                  isActive
                                    ? "bg-gradient-to-br from-indigo-100 to-purple-100 shadow-sm"
                                    : "bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-indigo-100 group-hover:to-purple-100"
                                )}
                              >
                                {/* Icon glow effect */}
                                {isActive && (
                                  <div className="absolute inset-0 bg-indigo-300/40 blur-sm rounded-md"></div>
                                )}
                                <IconComponent
                                  className={cn(
                                    "relative w-3 h-3 transition-all duration-300",
                                    isActive
                                      ? "text-indigo-700"
                                      : "text-gray-500 group-hover:text-indigo-700 group-hover:scale-110"
                                  )}
                                />
                              </div>
                            </div>

                            <span
                              className={cn(
                                "relative font-semibold transition-all duration-200 text-xs",
                                isActive
                                  ? "text-indigo-700"
                                  : "group-hover:text-indigo-700"
                              )}
                            >
                              {t(item.name)}
                            </span>

                            {/* Active indicator badge - COMPACT */}
                            {isActive && (
                              <div className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse border border-indigo-400/30">
                                Active
                              </div>
                            )}

                            {/* Arrow indicator on hover */}
                            {!isActive && (
                              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-indigo-400"
                                >
                                  <path d="m9 18 6-6-6-6"></path>
                                </svg>
                              </div>
                            )}
                          </Link>
                        );
                      })}
                  </div>

                  {/* Admin Navigation - COMPACT PREMIUM */}
                  {isAdmin && (
                    <div
                      className="mt-3 mb-2 animate-fadeIn"
                      style={{ animationDelay: "0.3s" }}
                    >
                      <Link
                        href="/admin"
                        className="relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold 
                          bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 
                          text-white 
                          hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 
                          transition-all duration-300 cursor-pointer 
                          shadow-md shadow-indigo-300/50 
                          hover:shadow-lg hover:shadow-indigo-400/50
                          transform hover:scale-[1.01] active:scale-[0.99]
                          border border-indigo-400/30
                          overflow-hidden
                          group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {/* Animated background glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                        {/* Icon - COMPACT */}
                        <div className="relative bg-white/20 p-1.5 rounded-md backdrop-blur-sm shadow-inner">
                          <div className="absolute inset-0 bg-white/30 rounded-md blur-sm"></div>
                          <Settings className="relative h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
                        </div>

                        <span className="relative font-bold tracking-wide text-xs">
                          {t("admin")}
                        </span>

                        {/* Animated arrow - COMPACT */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-auto relative transform group-hover:translate-x-1 transition-transform duration-300"
                        >
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      </Link>
                    </div>
                  )}

                  {/* Supplier Navigation - COMPACT PREMIUM */}
                  {isSupplier && (
                    <div
                      className="mt-3 mb-2 animate-fadeIn"
                      style={{ animationDelay: "0.3s" }}
                    >
                      <Link
                        href="/supplier/dashboard"
                        className="relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold 
                          bg-gradient-to-r from-green-500 via-teal-500 to-green-600 
                          text-white 
                          hover:from-green-600 hover:via-teal-600 hover:to-green-700 
                          transition-all duration-300 cursor-pointer 
                          shadow-md shadow-green-300/50 
                          hover:shadow-lg hover:shadow-green-400/50
                          transform hover:scale-[1.01] active:scale-[0.99]
                          border border-green-400/30
                          overflow-hidden
                          group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {/* Animated background glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                        {/* Icon - COMPACT */}
                        <div className="relative bg-white/20 p-1.5 rounded-md backdrop-blur-sm shadow-inner">
                          <div className="absolute inset-0 bg-white/30 rounded-md blur-sm"></div>
                          <Building2 className="relative h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-300" />
                        </div>

                        <span className="relative font-bold tracking-wide text-xs">
                          {t("supplier")}
                        </span>

                        {/* Animated arrow - COMPACT */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-auto relative transform group-hover:translate-x-1 transition-transform duration-300"
                        >
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      </Link>
                    </div>
                  )}

                  {/* Utilities Section - COMPACT */}
                  <div
                    className="relative py-3 border-t border-gray-200/60 mt-2 bg-gradient-to-b from-indigo-50/20 via-purple-50/10 to-white/50 backdrop-blur-sm animate-fadeIn"
                    style={{ animationDelay: "0.4s" }}
                  >
                    {/* Decorative gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-50"></div>

                    <div className="flex flex-col gap-2.5 px-2">
                      {/* Modern section header - COMPACT */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-0.5 h-3 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full shadow-sm"></div>
                          <span className="text-[10px] font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent uppercase tracking-wider">
                            {t("preferences", "Preferințe")}
                          </span>
                        </div>
                        <div className="h-[1.5px] flex-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent ml-2 rounded-full"></div>
                      </div>

                      {/* Enhanced mobile selectors */}
                      <div className="space-y-2">
                        <MobileLanguageSelector />
                        <MobileCurrencySelector allowedCodes={["RON", "EUR"]} />
                      </div>
                    </div>
                  </div>

                  {/* User Actions - COMPACT */}
                  {shouldShowAuthenticatedUI && (
                    <div
                      className="relative border-t border-gray-200/60 py-3 space-y-2 bg-gradient-to-b from-white/50 to-gray-50/30 backdrop-blur-sm animate-fadeIn"
                      style={{ animationDelay: "0.5s" }}
                    >
                      {/* Decorative gradient line */}
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-50"></div>

                      {/* Section header - COMPACT */}
                      <div className="flex items-center justify-between px-3 mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-0.5 h-3 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full shadow-sm"></div>
                          <span className="text-[10px] font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent uppercase tracking-wider">
                            {t("account", "Cont")}
                          </span>
                        </div>
                      </div>

                      {/* Account link - COMPACT */}
                      <Link
                        href="/account"
                        className="mx-2 flex items-center justify-between px-3 py-2.5 rounded-lg text-xs 
                          bg-white/90 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50/50 
                          text-gray-800 hover:text-indigo-700
                          border border-gray-200/60 hover:border-indigo-200
                          shadow-sm hover:shadow-md
                          transition-all duration-300
                          transform hover:scale-[1.01] active:scale-[0.99]
                          group
                          relative overflow-hidden"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-purple-50/0 to-indigo-50/0 group-hover:from-indigo-50/30 group-hover:via-purple-50/20 group-hover:to-indigo-50/30 transition-all duration-300"></div>

                        <span className="relative flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-50 to-purple-50 group-hover:from-indigo-100 group-hover:to-purple-100 transition-all duration-300 relative">
                            <div className="absolute inset-0 bg-indigo-200/0 group-hover:bg-indigo-200/30 blur-sm rounded-md transition-all duration-300"></div>
                            <User className="relative h-3 w-3 text-indigo-600 group-hover:text-indigo-700 group-hover:scale-110 transition-all duration-300" />
                          </div>
                          <span className="font-semibold text-xs">
                            {t("account")}
                          </span>
                        </span>

                        {/* Animated arrow - COMPACT */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="relative text-gray-400 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all duration-300"
                        >
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </Link>

                      {/* Logout button - COMPACT */}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="mx-2 w-[calc(100%-1rem)] flex items-center justify-between px-3 py-2.5 rounded-lg text-xs 
                          bg-white/90 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50/50 
                          text-gray-800 hover:text-red-600
                          border border-gray-200/60 hover:border-red-300
                          shadow-sm hover:shadow-md hover:shadow-red-100/50
                          transition-all duration-300
                          transform hover:scale-[1.01] active:scale-[0.99]
                          group
                          relative overflow-hidden"
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-50/0 via-pink-50/0 to-red-50/0 group-hover:from-red-50/40 group-hover:via-pink-50/20 group-hover:to-red-50/40 transition-all duration-300"></div>

                        <span className="relative flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-gradient-to-br from-red-50 to-pink-50 group-hover:from-red-100 group-hover:to-pink-100 transition-all duration-300 relative">
                            <div className="absolute inset-0 bg-red-200/0 group-hover:bg-red-200/30 blur-sm rounded-md transition-all duration-300"></div>
                            <LogOut className="relative h-3 w-3 text-red-600 group-hover:text-red-700 group-hover:scale-110 transition-all duration-300" />
                          </div>
                          <span className="font-semibold text-red-600 group-hover:text-red-700 text-xs">
                            {t("logout")}
                          </span>
                        </span>

                        {/* Animated arrow - COMPACT */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="relative text-red-400 group-hover:text-red-500 transform group-hover:translate-x-1 transition-all duration-300"
                        >
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
