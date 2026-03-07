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
  Database,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { MobileLanguageSelector } from "@/components/ui/mobile-language-selector";
import { CartButton } from "@/features/cart";
import {
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
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

const desktopNavLinkBaseClass =
  "relative group flex items-center gap-2 whitespace-nowrap rounded-2xl border px-3 2xl:px-4 py-2 text-sm 2xl:text-base font-semibold transition-all duration-200 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.2)]";
const desktopNavLinkActiveClass =
  "text-slate-900 bg-white border-sky-200 shadow-[0_16px_32px_-20px_rgba(14,165,233,0.25)]";
const desktopNavLinkInactiveClass =
  "text-slate-600 border-transparent bg-white/45 hover:text-slate-900 hover:bg-white/90 hover:border-slate-200";
const desktopIconBaseClass =
  "hidden lg:block w-4 h-4 2xl:w-5 2xl:h-5 transition-colors duration-200";

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/60 shadow-[0_14px_35px_-24px_rgba(15,23,42,0.2)] transition-[background,shadow] duration-500 supports-[backdrop-filter]:backdrop-blur-xl">
      {/* Unified responsive header */}
      <div className="px-3 sm:px-5 lg:px-8 py-1.5 lg:py-3 max-[400px]:px-2.5">
        <div
          className={cn(
            glassPanelClass,
            "pointer-events-auto flex items-center justify-between min-h-[3.25rem] sm:min-h-[3.75rem] lg:min-h-[4.5rem] 2xl:min-h-[5.5rem] px-3 sm:px-4 lg:px-6 2xl:px-9 bg-gradient-to-br from-slate-950/85 via-indigo-950/75 to-slate-900/80 text-slate-100 shadow-[0_18px_50px_rgba(2,132,199,0.16)] lg:border-slate-200/80 lg:bg-white/88 lg:text-slate-900 lg:shadow-[0_20px_45px_-28px_rgba(15,23,42,0.18)] max-[400px]:px-2 max-[400px]:min-h-[3rem]"
          )}
        >
          {/* Logo + Desktop Navigation */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 lg:gap-8 2xl:gap-12 min-w-0 max-[400px]:gap-1.5">
            <Link href="/" className="flex items-center">
              <div className="relative h-9 w-24 overflow-hidden rounded-xl border border-white/20 bg-white/95 p-1 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.25)] xs:h-10 xs:w-28 sm:h-12 sm:w-32 lg:h-12 lg:w-32 2xl:h-14 2xl:w-36 max-[400px]:h-8 max-[400px]:w-20">
                <Image
                  className="object-contain"
                  src="/TechTots_LOGO.png"
                  alt="TechTots Logo"
                  fill
                  sizes="(max-width: 640px) 7rem, (max-width: 768px) 8rem, (max-width: 1280px) 9rem, 9rem"
                />
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-2 2xl:gap-3">
              {navigation.map(item => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      desktopNavLinkBaseClass,
                      isActive
                        ? desktopNavLinkActiveClass
                        : desktopNavLinkInactiveClass
                    )}
                    data-conversion="cta"
                    data-conversion-type="click"
                    data-conversion-category="nav"
                    data-conversion-action="header_link_click"
                    data-conversion-element={`header_${typeof item.name === "string" ? item.name : String(item.name)}`}
                  >
                    <IconComponent
                      className={cn(
                        desktopIconBaseClass,
                        isActive
                          ? "text-sky-600"
                          : "text-slate-400 group-hover:text-sky-600"
                      )}
                    />
                    <span className="relative">
                      {t(item.name)}
                      <span
                        className={cn(
                          "absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-sky-500 transition-all duration-200 group-hover:w-full",
                          isActive ? "w-full" : ""
                        )}
                      ></span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Responsive utilities */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 2xl:gap-6 text-slate-200 lg:text-slate-700 min-w-0 max-[400px]:gap-1.5">
            {/* Mobile controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 lg:hidden max-[400px]:gap-1">
              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors duration-200 hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 shadow-[0_12px_28px_rgba(244,63,94,0.28)] cursor-pointer max-[400px]:h-9 max-[400px]:w-9"
                onClick={handleWishlistClick}
                aria-label="Wishlist"
              >
                <Heart
                  className="h-5 w-5 max-[400px]:h-[18px] max-[400px]:w-[18px]"
                  aria-hidden="true"
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-rose-500 text-xs font-bold text-white shadow-[0_0_12px_rgba(244,63,94,0.6)] sm:h-5 sm:w-5">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </button>

              <Link
                href="/products"
                aria-label={t("products")}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors duration-200 hover:border-indigo-400/40 hover:bg-indigo-500/20 hover:text-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer shadow-[0_12px_28px_rgba(79,70,229,0.3)] max-[400px]:h-9 max-[400px]:w-9"
              >
                <Boxes
                  className="h-5 w-5 max-[400px]:h-[18px] max-[400px]:w-[18px]"
                  aria-hidden="true"
                />
              </Link>

              <CartButton
                variant="header"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-[0_16px_40px_rgba(2,6,23,0.5)] transition hover:bg-white/15 max-[400px]:h-9 max-[400px]:w-9 max-[400px]:p-1 text-slate-200"
              />

              {shouldShowAuthenticatedUI ? (
                <Link
                  href="/account"
                  aria-label={t("account")}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors duration-200 hover:border-white/20 hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer shadow-[0_16px_40px_rgba(59,130,246,0.32)] max-[400px]:h-9 max-[400px]:w-9"
                >
                  <User
                    className="h-5 w-5 max-[400px]:h-[18px] max-[400px]:w-[18px]"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  aria-label={t("login")}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/15 text-white transition-all duration-200 hover:border-white/35 hover:bg-white/25 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-slate-900 cursor-pointer shadow-[0_18px_48px_rgba(148,163,184,0.4)] max-[400px]:h-9 max-[400px]:w-9"
                >
                  <LogIn
                    className="h-5 w-5 max-[400px]:h-[18px] max-[400px]:w-[18px]"
                    aria-hidden="true"
                  />
                </Link>
              )}

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/10 text-white transition-colors duration-200 hover:border-white/25 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-slate-900 cursor-pointer shadow-[0_16px_36px_rgba(2,6,23,0.5)] max-[400px]:h-9 max-[400px]:w-9"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Menu
                  className="h-5 w-5 max-[400px]:h-[18px] max-[400px]:w-[18px]"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Desktop utilities */}
            <div className="hidden lg:flex items-center gap-4 2xl:gap-6">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.18)] backdrop-blur-sm">
                <LanguageSwitcher />
              </div>

              <div className="flex items-center justify-center rounded-full border border-slate-200 bg-white/95 p-2 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.18)] transition hover:bg-white">
                <CartButton
                  variant="header"
                  className="rounded-full bg-transparent text-slate-700 hover:bg-slate-100 hover:text-sky-700"
                />
              </div>

              {shouldShowAuthenticatedUI ? (
                <div className="flex items-center gap-3 2xl:gap-4 border-l border-slate-200 pl-4 2xl:pl-6">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 2xl:px-5 py-2 text-sm 2xl:text-base font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.18)]"
                  >
                    <User className="h-4 w-4 2xl:h-5 2xl:w-5" />
                    <span>{t("account")}</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-4 2xl:px-5 py-2 text-sm 2xl:text-base font-medium text-white transition-all duration-200 hover:from-indigo-500/90 hover:via-violet-500/90 hover:to-purple-600/90 hover:shadow-[0_20px_45px_rgba(79,70,229,0.55)] transform hover:scale-[1.02]"
                    >
                      <Settings className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      <span>{t("admin")}</span>
                    </Link>
                  )}

                  {(session?.user?.role === "VISITOR" ||
                    session?.user?.role === "ADMIN") && (
                    <Link
                      href="/database-showcase"
                      className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-4 2xl:px-5 py-2 text-sm 2xl:text-base font-medium text-white transition-all duration-200 hover:from-cyan-500/90 hover:via-sky-500/90 hover:to-blue-600/90 hover:shadow-[0_20px_45px_rgba(14,165,233,0.55)] transform hover:scale-[1.02]"
                    >
                      <Database className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      <span>Database Schema</span>
                    </Link>
                  )}

                  {isSupplier && (
                    <Link
                      href="/supplier/dashboard"
                      className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 2xl:px-5 py-2 text-sm 2xl:text-base font-medium text-white transition-all duration-200 hover:from-emerald-500/90 hover:via-teal-500/90 hover:to-emerald-600/90 hover:shadow-[0_20px_45px_rgba(16,185,129,0.55)] transform hover:scale-[1.02]"
                    >
                      <Building2 className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      <span>{t("supplier")}</span>
                    </Link>
                  )}

                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="flex h-auto items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 2xl:px-5 py-2 text-sm 2xl:text-base font-semibold text-rose-700 transition-all duration-200 hover:bg-rose-100 hover:text-rose-800 hover:border-rose-300 shadow-[0_12px_24px_-18px_rgba(244,63,94,0.16)]"
                  >
                    <LogOut className="h-4 w-4 2xl:h-5 2xl:w-5" />
                    <span>{t("logout")}</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center border-l border-slate-200 pl-4 2xl:pl-6">
                  <Link
                    href="/auth/login"
                    className={`${gradientButtonClass} flex items-center gap-2 rounded-2xl px-5 2xl:px-6 py-2 text-sm 2xl:text-base font-bold text-white shadow-[0_16px_30px_-14px_rgba(14,165,233,0.45)] ring-1 ring-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-14px_rgba(14,165,233,0.55)]`}
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
          <div className="lg:hidden fixed inset-0 z-[9999] animate-fadeIn">
            {/* Enhanced backdrop with smoother blur */}
            <div
              className="fixed inset-0 bg-gradient-to-br from-black/60 via-indigo-900/30 to-black/60 backdrop-blur-md z-[9999] transition-all duration-500 ease-out"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Modern sidebar with glassmorphism - COMPACT WIDTH */}
            <div
              className="fixed top-0 right-0 bottom-0 w-[80vw] xs:w-[75vw] sm:w-[65vw] md:w-[55vw] max-w-[340px]
              bg-gradient-to-br from-slate-950/95 via-indigo-950/85 to-slate-900/95
              text-slate-100
              backdrop-blur-2xl backdrop-saturate-150
              shadow-[0_30px_70px_rgba(2,6,23,0.65),0_15px_35px_rgba(79,70,229,0.35)]
              border-l border-white/10
              flex flex-col z-[10000] pointer-events-auto
              transform transition-all duration-500 ease-out
              animate-slideInRight
              overflow-hidden"
            >
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/20 pointer-events-none" />

              {/* Modern header with gradient - COMPACT */}
              <div className="relative z-10 flex h-12 items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-950/95 via-indigo-950/80 to-slate-900/90 px-3 shadow-[0_12px_25px_rgba(2,6,23,0.55)]">
                {/* Animated menu title - Smaller */}
                <h2 className="flex items-center gap-2 text-sm font-bold text-white animate-fadeIn">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 blur-sm opacity-60"></div>
                    <div className="relative h-4 w-1 rounded-full bg-gradient-to-b from-indigo-400 via-purple-500 to-indigo-500 shadow-lg"></div>
                  </div>
                  <span className="relative text-slate-100">
                    {t("menu", "Meniu")}
                    <div className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-transparent opacity-60"></div>
                  </span>
                </h2>

                {/* Enhanced close button - Compact */}
                <button
                  type="button"
                  className="group relative flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-white/10 bg-slate-900/70 p-1.5 text-slate-300 transition-all duration-300 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200 shadow-[0_10px_25px_rgba(2,6,23,0.45)] backdrop-blur-lg transform hover:scale-105 active:scale-95"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400/0 to-pink-400/0 transition-all duration-300 group-hover:from-rose-400/10 group-hover:to-pink-400/15"></div>
                  <X
                    className="relative h-4 w-4 transition-transform duration-300 group-hover:rotate-90"
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
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-all duration-300 backdrop-blur-sm transform hover:scale-[1.01] active:scale-[0.99] group shadow-[0_18px_35px_rgba(2,6,23,0.45)]",
                        activeFilters.hasActiveFilters
                          ? "bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-indigo-500/15 text-white border-indigo-400/40 shadow-[0_22px_45px_rgba(99,102,241,0.35)]"
                          : "bg-slate-900/60 hover:border-indigo-400/30 hover:bg-indigo-500/10"
                      )}
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
                          className={cn(
                            "relative rounded-lg border border-transparent p-1.5 transition-all duration-300",
                            activeFilters.hasActiveFilters
                              ? "border-indigo-400/50 bg-indigo-500/20 shadow-[0_0_18px_rgba(99,102,241,0.35)]"
                              : "border-white/10 bg-slate-900/60 group-hover:border-indigo-400/40 group-hover:bg-indigo-500/15"
                          )}
                        >
                          {/* Glow effect */}
                          <div
                            className={cn(
                              "absolute inset-0 rounded-lg blur-md transition-all duration-300",
                              activeFilters.hasActiveFilters
                                ? "bg-indigo-500/30"
                                : "bg-indigo-400/0 group-hover:bg-indigo-400/20"
                            )}
                          ></div>

                          {activeFilters.hasActiveFilters ? (
                            <Filter className="relative h-3 w-3 text-indigo-200" />
                          ) : (
                            <Boxes className="relative h-3 w-3 text-indigo-200 group-hover:text-indigo-100" />
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
                        className={cn(
                          "ml-auto flex h-6 w-6 items-center justify-center rounded-md transition-all duration-300 shadow-[0_10px_25px_rgba(2,6,23,0.35)]",
                          activeFilters.hasActiveFilters
                            ? "bg-indigo-500/30 text-indigo-100"
                            : "bg-slate-900/60 text-slate-300 group-hover:bg-indigo-500/15 group-hover:text-indigo-100",
                          productsMenuOpen ? "rotate-180" : "rotate-0"
                        )}
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
                        className="mt-1.5 space-y-0.5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-[0_18px_35px_rgba(2,6,23,0.45)] backdrop-blur-sm"
                      >
                        {/* All products - COMPACT */}
                        <button
                          type="button"
                          className="group flex w-full items-center border-b border-white/5 px-3 py-2 text-xs text-slate-200 transition-all duration-200 hover:bg-indigo-500/10 hover:text-white last:border-0"
                          onClick={() => {
                            router.push(buildProductsUrl({}));
                            setMobileMenuOpen(false);
                          }}
                        >
                          <div className="ml-0.5 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shadow-sm transition-transform duration-200 group-hover:scale-125"></div>
                          <span className="text-xs font-medium transition-all group-hover:font-semibold">
                            {t("allProducts", "Toate produsele")}
                          </span>
                          <span className="ml-auto rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-100 transition-colors group-hover:bg-indigo-500/30">
                            {t("all", "Toate")}
                          </span>
                        </button>

                        {/* Age (Varsta) subsection */}
                        <div className="border-t border-white/10">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-200 hover:bg-white/10"
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
                              <span className="mr-3 h-4 w-1 rounded-sm bg-sky-400"></span>
                              {t("age", "Vârstă")}
                            </span>
                            <span
                              className="ml-auto text-slate-400 transition-transform duration-300"
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
                              className="border-y border-white/10 bg-slate-900/60"
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
                                  className={`group flex w-full items-center border border-transparent px-4 py-2.5 text-sm text-left transition-all duration-200 ${
                                    activeFilters.ageGroup === opt.id
                                      ? "bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-indigo-500/20 text-white font-medium border-indigo-400/40 shadow-[0_15px_35px_rgba(99,102,241,0.3)]"
                                      : "text-slate-200 hover:bg-white/10"
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
                                    className={`ml-4 mr-3 h-1.5 w-1.5 rounded-full ${opt.color}`}
                                  ></div>
                                  <span className="group-hover:text-white">
                                    {opt.label}
                                  </span>
                                  {activeFilters.ageGroup === opt.id && (
                                    <div className="ml-auto rounded-full bg-indigo-500/20 p-0.5">
                                      <Check className="h-3 w-3 text-indigo-200" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Category subsection */}
                        <div className="border-t border-white/10">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-200 hover:bg-white/10"
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
                              <span className="mr-3 h-4 w-1 rounded-sm bg-indigo-500"></span>
                              {t("categories", "Categorii")}
                            </span>
                            <span
                              className="ml-auto text-slate-400 transition-transform duration-300"
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
                              className="border-y border-white/10 bg-slate-900/60"
                            >
                              {categories.map(cat => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  className={`group flex w-full items-center border border-transparent px-4 py-2.5 text-sm text-left transition-all duration-200 ${
                                    activeFilters.category.includes(cat.id)
                                      ? "bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 text-white font-medium border-indigo-400/40 shadow-[0_15px_35px_rgba(99,102,241,0.3)]"
                                      : "text-slate-200 hover:bg-white/10"
                                  }`}
                                  onClick={() => {
                                    router.push(
                                      buildProductsUrl({ category: cat.id })
                                    );
                                    setMobileMenuOpen(false);
                                  }}
                                >
                                  <div className="ml-4 mr-3 h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                                  <span className="group-hover:text-white">
                                    {getCategoryTranslation(cat.id, t)}
                                  </span>
                                  {activeFilters.category.includes(cat.id) && (
                                    <div className="ml-auto rounded-full bg-indigo-500/20 p-0.5">
                                      <Check className="h-3 w-3 text-indigo-200" />
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
                          className={`flex w-full items-center border-t border-white/10 px-4 py-2.5 text-sm text-left transition-all duration-200 ${
                            activeFilters.specialCategories.includes(
                              "GIFT_IDEAS"
                            )
                              ? "bg-rose-500/15 text-white font-medium border-rose-400/40 shadow-[0_15px_35px_rgba(244,63,94,0.3)]"
                              : "text-slate-200 hover:bg-rose-500/10 hover:text-white"
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
                          <div className="ml-1 mr-2 h-1.5 w-1.5 rounded-full bg-rose-400"></div>
                          <span>{t("giftIdeas", "Idei de cadouri")}</span>
                          {activeFilters.specialCategories.includes(
                            "GIFT_IDEAS"
                          ) ? (
                            <div className="ml-auto rounded-full bg-rose-500/20 p-0.5">
                              <Check className="h-3 w-3 text-rose-200" />
                            </div>
                          ) : (
                            <span className="ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-200">
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
                              "relative flex min-h-[40px] items-center overflow-hidden rounded-2xl border border-white/10 px-3 py-2.5 text-xs text-slate-200 transition-all duration-300 animate-fadeIn cursor-pointer group transform hover:scale-[1.01] active:scale-[0.99] shadow-[0_15px_35px_rgba(2,6,23,0.45)]",
                              isActive
                                ? "bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-indigo-500/20 text-white border-indigo-400/40 shadow-[0_20px_45px_rgba(99,102,241,0.4)]"
                                : "bg-slate-900/60 hover:border-indigo-400/30 hover:bg-indigo-500/10"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                          >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 transition-all duration-300 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-indigo-500/10"></div>

                            {/* Modern icon container - COMPACT */}
                            <div className="relative">
                              <div
                                className={cn(
                                  "relative mr-2 rounded-lg p-1.5 transition-all duration-300",
                                  isActive
                                    ? "bg-indigo-500/20 shadow-[0_0_18px_rgba(99,102,241,0.4)] border border-indigo-400/40"
                                    : "border border-white/10 bg-slate-900/60 group-hover:border-indigo-400/40 group-hover:bg-indigo-500/15"
                                )}
                              >
                                {/* Icon glow effect */}
                                {isActive && (
                                  <div className="absolute inset-0 rounded-lg bg-indigo-400/30 blur-md"></div>
                                )}
                                <IconComponent
                                  className={cn(
                                    "relative h-3 w-3 transition-all duration-300",
                                    isActive
                                      ? "text-indigo-100"
                                      : "text-slate-300 group-hover:text-indigo-100 group-hover:scale-110"
                                  )}
                                />
                              </div>
                            </div>

                            <span
                              className={cn(
                                "relative text-xs font-semibold transition-all duration-200",
                                isActive
                                  ? "text-white"
                                  : "group-hover:text-white"
                              )}
                            >
                              {t(item.name)}
                            </span>

                            {/* Active indicator badge - COMPACT */}
                            {isActive && (
                              <div className="ml-auto rounded-full border border-indigo-400/40 bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse">
                                {t("active")}
                              </div>
                            )}

                            {/* Arrow indicator on hover */}
                            {!isActive && (
                              <div className="ml-auto translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
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
                                  className="text-indigo-200"
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

                  {/* Database Schema Showcase - COMPACT PREMIUM */}
                  {(session?.user?.role === "VISITOR" ||
                    session?.user?.role === "ADMIN") && (
                    <div
                      className="mb-2 animate-fadeIn"
                      style={{ animationDelay: "0.35s" }}
                    >
                      <Link
                        href="/database-showcase"
                        className="relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold 
                          bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600 
                          text-white 
                          hover:from-cyan-600 hover:via-blue-600 hover:to-cyan-700 
                          transition-all duration-300 cursor-pointer 
                          shadow-md shadow-cyan-300/50 
                          hover:shadow-lg hover:shadow-cyan-400/50
                          transform hover:scale-[1.01] active:scale-[0.99]
                          border border-cyan-400/30
                          overflow-hidden
                          group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {/* Animated background glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                        {/* Icon - COMPACT */}
                        <div className="relative bg-white/20 p-1.5 rounded-md backdrop-blur-sm shadow-inner">
                          <div className="absolute inset-0 bg-white/30 rounded-md blur-sm"></div>
                          <Database className="relative h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-300" />
                        </div>

                        <span className="relative font-bold tracking-wide text-xs">
                          Database Schema
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
                    className="relative mt-2 animate-fadeIn border-t border-white/10 bg-gradient-to-b from-slate-950/80 via-indigo-950/60 to-slate-900/70 py-3 backdrop-blur-sm"
                    style={{ animationDelay: "0.4s" }}
                  >
                    {/* Decorative gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-70"></div>

                    <div className="flex flex-col gap-2.5 px-2">
                      {/* Modern section header - COMPACT */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-0.5 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500 shadow-sm"></div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                            {t("preferences", "Preferințe")}
                          </span>
                        </div>
                        <div className="ml-2 h-[1.5px] flex-1 rounded-full bg-gradient-to-r from-indigo-400/60 via-purple-400/40 to-transparent"></div>
                      </div>

                      {/* Enhanced mobile selector */}
                      <div className="space-y-2">
                        <MobileLanguageSelector />
                      </div>
                    </div>
                  </div>

                  {/* User Actions - COMPACT */}
                  {shouldShowAuthenticatedUI && (
                    <div
                      className="relative space-y-2 border-t border-white/10 bg-gradient-to-b from-slate-950/75 via-indigo-950/60 to-slate-900/70 py-3 backdrop-blur-sm animate-fadeIn"
                      style={{ animationDelay: "0.5s" }}
                    >
                      {/* Decorative gradient line */}
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-70"></div>

                      {/* Section header - COMPACT */}
                      <div className="flex items-center justify-between px-3 mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-0.5 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500 shadow-sm"></div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                            {t("account", "Cont")}
                          </span>
                        </div>
                      </div>

                      {/* Account link - COMPACT */}
                      <Link
                        href="/account"
                        className="group relative mx-2 flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-xs text-slate-200 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-[0_15px_35px_rgba(2,6,23,0.45)] hover:border-indigo-400/30 hover:bg-indigo-500/10"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 transition-all duration-300 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-indigo-500/10"></div>

                        <span className="relative flex items-center gap-2">
                          <div className="relative rounded-lg border border-white/10 bg-slate-900/60 p-1.5 transition-all duration-300 group-hover:border-indigo-400/40 group-hover:bg-indigo-500/15">
                            <div className="absolute inset-0 rounded-lg bg-indigo-400/0 blur-md transition-all duration-300 group-hover:bg-indigo-400/25"></div>
                            <User className="relative h-3 w-3 text-indigo-200 transition-all duration-300 group-hover:scale-110" />
                          </div>
                          <span className="text-xs font-semibold">
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
                          className="relative text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-indigo-200"
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
                        className="group relative mx-2 flex w-[calc(100%-1rem)] items-center justify-between overflow-hidden rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-[0_18px_40px_rgba(244,63,94,0.35)] hover:bg-rose-500/20"
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-400/0 via-pink-400/0 to-rose-400/0 transition-all duration-300 group-hover:from-rose-400/15 group-hover:via-pink-400/10 group-hover:to-rose-400/15"></div>

                        <span className="relative flex items-center gap-2">
                          <div className="relative rounded-lg border border-rose-400/40 bg-rose-500/15 p-1.5 transition-all duration-300 group-hover:bg-rose-500/25">
                            <div className="absolute inset-0 rounded-lg bg-rose-400/20 blur-md transition-all duration-300 group-hover:bg-rose-400/35"></div>
                            <LogOut className="relative h-3 w-3 text-rose-200 transition-all duration-300 group-hover:scale-110" />
                          </div>
                          <span className="text-xs font-semibold text-rose-200 group-hover:text-rose-100">
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
                          className="relative text-rose-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-rose-100"
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
