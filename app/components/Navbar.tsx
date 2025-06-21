"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MiniCart } from "../../features/cart/components/MiniCart";
import { I18nContextType } from "@/lib/i18n";

const vibrantColors = {
  primary: "#007BFF", // Electric Blue
  secondary: "#FF6B35", // Bright Orange
  accent: "#32CD32", // Lime Green
};

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrency] = useState("EUR");
  const [cartItemsCount, setCartItemsCount] = useState(0);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    // Simulate cart items count - replace with actual cart logic later
    setCartItemsCount(3);

    // Close menus when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setIsLangMenuOpen(false);
      }
      if (
        currencyMenuRef.current &&
        !currencyMenuRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang: string) => {
    const currentPath = pathname;
    // Remove existing locale prefix if present
    const newPath = currentPath.startsWith(`/${i18n.language}`)
      ? currentPath.substring(i18n.language.length + 1)
      : currentPath;
    router.push(`/${lang}${newPath}`);
    setIsLangMenuOpen(false);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    setIsCurrencyMenuOpen(false);
    // Here you would also update your app's global currency state/context
  };

  const navLinks = [
    { href: "/", labelKey: "navbar.home" },
    { href: "/products", labelKey: "navbar.products" },
    { href: "/categories", labelKey: "navbar.categories" },
    { href: "/blog", labelKey: "navbar.blog" },
  ];

  if (!isClient) {
    // Basic non-interactive navbar for SSR or pre-hydration
    return (
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link href="/">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  NextCommerce
                </span>
              </Link>
            </div>
            {/* Placeholder for links and language switcher */}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link href={`/${i18n.language}`}>
                <span className="text-2xl font-bold bg-gradient-to-r from-[vibrantColors.primary] to-[vibrantColors.secondary] bg-clip-text text-transparent hover:from-[vibrantColors.primary] hover:to-[vibrantColors.secondary] transition-all">
                  {t("navbar.brandName", "NextCommerce")}
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.labelKey}
                  href={`/${i18n.language}${link.href === "/" ? "" : link.href}`}>
                  <span
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      pathname === `/${i18n.language}${link.href}` ||
                      (link.href === "/" && pathname === `/${i18n.language}`)
                        ? "bg-gradient-to-r from-[vibrantColors.primary] to-[vibrantColors.secondary] text-[vibrantColors.accent] border border-[vibrantColors.primary] shadow-sm"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-[vibrantColors.primary] hover:to-[vibrantColors.secondary] hover:text-[vibrantColors.accent] hover:border hover:border-[vibrantColors.primary] hover:shadow-sm"
                    }`}>
                    {t(link.labelKey, link.labelKey.split(".")[1])}
                  </span>
                </Link>
              ))}

              {/* Button Group - Desktop */}
              <div className="flex items-center space-x-3 border-l ml-2 pl-4">
                {/* Language Switcher - Desktop */}
                <div
                  className="relative"
                  ref={langMenuRef}>
                  <button
                    onClick={() => {
                      setIsLangMenuOpen(!isLangMenuOpen);
                      setIsCurrencyMenuOpen(false);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-[vibrantColors.primary] to-[vibrantColors.secondary] text-[vibrantColors.accent] hover:from-[vibrantColors.secondary] hover:to-[vibrantColors.primary] border border-[vibrantColors.primary] shadow-sm transition-all"
                    aria-expanded={isLangMenuOpen}
                    aria-haspopup="true">
                    <Image
                      src={`/images/flags/${i18n.language}.svg`}
                      alt={i18n.language === "en" ? "English" : "Română"}
                      width={18}
                      height={18}
                      className="rounded-sm"
                    />
                    <span className="sr-only md:not-sr-only">
                      {i18n.language === "en" ? "EN" : "RO"}
                    </span>
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isLangMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {isLangMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5 animate-fadeIn border border-[vibrantColors.primary]">
                      <button
                        onClick={() => handleLanguageChange("en")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          i18n.language === "en"
                            ? "bg-gradient-to-r from-[vibrantColors.primary] to-[vibrantColors.secondary] text-[vibrantColors.accent]"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-[vibrantColors.primary] hover:to-[vibrantColors.secondary] hover:text-[vibrantColors.accent]"
                        } flex items-center transition-colors`}>
                        <Image
                          src="/images/flags/en.svg"
                          alt="English"
                          width={16}
                          height={16}
                          className="mr-2 rounded-sm"
                        />
                        English
                      </button>
                      <button
                        onClick={() => handleLanguageChange("ro")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          i18n.language === "ro"
                            ? "bg-gradient-to-r from-[vibrantColors.primary] to-[vibrantColors.secondary] text-[vibrantColors.accent]"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-[vibrantColors.primary] hover:to-[vibrantColors.secondary] hover:text-[vibrantColors.accent]"
                        } flex items-center transition-colors`}>
                        <Image
                          src="/images/flags/ro.svg"
                          alt="Română"
                          width={16}
                          height={16}
                          className="mr-2 rounded-sm"
                        />
                        Română
                      </button>
                    </div>
                  )}
                </div>

                {/* Currency Selector - Desktop */}
                <div
                  className="relative"
                  ref={currencyMenuRef}>
                  <button
                    onClick={() => {
                      setIsCurrencyMenuOpen(!isCurrencyMenuOpen);
                      setIsLangMenuOpen(false);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 shadow-sm transition-all"
                    aria-expanded={isCurrencyMenuOpen}
                    aria-haspopup="true">
                    {currency === "EUR"
                      ? "€"
                      : currency === "USD"
                        ? "$"
                        : "Lei"}
                    <span className="sr-only md:not-sr-only">{currency}</span>
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isCurrencyMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  {isCurrencyMenuOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5 animate-fadeIn border border-indigo-100">
                      <button
                        onClick={() => handleCurrencyChange("EUR")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          currency === "EUR"
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700"
                        } transition-colors`}>
                        EUR (€)
                      </button>
                      <button
                        onClick={() => handleCurrencyChange("USD")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          currency === "USD"
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700"
                        } transition-colors`}>
                        USD ($)
                      </button>
                      <button
                        onClick={() => handleCurrencyChange("RON")}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          currency === "RON"
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700"
                        } transition-colors`}>
                        RON (Lei)
                      </button>
                    </div>
                  )}
                </div>

                {/* Cart Button - Desktop */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white hover:from-indigo-700 hover:to-purple-800 shadow-md transition-all relative"
                  aria-label="View shopping cart">
                  <svg
                    className="w-5 h-5 text-white mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  {t("navbar.cart", "Cart")}
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-indigo-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform transition-all border border-indigo-200 shadow-sm">
                      {cartItemsCount}
                    </span>
                  )}
                </button>

                {/* Sign In/Account Link */}
                <Link href={`/${i18n.language}/auth/signin`}>
                  <span className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 shadow-sm transition-all">
                    <svg
                      className="w-5 h-5 mr-1.5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    {t("navbar.signIn", "Sign In")}
                  </span>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              {/* Cart Button - Mobile */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 rounded-md bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white hover:from-indigo-700 hover:to-purple-800 shadow-md transition-all relative"
                aria-label="View shopping cart">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-indigo-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transform transition-all border border-indigo-200 shadow-sm">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsLangMenuOpen(!isLangMenuOpen);
                  setIsCurrencyMenuOpen(false);
                }}
                className="inline-flex items-center justify-center p-2 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 shadow-sm transition-all"
                aria-expanded={isLangMenuOpen}>
                <span className="sr-only">Open main menu</span>
                {isLangMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu, show/hide based on menu state. */}
        {isLangMenuOpen && (
          <div
            className="md:hidden animate-fadeIn"
            id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-t border-indigo-100">
              {navLinks.map((link) => (
                <Link
                  key={link.labelKey}
                  href={`/${i18n.language}${
                    link.href === "/" ? "" : link.href
                  }`}>
                  <span
                    onClick={() => setIsLangMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-all ${
                      pathname === `/${i18n.language}${link.href}` ||
                      (link.href === "/" && pathname === `/${i18n.language}`)
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-gray-700 hover:bg-white hover:text-indigo-700 hover:shadow-sm"
                    }`}>
                    {t(link.labelKey, link.labelKey.split(".")[1])}
                  </span>
                </Link>
              ))}
              <Link href={`/${i18n.language}/auth/signin`}>
                <span
                  onClick={() => setIsLangMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-white hover:text-indigo-700 hover:shadow-sm transition-all flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  {t("navbar.signIn", "Sign In")}
                </span>
              </Link>
            </div>

            {/* Language Switcher - Mobile */}
            <div className="pt-4 pb-3 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
              <div className="px-5">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {t("navbar.language", "Language")}
                </p>
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    i18n.language === "en"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-700 hover:bg-white hover:text-indigo-700 hover:shadow-sm"
                  } flex items-center transition-all`}>
                  <Image
                    src="/images/flags/en.svg"
                    alt="English"
                    width={20}
                    height={20}
                    className="mr-2 rounded-sm"
                  />
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange("ro")}
                  className={`block w-full text-left px-3 py-2 mt-1 rounded-md text-base font-medium ${
                    i18n.language === "ro"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-700 hover:bg-white hover:text-indigo-700 hover:shadow-sm"
                  } flex items-center transition-all`}>
                  <Image
                    src="/images/flags/ro.svg"
                    alt="Română"
                    width={20}
                    height={20}
                    className="mr-2 rounded-sm"
                  />
                  Română
                </button>
              </div>
            </div>

            {/* Currency Selector - Mobile */}
            <div className="pt-4 pb-3 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
              <div className="px-5">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {t("navbar.currency", "Currency")}
                </p>
                <button
                  onClick={() => handleCurrencyChange("EUR")}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    currency === "EUR"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-700 hover:bg-white hover:text-indigo-700 hover:shadow-sm"
                  } transition-all`}>
                  EUR (€)
                </button>
                <button
                  onClick={() => handleCurrencyChange("USD")}
                  className={`block w-full text-left px-3 py-2 mt-1 rounded-md text-base font-medium ${
                    currency === "USD"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-700 hover:bg-white hover:text-indigo-700 hover:shadow-sm"
                  } transition-all`}>
                  USD ($)
                </button>
                <button
                  onClick={() => handleCurrencyChange("RON")}
                  className={`block w-full text-left px-3 py-2 mt-1 rounded-md text-base font-medium ${
                    currency === "RON"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-700 hover:bg-white hover:text-indigo-700 hover:shadow-sm"
                  } transition-all`}>
                  RON (Lei)
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Cart Modal */}
      <MiniCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
};

export default Navbar;
