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
  Grid3X3,
  Info,
  Check,
  Filter,
  Database,
  MessageSquare,
  Sparkles,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileLanguageSelector } from "@/components/ui/mobile-language-selector";
import { CartButton } from "@/features/cart";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import { useTranslation, TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AgeGroup, buildProductsUrl } from "@/lib/utils/product-filters-url";

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

  return t(`${categoryId}Category`, categoryId);
};

const navigation: {
  name: TranslationKey | string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { name: "Jucării", href: "/products", icon: Boxes },
  { name: "categories", href: "/categories", icon: Grid3X3 },
  { name: "about", href: "/about", icon: Info },
  { name: "contact", href: "/contact", icon: MessageSquare },
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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, setLanguage } = useTranslation();
  const { data: session, status } = useOptimizedSession();

  const activeFilters = useMemo(
    () => ({
      ageGroup: searchParams.get("ageGroup") ?? "",
      category: searchParams.get("category")?.split(",") ?? [],
      specialCategories:
        searchParams.get("specialCategories")?.split(",") ?? [],
      hasActiveFilters: !!searchParams.toString(),
    }),
    [searchParams]
  );

  const isAuthenticated =
    status === "authenticated" && !!session?.user && !session.user.error;
  const isAdmin =
    isAuthenticated &&
    (session?.user?.role === "ADMIN" || session?.user?.role === "VISITOR");
  const isSupplier =
    isAuthenticated &&
    (session?.user?.role === "SUPPLIER" || session?.user?.role === "VISITOR");
  const isLoading = status === "loading";

  const shouldShowAuthenticatedUI = isAuthenticated && !isLoading;
  const selectedFilterCount =
    activeFilters.category.length +
    (activeFilters.ageGroup ? 1 : 0) +
    activeFilters.specialCategories.length;

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlistCount();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      try {
        const previous = document.body.style.overflow;
        document.body.setAttribute("data-prev-overflow", previous ?? "");
        document.body.style.overflow = "hidden";
      } catch {}
    } else {
      try {
        const previous = document.body.getAttribute("data-prev-overflow") ?? "";
        document.body.style.overflow = previous;
        document.body.removeAttribute("data-prev-overflow");
      } catch {}
    }

    return () => {
      try {
        const previous = document.body.getAttribute("data-prev-overflow") ?? "";
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

  const toggleMobileLanguage = () => {
    const nextLanguage = language === "ro" ? "en" : "ro";
    setLanguage(nextLanguage);
    router.refresh();
  };

  const loadCategories = async () => {
    if (categoriesLoaded) return;

    const CACHE_KEY = "menu_categories_cache";
    const CACHE_TTL = 1000 * 60 * 60;

    try {
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

      const res = await fetch("/api/categories", {
        headers: { "Cache-Control": "no-store" },
      });

      if (res.ok) {
        const data: Array<{ slug: string; name: string }> = await res.json();
        const mapped = data.map(c => ({ id: c.slug, label: c.name }));

        setCategories(mapped);
        setCategoriesLoaded(true);

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
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
            setCategoriesLoaded(true);
          }
        }
      } catch {
        // Silent fallback
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="hidden bg-[#0b1220] text-white md:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-[11px] font-medium tracking-wide sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-sky-300" aria-hidden />
            Selecție atentă de jucării STEM pentru minți curioase
          </span>
          <span className="inline-flex items-center gap-2 text-white/80">
            <Truck className="h-3.5 w-3.5 text-sky-300" aria-hidden />
            Livrare rapidă în România
          </span>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16 lg:h-[72px]">
          {/* Logo */}
          <Link
            href="/"
            className="flex flex-shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4"
          >
            <div className="relative h-9 w-9 sm:h-10 sm:w-10">
              <Image
                className="object-contain"
                src="/TechTots_LOGO.png"
                alt="TechTots Logo"
                fill
                sizes="40px"
                priority
              />
            </div>
            <span className="hidden flex-col sm:flex">
              <span className="text-sm font-bold leading-none tracking-[-0.025em] text-slate-950">
                TechTots
              </span>
              <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-blue-600">
                STEM • Play • Discover
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 p-1 lg:flex"
            aria-label="Main navigation"
          >
            {navigation.map(item => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-white text-slate-950 shadow-[0_3px_12px_-6px_rgba(15,23,42,0.3)]"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                  )}
                >
                  {t(item.name)}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center gap-2.5 xl:gap-3">
            {/* Language switcher - subtle */}
            <div className="flex items-center">
              <LanguageSwitcher />
            </div>

            {/* Admin badge */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>{t("admin")}</span>
              </Link>
            )}

            {/* Supplier badge */}
            {isSupplier && (
              <Link
                href="/supplier/dashboard"
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>{t("supplier")}</span>
              </Link>
            )}

            {/* User icon */}
            <Link
              href={shouldShowAuthenticatedUI ? "/account" : "/auth/login"}
              aria-label={shouldShowAuthenticatedUI ? t("account") : t("login")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-sm"
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Cart icon */}
            <div className="relative flex items-center justify-center">
              <CartButton
                variant="header"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-[#0b1220] p-0 text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"
              />
            </div>
          </div>

          {/* Mobile right side */}
          <div className="flex lg:hidden items-center gap-1.5">
            {/* Cart icon mobile */}
            <CartButton
              variant="header"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[#0b1220] p-0 text-white shadow-sm transition-colors duration-200 hover:bg-blue-600"
            />

            <button
              type="button"
              onClick={toggleMobileLanguage}
              aria-label={
                language === "ro"
                  ? "Switch language to English"
                  : "Comută limba în română"
              }
              title={
                language === "ro" ? "Switch to English" : "Comută în română"
              }
              className="group relative inline-flex h-9 min-w-[44px] items-center justify-center overflow-hidden rounded-full border border-slate-200/90 bg-white px-1.5 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_14px_30px_-18px_rgba(14,165,233,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(255,255,255,0.45)_45%,transparent_70%)] opacity-80" />
              <span className="relative flex items-center gap-1.5">
                <LanguageFlag language={language} />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  {language === "ro" ? "RO" : "EN"}
                </span>
              </span>
            </button>

            {/* Hamburger */}
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors duration-200 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open main menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isClient &&
        mobileMenuOpen &&
        createPortal(
          <div className="lg:hidden fixed inset-0 z-[9999] animate-fadeIn">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-[3px] z-[9999] transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar */}
            <div
              className="mobile-sidebar-panel fixed top-0 right-0 bottom-0 w-[86vw] xs:w-[80vw] sm:w-[68vw] md:w-[56vw] max-w-[380px]
              bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_36%,#f8fafc_100%)]
              text-slate-900
              border-l border-slate-200/90
              shadow-[-18px_0_45px_rgba(15,23,42,0.14)]
              flex flex-col z-[10000] pointer-events-auto
              animate-slideInRight
              overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_left_22%,rgba(16,185,129,0.08),transparent_26%)]" />

              {/* Drawer header */}
              <div className="relative z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/88 px-4 py-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_30px_-22px_rgba(15,23,42,0.28)]">
                    <Image
                      className="object-contain p-2"
                      src="/TechTots_LOGO.png"
                      alt="TechTots Logo"
                      fill
                      sizes="44px"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      TechTots
                    </p>
                    <h2 className="text-base font-semibold text-slate-900">
                      {t("menu", "Meniu")}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t(
                        "mobileMenuSubtitle",
                        "Navigație rapidă pentru cumpărături"
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="mobile-sidebar-scroll mobile-sidebar-body relative z-0 min-h-0 flex-1 overflow-y-auto px-4 pt-4">
                  <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#0f766e_0%,#0284c7_55%,#2563eb_100%)] p-4 text-white shadow-[0_26px_50px_-30px_rgba(14,116,144,0.55)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
                      {t("products", "Produse")}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold leading-tight">
                      {t("mobileMenuHeroTitle", "Explorează colecția STEM")}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-sky-50/90">
                      {t(
                        "mobileMenuHeroDescription",
                        "Jucării educaționale, selecții pe vârstă și idei de cadouri într-un singur loc."
                      )}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-white/80">
                      <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                        {t("premiumBrands", "Branduri premium")}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                        {t("heroTrust2", "Livrare 1–4 zile lucrătoare")}
                      </span>
                    </div>
                    <Link
                      href="/products"
                      className="mt-4 flex items-center justify-between rounded-[1.15rem] bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{t("allProducts", "Toate produsele")}</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
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
                        >
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </span>
                    </Link>
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t("shop", "Cumpărături")}
                    </div>

                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between rounded-[1.35rem] border px-4 py-3 text-left shadow-[0_16px_32px_-28px_rgba(15,23,42,0.35)] transition",
                        activeFilters.hasActiveFilters
                          ? "border-sky-200 bg-sky-50/90"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      )}
                      aria-expanded={productsMenuOpen}
                      aria-controls="mobile-products-section"
                      onClick={() => setProductsMenuOpen(prev => !prev)}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-2xl",
                            activeFilters.hasActiveFilters
                              ? "bg-sky-100 text-sky-700"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {activeFilters.hasActiveFilters ? (
                            <Filter className="h-4 w-4" />
                          ) : (
                            <Boxes className="h-4 w-4" />
                          )}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">
                            {t("products", "Produse")}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {activeFilters.hasActiveFilters
                              ? t(
                                  "activeFiltersLabel",
                                  "Filtre active pentru browsing rapid"
                                )
                              : t(
                                  "browseProductsLabel",
                                  "Descoperă colecții, vârste și categorii"
                                )}
                          </span>
                        </span>
                      </span>

                      <span className="flex items-center gap-2">
                        {activeFilters.hasActiveFilters && (
                          <span className="rounded-full bg-sky-600 px-2 py-1 text-[11px] font-semibold text-white">
                            {selectedFilterCount}
                          </span>
                        )}
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition",
                            productsMenuOpen ? "rotate-180" : ""
                          )}
                        >
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
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </span>
                      </span>
                    </button>

                    {productsMenuOpen && (
                      <div
                        id="mobile-products-section"
                        className="mt-3 space-y-3 rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-3"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-[1rem] border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/60"
                          onClick={() => {
                            router.push(buildProductsUrl({}));
                            setMobileMenuOpen(false);
                          }}
                        >
                          <span>{t("allProducts", "Toate produsele")}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                            {t("all", "Toate")}
                          </span>
                        </button>

                        <div className="rounded-[1rem] border border-slate-200 bg-white">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-3 text-sm font-semibold text-slate-900"
                            aria-expanded={ageOpen}
                            aria-controls="mobile-age-subsection"
                            onClick={() => setAgeOpen(prev => !prev)}
                          >
                            <span>{t("age", "Vârstă")}</span>
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition",
                                ageOpen ? "rotate-180" : ""
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="13"
                                height="13"
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
                          {ageOpen && (
                            <div
                              id="mobile-age-subsection"
                              className="space-y-1 border-t border-slate-100 px-2 pb-2 pt-1"
                            >
                              {[
                                {
                                  id: "TODDLERS_1_3",
                                  label: t("age0to3", "0–3 ani"),
                                  color: "bg-amber-400",
                                },
                                {
                                  id: "PRESCHOOL_3_5",
                                  label: t("age3to5", "4–6 ani"),
                                  color: "bg-emerald-400",
                                },
                                {
                                  id: "ELEMENTARY_6_8",
                                  label: t("age6to8", "7–9 ani"),
                                  color: "bg-sky-400",
                                },
                                {
                                  id: "MIDDLE_SCHOOL_9_12",
                                  label: t("age9to12", "10–12 ani"),
                                  color: "bg-violet-400",
                                },
                                {
                                  id: "TEENS_13_PLUS",
                                  label: t("age13plus", "13+ ani"),
                                  color: "bg-rose-400",
                                },
                              ].map(opt => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  className={cn(
                                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                                    activeFilters.ageGroup === opt.id
                                      ? "bg-sky-50 text-sky-900"
                                      : "text-slate-700 hover:bg-slate-50"
                                  )}
                                  onClick={() => {
                                    router.push(
                                      buildProductsUrl({
                                        ageGroup: opt.id as AgeGroup,
                                      })
                                    );
                                    setMobileMenuOpen(false);
                                  }}
                                >
                                  <span
                                    className={cn(
                                      "h-2.5 w-2.5 rounded-full",
                                      opt.color
                                    )}
                                  />
                                  <span className="font-medium">
                                    {opt.label}
                                  </span>
                                  {activeFilters.ageGroup === opt.id && (
                                    <Check className="ml-auto h-4 w-4 text-sky-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-[1rem] border border-slate-200 bg-white">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-3 text-sm font-semibold text-slate-900"
                            aria-expanded={categoryOpen}
                            aria-controls="mobile-category-subsection"
                            onClick={async () => {
                              const next = !categoryOpen;
                              setCategoryOpen(next);
                              if (next) {
                                await loadCategories();
                              }
                            }}
                          >
                            <span>{t("categories", "Categorii")}</span>
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition",
                                categoryOpen ? "rotate-180" : ""
                              )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="13"
                                height="13"
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
                          {categoryOpen && (
                            <div
                              id="mobile-category-subsection"
                              className="space-y-1 border-t border-slate-100 px-2 pb-2 pt-1"
                            >
                              {categories.map(cat => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  className={cn(
                                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                                    activeFilters.category.includes(cat.id)
                                      ? "bg-sky-50 text-sky-900"
                                      : "text-slate-700 hover:bg-slate-50"
                                  )}
                                  onClick={() => {
                                    router.push(
                                      buildProductsUrl({ category: cat.id })
                                    );
                                    setMobileMenuOpen(false);
                                  }}
                                >
                                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                                  <span className="font-medium">
                                    {getCategoryTranslation(cat.id, t)}
                                  </span>
                                  {activeFilters.category.includes(cat.id) && (
                                    <Check className="ml-auto h-4 w-4 text-sky-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between rounded-[1rem] border px-3 py-3 text-sm font-medium transition",
                            activeFilters.specialCategories.includes(
                              "GIFT_IDEAS"
                            )
                              ? "border-rose-200 bg-rose-50 text-rose-900"
                              : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50/60"
                          )}
                          onClick={() => {
                            router.push(
                              buildProductsUrl({
                                specialCategories: "GIFT_IDEAS",
                              })
                            );
                            setMobileMenuOpen(false);
                          }}
                        >
                          <span>{t("giftIdeas", "Idei de cadouri")}</span>
                          {activeFilters.specialCategories.includes(
                            "GIFT_IDEAS"
                          ) ? (
                            <Check className="h-4 w-4 text-rose-600" />
                          ) : (
                            <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700">
                              {t("gift", "Cadou")}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t("discover", "Explorează")}
                    </div>
                    <div className="space-y-2">
                      {navigation.map(item => {
                        const IconComponent = item.icon;
                        const isActive =
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.32)] transition",
                              isActive
                                ? "border-sky-200 bg-sky-50"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-2xl",
                                isActive
                                  ? "bg-sky-100 text-sky-700"
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              <IconComponent className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm font-semibold text-slate-900">
                                {t(item.name)}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {isActive
                                  ? t("currentPage", "Pagina curentă")
                                  : t("openSection", "Deschide secțiunea")}
                              </span>
                            </span>
                            <span className="text-slate-400">
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
                              >
                                <path d="m9 18 6-6-6-6"></path>
                              </svg>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {(isAdmin ||
                    isSupplier ||
                    session?.user?.role === "VISITOR" ||
                    session?.user?.role === "ADMIN") && (
                    <div className="mt-6">
                      <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {t("quickAccess", "Acces rapid")}
                      </div>
                      <div className="space-y-2">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 rounded-[1.2rem] border border-violet-200 bg-violet-50 px-4 py-3 text-violet-900 shadow-[0_16px_32px_-28px_rgba(109,40,217,0.28)] transition hover:bg-violet-100/80"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-violet-700">
                              <Settings className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm font-semibold">
                                {t("admin")}
                              </span>
                              <span className="block text-xs text-violet-700/75">
                                {t(
                                  "adminShortcutLabel",
                                  "Administrare și operațiuni"
                                )}
                              </span>
                            </span>
                            <span className="text-violet-500">
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
                              >
                                <path d="m9 18 6-6-6-6"></path>
                              </svg>
                            </span>
                          </Link>
                        )}

                        {(session?.user?.role === "VISITOR" ||
                          session?.user?.role === "ADMIN") && (
                          <Link
                            href="/database-showcase"
                            className="flex items-center gap-3 rounded-[1.2rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 shadow-[0_16px_32px_-28px_rgba(2,132,199,0.28)] transition hover:bg-sky-100/80"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-sky-700">
                              <Database className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm font-semibold">
                                Database Schema
                              </span>
                              <span className="block text-xs text-sky-700/75">
                                {t(
                                  "databaseShortcutLabel",
                                  "Arhitectura și structura datelor"
                                )}
                              </span>
                            </span>
                            <span className="text-sky-500">
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
                              >
                                <path d="m9 18 6-6-6-6"></path>
                              </svg>
                            </span>
                          </Link>
                        )}

                        {isSupplier && (
                          <Link
                            href="/supplier/dashboard"
                            className="flex items-center gap-3 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-[0_16px_32px_-28px_rgba(5,150,105,0.28)] transition hover:bg-emerald-100/80"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-emerald-700">
                              <Building2 className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm font-semibold">
                                {t("supplier")}
                              </span>
                              <span className="block text-xs text-emerald-700/75">
                                {t(
                                  "supplierShortcutLabel",
                                  "Portal furnizori și comenzi"
                                )}
                              </span>
                            </span>
                            <span className="text-emerald-500">
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
                              >
                                <path d="m9 18 6-6-6-6"></path>
                              </svg>
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.32)]">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t("preferences", "Preferințe")}
                    </div>
                    <MobileLanguageSelector />
                  </div>
                </div>

                <div className="mobile-sidebar-footer relative z-10 border-t border-slate-200/80 bg-white/92 px-4 pt-4 backdrop-blur-md">
                  <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.32)]">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t("account", "Cont")}
                    </div>

                    <div className="space-y-2">
                      {shouldShowAuthenticatedUI ? (
                        <>
                          <Link
                            href="/account"
                            className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600">
                              <User className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block font-semibold">
                                {t("account")}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {t(
                                  "accountOverviewLabel",
                                  "Comenzi, profil și preferințe"
                                )}
                              </span>
                            </span>
                            <span className="text-slate-400">
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
                              >
                                <path d="m9 18 6-6-6-6"></path>
                              </svg>
                            </span>
                          </Link>

                          <Link
                            href="/account/wishlist"
                            className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-rose-500">
                              <Heart className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block font-semibold">
                                {t("wishlist", "Favorite")}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {wishlistCount > 0
                                  ? `${wishlistCount} ${t("savedItems", "produse salvate")}`
                                  : t(
                                      "wishlistEmptyState",
                                      "Salvează produse pentru mai târziu"
                                    )}
                              </span>
                            </span>
                            <span className="text-slate-400">
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
                              >
                                <path d="m9 18 6-6-6-6"></path>
                              </svg>
                            </span>
                          </Link>

                          <button
                            onClick={() => {
                              handleSignOut();
                              setMobileMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-3 text-left text-sm text-rose-900 transition hover:bg-rose-100/80"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-rose-500">
                              <LogOut className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block font-semibold">
                                {t("logout")}
                              </span>
                              <span className="block text-xs text-rose-700/75">
                                {t("logoutLabel", "Ieși din contul curent")}
                              </span>
                            </span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/auth/login"
                            className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600">
                              <LogIn className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block font-semibold">
                                {t("login", "Autentificare")}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {t(
                                  "loginShortcutLabel",
                                  "Intră în cont pentru comenzi și favorite"
                                )}
                              </span>
                            </span>
                            <span className="text-slate-400">
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
                              >
                                <path d="m9 18 6-6-6-6"></path>
                              </svg>
                            </span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              handleWishlistClick();
                              setMobileMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-3 py-3 text-left text-sm text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-rose-500">
                              <Heart className="h-4 w-4" />
                            </span>
                            <span className="flex-1">
                              <span className="block font-semibold">
                                {t("wishlist", "Favorite")}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {t(
                                  "wishlistGuestLabel",
                                  "Păstrează produsele preferate aproape"
                                )}
                              </span>
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}

function LanguageFlag({ language }: { language: string }) {
  if (language === "ro") {
    return (
      <span className="relative block h-4 w-6 overflow-hidden rounded-[0.4rem] ring-1 ring-black/10 shadow-sm">
        <span className="absolute inset-y-0 left-0 w-1/3 bg-[#002B7F]" />
        <span className="absolute inset-y-0 left-1/3 w-1/3 bg-[#FCD116]" />
        <span className="absolute inset-y-0 right-0 w-1/3 bg-[#CE1126]" />
      </span>
    );
  }

  return (
    <span className="relative flex h-4 w-6 items-center justify-center overflow-hidden rounded-[0.4rem] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] text-[8px] font-black tracking-[0.16em] text-white ring-1 ring-black/10 shadow-sm">
      EN
    </span>
  );
}
