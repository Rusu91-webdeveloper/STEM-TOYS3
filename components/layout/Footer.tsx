"use client";

import { Instagram } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import NewsletterSignup from "@/components/NewsletterSignup";
import { useTranslation } from "@/lib/i18n";

interface StoreSettings {
  storeName: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  returnThreshold: string;
}

export default function Footer({
  initialStoreSettings,
}: {
  initialStoreSettings?: StoreSettings | null;
}) {
  const { t } = useTranslation();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    initialStoreSettings ?? null
  );

  useEffect(() => {
    if (storeSettings) return; // Already have settings from SSR

    async function fetchStoreSettings() {
      try {
        const response = await fetch("/api/store-settings");
        if (response.ok) {
          const settings = await response.json();
          setStoreSettings(settings);
        }
      } catch (error) {
        console.error("Error fetching store settings:", error);
      }
    }

    fetchStoreSettings();
  }, [storeSettings]);

  const storeName = storeSettings?.storeName || "TechTots";
  const storeDescription =
    storeSettings?.storeDescription || t("companyDescription");

  // Format the return threshold for display
  const formatReturnThreshold = (threshold: string) => {
    const amount = parseFloat(threshold);
    if (isNaN(amount)) return "€50 / 250 lei";

    // The database value is in lei, convert to euros for display (assuming 1 EUR = 5 RON)
    const leiAmount = amount; // This is already in lei from the database
    const eurAmount = Math.round(leiAmount / 5); // Convert lei to euros

    return `€${eurAmount} / ${leiAmount} lei`;
  };

  const returnThreshold = storeSettings?.returnThreshold
    ? formatReturnThreshold(storeSettings.returnThreshold)
    : "€50 / 250 lei";

  // Helper function to interpolate threshold into translation
  const getReturnPolicyText = () => {
    const baseText = t(
      "freeReturnsOver50",
      "Free returns on orders over {threshold}"
    );
    return baseText.replace("{threshold}", returnThreshold);
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter always visible at top */}
      <NewsletterSignup />

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 lg:py-10">
        {/* Sitewide policy note */}
        <div className="mb-3 sm:mb-4 md:mb-6 rounded-md bg-gray-800 text-gray-200 text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center justify-center text-center">
          <span>
            {getReturnPolicyText()} ·{" "}
            <Link href="/returns" className="underline">
              {t("seeReturnPolicy", "See return policy")}
            </Link>
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="col-span-3 sm:col-span-3 md:col-span-2">
            <div className="flex items-center mb-3 sm:mb-4 md:mb-6">
              <div className="relative h-10 sm:h-12 md:h-14 w-24 sm:w-28 md:w-36">
                <Image
                  src="/TechTots_LOGO.png"
                  alt={`${storeName} Logo`}
                  fill
                  sizes="(max-width: 640px) 6rem, (max-width: 768px) 7rem, (max-width: 1024px) 9rem, 9rem"
                  className="object-contain"
                  priority={false}
                />
              </div>
            </div>

            <p className="text-gray-300 mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm leading-relaxed max-w-md">
              {storeDescription}
            </p>

            <div className="flex space-x-3 sm:space-x-4 md:space-x-6">
              <Link
                href="https://www.facebook.com/share/1CBSNUzMGA/?mibextid=wwXIfr"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-800 hover:bg-blue-600 p-2 sm:p-3 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
              <Link
                href="https://www.instagram.com/techtots_magazin/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-800 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 p-2 sm:p-3 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <Instagram
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-white transition-colors"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="https://x.com/RusuEmanue41893"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-800 hover:bg-black p-2 sm:p-3 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link
                href="https://www.tiktok.com/@techtots1"
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-800 hover:bg-black p-2 sm:p-3 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </Link>
              <Link
                href="https://www.linkedin.com/in/techtots-romania-b28541388"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-800 hover:bg-blue-700 p-2 sm:p-3 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
              <Link
                href="https://www.youtube.com/@TechTots_Romania"
                aria-label="YouTube"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-800 hover:bg-red-600 p-2 sm:p-3 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:text-white transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Shop & Explore */}
          <div>
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-3 md:mb-4 text-white border-b border-gray-700 pb-1">
              {t("explore")}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("products")}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("categories")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div>
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-3 md:mb-4 text-white border-b border-gray-700 pb-1">
              {t("support")}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("returns")}
                </Link>
              </li>
              <li>
                <Link
                  href="/warranty"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("warrantyLink")}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                  data-conversion="cta"
                  data-conversion-type="click"
                  data-conversion-category="footer"
                  data-conversion-action="footer_link_click"
                  data-conversion-element="footer_faq"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Suppliers & Resources */}
          <div>
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-3 md:mb-4 text-white border-b border-gray-700 pb-1">
              {t("suppliers")}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/supplier"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("become_supplier")}
                </Link>
              </li>
              <li>
                <Link
                  href="/supplier/requirements"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  {t("supplierRequirements")}
                </Link>
              </li>
              <li>
                <Link
                  href="/ghid-jucarii-stem-2025"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                  data-conversion="cta"
                  data-conversion-type="click"
                  data-conversion-category="footer"
                  data-conversion-action="footer_link_click"
                  data-conversion-element="footer_ghid_2025"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  Ghid 2025
                </Link>
              </li>
              <li>
                <Link
                  href="/jucarii-stem-dupa-varsta"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group text-xs sm:text-sm"
                  data-conversion="cta"
                  data-conversion-type="click"
                  data-conversion-category="footer"
                  data-conversion-action="footer_link_click"
                  data-conversion-element="footer_dupa_varsta"
                >
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full mr-1.5 sm:mr-2 group-hover:bg-white transition-colors"></span>
                  După vârstă
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-700 mt-6 sm:mt-8 md:mt-12 pt-4 sm:pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-xs sm:text-sm font-medium">
            © 2025 {storeName} {t("allRightsReserved")}
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-3 sm:gap-4 md:gap-6 mt-3 sm:mt-4 md:mt-0">
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white text-xs sm:text-sm transition-all duration-200 hover:underline underline-offset-4 font-medium"
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white text-xs sm:text-sm transition-all duration-200 hover:underline underline-offset-4 font-medium"
            >
              {t("termsOfService")}
            </Link>
            <Link
              href="/gdpr"
              className="text-gray-400 hover:text-white text-xs sm:text-sm transition-all duration-200 hover:underline underline-offset-4 font-medium"
            >
              GDPR
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
