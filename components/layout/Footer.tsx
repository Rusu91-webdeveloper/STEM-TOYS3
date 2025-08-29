"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram } from "lucide-react";
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

export default function Footer() {
  const { t } = useTranslation();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    null
  );

  useEffect(() => {
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
  }, []);

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
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Sitewide policy note */}
        <div className="mb-6 rounded-md bg-gray-800 text-gray-200 text-sm px-4 py-2 flex items-center justify-center text-center">
          <span>
            {getReturnPolicyText()} ·{" "}
            <Link href="/returns" className="underline">
              {t("seeReturnPolicy", "See return policy")}
            </Link>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="relative h-14 w-36">
                <Image
                  src="/TechTots_LOGO.png"
                  alt={`${storeName} Logo`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <p className="text-gray-300 mb-6 text-sm leading-relaxed max-w-md">
              {storeDescription}
            </p>

            <div className="flex space-x-6">
              <Link
                href="https://www.facebook.com/share/1CBSNUzMGA/?mibextid=wwXIfr"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-800 hover:bg-blue-600 p-3 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <svg
                  className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors"
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
                className="group bg-gray-800 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 p-3 rounded-full transition-all duration-300 transform hover:scale-110"
              >
                <Instagram
                  className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-2">
              {t("explore")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  {t("products")}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  {t("categories")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  {t("blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/supplier"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  {t("become_supplier")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white border-b border-gray-700 pb-2">
              {t("support")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  {t("returns")}
                </Link>
              </li>
              <li>
                <Link
                  href="/warranty"
                  className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group"
                >
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  {t("warrantyLink")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm font-medium">
            © 2025 {storeName} {t("allRightsReserved")}
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-6 mt-4 md:mt-0">
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white text-sm transition-all duration-200 hover:underline underline-offset-4 font-medium"
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white text-sm transition-all duration-200 hover:underline underline-offset-4 font-medium"
            >
              {t("termsOfService")}
            </Link>
            <Link
              href="/gdpr"
              className="text-gray-400 hover:text-white text-sm transition-all duration-200 hover:underline underline-offset-4 font-medium"
            >
              GDPR
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
